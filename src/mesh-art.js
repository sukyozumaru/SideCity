// Small original 3D meshes rendered as flat, illustrated Canvas polygons.
export const vertex=(x,y,z=0)=>({x,y,z});
export function box(x,y,z,w,d,h,color){
  const p=[vertex(x-w/2,y-d/2,z),vertex(x+w/2,y-d/2,z),vertex(x+w/2,y+d/2,z),vertex(x-w/2,y+d/2,z)];
  const top=p.map(v=>({...v,z:z+h}));
  return [...p.map((v,i)=>({points:[v,p[(i+1)%4],top[(i+1)%4],top[i]],color})),{points:top,color}];
}
export function ellipsoid(x,y,z,rx,ry,rz,color,segments=8,rings=4){
  const faces=[],p=(i,j)=>{const lat=-Math.PI/2+Math.PI*j/rings,a=Math.PI*2*i/segments;return vertex(x+Math.cos(a)*Math.cos(lat)*rx,y+Math.sin(a)*Math.cos(lat)*ry,z+Math.sin(lat)*rz);};
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++)faces.push({points:[p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],color});return faces;
}
function tint(hex,light){const n=parseInt(hex.slice(1),16),rgb=[n>>16&255,n>>8&255,n&255];return `rgb(${rgb.map(v=>Math.round(Math.min(255,v*light))).join(',')})`;}
export function drawMesh(c,faces,project){
  const depth=v=>project(v.x,v.y,0).y*1.732+v.z*.577;
  const sorted=faces.map(f=>({...f,depth:f.points.reduce((n,v)=>n+depth(v),0)/f.points.length})).sort((a,b)=>a.depth-b.depth);
  c.lineJoin='round';c.lineWidth=.55;
  for(const f of sorted){
    const [a,b,d]=f.points,u={x:b.x-a.x,y:b.y-a.y,z:(b.z-a.z)/56.57},v={x:d.x-a.x,y:d.y-a.y,z:(d.z-a.z)/56.57},normal={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};const len=Math.hypot(normal.x,normal.y,normal.z)||1;
    const light=.85+.18*(normal.z-normal.x*.5-normal.y*.35)/len;
    c.fillStyle=tint(f.color,light);c.strokeStyle=c.fillStyle;c.beginPath();f.points.forEach((v,i)=>{const p=project(v.x,v.y,v.z);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});c.closePath();c.fill();c.stroke();
  }
}
export function drawLine3D(c,a,b,project,color,width=2){const p=project(...a),q=project(...b);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
export function treeMesh(variant){
  const scale=.8+variant%3*.1,faces=box(0,0,0,.11,.11,66*scale,'#796648');
  if(variant>3){for(let i=0;i<4;i++){const z=(20+i*21)*scale,r=(.62-i*.11)*scale,points=Array.from({length:8},(_,j)=>vertex(Math.cos(j*Math.PI/4)*r,Math.sin(j*Math.PI/4)*r,z));for(let j=0;j<8;j++)faces.push({points:[points[j],points[(j+1)%8],vertex(0,0,z+48*scale)],color:['#477e51','#568a56','#63945b','#80a86a'][i]});}}
  else{
    const green=variant===3?['#7c994e','#93ad5b','#a5b969']:['#55894e','#6e9b58','#86ac65'];
    for(const [x,y,z,r,i]of [[.15,.08,76,.52,0],[-.32,.12,79,.44,1],[.02,-.15,102,.47,1],[-.2,-.18,110,.32,2],[.4,-.08,94,.28,0]])faces.push(...ellipsoid(x*scale,y*scale,z*scale,r*scale,r*scale,27*scale,green[i],8,4));
  }
  return faces;
}
export function rockMesh(kind,color){const faces=ellipsoid(0,0,13,.43,.36,19,'#a5ad94',7,3);if(kind!=='stone')for(let i=0;i<4;i++)faces.push(...ellipsoid(-.2+i*.12,-.12+(i%2)*.17,17+(i%3)*3,.075,.07,4,color,5,2));return faces;}
export function bushMesh(remaining){const faces=[];for(const[x,y,z,r,c]of [[-.15,.08,10,.24,'#658b4b'],[.18,.03,12,.26,'#7b9b52'],[0,-.1,18,.23,'#8ca65c']])faces.push(...ellipsoid(x,y,z,r,r,12,c,7,3));for(let i=0;i<Math.min(5,remaining);i++)faces.push(...ellipsoid(-.24+i*.12,-.15+(i%2)*.18,16+i%3*4,.045,.045,2.5,'#b96956',5,2));return faces;}
