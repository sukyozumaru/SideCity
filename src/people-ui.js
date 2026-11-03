import { project } from './core.js';
import { SKILLS, TASKS, skillProgress, skillLevel, profession, MAX_LEVEL } from './simulation.js';
import { MINERALS } from './terrain.js';
import { MINERAL_ITEMS } from './items.js';
const $ = id => document.getElementById(id);
export class PeopleUI {
  constructor(simulation, renderer, camera, onChange) {
    this.sim = simulation; this.renderer = renderer; this.camera = camera; this.onChange = onChange; this.selected = []; this.lastRevision = -1; this.noticeTimer = 0;
    for (const p of this.sim.people) {
      const button = document.createElement('button'); button.className = 'person-chip'; button.dataset.person = p.id; button.setAttribute('aria-pressed', 'false');
      const portrait = document.createElement('span'); portrait.className = 'portrait'; portrait.style.setProperty('--coat', p.color); portrait.style.setProperty('--hair', p.hair);
      const text = document.createElement('span'), name = document.createElement('strong'), state = document.createElement('small'); name.textContent = p.name; state.textContent = 'Libre'; state.dataset.state = p.id; text.append(name, state); button.append(portrait, text);
      button.onclick = () => { this.choose([p.id]);this.focusPerson(p); };
      $('roster').append(button);
    }
    const all = document.createElement('button'); all.className = 'group-button'; all.textContent = 'Adultos'; all.onclick = () => this.choose(this.sim.people.filter(p=>p.stage==='adult').map(p => p.id)); $('roster').append(all);
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
    for (const category of ['work', 'build', 'craft', 'care']) $('category-' + category).onclick = () => this.showCategory(category);
    $('cancel-shelter').onclick = () => { if (this.sim.cancelBuilding((this.sim.activeProject('shelter')||this.sim.shelter).id)) this.notify('Materiales recuperados. Puedes empezar la obra de nuevo.'); this.refresh(); this.onChange(); };
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
    for (const id of ['work', 'build', 'craft', 'care']) $('category-' + id).setAttribute('aria-pressed', String(id === category));
    for (const row of $('task-list').children) row.hidden = row.dataset.category !== category;
    $('construction-card').hidden = category !== 'build';
    $('person-panel').querySelector('.person-content').scrollTop = 0;
  }
  showTab(tab) {
    $('person-panel').querySelector('.person-content').scrollTop = 0;
    for (const id of ['tasks', 'skills', 'history']) { $('view-' + id).hidden = id !== tab; $('tab-' + id).setAttribute('aria-selected', String(id === tab)); $('tab-' + id).tabIndex = id === tab ? 0 : -1; }
    this.tab = tab; this.refresh();
  }
  focusPerson(person) {
    const c=this.camera,point=project(person.x,person.y);c.x=point.x;c.y=point.y;
    const phone=c.width<=700&&c.height>500;
    const panelTop=c.height-110-Math.min(c.height*.54,c.height-346);
    c.pan(phone?c.width*.26-c.width/2:-100,phone?Math.max(210,panelTop-18)-c.height/2:35);
    this.onChange();
  }
  choose(ids) {
    if(ids.length){document.dispatchEvent(new CustomEvent('sidecity:person-open'));document.dispatchEvent(new CustomEvent('sidecity:panel-open',{detail:'person'}));}
    this.selected = ids; this.renderer.selectedPeople = ids; this.renderer.selected = null; $('parcel').hidden = true;
    $('person-panel').hidden = !ids.length; $('viewport').classList.toggle('has-person', ids.length > 0);
    $('workspace').classList.toggle('has-person', ids.length > 0);
    $('explore').setAttribute('aria-pressed', String(!ids.length)); $('explore').classList.toggle('active', !ids.length);
    $('roster').querySelector('.group-button').setAttribute('aria-pressed', String(ids.length === this.sim.people.filter(p=>p.stage==='adult').length));
    if(ids.length===1&&this.tab==='tasks')this.showCategory(TASKS[this.sim.person(ids[0]).job?.kind]?.category||'work');
    if (ids.length > 1) this.showTab('tasks');
    $('tab-skills').disabled = ids.length !== 1; $('tab-history').disabled = ids.length !== 1;
    this.refresh(); this.onChange();
  }
  notify(text) {
    $('notification').textContent = text; $('notification').hidden = false;
    clearTimeout(this.noticeTimer); this.noticeTimer = setTimeout(() => { $('notification').hidden = true; }, 5500);
  }
  order(kind, destination) {
    const used=new Set();
    const results = this.selected.map(id => {let target=destination;if(kind==='move'&&this.selected.length>1){const choices=[];for(let r=0;r<=2;r++)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(Math.max(Math.abs(x),Math.abs(y))===r)choices.push({x:destination.x+x,y:destination.y+y});target=choices.find(t=>!used.has(`${t.x},${t.y}`)&&this.sim.route(this.sim.person(id),t))||destination;used.add(`${target.x},${target.y}`);}return {id,result:this.sim.assign(id,kind,target)};});
    const failures = results.filter(r => !r.result.ok);
    const text = failures.length ? failures.map(r => `${this.sim.person(r.id).name}: ${r.result.reason}`).join(' ') : `${kind === 'move' ? 'Desplazamiento' : TASKS[kind].action}: orden asignada.`;
    $('person-note').textContent = text; this.notify(text); this.refresh(); this.onChange();
  }
  tap(x, y) {
    let nearest = null, distance = 34;
    for (const person of this.sim.people) {
      const screen=this.camera.gridToScreen(person.x,person.y,person.stage==='child'?22:28);
      const d = Math.hypot(screen.x - x, screen.y - y); if (d < distance) { nearest = person; distance = d; }
    }
    if (nearest && this.camera.zoom > .3) { this.choose([nearest.id]); return true; }
    return false;
  }
  interact(x,y){return this.onInteract?.(x,y)||false;}
  refresh() {
    for(const p of this.sim.people)if(!$('roster').querySelector(`[data-person="${p.id}"]`)){
      const b=document.createElement('button');b.className='person-chip';b.dataset.person=p.id;b.setAttribute('aria-pressed','false');
      const portrait=document.createElement('span');portrait.className='portrait';portrait.style.setProperty('--coat',p.color);portrait.style.setProperty('--hair',p.hair);const text=document.createElement('span'),name=document.createElement('strong'),state=document.createElement('small');name.textContent=p.name;text.append(name,state);b.append(portrait,text);b.onclick=()=>{this.choose([p.id]);this.focusPerson(p);};$('roster').insertBefore(b,$('roster').querySelector('.group-button'));
    }
    for (const p of this.sim.people) {
      const button = $('roster').querySelector(`[data-person="${p.id}"]`); button.setAttribute('aria-pressed', String(this.selected.includes(p.id)));
      button.querySelector('small').textContent = p.stage==='child'?'Infancia':p.state === 'Caminando' ? 'En camino' : p.job ? TASKS[p.job.kind]?.action || 'Libre' : 'Libre';
    }
    for (const resource of Object.keys(this.sim.resources)) if($(resource)) $(resource).textContent = this.sim.resources[resource];
    const shelter = this.sim.activeProject('shelter')||this.sim.shelter, builders = this.sim.people.filter(p => p.job?.kind === 'shelter'&&this.sim.jobProject(p.job)===shelter).length;
    $('camp-status-label').textContent='Construir';$('camp-status').title='Colocar refugios y puentes';
    $('construction-state').textContent = shelter.complete ? 'Terminado. Los tres pueden dormir aquí.' : shelter.reserved ? `${Math.floor(shelter.progress * 100)}% · ${builders} constructores · materiales reservados` : 'El primer refugio para los tres. Coste único: 20 madera.';
    $('construction-progress').value = shelter.progress;
    $('cancel-shelter').hidden = !shelter.reserved || shelter.complete;
    if (!this.selected.length) return;
    const p = this.sim.person(this.selected[0]), group = this.selected.length > 1;
    $('person-name').textContent = group ? `${this.selected.length} habitantes` : p.name;
    $('person-profession').textContent = group ? 'Orden para todo el grupo' : p.stage==='child'?'Infancia · los oficios se abren al crecer':profession(p) + (p.specialty ? ` · Nivel ${skillLevel(p.skills[p.specialty].xp)}` : '');
    $('person-state').textContent = group ? `${this.selected.filter(id => this.sim.person(id).job).length} de ${this.selected.length} con tarea` : p.state;
    $('stop-work').disabled = !this.selected.some(id => this.sim.person(id).job);
    $('work-progress').value = !group && p.job ? ['shelter','bridge'].includes(p.job.kind) ? this.sim.jobProject(p.job).progress : Math.min(p.job.progress, 1) : 0;
    for (const need of ['water', 'energy']) { const value = group ? Math.min(...this.selected.map(id => this.sim.person(id).needs[need])) : p.needs[need]; $('need-' + need).value = value; $('need-' + need + '-value').textContent = `${Math.round(value)}%`; }
    for (const [id, task] of Object.entries(TASKS)) {
      const button = $('task-list').querySelector(`[data-task="${id}"]`), reason = !group&&p.stage==='child'&&!['rest','sleep','eat','drink','social'].includes(id)?'Los oficios se abren al crecer.':this.sim.blockReason(id);
      button.disabled = !!reason; button.title = reason || task.detail; button.classList.toggle('assigned', !group && p.job?.kind === id);
      if(['shelter','bridge'].includes(id))button.hidden=this.category!==task.category||!this.sim.activeProject(id)?.reserved;
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
