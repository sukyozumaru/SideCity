# Huertos y vida del valle · 0.8

Esta entrega convierte la agricultura en un ciclo jugable y añade una primera capa de vida cotidiana. Conserva los tres fundadores, el terreno, el aspecto ilustrado con volumen, los edificios, las ocho vistas y el audio anterior. No añade dependencias, imágenes externas, llamadas a modelos de lenguaje ni costes de servicios.

## Un huerto, cuatro trabajos

**Cultivar** en la barra inferior (V en teclado) permite marcar una parcela del suelo abierto. Requiere tierra despejada, sin habitantes ni trabajos encima, fuera de casas, puentes, fogón y accesos, con al menos dos lados libres y una ruta para un adulto. El máximo es 24 parcelas; marcar no gasta recursos. Preparar, sembrar, regar y cosechar son órdenes separadas. El trabajador actúa desde un lado; nadie camina sobre los cultivos.

| Etapa | Regla |
| --- | --- |
| Preparar | 6 segundos base; tierra con surcos |
| Sembrar | 4 segundos base; consume 1 semilla al terminar |
| Regar | Camina a una orilla seca, recoge agua durante 4 segundos base y vuelve a la parcela para verterla durante otros 4; termina con 100% de humedad |
| Crecer | Necesita 150 segundos simulados con agua; la humedad baja 0,35 puntos por segundo; al secarse se pausa, sin matar la planta |
| Cosechar | 5 segundos base; entrega 4 raíces y 2 semillas; deja la tierra preparada para repetir |

La comunidad comienza con 6 semillas; los guardados anteriores reciben las mismas 6. Separar semillas transforma 2 bayas en 2 semillas. Las raíces se comen (+15 energía) o se cocinan con 1 madera; se consumen primero comidas, después raíces y después bayas. **Frescos** suma bayas y raíces; el almacén conserva sus cantidades separadas.

Cultivo es la octava habilidad, con 12 XP por trabajo completo y las mismas reglas de nivel y especialidad. Ir a buscar agua no concede un segundo premio; el trabajo se completa al regar. Cancelar la siembra no gasta la semilla. Una parcela solo puede tener un trabajador asignado, de modo que no se duplica la cosecha ni se paga dos veces. Se conservan crecimiento, humedad, experiencia y el trayecto de vuelta con agua al guardar.

El panel muestra etapa, humedad, crecimiento, trabajador y una acción principal por huerto. Un adulto libre se elige automáticamente; también puedes elegir a alguien y sustituir su trabajo. «Semillas y cuidado» guarda las explicaciones secundarias.

## Iniciativa propia

Cada habitante tiene **Vida → Por su cuenta cuando esté libre**. Se activa por defecto y se puede desactivar por persona o para una selección. Los adultos libres pasean por rutas válidas, buscan compañía y atienden agua o descanso. Los niños pasean y conversan, sin trabajos profesionales. El cuidado básico de emergencia anterior se conserva incluso sin rutinas libres.

Las órdenes del jugador tienen prioridad. Solo una necesidad muy urgente (agua <12 o energía <10) interrumpe temporalmente un trabajo; se guarda el tipo, destino y progreso para retomarlo después. Detener manualmente deja 45 segundos de margen sin una decisión de rutina. No se acumula una cola de decisiones ni se calcula vida fuera de la pestaña.

La marcha acelera y desacelera, los pasos siguen distancia recorrida y el cuerpo gira con suavidad. Rodillas, brazos, respiración, agacharse, cavar, sembrar, llevar agua, regar y cosechar tienen poses y pequeños efectos propios. Se respetan movimiento reducido y densidad de pantalla. Los paseos no rellenan el historial de oficios ni conceden XP.

## Compañía, ánimo y conversaciones

Ánimo y compañía son valores 0–100. El agua, la energía, la compañía, los encuentros y las cosechas influyen en cómo se siente el habitante. La ficha muestra un estado claro —contento, tranquilo, inquieto, cansado, sediento o en busca de compañía— y sus seis recuerdos recientes. Es una simulación inicial de bienestar, no un sistema psicológico completo.

