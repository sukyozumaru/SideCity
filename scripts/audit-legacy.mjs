import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import assert from 'node:assert/strict';

// Reproduce known defects; these checks describe the archived build, not desired behavior.
const html = readFileSync(new URL('../legacy/SideCity-previous.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const prefix = script.slice(0, script.indexOf('// 10. Sistema de partículas'));
const elements = new Map();
const getElementById = id => {
  if (!elements.has(id)) elements.set(id, { style: {}, getContext: () => ({}) });
  return elements.get(id);
};
const context = createContext({
  document: { getElementById }, window: { addEventListener() {} }, navigator: {},
  setTimeout() {}, clearTimeout() {},
});
new Script(prefix + `
function notify() {} function tone() {} function burst() {} function floatText() {}
function showPanel() {} function closePanel() {} function renderItems() {}
function updateTutorial() {} function updateUI() {}
`).runInContext(context);

const missions = new Script(`
Math.random = () => 0;
state.buildings = [0, 1, 2].map(i => ({ id: 'cabin', x: i * 100, y: GROUND, level: 1 }));
state.missions = ['homes', 'happy', 'farms'].map(id => ({ id, age: 0 }));
state.totalBuilt = 3;
const before = state.money;
checkProgress();
const afterFirst = state.money;
checkProgress();
({ firstReward: afterFirst - before, repeatedReward: state.money - afterFirst });
`).runInContext(context);
assert.equal(missions.firstReward, 180);
assert.equal(missions.repeatedReward, 180);
console.log('REPRODUCED: completed homes mission pays 180 again without new construction.');

const sandbox = new Script(`
checkProgress = () => {};
state.buildings = [];
state.sandbox = true;
state.money = 1000;
selected = 'cabin';
place(400);
const afterBuild = state.money;
contextMenu(state.buildings[0]);
$('demolish').onclick();
({ afterBuild, afterDemolition: state.money });
`).runInContext(context);
assert.equal(sandbox.afterBuild, 1000);
assert.equal(sandbox.afterDemolition, 1040);
console.log('REPRODUCED: free sandbox cabin returns 40 on demolition.');
