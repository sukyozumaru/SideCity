# SideCity · Plan de desarrollo vigente

Dirección: [SIDECITY.md](SIDECITY.md). Estado comprobado: [PROGRESS.md](PROGRESS.md). Arte y procedencia: [ART_DIRECTION.md](ART_DIRECTION.md) y [ASSETS.json](ASSETS.json).

## Objetivo

Una civilización que construyes, diriges y ves vivir a través de las eras. Diseñar el asentamiento, dar órdenes a sus habitantes y permitir rutinas autónomas deben funcionar juntos con controles sencillos en móvil.

El arranque definido por el usuario son tres colonos fundadores desde el primer momento: el origen de la humanidad y de la sociedad dentro de SideCity. Cada era abre edificios, roles, trabajos, inventos, reglas y formas de organizarse. Tamaño urbano y era tecnológica son ejes distintos.

## Estado actual

Actualización 0.8: huertos completos, vida autónoma configurable, bienestar, conversaciones y círculos. Esquema 6 migra los anteriores y conserva construcción, puentes y familias. Reglas vigentes en FARM-LIFE.md. La fundición, taller y herramientas de bronce se entregaron en 0.9; las eras posteriores siguen pendientes; no repetir lo ya entregado.


La etapa de terreno y cámara se reconstruyó con autorización del usuario; no depende del ZIP anterior. La aplicación activa está en `index.html` y `src/`. El prototipo lateral se conserva en `legacy/`, fuera de la nueva aplicación.

Versión 0.4: mundo procedural de 96 × 72, expansión por sectores de 144, tres fundadores, refugio cooperativo, agua y energía, fogón/cocina, siete habilidades y barra de Orígenes. Almacén separado por categorías; hacha/pico fabricables, extracción finita de piedra/carbón/cobre/estaño y comer. Guardado por semilla, migración y archivos portátiles. Mantener el arte aprobado. Ver INVENTORY.md, REFUGE.md y WORLD.md.

Estado 0.8: construcción libre y puentes, familias y nuevas generaciones, ocho cámaras, nitidez, foley y primeros huertos completos. Iniciativa propia configurable, ánimo/compañía, conversaciones, lenguaje y círculos. Ver FARM-LIFE.md. Estado 0.9: horno/taller, bronce, mejoras de herramientas, Metalurgia y timeline, con optimización medida de cámara y sprites (BRONZE-PERFORMANCE.md). Siguientes bloques: más cultivos, retirada/traslado y contenido de hierro. Hierro/plata, hambre, sandbox completo y Safari/iPhone físico siguen pendientes.

## Entregas por dependencia

| Bloque | Entrega | Condición de cierre |
| --- | --- | --- |
| Terreno y cámara | Mundo vacío legible y navegable | Casillas correctas a cualquier zoom, todas las esquinas accesibles, arrastre/pellizco/cancelación sin selección accidental; falta validar dispositivo físico |
| Tres colonos fundadores | Tres personas seleccionables desde el inicio, con nombre y orden visible | Se mueven por rutas válidas y completan una recolección; no atraviesan agua ni árboles |
| Primera comunidad | Reparto de trabajo; órdenes individuales y de grupo | Las órdenes pueden cambiarse y no se duplican personas ni recursos |
| Primer refugio | Proyecto de obra, materiales y constructores asignados | Los materiales se reservan una vez; cancelar y reanudar no los duplica ni los pierde indebidamente |
| Rutinas y aldea | Alimento, descanso, refugio y oficios persistentes | Al acabar una orden vuelven al trabajo o rutina; se entiende por qué dejan de trabajar |
| Primera era | Pasar del campamento a una comunidad agrícola | El avance exige una capacidad demostrada y una decisión; desbloquea una acción, un trabajo y un cambio visual |
| Sandbox inicial | Configuración por partida para experimentar | Recursos y necesidades ajustables; no se transfieren ventajas a partidas de progreso |
| Ciudad y nuevas eras | Artesanía, intercambio, redes y servicios más complejos | Cada incorporación tiene una necesidad jugable previa; se mide rendimiento y facilidad de uso antes de crecer |

