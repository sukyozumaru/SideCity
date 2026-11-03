# SideCity · Identidad del juego

Documento de dirección, 3 de noviembre de 2026. Reúne las ideas expresadas por el usuario y propone una estructura para convertirlas en un juego coherente. El arte del terreno está aprobado. Eras, sistemas y nombres que aún no existen se describen como diseño de trabajo, no como funciones terminadas.

## La idea central

**Una civilización que construyes, diriges y ves vivir a través de las eras.**

Comienzas con tres colonos fundadores y un valle sin construir. Son el origen de la humanidad y de su sociedad dentro del mundo de SideCity. Les indicas dónde ir y qué hacer, repartes las primeras tareas y organizas la comunidad desde cero. Con el tiempo, el mismo lugar cambia de materiales, oficios, arquitectura, tecnología y normas. Puedes seguir el progreso o activar un mundo sandbox para experimentar.

SideCity conserva su nombre. Su identidad será la relación entre tus órdenes, la vida de los habitantes y el cambio visible de un barrio a lo largo del tiempo. La escala se construye desde ese barrio hacia una civilización, conservando lugares y personas que el jugador reconoce.

## Cómo se integran las referencias del usuario

Estas asociaciones expresan lo que el usuario quiere tomar de cada referencia, no pretenden describir íntegramente esos juegos.

| Referencia | Deseo expresado para SideCity | Aplicación propia |
| --- | --- | --- |
| SimCity / CityVille | Diseñar y ver crecer una ciudad isométrica | Calles, parcelas, edificios, servicios y barrios legibles |
| Age of Empires | Seleccionar personas y mandarles tareas | Órdenes de mover, recolectar, construir y trabajar, individuales o en grupo |
| Los Sims | Habitantes con personalidad y vida cotidiana | Nombre, oficio, rutina y unas pocas necesidades que expliquen su conducta |
| WorldBox Simulator | Evolución humana por eras y experimentación | Transformación tecnológica y visual del asentamiento, con herramientas sandbox |

No acumular cuatro juegos completos. Todos los sistemas deben apoyar la misma acción: dar forma a una comunidad y observar cómo responde.

## Papel del jugador

Eres quien guía al asentamiento. Alternas entre observar el conjunto y dirigir a alguien concreto en el mismo mapa. Diseñas dónde construir y asignas quién lo hará; puedes intervenir o dejar trabajar a la comunidad.

Regla principal de interacción: **selecciona una persona, toca un destino o un objeto y elige una tarea comprensible.** Un árbol ofrece recolectar; una obra ofrece construir; el terreno libre ofrece desplazarse. El juego presenta la acción y la razón si no puede ejecutarse.

En móvil, los botones contextuales confirman el trabajo. Arrastrar mueve la cámara; pellizcar acerca. Esos gestos nunca dan órdenes. En escritorio se mantienen las mismas acciones, con atajos opcionales. Las órdenes a grupos usan destinos próximos disponibles para evitar amontonar a todos en una casilla.

## Los cinco pilares

1. **Territorio tangible.** Un mapa isométrico que entiendes y recorres, con ríos, vegetación y restricciones de paso que importan.
2. **Personas que obedecen y viven.** Las órdenes tienen resultado visible; el tiempo sin órdenes tiene rutinas sencillas.
3. **Construcción con trabajo.** Elegir una obra crea un proyecto que requiere materiales y personas, no un edificio instantáneo.
4. **Historia del lugar.** Cada era introduce posibilidades y dilemas, y cambia el aspecto de lo que ya construiste.
5. **Libertad graduable.** El sandbox permite experimentar y ajustar límites sin volver obligatoria la microgestión.

## El bucle de juego

Explorar → seleccionar habitantes → recolectar materiales → planear una obra → asignar constructores → conseguir refugio y alimento → establecer oficios → ampliar el asentamiento → completar un avance → entrar en una nueva era.

El primer tramo tiene esta secuencia de diseño:

1. Los tres colonos aparecen juntos en la pradera desde el inicio. Sus nombres y una instrucción breve enseñan a seleccionarlos individualmente o en grupo.
2. Indicas a uno una tarea sencilla de recolección. Se mueve, trabaja y deja un resultado visible.
3. Repartes tareas entre los otros dos: explorar, reunir alimento o colaborar en la recolección.
4. Reúnes materiales y marcas el primer refugio.
5. Asignas trabajo a la obra. Al terminar, los tres fundadores forman el primer campamento estable.

