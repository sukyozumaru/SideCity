import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/core.js';
import { Simulation, SKILLS, findRoute, skillLevel, threshold, skillProgress } from '../src/simulation.js';
import { loadSimulation, saveSimulation, SAVE_KEY } from '../src/persistence.js';
const advance = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.update(.1); };
const fresh = () => new Simulation(createWorld());
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };
test('a new civilization has exactly three distinct founders and six independent skills', () => {
  const s = fresh(); assert.equal(s.people.length, 3); assert.equal(new Set(s.people.map(p => p.id)).size, 3);
  for (const p of s.people) { assert.ok(s.walkable(s.world.get(Math.floor(p.x), Math.floor(p.y)))); assert.equal(Object.keys(p.skills).length, 6); assert.ok(Object.values(p.skills).every(x => x.xp === 0)); }
});
test('routes never enter water or standing trees and reject the far river bank', () => {
  const s = fresh(), p = s.people[0];
  const route = s.route(p, { x: 24, y: 18 }); assert.ok(route);
  for (const step of route) assert.ok(s.walkable(s.world.get(Math.floor(step.x), Math.floor(step.y))));
  assert.equal(s.route(p, { x: 20, y: 40 }), null);
  assert.equal(findRoute(s.world, p, { x: -1, y: 2 }), null);
});
test('XP follows completed work only; moving and cancelling never award it', () => {
  const s = fresh(); s.assign('ana', 'study'); advance(s, 3); s.stop('ana'); assert.equal(s.person('ana').skills.study.xp, 0);
  s.assign('ana', 'move', { x: 21, y: 18 }); advance(s, 10); assert.equal(s.person('ana').completed, 0);
  s.assign('ana', 'study'); advance(s, 9); assert.equal(s.person('ana').skills.study.xp, SKILLS.study.xp); assert.equal(s.resources.knowledge, 1);
  assert.equal(s.person('ana').skills.logging.xp, 0);
});
test('three concurrent professions create materials, knowledge and individual histories', () => {
  const s = fresh(); for (const [id, task] of [['ana','logging'],['ivo','foraging'],['nara','study']]) assert.equal(s.assign(id, task).ok, true);
  advance(s, 35); assert.ok(s.resources.wood >= 8); assert.ok(s.resources.rawFood >= 4); assert.ok(s.resources.knowledge >= 3);
  for (const p of s.people) { assert.ok(p.history.length); assert.ok(p.completed > 0); }
  assert.ok(skillLevel(s.person('ana').skills.logging.xp) >= 2);
});
test('invalid orders do not cancel the current valid task', () => {
  const s = fresh(); s.assign('ana', 'study'); const job = s.person('ana').job;
  assert.equal(s.assign('ana', 'cooking').ok, false); assert.equal(s.person('ana').job, job);
  assert.equal(s.assign('ana', 'move', { x: 20, y: 40 }).ok, false); assert.equal(s.person('ana').job, job);
});
test('crafting is gated and simultaneous builders consume materials and gain XP once', () => {
  const s = fresh(); assert.equal(s.assign('ana', 'building').ok, false);
  s.resources.wood = 5; s.resources.knowledge = 3;
  s.assign('ana', 'building'); s.assign('ivo', 'building'); advance(s, 20);
  assert.equal(s.firepit, true); assert.equal(s.resources.wood, 0);
  assert.equal(s.people.reduce((n,p) => n+p.skills.building.completed, 0), 1);
});
test('cooking consumes exactly one food and wood per completed meal, then waits', () => {
  const s = fresh(); s.firepit = true; s.resources.wood = 2; s.resources.rawFood = 1;
  s.assign('ana', 'cooking'); advance(s, 30);
  assert.equal(s.resources.meals, 1); assert.equal(s.resources.rawFood, 0); assert.equal(s.resources.wood, 1);
  assert.equal(s.person('ana').skills.cooking.xp, SKILLS.cooking.xp);
  s.resources.rawFood = 1; advance(s, 10); assert.equal(s.resources.meals, 2); assert.equal(s.resources.wood, 0);
});
test('each tree is finite and multiple workers cannot receive phantom wood', () => {
  const s = fresh(); s.assign('ana', 'logging'); const source = s.person('ana').job.source;
  for (const k of s.timber.keys()) s.timber.set(k, 0);
  s.timber.set(`${source.x},${source.y}`, 1); s.assign('ivo','logging'); advance(s, 30);
  assert.equal(s.resources.wood, 4); assert.equal(s.people.reduce((n,p) => n+p.skills.logging.completed,0), 1);
});
test('exploration records unique surveyed parcels with matching XP', () => {
  const s = fresh(); s.assign('ana','exploration'); advance(s, 35); const p = s.person('ana');
  assert.ok(p.explored.length > 1); assert.equal(new Set(p.explored).size, p.explored.length);
  assert.equal(p.skills.exploration.xp, p.explored.length * SKILLS.exploration.xp);
});
test('levels have increasing costs, a safe cap, and modest specialty benefits', () => {
  assert.equal(skillLevel(0),1); assert.equal(skillLevel(39),1); assert.equal(skillLevel(40),2); assert.equal(skillLevel(1e8),20);
  assert.equal(skillProgress(threshold(20)).ratio,1);
  const s = fresh(), p=s.person('ana'); s.setSpecialty('ana','logging'); assert.equal(s.speed(p,'logging'),1.1); assert.equal(s.speed(p,'study'),1);
  assert.ok(threshold(4)-threshold(3) > threshold(3)-threshold(2));
});
test('a save restores XP, resources, partial work, professions and finite resources', () => {
  const s=fresh(); s.assign('ana','study'); s.setSpecialty('ana','study'); advance(s,12);
  const before=s.snapshot(), restored=Simulation.restore(createWorld(),JSON.parse(JSON.stringify(before)));
  assert.deepEqual(restored.resources,s.resources); assert.deepEqual(restored.person('ana').skills,s.person('ana').skills);
  assert.equal(restored.person('ana').specialty,'study'); assert.equal(restored.person('ana').job.progress,s.person('ana').job.progress);
  advance(restored,5); assert.equal(restored.resources.knowledge,2); assert.equal(restored.people.length,3);
});
test('invalid saves fall back to backup; irrecoverable saves are protected', () => {
  const s=fresh(), storage=memory(); saveSimulation(s,storage); advance(s,1); saveSimulation(s,storage);
  storage.setItem(SAVE_KEY,'broken'); const recovered=loadSimulation(createWorld(),storage); assert.equal(recovered.recovered,true); assert.equal(recovered.blocked,false);
  storage.setItem(SAVE_KEY+'-backup','broken'); assert.equal(loadSimulation(createWorld(),storage).blocked,true);
  const malformed=s.snapshot(); malformed.people[0].skills.study.xp=-1; assert.throws(()=>Simulation.restore(createWorld(),malformed));
  malformed.people[0].skills.study.xp=0; malformed.people[1].id='ana'; assert.throws(()=>Simulation.restore(createWorld(),malformed));
});
