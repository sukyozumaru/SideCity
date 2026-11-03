import { Camera, Gestures, createWorld, unproject, clamp } from './core.js';
import { Renderer } from './renderer.js';
import { loadSimulation, saveSimulation } from './persistence.js';
import { PeopleUI } from './people-ui.js';
import { WorldUI } from './world-ui.js';
import { InventoryUI } from './inventory-ui.js';
import { BuildUI } from './build-ui.js';
import { CommunityUI } from './community-ui.js';

const $ = id => document.getElementById(id);
const canvas = $('world'), viewport = $('viewport');
const requestedSeed=Number(new URL(location.href).searchParams.get('seed'));
const world = createWorld(Number.isInteger(requestedSeed)&&requestedSeed>0&&requestedSeed<=2147483647?requestedSeed:48128), camera = new Camera(viewport.clientWidth, viewport.clientHeight);
const renderer = new Renderer(canvas, $('minimap'), world, camera);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
renderer.reducedMotion = motionPreference.matches;
motionPreference.addEventListener('change', e => { renderer.reducedMotion = e.matches; invalidate(); });
let dirty = true, lastDraw = 0, saveTimer;
const invalidate = () => { dirty = true; };
let storage;
try { storage = localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Almacenamiento no disponible.'); } }; }
const loaded = loadSimulation(world, storage), simulation = loaded.simulation;
renderer.simulation = simulation;
const peopleUI = new PeopleUI(simulation, renderer, camera, () => { invalidate();saveView(); });
let replacingSave=false;
const worldUI=new WorldUI(simulation,renderer,peopleUI,persist,invalidate,candidate=>{saveSimulation(candidate,storage);replacingSave=true;});
const inventoryUI=new InventoryUI(simulation,peopleUI,invalidate);
const buildUI=new BuildUI(simulation,renderer,peopleUI,invalidate);
const communityUI=new CommunityUI(simulation,peopleUI,invalidate);
$('open-building-menu').onclick=()=>buildUI.open();
let paused = false, speed = 1, accumulator = 0, previousTime = 0, lastUI = 0, lastSave = 0, savedRevision = -1;
if (loaded.blocked) { $('save-status').textContent = 'Guardado protegido'; peopleUI.notify('El guardado no se pudo leer. Conservamos sus datos; esta sesión no los sobrescribirá.'); }
if (loaded.recovered) peopleUI.notify('Se recuperó la última copia válida de tu comunidad.');
function persist() {
  if (replacingSave) return true;
  if (loaded.blocked) return false;
  try { saveSimulation(simulation, storage); $('save-status').textContent = 'Guardado local'; savedRevision = simulation.revision; return true; }
  catch { $('save-status').textContent = 'No se pudo guardar'; return false; }
}
$('pause-sim').onclick = () => { paused = !paused; $('pause-sim').textContent = paused ? 'Continuar' : 'Pausar'; $('pause-sim').setAttribute('aria-pressed', String(paused)); };
$('sim-speed').onclick = () => { speed = speed === 1 ? 3 : 1; $('sim-speed').textContent = `${speed}×`; };
function saveView() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(`sidecity-camera-v1-${world.seed}`, JSON.stringify({ seed: world.seed, x: camera.x, y: camera.y, zoom: camera.zoom, grid: renderer.grid })); } catch { /* Camera preferences are optional; terrain remains usable. */ }
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
  if(buildUI.kind){buildUI.select(cellAt(x,y));return;}
  inventoryUI.close();
  if (peopleUI.tap(x, y)) return;
  const tile = cellAt(x, y);
  if(tile&&!simulation.isUnlocked(tile.x,tile.y)){worldUI.inspect(tile);return;}
  if (peopleUI.selected.length) { peopleUI.interact(x, y); return; }
  renderer.selected = tile;
  $('parcel').hidden = !tile;
  if (!tile) { invalidate(); return; }
  const name = tile.type === 'water' ? 'Río' : tile.type === 'bank' ? 'Ribera' : tile.tree ? 'Arboleda' : 'Pradera';
  $('parcel-name').textContent = name;
  $('parcel-description').textContent = tile.type === 'water' ? 'El río cruza el valle. Esta parcela está cubierta de agua.' : tile.type === 'bank' ? 'Una franja de tierra y juncos junto al agua.' : tile.tree ? 'Vegetación del valle. Un lugar para conservar o integrar en el futuro barrio.' : 'Terreno despejado. Aquí empieza a tomar forma tu próximo barrio.';
  $('parcel-coordinates').textContent = `${tile.x + 1} / ${tile.y + 1}`;
  $('parcel-state').textContent = tile.type === 'water' ? 'Agua' : tile.type === 'bank' ? 'Orilla natural' : tile.tree ? 'Con vegetación' : 'Despejado';
  $('status').textContent = `${name}. Parcela ${tile.x + 1}, ${tile.y + 1}.`;
  worldUI.inspect(tile);
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
$('explore').onclick = () => { buildUI.close();communityUI.close();inventoryUI.close();peopleUI.choose([]); clearSelection(); canvas.focus(); };
$('close-parcel').onclick = clearSelection;
$('minimap').addEventListener('pointerdown', e => {
  const r = $('minimap').getBoundingClientRect();
  camera.x = ((e.clientX - r.left) * 192 / r.width - renderer.mini.x) / renderer.mini.scale;
  camera.y = ((e.clientY - r.top) * 112 / r.height - renderer.mini.y) / renderer.mini.scale;
  camera.bound(); updateCamera();
});
$('minimap').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); camera.fit(); updateCamera(); } });
canvas.addEventListener('keydown', e => {
  const movement = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[e.key];
  if (movement) { e.preventDefault(); camera.pan(...movement); updateCamera(); }
  if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.25); }
  if (e.key === '-') { e.preventDefault(); zoomBy(.8); }
  if (e.key === 'Home') { e.preventDefault(); camera.home(); updateCamera(); }
  if (e.key === 'Escape') { peopleUI.choose([]); clearSelection(); }
  if (e.key === 'Enter') select(camera.width / 2, camera.height / 2);
});
$('help').onclick = () => { gestures.cancelAll(); $('help-dialog').showModal(); };
for (const id of ['close-help', 'start-exploring']) $(id).onclick = () => $('help-dialog').close();
new ResizeObserver(() => { gestures.cancelAll(); renderer.resize(viewport.clientWidth, viewport.clientHeight); camera.bound(); updateCamera(); }).observe(viewport);
renderer.resize(viewport.clientWidth, viewport.clientHeight); camera.home();
try {
  const saved = JSON.parse(localStorage.getItem(`sidecity-camera-v1-${world.seed}`)||localStorage.getItem('sidecity-camera-v1'));
  if (saved?.seed === world.seed && [saved.x, saved.y, saved.zoom].every(Number.isFinite)) {
    camera.x = saved.x; camera.y = saved.y; camera.zoom = clamp(saved.zoom, camera.minZoom, camera.maxZoom); camera.bound(); renderer.grid = saved.grid === true;
    $('grid').setAttribute('aria-pressed', String(renderer.grid)); $('grid').classList.toggle('active', renderer.grid);
  }
} catch { /* Invalid view preferences fall back to the meadow. */ }
updateCamera();
function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .25) : 0; previousTime = time;
  if (!document.hidden && !paused && !$('help-dialog').open && !$('world-dialog').open && !$('era-dialog').open) {
    accumulator += dt * speed;
    while (accumulator >= .1) { simulation.update(.1); accumulator -= .1; }
  }
  if (!document.hidden && time - lastUI >= 200) {
    peopleUI.refresh(); worldUI.refresh(); inventoryUI.refresh(); buildUI.refresh();communityUI.refresh(); lastUI = time;
    if (simulation.events.length) peopleUI.notify(simulation.events.splice(0).join(' '));
  }
  if (time - lastSave >= 5000 || simulation.revision !== savedRevision && time - lastSave >= 750) { persist(); lastSave = time; }
  const animated = simulation.people.some(p => p.job) && !paused;
  if (!document.hidden && (dirty || animated || !renderer.reducedMotion && time - lastDraw >= 65)) { renderer.draw(time); dirty = false; lastDraw = time; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { gestures.cancelAll(); canvas.classList.remove('dragging'); previousTime = 0; accumulator = 0; if (document.hidden) persist(); invalidate(); });
window.addEventListener('pagehide', persist);
requestAnimationFrame(frame);
