import { project } from './core.js';
import { buildingTiles } from './construction.js';
import { drawShelter } from './camp-renderer.js';
const poly=(c,points,fill,stroke)=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
export function drawBridge(c,b){
  if(!b.reserved)return;const pt=(x,y,h=8)=>{const p=project(x,y);return{x:p.x,y:p.y-h};},xAxis=b.axis.endsWith('x');
  const p=(along,across,h)=>xAxis?pt(b.x+along,b.y+across,h):pt(b.x+across,b.y+along,h),length=xAxis?b.width:b.height;
  const line=(a,z,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.stroke();};
  c.save();c.lineJoin='round';
  poly(c,[p(0,.08,-3),p(length,.08,-3),p(length,.92,-3),p(0,.92,-3)],'#314f4445');
  for(const cross of [.12,.88])line(p(0,cross,6),p(length,cross,6),'#6c6348',5);
  const limit=Math.max(1,Math.floor(length*5*(b.complete?1:b.progress)));
  for(let i=0;i<limit;i++){
    const a=i/5+.018,z=Math.min(length,a+.175);
    poly(c,[p(a,.03,9),p(z,.03,9),p(z,.97,9),p(a,.97,9)],i%3?'#b29a68':'#c1aa77','#89774f');
    line(p(a,.14,9),p(a,.88,9),'#cfb785',.65);
  }
  for(let i=0;i<=length;i++)if(i===0||i===length||i%2===0){
    for(const cross of [.04,.96]){line(p(i,cross,-10),p(i,cross,34),'#7b684b',4);line(p(i,cross,34),p(i,cross,37),'#d4ba84',4);}
  }
  if(b.progress>.45||b.complete)for(const cross of [.04,.96]){line(p(0,cross,32),p(length,cross,32),'#a68b5e',3);line(p(0,cross,21),p(length,cross,21),'#c1ad7e',1.5);}
  if(!b.complete){const q=p(length/2,.5,50);c.fillStyle='#253e32';c.fillRect(q.x-36,q.y,72,5);c.fillStyle='#b7cf92';c.fillRect(q.x-36,q.y,72*b.progress,5);}
  c.restore();
}
export function drawPlacement(c,draft,zoom){
  if(!draft)return;c.save();const color=draft.ok?'#c0d59a':'#d2a28a';c.lineWidth=2/zoom;
  for(const t of buildingTiles(draft)){poly(c,[project(t.x,t.y),project(t.x+1,t.y),project(t.x+1,t.y+1),project(t.x,t.y+1)],draft.ok?'#a4bf7e55':'#b77d6555',color);}
  if(draft.kind==='shelter'){c.globalAlpha=.45;drawShelter(c,{...draft,reserved:true,complete:true,progress:1});}
  else if(draft.span){c.globalAlpha=.6;drawBridge(c,{...draft,reserved:true,complete:true,progress:1});}
  c.restore();
}
