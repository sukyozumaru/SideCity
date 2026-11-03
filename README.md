# SideCity

Una civilización a escala de barrio: diseña la ciudad y dirige a las personas que la construyen. Las referencias expresadas por el usuario son SimCity, Age of Empires y Los Sims, con controles sencillos y una identidad propia.

La evolución humana por eras y el sandbox se suman como dirección de desarrollo. La definición unificada y el alcance de cada prototipo están en [docs/SIDECITY.md](docs/SIDECITY.md).

## Versión 0.4 · Almacén y primeras herramientas

Reconstrucción limpia autorizada el 3 de noviembre de 2026. La nueva aplicación sustituye el prototipo lateral como fuente de desarrollo. El ZIP anterior ya no es una dependencia.

- Mundo procedural 96 × 72, tres veces la superficie original. Río, lago, bosques, piedras, ramas y vetas minerales. Semillas con partidas independientes.
- Territorio inicial 48 × 48; ampliaciones vecinas de 12 × 12 usando madera y saber, con coste previo visible.
- Arrastre con ratón o un dedo, pellizco con dos dedos, rueda, controles de zoom y teclado.
- Inspección de parcelas, cuadrícula opcional, minimapa navegable y vista completa.
- Ana, Ivo y Nara seleccionables, rutas por tierra y órdenes individuales o para los tres.
- Talar, recolectar, estudiar, explorar, preparar fogón y cocinar; materiales finitos y primer descubrimiento del fuego.
- Siete habilidades por persona, niveles 1–20, experiencia, especialidad y registro de trabajos. Menús de Tareas, Habilidades e Historial.
- Guardado de la comunidad, niveles, recursos, órdenes y fogón; copia válida de respaldo. Cámara y cuadrícula recordadas por separado.
- Mapa a pantalla completa; HUD compacto en verde oscuro, sin las franjas claras superior e inferior. Adaptación panorámica, móvil y horizontal.
- Primer refugio cooperativo para los tres: reserva única, progreso visual, pausa/reanudación y cancelación con devolución.
- Beber en la orilla, descansar y dormir en el refugio. Agua/energía, puestos de trabajo distintos y movimiento visual más suave.
- Mini barra de era con etapa, logros reales, porcentaje, tiempo y año del mundo.
- Arte original dibujado por código, sin dependencias ni descargas de imágenes o fuentes.

## Almacén y producción

Materiales, alimentos, herramientas y saber tienen existencias y usos separados. Fabrica un hacha o un pico de piedra, asigna minería y usa las comidas para recuperar energía. Mundo y semilla permite descargar y abrir partidas para trasladarlas de navegador. Reglas y límites en [docs/INVENTORY.md](docs/INVENTORY.md).

Acceso alojado privado: [Jugar SideCity](https://sidecity-valle.colominegabito.chatgpt.site). Se requiere la cuenta propietaria de Sites.

## Ejecutar y comprobar

Con Node instalado, sin instalar paquetes:

```sh
npm start
npm test
```

Abrir `http://127.0.0.1:4173`. El servidor escucha solo en el equipo local. Para comprobar en un iPhone físico hará falta una URL accesible desde ese dispositivo; el alojamiento de Sites ofrece una URL estable con acceso privado del propietario.

## Estructura

- `src/core.js`: terreno determinista, proyección, cámara y máquina de gestos; sin DOM.
- `src/renderer.js`: caché del terreno, sprites originales, profundidad y minimapa.
- `src/simulation.js`: fundadores, rutas, tareas, experiencia y resultados.
- `src/people-ui.js`: selección de habitantes y sus menús.
- `src/persistence.js`: guardado validado y recuperación de copia.
- `src/terrain.js`, `src/world-ui.js`, `src/era.js`: generación, sectores, semillas y avance del campamento.
- `src/camp.js`, `src/camp-renderer.js`, `src/people-renderer.js`: refugio y animaciones del entorno.
- `src/main.js`: interacción, selección, preferencias y conexión con la interfaz.
- `tests/`: pruebas de reglas y regresiones.
- `docs/`: plan, dirección artística, evolución y resultados de verificación.
- `legacy/`: archivo histórico; no forma parte de la nueva aplicación.

42 pruebas automatizadas de terreno, cámara, tareas, refugio, necesidades, semillas, expansión y guardado. Revisión visual a 1440, 768 y 390 píxeles de ancho; comprobaciones adicionales en horizontal. Safari en un iPhone real sigue pendiente. Las partidas se guardan en el navegador; no hay sincronización en la nube ni monetización.

Reglas y límites: [trabajos](docs/PROFESSIONS.md), [refugio y cuidado](docs/REFUGE.md), [mundo y eras](docs/WORLD.md). Fundición, puentes, hambre, crecimiento de población y eras posteriores siguen en el plan.
