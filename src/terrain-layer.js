import {RasterCache} from './raster-cache.js';
const UNIT=40*Math.SQRT2;
// A square, top-down atlas has no stretched axis when projected into any orbit.
// Resolution depends on physical zoom, never on camera angle or pan.
export const terrainDensity=(zoom,dpr)=>Math.max(.0625,Math.ceil(zoom*dpr*4)/4);
export class TerrainLayer{
 constructor(world,paint){this.world=world;this.paint=paint;this.cache=new RasterCache(48000000);this.builds=0;}
 chunk(x,y,density){
  const CHUNK=density>2?4:8;
  const key=x+','+y,old=this.cache.get(key);if(old)return old;
  const size=CHUNK*UNIT,pad=2/density,canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil(size*density)+4;
  const c=canvas.getContext('2d');c.scale(density,density);c.translate(pad-x*UNIT,pad-y*UNIT);
  c.transform(Math.SQRT1_2,-Math.SQRT1_2,Math.SQRT2,Math.SQRT2,0,0);c.lineJoin='round';
  const tiles=[];for(let row=Math.max(0,y-1);row<Math.min(this.world.height,y+CHUNK+1);row++)for(let col=Math.max(0,x-1);col<Math.min(this.world.width,x+CHUNK+1);col++)tiles.push(this.world.get(col,row));
  this.paint(c,tiles);this.cache.set(key,canvas);this.builds++;return canvas;
 }
 draw(c,cam,dpr){
  const density=terrainDensity(cam.zoom,dpr);
  const CHUNK=density>2?4:8;
  if(this.density!==density){this.cache.clear();this.density=density;}
  const points=[[-2,-2],[cam.width+2,-2],[cam.width+2,cam.height+2],[-2,cam.height+2]].map(([x,y])=>cam.screenToGrid(x,y));
  const left=Math.max(0,Math.floor(Math.min(...points.map(p=>p.x))/CHUNK)*CHUNK),right=Math.min(this.world.width,Math.ceil(Math.max(...points.map(p=>p.x))/CHUNK)*CHUNK);
  const top=Math.max(0,Math.floor(Math.min(...points.map(p=>p.y))/CHUNK)*CHUNK),bottom=Math.min(this.world.height,Math.ceil(Math.max(...points.map(p=>p.y))/CHUNK)*CHUNK);
  const angle=Math.PI/4+cam.orbit*Math.PI/4,cos=Math.cos(angle),sin=Math.sin(angle),size=CHUNK*UNIT;
  const visible=[];
  for(let y=top;y<bottom;y+=CHUNK)for(let x=left;x<right;x+=CHUNK){
   const corners=[[x,y],[x+CHUNK,y],[x+CHUNK,y+CHUNK],[x,y+CHUNK]].map(([a,b])=>cam.gridToScreen(a,b));
   if(Math.max(...corners.map(p=>p.x))<0||Math.min(...corners.map(p=>p.x))>cam.width||Math.max(...corners.map(p=>p.y))<0||Math.min(...corners.map(p=>p.y))>cam.height)continue;
   visible.push({x,y});
  }
  // A visible working set must fit even on dense displays; retain at most one
  // density, and evict old offscreen chunks before any visible chunk is touched.
  const pixels=(Math.ceil(size*density)+4)**2;this.cache.maxPixels=Math.max(48000000,visible.length*pixels);
  for(const {x,y} of visible)this.cache.get(x+','+y);
  c.save();c.transform(cos,sin*.5,-sin,cos*.5,0,0);
  for(const {x,y} of visible){const image=this.chunk(x,y,density),source=size*density;
   c.drawImage(image,2,2,source,source,x*UNIT,y*UNIT,size+.15/density,size+.15/density);
  }c.restore();
 }
}