Conversar permite elegir **Saludar y compartir**, **Escuchar cómo está** o **Hablar del huerto**. Las respuestas dependen del estado de la otra persona y de lo que ya existe en el valle. Los textos se guardan como identificadores de una tabla, sin evaluar código ni generar frases por red. Una orden de conversación da +12 vínculo; una iniciativa autónoma, +6. Ambos habitantes recuperan compañía, guardan un recuerdo y se orientan hacia el otro. Una persona que paseaba se detiene para escuchar; una ocupada en un trabajo no se interrumpe.

El lenguaje avanza según encuentros completados: gestos (0–2), primeras palabras (3–7), frases cortas (8–19) y relatos (20+). Los textos iniciales interpretan gestos para el jugador. Se muestran bocadillos breves alternando hablantes y un registro de los últimos encuentros en Vida; no se afirma que esta progresión sea un modelo histórico o lingüístico real.

Tras tres conversaciones se pueden acordar **círculos** de dos o más habitantes, hasta cuatro círculos. Los de cultivo, solo adultos, atienden tierra, siembra, agua y cosecha durante tiempo libre si la iniciativa propia está activa; los de encuentro priorizan compañeros del círculo al conversar. No forman parejas ni reservan alimento familiar automáticamente. Los hogares y nacimientos siguen siendo decisiones explícitas del jugador.

## Presentación y límites

Mundo / Cultivar / Construir / Almacén / Vida son los cinco destinos; solo un inspector queda visible. Comunidad se divide en Vida, Vínculos y Hogares; la ficha personal en Órdenes, Habilidades, Vida e Historial. Los botones de navegación reflejan el destino actual y mantienen blancos de al menos 44 px en horizontal. Los controles existentes se migran al añadir V; si V estaba asignada, se elige una tecla libre para Cultivar.

Los huertos tienen surcos secos/húmedos, brotes, hojas y raíces con geometría original. El fogón añade troncos, capas de llama, humo y brasas; el río usa su cauce procedural para destellos de corriente y ondas al tomar agua. Los nuevos sonidos son cavar, semillas, verter agua y cosechar, dentro del mezclador espacial existente. No hay estaciones, muerte de cultivos, tipos de cosecha adicionales, demolición de huertos, conflictos complejos, gramática generativa ni transición completa a otra era en esta entrega.

## Guardado y comprobación

Esquema **6**, con migración de 1–5. Conserva recursos, niveles, edificios, vínculos y familias anteriores; añade campos, autonomía, bienestar, recuerdos, círculos y lenguaje. Se validan ubicaciones, rangos, IDs y referencias antes de sustituir una partida. La cámara, controles y audio siguen usando preferencias independientes.

75 pruebas de Node, incluidas doce nuevas de ciclo agrícola, competencia por parcelas, cancelación, humedad, semillas, comida, retorno con agua, migración, órdenes manuales, autonomía, conversaciones, círculos, audio y reasignación de controles. Los fixtures de pruebas de economía/construcción desactivan rutinas libres para aislar esas reglas; la nueva suite comprueba la autonomía activada.

Chrome con perfil temporal aislado: ciclo entero mediante UI hasta cosecha; cuatro conversaciones y círculo; vida autónoma; recarga; 390×844, 360×640, 844×390 y 768×1024 sin desbordamiento ni inspectores superpuestos. Cuatro estados de cultivo vistos desde ocho orientaciones, tecla V y temas contextuales. Inspector del HUD 0 FAIL / 0 WARN. Perfil de la escena de prueba con cuatro huertos: mediana de dibujo 14,9 ms, p95 36,9 ms en Chrome de escritorio instrumentado; no es una promesa de FPS en móviles. Safari/iPhone físico y escucha en equipos reales siguen pendientes.
