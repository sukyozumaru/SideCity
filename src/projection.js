// Orthographic 3D: constant elevation, orbit in 45° steps. Z stays upright.
export const VIEW_NAMES=['Isométrica SE','Frontal E','Isométrica NE','Frontal N','Isométrica NO','Frontal O','Isométrica SO','Frontal S'];
export const normalizeView=n=>((n%8)+8)%8;
export function projectView(x,y,view=0,z=0){
  const angle=Math.PI/4+view*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle),scale=40*Math.SQRT2;
  return {x:(x*c-y*s)*scale,y:(x*s+y*c)*scale*.5-z};
}
export function unprojectView(x,y,view=0){
  const angle=Math.PI/4+view*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle),scale=40*Math.SQRT2;
  return {x:c*x/scale+s*y/(scale*.5),y:-s*x/scale+c*y/(scale*.5)};
}
// Transform a cached, flat map from its original isometric plane into the orbit view.
export function groundMatrix(view){const o=projectView(0,0,view),a=projectView(1/80,-1/80,view),b=projectView(1/40,1/40,view);return{a:a.x-o.x,b:a.y-o.y,c:b.x-o.x,d:b.y-o.y};}
export function viewBounds(width,height,view){const points=[[0,0],[width,0],[width,height],[0,height]].map(([x,y])=>projectView(x,y,view));return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};}
