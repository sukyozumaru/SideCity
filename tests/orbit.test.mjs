import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Camera,Gestures,createWorld,project} from '../src/core.js';
import {projectView,unprojectView,groundMatrix,VIEW_NAMES} from '../src/projection.js';
import {defaultControls,validateControls,bindAction,InputActions} from '../src/input-actions.js';
import {Simulation} from '../src/simulation.js';
import {pickObject,describeObject} from '../src/interactions.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('all eight orientations and intermediate rotation preserve map coordinates and the terrain cache',()=>{
 assert.equal(new Set(VIEW_NAMES).size,8);
 for(let view=-1;view<=8;view+=.125)for(const[x,y]of[[0,0],[96,72],[18.5,21.5],[42.14,17.31]]){
  const p=projectView(x,y,view),q=unprojectView(p.x,p.y,view);near(q.x,x);near(q.y,y);
  const base=project(x,y),m=groundMatrix(view);near(m.a*base.x+m.c*base.y,p.x);near(m.b*base.x+m.d*base.y,p.y);
 }
});
test('rotation keeps focus fixed, wraps by the short path and survives repeated input',()=>{
 const c=new Camera(1280,800);c.home();const before=c.screenToGrid(640,400);
 c.rotate(-1);c.update(.16);assert.ok(c.orbit<0&&c.orbit>-.9);c.rotate(-1);c.update(.32);assert.equal(c.view,6);assert.equal(c.orbit,6);
 for(let i=0;i<24;i++){c.rotate(1);c.update(.03);}c.update(.32);assert.equal(c.view,6);assert.equal(c.rotating,false);
 const after=c.screenToGrid(640,400);near(before.x,after.x);near(before.y,after.y);
 const a=new Camera(800,600),b=new Camera(800,600);a.rotate(1);b.rotate(1);a.update(.16);for(let i=0;i<8;i++)b.update(.02);near(a.orbit,b.orbit);
 c.smoothRotation=false;c.rotate(1);assert.equal(c.rotating,false);assert.equal(c.orbit,7);
});
test('touch pan and anchored pinch work in every camera orientation',()=>{
 for(let view=0;view<8;view++){
  const c=new Camera(390,844);c.home();c.setView(view,{animate:false});const origin=c.gridToScreen(21,18),g=new Gestures(c,()=>assert.fail('A pan or pinch must never order a person'));
  g.down(1,150,300);g.move(1,175,312);g.up(1,175,312);const moved=c.gridToScreen(21,18);near(moved.x-origin.x,25);near(moved.y-origin.y,12);
  const anchor=c.screenToGrid(180,310);c.zoomAt(1.3,180,310);const after=c.screenToGrid(180,310);near(anchor.x,after.x);near(anchor.y,after.y);
  g.down(1,130,300);g.down(2,230,300);const z=c.zoom;g.move(2,250,300);g.up(1,130,300);g.up(2,250,300);assert.ok(c.zoom>z);
 }
});
test('fit keeps every corner in view on portrait, landscape and desktop in all eight directions',()=>{
 for(const[w,h]of[[360,640],[390,844],[844,390],[1440,900]])for(let view=0;view<8;view++){
  const c=new Camera(w,h);c.setView(view,{animate:false});c.fit();for(const[x,y]of[[0,0],[96,0],[96,72],[0,72]]){const p=c.gridToScreen(x,y);assert.ok(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h);}
 }
});
test('bindings reject conflicts, reserved and corrupt data; held actions release and do not accelerate diagonally',()=>{
 const s=defaultControls(),events=[],input=new InputActions(s,id=>events.push(id));
 assert.equal(bindAction(s,'rotateRight','KeyQ').ok,false);assert.equal(bindAction(s,'rotateRight','Escape').ok,false);
 assert.equal(bindAction(s,'rotateRight','KeyT').ok,true);input.press('KeyT');input.press('KeyT',true);assert.deepEqual(events,['rotateRight']);
 input.press('ArrowLeft');input.press('ArrowUp');near(Math.hypot(...Object.values(input.pan(1))),420);input.release('ArrowLeft');input.release('ArrowUp');assert.deepEqual(input.pan(1),{x:0,y:0});
 assert.deepEqual(validateControls({...s,bindings:{...s.bindings,extra:'KeyQ'}}).bindings,defaultControls().bindings);
 assert.deepEqual(validateControls({...s,bindings:{...s.bindings,rotateLeft:s.bindings.rotateRight}}).bindings,defaultControls().bindings);
 assert.equal(validateControls({...s,dragSpeed:99}).dragSpeed,1);assert.deepEqual(validateControls(s),s);
});
test('person and tree hit tests follow all orientations; camera changes never mutate saved simulation',()=>{
 const s=new Simulation(createWorld()),saved=JSON.stringify(s.snapshot()),c=new Camera(1440,900);c.home();
 const p=s.person('ana'),tree=s.world.trees.find(t=>s.isUnlocked(t.x,t.y)&&s.standing(Math.floor(t.x),Math.floor(t.y)));
 for(let view=0;view<8;view++){
  c.setView(view,{animate:false});const q=c.gridToScreen(p.x,p.y,28),hit=pickObject(c,s,q.x,q.y);assert.equal(hit.type,'person');assert.equal(hit.item.id,'ana');
  const t=c.gridToScreen(tree.x,tree.y,65),target=pickObject(c,s,t.x,t.y,{people:false});assert.equal(target.type,'tree');assert.equal(describeObject(target,s).actions[0].task,'logging');
 }
 assert.equal(JSON.stringify(s.snapshot()),saved);
});
