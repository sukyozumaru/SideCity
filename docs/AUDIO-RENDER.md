# Zoom nítido y sonido del valle · 0.7

## Nitidez

La versión anterior ampliaba imágenes de árboles y detalles de densidad fija. Ahora cada sprite se vuelve a dibujar desde su geometría con una densidad de al menos `ceil(zoom × devicePixelRatio)`. Su tamaño en el mundo no cambia. Una caché LRU limita árboles a 6 millones de píxeles y objetos pequeños a 2 millones, independientemente de cuántas vistas se recorran.

El terreno de baja resolución se usa solo cuando su densidad cubre el tamaño físico final, incluido el estiramiento de la proyección al rotar. Al acercar, las parcelas visibles se dibujan como vectores en una capa del tamaño físico de la pantalla. Esa capa se conserva mientras la cámara no cambie; zoom, giro, desplazamiento, tamaño o densidad del monitor la regeneran. Los personajes y edificios siguen siendo geometría dibujada directamente. No se fuerza el aspecto pixelado ni se aplica un filtro de enfoque.

## Sonidos

Foley procedural original en `src/foley.js`, creado con ruido filtrado, envolventes de aire y líquido y resonancias cortas de materiales. No hay grabaciones de terceros, voces reales, música ni descargas externas. Se preparan buffers a 24 kHz que Web Audio reproduce a la frecuencia del dispositivo. Cuatro tomas por acción, pequeñas variaciones de velocidad y transiciones sin chasquidos.

| Familia | Uso |
| --- | --- |
| Pasto, arena, madera | Pasos según superficie y distancia recorrida; madera sobre puentes |
| Golpe de madera | Tala y astillas |
| Piedra y mineral | Pico sobre roca y resonancia breve de una veta |
| Hojas | Recolección de bayas |
| Piedritas y ramas | Recoger objetos del suelo, con traqueteo o crujido |
| Construcción | Golpes de herramienta en obras y fabricación |
| Cocina | Burbujeo y movimiento de utensilios |
| Agua y alimento | Beber y comer |
| Investigación | Roce de materiales al estudiar |
| Reposo y sueño | Ropa y respiración suave |
| Conversación | Movimiento no verbal discreto, sin palabras sintetizadas |
| Río y fogata | Flujo y crepitación continuos, suaves y con entrada/salida gradual |

El director observa posiciones y trabajos de la simulación sin modificarla. No dispara pasos por cada fotograma ni sonidos de trabajo mientras alguien camina o espera materiales. Los sonidos lejanos se atenúan, la posición estéreo sigue la cámara y el alejamiento reduce el conjunto. Máximo ocho efectos simultáneos más dos ambientes. Las tomas alternan para no repetir exactamente el mismo impacto.

Web Audio se inicia o reanuda dentro del primer gesto real del jugador. El botón junto a Pausar permite silenciar. Controles → Sonido del valle guarda volumen general, acciones y ambientes, con prueba de sonidos. Las preferencias tienen su propia clave, independiente de la partida. Hay buses General/Efectos/Ambiente y un compresor de protección; nivel cero es silencio real. Pausar, abrir un diálogo o ocultar la pestaña detiene la actividad sonora; al volver no se reproduce una cola de golpes antiguos. La pestaña oculta suspende el contexto de audio.

## Comprobación

63 pruebas automáticas: reglas previas, densidad y memoria, estiramiento de la proyección, buffers finitos sin recorte, variaciones, niveles, materiales, pasos basados en recorrido, cancelación, pausa y conservación de partidas.

Chrome en perfil temporal aislado: máxima ampliación en ocho vistas a DPR 1/2/3; terreno y sprites a densidad suficiente; sonidos reales llegando al analizador del mezclador; río/fogata, pasos/tala, pausa, silencio y suspensión/reanudación. Los 19 tipos también se renderizaron con OfflineAudioContext y conservaron señal no nula sin superar 0,73 de pico. HUD: 0 FAIL / 0 WARN a 1440/768/390; menús sin desbordamiento también en 844×390. Perfil instrumentado de dibujo a 1440×900: mediana 5,5 ms, p95 22,1 ms; no representa FPS garantizados en teléfonos.

La validación acústica final en altavoces/auriculares físicos y Safari en un iPhone real sigue pendiente. Esquema de partida 5 sin cambios; se conservan recursos, niveles, obras y relaciones.
