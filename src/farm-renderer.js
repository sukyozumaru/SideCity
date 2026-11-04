import {drawMesh,box,ellipsoid,drawLine3D} from './mesh-art.js';
export function drawFarm(c,plot,project,time=0,reducedMotion=false){
 const wet=plot.moisture>5,faces=box(0,0,-2,.91,.91,2,wet?'#766449':'#9b8057');
 drawMesh(c,faces,project);
 if(plot.stage==='wild'){for(let i=0;i<3;i++)drawLine3D(c,[-.35+i*.3,-.4,1],[-.35+i*.3,.4,1],project,'#c4bb8e',1.4);return;}
 for(let i=0;i<4;i++)drawLine3D(c,[-.34+i*.23,-.38,1],[-.34+i*.23,.38,1],project,wet?'#5e553e':'#7c6749',2);
 if(plot.stage!=='growing')return;const growth=Math.max(.08,plot.growth),plants=[];
 for(let i=0;i<6;i++){
  const x=-.27+i%2*.5,y=-.3+Math.floor(i/2)*.3,z=2+growth*15,sway=reducedMotion?0:Math.sin(time/1600+i)*.018*growth;
  if(growth>.6)plants.push(...ellipsoid(x,y,3,.065,.065,4+growth*2,'#b99056',6,3));
  drawLine3D(c,[x,y,2],[x+sway,y,z],project,'#527d43',1.7);
  for(const sign of[-1,1]){const a=project(x+sway,y,z-2),b=project(x+sway+sign*(.07+growth*.07),y-.03,z+1),d=project(x+sway+sign*.035,y+.06,z+4);c.fillStyle=i%2?'#85a65d':'#6f974f';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.closePath();c.fill();}
 }drawMesh(c,plants,project);
}
export function drawFarmPreview(c,draft,project,zoom){if(!draft)return;const points=[[draft.x,draft.y],[draft.x+1,draft.y],[draft.x+1,draft.y+1],[draft.x,draft.y+1]].map(([x,y])=>project(x,y));c.save();c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=draft.ok?'#b9ce9255':'#c9957755';c.strokeStyle=draft.ok?'#e7edbc':'#e4b998';c.lineWidth=2/zoom;c.fill();c.stroke();c.restore();}
