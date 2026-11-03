import { project } from './core.js';
import { SKILLS, skillProgress, skillLevel, profession, MAX_LEVEL } from './simulation.js';
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
    for (const [id, skill] of Object.entries(SKILLS)) {
      const button = document.createElement('button'); button.className = 'task-row'; button.dataset.task = id;
      const label = document.createElement('strong'), detail = document.createElement('small'), level = document.createElement('span'); label.textContent = skill.action; detail.textContent = skill.detail; level.className = 'task-level'; button.append(label, detail, level);
      button.onclick = () => this.order(id); $('task-list').append(button);
      const row = document.createElement('div'); row.className = 'skill-row'; row.dataset.skill = id;
      row.innerHTML = '<div><strong></strong><span></span></div><progress max="1" value="0"></progress><small></small>';
      row.querySelector('strong').textContent = skill.name; row.querySelector('progress').setAttribute('aria-label', `Experiencia de ${skill.name}`); $('skill-list').append(row);
      const option = document.createElement('option'); option.value = id; option.textContent = skill.profession; $('specialty').append(option);
    }
    $('specialty').onchange = () => { if (this.selected.length === 1) this.sim.setSpecialty(this.selected[0], $('specialty').value); this.refresh(); this.onChange(); };
    for (const tab of ['tasks', 'skills', 'history']) $('tab-' + tab).onclick = () => this.showTab(tab);
    const tabs = ['tasks', 'skills', 'history'];
    tabs.forEach((tab, i) => $('tab-' + tab).addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; this.showTab(next); $('tab-' + next).focus();
    }));
    this.showTab('tasks'); this.refresh();
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
    const text = failures.length ? failures.map(r => `${this.sim.person(r.id).name}: ${r.result.reason}`).join(' ') : `${kind === 'move' ? 'Desplazamiento' : SKILLS[kind].action}: orden asignada.`;
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
  refresh() {
    for (const p of this.sim.people) {
      const button = $('roster').querySelector(`[data-person="${p.id}"]`); button.setAttribute('aria-pressed', String(this.selected.includes(p.id)));
      button.querySelector('small').textContent = p.state === 'Caminando' ? 'En camino' : p.job ? SKILLS[p.job.kind]?.name || 'En camino' : 'Libre';
    }
    for (const resource of Object.keys(this.sim.resources)) $(resource).textContent = this.sim.resources[resource];
    if (!this.selected.length) return;
    const p = this.sim.person(this.selected[0]), group = this.selected.length > 1;
    $('person-name').textContent = group ? 'Los tres fundadores' : p.name;
    $('person-profession').textContent = group ? 'Orden para todo el grupo' : profession(p) + (p.specialty ? ` · Nivel ${skillLevel(p.skills[p.specialty].xp)}` : '');
    $('person-state').textContent = group ? `${this.selected.filter(id => this.sim.person(id).job).length} de 3 con tarea` : p.state;
    $('stop-work').disabled = !this.selected.some(id => this.sim.person(id).job);
    $('work-progress').value = !group && p.job ? Math.min(p.job.progress, 1) : 0;
    for (const [id, skill] of Object.entries(SKILLS)) {
      const button = $('task-list').querySelector(`[data-task="${id}"]`), reason = this.sim.blockReason(id);
      button.disabled = !!reason; button.title = reason || skill.detail; button.classList.toggle('assigned', !group && p.job?.kind === id);
      button.querySelector('small').textContent = reason || skill.detail;
      button.querySelector('.task-level').textContent = group ? '' : `Nv. ${skillLevel(p.skills[id].xp)}`;
      const row = $('skill-list').querySelector(`[data-skill="${id}"]`), stat = p.skills[id], progress = skillProgress(stat.xp);
      row.querySelector('span').textContent = `Nivel ${progress.level}`;
      row.querySelector('progress').value = progress.ratio;
      row.querySelector('small').textContent = `${stat.xp} XP · ${progress.level === MAX_LEVEL ? 'Nivel máximo' : `${progress.earned}/${progress.needed} al siguiente`} · ${stat.completed} trabajos · ${Math.floor(stat.seconds)} s de práctica`;
    }
    if (document.activeElement !== $('specialty')) $('specialty').value = p.specialty || '';
    $('work-total').textContent = `${p.completed} trabajos completados. Últimos 20 resultados.`;
    if (this.lastRevision !== this.sim.revision || this.lastPerson !== p.id) {
      $('job-history').replaceChildren();
      for (const h of p.history) { const li = document.createElement('li'); const title = document.createElement('strong'), detail = document.createElement('small'); title.textContent = `${SKILLS[h.kind].name} · +${h.xp} XP`; detail.textContent = `${h.outcome} · ${Math.floor(h.time / 60)}:${String(h.time % 60).padStart(2, '0')}`; li.append(title, detail); $('job-history').append(li); }
      if (!p.history.length) { const li = document.createElement('li'); li.textContent = 'Su historia empieza con el primer trabajo.'; $('job-history').append(li); }
      this.lastRevision = this.sim.revision; this.lastPerson = p.id;
    }
  }
}
