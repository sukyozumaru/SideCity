import {drawMesh,ellipsoid,box,drawLine3D} from './mesh-art.js';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
export function drawCampfire(c,project,lit,time,reduced){
 const rocks=[];for(let i=0;i<8;i++)rocks.push(...ellipsoid(Math.cos(i*Math.PI/4)*.32,Math.sin(i*Math.PI/4)*.32,2,.10,.08,4,i%2?'#a4a58a':'#8f977e',6,3));drawMesh(c,rocks,project);
 if(!lit)return;
 oval(c,0,0,27,12,'#d3a45b18');drawMesh(c,[...box(0,0,2,.5,.10,6,'#6c5339'),...box(0,0,3,.10,.48,5,'#87603d')],project);
 const pulse=reduced?0:Math.sin(time/130)*2;
 for(let i=0;i<3;i++){const x=(i-1)*.07,sway=reduced?0:Math.sin(time/180+i)*.035;drawMesh(c,[{points:[{x:x-.1,y:0,z:5},{x:x+sway,y:0,z:29+pulse+i*3},{x:x+.1,y:0,z:5}],color:i===1?'#e3b261':'#bf803e'},{points:[{x,y:-.08,z:6},{x,y:sway,z:22-pulse},{x,y:.08,z:6}],color:'#e7ce88'}],project);}
 if(reduced)return;
 for(let i=0;i<5;i++){const t=(time/3200+i*.21)%1,p=project(t*.23,0,30+t*65);c.globalAlpha=(1-t)*.14;oval(c,p.x,p.y,5+t*10,3+t*6,'#bbc1a5');}
 for(let i=0;i<4;i++){const t=(time/1100+i*.27)%1,p=project(Math.sin(i*5+t)*.12,0,17+t*38);c.globalAlpha=(1-t)*.6;oval(c,p.x,p.y,1,1.6,'#e5bd76');}c.globalAlpha=1;
}
export function drawRiverFX(c,world,camera,time,reduced,people){
 if(reduced||camera.zoom<.25)return;const project=camera.projectGrid.bind(camera),w=camera.width,h=camera.height;
 const start=camera.screenToGrid(w/2,h/2),x0=Math.max(0,Math.floor(start.x)-25),y0=Math.max(0,Math.floor(start.y)-25);
 c.save();c.strokeStyle='#d7ecdb66';c.lineWidth=.85/camera.zoom;let count=0;
 for(let y=y0;y<Math.min(world.height,y0+50)&&count<35;y+=2)for(let x=x0;x<Math.min(world.width,x0+50)&&count<35;x+=3){if(world.get(x,y)?.type!=='water')continue;const screen=camera.gridToScreen(x+.5,y+.5);if(screen.x<0||screen.x>w||screen.y<0||screen.y>h)continue;count++;const flow=(time/6500+x*.13+y*.17)%1,a=project(x+.2+flow*.4,y+.4),b=project(x+.5+flow*.4,y+.4);c.globalAlpha=.35+.35*Math.sin(flow*Math.PI);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+1.5,b.x,b.y);c.stroke();}
 for(const p of people){if(!p.job||p.job.path.length||!['drink','waterPlot'].includes(p.job.kind)||p.job.kind==='waterPlot'&&!p.job.source.fetch)continue;const x=p.job.kind==='drink'?p.job.source.x:p.job.source.waterX,y=p.job.kind==='drink'?p.job.source.y:p.job.source.waterY;for(let ring=0;ring<2;ring++){const phase=(time/1300+ring*.5)%1;c.globalAlpha=(1-phase)*.45;c.beginPath();for(let i=0;i<=20;i++){const a=i/20*Math.PI*2,q=project(x+.5+Math.cos(a)*phase*.35,y+.5+Math.sin(a)*phase*.35);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}c.stroke();}}
 c.restore();
}
