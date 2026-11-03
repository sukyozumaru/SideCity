# Cámara, volumen e interacción · 0.6

Se conserva el valle verde, el HUD oscuro, el refugio de paja y los tres fundadores con sus colores y peinados. No se incorporan paquetes de imágenes, fuentes remotas ni dependencias. Los modelos originales se construyen por código; sus caras se proyectan en Canvas con colores planos y luz fija del mundo. El terreno conserva su caché plana, transformada sobre el suelo sin deformar los volúmenes.

## Ocho orientaciones

SE / E / NE / N / NO / O / SO / S. Las diagonales son isométricas; los ejes son frontales ortográficos, conservando elevación suficiente para leer el suelo. Cada paso gira 45° alrededor del mismo punto. La transición dura 320 ms con entrada y salida suaves; pulsaciones repetidas continúan desde el ángulo visible y toman el camino corto. El giro se desactiva con movimiento reducido del sistema o desde Controles.

Q/E gira, Inicio reinicia orientación, posición y zoom; Z encuadra el mundo; flechas desplazan; +/− acerca y aleja; G muestra cuadrícula. Las funciones de cámara, menús y órdenes se reasignan en Controles, con detección de conflictos, flechas/WASD y restauración de valores iniciales. Los títulos de los botones reflejan las teclas asignadas. Preferencias y cámara se guardan aparte de la simulación.

## Táctil y menús

Arrastre con un dedo; pellizco con dos. Sensibilidad de arrastre y zoom ajustable. El panel de cámara móvil comienza con giro y «⋯»; este abre zoom, reinicio, encuadre, cuadrícula y ajustes. Blancos de cámara de al menos 44 × 44 px. El panel extra se recoge al abrir una ficha. En teléfonos cortos, la ficha completa permite desplazarse para que el encabezado no se coma las órdenes.

Toca un humano para su ficha. Toca un árbol, arbusto, veta, refugio, puente, agua o rama para ver qué puedes hacer y quién lo hará. La pulsación larga (550 ms) y el clic derecho también permiten conversar con un humano. Arrastrar, pellizcar, cancelar o tocar con varios dedos nunca emite órdenes. Las órdenes rápidas son opcionales y comienzan desactivadas. Tocar tierra con habitantes seleccionados conserva la orden de movimiento directa.

Los personajes conservan identidad y escala, con torso suavizado, volumen en cabeza y cabello, brazos y piernas orientados según su dirección. Caminar, trabajar, beber, comer, cocinar, estudiar, descansar, dormir y conversar conservan las acciones existentes. Nombres y progreso permanecen legibles al girar. El refugio tiene cuatro paredes, puerta, ventanas, dos faldones y armazón de obra; los detalles del lado opuesto quedan ocultos por la pared cercana.

## Verificación

57 pruebas de Node: proyecciones y caché en orientaciones intermedias, foco, giro repetido, pasos de tiempo distintos, zoom anclado, gestos, encuadre, asignación de teclas, selección de objetos y conservación del guardado, además de las reglas anteriores de economía y comunidad.

Chrome con perfil temporal aislado: vuelta completa con refugio y puente terminados; reasignación y conflicto de teclas; pulsación larga; un solo inspector, sin desbordamiento horizontal, a 390×844, 360×640, 844×390 y 768×1024. Capturas y verificación fuera del código, en outputs/SideCity. No se modifican partidas del navegador del usuario. Sigue pendiente probar Safari y rendimiento en iPhone físico.

El esquema de partida sigue en 5. Esta versión no reinicia comunidad, recursos, niveles, obras ni relaciones y sigue leyendo partidas anteriores mediante las migraciones existentes.

Perfil de dibujo en Chrome de escritorio 1440×900, con los mismos envoltorios de medida: mediana 31,1 → 15,4 ms y percentil 95 65,5 → 28,9 ms tras cachear arbustos, minerales y objetos del suelo por ángulo y ordenar solo objetos visibles. La caché tiene un límite de 192 sprites pequeños y 60 árboles. Son tiempos de CPU del dibujo en esa prueba, no una promesa de FPS en móvil. Inspector del HUD en 1440/768/390: 0 FAIL / 0 WARN.
