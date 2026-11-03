import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Camera, Gestures, WORLD_WIDTH, WORLD_HEIGHT, createWorld, project, unproject } from '../src/core.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test('every parcel center round trips through isometric projection', () => {
  for (let y = 0; y < WORLD_HEIGHT; y++) for (let x = 0; x < WORLD_WIDTH; x++) {
    const p = project(x + .5, y + .5), q = unproject(p.x, p.y); near(q.x, x + .5); near(q.y, y + .5);
  }
});
test('terrain is deterministic, bounded and has a connected river across the map', () => {
  const a = createWorld(), b = createWorld(); assert.deepEqual(a.tiles, b.tiles); assert.deepEqual(a.trees, b.trees);
  assert.equal(a.tiles.length, WORLD_WIDTH * WORLD_HEIGHT); assert.equal(a.get(-1, 4), null); assert.equal(a.get(WORLD_WIDTH, 4), null);
  const water = a.tiles.filter(t => t.type === 'water'), visited = new Set(), queue = [water[0]];
  while (queue.length) { const t = queue.pop(), key = `${t.x},${t.y}`; if (visited.has(key)) continue; visited.add(key); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = a.get(t.x + dx, t.y + dy); if (n?.type === 'water' && !visited.has(`${n.x},${n.y}`)) queue.push(n); } }
  assert.equal(visited.size, water.length); assert.ok(water.some(t => t.x === 0)); assert.ok(water.some(t => t.x === WORLD_WIDTH - 1));
  assert.ok(a.tiles.filter(t => t.type === 'grass' && !t.tree).length > 1000);
});
test('zoom preserves the world point under the finger, including clamp limits', () => {
  const c = new Camera(1200, 800); c.home(); const a = c.screenToWorld(450, 320);
  for (const zoom of [1.1, 1.8, 4, .6]) { c.zoomAt(zoom, 450, 320); const b = c.screenToWorld(450, 320); near(a.x, b.x); near(a.y, b.y); }
  assert.ok(c.zoom <= c.maxZoom);
});
test('all four map corners remain reachable and extreme pans stay bounded', () => {
  const c = new Camera(390, 650);
  for (const [x, y] of [[0, 0], [WORLD_WIDTH, 0], [0, WORLD_HEIGHT], [WORLD_WIDTH, WORLD_HEIGHT]]) { const p = project(x, y); c.x = p.x; c.y = p.y; c.bound(); near(c.x, p.x); near(c.y, p.y); }
  for (const [dx, dy] of [[1e6, 1e6], [-1e6, 1e6], [1e6, -1e6], [-1e6, -1e6]]) { c.pan(dx, dy); const q = unproject(c.x, c.y); assert.ok(q.x >= 0 && q.x <= WORLD_WIDTH && q.y >= 0 && q.y <= WORLD_HEIGHT); }
});
test('tap selects once; drag, pinch, cancellation and lost capture never select', () => {
  let taps = 0; const c = new Camera(800, 600); c.home(); const g = new Gestures(c, () => taps++);
  g.down(1, 200, 200); g.up(1, 200, 200); assert.equal(taps, 1);
  g.down(1, 200, 200); g.move(1, 240, 220); g.up(1, 240, 220); assert.equal(taps, 1);
  g.down(1, 200, 200); g.down(2, 300, 200); const z = c.zoom; g.move(2, 340, 200); assert.ok(c.zoom > z); g.up(2, 340, 200); const x = c.x; g.move(1, 210, 200); assert.notEqual(c.x, x); g.up(1, 210, 200); assert.equal(taps, 1);
  g.down(1, 200, 200); g.up(1, 200, 200, true); g.down(1, 200, 200); g.cancelAll(); g.up(1, 200, 200); assert.equal(taps, 1);
});
test('three fingers suppress taps and safely transition to pinch and pan', () => {
  let taps = 0; const c = new Camera(800, 600); c.home(); const g = new Gestures(c, () => taps++);
  for (let i = 1; i <= 3; i++) g.down(i, 100 * i, 200);
  g.move(3, 350, 210); g.up(3, 350, 210); g.move(2, 240, 200); g.up(2, 240, 200); g.up(1, 100, 200); assert.equal(taps, 0);
});
test('fit contains the entire terrain at phone, tablet and desktop dimensions', () => {
  for (const [width, height] of [[378, 712], [748, 888], [1420, 764], [832, 288]]) {
    const c = new Camera(width, height); c.fit();
    for (const [x, y] of [[0, 0], [WORLD_WIDTH, 0], [0, WORLD_HEIGHT], [WORLD_WIDTH, WORLD_HEIGHT]]) {
      const p = project(x, y), s = c.worldToScreen(p.x, p.y);
      assert.ok(s.x >= 0 && s.x <= width && s.y >= 0 && s.y <= height, JSON.stringify({ width, height, s }));
    }
  }
});
