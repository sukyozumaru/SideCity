# Mundo, territorios y eras · 0.4

Actualización: piedra, carbón, cobre y estaño se extraen con pico de piedra; cantidades finitas y progreso de Minería. Hierro/plata y fundición siguen pendientes. Reglas en INVENTORY.md.

## Superficie y generación

El mundo mide **96 × 72: 6.912 parcelas**, exactamente tres veces la superficie original de 48 × 48. La zona inicial conserva 48 × 48 abiertas. Las 4.608 restantes se descubren por sectores.

El generador es determinista por semilla. Produce praderas, bosques, río, lago conectado por un afluente, riberas, árboles, grupos de ramas/piedritas y depósitos minerales. La semilla original 48128 conserva el terreno y los árboles de la antigua zona para migrar la comunidad sin reiniciar sus trabajos o recursos agotados. El lago y las nuevas vetas de esa semilla se sitúan en la ampliación.

Mundo y semilla se abren desde el nombre del valle o desde Ayuda. Cada semilla tiene guardado propio: cambiar de mapa conserva la comunidad anterior y volver a su semilla la recupera. Las dimensiones se mantienen iguales para todos los mapas. No se genera un mundo nuevo si antes falla el guardado de la comunidad actual.

## Sectores iguales

Todos son de **12 × 12, 144 parcelas**. Hay 48 sectores; comienzan abiertos 16. Solo se puede abrir un sector que comparta un lado con el territorio actual.

Coste de trabajo inicial: `8 + 2 × sectores adicionales` de madera y `1 + floor(sectores adicionales / 4)` de conocimiento. El primer sector cuesta 8 madera y 1 saber. El panel muestra coste y requisitos antes de confirmar; una compra inválida o repetida no gasta nada.

Tocar el territorio cerrado muestra la ampliación y su coste. El minimapa diferencia lo abierto de lo cerrado. Los colonos no trabajan ni caminan en sectores cerrados. Abrir tierra no elimina obstáculos naturales: cruzar el río seguirá necesitando un sistema de puentes posterior.

## Materiales y ambiente

- Ramas y piedritas son grupos recogibles. Buscar ramas y piedras da experiencia de Recolección y aporta madera o piedra al inventario común.
- Las vetas contienen piedra, carbón, hierro, cobre, estaño y plata. Se pueden descubrir e inspeccionar; bloquean el paso como objetos grandes.
- Las vetas tempranas se extraen con el pico; fundición y recetas metálicas siguen pendientes de sus tecnologías. El bronce se define como una aleación de cobre y estaño, no como mineral natural del suelo.
- Los detalles pequeños de hierba, flores y rocas decorativas conviven con los grupos recogibles de mayor tamaño.

Todos los recursos visuales son originales por código y conservan el arte del valle. La caché de terreno tiene escala 0,7 para evitar un único lienzo de 24 millones de píxeles al ampliar el mundo. Árboles y personajes se dibujan aparte.

## Barra de era

La barra muestra un icono de campamento, **Orígenes**, la etapa actual, porcentaje, tiempo simulado y año del mundo. Al tocarla se ve la lista de logros y el día.

Cada uno aporta una sexta parte: explorar una parcela, completar tres recolecciones, talar 20 madera, completar tres estudios, preparar el fogón y terminar el refugio. La etapa cambia de Conocer el valle a Organizar la comunidad, Primer campamento y Campamento establecido. Gastar recursos no borra logros ya alcanzados.

El tiempo es ficticio del mundo: 120 segundos simulados por día y 15 días por año, es decir, 30 minutos simulados por año. Pausar u ocultar la pestaña detiene el avance. No se usa una fecha histórica real.

Al llegar a 100% queda establecido el campamento. La transición agrícola completa está en el plan, no se simula un cambio de era que aún no tenga contenido.
