import { TILE_W, TILE_H, project, hash } from './core.js';
import { drawColonist } from './people-renderer.js';
import { drawShelter } from './camp-renderer.js';
import { SECTOR_SIZE, MINERALS } from './terrain.js';

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
    this.cache = document.createElement('canvas'); this.cacheScale = .7;
    this.cacheWidth = (world.width + world.height) * TILE_W / 2 + 100;
    this.cacheHeight = (world.width + world.height) * TILE_H / 2 + 180;
    this.cache.width = Math.ceil(this.cacheWidth * this.cacheScale); this.cache.height = Math.ceil(this.cacheHeight * this.cacheScale);
    this.origin = { x: world.height * TILE_W / 2 + 50, y: 75 }; this.buildTerrain();
  }
  buildTerrain() {
    const c = this.cache.getContext('2d'); c.scale(this.cacheScale,this.cacheScale); c.translate(this.origin.x, this.origin.y); c.lineJoin = 'round';
    // The front two faces expose a shallow slab of earth, with a turf lip above it.
    const left = project(0, this.world.height), front = project(this.world.width, this.world.height), right = project(this.world.width, 0);
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
    const center=project(this.world.width/2,this.world.height/2),scale=Math.min(176/((this.world.width+this.world.height)*TILE_W/2),96/((this.world.width+this.world.height)*TILE_H/2));
    this.mini={scale,x:96-center.x*scale,y:56-center.y*scale};c.translate(this.mini.x,this.mini.y);c.scale(scale,scale);
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
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.fillStyle = '#8a9d82'; c.fillRect(0, 0, w, h);
    c.translate(w / 2, h / 2); c.scale(z, z); c.translate(-camera.x, -camera.y);
    c.drawImage(this.cache, -this.origin.x, -this.origin.y, this.cacheWidth, this.cacheHeight);
    if (this.grid) {
      c.beginPath();
      for(let x=0;x<=this.world.width;x++){const a=project(x,0),b=project(x,this.world.height);c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}
      for(let y=0;y<=this.world.height;y++){const a=project(0,y),b=project(this.world.width,y);c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}
      c.strokeStyle = '#365a3430'; c.lineWidth = .75 / z; c.stroke();
    }
    if(this.simulation)for(let y=0;y<this.world.height/SECTOR_SIZE;y++)for(let x=0;x<this.world.width/SECTOR_SIZE;x++){
      if(this.simulation.unlocked.has(`${x},${y}`))continue;
      const a=x*SECTOR_SIZE,b=y*SECTOR_SIZE;
      polygon(c,[project(a,b),project(a+SECTOR_SIZE,b),project(a+SECTOR_SIZE,b+SECTOR_SIZE),project(a,b+SECTOR_SIZE)],'#344c3d99','#9daf8133');
      if(z>.15){const p=project(a+6,b+6);c.fillStyle='#d5dfbe';c.font=`${13/z}px system-ui`;c.textAlign='center';c.fillText('144 parcelas',p.x,p.y);}
    }
    const tile = this.selected || this.hover;
    if (tile) { c.lineWidth = 2 / z; diamond(c, tile.x, tile.y, this.selected ? '#f6f7cf55' : '#ffffff22', this.selected ? '#f9fbec' : '#e3ebce'); }
    const bounds = { left: camera.x - w / 2 / z - 100, right: camera.x + w / 2 / z + 100, top: camera.y - h / 2 / z - 50, bottom: camera.y + h / 2 / z + 170 };
    const elapsed = Math.min(.1, Math.max(0, (time - (this.previousRender || time)) / 1000)); this.previousRender = time;
    this.visualPeople ||= new Map();
    const objects = this.world.trees.filter(tree=>!this.simulation||this.simulation.isUnlocked(tree.x,tree.y)).map(tree => ({ kind: 'tree', item: tree, x: tree.x, y: tree.y }));
    if (this.simulation) {
      for (const person of this.simulation.people) {
        let visual = this.visualPeople.get(person.id);
        if (!visual || Math.hypot(visual.x-person.x,visual.y-person.y)>4) visual={x:person.x,y:person.y};
        const smoothing=1-Math.exp(-elapsed*24);visual.x+=(person.x-visual.x)*smoothing;visual.y+=(person.y-visual.y)*smoothing;this.visualPeople.set(person.id,visual);
        objects.push({kind:'person',item:person,x:visual.x,y:visual.y});
      }
      for(const mineral of this.world.minerals)if(this.simulation.isUnlocked(mineral.x,mineral.y))objects.push({kind:'mineral',item:mineral,x:mineral.x+.5,y:mineral.y+.5});
      for(const detail of this.world.scatter)if(this.simulation.isUnlocked(detail.x,detail.y)&&!this.simulation.scavenged.has(`${detail.x},${detail.y}`))objects.push({kind:'scatter',item:detail,x:detail.x+.5,y:detail.y+.5});
      const shelter = this.simulation.shelter;
      objects.push({kind:'shelter',x:shelter.x+shelter.width/2,y:shelter.y+shelter.height-.2});
      for (const bush of this.simulation.shrubs) objects.push({ kind: 'bush', item: bush, x: bush.x + .5, y: bush.y + .5 });
      objects.push({ kind: 'fire', x: 21.5, y: 16.5 });
    }
    objects.sort((a, b) => a.x + a.y - b.x - b.y);
    for (const object of objects) {
      c.globalAlpha = 1;
      const p = project(object.x, object.y);
      if (p.x < bounds.left || p.x > bounds.right || p.y < bounds.top || p.y > bounds.bottom) continue;
      if(object.kind==='mineral'){this.drawMineral(object.item,p);continue;}
      if(object.kind==='scatter'){this.drawScatter(object.item,p);continue;}
      if (object.kind === 'shelter') { drawShelter(c, this.simulation.shelter); continue; }
      if (object.kind === 'person') { this.drawPerson(object.item, p, time); continue; }
      if (object.kind === 'bush') { this.drawBush(object.item, p); continue; }
      if (object.kind === 'fire') { this.drawFire(p, time); continue; }
      const tree = object.item;
      if (this.simulation && !this.simulation.standing(Math.floor(tree.x), Math.floor(tree.y))) {
        ellipse(c, p.x, p.y, 8, 4, '#8d7754'); ellipse(c, p.x, p.y - 3, 7, 3, '#c0a778'); continue;
      }
      const occluding = this.selected && Math.abs(p.x - project(this.selected.x + .5, this.selected.y + .5).x) < 45 && p.y > project(this.selected.x + .5, this.selected.y + .5).y && p.y - project(this.selected.x + .5, this.selected.y + .5).y < 120;
      c.globalAlpha = occluding ? .35 : 1;
      const chopping=this.simulation?.people.some(person=>person.job?.kind==='logging'&&!person.job.path.length&&person.job.source?.x===Math.floor(tree.x)&&person.job.source?.y===Math.floor(tree.y));
      c.save();c.translate(p.x,p.y);if(chopping&&!this.reducedMotion)c.rotate(Math.sin(this.simulation.time*9)*.018);c.drawImage(this.sprites[tree.variant],-72,-160);c.restore();
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
    if(this.simulation) for(const effect of this.simulation.feedback){
      const age=this.simulation.time-effect.time,p=project(effect.x,effect.y);
      c.save();c.globalAlpha=Math.max(0,1-age/1.6);c.fillStyle='#f1eed3';c.font=`600 ${12/z}px system-ui`;c.textAlign='center';c.fillText(effect.outcome,p.x,p.y-65-age*15);c.restore();
    }
    this.drawMinimap();
  }
  drawPerson(person, p, time) {
    drawColonist(this.ctx, person, p, { selected: this.selectedPeople?.includes(person.id), zoom: this.camera.zoom, time: this.simulation.time * 1000, reducedMotion: this.reducedMotion, progress: person.job?.kind === 'shelter' ? this.simulation.shelter.progress : person.job?.progress || 0 });
    if (this.selectedPeople?.includes(person.id) && person.job?.path.length) {
      const c = this.ctx; c.save(); c.lineWidth = 1.5 / this.camera.zoom; c.strokeStyle = '#f7f8dfaa'; c.setLineDash([4 / this.camera.zoom, 5 / this.camera.zoom]); c.beginPath(); c.moveTo(p.x, p.y);
      for (const step of person.job.path) { const s = project(step.x, step.y); c.lineTo(s.x, s.y); }
      c.stroke(); c.restore();
    }
  }
  drawBush(bush, p) {
    const c = this.ctx; ellipse(c, p.x + 3, p.y, 18, 6, '#31583a25');
    ellipse(c, p.x - 6, p.y - 8, 11, 10, '#658b4b'); ellipse(c, p.x + 7, p.y - 10, 12, 12, '#7b9b52'); ellipse(c, p.x, p.y - 16, 10, 9, '#8ca65c');
    if (bush.remaining) for (let i = 0; i < Math.min(bush.remaining, 5); i++) ellipse(c, p.x - 8 + i * 4, p.y - 10 - i % 2 * 7, 2.5, 2.3, '#b96956');
  }
  drawFire(p, time) {
    const c = this.ctx; c.save(); c.translate(p.x, p.y);
    for (let i = 0; i < 7; i++) ellipse(c, Math.cos(i / 7 * Math.PI * 2) * 16, Math.sin(i / 7 * Math.PI * 2) * 8, 5, 3.5, i % 2 ? '#a4a58a' : '#8f977e');
    if (this.simulation.firepit) {
      c.strokeStyle = '#7b5e3e'; c.lineWidth = 5; c.beginPath(); c.moveTo(-9, -3); c.lineTo(9, 3); c.moveTo(-9, 3); c.lineTo(9, -3); c.stroke();
      const sway = this.reducedMotion ? 0 : Math.sin(time / 180) * 2;
      polygon(c, [{ x: -7, y: -4 }, { x: -3, y: -18 }, { x: 1 + sway, y: -28 }, { x: 7, y: -13 }, { x: 6, y: -3 }], '#d79c4c');
      polygon(c, [{ x: -3, y: -4 }, { x: 1, y: -17 }, { x: 4, y: -5 }], '#eed38a');
    }
    c.restore();
  }
  drawMineral(mineral,p){
    const c=this.ctx,color=MINERALS[mineral.kind].color;
    ellipse(c,p.x+4,p.y,23,8,'#344d3733');
    polygon(c,[{x:p.x-22,y:p.y-3},{x:p.x-12,y:p.y-24},{x:p.x+8,y:p.y-32},{x:p.x+23,y:p.y-9},{x:p.x+15,y:p.y+3}], '#85907a');
    polygon(c,[{x:p.x-22,y:p.y-3},{x:p.x-12,y:p.y-24},{x:p.x+3,y:p.y-12},{x:p.x+15,y:p.y+3}], '#a4ac91');
    polygon(c,[{x:p.x-12,y:p.y-24},{x:p.x+8,y:p.y-32},{x:p.x+18,y:p.y-17},{x:p.x+3,y:p.y-12}], '#b7bba2');
    for(let i=0;i<5;i++){const x=p.x-11+i*6,y=p.y-9-(i%3)*6;polygon(c,[{x,y},{x:x+4,y:y-5},{x:x+8,y:y-2},{x:x+4,y:y+2}],color);}
  }
  drawScatter(item,p){
    const c=this.ctx;
    if(item.kind==='sticks'){c.strokeStyle='#85714e';c.lineWidth=2.6;c.beginPath();c.moveTo(p.x-10,p.y+2);c.lineTo(p.x+9,p.y-5);c.moveTo(p.x-2,p.y-1);c.lineTo(p.x-5,p.y-8);c.moveTo(p.x-5,p.y+4);c.lineTo(p.x+10,p.y+1);c.stroke();}
    else{for(let i=0;i<3;i++){ellipse(c,p.x-7+i*7,p.y-i%2*3,5,2.5,'#9d9f87');ellipse(c,p.x-8+i*7,p.y-i%2*3-1,3.5,1.8,'#bdc0a5');}}
  }
  drawMinimap() {
    const c = this.mc, cam = this.camera; c.drawImage(this.miniTerrain, 0, 0);
    const {scale,x:ox,y:oy}=this.mini;
    if(this.simulation){c.save();c.translate(ox,oy);c.scale(scale,scale);for(let sy=0;sy<this.world.height/12;sy++)for(let sx=0;sx<this.world.width/12;sx++)if(!this.simulation.unlocked.has(`${sx},${sy}`))polygon(c,[project(sx*12,sy*12),project(sx*12+12,sy*12),project(sx*12+12,sy*12+12),project(sx*12,sy*12+12)],'#344c3dbb');c.restore();}
    const x=(cam.x-cam.width/2/cam.zoom)*scale+ox,y=(cam.y-cam.height/2/cam.zoom)*scale+oy;
    c.strokeStyle = '#284737'; c.lineWidth = 1.2; c.fillStyle = '#f7f9ea22';
    c.fillRect(x, y, cam.width / cam.zoom * scale, cam.height / cam.zoom * scale);
    c.strokeRect(x, y, cam.width / cam.zoom * scale, cam.height / cam.zoom * scale);
  }
}
