# Plan de evolución de SideCity

## Dirección

SideCity será un constructor de ciudades de sesiones cortas, con el placer visual de ver crecer un barrio y decisiones comprensibles sobre conexiones, servicios y presupuesto. CityVille y SimCity son las referencias expresadas por el usuario. La propuesta adopta construcción accesible y consecuencias urbanas legibles; edificios, interfaz y recursos visuales serán propios.

Bucle central: explorar → trazar una calle → colocar viviendas y comercios → conectar servicios → observar ocupación e ingresos → resolver una necesidad → ampliar o mejorar el barrio.

Prioridad de plataforma: navegador móvil con Safari en iPhone, además de escritorio con ratón. El mundo empieza sin edificios construidos; río, vegetación y relieve visual forman el terreno inicial. La cámara es isométrica fija con arrastre y zoom. La elevación aparente de fachadas y tejados produce el 2.5D.

## Punto de partida y alcance

La base comprobable es el HTML lateral archivado. El chat anterior anunció terreno isométrico 48 × 48 con río y bosques, pero aún falta recuperar su fuente. Las etapas siguientes son objetivos; no se marcan terminadas por aquel anuncio.

La primera versión completa debe permitir jugar 15–20 minutos: construir y guardar un barrio funcional, entender una falta de servicio y resolverla, mejorar un edificio y alcanzar el siguiente hito. Es un objetivo de diseño que debe validarse jugando, no una duración medida.

## Etapas y condiciones de cierre

| Etapa | Entrega | Se cierra cuando |
| --- | --- | --- |
| Base recuperable | Repositorio privado, archivo original, auditoría, último ZIP incorporado o decisión documentada de reconstruir | Se conoce qué versión es la fuente de trabajo y se puede reproducir su arranque |
| Terreno y cámara | Mapa 48 × 48, semilla reproducible, río, árboles, proyección/inversa y cámara táctil | Selección de casillas correcta en bordes y zoom; arrastrar o pellizcar nunca construye; ninguna zona jugable queda inaccesible |
| Construcción y guardado | Huellas por casilla, previsualización, validación, selección, mejora y demolición; guardado versionado | No hay solapes ni cobros al fallar; recargar restaura mapa y presupuesto; un archivo inválido no destruye la última partida válida |
| Calles y servicios | Calles conectables, cruces, puente, acceso de edificios y capacidad de energía/agua/comida | Cortar una conexión modifica el acceso y la UI explica la causa; reparar la red restaura el servicio |
| Primer barrio vivo | Ocupación gradual, hogares, empleos, comercios y viajes por rutas válidas | La población cambia por condiciones urbanas y los agentes siguen calles; no atraviesan agua o edificios |
| Economía y progreso | Ingresos y mantenimiento, objetivos únicos, mejoras y primeros hitos | Se completa una sesión de 15–20 minutos sin recompensas duplicadas ni bloqueo económico inevitable; cada compra explica su efecto |
| Acabado y beta móvil | Arte coherente, sonidos, ajustes, rendimiento y acceso web para pruebas | Safari en iPhone real supera la lista de aceptación y se miden los presupuestos de rendimiento |

El orden respeta las dependencias: no implementar tráfico antes del grafo vial, ni ajustar toda la economía antes de corregir recompensas y ocupación.

## Evolución de la ciudad

Los nombres ya existen en el prototipo. Las funciones de esta tabla son la propuesta de evolución, no características terminadas ni umbrales definitivos.

| Hito | Nueva decisión del jugador | Cambio visible |
| --- | --- | --- |
| Aldea | Ubicar casas, comida, agua y primera fuente de energía | Parcelas pequeñas, caminos iniciales y viviendas bajas |
| Pueblo | Unir hogares con comercios y administrar mantenimiento | Fachadas variadas, ocupación y primeros vehículos |
| Villa | Elegir cobertura de parques y escuela frente a expansión | Equipamientos de barrio, pequeñas plazas y edificios mejorados |
| Ciudad | Equilibrar densidad, empleo y atención de emergencias | Apartamentos, comercio mayor y servicios especializados |
| Metrópolis | Resolver congestión y distribuir actividad por distritos | Corredores comerciales y transporte colectivo si la red lo necesita |
| Megaciudad | Optimizar calidad de vida, presupuesto y espacio | Skyline propio y proyectos urbanos de gran escala |

Balancear primero Aldea y Pueblo. Reutilizar los desbloqueos existentes solo si encajan con el nuevo bucle. No fijar requisitos de población finales hasta medir sesiones completas.

## Arquitectura propuesta

