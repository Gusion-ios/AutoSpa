@echo off
setlocal
for %%i in ("%~dp0.") do set SCRIPT_DIR=%%~fi
if not defined JAVA_HOME (
  set JAVACMD=java.exe
) else (
  set JAVACMD=%JAVA_HOME%\bin\java.exe
)
"%JAVACMD%" -classpath "%SCRIPT_DIR%\.mvn\wrapper\maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%SCRIPT_DIR%" org.apache.maven.wrapper.MavenWrapperMain %*
