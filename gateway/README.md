# AutoSpa Gateway

Gateway FastAPI para reenviar `/api/*` al backend Spring Boot, que queda enlazado
solo a `127.0.0.1:8081`. El gateway escucha en `0.0.0.0:8080` para que los
dispositivos de la red local usen el mismo punto de entrada.

Implementa límites por IP (120 solicitudes/minuto), bloqueo de 30 minutos tras
10 infracciones en 10 minutos, bloqueo de login durante 15 minutos tras cinco
intentos fallidos en cinco minutos, tamaño máximo de cuerpo (1 MB), validación
básica de método y tipo de contenido, detección de patrones SQLi/XSS/path
traversal, cabeceras HTTP y logs JSON en consola. El modo predeterminado es
`monitor`: registra patrones y excesos de solicitudes, pero los deja pasar.
`block` aplica los rechazos. Rate limits y bloqueos se guardan en memoria y se
reinician cuando se reinicia el gateway; sirven para desarrollo en una sola
instancia, no para varias réplicas ni producción.

El circuito devuelve una respuesta de mantenimiento si el backend falla cinco
veces consecutivas y permite reintentar luego de 30 segundos. El gateway envía
`X-Gateway-Secret`; Spring Boot valida esa cabecera en todas sus rutas `/api/*`.
Configura el mismo secreto de al menos 32 caracteres en ambas terminales.

`GET /security/events` requiere un token válido y verifica en Spring Boot que
el usuario tenga rol `ADMIN_SUPREMO` o `ADMINISTRADOR`.

## Preparar en PowerShell

Desde la carpeta `gateway`:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
$env:AUTOSPA_BACKEND_URL = 'http://127.0.0.1:8081'
$secureGatewaySecret = Read-Host 'Clave interna gateway (igual a la del backend)' -AsSecureString
$env:AUTOSPA_GATEWAY_SECRET = [System.Net.NetworkCredential]::new('', $secureGatewaySecret).Password
$env:AUTOSPA_CORS_ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://192.168.1.84:5173'
$env:GATEWAY_MODE = 'monitor'
py -m uvicorn main:app --host 0.0.0.0 --port 8080 --no-server-header
```

Inicia Spring Boot en otra terminal con `SERVER_ADDRESS=127.0.0.1` y
`SERVER_PORT=8081`. Vite debe usar la URL del gateway: `http://localhost:8080/api`
en el mismo equipo o `http://<IP-DE-LA-PC>:8080/api` en el celular.

Verifica el gateway en `http://localhost:8080/health`. Para habilitar bloqueos durante una
prueba controlada, cambia `GATEWAY_MODE` a `block` y reinicia el gateway. No
pruebes el bloqueo de login con una cuenta real: el límite bloquea la IP por
15 minutos tras cinco intentos fallidos.

El puerto 8081 no debe abrirse en el firewall; PostgreSQL sigue accesible solo
desde el backend. Las reglas de detección deben seguir en `monitor` mientras se
revisan falsos positivos; el modo `block` se usa para pruebas controladas.
