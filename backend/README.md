# AutoSpa backend

Base de backend con Java 21, Spring Boot y Maven Wrapper. Esta etapa solo deja preparada la aplicación y el build; aún no incluye módulos de negocio ni conexión a PostgreSQL.

## Requisitos

- JDK 21 instalado y seleccionado en IntelliJ IDEA.
- Conexión a internet en la primera compilación para descargar Maven y dependencias.

## Ejecutar desde PowerShell

```powershell
Set-Location .\backend
.\mvnw.cmd spring-boot:run
```

La aplicación se inicia en `http://localhost:8080`.

## IntelliJ IDEA

Abre la carpeta `backend` como proyecto Maven. En **File > Project Structure > Project**, elige el JDK 21 para **Project SDK** y fija **Language level** en 21. En **Settings > Build, Execution, Deployment > Build Tools > Maven > Runner**, selecciona el mismo JDK 21 para **JRE**. En la notificación de Maven, elige cargar/importar el proyecto.

El frontend Vite permanece en la raíz de `AutoSpa`; no hace falta moverlo ni cambiar sus dependencias.
