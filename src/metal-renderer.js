import {box,ellipsoid,drawMesh,drawLine3D} from './mesh-art.js';
const meshes=new Map();
function stationMesh(kind){
 if(meshes.has(kind))return meshes.get(kind);const faces=[...box(0,0,0,1.9,1.9,5,'#9b906c')];
 if(kind==='furnace'){
  faces.push(...box(0,0,5,1.2,1.2,36,'#a69a79'),...box(0,0,41,.9,.9,12,'#b3a582'),...box(.22,0,53,.3,.3,30,'#99866a'));
  for(let i=0;i<5;i++)faces.push(...box(-.48+i*.24,.68,5,.22,.22,7,'#a8ab93'));
  faces.push(...box(0,.607,10,.5,.02,23,'#5d5944'),...box(0,.62,11,.36,.015,9,'#bf874c'));
 }else{
  for(const x of[-.78,.78])for(const y of[-.7,.7])faces.push(...box(x,y,4,.09,.09,66,'#806b48'));
  faces.push(...box(0,-.25,69,1.9,1.5,8,'#b9a16b'),...box(0,.15,27,1.35,.6,8,'#a18457'),...box(.3,.15,35,.4,.34,10,'#a8a994'),...box(-.35,.15,35,.3,.23,5,'#b3915c'));
 }meshes.set(kind,faces);return faces;
}
export function drawMetalBuilding(c,b,project,time=0,active=false,reduced=false){
 const p=project(b.x+1,b.y+1);c.save();c.translate(p.x,p.y);
 const local=(x,y,z=0)=>{const q=project(b.x+1+x,b.y+1+y,z);return{x:q.x-p.x,y:q.y-p.y};};
 if(!b.complete){drawMesh(c,stationMesh(b.kind).filter((_,i)=>i<Math.max(5,Math.ceil(stationMesh(b.kind).length*b.progress))),local);c.fillStyle='#314b36';c.fillRect(-36,10,72,5);c.fillStyle='#b3c77e';c.fillRect(-36,10,72*b.progress,5);}
 else drawMesh(c,stationMesh(b.kind),local);
 if(b.complete&&b.kind==='furnace'&&active){
  for(let i=0;i<3;i++){const q=local((i-1)*.1,.64,16+(reduced?0:Math.sin(time/130+i)*3));c.fillStyle=i===1?'#e6c27c':'#c48d50';c.beginPath();c.ellipse(q.x,q.y,3,5,0,0,Math.PI*2);c.fill();}
  if(!reduced)for(let i=0;i<3;i++){const t=(time/2800+i/3)%1,q=local(.22+t*.15,0,84+t*35);c.globalAlpha=(1-t)*.15;c.fillStyle='#bcc1aa';c.beginPath();c.ellipse(q.x,q.y,4+t*9,3+t*5,0,0,Math.PI*2);c.fill();}
 }
 c.restore();
}
