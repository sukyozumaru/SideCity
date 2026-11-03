# Punto de continuación · SideCity 0.2

Pausa solicitada por el usuario el 3 de noviembre de 2026. No añadir funciones hasta que pida continuar.

## Implementado

- Mapa isométrico 48 × 48, río, árboles, cámara táctil y minimapa.
- Tres fundadores: Ana, Ivo y Nara. Selección individual o de los tres, movimiento con rutas por tierra.
- Talar, recolectar, estudiar, explorar, preparar fogón y cocinar.
- Seis habilidades por persona, XP por trabajos completados, niveles 1–20, especialidad, práctica e historial.
- Recursos finitos, descubrimiento del fuego, fogón único y consumo de ingredientes.
- Guardado local validado y copia de respaldo; órdenes y progreso recuperables.
- Menús Tareas / Habilidades / Historial.
- Terreno a pantalla completa, sin franjas claras superior o inferior. HUD compacto verde oscuro. Título, área, ayuda y botones conservados por petición explícita.

## Comprobado

19 pruebas automatizadas pasan con `npm test`. Chrome verificó tareas simultáneas, XP independiente, producción, desbloqueo del fuego, fogón, cocina y recuperación al recargar. La revisión de pantalla completa pasó con 0 FAIL / 0 WARN a 1440, 768 y 390 píxeles. Hay capturas y pruebas adicionales en horizontal.

Después de esa revisión se hizo un ajuste pequeño de menús: Habilidades muestra primero los niveles; especialidad queda desplegable debajo; la ficha móvil se amplió y se compactaron las filas en horizontal. Comprobar visualmente ese último ajuste al retomar. Safari en iPhone físico y rendimiento de dispositivo siguen pendientes.

## Cómo retomar

1. Leer este archivo, `docs/SIDECITY.md` y `docs/PROFESSIONS.md`.
2. Ejecutar `npm start` si el servidor local no sigue activo; abrir `http://127.0.0.1:4173`.
3. Revisar Habilidades en móvil y horizontal, conservando el mapa a pantalla completa y los fondos oscuros.
4. Próxima función prevista: primer refugio y obras asignables a trabajadores. No rediseñar el arte aprobado.

Todavía no hay viviendas, hambre/descanso, autonomía por oficio, crecimiento de población, eras completas ni sandbox jugable. Esos sistemas están definidos en el plan y se incorporan por etapas.

## Archivos principales

`src/simulation.js`: tareas, rutas, experiencia y fundadores. `src/people-ui.js`: menús. `src/persistence.js`: guardado. `src/renderer.js`: arte original por código. `src/style.css`: HUD de pantalla completa. `tests/simulation.test.mjs`: reglas y regresiones.

Se trabaja con módulos nativos sin instalar dependencias. El HTML antiguo queda en `legacy/`; no se usa como aplicación activa.
