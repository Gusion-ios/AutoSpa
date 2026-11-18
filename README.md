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

## Backups y restauración

El servicio `backup` crea un backup PostgreSQL en formato custom al iniciar y
luego cada 24 horas. Guarda los archivos en `./backups` (excluido de Git),
verifica cada dump y conserva siete backups diarios y copias semanales durante
28 días. La copia semanal se toma los domingos en UTC.

```powershell
# Estado y registros del servicio de backups
docker compose --env-file .env.docker ps backup
docker compose --env-file .env.docker logs --tail 50 backup

# Crear/verificar el backup de hoy ahora
docker compose --env-file .env.docker exec backup /usr/local/bin/backup-once

# Restaurar de forma aislada para comprobar un backup (no modifica producción)
docker compose --env-file .env.docker exec backup /usr/local/bin/restore-backup /backups/autospa_daily_YYYY-MM-DD.dump
```

La restauración crea por defecto una base nueva `autospa_restore_<fecha>` para
revisar los datos sin sobrescribir `autospa_compose`. No borres la base original
hasta haber validado la copia restaurada. Estos backups locales todavía no
están replicados fuera del equipo; la copia hacia Azure Blob se configura en la
fase de despliegue cloud.

## Despliegue en Azure

La configuración de producción usa el perfil `production`: Caddy termina HTTPS
y reenvía `/api`, `/security` y `/health` al Gateway; el resto del tráfico va al
frontend. Los puertos del frontend y del Gateway quedan enlazados a `127.0.0.1`
en el host, y solo Caddy publica los puertos web.

En una VM Ubuntu de Azure:

1. Apunta un registro DNS A del dominio a la IP pública estática de la VM.
2. En el grupo de seguridad de red permite TCP 80 y 443; restringe SSH (22) a
   tu IP. No abras los puertos de PostgreSQL, backend, frontend ni Gateway.
3. Clona el repositorio, instala Docker Engine con el complemento Compose y
   copia `.env.production.example` a `.env.production`.
4. En `.env.production`, configura el dominio real en `PUBLIC_DOMAIN`,
   `VITE_PUBLIC_APP_URL` y `AUTOSPA_CORS_ALLOWED_ORIGINS`; usa tu correo en
   `CADDY_EMAIL` y reemplaza todos los secretos y contraseñas de ejemplo.
5. Desde la raíz del repositorio, valida y levanta la aplicación:

```bash
docker compose --env-file .env.production --profile production config --quiet
docker compose --env-file .env.production --profile production up -d --build
docker compose --env-file .env.production --profile production ps
```

Caddy necesita que el dominio resuelva a la VM y que los puertos TCP 80 y 443
sean accesibles para obtener y renovar el certificado HTTPS. Comprueba la
aplicación en `https://<tu-dominio>/` y su estado en `https://<tu-dominio>/health`.
Para replicar backups fuera de la VM, crea en Azure Storage un contenedor
privado y genera un SAS limitado a ese contenedor con permiso de escritura,
protocolo HTTPS y una expiración definida. Configura la URL del contenedor (sin
SAS) en `AZURE_BLOB_CONTAINER_URL` y el token SAS en
`AZURE_BLOB_SAS_TOKEN` dentro de `.env.production`. No los guardes en Git ni los
compartas. El servicio sube el dump y su checksum después de verificarlos; si la
copia cloud falla, conserva el dump local y reintenta en cinco minutos.

Configura también una regla de ciclo de vida de Blob para eliminar las copias
`autospa_daily_` después de siete días y las `autospa_weekly_` después de 28
días. Así la retención de Azure sigue la retención local.

Después de configurar el SAS, fuerza una copia de hoy y revisa el resultado:

```bash
docker compose --env-file .env.production --profile production exec backup /usr/local/bin/backup-once
docker compose --env-file .env.production --profile production logs --tail 30 backup
```

El log debe indicar que subió el dump y el archivo `.sha256`; comprueba ambos
objetos en el contenedor privado de Azure Blob.

Para desarrollo sin Docker, consulta `backend/README.md` y `gateway/README.md`.
