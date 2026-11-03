# SideCity

Una civilización a escala de barrio: diseña la ciudad y dirige a las personas que la construyen. Las referencias expresadas por el usuario son SimCity, Age of Empires y Los Sims, con controles sencillos y una identidad propia.

## Versión 0.1 · Terreno y cámara

Reconstrucción limpia autorizada el 3 de noviembre de 2026. La nueva aplicación sustituye el prototipo lateral como fuente de desarrollo. El ZIP anterior ya no es una dependencia.

- Terreno isométrico 48 × 48, río conectado, riberas, seis variantes de árboles y pradera inicial vacía.
- Arrastre con ratón o un dedo, pellizco con dos dedos, rueda, controles de zoom y teclado.
- Inspección de parcelas, cuadrícula opcional, minimapa navegable y vista completa.
- Cámara y cuadrícula recordadas localmente. No hay edificios ni economía activos todavía.
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
- `src/main.js`: interacción, selección, preferencias y conexión con la interfaz.
- `tests/`: pruebas de reglas y regresiones.
- `docs/`: plan, dirección artística, evolución y resultados de verificación.
- `legacy/`: archivo histórico; no forma parte de la nueva aplicación.

Revisión visual a 1440, 768 y 390 píxeles de ancho. Gestos comprobados con entrada táctil emulada en Chrome. Safari en un iPhone real sigue pendiente. No hay cuentas, backend, monetización ni despliegue público configurados.
