# Avances · 3 de noviembre de 2026

## Terreno y cámara

Se reconstruye la etapa desde cero por autorización del usuario. El prototipo lateral queda archivado; la falta del ZIP no bloquea el desarrollo. La aplicación activa está en `index.html` y `src/`.

Terreno reproducible de 2.304 casillas; río conectado de un extremo al otro, riberas con juncos, pradera inicial y bosques. No hay edificios precargados. Proyección 2:1 con casillas de 80 × 40 unidades visuales. Árboles y terreno son originales, dibujados por código; no se han usado paquetes externos ni imágenes generadas.

Cámara con zoom anclado al punto de entrada, límites del foco dentro del rombo, minimapa, encuadre completo y retorno al inicio. Los márgenes exteriores se ven deliberadamente al llegar al borde. Se separan toque, arrastre, pellizco y cancelación. Las preferencias se guardan por separado del prototipo antiguo.

## Validación

- Siete pruebas automatizadas: coordenadas en todas las parcelas; determinismo y conectividad del río; ancla de zoom; límites y esquinas; toque/arrastre/pellizco/cancelación; tres dedos; encuadre completo en móvil, tablet, escritorio y horizontal.
- Chrome con entrada táctil emulada: toque selecciona; arrastre desplaza sin seleccionar; pellizco amplía sin seleccionar; cancelación no selecciona; preferencias sobreviven a recarga; vista completa funciona en teléfono; ayuda abre/cierra; interfaz horizontal sin desbordamiento; sin errores de JavaScript observados.
- Inspector visual: 0 FAIL y 0 WARN a 1440 × 900, 768 × 1024 y 390 × 844. Revisión adicional a 844 × 390.
- Pendiente: Safari en iPhone real y mediciones de rendimiento en ese dispositivo. La emulación no demuestra rendimiento de hardware.

## Dirección aprobada

El usuario aprobó explícitamente estilo, modelo y assets del terreno mostrado. Se fija esa dirección para edificios y personajes: verdes naturales, río azul suave, vegetación con volumen y herramientas discretas. Hoja de interfaz: Framed sheet, semilla 48128, adaptada a un juego: el mapa ocupa el espacio central y no requiere barra lateral permanente.

Revisión visual propia: diseño 7,5; uso 8; creatividad 7; contenido 8; total ponderado 7,6/10. La escena tiene una lectura consistente y controles reales. Quedan por mejorar la variedad orgánica de las orillas y comprobar la legibilidad de objetos altos cuando haya edificios. Las reglas de fotografías de páginas promocionales no se aplican al arte del juego.

## Identidad ampliada

SideCity combina diseño urbano, órdenes directas a habitantes y vida cotidiana sencilla. Referencias: SimCity, Age of Empires y Los Sims. Regla: seleccionar una persona, indicar un destino o tarea y dejar que siga su rutina al quedar libre. Se conserva una interfaz comprensible; necesidades personales, relaciones y sistemas de gran escala entran por etapas.

El usuario añadió evolución de la humanidad por eras y elementos sandbox, y pidió organizar las ideas para definir SideCity. Se consolida la dirección en `SIDECITY.md`, separando era tecnológica de tamaño del asentamiento. Es diseño de trabajo; colonos, necesidades, eras y sandbox todavía no se implementan en esta entrega de terreno.

Última precisión del usuario: comenzar con un humano y hacer aparecer un segundo para iniciar la comunidad. Cada etapa abre edificios, roles, trabajos, inventos, mentalidades y reglas. El primer prototipo de habitantes se ajusta a ese arranque; ya no empieza con tres colonos.

Siguiente prueba: un humano seleccionable, movimiento sobre tierra, primera recolección y llegada del segundo. Después, órdenes de grupo, obras con trabajadores, ocupaciones y rutinas; primera transición hacia agricultura y configuración sandbox separada.
