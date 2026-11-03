import {project} from './core.js';
export function drawShelter(c,b,selected=false,projection=project){
 if(!b.reserved)return;const {x,y,width:w,height:h,progress}=b;
 const pt=(a,d,z=0)=>{const p=projection(a,d);return{x:p.x,y:p.y-z};};
 const poly=(points,fill,stroke)=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const line=(a,d,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(d.x,d.y);c.stroke();};
 c.save();c.lineJoin='round';
 poly([pt(x+.1,y+.1),pt(x+w+.45,y+.1),pt(x+w+.45,y+h+.45),pt(x+.1,y+h+.45)],'#354d3633');
 poly([pt(x,y),pt(x+w,y),pt(x+w,y+h),pt(x,y+h)],'#a69669',selected?'#edf0c4':'#7c8c55');
 for(let i=0;i<8;i++)line(pt(x,y+i/4),pt(x+w,y+i/4),'#bca77a',1);
 if(b.complete)poly([pt(x+.45,y+h),pt(x+1.2,y+h),pt(x+1.2,y+h+.26),pt(x+.45,y+h+.26)],'#9c875c','#7b714e');
 const corners=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],postHeight=16+Math.min(progress/.25,1)*49;
 for(const[a,d]of corners)line(pt(a,d),pt(a,d,postHeight),'#796344',6);
 if(progress>.25){
  const wall=Math.min((progress-.25)/.35,1)*62;
  const walls=corners.map((a,i)=>({a,d:corners[(i+1)%4],i})).sort((a,b)=>(pt(...a.a).y+pt(...a.d).y)-(pt(...b.a).y+pt(...b.d).y));
  for(const face of walls){const [ax,ay]=face.a,[dx,dy]=face.d;poly([pt(ax,ay),pt(dx,dy),pt(dx,dy,wall),pt(ax,ay,wall)],['#b09564','#8e7752','#ad8c5b','#a48b5b'][face.i]);
   for(let i=1;i<8;i++){const t=i/8;line(pt(ax+(dx-ax)*t,ay+(dy-ay)*t),pt(ax+(dx-ax)*t,ay+(dy-ay)*t,wall),face.i%2?'#7e714e':'#bd9d68',1);}
   if(progress>.5&&face.i===2){poly([pt(x+.55,y+h),pt(x+1.1,y+h),pt(x+1.1,y+h,42),pt(x+.55,y+h,42)],'#544c36');line(pt(x+.55,y+h),pt(x+.55,y+h,42),'#d0b17b',3);}
   if(progress>.5&&[0,1].includes(face.i)){const a=face.i===0?[x+.65,y]:[x+w,y+.45],d=face.i===0?[x+1.25,y]:[x+w,y+1.1];poly([pt(...a,29),pt(...d,29),pt(...d,48),pt(...a,48)],'#53624b');line(pt(...a,29),pt(...d,29),'#d0b17b',2);}
  }
 }
 const ridgeA=pt(x,y+h/2,108),ridgeB=pt(x+w,y+h/2,108);
 if(progress>.58){for(const px of[x,x+w]){poly([pt(px,y,65),pt(px,y+h,65),pt(px,y+h/2,108)],'#ac925f');line(pt(px,y,66),pt(px,y+h/2,108),'#826849',4);line(pt(px,y+h/2,108),pt(px,y+h,66),'#826849',4);}line(ridgeA,ridgeB,'#796344',5);}
 if(progress>.72){
  const slopes=[{edge:y-.12,color:'#9b8958'},{edge:y+h+.12,color:'#c0a46b'}].sort((a,b)=>pt(x+w/2,a.edge).y-pt(x+w/2,b.edge).y);
  for(const roof of slopes){poly([ridgeA,ridgeB,pt(x+w+.12,roof.edge,66),pt(x-.12,roof.edge,66)],roof.color);for(let i=0;i<18;i++){const px=x-.06+i*.12;line(pt(px,y+h/2,107),pt(px,roof.edge,66),i%3?'#af955e':'#d0b47b',1.5);}line(pt(x-.12,roof.edge,66),pt(x+w+.12,roof.edge,66),'#8e754d',3);}
  line(ridgeA,ridgeB,'#dac18c',3);
 }
 if(!b.complete){const p=pt(x+1,y+h+.25);c.fillStyle='#314b36';c.fillRect(p.x-38,p.y+6,76,5);c.fillStyle='#b3c77e';c.fillRect(p.x-38,p.y+6,76*progress,5);}
 c.restore();
}