Los tres fundadores están disponibles desde el primer momento y tienen identidades distintas. La forma de crecimiento de la población posterior se definirá al desarrollar las rutinas y la sociedad; no hace falta resolver reproducción para jugar el primer campamento. Esta secuencia todavía no está implementada.

## Personas: control directo y autonomía

Cada habitante tiene un nombre, un aspecto reconocible, una ocupación y un estado claro: libre, caminando, recolectando, construyendo, trabajando, comiendo o descansando. La ficha muestra la orden actual y el motivo de una interrupción.

Tres necesidades iniciales bastan: alimento, descanso y refugio. La personalidad comienza con un rasgo de preferencia o especialidad; no se incorporan de golpe conversaciones, genealogías, relaciones complejas ni inventarios por objeto.

Una orden directa sustituye la tarea normal. Un oficio asignado permanece hasta que lo cambies. Al terminar una orden, la persona vuelve a su oficio o a su rutina. Una necesidad crítica puede interrumpir el trabajo y debe explicarse. La autonomía y el trabajo no generan recursos por duplicado ni funcionan desde la animación de dibujo.

La primera prueba solo necesita selección, movimiento con rutas y recolección. Las necesidades y rutinas llegan después de demostrar que mandar a los habitantes es claro y agradable.

## Dos progresiones independientes

**Tamaño del asentamiento:** campamento → aldea → pueblo → ciudad → metrópolis. Expresa población, densidad y complejidad del lugar.

**Era tecnológica:** expresa herramientas, producción, transporte y posibilidades. Una aldea puede incorporar una tecnología nueva sin convertirse inmediatamente en una gran ciudad. Los hitos antiguos del prototipo son referencia de escala, no una obligación de desbloquear edificios modernos por población.

Las eras avanzan por logros de la comunidad y una decisión del jugador, no porque haya pasado un temporizador. Requieren estabilidad y una capacidad nueva demostrada. Se pueden pausar para disfrutar el asentamiento actual. Los umbrales concretos se decidirán con pruebas.

## Eras propuestas

Los nombres son provisionales. La primera versión jugable cubre solo el inicio; esta tabla evita introducir mecánicas que contradigan la evolución posterior.

| Era | Problema que aparece | Avance jugable | Cambio visual |
| --- | --- | --- | --- |
| Comunidad inicial | Refugio y alimento inmediato | Recolección, herramientas simples, primeras obras | Senderos de tierra, madera, piedra y refugios pequeños |
| Agricultura y aldea | Producir con regularidad y almacenar | Campos, almacén, oficios y agua accesible | Viviendas permanentes, cercas, huertos y caminos conectados |
| Artesanía y comercio | Especialización e intercambio | Talleres, mercado y distribución local | Nuevas cubiertas, plazas, pavimento y edificios cívicos |
| Industrialización | Producción mayor frente a sus consecuencias | Energía, transporte y contaminación | Fábricas, infraestructura y barrios más densos |
| Ciudad contemporánea | Servicios y calidad de vida | Salud, educación, movilidad y gestión de redes | Apartamentos, equipamientos y zonas verdes urbanas |
| Futuro opcional | Qué civilización quieres conservar | Decisiones posteriores de sostenibilidad y automatización | Evolución que mantenga el carácter del lugar |

Cada transición debe añadir una decisión real, un oficio y una transformación visual. No sustituir todo el mapa de golpe: conservar caminos, espacios públicos y edificios que puedan mejorarse. El futuro opcional no forma parte del alcance inicial.

## Qué desbloquea una era

Una era abre posibilidades en seis áreas conectadas. Los ejemplos son propuestas de juego, no una cronología histórica definitiva. Los desbloqueos concretos se elegirán al producir cada etapa.

| Etapa | Edificios | Roles y trabajos | Inventos | Mentalidad colectiva | Reglas posibles |
| --- | --- | --- | --- | --- | --- |
| Tres fundadores | Refugio elemental | Recolectar, explorar, construir a mano | Herramienta simple | Curiosidad, supervivencia y cooperación | Reparto inicial de tareas; prioridad de alimento o refugio |
| Primera comunidad | Campamento, reserva común | Repartir tareas y ayudar en obras | Conservación y trabajo compartido | Cooperación | Compartir materiales; alternar trabajo y descanso |
| Aldea agrícola | Campos, almacén, viviendas | Agricultor, constructor, cuidador de reservas | Cultivo y herramientas mejores | Planificación del futuro | Reserva mínima de comida; dedicación por oficio |
| Artesanía y comercio | Taller, mercado, plaza | Artesano, transportista, comerciante | Procesos especializados e intercambio | Especialización e intercambio | Distribución y prioridades de producción |
| Industria | Fábrica y redes de transporte/energía | Operario, técnico, gestor de suministros | Mecanización | Producción frente a bienestar | Jornada, mantenimiento y límites de contaminación |
| Sociedad contemporánea | Equipamientos y barrios densos | Educador, sanitario y servicios urbanos | Automatización y redes avanzadas | Calidad de vida y sostenibilidad | Cobertura de servicios, espacio público y movilidad |

