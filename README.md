# AutoSpa

Sistema de gestión para AutoSpa. La versión local con Docker ejecuta el frontend
React/Vite, el Gateway FastAPI, el backend Spring Boot y PostgreSQL.

## Requisitos

- Docker Desktop iniciado y con el motor en estado `Engine running`.
- PowerShell en Windows.
- Celular y PC conectados a la misma red Wi-Fi para probar desde el celular.

## Primera configuración con Docker

Desde la raíz del proyecto:

1. Copia la plantilla: `Copy-Item .env.docker.example .env.docker`.
2. En `.env.docker`, configura `LAN_IP` con la IPv4 del adaptador Wi-Fi de la PC.
3. Sustituye las claves de ejemplo por claves aleatorias propias y establece la
   contraseña de prueba de `AUTOSPA_SUPERADMIN_PASSWORD`.
4. No compartas ni versionas `.env.docker`.
5. Valida la configuración: `docker compose --env-file .env.docker config --quiet`.
6. Construye e inicia los servicios: `docker compose --env-file .env.docker up --build`.

Abre `http://<LAN_IP>:5173` en la PC o en un celular conectado a la misma Wi-Fi.
La cuenta inicial es el correo y la contraseña configurados en
`AUTOSPA_SUPERADMIN_EMAIL` y `AUTOSPA_SUPERADMIN_PASSWORD`.

La configuración Docker usa una base vacía independiente llamada
`autospa_compose`, guardada en el volumen `autospa_compose_data`; no conecta ni
modifica la base local `autospa`.

## Operación habitual

Ejecuta estos comandos desde la raíz del proyecto:

```powershell
# Estado de los servicios
docker compose --env-file .env.docker ps

# Ver registros
docker compose --env-file .env.docker logs -f

# Reiniciar servicios sin borrar los datos
docker compose --env-file .env.docker restart

# Detener y quitar contenedores/redes, conservando la base de datos
docker compose --env-file .env.docker down

# Volver a iniciar en segundo plano
docker compose --env-file .env.docker up -d
```

No uses `docker compose down -v` salvo que quieras borrar permanentemente el
volumen y todos los datos de prueba de `autospa_compose`.

## Puertos

- `5173`: frontend (expuesto a la red local).
- `8080`: Gateway (expuesto a la red local).
- `8081`: backend, solo dentro de la red de Docker.
- `5432`: PostgreSQL, solo dentro de la red de Docker.

Para desarrollo sin Docker, consulta `backend/README.md` y `gateway/README.md`.
