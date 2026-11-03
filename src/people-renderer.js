import {TASKS} from './simulation.js';
import {projectView} from './projection.js';
import {box,ellipsoid,drawMesh,drawLine3D} from './mesh-art.js';
export function drawColonist(c,person,point,options){
 const{selected,zoom,time,reducedMotion,socialTarget,view=0}=options,kind=person.job?.kind,moving=!!person.job?.path.length,working=!!kind&&!moving&&person.state===TASKS[kind]?.action;
 const sleeping=working&&kind==='sleep',seated=working&&kind==='rest',crouch=working&&['foraging','scavenge','drink'].includes(kind);
 const phase=reducedMotion?0:time/(moving?115:260)+[...person.id].reduce((n,a)=>n+a.charCodeAt(0),0)*.17;
 const len=Math.hypot(person.direction.x,person.direction.y)||1,dx=person.direction.x/len,dy=person.direction.y/len;
 const project=(side,forward,z=0)=>projectView(-dy*side+dx*forward,dx*side+dy*forward,view,z);
 const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(a,b,color,width)=>drawLine3D(c,a,b,project,color,width);
 c.save();c.translate(point.x,point.y);if(person.stage==='child')c.scale(.7,.7);
 ellipse(3,1,13,5,'#294f3738');
 if(selected){c.strokeStyle='#f9fbe7';c.lineWidth=2/zoom;c.beginPath();c.ellipse(0,0,18,8,0,0,Math.PI*2);c.stroke();}
 if(sleeping){drawMesh(c,[...ellipsoid(0,0,5,.20,.48,7,'#a79b70'),...ellipsoid(0,.08,10,.18,.34,8,person.color),...ellipsoid(0,-.42,12,.12,.12,7,'#d7ae82'),...ellipsoid(0,-.47,16,.13,.09,4,person.hair)],project);}
 else{
  const bob=moving&&!reducedMotion?Math.abs(Math.sin(phase))*1.5:0,stride=moving?Math.sin(phase)*.14:0,base=seated?9:crouch?12:16,head=base+26+bob;
  for(const sign of[-1,1]){const foot=seated?[sign*.2,.18,2]:[sign*.085,sign*stride,2];line([sign*.075,0,base+bob],foot,'#4b4436',5);}
  const swing=working?Math.sin(phase*3)*6:stride*24,handZ=['drink','eat'].includes(kind)&&working?head-3:base+6+(working?6:0)+swing;
  line([-.16,0,base+17+bob],[-.21,working?.14:-stride*.5,base+4+(working?6:0)],'#d4ac7e',4);
  line([.16,0,base+17+bob],[.22,working?.22:stride*.5,handZ],'#d4ac7e',4);
  const faces=[...ellipsoid(0,0,base+10+bob,.165,.105,11,person.color,8,4),...ellipsoid(0,0,head,.135,.12,8,'#d7ae82'),...ellipsoid(0,-.018,head+5,.145,.125,4.5,person.hair)];
  if(person.hair!=='#70513b')faces.push(...ellipsoid(-.10,-.055,head-2,.06,.085,7,person.hair));
  drawMesh(c,faces,project);
  const yaw=Math.PI/4+view*Math.PI/4;if(dx*Math.sin(yaw)+dy*Math.cos(yaw)>.12)for(const sign of[-1,1]){const p=project(sign*.055,.112,head);ellipse(p.x,p.y,1,1.1,'#413a2e');}
  line([-.15,0,base+2],[.15,0,base+2],'#7b6545',2);
  if(working&&['logging','mining','building','shelter','bridge','craftAxe','craftPick'].includes(kind)){
   line([.22,.22,handZ-7],[.22,.25,handZ+11],'#8e744f',3);
   drawMesh(c,box(.24,.25,handZ+8,kind==='mining'?.28:.17,.09,kind==='mining'?4:7,kind==='logging'||kind==='mining'?'#9ca38e':'#b69667'),project);
  }
  if(working&&['foraging','eat'].includes(kind))drawMesh(c,ellipsoid(.21,.23,handZ,.055,.055,3,'#b96956',5,3),project);
  if(working&&kind==='scavenge')line([.18,.18,handZ],[.27,.37,handZ+2],'#af9565',2);
  if(working&&kind==='study')drawMesh(c,ellipsoid(.21,.20,handZ,.09,.065,4,'#9da18a',6,3),project);
  if(working&&kind==='drink')drawMesh(c,box(.22,.22,handZ-2,.10,.10,4,'#7baeb0'),project);
  if(working&&kind==='cooking'){line([.22,.20,handZ],[.27,.42,handZ-5],'#796244',2);drawMesh(c,ellipsoid(.27,.42,handZ-6,.10,.10,3,'#8e7957',7,3),project);}
 }
 if(working&&['logging','mining','shelter','bridge'].includes(kind)&&!reducedMotion)for(let i=0;i<3;i++){const t=(time/650+i*.29)%1;c.globalAlpha=1-t;ellipse(15+t*(i%2?13:-9),-17-t*18,1.7,1.1,kind==='mining'?'#c0c1a8':'#d0b582');}c.globalAlpha=1;
 if((working&&kind==='social')||socialTarget){c.fillStyle='#e3e8cf';c.beginPath();c.roundRect(13,-61,23,14,4);c.fill();for(let i=0;i<3;i++)ellipse(19+i*5,-54,1.2,1.2,'#526a4c');}
 if(person.stage==='child')c.scale(1/.7,1/.7);
 if(selected||zoom>.65){const top=(sleeping||seated?-36:person.stage==='child'?-48:-64)-(options.labelLift||0);c.font=`600 ${11/zoom}px system-ui`;c.textAlign='center';c.textBaseline='bottom';const width=c.measureText(person.name).width;c.fillStyle='#253e32';c.fillRect(-width/2-5/zoom,top-16/zoom,width+10/zoom,19/zoom);c.fillStyle='#edf1e4';c.fillText(person.name,0,top+1);}
 if(sleeping){c.fillStyle='#dbe4be';c.font=`${12/zoom}px system-ui`;c.fillText('z',24,-16-(reducedMotion?0:Math.sin(phase)*3));}
 if(selected&&working&&!['rest','sleep','drink','social'].includes(kind)){c.fillStyle='#a4bf7e';c.fillRect(-15,-55,30*Math.min(options.progress,1),3);}c.restore();
}