Un invento debe habilitar una acción o cambiar cómo se hace el trabajo. Una regla debe producir un efecto y un coste comprensibles. Una mentalidad describe preferencias o costumbres de la comunidad y puede ofrecer reglas distintas; no es una escala de superioridad humana ni solo un número de inteligencia.

Las formas de organizarse combinan hábitos del asentamiento con decisiones del jugador: un lugar que invierte en reservas y cultivo puede desarrollar una tradición de planificación; otro puede favorecer intercambio u oficios. Para el primer prototipo, bastan preferencias sencillas y una decisión comunitaria. El sistema amplio se desarrolla después de validar trabajo, vivienda y alimento.

Representar requisitos de desbloqueo como datos: identificador, era mínima, inventos previos, logros de comunidad, coste y efecto. Separar el conocimiento obtenido de la disponibilidad de materiales. Que una técnica se conozca no significa que exista ya el edificio o el recurso para usarla.

## Sandbox

Dos configuraciones sobre las mismas reglas y el mismo mundo:

- **Progreso:** materiales, trabajo, necesidades y requisitos de era activos.
- **Sandbox:** elegir era y ajustar recursos, necesidades o velocidad; observar o dirigir a los habitantes.

Los modificadores se configuran por partida y se muestran con claridad. No convertir recursos gratuitos en ganancias transferibles a una partida de progreso. Las herramientas de terraformación, catástrofes y edición avanzada pueden añadirse después de disponer de simulación estable. No están implementadas.

## Identidad visual y sonido

Conservar el terreno aprobado por el usuario: verdes naturales, río azul suave, árboles con volumen, perspectiva 2:1 y UI sobria. Las eras se distinguen por materiales, silueta, densidad y actividad. Los personajes usan ropa y herramientas pequeñas pero legibles; no se transforma la interfaz en una colección de botones decorativos.

El edificio de una nueva era debe seguir perteneciendo al mismo valle. Audio breve para órdenes, trabajo terminado, avisos y cambios de era; ambiente discreto. Feedback suficiente para saber que una orden fue aceptada, sin partículas permanentes o ventanas que oculten la acción.

## Primer prototipo y secuencia

| Bloque | Qué demuestra | Alcance |
| --- | --- | --- |
| Terreno y cámara | El mundo se lee y se recorre bien | Implementado; ver verificación y límites en PROGRESS.md |
| Tres colonos y comunidad | Mandar a cada persona resulta claro y aparece cooperación | Tres fundadores desde el inicio, selección individual/grupo, reparto de tareas, mover, rutas y recolectar madera |
| Obras y materiales | Las personas transforman el lugar | Una vivienda, reserva de recursos, progreso de obra y cancelación sin duplicar materiales |
| Rutinas y aldea | El asentamiento funciona sin órdenes constantes | Alimento, descanso, refugio y un oficio persistente |
| Primera transición | La evolución cambia el juego | Pasar del campamento a una comunidad agrícola estable |
| Sandbox inicial | Puedes experimentar sin romper la partida | Configuración separada con ajustes limitados de recursos y necesidades |

Cada bloque se prueba antes de ampliar población o catálogo. La primera experiencia completa puede tener pocos edificios y una sola transición; debe mostrar el bucle entero.

## Límites de la primera versión

No se han definido combate, guerras, diplomacia, multijugador, comercio entre civilizaciones, genética o relaciones familiares. No se presupone que deban añadirse por usar esas referencias. Si entran después, deben sostener la identidad central y respetar la facilidad de uso móvil.

No se fija monetización ni una cantidad de eras definitiva. Las fechas de producción requieren medir el ritmo real de implementación; los bloques se ordenan por dependencias en lugar de prometer un calendario.

## Cómo reconocer que SideCity funciona

El jugador entiende a quién controla, qué tarea está haciendo y por qué. Puede construir su primer refugio sin una explicación larga. Al dejar de dar órdenes, el asentamiento sigue siendo comprensible. Cuando vuelve a mirar el mapa, reconoce un lugar que sus decisiones han cambiado.
