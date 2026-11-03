# Punto de continuación · SideCity 0.4

Conservar el arte isométrico aprobado, tres fundadores, mapa completo y HUD verde oscuro. El juego tiene almacén separado, fabricación y extracción temprana; no rehacer estos sistemas.

Estado vigente: docs/INVENTORY.md, docs/REFUGE.md, docs/WORLD.md y docs/PLAN.md. Mundo procedural 96 × 72, sectores de 144 comprables, refugio cooperativo, tareas/cuidado y barra de Orígenes. Hacha/pico comunes con recetas atómicas; Minería séptima habilidad y vetas finitas. Comer consume comida o bayas. Esquema 4 migra 1–3. Mundo y semilla descarga/importa JSON para trasladar partidas entre orígenes; no hay sincronización automática.

Verificado: 42 pruebas, UI en Chrome con perfil temporal aislado, importación/recarga, fabricación y costes, comidas, móvil vertical/horizontal/tableta. Inspector HUD 0 FAIL / 0 WARN. Safari/iPhone físico pendiente.

Ejecutar npm start y abrir http://127.0.0.1:4173. npm test verifica reglas; npm run build copia solo index.html y src a dist para alojar. Identidad de Sites en .openai/hosting.json: conservar ese project_id y audiencia privada; no crear otro Site para actualizaciones. Acceso previsto https://sidecity-valle.colominegabito.chatgpt.site, verificar estado de publicación en Sites si se retoma una entrega interrumpida. GitHub privado: sukyozumaru/SideCity.

Siguiente bloque sugerido: colocación de construcciones y puentes, seguido de fundición/agricultura con desbloqueos reales. Hierro/plata requieren tecnología futura; no hay transición completa de era, población creciente, hambre ni sandbox completo todavía.
