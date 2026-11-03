import { Camera, Gestures, createWorld, unproject, clamp } from './core.js';
import { Renderer } from './renderer.js';

const $ = id => document.getElementById(id);
const canvas = $('world'), viewport = $('viewport');
const world = createWorld(), camera = new Camera(viewport.clientWidth, viewport.clientHeight);
const renderer = new Renderer(canvas, $('minimap'), world, camera);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
renderer.reducedMotion = motionPreference.matches;
motionPreference.addEventListener('change', e => { renderer.reducedMotion = e.matches; invalidate(); });
let dirty = true, lastDraw = 0, saveTimer;
const invalidate = () => { dirty = true; };
function saveView() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem('sidecity-camera-v1', JSON.stringify({ seed: world.seed, x: camera.x, y: camera.y, zoom: camera.zoom, grid: renderer.grid })); } catch { /* Camera preferences are optional; terrain remains usable. */ }
  }, 250);
}
function updateCamera() {
  $('zoom-label').value = `${Math.round(camera.zoom * 100)}%`;
  $('zoom-in').disabled = camera.zoom >= camera.maxZoom;
  $('zoom-out').disabled = camera.zoom <= camera.minZoom;
  invalidate(); saveView();
}
function cellAt(x, y) {
  const p = camera.screenToWorld(x, y), q = unproject(p.x, p.y);
  return world.get(Math.floor(q.x), Math.floor(q.y));
}
function clearSelection() { renderer.selected = null; $('parcel').hidden = true; invalidate(); }
function select(x, y) {
  const tile = cellAt(x, y);
  renderer.selected = tile;
  $('parcel').hidden = !tile;
  if (!tile) { invalidate(); return; }
  const name = tile.type === 'water' ? 'Río' : tile.type === 'bank' ? 'Ribera' : tile.tree ? 'Arboleda' : 'Pradera';
  $('parcel-name').textContent = name;
  $('parcel-description').textContent = tile.type === 'water' ? 'El río cruza el valle. Esta parcela está cubierta de agua.' : tile.type === 'bank' ? 'Una franja de tierra y juncos junto al agua.' : tile.tree ? 'Vegetación del valle. Un lugar para conservar o integrar en el futuro barrio.' : 'Terreno despejado. Aquí empieza a tomar forma tu próximo barrio.';
  $('parcel-coordinates').textContent = `${tile.x + 1} / ${tile.y + 1}`;
  $('parcel-state').textContent = tile.type === 'water' ? 'Agua' : tile.type === 'bank' ? 'Orilla natural' : tile.tree ? 'Con vegetación' : 'Despejado';
  $('status').textContent = `${name}. Parcela ${tile.x + 1}, ${tile.y + 1}.`;
  invalidate();
}
const gestures = new Gestures(camera, select);
function local(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  const p = local(e); canvas.setPointerCapture(e.pointerId); gestures.down(e.pointerId, p.x, p.y); canvas.classList.add('dragging'); canvas.focus({ preventScroll: true });
});
canvas.addEventListener('pointermove', e => {
  const p = local(e); gestures.move(e.pointerId, p.x, p.y);
  renderer.hover = e.pointerType === 'mouse' && !gestures.points.size ? cellAt(p.x, p.y) : null;
  if (gestures.points.size) updateCamera(); else invalidate();
});
function end(e, cancelled = false) {
  if (!gestures.points.has(e.pointerId)) return;
  const p = local(e); gestures.up(e.pointerId, p.x, p.y, cancelled);
  if (!gestures.points.size) canvas.classList.remove('dragging');
  updateCamera();
}
canvas.addEventListener('pointerup', e => end(e));
canvas.addEventListener('pointercancel', e => end(e, true));
canvas.addEventListener('lostpointercapture', e => end(e, true));
canvas.addEventListener('pointerleave', () => { renderer.hover = null; invalidate(); });
window.addEventListener('blur', () => { gestures.cancelAll(); canvas.classList.remove('dragging'); });
canvas.addEventListener('wheel', e => {
  e.preventDefault(); const p = local(e), delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? camera.height : 1);
  camera.zoomAt(camera.zoom * Math.exp(-delta * .0015), p.x, p.y); updateCamera();
}, { passive: false });
function zoomBy(factor) { camera.zoomAt(camera.zoom * factor, camera.width / 2, camera.height / 2); updateCamera(); }
$('zoom-in').onclick = () => zoomBy(1.25);
$('zoom-out').onclick = () => zoomBy(.8);
$('home').onclick = () => { camera.home(); updateCamera(); };
$('fit').onclick = () => { camera.fit(); updateCamera(); };
$('grid').onclick = () => { renderer.grid = !renderer.grid; $('grid').setAttribute('aria-pressed', String(renderer.grid)); $('grid').classList.toggle('active', renderer.grid); invalidate(); saveView(); };
$('explore').onclick = () => { clearSelection(); canvas.focus(); };
$('close-parcel').onclick = clearSelection;
$('minimap').addEventListener('pointerdown', e => {
  const r = $('minimap').getBoundingClientRect();
  camera.x = ((e.clientX - r.left) * 192 / r.width - 96) / .046;
  camera.y = ((e.clientY - r.top) * 112 / r.height - 8) / .046;
  camera.bound(); updateCamera();
});
$('minimap').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); camera.fit(); updateCamera(); } });
canvas.addEventListener('keydown', e => {
  const movement = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[e.key];
  if (movement) { e.preventDefault(); camera.pan(...movement); updateCamera(); }
  if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.25); }
  if (e.key === '-') { e.preventDefault(); zoomBy(.8); }
  if (e.key === 'Home') { e.preventDefault(); camera.home(); updateCamera(); }
  if (e.key === 'Escape') clearSelection();
  if (e.key === 'Enter') select(camera.width / 2, camera.height / 2);
});
$('help').onclick = () => { gestures.cancelAll(); $('help-dialog').showModal(); };
for (const id of ['close-help', 'start-exploring']) $(id).onclick = () => $('help-dialog').close();
new ResizeObserver(() => { gestures.cancelAll(); renderer.resize(viewport.clientWidth, viewport.clientHeight); camera.bound(); updateCamera(); }).observe(viewport);
renderer.resize(viewport.clientWidth, viewport.clientHeight); camera.home();
try {
  const saved = JSON.parse(localStorage.getItem('sidecity-camera-v1'));
  if (saved?.seed === world.seed && [saved.x, saved.y, saved.zoom].every(Number.isFinite)) {
    camera.x = saved.x; camera.y = saved.y; camera.zoom = clamp(saved.zoom, camera.minZoom, camera.maxZoom); camera.bound(); renderer.grid = saved.grid === true;
    $('grid').setAttribute('aria-pressed', String(renderer.grid)); $('grid').classList.toggle('active', renderer.grid);
  }
} catch { /* Invalid view preferences fall back to the meadow. */ }
updateCamera();
function frame(time) {
  if (!document.hidden && (dirty || !renderer.reducedMotion && time - lastDraw >= 65)) { renderer.draw(time); dirty = false; lastDraw = time; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { gestures.cancelAll(); canvas.classList.remove('dragging'); invalidate(); });
requestAnimationFrame(frame);
