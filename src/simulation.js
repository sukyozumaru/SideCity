import { SHELTER_COST, SHELTER_WORK, createShelter, insideShelter, shelterPlaces } from './camp.js';
import { initialSectors, sectorOf, SECTOR_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from './terrain.js';
import { ITEMS, RECIPES, MINERAL_ITEMS, recipeReason } from './items.js';
import { constructionMethods, workPlaces } from './construction.js';
import { communityMethods } from './community.js';
import { migrateSettlement, restoreSettlement } from './settlement-save.js';
import { FARM_TASKS,farmingMethods } from './farming.js';
import { livingMethods,TOPICS } from './living.js';
import { migrateLiving,restoreLiving } from './living-save.js';

export const SKILLS = {
  farming:{name:'Cultivo',profession:'Horticultor',action:'Cultivar',seconds:5,xp:12,detail:'Prepara tierra, siembra, riega y recoge raíces.'},
  logging: { name: 'Tala', profession: 'Leñador', action: 'Talar', seconds: 5, xp: 14, detail: 'Busca un árbol cercano y obtiene 4 de madera.' },
  foraging: { name: 'Recolección', profession: 'Recolector', action: 'Recolectar', seconds: 4, xp: 10, detail: 'Recoge alimento de los arbustos del valle.' },
  study: { name: 'Investigación', profession: 'Investigador', action: 'Estudiar', seconds: 8, xp: 16, detail: 'Observa y experimenta. Aporta 1 de conocimiento.' },
  exploration: { name: 'Exploración', profession: 'Explorador', action: 'Explorar', seconds: 3, xp: 12, detail: 'Reconoce una parcela nueva. No repite XP en el mismo lugar.' },
  building: { name: 'Construcción', profession: 'Constructor', action: 'Preparar fogón', seconds: 8, xp: 25, detail: 'Requiere 5 de madera y el descubrimiento del fuego.' },
  cooking: { name: 'Cocina', profession: 'Cocinero', action: 'Cocinar', seconds: 6, xp: 14, detail: 'Convierte 1 alimento y 1 madera en 1 comida.' },
  mining: { name: 'Minería', profession: 'Minero', action: 'Extraer roca', seconds: 7, xp: 12, detail: 'Extrae hasta 2 materiales por trabajo. Requiere un pico de piedra.' },
};
export const TASKS = {
  ...FARM_TASKS,
  ...Object.fromEntries(Object.entries(SKILLS).filter(([id])=>id!=='farming').map(([id, skill]) => [id, { ...skill, skill: id, category: id === 'building' ? 'build' : 'work' }])),
  shelter: { action: 'Construir refugio', skill: 'building', category: 'build', seconds: SHELTER_WORK, detail: '20 madera, una sola reserva. Los tres pueden colaborar.' },
  bridge: { action:'Construir puente',skill:'building',category:'build',seconds:36,detail:'Elige una orilla en Construir. La obra se comparte entre los constructores.' },
  wander:{action:'Pasear',category:'care',seconds:2,detail:'Da una vuelta corta por tierra cercana, sin XP.'},
  social: { action:'Conversar',category:'care',seconds:8,detail:'Habla con un habitante libre cercano. Refuerza el vínculo, sin XP de oficio.' },
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
  constructor(world,{autonomy=true}={}) {
    this.world = world; this.time = 0; this.resources = Object.fromEntries(Object.keys(ITEMS).map(id=>[id,0]));
    this.resources.seeds=6;this.plots=[];this.nextPlot=1;this.culture={exchanges:0,log:[]};this.circles=[];this.nextCircle=1;this.defaultAutonomy=autonomy;
    this.firepit = false; this.events = []; this.revision = 0;
    this.shelter = createShelter(); this.feedback = [];
    this.buildings=[this.shelter];this.nextBuilding=2;this.relationships=new Map();this.households=[];this.nextPerson=1;
    this.unlocked = new Set(initialSectors()); this.scavenged = new Set(); this.mined = new Map();
    this.people = founders.map(p => this.createPerson(p));
    this.timber = new Map(world.tiles.filter(t => t.tree).map(t => [key(t.x, t.y), 3]));
    this.shrubs = shrubSites.map(([x, y]) => ({ x, y, remaining: 8 }));
  }
  person(id) { return this.people.find(p => p.id === id); }
  createPerson(data){return {autonomy:this.defaultAutonomy,mood:65,company:65,autoAt:this.time+12+([...data.id].reduce((n,c)=>n+c.charCodeAt(0),0)%9),memories:[],resumeOrder:null,moveSpeed:0,gait:0,stage:'adult',parents:[],bornAt:0,...data,direction:{x:1,y:0},needs:{water:90,energy:90},specialty:null,job:null,state:'Libre',completed:0,history:[],explored:[],skills:Object.fromEntries(Object.keys(SKILLS).map(id=>[id,{xp:0,completed:0,seconds:0}]))};}
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
  walkable(tile) { return tile && !this.plotAt(tile.x,tile.y) && this.isUnlocked(tile.x,tile.y) && (tile.type !== 'water'||this.hasBridge(tile.x,tile.y)) && !this.standing(tile.x, tile.y) && !(this.world.mineralAt(tile.x,tile.y)&&this.mineralRemaining(this.world.mineralAt(tile.x,tile.y))) && !this.shrubs.some(s => s.x === tile.x && s.y === tile.y) && !this.buildings.some(b=>b.kind==='shelter'&&b.reserved&&insideShelter(b,tile.x,tile.y)); }
  route(person, target) { return findRoute(this.world, person, target, t => this.walkable(t)); }
  emit(text) { this.events.push(text); this.events = this.events.slice(-20); this.revision++; }
  knowsFire() { return this.firepit || this.resources.knowledge >= 3 || this.people.reduce((n,p)=>n+p.skills.study.completed,0)>=3; }
  blockReason(kind,destination) {
    if(FARM_TASKS[kind])return this.farmReason(kind,destination);
    if(['shelter','bridge'].includes(kind)){
      const b=destination?.buildingId?this.project(destination.buildingId):this.activeProject(kind);
      if(!b||b.kind!==kind||b.complete)return 'Elige dónde crear una obra en el menú Construir.';
      if(kind==='bridge'&&!b.reserved)return 'Coloca primero el puente desde Construir.';
      if(!b.reserved&&this.resources.wood<SHELTER_COST)return 'Necesitas 20 de madera. Se reservan una sola vez para toda la obra.';
      if(!b.reserved&&this.people.some(p=>insideShelter(b,p.x,p.y)))return 'Mueve al habitante que está en el solar antes de empezar.';
      return '';
    }
    if (RECIPES[kind]) return recipeReason(this.resources,kind);
    if (kind === 'mining' && !this.resources.stonePick) return 'Fabrica un pico de piedra en Almacén → Fabricar.';
    if (kind === 'eat' && this.resources.meals < 1 && this.resources.rawFood < 1 && this.resources.vegetables<1) return 'Recoge bayas o prepara una comida primero.';
    if (kind === 'sleep' && !this.homes().length) return 'Primero termina un refugio. Mientras tanto puedes descansar al aire libre.';
    if (kind === 'building' && this.firepit) return 'El fogón ya está preparado.';
    if (kind === 'building' && !this.knowsFire()) return 'Completa tres estudios para descubrir el fuego.';
    if (kind === 'building' && this.resources.wood < 5) return 'Necesitas 5 de madera para preparar el fogón.';
    if (kind === 'cooking' && !this.firepit) return 'Primero descubre el fuego y prepara un fogón.';
    if (kind === 'cooking' && (this.resources.rawFood+this.resources.vegetables < 1 || this.resources.wood < 1)) return 'Necesitas 1 baya o raíz y 1 madera por comida.';
    return '';
  }
  nearest(person, kind, preferred) {
    const candidates = FARM_TASKS[kind]?this.farmCandidates(person,kind,preferred):[];
    if(kind==='wander')for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=Math.floor(person.x)+dx,y=Math.floor(person.y)+dy;if(Math.hypot(dx,dy)>=2&&Math.hypot(dx,dy)<=4&&this.walkable(this.world.get(x,y))&&!this.people.some(p=>p!==person&&Math.hypot(p.x-x-.5,p.y-y-.5)<1))candidates.push({x,y});}
    if (kind === 'logging') for (const t of this.world.tiles) if (this.isUnlocked(t.x,t.y)&&this.standing(t.x, t.y)) for (const [x, y] of neighbours(t.x, t.y)) if (this.walkable(this.world.get(x, y))) candidates.push({ x, y, source: { x: t.x, y: t.y } });
    if (kind === 'foraging') for (const s of this.shrubs) if (s.remaining > 0) for (const [x, y] of neighbours(s.x, s.y)) if (this.walkable(this.world.get(x, y))) candidates.push({ x, y, source: { x: s.x, y: s.y } });
    if (kind === 'exploration') for (const t of this.world.tiles) if (this.walkable(t) && !person.explored.includes(key(t.x, t.y)) && Math.hypot(t.x + .5 - person.x, t.y + .5 - person.y) >= 3) candidates.push({ x: t.x, y: t.y, source: { x: t.x, y: t.y } });
    if (['study','rest','eat'].includes(kind)) candidates.push({ x: Math.floor(person.x), y: Math.floor(person.y) });
    if (RECIPES[kind]) candidates.push({x:22,y:16});
    if(kind==='mining')for(const node of this.world.minerals)if(MINERAL_ITEMS[node.kind]&&this.isUnlocked(node.x,node.y)&&this.mineralRemaining(node)>0)for(const [x,y]of neighbours(node.x,node.y))if(this.walkable(this.world.get(x,y)))candidates.push({x,y,source:{x:node.x,y:node.y}});
    if (kind === 'building' || kind === 'cooking') candidates.push({ x: 21, y: 16 });
    if (['shelter','bridge'].includes(kind)){const b=preferred?.buildingId?this.project(preferred.buildingId):this.activeProject(kind);if(b)candidates.push(...workPlaces(b).filter(t=>this.walkable(this.world.get(t.x,t.y))).map(t=>({...t,source:{x:t.x,y:t.y,buildingId:b.id}})));}
    if(kind==='sleep')for(const b of this.homes())for(const t of shelterPlaces(b))if(this.walkable(this.world.get(t.x,t.y)))candidates.push({...t,source:{x:t.x,y:t.y,buildingId:b.id}});
    if(kind==='social')for(const other of this.people)if(other.id!==person.id&&this.canTalkTo(other)&&(!preferred?.personId||preferred.personId===other.id))for(const [x,y]of neighbours(Math.floor(other.x),Math.floor(other.y)))if(this.walkable(this.world.get(x,y)))candidates.push({x,y,source:{x:Math.floor(other.x),y:Math.floor(other.y),personId:other.id,topic:preferred?.topic||'greeting'}});
    if (kind === 'drink') for (const t of this.world.tiles) if (this.walkable(t)) for (const [x, y] of neighbours(t.x, t.y)) if (this.world.get(x, y)?.type === 'water') candidates.push({ x: t.x, y: t.y, source: { x, y } });
    if(kind==='scavenge') for(const item of this.world.scatter)if(!this.scavenged.has(key(item.x,item.y))&&this.walkable(this.world.get(item.x,item.y)))candidates.push({x:item.x,y:item.y,source:{x:item.x,y:item.y}});
    const filtered = preferred && ['logging', 'foraging', 'drink','scavenge','mining'].includes(kind) ? candidates.filter(c => c.source?.x === preferred.x && c.source?.y === preferred.y) : candidates;
    if(kind==='wander')filtered.sort((a,b)=>Math.sin(a.x*13+a.y*7+this.time*.13)-Math.sin(b.x*13+b.y*7+this.time*.13));
    else filtered.sort((a, b) => {
      const occupied = c => this.people.some(p => p.id !== person.id && p.job?.target.x === c.x && p.job?.target.y === c.y);
      const preferredA = preferred && a.source?.x === preferred.x && a.source?.y === preferred.y;
      const preferredB = preferred && b.source?.x === preferred.x && b.source?.y === preferred.y;
      return Number(occupied(a)) - Number(occupied(b)) || Number(preferredB) - Number(preferredA) || Math.abs(a.x - person.x) + Math.abs(a.y - person.y) - Math.abs(b.x - person.x) - Math.abs(b.y - person.y);
    });
    for (const candidate of filtered) { if(['sleep','shelter','bridge'].includes(kind)&&this.people.some(p=>p.id!==person.id&&p.job&&['sleep','shelter','bridge'].includes(p.job.kind)&&p.job.target.x===candidate.x&&p.job.target.y===candidate.y))continue;const path = this.route(person, candidate); if (path) return { ...candidate, path }; }
    return null;
  }
  assign(id, kind, destination,{automatic=false,restoring=false}={}) {
    const person = this.person(id); if (!person) return { ok: false, reason: 'Habitante desconocido.' };
    if (kind !== 'move' && !knownTask(kind)) return { ok: false, reason: 'Tarea desconocida.' };
    if(person.stage==='child'&&!['move','wander','rest','sleep','eat','drink','social'].includes(kind))return {ok:false,reason:'Está en la infancia. Los trabajos se desbloquean al crecer.'};
    if(kind==='social'&&destination?.topic&&!Object.hasOwn(TOPICS,destination.topic))return{ok:false,reason:'Tema de conversación desconocido.'};
    if(kind==='social'&&destination?.personId&&this.people.some(p=>p!==person&&p.job?.kind==='social'&&p.job.source?.personId===destination.personId))return{ok:false,reason:'Ya hay una conversación en curso.'};
    const reason = this.blockReason(kind,destination); if (reason) return { ok: false, reason };
    let target;
    if (kind === 'move') {
      if (!destination || !Number.isInteger(destination.x) || !Number.isInteger(destination.y)) return { ok: false, reason: 'Elige una parcela de tierra.' };
      const path = this.route(person, destination); if (path) target = { ...destination, path };
    } else target = this.nearest(person, kind, destination);
    if (!target) return { ok: false, reason: kind==='mining'?'No hay piedra, carbón, cobre o estaño accesible en el territorio abierto. Abre un sector vecino.':'No hay un destino accesible para esa tarea.' };
    if (kind === 'shelter') {const b=this.project(target.source.buildingId);if(!b.reserved){this.resources.wood-=SHELTER_COST;b.reserved=true;this.emit('Obra iniciada: 20 de madera reservados para el refugio.');}}
    if(!restoring&&!automatic){person.resumeOrder=null;person.autoAt=this.time+15;}
    if(kind==='social'){const other=this.person(target.source?.personId);if(other?.job?.automatic&&other.job.kind==='wander')this.stop(other.id);}
    person.job = { automatic,kind, target: { x: target.x, y: target.y }, source: target.source || null, path: target.path, progress: 0, cycles: 0 };
    person.state = 'Caminando'; this.revision++; return { ok: true };
  }
  stop(id,{manual=false}={}) { const p=this.person(id);if(p){p.job=null;p.state='Libre';p.moveSpeed=0;p.autoAt=Math.max(p.autoAt,this.time+(manual?45:8));if(manual)p.resumeOrder=null;this.revision++;} }
  cancelShelter() {
    return this.cancelBuilding(this.shelter.id);
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
    const reason = this.blockReason(kind,source); if (reason) return { ok: false, reason };
    if(FARM_TASKS[kind])return this.completeFarm(person);
    let outcome = '';
    if(kind==='social'){
      const other=this.person(source.personId);
      if(!other||!this.canTalkTo(other)||Math.hypot(other.x-person.x,other.y-person.y)>1.6)return{ok:false,reason:'La otra persona se ha alejado o está ocupada.'};
      const bond=this.finishConversation(person,other,source.topic);outcome=`Conversó con ${other.name} · +${bond} vínculo`;
      person.history.unshift({kind,time:Math.floor(this.time),xp:0,outcome});person.history=person.history.slice(0,20);this.feedback.push({kind,x:person.x,y:person.y,time:this.time,outcome:`+${bond} vínculo`});return{ok:true};
    }
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
    if(kind==='wander'){person.mood=Math.min(100,person.mood+2);this.revision++;return{ok:true};}
    if (['drink', 'rest', 'sleep','eat'].includes(kind)) {
      if (kind === 'drink') { person.needs.water = Math.min(100, person.needs.water + 65); outcome = 'Hidratación recuperada'; }
      else if(kind==='eat'){const food=r.meals>0?'meals':r.vegetables>0?'vegetables':'rawFood';r[food]--;person.needs.energy=Math.min(100,person.needs.energy+(food==='meals'?25:food==='vegetables'?15:10));outcome=food==='meals'?'Una comida del almacén':food==='vegetables'?'Una porción de raíces':'Una porción de bayas';}
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
    if (kind === 'cooking') { r[r.rawFood>0?'rawFood':'vegetables']--; r.wood--; r.meals++; outcome = '+1 comida'; }
    this.award(person, kind, outcome);
    if(kind==='study'&&!knewFire&&this.knowsFire())this.emit('Descubrimiento: fuego controlado. Ya puedes preparar un fogón.');
    this.feedback.push({ kind, x: person.x, y: person.y, source, time: this.time, outcome });
    this.feedback = this.feedback.slice(-24); return { ok: true };
  }
  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.time += dt;
    this.updateCommunity(dt);this.updateFarms(dt);this.updateLiving(dt);
    this.feedback = this.feedback.filter(f => this.time - f.time < 1.6);
    for (const person of this.people) {
      if(person.stage==='child'){person.needs.water=Math.max(75,person.needs.water);person.needs.energy=Math.max(75,person.needs.energy);}
      person.needs.water = Math.max(0, person.needs.water - dt * (person.stage==='child'?0:.025));
      person.needs.energy = Math.max(0, person.needs.energy - dt * (person.job ? .03 : .01));
      if (!person.job && person.needs.water < 25) this.assign(person.id, 'drink',undefined,{automatic:true});
      else if (!person.job && person.needs.energy < 25) this.assign(person.id, this.homes().length ? 'sleep' : 'rest',undefined,{automatic:true});
      const job = person.job; if (!job) continue;
      if(RECIPES[job.kind]&&this.resources[RECIPES[job.kind].output]>0){this.stop(person.id);continue;}
      if (job.kind === 'building' && this.firepit) { this.stop(person.id); continue; }
      if (['shelter','bridge'].includes(job.kind) && this.jobProject(job).complete) { this.stop(person.id); continue; }
      if (job.path.length) {
        const waypoint = job.path[0];
        if (!this.walkable(this.world.get(Math.floor(waypoint.x), Math.floor(waypoint.y)))) {
          const reroute = this.route(person, job.target); if (!reroute) { this.stop(person.id); continue; } job.path = reroute;
        }
        const finalDistance=job.path.length===1?Math.hypot(job.path[0].x-person.x,job.path[0].y-person.y):1,desired=1.65*Math.max(.35,Math.min(1,finalDistance/.5));person.moveSpeed=Math.min(desired,(person.moveSpeed||0)+dt*4);
        let travel=dt*person.moveSpeed;
        while (travel > 0 && job.path.length) {
          const next = job.path[0], dx = next.x - person.x, dy = next.y - person.y, distance = Math.hypot(dx, dy);
          if (distance > .001) person.direction = { x: dx / distance, y: dy / distance };
          person.gait+=(Math.min(distance,travel));
          if (distance <= travel) { person.x = next.x; person.y = next.y; job.path.shift(); travel -= distance; }
          else { person.x += dx / distance * travel; person.y += dy / distance * travel; travel = 0; }
        }
        person.state = 'Caminando';
        if (!job.path.length && job.kind === 'move') this.stop(person.id);
        continue;
      }
      if (job.kind === 'move') { this.stop(person.id); continue; }
      person.moveSpeed=0;person.state = TASKS[job.kind].action;
      const reason = this.blockReason(job.kind,job.source);
      if (reason) { person.state = reason; job.progress = 0; continue; }
      if (job.source) { const dx = (job.kind==='waterPlot'&&job.source.fetch?job.source.waterX:job.source.x) + .5 - person.x, dy = (job.kind==='waterPlot'&&job.source.fetch?job.source.waterY:job.source.y) + .5 - person.y, d = Math.hypot(dx, dy); if (d) person.direction = { x: dx / d, y: dy / d }; }
      if(job.kind==='social'){const other=this.person(job.source.personId);if(other&&this.canTalkTo(other))other.direction={x:person.x-other.x,y:person.y-other.y};}
      const skill = TASKS[job.kind].skill;
      if (skill) person.skills[skill].seconds += dt;
      if (['shelter','bridge'].includes(job.kind)) {
        const b=this.jobProject(job),contribution=Math.min(dt*this.speed(person,job.kind),(1-b.progress)*b.work);
        b.progress=Math.min(1,b.progress+contribution/b.work);b.contributions[person.id]=Math.min(b.work,(b.contributions[person.id]||0)+contribution);
        if (b.progress >= 1 - 1e-9) {
          b.progress=1;b.complete=true;
          for (const worker of this.people) { if (b.contributions[worker.id] >= 1) this.award(worker, 'building', b.kind==='bridge'?'Puente terminado':'Refugio terminado en equipo',b.kind); if (['shelter','bridge'].includes(worker.job?.kind)&&this.jobProject(worker.job)===b) this.stop(worker.id); }
          this.feedback.push({kind:'construction',x:b.x+b.width/2,y:b.y+b.height/2,time:this.time,outcome:b.kind==='bridge'?'Paso abierto':'Refugio listo'});this.emit(b.kind==='bridge'?'Puente terminado. Los colonos ya pueden cruzar.':'Refugio terminado. Hay tres nuevas plazas.');
        }
        continue;
      }
      job.progress += dt * this.speed(person, job.kind) / TASKS[job.kind].seconds;
      if (job.progress < 1) continue;
      const result = this.complete(person); job.progress = 0;
      if (!result.ok && !result.depleted) { person.state = result.reason;if(job.kind==='social')this.stop(person.id); continue; }
      if(result.continue)continue;
      job.cycles++;
      if ((['building', 'drink', 'rest', 'sleep','eat','social','wander'].includes(job.kind)||FARM_TASKS[job.kind])||RECIPES[job.kind]) { this.stop(person.id); continue; }
      if (result.depleted || ['exploration','scavenge'].includes(job.kind) || job.kind==='mining'&&!this.mineralRemaining(this.world.mineralAt(job.source.x,job.source.y)) || job.kind === 'logging' && !this.standing(job.source.x, job.source.y) || job.kind === 'foraging' && !this.shrubs.find(s => s.x === job.source.x && s.y === job.source.y)?.remaining) {
        const next = this.nearest(person, job.kind);
        if (!next) { this.stop(person.id); this.emit(`${person.name}: no quedan recursos accesibles para esa tarea.`); }
        else { job.target = { x: next.x, y: next.y }; job.source = next.source || null; job.path = next.path; }
      }
    }
  }
  snapshot() {
    return { version: 6, plots:structuredClone(this.plots),nextPlot:this.nextPlot,culture:structuredClone(this.culture),circles:structuredClone(this.circles),nextCircle:this.nextCircle,seed: this.world.seed, time: this.time, resources: { ...this.resources }, firepit: this.firepit, shelter: structuredClone(this.shelter),buildings:structuredClone(this.buildings),nextBuilding:this.nextBuilding,relationships:[...this.relationships],households:structuredClone(this.households),nextPerson:this.nextPerson,unlocked:[...this.unlocked],scavenged:[...this.scavenged],mined:[...this.mined],
      timber: [...this.timber], shrubs: this.shrubs.map(s => s.remaining),
      people: this.people.map(p => ({ autonomy:p.autonomy,mood:p.mood,company:p.company,autoAt:p.autoAt,memories:structuredClone(p.memories),resumeOrder:structuredClone(p.resumeOrder),id:p.id,name:p.name,color:p.color,hair:p.hair,stage:p.stage,parents:[...p.parents],bornAt:p.bornAt,x:p.x,y:p.y, needs: { ...p.needs }, specialty: p.specialty, skills: structuredClone(p.skills), completed: p.completed, history: structuredClone(p.history), explored: [...p.explored], order: p.job ? { automatic:p.job.automatic,kind: p.job.kind, target: p.job.source || p.job.target, progress: Math.min(p.job.progress, .999) } : null })) };
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
    if(data?.version===4)data=migrateSettlement(data);
    if(data?.version===5)data=migrateLiving(data);
    const valid = (condition) => { if (!condition) throw new Error('Guardado de civilización inválido.'); };
    const number = (n, max, integer = false) => Number.isFinite(n) && n >= 0 && n <= max && (!integer || Number.isInteger(n));
    valid(data?.version === 6 && data.seed === world.seed && number(data.time, 1e9) && typeof data.firepit === 'boolean');
    const sim = new Simulation(world);
    valid(Array.isArray(data.unlocked)&&data.unlocked.length>=16&&data.unlocked.length<=48&&new Set(data.unlocked).size===data.unlocked.length&&initialSectors().every(k=>data.unlocked.includes(k))&&data.unlocked.every(k=>/^\d+,\d+$/.test(k)&&Number(k.split(',')[0])<8&&Number(k.split(',')[1])<6));sim.unlocked=new Set(data.unlocked);
    const seen=new Set(['0,0']),queue=['0,0'];for(let i=0;i<queue.length;i++){const [x,y]=queue[i].split(',').map(Number);for(const [a,b] of neighbours(x,y)){const k=key(a,b);if(sim.unlocked.has(k)&&!seen.has(k)){seen.add(k);queue.push(k);}}}valid(seen.size===sim.unlocked.size);
    valid(Array.isArray(data.scavenged)&&new Set(data.scavenged).size===data.scavenged.length&&data.scavenged.every(k=>world.scatter.some(s=>key(s.x,s.y)===k)));sim.scavenged=new Set(data.scavenged);
    valid(data.resources && Object.keys(sim.resources).every(k => number(data.resources[k], 1e7, true)));
    sim.resources = Object.fromEntries(Object.keys(sim.resources).map(k => [k, data.resources[k]])); sim.time = data.time; sim.firepit = data.firepit;
    valid(sim.resources.stoneAxe<=1&&sim.resources.stonePick<=1);
    valid(Array.isArray(data.mined)&&new Set(data.mined.map(n=>n?.[0])).size===data.mined.length);
    for(const entry of data.mined){valid(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==='string');const [x,y]=entry[0].split(',').map(Number),node=world.mineralAt(x,y);valid(node&&key(x,y)===entry[0]&&MINERAL_ITEMS[node.kind]&&number(entry[1],node.richness,true));sim.mined.set(entry[0],entry[1]);}
    valid(Array.isArray(data.timber) && data.timber.length === sim.timber.size && new Set(data.timber.map(t => t?.[0])).size === sim.timber.size);
    for (const t of data.timber) { valid(Array.isArray(t) && sim.timber.has(t[0]) && number(t[1], 3, true)); sim.timber.set(t[0], t[1]); }
    valid(Array.isArray(data.shrubs) && data.shrubs.length === sim.shrubs.length);
    data.shrubs.forEach((n, i) => { valid(number(n, 8, true)); sim.shrubs[i].remaining = n; });
    restoreSettlement(sim,data,valid,number);restoreLiving(sim,data,valid,number,knownTask);
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
        if(['shelter','bridge','sleep'].includes(saved.order.kind))valid(sim.project(saved.order.target.buildingId));
        if(saved.order.kind==='social')valid(sim.person(saved.order.target.personId)&&Object.hasOwn(TOPICS,saved.order.target.topic));
        if(saved.order.kind==='waterPlot')valid(typeof saved.order.target.fetch==='boolean');
        if(FARM_TASKS[saved.order.kind]&&saved.order.kind!=='extractSeeds')valid(sim.plot(saved.order.target.plotId));
        let result = sim.assign(p.id, saved.order.kind, saved.order.target,{automatic:saved.order.automatic,restoring:true});
        if (!result.ok && ['logging', 'foraging', 'drink','scavenge','mining'].includes(saved.order.kind)) result = sim.assign(p.id, saved.order.kind);
        if (result.ok && p.job.source?.x === saved.order.target.x && p.job.source?.y === saved.order.target.y) p.job.progress = saved.order.progress;
        else if (result.ok && (['study', 'building', 'cooking', 'rest', 'sleep','eat','social'].includes(saved.order.kind)||RECIPES[saved.order.kind])) p.job.progress = saved.order.progress;
      }
    }
    sim.revision = 0; return sim;
  }
}

Object.assign(Simulation.prototype,constructionMethods,communityMethods,farmingMethods,livingMethods);
