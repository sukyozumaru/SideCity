import { TASKS } from './simulation.js';
export function drawColonist(c, person, point, options) {
  const { selected, zoom, time, reducedMotion } = options;
  const moving = person.job?.path.length > 0, kind = person.job?.kind;
  const working = kind && !moving && person.state === TASKS[kind]?.action;
  const seated = working && kind === 'rest', sleeping = working && kind === 'sleep';
  const phase = reducedMotion ? 0 : time / (moving ? 95 : 240) + person.id.length;
  const face = person.direction.x - person.direction.y >= 0 ? 1 : -1;
  const ellipse = (x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill(); };
  const stroke = (points, color, width) => { c.strokeStyle=color; c.lineWidth=width; c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke(); };
  c.save(); c.translate(point.x,point.y); c.lineCap='round';
  ellipse(3,1,13,5,'#294f3738');
  if(selected){c.strokeStyle='#f9fbe7';c.lineWidth=2/zoom;c.beginPath();c.ellipse(0,0,18,8,0,0,Math.PI*2);c.stroke();}
  c.save(); c.scale(face,1);
  if(sleeping){
    ellipse(0,0,23,9,'#a79b70');ellipse(3,-4,19,8,person.color);ellipse(-20,-6,7,7,'#d7ae82');ellipse(-23,-9,5,5,person.hair);
    stroke([[-18,-7],[-15,-7]],'#493c30',1);
  }else{
    const crouching=working&&['foraging','scavenge','drink'].includes(kind);
    if(crouching)c.translate(0,8);
    if(seated)c.translate(0,13);
    const stride=moving?Math.sin(phase)*5:0,bob=moving?Math.abs(Math.sin(phase))*1.5:!reducedMotion&&!working?Math.sin(phase*.6)*.45:0;
    c.translate(0,-bob);
    if(crouching)c.scale(1,.83);
    if(working&&kind==='logging')c.rotate(Math.sin(phase*3)*.045);
    if(seated){stroke([[-4,-16],[-13,-10],[-16,-3]],'#4b4436',5);stroke([[4,-16],[13,-10],[16,-3]],'#4b4436',5);}
    else{stroke([[-4,-15],[-5+stride,-2]],'#4b4436',5);stroke([[4,-15],[5-stride,-2]],'#4b4436',5);}
    c.fillStyle=person.color;c.beginPath();c.moveTo(-8,-34);c.lineTo(7,-34);c.lineTo(9,-14);c.lineTo(-8,-14);c.closePath();c.fill();
    c.fillStyle='#2d403327';c.fillRect(1,-33,6,18);
    const arm=working?Math.sin(phase*3)*6:stride;
    stroke([[-8,-31],[-12-arm*.4,-21-(working?6:0)]],'#d4ac7e',4);
    stroke([[8,-31],[12+arm*.5,kind==='drink'&&working?-38:-20-(working?8:0)]],'#d4ac7e',4);
    ellipse(0,-40,7.5,9,'#d7ae82');ellipse(-1,-45,8,5.5,person.hair);
    if(person.id!=='ivo')ellipse(-7,-39,3.5,8,person.hair);
    c.fillStyle='#413a2e';c.fillRect(3,-41,1.2,1.5);stroke([[-7,-16],[8,-16]],'#7b6545',2);
    if(working&&['logging','mining','building','shelter','craftAxe','craftPick'].includes(kind)){
      c.save();c.translate(14,-26);c.rotate(-.4+Math.sin(phase*3)*.5);stroke([[0,8],[0,-12]],'#776047',3);c.fillStyle=kind==='logging'?'#8f9787':'#b69667';c.fillRect(-2,-14,11,7);c.restore();
    }
    if(working&&kind==='foraging'){ellipse(15,-29,3,2.5,'#b96956');}
    if(working&&kind==='study'){ellipse(12,-26,5,3.5,'#9da18a');stroke([[8,-25],[14,-30]],'#c0bd9b',1);}
    if(working&&kind==='drink'){ellipse(12,-38,4,2,'#7baeb0');}
    if(working&&kind==='eat'){ellipse(13,-29,5,3,'#b69c6e');ellipse(12,-32,2,2,'#be7861');}
    if(working&&kind==='cooking'){stroke([[10,-27],[19,-19]],'#796244',2);ellipse(18,-18,6,3,'#8e7957');}
  }
  c.restore();
  if(selected||zoom>.65){
    const top=sleeping||seated?-36:-64;c.font=`600 ${11/zoom}px system-ui`;c.textAlign='center';c.textBaseline='bottom';const width=c.measureText(person.name).width;
    c.fillStyle='#253e32';c.fillRect(-width/2-5/zoom,top-16/zoom,width+10/zoom,19/zoom);c.fillStyle='#edf1e4';c.fillText(person.name,0,top+1);
  }
  if(sleeping){c.fillStyle='#dbe4be';c.font=`${12/zoom}px system-ui`;c.fillText('z',24,-16-(reducedMotion?0:Math.sin(phase)*3));}
  if(selected&&working&&!['rest','sleep','drink'].includes(kind)){c.fillStyle='#a4bf7e';c.fillRect(-15,-55,30*Math.min(options.progress,1),3);}
  c.restore();
}
