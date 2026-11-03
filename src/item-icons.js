// Original small line drawings: the same materials as the isometric world.
const shapes = {
  wood: '<path fill="#94714d" d="m6 21 17-11 5 7-17 11z"/><path d="m10 23 13-8M6 21l5 7M22 10l6 7"/><ellipse cx="9" cy="25" rx="3" ry="4" transform="rotate(-35 9 25)"/>',
  stone: '<path fill="#a5a58e" d="m5 24 2-12 10-6 11 10-4 11-13 1z"/><path d="m7 12 12 5 9-1M19 17l-2 11"/>',
  coal: '<path fill="#657064" d="m5 24 2-12 10-6 11 10-4 11-13 1z"/><path d="m7 12 12 5 9-1M19 17l-2 11"/>',
  ore: '<path fill="#99816a" d="m5 24 2-12 10-6 11 10-4 11-13 1z"/><path d="m7 12 12 5 9-1M19 17l-2 11"/><path stroke="#c5bc8f" d="m10 15 3 5m10 0-3 4"/>',
  berries: '<path d="m16 17 2-11m-2 8-6-4m7 2 7-5"/><path fill="#9cb26d" d="m17 10 0-6 8 0-5 6z"/><g fill="#be7861"><circle cx="10" cy="20" r="5"/><circle cx="21" cy="20" r="5"/><circle cx="16" cy="26" r="5"/></g>',
  meal: '<path fill="#b69c6e" d="M5 16h24l-4 11H9z"/><path d="M5 16q12-9 24 0M12 7l1-3m7 3 2-3"/><path stroke="#9fb674" d="m12 14 3-2m5 3 3-2"/>',
  axe: '<path stroke="#b89969" stroke-width="4" d="m10 28 12-22"/><path fill="#a5ad9b" d="m17 7 6-4 6 5-2 8-8-3z"/>',
  pick: '<path stroke="#b89969" stroke-width="4" d="m10 28 11-21"/><path fill="#a5ad9b" d="m7 9 10-5 8 3 5 8-11-5-12 2z"/>',
  knowledge: '<path fill="#aebc8b" d="m5 7 10-3 13 5v19l-13-5-10 3z"/><path d="M15 4v19M8 11l4-1m7 1 6 2m-6 4 6 2"/>',
};
export function itemIcon(kind) {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 34 34');svg.setAttribute('aria-hidden','true');svg.classList.add('item-icon');svg.innerHTML=shapes[kind]||shapes.stone;return svg;
}
