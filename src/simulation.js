import { SIZE } from './core.js';

export const SKILLS = {
  logging: { name: 'Tala', profession: 'Leñador', action: 'Talar', seconds: 5, xp: 14, detail: 'Busca un árbol cercano y obtiene 4 de madera.' },
  foraging: { name: 'Recolección', profession: 'Recolector', action: 'Recolectar', seconds: 4, xp: 10, detail: 'Recoge alimento de los arbustos del valle.' },
  study: { name: 'Investigación', profession: 'Investigador', action: 'Estudiar', seconds: 8, xp: 16, detail: 'Observa y experimenta. Aporta 1 de conocimiento.' },
  exploration: { name: 'Exploración', profession: 'Explorador', action: 'Explorar', seconds: 3, xp: 12, detail: 'Reconoce una parcela nueva. No repite XP en el mismo lugar.' },
  building: { name: 'Construcción', profession: 'Constructor', action: 'Preparar fogón', seconds: 8, xp: 25, detail: 'Requiere 5 de madera y el descubrimiento del fuego.' },
  cooking: { name: 'Cocina', profession: 'Cocinero', action: 'Cocinar', seconds: 6, xp: 14, detail: 'Convierte 1 alimento y 1 madera en 1 comida.' },
};
export const MAX_LEVEL = 20;
const knownSkill = id => typeof id === 'string' && Object.hasOwn(SKILLS, id);
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
    this.world = world; this.time = 0; this.resources = { wood: 0, rawFood: 0, meals: 0, knowledge: 0 };
    this.firepit = false; this.events = []; this.revision = 0;
    this.people = founders.map(p => ({ ...p, specialty: null, job: null, state: 'Libre', completed: 0, history: [], explored: [], skills: Object.fromEntries(Object.keys(SKILLS).map(id => [id, { xp: 0, completed: 0, seconds: 0 }])) }));
    this.timber = new Map(world.tiles.filter(t => t.tree).map(t => [key(t.x, t.y), 3]));
    this.shrubs = shrubSites.map(([x, y]) => ({ x, y, remaining: 8 }));
  }
  person(id) { return this.people.find(p => p.id === id); }
  standing(x, y) { return (this.timber.get(key(x, y)) || 0) > 0; }
  walkable(tile) { return tile && tile.type !== 'water' && !this.standing(tile.x, tile.y); }
  route(person, target) { return findRoute(this.world, person, target, t => this.walkable(t)); }
  emit(text) { this.events.push(text); this.events = this.events.slice(-20); this.revision++; }
  blockReason(kind) {
    if (kind === 'building' && this.firepit) return 'El fogón ya está preparado.';
    if (kind === 'building' && this.resources.knowledge < 3) return 'Estudia hasta reunir 3 de conocimiento para descubrir el fuego.';
    if (kind === 'building' && this.resources.wood < 5) return 'Necesitas 5 de madera para preparar el fogón.';
    if (kind === 'cooking' && !this.firepit) return 'Primero descubre el fuego y prepara un fogón.';
    if (kind === 'cooking' && (this.resources.rawFood < 1 || this.resources.wood < 1)) return 'Necesitas 1 alimento y 1 madera por comida.';
    return '';
  }
  nearest(person, kind, preferred) {
    const candidates = [];
    if (kind === 'logging') for (const t of this.world.tiles) if (this.standing(t.x, t.y)) for (const [x, y] of neighbours(t.x, t.y)) if (this.walkable(this.world.get(x, y))) candidates.push({ x, y, source: { x: t.x, y: t.y } });
    if (kind === 'foraging') for (const s of this.shrubs) if (s.remaining > 0) candidates.push({ x: s.x, y: s.y, source: { x: s.x, y: s.y } });
    if (kind === 'exploration') for (const t of this.world.tiles) if (this.walkable(t) && !person.explored.includes(key(t.x, t.y)) && Math.hypot(t.x + .5 - person.x, t.y + .5 - person.y) >= 3) candidates.push({ x: t.x, y: t.y, source: { x: t.x, y: t.y } });
    if (kind === 'study') candidates.push({ x: Math.floor(person.x), y: Math.floor(person.y) });
    if (kind === 'building' || kind === 'cooking') candidates.push({ x: 21, y: 16 });
    candidates.sort((a, b) => {
      const preferredA = preferred && a.source?.x === preferred.x && a.source?.y === preferred.y;
      const preferredB = preferred && b.source?.x === preferred.x && b.source?.y === preferred.y;
      return Number(preferredB) - Number(preferredA) || Math.abs(a.x - person.x) + Math.abs(a.y - person.y) - Math.abs(b.x - person.x) - Math.abs(b.y - person.y);
    });
    for (const candidate of candidates) { const path = this.route(person, candidate); if (path) return { ...candidate, path }; }
    return null;
  }
  assign(id, kind, destination) {
    const person = this.person(id); if (!person) return { ok: false, reason: 'Habitante desconocido.' };
    if (kind !== 'move' && !knownSkill(kind)) return { ok: false, reason: 'Tarea desconocida.' };
    const reason = this.blockReason(kind); if (reason) return { ok: false, reason };
    let target;
    if (kind === 'move') {
      if (!destination || !Number.isInteger(destination.x) || !Number.isInteger(destination.y)) return { ok: false, reason: 'Elige una parcela de tierra.' };
      const path = this.route(person, destination); if (path) target = { ...destination, path };
    } else target = this.nearest(person, kind, destination);
    if (!target) return { ok: false, reason: 'No hay un destino accesible para esa tarea.' };
    person.job = { kind, target: { x: target.x, y: target.y }, source: target.source || null, path: target.path, progress: 0, cycles: 0 };
    person.state = 'Caminando'; this.revision++; return { ok: true };
  }
  stop(id) { const p = this.person(id); if (p) { p.job = null; p.state = 'Libre'; this.revision++; } }
  setSpecialty(id, skill) { const p = this.person(id); if (p && (skill === '' || knownSkill(skill))) { p.specialty = skill || null; this.revision++; } }
  speed(person, kind) { return 1 + (skillLevel(person.skills[kind].xp) - 1) * .04 + (person.specialty === kind ? .1 : 0); }
  award(person, kind, outcome) {
    const skill = person.skills[kind], oldLevel = skillLevel(skill.xp), oldXP = skill.xp;
    skill.xp = Math.min(threshold(MAX_LEVEL), skill.xp + SKILLS[kind].xp); skill.completed++; person.completed++;
    person.history.unshift({ kind, time: Math.floor(this.time), xp: skill.xp - oldXP, outcome }); person.history = person.history.slice(0, 20);
    if (skillLevel(skill.xp) > oldLevel) this.emit(`${person.name}: ${SKILLS[kind].name} nivel ${skillLevel(skill.xp)}.`);
    this.revision++;
  }
  complete(person) {
    const { kind, source } = person.job, r = this.resources;
    const reason = this.blockReason(kind); if (reason) return { ok: false, reason };
    let outcome = '';
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
    if (kind === 'study') { r.knowledge++; outcome = '+1 conocimiento'; if (r.knowledge === 3) this.emit('Descubrimiento: fuego controlado. Ya puedes preparar un fogón.'); }
    if (kind === 'exploration') {
      const id = key(source.x, source.y); if (person.explored.includes(id)) return { ok: false, depleted: true };
      person.explored.push(id); outcome = 'Parcela reconocida';
    }
    if (kind === 'building') { r.wood -= 5; this.firepit = true; outcome = 'Fogón preparado'; this.emit(`${person.name} preparó el primer fogón.`); }
    if (kind === 'cooking') { r.rawFood--; r.wood--; r.meals++; outcome = '+1 comida'; }
    this.award(person, kind, outcome); return { ok: true };
  }
  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.time += dt;
    for (const person of this.people) {
      const job = person.job; if (!job) continue;
      if (job.kind === 'building' && this.firepit) { this.stop(person.id); continue; }
      if (job.path.length) {
        let travel = dt * 1.65;
        while (travel > 0 && job.path.length) {
          const next = job.path[0], dx = next.x - person.x, dy = next.y - person.y, distance = Math.hypot(dx, dy);
          if (distance <= travel) { person.x = next.x; person.y = next.y; job.path.shift(); travel -= distance; }
          else { person.x += dx / distance * travel; person.y += dy / distance * travel; travel = 0; }
        }
        person.state = 'Caminando';
        if (!job.path.length && job.kind === 'move') this.stop(person.id);
        continue;
      }
      if (job.kind === 'move') { this.stop(person.id); continue; }
      person.state = SKILLS[job.kind].action;
      const reason = this.blockReason(job.kind);
      if (reason) { person.state = reason; job.progress = 0; continue; }
      job.progress += dt * this.speed(person, job.kind) / SKILLS[job.kind].seconds;
      person.skills[job.kind].seconds += dt;
      if (job.progress < 1) continue;
      const result = this.complete(person); job.progress = 0;
      if (!result.ok && !result.depleted) { person.state = result.reason; continue; }
      job.cycles++;
      if (job.kind === 'building') { this.stop(person.id); continue; }
      if (result.depleted || job.kind === 'exploration' || job.kind === 'logging' && !this.standing(job.source.x, job.source.y) || job.kind === 'foraging' && !this.shrubs.find(s => s.x === job.source.x && s.y === job.source.y)?.remaining) {
        const next = this.nearest(person, job.kind);
        if (!next) { this.stop(person.id); this.emit(`${person.name}: no quedan recursos accesibles para esa tarea.`); }
        else { job.target = { x: next.x, y: next.y }; job.source = next.source || null; job.path = next.path; }
      }
    }
  }
  snapshot() {
    return { version: 1, seed: this.world.seed, time: this.time, resources: { ...this.resources }, firepit: this.firepit,
      timber: [...this.timber], shrubs: this.shrubs.map(s => s.remaining),
      people: this.people.map(p => ({ id: p.id, x: p.x, y: p.y, specialty: p.specialty, skills: structuredClone(p.skills), completed: p.completed, history: structuredClone(p.history), explored: [...p.explored], order: p.job ? { kind: p.job.kind, target: p.job.source || p.job.target, progress: Math.min(p.job.progress, .999) } : null })) };
  }
  static restore(world, data) {
    const valid = (condition) => { if (!condition) throw new Error('Guardado de civilización inválido.'); };
    const number = (n, max, integer = false) => Number.isFinite(n) && n >= 0 && n <= max && (!integer || Number.isInteger(n));
    valid(data?.version === 1 && data.seed === world.seed && number(data.time, 1e9) && typeof data.firepit === 'boolean');
    const sim = new Simulation(world);
    valid(data.resources && Object.keys(sim.resources).every(k => number(data.resources[k], 1e7, true)));
    sim.resources = Object.fromEntries(Object.keys(sim.resources).map(k => [k, data.resources[k]])); sim.time = data.time; sim.firepit = data.firepit;
    valid(Array.isArray(data.timber) && data.timber.length === sim.timber.size && new Set(data.timber.map(t => t?.[0])).size === sim.timber.size);
    for (const t of data.timber) { valid(Array.isArray(t) && sim.timber.has(t[0]) && number(t[1], 3, true)); sim.timber.set(t[0], t[1]); }
    valid(Array.isArray(data.shrubs) && data.shrubs.length === sim.shrubs.length);
    data.shrubs.forEach((n, i) => { valid(number(n, 8, true)); sim.shrubs[i].remaining = n; });
    valid(Array.isArray(data.people) && data.people.length === 3 && new Set(data.people.map(p => p.id)).size === 3);
    for (const saved of data.people) {
      const p = sim.person(saved.id); valid(p && number(saved.x, SIZE - .001) && number(saved.y, SIZE - .001) && sim.walkable(world.get(Math.floor(saved.x), Math.floor(saved.y))));
      valid(saved.specialty === null || knownSkill(saved.specialty)); valid(saved.skills && Object.keys(saved.skills).length === Object.keys(SKILLS).length && Object.keys(SKILLS).every(k => number(saved.skills[k]?.xp, threshold(MAX_LEVEL), true) && number(saved.skills[k]?.completed, 1e7, true) && number(saved.skills[k]?.seconds, 1e9)));
      valid(number(saved.completed, 1e7, true) && saved.completed === Object.values(saved.skills).reduce((n, s) => n + s.completed, 0));
      valid(Array.isArray(saved.explored) && saved.explored.length <= SIZE * SIZE && new Set(saved.explored).size === saved.explored.length && saved.explored.every(k => /^\d+,\d+$/.test(k) && k.split(',').every(n => Number(n) < SIZE)));
      valid(Array.isArray(saved.history) && saved.history.length <= 20 && saved.history.every(h => knownSkill(h.kind) && number(h.time, data.time) && number(h.xp, 100, true) && typeof h.outcome === 'string' && h.outcome.length < 100));
      Object.assign(p, { x: saved.x, y: saved.y, specialty: saved.specialty, skills: structuredClone(saved.skills), completed: saved.completed, history: structuredClone(saved.history), explored: [...saved.explored] });
      if (saved.order) {
        valid((saved.order.kind === 'move' || knownSkill(saved.order.kind)) && number(saved.order.progress, 1) && saved.order.target && Number.isInteger(saved.order.target.x) && Number.isInteger(saved.order.target.y));
        const result = sim.assign(p.id, saved.order.kind, saved.order.target);
        if (result.ok && p.job.source?.x === saved.order.target.x && p.job.source?.y === saved.order.target.y) p.job.progress = saved.order.progress;
        else if (result.ok && ['study', 'building', 'cooking'].includes(saved.order.kind)) p.job.progress = saved.order.progress;
      }
    }
    sim.revision = 0; return sim;
  }
}
