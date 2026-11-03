# Dirección visual propuesta

## Identidad

Una maqueta urbana viva: barrios claros, vegetación reconocible y edificios con volumen. El mapa es el protagonista; la interfaz informa sobre lo seleccionado y deja espacio para construir. La referencia explícita del usuario a CityVille y SimCity determina la perspectiva y la lectura del juego. Las decisiones de esta guía son propuestas para validar dentro de una escena real.

## Mundo 2.5D

- Proyección isométrica 2:1: casilla lógica cuadrada, rombo visual con ancho doble de su alto. Base de 80 × 40 unidades de dibujo, independiente de densidad de pantalla. Estilo del terreno aprobado por el usuario el 3 de noviembre de 2026.
- Cámara fija; arrastre y zoom. Posponer rotación para no multiplicar orientaciones de todos los recursos.
- Luz común desde arriba a la izquierda; fachada iluminada, lateral más oscuro y sombra de contacto consistente. Las sombras del mundo comunican volumen, no adornan paneles.
- Ordenar terreno, infraestructura y objetos altos por profundidad de sus huellas; resolver edificios grandes sin depender solo de su altura. Atenuar un objeto que impida ver la parcela seleccionada.
- Casas bajas con tejados y accesos claros; comercios con escaparates; servicios con siluetas propias. Cada mejora cambia forma o volumen, además de estadísticas.
- Río continuo, orillas que encajan y árboles con pequeñas variaciones de forma y tamaño; conservar escala y dirección de luz.

## Paleta e interfaz

Verdes naturales para terreno y vegetación, agua azul poco saturada, pavimento neutro y fachadas con variaciones controladas. Usar superficies opacas y texto de alto contraste en el HUD; una familia tipográfica de sistema y cifras tabulares evitan descargas iniciales.

El color debe ayudar a leer el estado: selección claramente delimitada; parcela válida y bloqueada con símbolo y texto además del color; déficit identificado por recurso. No convertir cada contador en una tarjeta decorativa ni usar emojis como arte definitivo. Unificar iconos vectoriales para recursos y herramientas; miniaturas reales de cada edificio para el catálogo.

HUD móvil: dinero, población y un resumen de necesidades arriba; construir e inspeccionar al alcance del pulgar; recursos detallados en un panel desplegable. Objetivo mínimo de 44 × 44 píxeles CSS por acción táctil, zonas seguras y texto legible. Pausa, audio y ajustes comparten un menú secundario. Ningún cartel debe tapar la parcela que el jugador está confirmando.

## Recursos del primer barrio

Conjunto inicial para validar: césped y variaciones, agua y orillas, carretera recta/curva/cruce, puente, dos árboles, casa, comercio, granja, fuente de energía, torre de agua y parque. Añadir personas y dos vehículos tras establecer escala y rutas.

Cada recurso registra tipo, huella lógica, punto de anclaje, tamaño de dibujo, variantes, capas de animación y procedencia/licencia cuando corresponda. Evitar escalas, luces o perspectivas mezcladas. Los recursos actuales del HTML son provisionales; no hay un paquete de arte final creado.

## Movimiento

Feedback breve al colocar, confirmación de mejora y animaciones discretas de agua, copas y actividad urbana. Evitar rebotes permanentes de edificios y partículas continuas. Respetar movimiento reducido. La simulación funciona sin efectos visuales.

## Revisión visual

Evaluar la misma escena en móvil y escritorio: reconocer un hogar y un comercio al zoom normal, identificar acceso a la calle, distinguir selección de error y ver qué está tapando un objeto alto. Revisar primero composición, escala y legibilidad; después detalles de fachada. Registrar capturas reales y problemas pendientes antes de dar el arte por aprobado.
