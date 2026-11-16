import asyncio
import json
import logging
import os
import re
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response


UPSTREAM_URL = os.getenv("AUTOSPA_BACKEND_URL", "http://127.0.0.1:8081").rstrip("/")
GATEWAY_SECRET = os.getenv("AUTOSPA_GATEWAY_SECRET", "")
if len(GATEWAY_SECRET) < 32:
    raise RuntimeError("AUTOSPA_GATEWAY_SECRET debe tener al menos 32 caracteres y coincidir con el backend.")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "AUTOSPA_CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://192.168.1.84:5173",
    ).split(",")
    if origin.strip()
]
GATEWAY_MODE = os.getenv("GATEWAY_MODE", "monitor").strip().lower()
if GATEWAY_MODE not in {"monitor", "block"}:
    GATEWAY_MODE = "monitor"

RATE_LIMIT = int(os.getenv("GATEWAY_RATE_LIMIT_PER_MINUTE", "120"))
MAX_BODY_BYTES = 1_048_576
WINDOW_SECONDS = 60
VIOLATION_WINDOW_SECONDS = 600
VIOLATION_LIMIT = 10
IP_BAN_SECONDS = 1800
LOGIN_WINDOW_SECONDS = 300
LOGIN_ATTEMPT_LIMIT = 5
LOGIN_LOCK_SECONDS = 900
EVENTS_CAPACITY = 2000
CIRCUIT_FAILURE_LIMIT = 5
CIRCUIT_RESET_SECONDS = 30

app = FastAPI(title="AutoSpa Gateway", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

logger = logging.getLogger("autospa.gateway")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())

client = httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=3.0))
state_lock = asyncio.Lock()
request_windows: dict[str, deque[float]] = defaultdict(deque)
ip_violations: dict[str, deque[float]] = defaultdict(deque)
login_failures: dict[str, deque[float]] = defaultdict(deque)
ip_bans: dict[str, float] = {}
login_locks: dict[str, float] = {}
security_events: deque[dict] = deque(maxlen=EVENTS_CAPACITY)
circuit_lock = asyncio.Lock()
circuit_failures = 0
circuit_open_until = 0.0

