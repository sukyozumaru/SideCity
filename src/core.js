import { generateTerrain, WORLD_WIDTH, WORLD_HEIGHT } from './terrain.js';
import { projectView, unprojectView, normalizeView, viewBounds } from './projection.js';
export { WORLD_WIDTH, WORLD_HEIGHT } from './terrain.js';
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
export function createWorld(seed = 48128) { return generateTerrain(seed, hash); }
export class Camera {
  constructor(width, height) { this.width = width; this.height = height; this.x = 0; this.y = 960; this.zoom = .6; this.minZoom = .025; this.maxZoom = 1.8;this.view=0;this.orbit=0;this.transition=null;this.smoothRotation=true; }
  projectGrid(x,y,z=0){return projectView(x,y,this.orbit,z);}
  get viewFocus(){const p=unproject(this.x,this.y);return this.projectGrid(p.x,p.y);}
  gridToScreen(x,y,z=0){const p=this.projectGrid(x,y,z),f=this.viewFocus;return{x:(p.x-f.x)*this.zoom+this.width/2,y:(p.y-f.y)*this.zoom+this.height/2};}
  screenToGrid(x,y){const f=this.viewFocus;return unprojectView((x-this.width/2)/this.zoom+f.x,(y-this.height/2)/this.zoom+f.y,this.orbit);}
  screenToWorld(x,y){const p=this.screenToGrid(x,y);return project(p.x,p.y);}
  worldToScreen(x,y){const p=unproject(x,y);return this.gridToScreen(p.x,p.y);}
  setView(view,{animate=this.smoothRotation}={}){if(!Number.isInteger(view))return false;const target=normalizeView(view);let delta=((target-this.orbit+12)%8)-4;this.view=target;if(!animate){this.orbit=target;this.transition=null;}else this.transition={from:this.orbit,to:this.orbit+delta,elapsed:0};return true;}
  rotate(step){return this.setView(this.view+step);}
  update(dt){if(!this.transition)return false;const t=this.transition;t.elapsed+=Math.max(0,dt);const f=Math.min(1,t.elapsed/.32),ease=f*f*(3-2*f);this.orbit=t.from+(t.to-t.from)*ease;if(f===1){this.orbit=this.view;this.transition=null;}return true;}
  get rotating(){return !!this.transition;}
  zoomAt(zoom, x, y) {
    const anchor = this.screenToWorld(x, y);
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    const after=this.screenToWorld(x,y);this.x+=anchor.x-after.x;this.y+=anchor.y-after.y;
    this.bound();
  }
  pan(dx,dy){const cell=unprojectView(dx/this.zoom,dy/this.zoom,this.orbit),p=project(cell.x,cell.y);this.x-=p.x;this.y-=p.y;this.bound();}
  bound() {
    // Keep the focus inside the map diamond; its shore remains visible at every edge.
    const cell = unproject(this.x, this.y);
    const p = project(clamp(cell.x, 0, WORLD_WIDTH), clamp(cell.y, 0, WORLD_HEIGHT));
    this.x = p.x; this.y = p.y;
  }
  fit(){const b=viewBounds(WORLD_WIDTH,WORLD_HEIGHT,this.orbit);this.zoom=clamp(Math.min((this.width-80)/(b.right-b.left),(this.height-90)/(b.bottom-b.top+130)),this.minZoom,.7);const p=project(WORLD_WIDTH/2,WORLD_HEIGHT/2);this.x=p.x;this.y=p.y;}
  home(){this.setView(0,{animate:false});const p=project(21,18);this.x=p.x;this.y=p.y;this.zoom=this.width<700?.72:.9;}
}
export class Gestures {
  constructor(camera, onTap) { this.camera = camera; this.onTap = onTap; this.points = new Map(); this.tap = null; this.pinch = null; this.dragSpeed=1;this.zoomSpeed=1; }
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
        this.camera.zoomAt(this.camera.zoom * Math.pow(this.pinch.distance / before.distance,this.zoomSpeed), this.pinch.x, this.pinch.y);
      }
    } else if (this.points.size === 1) {
      if (this.tap && Math.hypot(x - this.tap.x, y - this.tap.y) > 6) this.tap.moved = true;
      if (!this.tap || this.tap.moved) this.camera.pan((x-old.x)*this.dragSpeed,(y-old.y)*this.dragSpeed);
    }
  }
  up(id, x, y, cancelled = false) {
    const tap = this.tap;
    if (!cancelled && this.points.size === 1 && tap?.id === id && !tap.moved && Math.hypot(x - tap.x, y - tap.y) <= 6) this.onTap(x, y);
    this.points.delete(id); this.tap = null; this.rebase();
  }
  cancelAll() { this.points.clear(); this.tap = null; this.pinch = null; }
}
