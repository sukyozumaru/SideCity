import { Camera, Gestures, createWorld, unproject, clamp } from './core.js';
import { Renderer } from './renderer.js';
import { loadSimulation, saveSimulation } from './persistence.js';
import { PeopleUI } from './people-ui.js';
import { WorldUI } from './world-ui.js';
import { InventoryUI } from './inventory-ui.js';
import { BuildUI } from './build-ui.js';
import { CommunityUI } from './community-ui.js';
import { ContextUI } from './context-ui.js';
import { ControlsUI } from './controls-ui.js';
import { InputActions,ACTIONS,keyLabel } from './input-actions.js';
import { VIEW_NAMES } from './projection.js';
import { GameAudio } from './game-audio.js';
import { AudioUI } from './audio-ui.js';

const $ = id => document.getElementById(id);
const canvas = $('world'), viewport = $('viewport');
const requestedSeed=Number(new URL(location.href).searchParams.get('seed'));
const world = createWorld(Number.isInteger(requestedSeed)&&requestedSeed>0&&requestedSeed<=2147483647?requestedSeed:48128), camera = new Camera(viewport.clientWidth, viewport.clientHeight);
const renderer = new Renderer(canvas, $('minimap'), world, camera);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
renderer.reducedMotion = motionPreference.matches;
motionPreference.addEventListener('change',e=>{renderer.reducedMotion=e.matches;applyControls();invalidate();});
let dirty = true, lastDraw = 0, saveTimer;
const invalidate = () => { dirty = true; };
let storage;
try { storage = localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Almacenamiento no disponible.'); } }; }
const loaded = loadSimulation(world, storage), simulation = loaded.simulation;
renderer.simulation = simulation;
const audio=new GameAudio(storage);new AudioUI(audio);
const peopleUI = new PeopleUI(simulation, renderer, camera, () => { invalidate();saveView(); });
let replacingSave=false;
const worldUI=new WorldUI(simulation,renderer,peopleUI,persist,invalidate,candidate=>{saveSimulation(candidate,storage);replacingSave=true;});
const inventoryUI=new InventoryUI(simulation,peopleUI,invalidate);
const buildUI=new BuildUI(simulation,renderer,peopleUI,invalidate);
const communityUI=new CommunityUI(simulation,peopleUI,invalidate);
const contextUI=new ContextUI(simulation,renderer,peopleUI,invalidate);
const controlsUI=new ControlsUI(applyControls);
const input=new InputActions(controlsUI.settings,runAction);
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
    try { localStorage.setItem(`sidecity-camera-v1-${world.seed}`, JSON.stringify({ seed: world.seed, x: camera.x, y: camera.y, zoom: camera.zoom, view:camera.view, grid: renderer.grid })); } catch { /* Camera preferences are optional; terrain remains usable. */ }
  }, 250);
}
function updateCompass(){const north=camera.projectGrid(0,-1);$('compass-arrow').style.transform=`rotate(${Math.atan2(north.x,-north.y)*180/Math.PI}deg)`;}
function updateCamera() {
  $('camera-direction').value=VIEW_NAMES[camera.view].split(' ').at(-1);$('camera-mode').textContent=camera.view%2?'Frontal':'Isométrica';$('camera-direction').setAttribute('aria-label',VIEW_NAMES[camera.view]);
  updateCompass();
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
function select(x,y,forceContext=false){
 if(buildUI.kind&&!forceContext){buildUI.select(cellAt(x,y));return;}
 if(!forceContext&&peopleUI.tap(x,y))return;
 const target=contextUI.pick(x,y,forceContext);if(!target)return;
 if(target.type==='locked'){document.dispatchEvent(new CustomEvent('sidecity:panel-open',{detail:'parcel'}));worldUI.inspect(world.get(target.x,target.y));invalidate();return;}
 if(target.type==='ground'&&!forceContext&&peopleUI.selected.length){peopleUI.order('move',{x:target.x,y:target.y});return;}
 if(controlsUI.settings.quickOrders&&!forceContext&&peopleUI.selected.length){contextUI.quick(target,[...peopleUI.selected]);return;}
 contextUI.open(target);
}
peopleUI.onInteract=(x,y)=>{select(x,y);return true;};
function applyControls(){input.settings=controlsUI.settings;gestures.dragSpeed=controlsUI.settings.dragSpeed;gestures.zoomSpeed=controlsUI.settings.zoomSpeed;camera.smoothRotation=controlsUI.settings.smoothRotation&&!motionPreference.matches;if(!camera.smoothRotation&&camera.rotating)camera.setView(camera.view,{animate:false});for(const [button,action] of Object.entries({"rotate-left":"rotateLeft","rotate-right":"rotateRight",home:"resetView",fit:"fitView",grid:"grid","zoom-in":"zoomIn","zoom-out":"zoomOut","controls-open":"controls"}))$(button).title=`${ACTIONS[action].name} · ${keyLabel(controlsUI.settings.bindings[action])}`;updateCamera();}
function runAction(id){
 const actions={rotateLeft:()=>{camera.rotate(-1);updateCamera();},rotateRight:()=>{camera.rotate(1);updateCamera();},resetView:()=>{camera.home();updateCamera();},fitView:()=>{camera.fit();updateCamera();},zoomIn:()=>zoomBy(1.25),zoomOut:()=>zoomBy(.8),grid:()=>{renderer.grid=!renderer.grid;$('grid').setAttribute('aria-pressed',String(renderer.grid));updateCamera();},build:()=>buildUI.open(),stock:()=>inventoryUI.open(),community:()=>communityUI.open(),controls:()=>{input.clear();gestures.cancelAll();controlsUI.open();},pause:()=>$('pause-sim').click(),stop:()=>$('stop-work').click(),rotateBuilding:()=>{if(buildUI.kind)$('rotate-build').click();},interact:()=>{if(buildUI.kind){if(!$('confirm-placement').disabled)$('confirm-placement').click();}else if(contextUI.target){const button=$('context-actions').querySelector('button');if(button&&!button.disabled)button.click();}else select(camera.width/2,camera.height/2,true);}};
 if(actions[id])actions[id]();else if(peopleUI.selected.length)peopleUI.order(id);else peopleUI.notify('Selecciona primero a quien hará la tarea.');
}

const gestures = new Gestures(camera, select);
const cameraRail=$('camera-controls');
$('camera-more').onclick=()=>{const expanded=cameraRail.classList.toggle('expanded');$('camera-more').setAttribute('aria-expanded',String(expanded));$('camera-more').setAttribute('aria-label',expanded?'Ocultar más controles de cámara':'Más controles de cámara');};
document.addEventListener('sidecity:panel-open',()=>{cameraRail.classList.remove('expanded');$('camera-more').setAttribute('aria-expanded','false');});
let longPressTimer=null,pressPoint=null;
applyControls();
function local(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  const p=local(e);clearTimeout(longPressTimer);pressPoint=p;if(e.pointerType==='touch'&&gestures.points.size===0)longPressTimer=setTimeout(()=>{if(gestures.points.size===1&&!gestures.tap?.moved){gestures.cancelAll();canvas.classList.remove('dragging');select(p.x,p.y,true);}},550); canvas.setPointerCapture(e.pointerId); gestures.down(e.pointerId, p.x, p.y); canvas.classList.add('dragging'); canvas.focus({ preventScroll: true });
});
canvas.addEventListener('pointermove', e => {
  const p=local(e);if(pressPoint&&Math.hypot(p.x-pressPoint.x,p.y-pressPoint.y)>6)clearTimeout(longPressTimer); gestures.move(e.pointerId, p.x, p.y);
  renderer.hover = e.pointerType === 'mouse' && !gestures.points.size ? cellAt(p.x, p.y) : null;
  if (gestures.points.size) updateCamera(); else invalidate();
});
function end(e,cancelled=false){clearTimeout(longPressTimer);
  if (!gestures.points.has(e.pointerId)) return;
  const p = local(e); gestures.up(e.pointerId, p.x, p.y, cancelled);
  if (!gestures.points.size) canvas.classList.remove('dragging');
  updateCamera();
}
canvas.addEventListener('pointerup', e => end(e));
canvas.addEventListener('pointercancel', e => end(e, true));
canvas.addEventListener('lostpointercapture', e => end(e, true));
canvas.addEventListener('pointerleave', () => { renderer.hover = null; invalidate(); });
window.addEventListener('blur',()=>{clearTimeout(longPressTimer);input.clear();gestures.cancelAll();canvas.classList.remove('dragging');});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();const p=local(e);select(p.x,p.y,true);});
canvas.addEventListener('wheel', e => {
  e.preventDefault(); const p = local(e), delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? camera.height : 1);
  camera.zoomAt(camera.zoom * Math.exp(-delta*.0015*controlsUI.settings.zoomSpeed*(controlsUI.settings.invertWheel?-1:1)), p.x, p.y); updateCamera();
}, { passive: false });
function zoomBy(factor) { camera.zoomAt(camera.zoom * factor, camera.width / 2, camera.height / 2); updateCamera(); }
$('explore').onclick = () => { buildUI.close();communityUI.close();inventoryUI.close();peopleUI.choose([]); clearSelection(); canvas.focus(); };
$('close-parcel').onclick = clearSelection;
$('minimap').addEventListener('pointerdown', e => {
  const r = $('minimap').getBoundingClientRect();
  camera.x = ((e.clientX - r.left) * 192 / r.width - renderer.mini.x) / renderer.mini.scale;
  camera.y = ((e.clientY - r.top) * 112 / r.height - renderer.mini.y) / renderer.mini.scale;
  camera.bound(); updateCamera();
});
$('minimap').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); camera.fit(); updateCamera(); } });
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea,[contenteditable="true"]'))return;
 if(e.key==='Escape'){e.preventDefault();if(contextUI.target)contextUI.close(true);else{buildUI.close();communityUI.close();inventoryUI.close();peopleUI.choose([]);clearSelection();}input.clear();return;}
 if(e.key==='Enter'&&e.target===canvas){e.preventDefault();runAction('interact');return;}
 if(e.code==='Space'&&e.target.closest('button'))return;
 if(input.press(e.code,e.repeat))e.preventDefault();
});
document.addEventListener('keyup',e=>input.release(e.code));
$('help').onclick = () => { gestures.cancelAll(); $('help-dialog').showModal(); };
for (const id of ['close-help', 'start-exploring']) $(id).onclick = () => $('help-dialog').close();
new ResizeObserver(() => { gestures.cancelAll(); renderer.resize(viewport.clientWidth, viewport.clientHeight); camera.bound(); updateCamera(); }).observe(viewport);
renderer.resize(viewport.clientWidth, viewport.clientHeight); camera.home();
try {
  const saved = JSON.parse(localStorage.getItem(`sidecity-camera-v1-${world.seed}`)||localStorage.getItem('sidecity-camera-v1'));
  if (saved?.seed === world.seed && [saved.x, saved.y, saved.zoom].every(Number.isFinite)) {
    camera.setView(Number.isInteger(saved.view)&&saved.view>=0&&saved.view<8?saved.view:0,{animate:false});camera.x = saved.x; camera.y = saved.y; camera.zoom = clamp(saved.zoom, camera.minZoom, camera.maxZoom); camera.bound(); renderer.grid = saved.grid === true;
    $('grid').setAttribute('aria-pressed', String(renderer.grid)); $('grid').classList.toggle('active', renderer.grid);
  }
} catch { /* Invalid view preferences fall back to the meadow. */ }
updateCamera();
for(const[id,action]of Object.entries({"rotate-left":"rotateLeft","rotate-right":"rotateRight",home:"resetView",fit:"fitView",grid:"grid","zoom-in":"zoomIn","zoom-out":"zoomOut","camp-status":"build","stock-open":"stock","community-open":"community","controls-open":"controls"}))$(id).onclick=()=>runAction(action);
function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .25) : 0; previousTime = time;
  if(camera.update(dt)){updateCompass();invalidate();}
  if(document.querySelector('dialog[open]'))input.clear();else if(!document.hidden){const pan=input.pan(dt);if(pan.x||pan.y){camera.pan(pan.x,pan.y);updateCamera();}}
  if (!document.hidden && !paused && !$('help-dialog').open && !$('world-dialog').open && !$('era-dialog').open && !$('controls-dialog').open) {
    accumulator += dt * speed;
    while (accumulator >= .1) { simulation.update(.1); accumulator -= .1; }
  }
  if (!document.hidden && time - lastUI >= 200) {
    peopleUI.refresh(); worldUI.refresh(); inventoryUI.refresh(); buildUI.refresh();communityUI.refresh();contextUI.refresh(); lastUI = time;
    if (simulation.events.length) peopleUI.notify(simulation.events.splice(0).join(' '));
  }
  if (time - lastSave >= 5000 || simulation.revision !== savedRevision && time - lastSave >= 750) { persist(); lastSave = time; }
  const animated = simulation.people.some(p => p.job) && !paused;
  audio.update(simulation,camera,{active:!document.hidden&&!paused&&!document.querySelector('dialog[open]')});
  if (!document.hidden && (dirty || animated || !renderer.reducedMotion && time - lastDraw >= 65)) { renderer.draw(time); dirty = false; lastDraw = time; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { input.clear();gestures.cancelAll(); canvas.classList.remove('dragging'); previousTime = 0; accumulator = 0; if (document.hidden){persist();audio.hide();}else audio.resume(); invalidate(); });
window.addEventListener('pagehide', persist);
window.addEventListener('pagehide',()=>audio.dispose());
requestAnimationFrame(frame);
