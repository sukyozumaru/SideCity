# Refugio, movimiento y cuidado · 0.3

## Obra compartida

Refugio en la barra inferior abre Construir y selecciona a los tres. Construir refugio reserva **20 madera una sola vez**. La obra acumula 36 segundos de trabajo base; cada participante aporta según su habilidad de Construcción. Los tres tienen puestos distintos alrededor del solar.

El dibujo pasa de suelo y postes a paredes, estructura y tejado de paja. Detener a un colono mantiene la obra; otro puede continuar sin pagar de nuevo. Cancelar obra devuelve la reserva una sola vez y elimina el proyecto. Al terminar, los participantes con al menos un segundo de trabajo reciben un registro y 25 XP de Construcción. No hay XP por cancelar.

Es el primer refugio en una ubicación prevista del claro, no un catálogo libre de viviendas. Hay tres lugares de descanso. Las obras futuras podrán incorporar colocación y más tipos.

## Cuidado y entorno

- Beber: caminar hasta una casilla seca junto al agua y recuperar hasta 65 puntos de hidratación.
- Descansar: sentarse donde se está y recuperar hasta 30 de energía.
- Dormir: requiere refugio terminado; caminar a una estera libre y recuperar hasta 65 de energía.

Son acciones de cuidado, sin XP de profesión. Agua y energía descienden lentamente. Los habitantes libres buscan agua o descanso si bajan de 25; no se interrumpen continuamente las órdenes del jugador ni se añade muerte por necesidades en esta versión.

Tocar un árbol o un arbusto con un colono seleccionado dirige la tala/recolección hacia ese objeto. Tocar agua asigna beber desde la orilla; tocar el refugio asigna construir o dormir según su estado. Los arbustos y vetas son obstáculos físicos. Los caminos se recalculan si una obra bloquea una ruta.

## Movimiento y animación

La simulación conserva sus pasos fijos. El dibujo interpola visualmente las posiciones para suavizar el movimiento y cambia orientación según el trayecto o el recurso. Hay gestos específicos de tala, recolección, observación, construcción, cocina, bebida, descanso sentado y sueño acostado. El árbol se mueve durante la tala y aparecen resultados breves al completar trabajos.

Las animaciones de personas usan el reloj de simulación: se detienen al pausar. Movimiento reducido elimina oscilaciones accesorias. El dibujo no genera materiales ni experiencia.

## Menús móviles

Se mantienen Tareas, Habilidades e Historial. Tareas se divide en Trabajar, Construir y Cuidarse. Habilidades empieza directamente por sus niveles y deja la especialidad desplegable. Las necesidades y el progreso actual quedan sobre las pestañas. El mapa sigue ocupando la pantalla completa, con HUD verde oscuro.

Los botones inferiores son Terreno, Refugio, Cuadrícula y Mapa. En móvil se organizan en cuatro columnas. Mundo y semilla sigue disponible desde Ayuda cuando se compacta el nombre del valle.

## Guardado

Esquema 3, con migración desde los guardados 1 y 2. Se mantienen habilidades, materiales, tala agotada, obras reservadas, aportaciones, necesidades y órdenes. La versión antigua que situaba recolectores dentro de arbustos los traslada a una casilla vecina válida al migrar. Rutas y dibujos se reconstruyen, no se serializan.
