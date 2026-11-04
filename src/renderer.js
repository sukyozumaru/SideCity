import { TILE_W, TILE_H, project, hash } from './core.js';
import { drawColonist } from './people-renderer.js';
import { drawShelter } from './camp-renderer.js';
import { drawBridge, drawPlacement } from './construction-renderer.js';
import { groundMatrix, projectView } from './projection.js';
import { drawMesh, treeMesh, rockMesh, bushMesh, ellipsoid, drawLine3D } from './mesh-art.js';
import { SECTOR_SIZE, MINERALS } from './terrain.js';
import { RasterCache,rasterDensity,matrixStretch } from './raster-cache.js';
import {drawFarm,drawFarmPreview} from './farm-renderer.js';
import {drawCampfire,drawRiverFX} from './environment-fx.js';

const grass = ['#91b56e', '#94b872', '#96b974', '#92b570', '#98ba75', '#90b36d'];
function polygon(ctx, points, fill, stroke) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function diamond(ctx, x, y, fill, stroke, projector=project) {
  polygon(ctx, [projector(x, y), projector(x + 1, y), projector(x + 1, y + 1), projector(x, y + 1)], fill, stroke);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
export class Renderer {
  constructor(canvas, minimap, world, camera) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.map = minimap; this.mc = minimap.getContext('2d');
    this.world = world; this.camera = camera; this.dpr = 1; this.grid = false; this.selected = null; this.hover = null;
    this.treeMeshes=Array.from({length:6},(_,i)=>treeMesh(i));this.treeCache=new RasterCache(6000000);this.objectCache=new RasterCache(2000000);this.groundView=document.createElement('canvas');
    this.cache = document.createElement('canvas'); this.cacheScale = .7;
    this.cacheWidth = (world.width + world.height) * TILE_W / 2 + 100;
    this.cacheHeight = (world.width + world.height) * TILE_H / 2 + 180;
    this.cache.width = Math.ceil(this.cacheWidth * this.cacheScale); this.cache.height = Math.ceil(this.cacheHeight * this.cacheScale);
    this.origin = { x: world.height * TILE_W / 2 + 50, y: 75 }; this.buildTerrain();
  }
  buildTerrain() {
    const c = this.cache.getContext('2d'); c.scale(this.cacheScale,this.cacheScale); c.translate(this.origin.x, this.origin.y); c.lineJoin = 'round';
    this.paintTerrain(c,this.world.tiles);this.buildMiniTerrain();
  }
  paintTerrain(c,tiles){
    for (const tile of tiles) {
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
  }
  drawTerrain(c,matrix){
    const cam=this.camera,z=cam.zoom,dpr=this.dpr;
    if(z*dpr*matrixStretch(matrix)<=this.cacheScale){c.save();c.transform(matrix.a,matrix.b,matrix.c,matrix.d,0,0);c.drawImage(this.cache,-this.origin.x,-this.origin.y,this.cacheWidth,this.cacheHeight);c.restore();return;}
    const key=[cam.x,cam.y,z,cam.orbit,cam.width,cam.height,dpr].join('/');
    if(this.groundKey!==key){
      const layer=this.groundView;if(layer.width!==this.canvas.width||layer.height!==this.canvas.height){layer.width=this.canvas.width;layer.height=this.canvas.height;}
      const g=layer.getContext('2d'),focus=cam.viewFocus;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,layer.width,layer.height);g.setTransform(dpr,0,0,dpr,0,0);g.translate(cam.width/2,cam.height/2);g.scale(z,z);g.translate(-focus.x,-focus.y);g.transform(matrix.a,matrix.b,matrix.c,matrix.d,0,0);g.lineJoin='round';
      const points=[[-90,-90],[cam.width+90,-90],[cam.width+90,cam.height+90],[-90,cam.height+90]].map(([x,y])=>cam.screenToGrid(x,y));
      const left=Math.max(0,Math.floor(Math.min(...points.map(p=>p.x)))-1),right=Math.min(this.world.width,Math.ceil(Math.max(...points.map(p=>p.x)))+1),top=Math.max(0,Math.floor(Math.min(...points.map(p=>p.y)))-1),bottom=Math.min(this.world.height,Math.ceil(Math.max(...points.map(p=>p.y)))+1),tiles=[];
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const p=cam.gridToScreen(x+.5,y+.5);if(p.x>=-90&&p.x<=cam.width+90&&p.y>=-90&&p.y<=cam.height+90)tiles.push(this.world.get(x,y));}
      this.paintTerrain(g,tiles);this.groundKey=key;
    }
    c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(this.groundView,0,0);c.restore();
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
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(width * this.dpr); this.canvas.height = Math.round(height * this.dpr);
    this.camera.width = width; this.camera.height = height;
  }
  draw(time = 0) {
    if(this.dpr!==(window.devicePixelRatio||1))this.resize(this.camera.width,this.camera.height);
    const c = this.ctx, camera = this.camera, { width: w, height: h, zoom: z } = camera;
    const project=camera.projectGrid.bind(camera),focus=camera.viewFocus;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.fillStyle = '#8a9d82'; c.fillRect(0, 0, w, h);
    c.translate(w / 2, h / 2); c.scale(z, z); c.translate(-focus.x,-focus.y);
    const corners=[[0,0],[this.world.width,0],[this.world.width,this.world.height],[0,this.world.height]];
    for(let i=0;i<4;i++){const a=project(...corners[i]),b=project(...corners[(i+1)%4]);polygon(c,[a,b,{x:b.x,y:b.y+25},{x:a.x,y:a.y+25}],i%2?'#a49067':'#8b795a');}
    this.drawTerrain(c,groundMatrix(camera.orbit));
    if (this.grid) {
      c.beginPath();
      for(let x=0;x<=this.world.width;x++){const a=project(x,0),b=project(x,this.world.height);c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}
      for(let y=0;y<=this.world.height;y++){const a=project(0,y),b=project(this.world.width,y);c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}
      c.strokeStyle = '#365a3430'; c.lineWidth = .75 / z; c.stroke();
    }
    drawRiverFX(c,this.world,camera,(this.simulation?.time||0)*1000,this.reducedMotion,this.simulation?.people||[]);
    if(this.simulation)for(const b of this.simulation.buildings)if(b.kind==='bridge')drawBridge(c,b,project);
    if(this.simulation)for(let y=0;y<this.world.height/SECTOR_SIZE;y++)for(let x=0;x<this.world.width/SECTOR_SIZE;x++){
      if(this.simulation.unlocked.has(`${x},${y}`))continue;
      const a=x*SECTOR_SIZE,b=y*SECTOR_SIZE;
      polygon(c,[project(a,b),project(a+SECTOR_SIZE,b),project(a+SECTOR_SIZE,b+SECTOR_SIZE),project(a,b+SECTOR_SIZE)],'#344c3d99','#9daf8133');
      if(z>.15){const p=project(a+6,b+6);c.fillStyle='#d5dfbe';c.font=`${13/z}px system-ui`;c.textAlign='center';c.fillText('144 parcelas',p.x,p.y);}
    }
    const tile = this.selected || this.hover;
    if (tile) { c.lineWidth = 2 / z; diamond(c, tile.x, tile.y, this.selected ? '#f6f7cf55' : '#ffffff22', this.selected ? '#f9fbec' : '#e3ebce',project); }
    const bounds = { left: focus.x - w / 2 / z - 100, right: focus.x + w / 2 / z + 100, top: focus.y - h / 2 / z - 50, bottom: focus.y + h / 2 / z + 170 };
    const elapsed = Math.min(.1, Math.max(0, (time - (this.previousRender || time)) / 1000)); this.previousRender = time;
    this.visualPeople ||= new Map();
    const objects = this.world.trees.filter(tree=>!this.simulation||this.simulation.isUnlocked(tree.x,tree.y)).map(tree => ({ kind: 'tree', item: tree, x: tree.x, y: tree.y }));
    if (this.simulation) {
      for (const person of this.simulation.people) {
        let visual = this.visualPeople.get(person.id);
        if (!visual || Math.hypot(visual.x-person.x,visual.y-person.y)>4) visual={x:person.x,y:person.y};
        const smoothing=1-Math.exp(-elapsed*24);visual.x+=(person.x-visual.x)*smoothing;visual.y+=(person.y-visual.y)*smoothing;const wanted=Math.atan2(person.direction.y,person.direction.x);visual.angle??=wanted;visual.angle+=Math.atan2(Math.sin(wanted-visual.angle),Math.cos(wanted-visual.angle))*(1-Math.exp(-elapsed*16));this.visualPeople.set(person.id,visual);
        objects.push({kind:'person',item:person,x:visual.x,y:visual.y});
      }
      for(const plot of this.simulation.plots)objects.push({kind:'plot',item:plot,x:plot.x+.5,y:plot.y+.5});
      for(const mineral of this.world.minerals)if(this.simulation.isUnlocked(mineral.x,mineral.y)&&this.simulation.mineralRemaining(mineral)>0)objects.push({kind:'mineral',item:mineral,x:mineral.x+.5,y:mineral.y+.5});
      for(const detail of this.world.scatter)if(this.simulation.isUnlocked(detail.x,detail.y)&&!this.simulation.scavenged.has(`${detail.x},${detail.y}`))objects.push({kind:'scatter',item:detail,x:detail.x+.5,y:detail.y+.5});
      for(const shelter of this.simulation.buildings)if(shelter.kind==='shelter'&&shelter.reserved)objects.push({kind:'shelter',item:shelter,x:shelter.x+shelter.width/2,y:shelter.y+shelter.height/2});
      for (const bush of this.simulation.shrubs) objects.push({ kind: 'bush', item: bush, x: bush.x + .5, y: bush.y + .5 });
      objects.push({ kind: 'fire', x: 21.5, y: 16.5 });
    }
    for(const object of objects)object.point=project(object.x,object.y);
    const visible=objects.filter(({point:p})=>p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.top&&p.y<=bounds.bottom).sort((a,b)=>a.point.y-b.point.y);
    for (const object of visible) {
      c.globalAlpha = 1;
      const p = object.point;
      if(object.kind==='plot'){c.save();c.translate(p.x,p.y);drawFarm(c,object.item,project,this.simulation.time*1000,this.reducedMotion);c.restore();continue;}
      if(object.kind==='mineral'){this.drawMineral(object.item,p);continue;}
      if(object.kind==='scatter'){this.drawScatter(object.item,p);continue;}
      if (object.kind === 'shelter') { drawShelter(c,object.item,false,project); continue; }
      if (object.kind === 'person') { this.drawPerson(object.item, p, time); continue; }
      if (object.kind === 'bush') { this.drawBush(object.item, p); continue; }
      if (object.kind === 'fire') { this.drawFire(p, this.simulation.time*1000); continue; }
      const tree = object.item;
      if (this.simulation && !this.simulation.standing(Math.floor(tree.x), Math.floor(tree.y))) {
        ellipse(c, p.x, p.y, 8, 4, '#8d7754'); ellipse(c, p.x, p.y - 3, 7, 3, '#c0a778'); continue;
      }
      const occluding = this.selected && Math.abs(p.x - project(this.selected.x + .5, this.selected.y + .5).x) < 45 && p.y > project(this.selected.x + .5, this.selected.y + .5).y && p.y - project(this.selected.x + .5, this.selected.y + .5).y < 120;
      c.globalAlpha = occluding ? .35 : 1;
      const chopping=this.simulation?.people.some(person=>person.job?.kind==='logging'&&!person.job.path.length&&person.job.source?.x===Math.floor(tree.x)&&person.job.source?.y===Math.floor(tree.y));
      c.save();c.translate(p.x,p.y);if(chopping&&!this.reducedMotion)c.rotate(Math.sin(this.simulation.time*9)*.018);c.drawImage(this.treeSprite(tree.variant),-80,-170,160,190);c.restore();
    }
    c.globalAlpha = 1;
    drawPlacement(c,this.placement,z,project);drawFarmPreview(c,this.farmPreview,project,z);
    if (this.selected) {
      const p = project(this.selected.x + .5, this.selected.y + .5);
      ellipse(c, p.x, p.y, 3.4 / z, 2 / z, '#315d49');
    }
    if(this.simulation) for(const effect of this.simulation.feedback){
      const age=this.simulation.time-effect.time,p=project(effect.x,effect.y);
      c.save();c.globalAlpha=Math.max(0,1-age/1.6);c.fillStyle='#f1eed3';c.font=`600 ${12/z}px system-ui`;c.textAlign='center';c.fillText(effect.outcome,p.x,p.y-65-age*15);c.restore();
    }
    this.drawMinimap();
  }
  drawPerson(person, p, time) {
    const project=this.camera.projectGrid.bind(this.camera);
    const socialTarget=this.simulation.people.some(other=>other.job?.kind==='social'&&other.job.source?.personId===person.id&&!other.job.path.length),point={...p};
    if(this.simulation.hasBridge(Math.floor(person.x),Math.floor(person.y)))point.y-=9;
    const overlaps=this.simulation.people.filter(other=>Math.hypot(other.x-person.x,other.y-person.y)<.35).sort((a,b)=>a.id.localeCompare(b.id));if(overlaps.length>1)point.x+=(overlaps.indexOf(person)-(overlaps.length-1)/2)*8;
    const neighbours=this.simulation.people.filter(other=>Math.hypot(other.x-person.x,other.y-person.y)<1.25).sort((a,b)=>a.id.localeCompare(b.id));
    const angle=this.visualPeople.get(person.id)?.angle??Math.atan2(person.direction.y,person.direction.x),speechPeople=this.simulation.people.filter(p=>this.simulation.speechFor(p)).slice(0,2);
    drawColonist(this.ctx, {...person,direction:{x:Math.cos(angle),y:Math.sin(angle)}}, point, { selected: this.selectedPeople?.includes(person.id), zoom: this.camera.zoom, time: this.simulation.time * 1000, reducedMotion: this.reducedMotion, socialTarget,speech:speechPeople.includes(person)?this.simulation.speechFor(person):'',view:this.camera.orbit,labelLift:neighbours.length>1?neighbours.indexOf(person)*16/this.camera.zoom:0, progress: ['shelter','bridge'].includes(person.job?.kind) ? this.simulation.jobProject(person.job).progress : person.job?.progress || 0 });
    if (this.selectedPeople?.includes(person.id) && person.job?.path.length) {
      const c = this.ctx; c.save(); c.lineWidth = 1.5 / this.camera.zoom; c.strokeStyle = '#f7f8dfaa'; c.setLineDash([4 / this.camera.zoom, 5 / this.camera.zoom]); c.beginPath(); c.moveTo(p.x, p.y);
      for (const step of person.job.path) { const s = project(step.x, step.y); c.lineTo(s.x, s.y); }
      c.stroke(); c.restore();
    }
  }
  treeSprite(variant){
    const angle=((Math.round(this.camera.orbit*64)%512)+512)%512/64,density=rasterDensity(this.camera.zoom,this.dpr),key=variant+':'+angle+':'+density;
    if(this.treeCache.has(key))return this.treeCache.get(key);
    const sprite=document.createElement('canvas');sprite.width=160*density;sprite.height=190*density;const c=sprite.getContext('2d');c.scale(density,density);c.translate(80,170);ellipse(c,9,2,25,9,'#31583a26');
    drawMesh(c,this.treeMeshes[variant],(x,y,z)=>projectView(x,y,angle,z));this.treeCache.set(key,sprite);return sprite;
  }
  objectSprite(key,paint){
    const angle=((Math.round(this.camera.orbit*64)%512)+512)%512/64,density=rasterDensity(this.camera.zoom,this.dpr),id=key+':'+angle+':'+density;
    if(this.objectCache.has(id))return this.objectCache.get(id);
    const sprite=document.createElement('canvas');sprite.width=96*density;sprite.height=100*density;const c=sprite.getContext('2d');c.scale(density,density);c.translate(48,78);paint(c,(x,y,z)=>projectView(x,y,angle,z));
    this.objectCache.set(id,sprite);return sprite;
  }
  drawBush(bush,p){this.ctx.drawImage(this.objectSprite('bush:'+Math.min(5,bush.remaining),(c,project)=>drawMesh(c,bushMesh(bush.remaining),project)),p.x-48,p.y-78,96,100);}
  drawFire(p,time){const c=this.ctx;c.save();c.translate(p.x,p.y);drawCampfire(c,this.camera.projectGrid.bind(this.camera),this.simulation.firepit,time,this.reducedMotion);c.restore();}
  drawMineral(mineral,p){this.ctx.drawImage(this.objectSprite('rock:'+mineral.kind,(c,project)=>drawMesh(c,rockMesh(mineral.kind,MINERALS[mineral.kind].color),project)),p.x-48,p.y-78,96,100);}
  drawScatter(item,p){
    const sprite=this.objectSprite('scatter:'+item.kind,(c,project)=>{
    if(item.kind==='sticks'){drawLine3D(c,[-.2,0,2],[.2,.1,3],project,'#85714e',2.6);drawLine3D(c,[0,.05,3],[-.1,-.1,5],project,'#85714e',2);drawLine3D(c,[-.13,.14,2],[.2,.2,2],project,'#9b845b',2);}
    else{const faces=[];for(let i=0;i<3;i++)faces.push(...ellipsoid(-.13+i*.14,i%2*.12,2,.09,.07,3,'#bdc0a5',6,3));drawMesh(c,faces,project);}});this.ctx.drawImage(sprite,p.x-48,p.y-78,96,100);
  }
  drawMinimap() {
    const c = this.mc, cam = this.camera; c.drawImage(this.miniTerrain, 0, 0);
    const {scale,x:ox,y:oy}=this.mini;
    if(this.simulation){c.save();c.translate(ox,oy);c.scale(scale,scale);for(let sy=0;sy<this.world.height/12;sy++)for(let sx=0;sx<this.world.width/12;sx++)if(!this.simulation.unlocked.has(`${sx},${sy}`))polygon(c,[project(sx*12,sy*12),project(sx*12+12,sy*12),project(sx*12+12,sy*12+12),project(sx*12,sy*12+12)],'#344c3dbb');c.restore();}
    const corners=[[0,0],[cam.width,0],[cam.width,cam.height],[0,cam.height]].map(([x,y])=>{const p=cam.screenToWorld(x,y);return{x:p.x*scale+ox,y:p.y*scale+oy};});
    c.lineWidth=1.2;polygon(c,corners,'#f7f9ea22','#284737');
  }
}
