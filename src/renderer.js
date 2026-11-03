import { SIZE, TILE_W, TILE_H, project, hash } from './core.js';

const grass = ['#91b56e', '#94b872', '#96b974', '#92b570', '#98ba75', '#90b36d'];
function polygon(ctx, points, fill, stroke) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function diamond(ctx, x, y, fill, stroke) {
  polygon(ctx, [project(x, y), project(x + 1, y), project(x + 1, y + 1), project(x, y + 1)], fill, stroke);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function makeTree(variant) {
  const sprite = document.createElement('canvas'); sprite.width = 144; sprite.height = 180;
  const c = sprite.getContext('2d'); c.translate(72, 160);
  const pine = variant > 3, scale = .8 + variant % 3 * .1;
  c.scale(scale, scale);
  ellipse(c, 15, 3, 29, 10, '#31583a26');
  if (pine) {
    polygon(c, [{ x: -4, y: 0 }, { x: 4, y: 0 }, { x: 3, y: -65 }, { x: -2, y: -65 }], '#6f6040');
    for (let i = 0; i < 4; i++) {
      const y = -28 - i * 21, w = 35 - i * 7;
      polygon(c, [{ x: 0, y: y - 42 }, { x: w, y: y }, { x: 7, y: y + 9 }, { x: -w, y: y }], ['#3e704d', '#477e51', '#568a56', '#63945b'][i]);
      polygon(c, [{ x: 0, y: y - 42 }, { x: 4, y: y + 5 }, { x: -w, y: y }], ['#548353', '#628e59', '#719b60', '#80a86a'][i]);
    }
  } else {
    polygon(c, [{ x: -5, y: 0 }, { x: 4, y: 1 }, { x: 3, y: -65 }, { x: -3, y: -65 }], '#796648');
    c.strokeStyle = '#796648'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -25); c.lineTo(-17, -58); c.moveTo(1, -40); c.lineTo(20, -75); c.stroke();
    const palette = variant === 3 ? ['#668645', '#7c994e', '#93ad5b', '#a5b969'] : ['#3f7145', '#55894e', '#6e9b58', '#86ac65'];
    ellipse(c, 10, -72, 31, 32, palette[0]); ellipse(c, -17, -75, 27, 29, palette[1]);
    ellipse(c, 1, -100, 28, 26, palette[2]); ellipse(c, -16, -101, 18, 18, palette[3]);
    ellipse(c, -27, -76, 14, 17, palette[2]); ellipse(c, 20, -96, 17, 18, palette[1]);
    ellipse(c, -6, -116, 14, 10, palette[3]);
    c.strokeStyle = '#ffffff14'; c.lineWidth = 2; c.beginPath(); c.arc(-9, -94, 18, 3.4, 4.7); c.stroke();
  }
  return sprite;
}
export class Renderer {
  constructor(canvas, minimap, world, camera) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.map = minimap; this.mc = minimap.getContext('2d');
    this.world = world; this.camera = camera; this.dpr = 1; this.grid = false; this.selected = null; this.hover = null;
    this.sprites = Array.from({ length: 6 }, (_, i) => makeTree(i));
    this.cache = document.createElement('canvas'); this.cache.width = SIZE * TILE_W + 100; this.cache.height = SIZE * TILE_H + 180;
    this.origin = { x: this.cache.width / 2, y: 75 }; this.buildTerrain();
  }
  buildTerrain() {
    const c = this.cache.getContext('2d'); c.translate(this.origin.x, this.origin.y); c.lineJoin = 'round';
    // The front two faces expose a shallow slab of earth, with a turf lip above it.
    const left = project(0, SIZE), front = project(SIZE, SIZE), right = project(SIZE, 0);
    for (const [a, b, color] of [[left, front, '#8b795a'], [front, right, '#a49067']]) {
      polygon(c, [a, b, { x: b.x, y: b.y + 25 }, { x: a.x, y: a.y + 25 }], color);
      c.strokeStyle = '#c2ac791f'; c.lineWidth = 2;
      for (let i = 1; i < 48; i++) { const t = i / 48; const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x + 10, y + 15); c.stroke(); }
    }
    for (const tile of this.world.tiles) {
      const { x, y, type, variation: v } = tile;
      const color = type === 'water' ? ['#70afb1', '#73b3b4', '#76b5b5'][Math.floor(v * 3)] : type === 'bank' ? ['#c0bd89', '#b4bb80', '#bdc18b'][Math.floor(v * 3)] : grass[Math.floor(v * grass.length)];
      c.lineWidth = .7; diamond(c, x, y, color, color);
      const p = project(x + .5, y + .5);
      if (type === 'grass') {
        for (let i = 0; i < 4; i++) {
          const q = project(x + hash(x + i * 20, y + 3) * .8 + .1, y + hash(x + 7, y + i * 15) * .8 + .1);
          c.strokeStyle = i % 2 ? '#648b472c' : '#e2edb235'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(q.x - 2, q.y); c.lineTo(q.x, q.y - 3); c.lineTo(q.x + 2, q.y); c.stroke();
        }
        if (v > .94 && !tile.tree) { ellipse(c, p.x, p.y, 5, 2.5, '#9caa77'); ellipse(c, p.x - 1, p.y - 1.5, 4, 2, '#b7c39b'); }
        if (v < .09 && !tile.tree) { for (let i = 0; i < 3; i++) ellipse(c, p.x - 6 + i * 5, p.y + i % 2 * 2, 1.3, 1.1, '#e0db9e'); }
      }
      if (type === 'water') {
        c.strokeStyle = '#d0e7d066'; c.lineWidth = 1.1;
        for (let i = 0; i < 2; i++) { const q = project(x + .25 + i * .4, y + .3 + i * .3); c.beginPath(); c.moveTo(q.x - 8, q.y); c.quadraticCurveTo(q.x, q.y + 2, q.x + 9, q.y); c.stroke(); }
        for (const [dx, dy, edge] of [[-1, 0, 0], [0, -1, 1], [1, 0, 2], [0, 1, 3]]) {
          if (this.world.get(x + dx, y + dy)?.type !== 'water') {
            const corners = [project(x, y + 1), project(x, y), project(x + 1, y), project(x + 1, y + 1)];
            const a = corners[edge], b = corners[(edge + 1) % 4];
            c.strokeStyle = '#d5d9ac'; c.lineWidth = 3; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          }
        }
      }
      if (type === 'bank' && v > .55) {
        c.strokeStyle = '#7d9252'; c.lineWidth = 1.7;
        for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(p.x + i * 3, p.y); c.lineTo(p.x + i * 4 - 2, p.y - 7 - i % 3 * 3); c.stroke(); }
      }
    }
    this.buildMiniTerrain();
  }
  buildMiniTerrain() {
    const m = document.createElement('canvas'); m.width = 192; m.height = 112;
    const c = m.getContext('2d'); c.fillStyle = '#e0e7dc'; c.fillRect(0, 0, 192, 112);
    c.translate(96, 8); c.scale(.046, .046);
    for (const tile of this.world.tiles) diamond(c, tile.x, tile.y, tile.type === 'water' ? '#73aeb0' : tile.type === 'bank' ? '#bbc18a' : tile.tree ? '#547b49' : '#9bb779');
    this.miniTerrain = m;
  }
  resize(width, height) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr); this.canvas.height = Math.round(height * this.dpr);
    this.camera.width = width; this.camera.height = height;
  }
  draw(time = 0) {
    const c = this.ctx, camera = this.camera, { width: w, height: h, zoom: z } = camera;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.fillStyle = '#d7e1d8'; c.fillRect(0, 0, w, h);
    c.translate(w / 2, h / 2); c.scale(z, z); c.translate(-camera.x, -camera.y);
    c.drawImage(this.cache, -this.origin.x, -this.origin.y);
    if (this.grid) {
      c.beginPath();
      for (let i = 0; i <= SIZE; i++) for (const [a, b] of [[project(i, 0), project(i, SIZE)], [project(0, i), project(SIZE, i)]]) { c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); }
      c.strokeStyle = '#365a3430'; c.lineWidth = .75 / z; c.stroke();
    }
    const tile = this.selected || this.hover;
    if (tile) { c.lineWidth = 2 / z; diamond(c, tile.x, tile.y, this.selected ? '#f6f7cf55' : '#ffffff22', this.selected ? '#f9fbec' : '#e3ebce'); }
    const bounds = { left: camera.x - w / 2 / z - 100, right: camera.x + w / 2 / z + 100, top: camera.y - h / 2 / z - 50, bottom: camera.y + h / 2 / z + 170 };
    for (const tree of this.world.trees) {
      const p = project(tree.x, tree.y);
      if (p.x < bounds.left || p.x > bounds.right || p.y < bounds.top || p.y > bounds.bottom) continue;
      const occluding = this.selected && Math.abs(p.x - project(this.selected.x + .5, this.selected.y + .5).x) < 45 && p.y > project(this.selected.x + .5, this.selected.y + .5).y && p.y - project(this.selected.x + .5, this.selected.y + .5).y < 120;
      c.globalAlpha = occluding ? .35 : 1;
      c.drawImage(this.sprites[tree.variant], p.x - 72, p.y - 160);
    }
    c.globalAlpha = 1;
    if (this.selected) {
      const p = project(this.selected.x + .5, this.selected.y + .5);
      ellipse(c, p.x, p.y, 3.4 / z, 2 / z, '#315d49');
    }
    // A few moving glints give the river life, without changing the terrain or simulation.
    if (!this.reducedMotion && z > .25) {
      c.lineWidth = 1 / z; c.strokeStyle = '#e7f3d64d';
      for (let i = 4; i < 48; i += 7) {
        const y = 24 + Math.sin(i * .14 + .4) * 5 + Math.sin(i * .31) * 1.1;
        const p = project(i + (time / 18000 % 1), y);
        c.beginPath(); c.moveTo(p.x - 6, p.y); c.lineTo(p.x + 9, p.y); c.stroke();
      }
    }
    this.drawMinimap();
  }
  drawMinimap() {
    const c = this.mc, cam = this.camera; c.drawImage(this.miniTerrain, 0, 0);
    const x = (cam.x - cam.width / 2 / cam.zoom) * .046 + 96, y = (cam.y - cam.height / 2 / cam.zoom) * .046 + 8;
    c.strokeStyle = '#284737'; c.lineWidth = 1.2; c.fillStyle = '#f7f9ea22';
    c.fillRect(x, y, cam.width / cam.zoom * .046, cam.height / cam.zoom * .046);
    c.strokeRect(x, y, cam.width / cam.zoom * .046, cam.height / cam.zoom * .046);
  }
}