No implementar el árbol completo de eras antes de conseguir el primer refugio y el ciclo de trabajo. El catálogo moderno del prototipo antiguo es una referencia histórica, no el contenido inicial.

## Arquitectura

Conservar JavaScript, Canvas 2D y módulos nativos. La etapa actual no requiere instalar dependencias. Medir antes de cambiar de renderizador.

- Terreno, proyección y cámara independientes del DOM.
- Input separado de selección y órdenes: un gesto de cámara nunca confirma una tarea.
- Habitantes con estados explícitos; decisión, ruta y movimiento separados.
- Grafo de casillas transitables y rutas calculadas al recibir órdenes o cambiar obstáculos.
- Construcción mediante comandos que validan ocupación, materiales y trabajo antes de mutar estado.
- Simulación de recursos y necesidades con paso fijo, independiente de cuadros y animación.
- Progresión definida por datos: requisitos, inventos, logros, costes y efectos.
- Guardado versionado con validación y copia recuperable. Las preferencias actuales de cámara no equivalen a un guardado de civilización.
- HUD actualizado por eventos; fichas contextuales muestran orden, progreso y causa de interrupción.

La altura visual de un objeto nunca determina su huella. Guardar identificadores y datos lógicos, no referencias al DOM o partículas.

## Archivo de prioridades iniciales de habitantes

1. Dibujar tres colonos con identidades distintas en el terreno aprobado, con escala y profundidad coherentes.
2. Hacerlos aparecer juntos desde el inicio, sin edificios ni sociedad precargados.
3. Seleccionar a cada uno o al grupo y mostrar nombres, tareas y acciones contextuales.
4. Ordenarles caminar; resolver rutas por tierra y rechazar destinos inaccesibles.
5. Recolectar madera con tiempo de trabajo y resultado verificable.
6. Repartir tareas independientes y probar cooperación y selección del grupo.

Mantener la escena reducida: aún sin hambre compleja, relaciones, comercio ni inventario detallado. Al validar el control directo, producir el primer refugio y sus materiales.

## Desarrollo visual

Conservar el estilo aprobado del valle. Orden de producción: personaje representativo → animación de caminar y trabajar → primer refugio en obra y terminado → familia pequeña de recursos/edificios de la primera etapa. Probar cada familia a tamaño de teléfono y con el zoom habitual antes de ampliarla.

Cada era cambia materiales, siluetas, herramientas y actividad manteniendo el lugar reconocible. Las sombras del mundo explican volumen; la interfaz permanece discreta. No usar emojis como arte definitivo. Respetar movimiento reducido y permitir silencio.

## Validación

Pruebas de reglas: coordenadas, ocupación, rutas, selección/órdenes, materiales reservados, recompensas únicas, aparición inicial de exactamente tres fundadores y migración de guardados. Probar comportamiento observable en vez de replicar cada función de dibujo.

Interacción: toque, arrastre, pellizco, cancelación, varios dedos, rotación del dispositivo y reanudación tras cambiar de aplicación. Revisar 390 × 844, 844 × 390, 768 × 1024 y 1440 × 900. La emulación no sustituye Safari en un iPhone real.

Objetivo de rendimiento posterior: aspirar a 60 fps y mantener al menos 30 fps en el dispositivo elegido, con una escena documentada; medir percentil 95 de tiempo de cuadro durante dos minutos. El límite de 150 edificios y 50 agentes del plan inicial se conserva solo como una carga futura de referencia. No es una capacidad demostrada de la versión actual.

Antes de beta, medir arranque, trabajo fuera de cámara, memoria de cachés, agentes y partículas. Publicar el juego será una acción separada: un repositorio privado no crea por sí solo una URL de pruebas.

## Decisiones posteriores

Combate, diplomacia, multijugador, relaciones familiares profundas, terraformación y catástrofes se decidirán después. El futuro tecnológico es opcional. No se presupone que una referencia obligue a incorporar todos sus sistemas.

Las eras avanzan por logros y decisión del jugador, no por un reloj inevitable. El sandbox permite ajustar la experiencia por partida. La identidad de SideCity se comprueba en los tres fundadores, la primera colaboración y la primera transformación visible del asentamiento.
