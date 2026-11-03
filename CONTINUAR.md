# Punto de continuación · SideCity 0.3

Desarrollo retomado el 3 de noviembre de 2026. Conservar el arte isométrico aprobado, los tres fundadores y el mapa a pantalla completa con HUD verde oscuro.

## Implementado

- Mundo procedural por semilla de 96 × 72: 6.912 parcelas, triple superficie. La semilla original conserva el valle previo.
- Sectores iguales de 12 × 12: abrir un vecino cuesta inicialmente 8 madera y 1 saber; el coste crece. No se cobra una compra inválida.
- Primer refugio compartido: reserva única de 20 madera, fases visibles, aportaciones de los tres, pausa, reanudación y cancelación con devolución.
- Beber desde tierra junto al agua, descansar y dormir en tres puestos del refugio. Necesidades lentas, cuidado sin XP profesional.
- Movimiento suavizado, orientación y animaciones de trabajo/cuidado; interacción directa con árboles, arbustos, agua y refugio.
- Ramas y piedras recogibles; depósitos inspeccionables de piedra, carbón, hierro, cobre, estaño y plata. Bronce previsto como aleación.
- Mini barra de Orígenes con etapa, logros, porcentaje, reloj y año ficticio.
- Menús móviles Trabajar / Construir / Cuidarse, niveles visibles primero. Guardado por semilla con migración de partidas anteriores.

## Verificado

33 pruebas pasan con npm test. Recorrido real en Chrome: recolección, construcción de los tres, sueño, bebida, recarga, compra de 144 parcelas y cambio de semilla conservando partidas; sin errores de JavaScript. Revisión visual a 1440, 768 y 390 píxeles: 0 FAIL / 0 WARN. También se revisaron menús móviles y horizontal. Safari/iPhone físico y rendimiento en ese dispositivo siguen pendientes.

## Retomar

1. Ejecutar npm start y abrir http://127.0.0.1:4173.
2. Leer docs/REFUGE.md, docs/WORLD.md y docs/PLAN.md para las reglas actuales.
3. Próximo bloque sugerido: extracción de piedra y mineral con herramientas, recetas y desbloqueos coherentes con la era; después colocación libre de construcciones y puentes.

Minería, fundición, agricultura, población creciente, transiciones completas de era y sandbox completo aún no están implementados. El 100% de Orígenes establece el campamento, sin inventar contenido de la siguiente era.

Código principal: src/terrain.js, src/simulation.js, src/camp.js, src/era.js, src/world-ui.js, src/people-ui.js y los módulos de dibujo. Módulos nativos sin dependencias. legacy/ conserva el HTML antiguo y no es la aplicación activa.
