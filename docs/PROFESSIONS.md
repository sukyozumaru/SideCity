# Tareas, habilidades y profesiones · versión 0.2

Cada fundador aprende haciendo. La inspiración indicada por el usuario es el progreso por habilidades de RuneScape, WorldBox y RimWorld. La implementación utiliza sus propias reglas y valores; no replica las fórmulas de esos juegos.

## Controles y menús

Seleccionar a Ana, Ivo o Nara desde su retrato o en el mapa. La ficha tiene tres pestañas:

- **Tareas:** asignar un trabajo, ver su progreso y detenerlo. Las tareas bloqueadas explican el requisito.
- **Habilidades:** nivel, XP acumulada, progreso al próximo nivel, trabajos completados y segundos de práctica simulada. La elección de especialidad se despliega debajo.
- **Historial:** últimos 20 resultados con actividad, XP obtenida y momento de la sesión.

Todos permite dar una orden a los tres. Cada uno conserva sus estadísticas. Tocar tierra con un habitante seleccionado ordena un desplazamiento; arrastre, pellizco y cancelación siguen reservados a la cámara. Explorar en la barra inferior cierra la ficha para inspeccionar el terreno.

## Trabajos iniciales

| Actividad | Resultado por ciclo | Experiencia | Duración base de trabajo |
| --- | --- | --- | --- |
| Talar | 4 madera; cada árbol permite tres ciclos y queda un tocón | 14 de Tala | 5 s |
| Recolectar | 1 alimento; los arbustos se agotan | 10 de Recolección | 4 s |
| Estudiar | 1 conocimiento | 16 de Investigación | 8 s |
| Explorar | Reconocer una parcela nueva para esa persona | 12 de Exploración | 3 s, además del viaje |
| Preparar fogón | Un único fogón comunitario; requiere conocimiento del fuego y 5 madera | 25 de Construcción | 8 s |
| Cocinar | Consume 1 alimento y 1 madera; produce 1 comida | 14 de Cocina | 6 s |

Las rutas evitan agua y árboles en pie. Los trabajos de producción se repiten hasta detenerlos o agotar recursos accesibles. Cocinar espera si faltan ingredientes y retoma al reponerse. No se cobran materiales hasta completar una acción válida; dos trabajadores no duplican el último recurso ni el primer fogón.

Estudiar hasta obtener 3 de conocimiento descubre **fuego controlado**. Es el primer desbloqueo funcional de esta versión. Eras completas, recetas múltiples y nuevos inventos siguen en el plan de desarrollo.

## Experiencia y nivel

Cada persona tiene seis registros independientes. Caminar, asignar, cancelar o esperar no da XP. Solo un resultado completado concede la experiencia de su actividad. Los segundos de práctica sí incluyen trabajo parcial y se guardan como tiempo, sin convertirlos por sí solos en XP.

El umbral acumulado del nivel N es `20 × (N − 1) × N`. Todos empiezan en nivel 1; el máximo inicial es 20. Nivel 2 requiere 40 XP y nivel 3 requiere 120 XP. Cada nivel añade un 4% de eficiencia a ese trabajo. Los costes crecen y la experiencia se limita al máximo; el historial informa la XP realmente ganada.

Sin especialidad elegida, la ficha reconoce la actividad en la que más ha aprendido. Elegir un oficio preferido añade un 10% de eficiencia en esa actividad; no borra ni transfiere experiencia de otras habilidades y no asigna automáticamente una tarea. El nivel del oficio es el de su habilidad correspondiente.

Estos valores son un primer balance para probar el bucle. No hay pérdida por inactividad, castigos diarios ni progreso mientras la pestaña está oculta. Se puede pausar o usar velocidad 3×.

## Persistencia

Guardado local versionado con tres identidades estables, XP, práctica, trabajos completados, especialidad, últimos resultados, órdenes, recursos finitos y estado del fogón. Las rutas se reconstruyen al cargar y se conserva el progreso parcial del trabajo cuando sigue siendo válido. No se simula el tiempo transcurrido fuera del juego.

Se valida antes de escribir y se conserva la última copia válida. Si una carga falla se intenta la copia; si ambas fallan, la sesión nueva no sobrescribe esos datos. Un fallo de escritura aparece en el HUD. Este guardado es local al navegador y no es una cuenta en la nube.

## Alcance

No hay todavía hambre, descanso, viviendas, autonomía por oficio, crecimiento de población ni cambio completo de era. El inventario comunitario recibe los resultados directamente, sin transporte de cargas individual. Los tres fundadores pueden compartir rutas; la separación física de grupos se mejorará con el sistema de obras. La siguiente etapa es vivienda y encargos de construcción sobre esta base.
