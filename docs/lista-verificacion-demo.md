# Lista de verificación manual de AutoSpa

Usa esta lista antes de la demostración. Marca una casilla solo después de comprobarla en la aplicación.

## Flujo y frontend

- [x] Iniciar sesión como administrador y como empleado.
- [x] Confirmar que el empleado ve solo las secciones asignadas a sus roles.
- [x] Registrar una orden con varios servicios y comprobar que se conserva el precio aplicado.
- [x] Cambiar el estado, registrar el pago y entregar la orden.
- [x] Abrir el QR desde un celular y comprobar que el estado se actualiza.
- [ ] En Caja, seleccionar una fecha y comprobar número de pagos, suma total y desglose por método.
- [ ] Registrar un cambio de aceite con km actual, próximo km y fecha; comprobar que queda guardado en servidor y aparece en otro dispositivo.
- [ ] Confirmar que los avisos de aceite vencido/próximo corresponden a la fecha de Lima.
- [ ] Confirmar que el tablero muestra ingresos y órdenes del día correctos y solo es visible para administración.
- [ ] Revisar las pantallas en celular y tablet tras los cambios recientes.
- [ ] Generar el build de producción del frontend y revisar que no haya errores.

## Seguridad, resiliencia y entrega

- [ ] Probar rate limit, bloqueo temporal y reglas de detección del Gateway con el script controlado.
- [ ] Crear un backup de la base de datos y restaurarlo; anotar RPO y RTO medidos.
- [ ] Probar rollback y medir que se complete en menos de cinco minutos.
- [ ] Verificar el inicio del sistema desde cero con el procedimiento oficial del equipo.
- [ ] Confirmar que no se versionaron secretos.
- [ ] Completar despliegue/alternativa local documentada, informe, diagramas C4 y guion de demo.
