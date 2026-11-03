# SideCity

Simulador de ciudades para navegador y móvil: construir un barrio, conectarlo, cubrir sus necesidades y verlo crecer en un mundo isométrico 2.5D.

## Estado real

Esta base conserva el prototipo lateral recuperado del chat anterior. La entrega isométrica 48 × 48 fue anunciada en ese chat, pero su ZIP y su código todavía no están disponibles aquí. No se presenta el prototipo archivado como esa entrega.

- `legacy/SideCity-previous.html`: copia intacta del prototipo recuperado.
- `docs/PLAN.md`: dirección del juego, etapas y criterios para cerrar cada etapa.
- `docs/AUDIT.md`: hallazgos del código disponible y límites de la revisión.
- `docs/ART_DIRECTION.md`: especificación gráfica y de interacción propuesta.
- `scripts/audit-legacy.mjs`: comprobación reproducible de dos problemas económicos del prototipo.

## Continuar

Primero incorporar el último `SideCity-Codex.zip`, comprobar su contenido y comparar sus sistemas con el prototipo archivado. Si no se recupera, reconstruir explícitamente la etapa isométrica sobre esta base, conservando el original.

El prototipo archivado es un único HTML autocontenido. Puede abrirse en un navegador de escritorio; no equivale a una versión publicada para Safari en iPhone. Para comprobar los hallazgos de lógica con Node instalado:

```sh
node scripts/audit-legacy.mjs
```

No hay versión de producción, despliegue público ni backend de cuentas configurados. El proyecto se desarrolla en un repositorio privado. No se incorpora una licencia de código abierto.
