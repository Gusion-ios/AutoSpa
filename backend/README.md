# AutoSpa Backend

Backend REST para AutoSpa con Java 21, Spring Boot y PostgreSQL.

## Iniciar en PowerShell

```powershell
cd C:\Users\franc\Documents\AutoSpa-Pruebas\backend
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/autospa'
$env:SPRING_DATASOURCE_USERNAME = 'autospa_app'
$securePassword = Read-Host 'Contraseña PostgreSQL' -AsSecureString
$env:SPRING_DATASOURCE_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
$env:AUTOSPA_JWT_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$secureGatewaySecret = Read-Host 'Clave interna gateway (mínimo 32 caracteres; usa la misma en ambas terminales)' -AsSecureString
$env:AUTOSPA_GATEWAY_SECRET = [System.Net.NetworkCredential]::new('', $secureGatewaySecret).Password
$env:AUTOSPA_SUPERADMIN_EMAIL = 'tu-correo-administrador'
$adminPassword = Read-Host 'Contraseña inicial del administrador supremo (mínimo 12 caracteres)' -AsSecureString
$env:AUTOSPA_SUPERADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminPassword).Password
$env:SERVER_ADDRESS = '127.0.0.1'
$env:SERVER_PORT = '8081'
.\mvnw.cmd spring-boot:run
```

Usa el correo y una contraseña nueva para la cuenta suprema. Las claves se introducen ocultas. Estas variables duran solo mientras esa ventana de PowerShell permanezca abierta.

## Presentación en la misma Wi-Fi

En el equipo anfitrión, inicia primero este backend enlazado a `127.0.0.1:8081`; luego inicia el gateway FastAPI en el puerto `8080` usando el mismo `AUTOSPA_GATEWAY_SECRET`, y Vite desde la carpeta raíz con `npm run dev:lan`. El frontend debe llamar al gateway, no directamente a Spring Boot. Su URL está en `.env.local`: usa `http://localhost:8080/api` en el mismo equipo o `http://<IP-DE-LA-PC>:8080/api` desde el celular. El gateway configura CORS con `AUTOSPA_CORS_ALLOWED_ORIGINS`.

El otro equipo abre `http://<IP-DE-LA-PC>:5173`. Solo los puertos `5173` y `8080` necesitan acceso desde la red local. Spring Boot (`8081`) y PostgreSQL (`5432`) permanecen locales al anfitrión.

## Endpoints

Las rutas listadas se consumen a través del gateway en `http://localhost:8080`.
El backend local en `127.0.0.1:8081` exige `X-Gateway-Secret`; no lo consultes
directamente sin esa cabecera.

- `GET /api/health` — estado del backend.
- `GET /api/services` — catálogo de servicios.
- `POST /api/services` — agrega un servicio; JSON: `{"name":"Pulido","price":120,"duration":90}`.
- `GET /api/vehicles` — lista vehículos registrados.
- `POST /api/vehicles` — registra un vehículo.
- `PATCH /api/vehicles/{id}/status` — cambia el estado.
- `POST /api/vehicles/{id}/payments` — registra un pago.
- `GET /api/oil-changes` — lista los cambios de aceite y sus próximos vencimientos (administración, recepción y técnico).
- `POST /api/oil-changes` — registra el kilometraje, aceite usado y próximo cambio (administración, recepción y técnico).
- `POST /api/auth/login` — inicia sesión y devuelve un token temporal.
- `GET /api/auth/me` — devuelve la cuenta autenticada.
- `POST /api/users` — registra un empleado con varios roles (administradores y supremo); JSON de ejemplo: `{"fullName":"Ana Pérez","email":"ana@autospa.com","password":"contraseña-inicial-larga","roles":["RECEPCION","TECNICO"]}`.
- `GET /api/users` — lista cuentas de personal.
- `PATCH /api/users/{id}/role` — cambia el rol.
- `PATCH /api/users/{id}/active` — desactiva o reactiva una cuenta.

Roles combinables: `ADMIN_SUPREMO`, `ADMINISTRADOR`, `RECEPCION`, `TECNICO` y `CAJA`. Un empleado puede tener varios roles operativos (por ejemplo, `RECEPCION` y `TECNICO`). El primer arranque crea el administrador supremo solo si aún no existen usuarios. El rol supremo no se puede asignar desde la gestión de empleados; las cuentas administrativas no pueden ser modificadas por administradores.

Los endpoints comprueban permisos en el backend. Los cambios de rol y desactivaciones se aplican a las siguientes peticiones autenticadas.

El catálogo y los vehículos se guardan en PostgreSQL. Si el catálogo está vacío al iniciar, se insertan los cuatro servicios iniciales. Los vehículos registrados previamente cuando el backend todavía usaba memoria no se migran; vuelve a registrarlos si necesitas conservarlos.

`spring.jpa.hibernate.ddl-auto=update` se usa aquí para desarrollo local. Antes de producción deberá cambiarse por migraciones versionadas.
