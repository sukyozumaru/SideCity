# Auditoría de la base recuperada

Fecha: 3 de noviembre de 2026. Fuente: lectura estática de `legacy/SideCity-previous.html` y comprobaciones aisladas de lógica. No constituye una prueba de juego completa ni una evaluación del ZIP isométrico que falta.

## Lo que existe en el archivo

| Área | Evidencia | Implicación |
| --- | --- | --- |
| Plataforma | HTML, CSS, JavaScript, Canvas 2D, WebAudio y localStorage, sin librerías externas | Conservar la base web; no hace falta migrar de motor para definir el primer barrio |
| Terreno | `WORLD=3200`, `GROUND=512`, colocación por coordenada X | Es un prototipo lateral: falta verificar o recuperar el mundo isométrico anunciado |
| Construcción | 28 tipos en seis categorías, coste, bloqueo por nivel, mejoras y demolición | Hay catálogo y reglas reutilizables, aunque las dimensiones mezclan altura visual y ocupación |
| Recursos | Población, felicidad, energía, agua y comida | El suministro se calcula globalmente; no existe una red de distribución por barrios |
| Progresión | Aldea, Pueblo, Villa, Ciudad, Metrópolis y Megaciudad | Seis hitos existentes que necesitan objetivos distintos y un balance medido |
| Vida urbana | Hasta 35 personas y 8 vehículos; circulación en segmentos horizontales | Movimiento decorativo; no demuestra viajes entre hogares y empleos ni tráfico de una red 2D |
| Contenido | Seis plantillas de misión, logros, descubrimientos, eventos, caos y sandbox | Mucha amplitud antes de consolidar la simulación central |
| Entrada | Pointer Events, arrastre, pellizco, rueda y pulsación larga | Deben comprobarse cancelaciones, transición de dos dedos a uno y selección en profundidad |
| Guardado | Estado completo en localStorage cada 10 segundos y al ocultar la página | Tiene persistencia básica, sin un esquema de datos completo ni recuperación visible ante errores |

## Problemas que deben resolverse antes de equilibrar

1. **Recompensas repetidas sin una nueva acción.** `newMissions()` excluye solo las misiones activas, no las ya completadas. Una condición permanente, como tres hogares o cinco edificios construidos, puede volver a asignarse y cobrar otra vez en `checkProgress()`. Guardar un registro de objetivos cumplidos o generar contratos con una línea base y progreso nuevo.
2. **Dinero al construir y demoler en sandbox.** La construcción gratuita no cobra, pero la demolición sigue devolviendo un porcentaje del coste. Separar las partidas y sus economías; una acción gratuita no debe producir un reembolso en una economía normal.
3. **Carga de datos insuficientemente validada.** `load()` valida parte de edificios y misiones, pero combina el resto del objeto con el estado. Añadir límites para dinero, niveles, matrices y ocupación, versión de esquema y copia recuperable; informar de un guardado fallido.
4. **Simulación y dibujo acoplados.** Hay generación de partículas aleatoria dentro del dibujo de edificios. El renderizado no debe modificar el estado de simulación; de lo contrario, la tasa de cuadros cambia el resultado visual y el trabajo realizado.
5. **Progreso urbano demasiado inmediato.** La población deriva de la capacidad construida; no hay ocupación gradual ni relación entre hogar, trabajo y acceso. Añadir demanda y ocupación después de consolidar construcción y red vial.
6. **Sistemas superpuestos en un archivo.** UI, economía, cámara, datos y guardado comparten variables globales. Extraer módulos por sistema cuando llegue la versión más reciente, con pruebas de reglas antes de cambiar su comportamiento.

## Límites

No se ha comprobado la entrega isométrica 48 × 48 ni las pruebas anunciadas por el chat anterior. No se afirma compatibilidad real con iPhone, rendimiento medido ni ausencia de errores del juego completo. La comprobación aislada de economía usa las funciones extraídas del HTML; sustituye las salidas de audio y UI para no arrancar un navegador.
