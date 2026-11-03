import { SHELTER_COST, SHELTER_WORK, createShelter, insideShelter, shelterPlaces } from './camp.js';
import { initialSectors, sectorOf, SECTOR_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from './terrain.js';
import { ITEMS, RECIPES, MINERAL_ITEMS, recipeReason } from './items.js';

export const SKILLS = {
  logging: { name: 'Tala', profession: 'Leñador', action: 'Talar', seconds: 5, xp: 14, detail: 'Busca un árbol cercano y obtiene 4 de madera.' },
  foraging: { name: 'Recolección', profession: 'Recolector', action: 'Recolectar', seconds: 4, xp: 10, detail: 'Recoge alimento de los arbustos del valle.' },
  study: { name: 'Investigación', profession: 'Investigador', action: 'Estudiar', seconds: 8, xp: 16, detail: 'Observa y experimenta. Aporta 1 de conocimiento.' },
  exploration: { name: 'Exploración', profession: 'Explorador', action: 'Explorar', seconds: 3, xp: 12, detail: 'Reconoce una parcela nueva. No repite XP en el mismo lugar.' },
  building: { name: 'Construcción', profession: 'Constructor', action: 'Preparar fogón', seconds: 8, xp: 25, detail: 'Requiere 5 de madera y el descubrimiento del fuego.' },
  cooking: { name: 'Cocina', profession: 'Cocinero', action: 'Cocinar', seconds: 6, xp: 14, detail: 'Convierte 1 alimento y 1 madera en 1 comida.' },
  mining: { name: 'Minería', profession: 'Minero', action: 'Extraer roca', seconds: 7, xp: 12, detail: 'Extrae hasta 2 materiales por trabajo. Requiere un pico de piedra.' },
};
export const TASKS = {
  ...Object.fromEntries(Object.entries(SKILLS).map(([id, skill]) => [id, { ...skill, skill: id, category: id === 'building' ? 'build' : 'work' }])),
  shelter: { action: 'Construir refugio', skill: 'building', category: 'build', seconds: SHELTER_WORK, detail: '20 madera, una sola reserva. Los tres pueden colaborar.' },
  drink: { action: 'Beber agua', category: 'care', seconds: 4, detail: 'Se acerca a la orilla y recupera hidratación.' },
  rest: { action: 'Descansar', category: 'care', seconds: 8, detail: 'Se sienta en tierra firme y recupera energía.' },
  sleep: { action: 'Dormir en refugio', category: 'care', seconds: 10, detail: 'Requiere el refugio terminado. Recupera más energía.' },
  scavenge: { action: 'Buscar ramas y piedras', skill: 'foraging', category: 'work', seconds: 3, detail: 'Recoge ramas y piedritas del suelo del territorio abierto.' },
  eat: { action: 'Comer', category: 'care', seconds: 4, detail: 'Usa 1 comida (+25 energía) o 1 baya (+10 energía).' },
  ...Object.fromEntries(Object.entries(RECIPES).map(([id,r]) => [id,{action:`Fabricar ${ITEMS[r.output].name.toLowerCase()}`,skill:'building',category:'craft',seconds:r.seconds,detail:ITEMS[r.output].use}])),
};
export const MAX_LEVEL = 20;
const knownSkill = id => typeof id === 'string' && Object.hasOwn(SKILLS, id);
const knownTask = id => typeof id === 'string' && Object.hasOwn(TASKS, id);
export const threshold = level => 20 * (level - 1) * level;
export function skillLevel(xp) { let level = 1; while (level < MAX_LEVEL && xp >= threshold(level + 1)) level++; return level; }
export function skillProgress(xp) {
  const level = skillLevel(xp), floor = threshold(level), next = threshold(Math.min(MAX_LEVEL, level + 1));
  return { level, earned: xp - floor, needed: next - floor, ratio: level === MAX_LEVEL ? 1 : (xp - floor) / (next - floor) };
}
export function profession(person) {
  if (person.specialty) return SKILLS[person.specialty].profession;
  const best = Object.keys(SKILLS).sort((a, b) => person.skills[b].xp - person.skills[a].xp)[0];
  return person.skills[best].xp ? `Aprendiz de ${SKILLS[best].name.toLowerCase()}` : 'Sin especialidad';
}
const key = (x, y) => `${x},${y}`;
const neighbours = (x, y) => [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]];
export function findRoute(world, start, goal, walkable = t => t && t.type !== 'water' && !t.tree) {
  const sx = Math.floor(start.x), sy = Math.floor(start.y);
  if (!walkable(world.get(sx, sy)) || !walkable(world.get(goal.x, goal.y))) return null;
  const queue = [{ x: sx, y: sy }], came = new Map([[key(sx, sy), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === goal.x && p.y === goal.y) {
      const path = []; let cursor = p;
      while (cursor) { path.push({ x: cursor.x + .5, y: cursor.y + .5 }); cursor = came.get(key(cursor.x, cursor.y)); }
      return path.reverse();
    }
    for (const [x, y] of neighbours(p.x, p.y)) if (!came.has(key(x, y)) && walkable(world.get(x, y))) { came.set(key(x, y), p); queue.push({ x, y }); }
  }
  return null;
}
const founders = [
  { id: 'ana', name: 'Ana', color: '#b87950', hair: '#4c3b2e', x: 20.5, y: 17.5 },
  { id: 'ivo', name: 'Ivo', color: '#628b9a', hair: '#70513b', x: 22.5, y: 17.5 },
  { id: 'nara', name: 'Nara', color: '#a28a50', hair: '#342f29', x: 21.5, y: 19.5 },
];
const shrubSites = [[17, 17], [23, 14], [24, 18], [18, 13], [24, 15], [19, 20]];
export class Simulation {
  constructor(world) {
    this.world = world; this.time = 0; this.resources = Object.fromEntries(Object.keys(ITEMS).map(id=>[id,0]));
    this.firepit = false; this.events = []; this.revision = 0;
    this.shelter = createShelter(); this.feedback = [];
    this.unlocked = new Set(initialSectors()); this.scavenged = new Set(); this.mined = new Map();
    this.people = founders.map(p => ({ ...p, direction: { x: 1, y: 0 }, needs: { water: 90, energy: 90 }, specialty: null, job: null, state: 'Libre', completed: 0, history: [], explored: [], skills: Object.fromEntries(Object.keys(SKILLS).map(id => [id, { xp: 0, completed: 0, seconds: 0 }])) }));
    this.timber = new Map(world.tiles.filter(t => t.tree).map(t => [key(t.x, t.y), 3]));
    this.shrubs = shrubSites.map(([x, y]) => ({ x, y, remaining: 8 }));
  }
  person(id) { return this.people.find(p => p.id === id); }
  standing(x, y) { return (this.timber.get(key(x, y)) || 0) > 0; }
  mineralRemaining(node) { return Math.max(0,node.richness-(this.mined.get(key(node.x,node.y))||0)); }
  isUnlocked(x,y) { const s=sectorOf(x,y);return this.unlocked.has(key(s.x,s.y)); }
  expansionCost() { const n=this.unlocked.size-16;return {wood:8+n*2,knowledge:1+Math.floor(n/4)}; }
  expansionReason(x,y) {
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=WORLD_WIDTH/SECTOR_SIZE||y>=WORLD_HEIGHT/SECTOR_SIZE)return 'Sector fuera del mundo.';
    if(this.unlocked.has(key(x,y)))return 'Este sector ya está abierto.';
    if(!neighbours(x,y).some(([a,b])=>this.unlocked.has(key(a,b))))return 'Abre primero un sector vecino a tu territorio.';
    const cost=this.expansionCost();if(this.resources.wood<cost.wood||this.resources.knowledge<cost.knowledge)return `Necesitas ${cost.wood} madera y ${cost.knowledge} de saber.`;
    return '';
  }
  unlockSector(x,y) {const reason=this.expansionReason(x,y);if(reason)return {ok:false,reason};const cost=this.expansionCost();this.resources.wood-=cost.wood;this.resources.knowledge-=cost.knowledge;this.unlocked.add(key(x,y));this.emit('Territorio ampliado: 144 parcelas nuevas.');return {ok:true};}
  walkable(tile) { return tile && this.isUnlocked(tile.x,tile.y) && tile.type !== 'water' && !this.standing(tile.x, tile.y) && !(this.world.mineralAt(tile.x,tile.y)&&this.mineralRemaining(this.world.mineralAt(tile.x,tile.y))) && !this.shrubs.some(s => s.x === tile.x && s.y === tile.y) && !(this.shelter.reserved && insideShelter(this.shelter, tile.x, tile.y)); }
  route(person, target) { return findRoute(this.world, person, target, t => this.walkable(t)); }
  emit(text) { this.events.push(text); this.events = this.events.slice(-20); this.revision++; }
  knowsFire() { return this.firepit || this.resources.knowledge >= 3 || this.people.reduce((n,p)=>n+p.skills.study.completed,0)>=3; }
  blockReason(kind) {
    if (RECIPES[kind]) return recipeReason(this.resources,kind);
    if (kind === 'mining' && !this.resources.stonePick) return 'Fabrica un pico de piedra en Almacén → Fabricar.';
    if (kind === 'eat' && this.resources.meals < 1 && this.resources.rawFood < 1) return 'Recoge bayas o prepara una comida primero.';
    if (kind === 'shelter' && this.shelter.complete) return 'El refugio de los tres fundadores ya está terminado.';
    if (kind === 'shelter' && !this.shelter.reserved && this.resources.wood < SHELTER_COST) return 'Necesitas 20 de madera. Se reservan una sola vez para toda la obra.';
    if (kind === 'shelter' && !this.shelter.reserved && this.people.some(p => insideShelter(this.shelter, p.x, p.y))) return 'Mueve al habitante que está en el solar antes de empezar.';
    if (kind === 'sleep' && !this.shelter.complete) return 'Primero termina el refugio. Mientras tanto puedes descansar al aire libre.';
    if (kind === 'building' && this.firepit) return 'El fogón ya está preparado.';
    if (kind === 'building' && !this.knowsFire()) return 'Completa tres estudios para descubrir el fuego.';
    if (kind === 'building' && this.resources.wood < 5) return 'Necesitas 5 de madera para preparar el fogón.';
    if (kind === 'cooking' && !this.firepit) return 'Primero descubre el fuego y prepara un fogón.';
    if (kind === 'cooking' && (this.resources.rawFood < 1 || this.resources.wood < 1)) return 'Necesitas 1 alimento y 1 madera por comida.';
    return '';
  }
  nearest(person, kind, preferred) {
    const candidates = [];
    if (kind === 'logging') for (const t of this.world.tiles) if (this.standing(t.x, t.y)) for (const [x, y] of neighbours(t.x, t.y)) if (this.walkable(this.world.get(x, y))) candidates.push({ x, y, source: { x: t.x, y: t.y } });
    if (kind === 'foraging') for (const s of this.shrubs) if (s.remaining > 0) for (const [x, y] of neighbours(s.x, s.y)) if (this.walkable(this.world.get(x, y))) candidates.push({ x, y, source: { x: s.x, y: s.y } });
    if (kind === 'exploration') for (const t of this.world.tiles) if (this.walkable(t) && !person.explored.includes(key(t.x, t.y)) && Math.hypot(t.x + .5 - person.x, t.y + .5 - person.y) >= 3) candidates.push({ x: t.x, y: t.y, source: { x: t.x, y: t.y } });
    if (['study','rest','eat'].includes(kind)) candidates.push({ x: Math.floor(person.x), y: Math.floor(person.y) });
    if (RECIPES[kind]) candidates.push({x:22,y:16});
    if(kind==='mining')for(const node of this.world.minerals)if(MINERAL_ITEMS[node.kind]&&this.isUnlocked(node.x,node.y)&&this.mineralRemaining(node)>0)for(const [x,y]of neighbours(node.x,node.y))if(this.walkable(this.world.get(x,y)))candidates.push({x,y,source:{x:node.x,y:node.y}});
    if (kind === 'building' || kind === 'cooking') candidates.push({ x: 21, y: 16 });
    if (kind === 'shelter' || kind === 'sleep') candidates.push(...shelterPlaces(this.shelter));
    if (kind === 'drink') for (const t of this.world.tiles) if (this.walkable(t)) for (const [x, y] of neighbours(t.x, t.y)) if (this.world.get(x, y)?.type === 'water') candidates.push({ x: t.x, y: t.y, source: { x, y } });
    if(kind==='scavenge') for(const item of this.world.scatter)if(!this.scavenged.has(key(item.x,item.y))&&this.walkable(this.world.get(item.x,item.y)))candidates.push({x:item.x,y:item.y,source:{x:item.x,y:item.y}});
    const filtered = preferred && ['logging', 'foraging', 'drink','scavenge','mining'].includes(kind) ? candidates.filter(c => c.source?.x === preferred.x && c.source?.y === preferred.y) : candidates;
    filtered.sort((a, b) => {
      const occupied = c => this.people.some(p => p.id !== person.id && p.job?.target.x === c.x && p.job?.target.y === c.y);
      const preferredA = preferred && a.source?.x === preferred.x && a.source?.y === preferred.y;
      const preferredB = preferred && b.source?.x === preferred.x && b.source?.y === preferred.y;
      return Number(occupied(a)) - Number(occupied(b)) || Number(preferredB) - Number(preferredA) || Math.abs(a.x - person.x) + Math.abs(a.y - person.y) - Math.abs(b.x - person.x) - Math.abs(b.y - person.y);
    });
    for (const candidate of filtered) { const path = this.route(person, candidate); if (path) return { ...candidate, path }; }
    return null;
  }
  assign(id, kind, destination) {
    const person = this.person(id); if (!person) return { ok: false, reason: 'Habitante desconocido.' };
    if (kind !== 'move' && !knownTask(kind)) return { ok: false, reason: 'Tarea desconocida.' };
    const reason = this.blockReason(kind); if (reason) return { ok: false, reason };
    let target;
    if (kind === 'move') {
      if (!destination || !Number.isInteger(destination.x) || !Number.isInteger(destination.y)) return { ok: false, reason: 'Elige una parcela de tierra.' };
      const path = this.route(person, destination); if (path) target = { ...destination, path };
    } else target = this.nearest(person, kind, destination);
    if (!target) return { ok: false, reason: kind==='mining'?'No hay piedra, carbón, cobre o estaño accesible en el territorio abierto. Abre un sector vecino.':'No hay un destino accesible para esa tarea.' };
    if (kind === 'shelter' && !this.shelter.reserved) { this.resources.wood -= SHELTER_COST; this.shelter.reserved = true; this.emit('Obra iniciada: 20 de madera reservados para el refugio.'); }
    person.job = { kind, target: { x: target.x, y: target.y }, source: target.source || null, path: target.path, progress: 0, cycles: 0 };
    person.state = 'Caminando'; this.revision++; return { ok: true };
  }
  stop(id) { const p = this.person(id); if (p) { p.job = null; p.state = 'Libre'; this.revision++; } }
  cancelShelter() {
    if (!this.shelter.reserved || this.shelter.complete) return false;
    for (const p of this.people) if (p.job?.kind === 'shelter') this.stop(p.id);
    this.resources.wood += SHELTER_COST; this.shelter = createShelter(); this.emit('Obra cancelada. Recuperaste los 20 de madera reservados.'); return true;
  }
  setSpecialty(id, skill) { const p = this.person(id); if (p && (skill === '' || knownSkill(skill))) { p.specialty = skill || null; this.revision++; } }
  speed(person, kind) { const skill = TASKS[kind]?.skill; return (skill ? 1 + (skillLevel(person.skills[skill].xp) - 1) * .04 + (person.specialty === skill ? .1 : 0) : 1) * (kind==='logging'&&this.resources.stoneAxe?1.15:1); }
  award(person, kind, outcome, taskKind=kind) {
    const skill = person.skills[kind], oldLevel = skillLevel(skill.xp), oldXP = skill.xp;
    skill.xp = Math.min(threshold(MAX_LEVEL), skill.xp + SKILLS[kind].xp); skill.completed++; person.completed++;
    person.history.unshift({ kind:taskKind, time: Math.floor(this.time), xp: skill.xp - oldXP, outcome }); person.history = person.history.slice(0, 20);
    if (skillLevel(skill.xp) > oldLevel) this.emit(`${person.name}: ${SKILLS[kind].name} nivel ${skillLevel(skill.xp)}.`);
    this.revision++;
  }
  complete(person) {
    const { kind, source } = person.job, r = this.resources, knewFire = this.knowsFire();
    const reason = this.blockReason(kind); if (reason) return { ok: false, reason };
    let outcome = '';
    if(RECIPES[kind]){
      const recipe=RECIPES[kind];for(const [id,n]of Object.entries(recipe.cost))r[id]-=n;r[recipe.output]++;
      outcome=`${ITEMS[recipe.output].name} terminada`;this.award(person,'building',outcome,kind);this.emit(outcome);return {ok:true};
    }
    if(kind==='mining'){
      const node=this.world.mineralAt(source.x,source.y),item=MINERAL_ITEMS[node?.kind];if(!item||!this.mineralRemaining(node))return {ok:false,depleted:true};
      const count=Math.min(2,this.mineralRemaining(node));this.mined.set(key(node.x,node.y),(this.mined.get(key(node.x,node.y))||0)+count);r[item]+=count;
      outcome=`+${count} ${ITEMS[item].name.toLowerCase()}`;this.award(person,'mining',outcome);this.feedback.push({kind,x:person.x,y:person.y,source,time:this.time,outcome});return {ok:true};
    }
    if(kind==='scavenge') {
      const item=this.world.scatter.find(s=>s.x===source.x&&s.y===source.y),id=key(source.x,source.y);
      if(!item||this.scavenged.has(id))return {ok:false,depleted:true};this.scavenged.add(id);this.resources[item.kind==='sticks'?'wood':'stone']++;outcome=item.kind==='sticks'?'+1 madera':'+1 piedra';
      this.award(person,'foraging',outcome);this.feedback.push({kind,x:person.x,y:person.y,source,time:this.time,outcome});return {ok:true};
    }
    if (['drink', 'rest', 'sleep','eat'].includes(kind)) {
      if (kind === 'drink') { person.needs.water = Math.min(100, person.needs.water + 65); outcome = 'Hidratación recuperada'; }
      else if(kind==='eat'){const cooked=r.meals>0;r[cooked?'meals':'rawFood']--;person.needs.energy=Math.min(100,person.needs.energy+(cooked?25:10));outcome=cooked?'Una comida compartida del almacén':'Una porción de bayas del almacén';}
      else { person.needs.energy = Math.min(100, person.needs.energy + (kind === 'sleep' ? 65 : 30)); outcome = kind === 'sleep' ? 'Sueño reparador' : 'Energía recuperada'; }
      person.history.unshift({ kind, time: Math.floor(this.time), xp: 0, outcome }); person.history = person.history.slice(0, 20); this.revision++;
      return { ok: true };
    }
    if (kind === 'logging') {
      const id = key(source.x, source.y), left = this.timber.get(id) || 0;
      if (!left) return { ok: false, depleted: true };
      this.timber.set(id, left - 1); r.wood += 4; outcome = '+4 madera';
    }
    if (kind === 'foraging') {
      const bush = this.shrubs.find(s => s.x === source.x && s.y === source.y);
      if (!bush?.remaining) return { ok: false, depleted: true };
      bush.remaining--; r.rawFood++; outcome = '+1 alimento';
    }
    if (kind === 'study') { r.knowledge++; outcome = '+1 conocimiento'; }
    if (kind === 'exploration') {
      const id = key(source.x, source.y); if (person.explored.includes(id)) return { ok: false, depleted: true };
      person.explored.push(id); outcome = 'Parcela reconocida';
    }
    if (kind === 'building') { r.wood -= 5; this.firepit = true; outcome = 'Fogón preparado'; this.emit(`${person.name} preparó el primer fogón.`); }
    if (kind === 'cooking') { r.rawFood--; r.wood--; r.meals++; outcome = '+1 comida'; }
    this.award(person, kind, outcome);
    if(kind==='study'&&!knewFire&&this.knowsFire())this.emit('Descubrimiento: fuego controlado. Ya puedes preparar un fogón.');
    this.feedback.push({ kind, x: person.x, y: person.y, source, time: this.time, outcome });
    this.feedback = this.feedback.slice(-24); return { ok: true };
  }
  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.time += dt;
    this.feedback = this.feedback.filter(f => this.time - f.time < 1.6);
    for (const person of this.people) {
      person.needs.water = Math.max(0, person.needs.water - dt * .025);
      person.needs.energy = Math.max(0, person.needs.energy - dt * (person.job ? .03 : .01));
      if (!person.job && person.needs.water < 25) this.assign(person.id, 'drink');
      else if (!person.job && person.needs.energy < 25) this.assign(person.id, this.shelter.complete ? 'sleep' : 'rest');
      const job = person.job; if (!job) continue;
      if(RECIPES[job.kind]&&this.resources[RECIPES[job.kind].output]>0){this.stop(person.id);continue;}
      if (job.kind === 'building' && this.firepit) { this.stop(person.id); continue; }
      if (job.kind === 'shelter' && this.shelter.complete) { this.stop(person.id); continue; }
      if (job.path.length) {
        const waypoint = job.path[0];
        if (!this.walkable(this.world.get(Math.floor(waypoint.x), Math.floor(waypoint.y)))) {
          const reroute = this.route(person, job.target); if (!reroute) { this.stop(person.id); continue; } job.path = reroute;
        }
        let travel = dt * 1.65;
        while (travel > 0 && job.path.length) {
          const next = job.path[0], dx = next.x - person.x, dy = next.y - person.y, distance = Math.hypot(dx, dy);
          if (distance > .001) person.direction = { x: dx / distance, y: dy / distance };
          if (distance <= travel) { person.x = next.x; person.y = next.y; job.path.shift(); travel -= distance; }
          else { person.x += dx / distance * travel; person.y += dy / distance * travel; travel = 0; }
        }
        person.state = 'Caminando';
        if (!job.path.length && job.kind === 'move') this.stop(person.id);
        continue;
      }
      if (job.kind === 'move') { this.stop(person.id); continue; }
      person.state = TASKS[job.kind].action;
      const reason = this.blockReason(job.kind);
      if (reason) { person.state = reason; job.progress = 0; continue; }
      if (job.source) { const dx = job.source.x + .5 - person.x, dy = job.source.y + .5 - person.y, d = Math.hypot(dx, dy); if (d) person.direction = { x: dx / d, y: dy / d }; }
      const skill = TASKS[job.kind].skill;
      if (skill) person.skills[skill].seconds += dt;
      if (job.kind === 'shelter') {
        const contribution = Math.min(dt * this.speed(person, 'shelter'), (1 - this.shelter.progress) * SHELTER_WORK);
        this.shelter.progress = Math.min(1, this.shelter.progress + contribution / SHELTER_WORK); this.shelter.contributions[person.id] = Math.min(SHELTER_WORK, this.shelter.contributions[person.id] + contribution);
        if (this.shelter.progress >= 1 - 1e-9) {
          this.shelter.progress = 1; this.shelter.complete = true;
          for (const worker of this.people) { if (this.shelter.contributions[worker.id] >= 1) this.award(worker, 'building', 'Refugio terminado en equipo'); if (worker.job?.kind === 'shelter') this.stop(worker.id); }
          this.emit('El primer refugio está terminado. Hay descanso para los tres fundadores.');
        }
        continue;
      }
      job.progress += dt * this.speed(person, job.kind) / TASKS[job.kind].seconds;
      if (job.progress < 1) continue;
      const result = this.complete(person); job.progress = 0;
      if (!result.ok && !result.depleted) { person.state = result.reason; continue; }
      job.cycles++;
      if (['building', 'drink', 'rest', 'sleep','eat'].includes(job.kind)||RECIPES[job.kind]) { this.stop(person.id); continue; }
      if (result.depleted || ['exploration','scavenge'].includes(job.kind) || job.kind==='mining'&&!this.mineralRemaining(this.world.mineralAt(job.source.x,job.source.y)) || job.kind === 'logging' && !this.standing(job.source.x, job.source.y) || job.kind === 'foraging' && !this.shrubs.find(s => s.x === job.source.x && s.y === job.source.y)?.remaining) {
        const next = this.nearest(person, job.kind);
        if (!next) { this.stop(person.id); this.emit(`${person.name}: no quedan recursos accesibles para esa tarea.`); }
        else { job.target = { x: next.x, y: next.y }; job.source = next.source || null; job.path = next.path; }
      }
    }
  }
  snapshot() {
    return { version: 4, seed: this.world.seed, time: this.time, resources: { ...this.resources }, firepit: this.firepit, shelter: structuredClone(this.shelter), unlocked:[...this.unlocked],scavenged:[...this.scavenged],mined:[...this.mined],
      timber: [...this.timber], shrubs: this.shrubs.map(s => s.remaining),
      people: this.people.map(p => ({ id: p.id, x: p.x, y: p.y, needs: { ...p.needs }, specialty: p.specialty, skills: structuredClone(p.skills), completed: p.completed, history: structuredClone(p.history), explored: [...p.explored], order: p.job ? { kind: p.job.kind, target: p.job.source || p.job.target, progress: Math.min(p.job.progress, .999) } : null })) };
  }
  static restore(world, data) {
    const legacy = data?.version === 1;
    if (legacy) { data = structuredClone(data); data.version = 2; data.shelter = createShelter(); for (const p of data.people || []) p.needs = { water: 90, energy: 90 }; }
    if(data?.version===2){
      data=structuredClone(data);const trees=world.tiles.filter(t=>t.tree),keys=new Set(trees.map(t=>key(t.x,t.y))),oldCount=trees.filter(t=>t.x<48&&t.y<48).length;
      if(!Array.isArray(data.timber)||![oldCount,trees.length].includes(data.timber.length)||new Set(data.timber.map(t=>t?.[0])).size!==data.timber.length||!data.timber.every(t=>Array.isArray(t)&&keys.has(t[0])&&Number.isInteger(t[1])&&t[1]>=0&&t[1]<=3))throw new Error('Guardado antiguo de recursos inválido.');
      data.version=3;data.unlocked=initialSectors();data.scavenged=[];data.resources.stone=0;const old=new Map(data.timber);data.timber=trees.map(t=>[key(t.x,t.y),old.get(key(t.x,t.y))??3]);
    }
    if(data?.version===3){data=structuredClone(data);data.version=4;data.mined=[];for(const id of Object.keys(ITEMS))if(!Object.hasOwn(data.resources,id))data.resources[id]=0;for(const p of data.people||[])p.skills.mining||={xp:0,completed:0,seconds:0};}
    const valid = (condition) => { if (!condition) throw new Error('Guardado de civilización inválido.'); };
    const number = (n, max, integer = false) => Number.isFinite(n) && n >= 0 && n <= max && (!integer || Number.isInteger(n));
    valid(data?.version === 4 && data.seed === world.seed && number(data.time, 1e9) && typeof data.firepit === 'boolean');
    const sim = new Simulation(world);
    valid(Array.isArray(data.unlocked)&&data.unlocked.length>=16&&data.unlocked.length<=48&&new Set(data.unlocked).size===data.unlocked.length&&initialSectors().every(k=>data.unlocked.includes(k))&&data.unlocked.every(k=>/^\d+,\d+$/.test(k)&&Number(k.split(',')[0])<8&&Number(k.split(',')[1])<6));sim.unlocked=new Set(data.unlocked);
    const seen=new Set(['0,0']),queue=['0,0'];for(let i=0;i<queue.length;i++){const [x,y]=queue[i].split(',').map(Number);for(const [a,b] of neighbours(x,y)){const k=key(a,b);if(sim.unlocked.has(k)&&!seen.has(k)){seen.add(k);queue.push(k);}}}valid(seen.size===sim.unlocked.size);
    valid(Array.isArray(data.scavenged)&&new Set(data.scavenged).size===data.scavenged.length&&data.scavenged.every(k=>world.scatter.some(s=>key(s.x,s.y)===k)));sim.scavenged=new Set(data.scavenged);
    valid(data.resources && Object.keys(sim.resources).every(k => number(data.resources[k], 1e7, true)));
    sim.resources = Object.fromEntries(Object.keys(sim.resources).map(k => [k, data.resources[k]])); sim.time = data.time; sim.firepit = data.firepit;
    valid(sim.resources.stoneAxe<=1&&sim.resources.stonePick<=1);
    valid(Array.isArray(data.mined)&&new Set(data.mined.map(n=>n?.[0])).size===data.mined.length);
    for(const entry of data.mined){valid(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==='string');const [x,y]=entry[0].split(',').map(Number),node=world.mineralAt(x,y);valid(node&&key(x,y)===entry[0]&&MINERAL_ITEMS[node.kind]&&number(entry[1],node.richness,true));sim.mined.set(entry[0],entry[1]);}
    const s = data.shelter, defaults = createShelter();
    valid(s && ['x', 'y', 'width', 'height'].every(k => s[k] === defaults[k]) && typeof s.reserved === 'boolean' && typeof s.complete === 'boolean' && number(s.progress, 1) && s.contributions && sim.people.every(p => number(s.contributions[p.id], SHELTER_WORK)));
    valid((!s.complete || s.reserved && s.progress === 1) && (s.reserved || s.progress === 0 && Object.values(s.contributions).every(n => n === 0)));
    sim.shelter = structuredClone(s);
    valid(Array.isArray(data.timber) && data.timber.length === sim.timber.size && new Set(data.timber.map(t => t?.[0])).size === sim.timber.size);
    for (const t of data.timber) { valid(Array.isArray(t) && sim.timber.has(t[0]) && number(t[1], 3, true)); sim.timber.set(t[0], t[1]); }
    valid(Array.isArray(data.shrubs) && data.shrubs.length === sim.shrubs.length);
    data.shrubs.forEach((n, i) => { valid(number(n, 8, true)); sim.shrubs[i].remaining = n; });
    valid(Array.isArray(data.people) && data.people.length === 3 && new Set(data.people.map(p => p.id)).size === 3);
    for (const saved of data.people) {
      if (legacy && sim.shrubs.some(s => Math.floor(saved.x) === s.x && Math.floor(saved.y) === s.y)) { const t = neighbours(Math.floor(saved.x), Math.floor(saved.y)).map(([x, y]) => world.get(x, y)).find(t => sim.walkable(t)); if (t) { saved.x = t.x + .5; saved.y = t.y + .5; } }
      const p = sim.person(saved.id); valid(p && number(saved.x, world.width - .001) && number(saved.y, world.height - .001) && sim.walkable(world.get(Math.floor(saved.x), Math.floor(saved.y))));
      valid(saved.specialty === null || knownSkill(saved.specialty)); valid(saved.skills && Object.keys(saved.skills).length === Object.keys(SKILLS).length && Object.keys(SKILLS).every(k => number(saved.skills[k]?.xp, threshold(MAX_LEVEL), true) && number(saved.skills[k]?.completed, 1e7, true) && number(saved.skills[k]?.seconds, 1e9)));
      valid(number(saved.completed, 1e7, true) && saved.completed === Object.values(saved.skills).reduce((n, s) => n + s.completed, 0));
      valid(Array.isArray(saved.explored) && saved.explored.length <= world.width * world.height && new Set(saved.explored).size === saved.explored.length && saved.explored.every(k => /^\d+,\d+$/.test(k) && Number(k.split(',')[0])<world.width && Number(k.split(',')[1])<world.height));
      valid(saved.needs && number(saved.needs.water, 100) && number(saved.needs.energy, 100));
      valid(Array.isArray(saved.history) && saved.history.length <= 20 && saved.history.every(h => knownTask(h.kind) && number(h.time, data.time) && number(h.xp, 100, true) && typeof h.outcome === 'string' && h.outcome.length < 100));
      Object.assign(p, { x: saved.x, y: saved.y, needs: { ...saved.needs }, specialty: saved.specialty, skills: structuredClone(saved.skills), completed: saved.completed, history: structuredClone(saved.history), explored: [...saved.explored] });
      if (saved.order) {
        valid((saved.order.kind === 'move' || knownTask(saved.order.kind)) && number(saved.order.progress, 1) && saved.order.target && Number.isInteger(saved.order.target.x) && Number.isInteger(saved.order.target.y));
        let result = sim.assign(p.id, saved.order.kind, saved.order.target);
        if (!result.ok && ['logging', 'foraging', 'drink','scavenge','mining'].includes(saved.order.kind)) result = sim.assign(p.id, saved.order.kind);
        if (result.ok && p.job.source?.x === saved.order.target.x && p.job.source?.y === saved.order.target.y) p.job.progress = saved.order.progress;
        else if (result.ok && (['study', 'building', 'cooking', 'rest', 'sleep','eat'].includes(saved.order.kind)||RECIPES[saved.order.kind])) p.job.progress = saved.order.progress;
      }
    }
    sim.revision = 0; return sim;
  }
}
