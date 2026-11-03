# SideCity

Una civilización a escala de barrio: diseña la ciudad y dirige a las personas que la construyen. Las referencias expresadas por el usuario son SimCity, Age of Empires y Los Sims, con controles sencillos y una identidad propia.

La evolución humana por eras y el sandbox se suman como dirección de desarrollo. La definición unificada y el alcance de cada prototipo están en [docs/SIDECITY.md](docs/SIDECITY.md).

## Versión 0.2 · Tres fundadores, tareas y habilidades

Reconstrucción limpia autorizada el 3 de noviembre de 2026. La nueva aplicación sustituye el prototipo lateral como fuente de desarrollo. El ZIP anterior ya no es una dependencia.

- Terreno isométrico 48 × 48, río conectado, riberas, seis variantes de árboles y pradera inicial vacía.
- Arrastre con ratón o un dedo, pellizco con dos dedos, rueda, controles de zoom y teclado.
- Inspección de parcelas, cuadrícula opcional, minimapa navegable y vista completa.
- Ana, Ivo y Nara seleccionables, rutas por tierra y órdenes individuales o para los tres.
- Talar, recolectar, estudiar, explorar, preparar fogón y cocinar; materiales finitos y primer descubrimiento del fuego.
- Seis habilidades por persona, niveles 1–20, experiencia, especialidad y registro de trabajos. Menús de Tareas, Habilidades e Historial.
- Guardado de la comunidad, niveles, recursos, órdenes y fogón; copia válida de respaldo. Cámara y cuadrícula recordadas por separado.
- Mapa a pantalla completa; HUD compacto en verde oscuro, sin las franjas claras superior e inferior. Adaptación panorámica, móvil y horizontal.
- Arte original dibujado por código, sin dependencias ni descargas de imágenes o fuentes.

## Ejecutar y comprobar

Con Node instalado, sin instalar paquetes:

```sh
npm start
npm test
```

Abrir `http://127.0.0.1:4173`. El servidor escucha solo en el equipo local. Para comprobar en un iPhone físico hará falta una URL accesible desde ese dispositivo; esta entrega no se publica automáticamente.

## Estructura

- `src/core.js`: terreno determinista, proyección, cámara y máquina de gestos; sin DOM.
- `src/renderer.js`: caché del terreno, sprites originales, profundidad y minimapa.
- `src/simulation.js`: fundadores, rutas, tareas, experiencia y resultados.
- `src/people-ui.js`: selección de habitantes y sus menús.
- `src/persistence.js`: guardado validado y recuperación de copia.
- `src/main.js`: interacción, selección, preferencias y conexión con la interfaz.
- `tests/`: pruebas de reglas y regresiones.
- `docs/`: plan, dirección artística, evolución y resultados de verificación.
- `legacy/`: archivo histórico; no forma parte de la nueva aplicación.

19 pruebas automatizadas de terreno, cámara, tareas, progreso y guardado. Revisión visual a 1440, 768 y 390 píxeles de ancho; comprobaciones adicionales en horizontal. Las tareas, sus resultados, la cocina y la recarga se verifican también en Chrome. Safari en un iPhone real sigue pendiente. No hay cuentas, backend, monetización ni despliegue público configurados.

Reglas y límites del sistema de trabajos: [docs/PROFESSIONS.md](docs/PROFESSIONS.md). Vivienda, necesidades y eras completas siguen en desarrollo.
