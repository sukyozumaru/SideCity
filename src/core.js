export const SIZE = 48;
export const TILE_W = 80;
export const TILE_H = 40;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function project(x, y) { return { x: (x - y) * TILE_W / 2, y: (x + y) * TILE_H / 2 }; }
export function unproject(x, y) { return { x: x / TILE_W + y / TILE_H, y: y / TILE_H - x / TILE_W }; }
export function hash(x, y, seed = 48128) {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + 17, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
export function createWorld(seed = 48128) {
  const tiles = [], trees = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const river = 24 + Math.sin(x * .14 + .4) * 5 + Math.sin(x * .31) * 1.1;
    const distance = Math.abs(y + .5 - river);
    const bank = distance < 3.9 && distance >= 2.7;
    const type = distance < 2.7 ? 'water' : bank ? 'bank' : 'grass';
    const clearing = Math.hypot(x - 20, y - 16) < 6.8;
    const forest = Math.sin(x * .22) * Math.cos(y * .19) > -.1;
    const tree = type === 'grass' && !clearing && hash(x, y, seed) > (forest ? .70 : .95);
    const tile = { x, y, type, tree, variation: hash(x + 200, y, seed) };
    tiles.push(tile);
    if (tree) trees.push({ x: x + .3 + hash(x, y + 50, seed) * .4, y: y + .3 + hash(x + 60, y, seed) * .4, variant: Math.floor(hash(x + 44, y, seed) * 6) });
  }
  trees.sort((a, b) => a.x + a.y - b.x - b.y);
  return { seed, tiles, trees, get(x, y) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE ? tiles[y * SIZE + x] : null; } };
}
export class Camera {
  constructor(width, height) { this.width = width; this.height = height; this.x = 0; this.y = 960; this.zoom = .6; this.minZoom = .06; this.maxZoom = 1.8; }
  screenToWorld(x, y) { return { x: (x - this.width / 2) / this.zoom + this.x, y: (y - this.height / 2) / this.zoom + this.y }; }
  worldToScreen(x, y) { return { x: (x - this.x) * this.zoom + this.width / 2, y: (y - this.y) * this.zoom + this.height / 2 }; }
  zoomAt(zoom, x, y) {
    const anchor = this.screenToWorld(x, y);
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.x = anchor.x - (x - this.width / 2) / this.zoom;
    this.y = anchor.y - (y - this.height / 2) / this.zoom;
    this.bound();
  }
  pan(dx, dy) { this.x -= dx / this.zoom; this.y -= dy / this.zoom; this.bound(); }
  bound() {
    // Keep the focus inside the map diamond; its shore remains visible at every edge.
    const cell = unproject(this.x, this.y);
    const p = project(clamp(cell.x, 0, SIZE), clamp(cell.y, 0, SIZE));
    this.x = p.x; this.y = p.y;
  }
  fit() { this.zoom = clamp(Math.min((this.width - 80) / (SIZE * TILE_W), (this.height - 90) / (SIZE * TILE_H + 130)), this.minZoom, .7); this.x = 0; this.y = SIZE * TILE_H / 2 - 15; }
  home() { const p = project(21, 18); this.x = p.x; this.y = p.y; this.zoom = this.width < 700 ? .72 : .9; }
}
export class Gestures {
  constructor(camera, onTap) { this.camera = camera; this.onTap = onTap; this.points = new Map(); this.tap = null; this.pinch = null; }
  down(id, x, y) {
    this.points.set(id, { x, y });
    this.tap = this.points.size === 1 ? { id, x, y, moved: false } : null;
    this.rebase();
  }
  rebase() {
    const p = [...this.points.values()];
    this.pinch = p.length === 2 ? { distance: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : null;
  }
  move(id, x, y) {
    const old = this.points.get(id); if (!old) return;
    this.points.set(id, { x, y });
    if (this.points.size === 2) {
      const before = this.pinch; this.rebase();
      if (before && before.distance > 1) {
        this.camera.pan(this.pinch.x - before.x, this.pinch.y - before.y);
        this.camera.zoomAt(this.camera.zoom * this.pinch.distance / before.distance, this.pinch.x, this.pinch.y);
      }
    } else if (this.points.size === 1) {
      if (this.tap && Math.hypot(x - this.tap.x, y - this.tap.y) > 6) this.tap.moved = true;
      if (!this.tap || this.tap.moved) this.camera.pan(x - old.x, y - old.y);
    }
  }
  up(id, x, y, cancelled = false) {
    const tap = this.tap;
    if (!cancelled && this.points.size === 1 && tap?.id === id && !tap.moved && Math.hypot(x - tap.x, y - tap.y) <= 6) this.onTap(x, y);
    this.points.delete(id); this.tap = null; this.rebase();
  }
  cancelAll() { this.points.clear(); this.tap = null; this.pinch = null; }
}