Conservar JavaScript y Canvas 2D para la primera etapa. La base disponible no tiene un motor externo; cambiarlo ahora añadiría una migración antes de recuperar la última versión. Revisar el renderizador solo si las mediciones justifican el cambio.

Separar los sistemas progresivamente:

- `world`: terreno, semilla, casillas, ocupación y coordenadas lógicas.
- `render`: proyección isométrica, orden de profundidad, descarte fuera de cámara y animación visual.
- `camera` e `input`: arrastre, zoom anclado, selección y cancelación de gestos.
- `construction`: comandos para colocar, mejorar, mover cuando se incorpore y demoler; validación previa al cobro.
- `simulation`: reloj fijo, ocupación, recursos y economía; independiente de los cuadros dibujados.
- `roads` y `agents`: conectividad, rutas y viajeros; volver a calcular al cambiar la red.
- `progression`: catálogo, desbloqueos, objetivos con identificador y recompensas idempotentes.
- `persistence`: versión, validación, copia de respaldo y exportación/importación.
- `ui`: HUD que reacciona a eventos y paneles del edificio seleccionado.

Un edificio guarda su identificador de tipo, posición de casilla, huella, nivel y ocupación. La altura dibujada nunca determina la huella. El estado persistido no debe incluir referencias al DOM, partículas o nodos de audio.

## Construcción y controles

En móvil, elegir edificio abre una previsualización desplazable y un botón de confirmar; mover la cámara sigue siendo posible. El gasto ocurre una vez al confirmar una posición válida. Cancelar, perder un puntero o iniciar un pellizco invalida el toque de construcción pendiente. En escritorio, clic y Escape ofrecen el mismo flujo.

La selección resalta la huella y abre una ficha con coste de mantenimiento, residentes o empleo, conexión y servicio faltante. Las herramientas de construir, inspeccionar y demoler tienen estados explícitos. Demoler muestra devolución y efecto antes de confirmar; el sandbox usa una partida separada.

## Dirección de gráficos y sonido

Ver `ART_DIRECTION.md`. Secuencia: fijar proyección y escala → aprobar una calle, una casa y un árbol dentro del juego → completar el conjunto del primer barrio → añadir niveles visuales y animaciones. No producir decenas de edificios antes de probar escala, lectura y oclusión en el teléfono.

Los sonidos comunican colocar, error, mejora y nuevo hito. Iniciar audio tras interacción del jugador; ofrecer silencio persistente. Los eventos y el ciclo día/noche llegan cuando el barrio base es legible de día y de noche.

## Calidad y criterios de aceptación

Pruebas automatizadas centradas en reglas: conversión entre coordenadas, ocupación de huellas, saldo tras acciones válidas/inválidas, conexión de calles, recompensas cobradas una vez y validación/migración de guardados. No escribir pruebas que solo repitan cada función de dibujo.

Pruebas de interacción: toque, arrastre, pellizco, cancelación, paneles, orientación y reanudación tras cambiar de aplicación. Revisar tamaños 390 × 844, 844 × 390, 768 × 1024 y 1440 × 900. Una emulación de tamaño no sustituye Safari en un iPhone real.

Presupuestos iniciales por validar: aspirar a 60 fps y mantener al menos 30 fps en el iPhone elegido para pruebas, en una escena de 150 edificios y 50 agentes visibles; medir percentil 95 de tiempo de cuadro durante dos minutos. Si no se cumple, medir y reducir trabajo fuera de cámara, limitar agentes/partículas y cachear terreno antes de cambiar de tecnología. Primer barrio interactivo en menos de cinco segundos en la conexión de prueba documentada. Son metas, no mediciones actuales.

Guardar al cambiar la ciudad, con escritura diferida, además de al ocultar la página. Mostrar fallo de almacenamiento y permitir exportar una copia. Para beta, evaluar publicación web separadamente: un repositorio privado no publica automáticamente el juego ni protege una URL de pruebas.

## Prioridades del siguiente bloque

1. Incorporar la última entrega si está disponible y registrar su diferencia frente al archivo conservado.
2. Confirmar que el estado inicial está vacío y que el mapa tiene coordenadas lógicas independientes del dibujo.
3. Verificar proyección, selección, profundidad y límites de cámara en un mapa 48 × 48.
4. Cerrar los gestos táctiles sin colocaciones accidentales.
5. Entregar una escena pequeña verificable: terreno, río, árboles, una calle y una vivienda.

Después: construcción y guardado, red vial, barrio vivo, economía y contenido. Multijugador, cuentas, pagos, rotación libre de cámara, terreno terraformable y grandes desastres quedan para una decisión posterior al primer barrio validado. Caos y recompensas diarias existentes se reevaluarán por su aportación al juego.
