# Punto de continuación · SideCity 0.7

Nuevo: densidad de sprites según zoom/DPR y terreno cercano a resolución física; cachés con límite de píxeles. Foley procedural original en foley.js, director independiente en audio-director.js, buses Web Audio en game-audio.js y controles en audio-ui.js. Botón junto a Pausar y preferencias separadas; pausa, silencio y suspensión sin cola al volver. Ver docs/AUDIO-RENDER.md.

Cámara de ocho orientaciones: giro suave, proyección coherente para selección, obras, rutas, zoom y minimapa. Modelos originales con volumen y colores planos conservan el aspecto ilustrado. Personajes retocados con cambios pequeños. Menús contextuales, controles por función configurables y distribución móvil compacta. Ver docs/CAMERA.md.

Se conservan construcción libre, puentes transitables, recursos, oficios, familias y esquema de guardado 5 con migración de 1–4. Cuatro destinos: Terreno / Construir / Almacén / Comunidad; un inspector visible. npm start, npm test (63 pruebas), npm run build. Sin dependencias externas. GitHub sukyozumaru/SideCity ya es público por petición expresa del usuario.

Sites usa el project_id de .openai/hosting.json; conservar identidad y audiencia. El usuario rechazó conectar Vercel: no volver a sugerirlo sin una nueva petición. Esta actualización mantiene el enlace existente. No afirmar que su dirección ha cambiado ni alterar el acceso del sitio por hacer público GitHub.

Próximos bloques pendientes: fundición/agricultura, demolición/traslado, relaciones más profundas y ciclo vital. No añadirlos sin definir el siguiente bloque con el usuario. Safari/iPhone físico y rendimiento real allí siguen pendientes.