HOP_BY_HOP_HEADERS = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length", "host",
}
ALLOWED_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}
JSON_METHODS = {"POST", "PUT", "PATCH"}
MALICIOUS_PATTERNS = {
    "SQLI": re.compile(r"(?:\bunion\s+select\b|\bselect\b.{0,80}\bfrom\b|\bdrop\s+table\b|(?:'|%27)\s*or\s+\d+\s*=\s*\d+)", re.I),
    "XSS": re.compile(r"(?:<\s*script\b|javascript\s*:|\bon\w+\s*=)", re.I),
    "PATH_TRAVERSAL": re.compile(r"(?:\.\./|\.\.\\|%2e%2e(?:%2f|/|%5c))", re.I),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def emit_log(event: dict) -> None:
    line = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
    logger.info(line)
    if event.get("rule_activated"):
        security_events.append(event)


def trim_window(window: deque[float], now: float, seconds: int) -> None:
    while window and now - window[0] > seconds:
        window.popleft()


async def register_violation(ip: str, now: float) -> bool:
    violations = ip_violations[ip]
    trim_window(violations, now, VIOLATION_WINDOW_SECONDS)
    violations.append(now)
    if len(violations) >= VIOLATION_LIMIT:
        ip_bans[ip] = now + IP_BAN_SECONDS
        return True
    return False


async def circuit_is_open() -> bool:
    global circuit_failures, circuit_open_until
    async with circuit_lock:
        now = time.monotonic()
        if circuit_open_until > now:
            return True
        if circuit_open_until:
            # Tras el periodo de espera se permite probar de nuevo al backend.
            circuit_open_until = 0.0
            circuit_failures = 0
        return False


async def circuit_record_failure() -> None:
    global circuit_failures, circuit_open_until
    async with circuit_lock:
        circuit_failures += 1
        if circuit_failures >= CIRCUIT_FAILURE_LIMIT:
            circuit_open_until = time.monotonic() + CIRCUIT_RESET_SECONDS


async def circuit_record_success() -> None:
    global circuit_failures, circuit_open_until
    async with circuit_lock:
        circuit_failures = 0
        circuit_open_until = 0.0


@app.on_event("shutdown")
async def close_client() -> None:
    await client.aclose()


@app.middleware("http")
async def inspect_requests(request: Request, call_next):
    started = time.perf_counter()
    ip = request.client.host if request.client else "unknown"
    path = request.url.path
    method = request.method.upper()
    is_api_request = path.startswith("/api/")
    is_rate_limited = path not in {"/health", "/api/health"} and method != "OPTIONS"
    body = b""
    request_count = 0
    activated_rule = None
    action = "forward"
    early_response: Response | None = None
    now = time.monotonic()

    if is_rate_limited:
        async with state_lock:
            ban_until = ip_bans.get(ip, 0)
            if ban_until > now:
                activated_rule = "IP_BAN"
                if GATEWAY_MODE == "block":
                    action = "blocked"
                    early_response = JSONResponse({"message": "Acceso temporalmente bloqueado."}, status_code=403)
                else:
                    action = "monitor"
            elif ban_until:
                ip_bans.pop(ip, None)

            if early_response is None:
                lock_until = login_locks.get(ip, 0)
                if path == "/api/auth/login" and lock_until > now:
                    activated_rule = "LOGIN_LOCK"
                    if GATEWAY_MODE == "block":
                        action = "blocked"
                        early_response = JSONResponse({"message": "Demasiados intentos. Intenta de nuevo más tarde."}, status_code=429)
                    else:
                        action = "monitor"
                elif lock_until:
                    login_locks.pop(ip, None)

            window = request_windows[ip]
            trim_window(window, now, WINDOW_SECONDS)
            request_count = len(window)
            window.append(now)
            request_count += 1

            if early_response is None and request_count > RATE_LIMIT:
                activated_rule = "RATE_LIMIT"
                banned = await register_violation(ip, now)
                if GATEWAY_MODE == "block":
                    action = "blocked"
                    code = 403 if banned else 429
                    message = "Acceso temporalmente bloqueado." if banned else "Límite de solicitudes excedido."
                    early_response = JSONResponse({"message": message}, status_code=code)
                else:
                    action = "monitor"

    if early_response is None and is_api_request and method != "OPTIONS":
        if method not in ALLOWED_METHODS:
            activated_rule, action = "HTTP_METHOD", "blocked"
            early_response = JSONResponse({"message": "Método HTTP no permitido."}, status_code=405)

        content_length = request.headers.get("content-length")
        if early_response is None and content_length:
            try:
                if int(content_length) > MAX_BODY_BYTES:
                    activated_rule, action = "BODY_TOO_LARGE", "blocked"
                    early_response = JSONResponse({"message": "El cuerpo supera el máximo de 1 MB."}, status_code=413)
            except ValueError:
                activated_rule, action = "INVALID_CONTENT_LENGTH", "blocked"
                early_response = JSONResponse({"message": "Longitud de contenido inválida."}, status_code=400)

        if early_response is None:
            body = await request.body()
            if len(body) > MAX_BODY_BYTES:
                activated_rule, action = "BODY_TOO_LARGE", "blocked"
                early_response = JSONResponse({"message": "El cuerpo supera el máximo de 1 MB."}, status_code=413)

        if early_response is None and body and method in JSON_METHODS:
            content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
            if content_type != "application/json" and not content_type.endswith("+json"):
                activated_rule, action = "CONTENT_TYPE", "blocked"
                early_response = JSONResponse({"message": "Envía los datos con Content-Type application/json."}, status_code=415)

        if early_response is None:
            inspection_text = f"{request.url.path}?{request.url.query}\n{body.decode('utf-8', errors='ignore')}"
            for rule_name, pattern in MALICIOUS_PATTERNS.items():
                if pattern.search(inspection_text):
                    activated_rule = rule_name
                    async with state_lock:
                        banned = await register_violation(ip, time.monotonic())
                    if GATEWAY_MODE == "block":
                        action = "blocked"
                        message = "Acceso temporalmente bloqueado." if banned else "Solicitud rechazada por una regla de seguridad."
                        early_response = JSONResponse({"message": message}, status_code=403)
                    else:
                        action = "monitor"
                    break

    response: Response
    if early_response is not None:
        response = early_response
    else:
        try:
            response = await call_next(request)
        except Exception:
            response = JSONResponse({"message": "Error interno del gateway."}, status_code=502)

    if response.headers.get("X-Gateway-Circuit") == "open":
        activated_rule, action = "CIRCUIT_BREAKER", "maintenance"
        del response.headers["X-Gateway-Circuit"]

    if is_api_request and path == "/api/auth/login" and method == "POST" and response.status_code == 401:
        async with state_lock:
            failures = login_failures[ip]
            login_now = time.monotonic()
            trim_window(failures, login_now, LOGIN_WINDOW_SECONDS)
            failures.append(login_now)
            banned = await register_violation(ip, login_now)
            if banned:
                activated_rule = "IP_BAN"
            if len(failures) >= LOGIN_ATTEMPT_LIMIT:
                login_locks[ip] = time.monotonic() + LOGIN_LOCK_SECONDS
                activated_rule = activated_rule or "LOGIN_ATTEMPTS"
                action = "monitor" if GATEWAY_MODE == "monitor" else "lock"

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    for header_name in ("Server", "X-Powered-By"):
        if header_name in response.headers:
            del response.headers[header_name]
    if request.url.scheme == "https" or request.headers.get("x-forwarded-proto", "").lower() == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    latency_ms = round((time.perf_counter() - started) * 1000, 2)
    emit_log({
        "timestamp": utc_now(),
        "ip": ip,
        "method": method,
        "path": path,
        "query_length": len(request.url.query),
        "body_length": len(body),
        "user_agent": request.headers.get("user-agent", ""),
        "status": response.status_code,
        "latency_ms": latency_ms,
        "rule_activated": activated_rule,
        "action": action,
        "user": getattr(request.state, "authenticated_user", None),
        "requests_last_minute": request_count,
    })
    return response


@app.get("/health")
async def health() -> Response:
    try:
        response = await client.get(
            f"{UPSTREAM_URL}/api/health",
            headers={"X-Gateway-Secret": GATEWAY_SECRET},
        )
        response.raise_for_status()
        await circuit_record_success()
        return JSONResponse({"status": "ok", "gateway": "ok", "backend": "ok"})
    except httpx.HTTPError:
        await circuit_record_failure()
        return JSONResponse(
            {"status": "degraded", "gateway": "ok", "backend": "unavailable"},
            status_code=503,
        )


@app.get("/security/events")
async def get_security_events(request: Request, limit: int = 100) -> Response:
    authorization = request.headers.get("authorization", "")
    if not authorization.lower().startswith("bearer "):
        return JSONResponse({"message": "Inicia sesión para consultar los eventos."}, status_code=401)
    try:
        profile_response = await client.get(
            f"{UPSTREAM_URL}/api/auth/me",
            headers={"Authorization": authorization, "X-Gateway-Secret": GATEWAY_SECRET},
        )
    except httpx.RequestError:
        return JSONResponse({"message": "No se pudo validar la sesión."}, status_code=503)
    if profile_response.status_code != 200:
        return JSONResponse({"message": "La sesión no es válida o ha expirado."}, status_code=401)
    profile = profile_response.json()
    roles = profile.get("roles", [])
    if not any(role in {"ADMIN_SUPREMO", "ADMINISTRADOR"} for role in roles):
        return JSONResponse({"message": "Se requiere un rol administrador."}, status_code=403)
    request.state.authenticated_user = profile.get("email")
    bounded_limit = max(1, min(limit, 500))
    return JSONResponse(list(security_events)[-bounded_limit:])


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_api(path: str, request: Request) -> Response:
    if await circuit_is_open():
        return JSONResponse(
            {"message": "AutoSpa está temporalmente en mantenimiento. Intenta nuevamente en unos segundos."},
            status_code=503,
            headers={"Retry-After": str(CIRCUIT_RESET_SECONDS), "X-Gateway-Circuit": "open"},
        )

    target = f"{UPSTREAM_URL}/api/{path}"
    headers = {
        name: value
        for name, value in request.headers.items()
        if name.lower() not in HOP_BY_HOP_HEADERS and name.lower() != "origin"
    }
    headers["X-Gateway-Secret"] = GATEWAY_SECRET

    try:
        upstream = await client.request(
            request.method,
            target,
            params=request.query_params,
            content=await request.body(),
            headers=headers,
        )
        if upstream.status_code >= 500:
            await circuit_record_failure()
        else:
            await circuit_record_success()
    except httpx.TimeoutException:
        await circuit_record_failure()
        return Response(
            content='{"message":"El backend tardó demasiado en responder."}',
            status_code=504,
            media_type="application/json",
        )
    except httpx.RequestError:
        await circuit_record_failure()
        return Response(
            content='{"message":"El backend no está disponible."}',
            status_code=503,
            media_type="application/json",
        )

    response_headers = {
        name: value
        for name, value in upstream.headers.items()
        if name.lower() not in HOP_BY_HOP_HEADERS | {"server", "x-powered-by"}
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
    )
