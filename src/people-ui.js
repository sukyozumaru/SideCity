import { project, unproject } from './core.js';
import { SKILLS, TASKS, skillProgress, skillLevel, profession, MAX_LEVEL } from './simulation.js';
import { insideShelter } from './camp.js';
import { MINERALS } from './terrain.js';
const $ = id => document.getElementById(id);
export class PeopleUI {
  constructor(simulation, renderer, camera, onChange) {
    this.sim = simulation; this.renderer = renderer; this.camera = camera; this.onChange = onChange; this.selected = []; this.lastRevision = -1; this.noticeTimer = 0;
    for (const p of this.sim.people) {
      const button = document.createElement('button'); button.className = 'person-chip'; button.dataset.person = p.id; button.setAttribute('aria-pressed', 'false');
      const portrait = document.createElement('span'); portrait.className = 'portrait'; portrait.style.setProperty('--coat', p.color); portrait.style.setProperty('--hair', p.hair);
      const text = document.createElement('span'), name = document.createElement('strong'), state = document.createElement('small'); name.textContent = p.name; state.textContent = 'Libre'; state.dataset.state = p.id; text.append(name, state); button.append(portrait, text);
      button.onclick = () => { this.choose([p.id]); const point = project(p.x, p.y); camera.x = point.x + (camera.width > 700 ? 80 / camera.zoom : 0); camera.y = point.y + (camera.width < 700 ? 180 / camera.zoom : -35 / camera.zoom); camera.bound(); onChange(); };
      $('roster').append(button);
    }
    const all = document.createElement('button'); all.className = 'group-button'; all.textContent = 'Todos'; all.onclick = () => this.choose(this.sim.people.map(p => p.id)); $('roster').append(all);
    $('close-person').onclick = () => this.choose([]);
    $('stop-work').onclick = () => { this.selected.forEach(id => this.sim.stop(id)); this.onChange(); this.refresh(); };
    const none = document.createElement('option'); none.value = ''; none.textContent = 'Según lo que aprende'; $('specialty').append(none);
    for (const [id, task] of Object.entries(TASKS)) {
      const button = document.createElement('button'); button.className = 'task-row'; button.dataset.task = id;
      button.dataset.category = task.category;
      const label = document.createElement('strong'), detail = document.createElement('small'), level = document.createElement('span'); label.textContent = task.action; detail.textContent = task.detail; level.className = 'task-level'; button.append(label, detail, level);
      button.onclick = () => this.order(id); $('task-list').append(button);
    }
    for (const [id, skill] of Object.entries(SKILLS)) {
      const row = document.createElement('div'); row.className = 'skill-row'; row.dataset.skill = id;
      row.innerHTML = '<div><strong></strong><span></span></div><progress max="1" value="0"></progress><small></small>';
      row.querySelector('strong').textContent = skill.name; row.querySelector('progress').setAttribute('aria-label', `Experiencia de ${skill.name}`); $('skill-list').append(row);
      const option = document.createElement('option'); option.value = id; option.textContent = skill.profession; $('specialty').append(option);
    }
    $('specialty').onchange = () => { if (this.selected.length === 1) this.sim.setSpecialty(this.selected[0], $('specialty').value); this.refresh(); this.onChange(); };
    for (const category of ['work', 'build', 'care']) $('category-' + category).onclick = () => this.showCategory(category);
    $('cancel-shelter').onclick = () => { if (this.sim.cancelShelter()) this.notify('Materiales recuperados. Puedes empezar la obra de nuevo.'); this.refresh(); this.onChange(); };
    $('camp-status').onclick = () => { this.choose(this.sim.people.map(p => p.id)); this.showTab('tasks'); this.showCategory('build'); const p = project(20, 15); this.camera.x = p.x + 100 / camera.zoom; this.camera.y = p.y + (camera.width < 700 ? 170 / camera.zoom : 0); this.onChange(); };
    for (const tab of ['tasks', 'skills', 'history']) $('tab-' + tab).onclick = () => this.showTab(tab);
    const tabs = ['tasks', 'skills', 'history'];
    tabs.forEach((tab, i) => $('tab-' + tab).addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; this.showTab(next); $('tab-' + next).focus();
    }));
    this.showCategory('work'); this.showTab('tasks'); this.refresh();
  }
  showCategory(category) {
    this.category = category;
    for (const id of ['work', 'build', 'care']) $('category-' + id).setAttribute('aria-pressed', String(id === category));
    for (const row of $('task-list').children) row.hidden = row.dataset.category !== category;
    $('construction-card').hidden = category !== 'build';
    $('person-panel').querySelector('.person-content').scrollTop = 0;
  }
  showTab(tab) {
    $('person-panel').querySelector('.person-content').scrollTop = 0;
    for (const id of ['tasks', 'skills', 'history']) { $('view-' + id).hidden = id !== tab; $('tab-' + id).setAttribute('aria-selected', String(id === tab)); $('tab-' + id).tabIndex = id === tab ? 0 : -1; }
    this.tab = tab; this.refresh();
  }
  choose(ids) {
    this.selected = ids; this.renderer.selectedPeople = ids; this.renderer.selected = null; $('parcel').hidden = true;
    $('person-panel').hidden = !ids.length; $('viewport').classList.toggle('has-person', ids.length > 0);
    $('workspace').classList.toggle('has-person', ids.length > 0);
    $('explore').setAttribute('aria-pressed', String(!ids.length)); $('explore').classList.toggle('active', !ids.length);
    $('roster').querySelector('.group-button').setAttribute('aria-pressed', String(ids.length === 3));
    if (ids.length > 1) this.showTab('tasks');
    $('tab-skills').disabled = ids.length !== 1; $('tab-history').disabled = ids.length !== 1;
    this.refresh(); this.onChange();
  }
  notify(text) {
    $('notification').textContent = text; $('notification').hidden = false;
    clearTimeout(this.noticeTimer); this.noticeTimer = setTimeout(() => { $('notification').hidden = true; }, 5500);
  }
  order(kind, destination) {
    const results = this.selected.map(id => ({ id, result: this.sim.assign(id, kind, destination) }));
    const failures = results.filter(r => !r.result.ok);
    const text = failures.length ? failures.map(r => `${this.sim.person(r.id).name}: ${r.result.reason}`).join(' ') : `${kind === 'move' ? 'Desplazamiento' : TASKS[kind].action}: orden asignada.`;
    $('person-note').textContent = text; this.notify(text); this.refresh(); this.onChange();
  }
  tap(x, y) {
    let nearest = null, distance = 34;
    for (const person of this.sim.people) {
      const p = project(person.x, person.y), screen = this.camera.worldToScreen(p.x, p.y - 26);
      const d = Math.hypot(screen.x - x, screen.y - y); if (d < distance) { nearest = person; distance = d; }
    }
    if (nearest && this.camera.zoom > .3) { this.choose([nearest.id]); return true; }
    return false;
  }
  interact(x, y) {
    if (!this.selected.length) return false;
    const point = this.camera.screenToWorld(x, y), cell = unproject(point.x, point.y), tile = this.sim.world.get(Math.floor(cell.x), Math.floor(cell.y));
    if (!tile) return false;
    const s = this.sim.shelter, roof = project(s.x + 1, s.y + 1);
    if (s.reserved && (point.x > roof.x - 90 && point.x < roof.x + 90 && point.y > roof.y - 135 && point.y < roof.y + 45 || insideShelter(s, tile.x, tile.y))) { this.order(s.complete ? 'sleep' : 'shelter'); return true; }
    for (const tree of [...this.sim.world.trees].reverse()) { const p = project(tree.x, tree.y); if (this.sim.standing(Math.floor(tree.x), Math.floor(tree.y)) && Math.abs(point.x-p.x)<37 && point.y>p.y-122 && point.y<p.y+6) { this.order('logging',{x:Math.floor(tree.x),y:Math.floor(tree.y)}); return true; } }
    for (const bush of this.sim.shrubs) { const p = project(bush.x+.5,bush.y+.5); if(Math.abs(point.x-p.x)<23 && point.y>p.y-28 && point.y<p.y+8){this.order('foraging',bush);return true;} }
    if (this.sim.standing(tile.x, tile.y)) { this.order('logging', tile); return true; }
    const mineral=this.sim.world.mineralAt(tile.x,tile.y);if(mineral){this.notify(`${MINERALS[mineral.kind].name}: ${MINERALS[mineral.kind].detail}`);return true;}
    if(this.sim.world.scatter.some(s=>s.x===tile.x&&s.y===tile.y)&&!this.sim.scavenged.has(`${tile.x},${tile.y}`)){this.order('scavenge',tile);return true;}
    if (this.sim.shrubs.some(b => b.x === tile.x && b.y === tile.y)) { this.order('foraging', tile); return true; }
    if (tile.type === 'water') { this.order('drink', tile); return true; }
    this.order('move', tile); return true;
  }
  refresh() {
    for (const p of this.sim.people) {
      const button = $('roster').querySelector(`[data-person="${p.id}"]`); button.setAttribute('aria-pressed', String(this.selected.includes(p.id)));
      button.querySelector('small').textContent = p.state === 'Caminando' ? 'En camino' : p.job ? TASKS[p.job.kind]?.action || 'Libre' : 'Libre';
    }
    for (const resource of Object.keys(this.sim.resources)) if($(resource)) $(resource).textContent = this.sim.resources[resource];
    const shelter = this.sim.shelter, builders = this.sim.people.filter(p => p.job?.kind === 'shelter').length;
    $('camp-status-label').textContent = shelter.reserved && !shelter.complete ? `Refugio ${Math.floor(shelter.progress * 100)}%` : 'Refugio';
    $('camp-status').title = shelter.complete ? 'Refugio terminado · 3 plazas' : shelter.reserved ? 'Ver la obra compartida' : 'Construir el primer refugio · 20 madera';
    $('construction-state').textContent = shelter.complete ? 'Terminado. Los tres pueden dormir aquí.' : shelter.reserved ? `${Math.floor(shelter.progress * 100)}% · ${builders} constructores · materiales reservados` : 'El primer refugio para los tres. Coste único: 20 madera.';
    $('construction-progress').value = shelter.progress;
    $('cancel-shelter').hidden = !shelter.reserved || shelter.complete;
    if (!this.selected.length) return;
    const p = this.sim.person(this.selected[0]), group = this.selected.length > 1;
    $('person-name').textContent = group ? 'Los tres fundadores' : p.name;
    $('person-profession').textContent = group ? 'Orden para todo el grupo' : profession(p) + (p.specialty ? ` · Nivel ${skillLevel(p.skills[p.specialty].xp)}` : '');
    $('person-state').textContent = group ? `${this.selected.filter(id => this.sim.person(id).job).length} de 3 con tarea` : p.state;
    $('stop-work').disabled = !this.selected.some(id => this.sim.person(id).job);
    $('work-progress').value = !group && p.job ? p.job.kind === 'shelter' ? shelter.progress : Math.min(p.job.progress, 1) : 0;
    for (const need of ['water', 'energy']) { const value = group ? Math.min(...this.selected.map(id => this.sim.person(id).needs[need])) : p.needs[need]; $('need-' + need).value = value; $('need-' + need + '-value').textContent = `${Math.round(value)}%`; }
    for (const [id, task] of Object.entries(TASKS)) {
      const button = $('task-list').querySelector(`[data-task="${id}"]`), reason = this.sim.blockReason(id);
      button.disabled = !!reason; button.title = reason || task.detail; button.classList.toggle('assigned', !group && p.job?.kind === id);
      button.querySelector('small').textContent = reason || task.detail;
      button.querySelector('.task-level').textContent = group || !task.skill ? '' : `Nv. ${skillLevel(p.skills[task.skill].xp)}`;
    }
    for (const id of Object.keys(SKILLS)) {
      const row = $('skill-list').querySelector(`[data-skill="${id}"]`), stat = p.skills[id], progress = skillProgress(stat.xp);
      row.querySelector('span').textContent = `Nivel ${progress.level}`;
      row.querySelector('progress').value = progress.ratio;
      row.querySelector('small').textContent = `${stat.xp} XP · ${progress.level === MAX_LEVEL ? 'Nivel máximo' : `${progress.earned}/${progress.needed} al siguiente`} · ${stat.completed} trabajos · ${Math.floor(stat.seconds)} s de práctica`;
    }
    if (document.activeElement !== $('specialty')) $('specialty').value = p.specialty || '';
    $('work-total').textContent = `${p.completed} trabajos completados. Últimos 20 resultados.`;
    if (this.lastRevision !== this.sim.revision || this.lastPerson !== p.id) {
      $('job-history').replaceChildren();
      for (const h of p.history) { const li = document.createElement('li'); const title = document.createElement('strong'), detail = document.createElement('small'); title.textContent = `${TASKS[h.kind].action}${h.xp ? ` · +${h.xp} XP` : ''}`; detail.textContent = `${h.outcome} · ${Math.floor(h.time / 60)}:${String(h.time % 60).padStart(2, '0')}`; li.append(title, detail); $('job-history').append(li); }
      if (!p.history.length) { const li = document.createElement('li'); li.textContent = 'Su historia empieza con el primer trabajo.'; $('job-history').append(li); }
      this.lastRevision = this.sim.revision; this.lastPerson = p.id;
    }
  }
}
