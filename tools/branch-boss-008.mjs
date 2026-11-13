import assert from 'node:assert/strict';
import {makeWorld,summonBoss,update} from '../src/game/world.mjs';
import {CONFIG as C} from '../src/data/config.mjs';
function setup(id){const w=makeWorld(718,id);w.debugInvincible=true;summonBoss(w);Object.assign(w.boss,{x:C.bossStopX,age:150,nextBeam:99999});return w;}
for(const id of ['routeA','routeB']){
 const w=setup(id),b=w.boss;update(w,{});
 assert.equal(b.attack,'special-warning');assert.ok(b.specialWarn>=60);assert.equal(w.bullets.count,0);
 const plan=structuredClone(b.specialShots);const gap=structuredClone(b.safeGap);const warning=b.specialWarn;
 // Moving after lock does not alter the launch geometry.
 for(let i=0;i<warning-1;i++){update(w,{down:true});assert.equal(w.bullets.count,0);}
 assert.deepEqual(b.specialShots,plan);update(w,{});
 assert.equal(b.attack,'flight');assert.equal(w.bullets.count,plan.length);
 if(id==='routeA'){assert.equal(plan.length,6);assert.ok(plan.some(s=>s.vy>0));assert.ok(plan.some(s=>s.vy<0));}
 else {assert.equal(gap.bottom-gap.top,60);assert.ok(plan.every(s=>s.y<gap.top||s.y>gap.bottom));}
 let frames=0;
 while(w.bullets.count&&frames++<400){update(w,{});assert.equal(b.specialWarn,0);assert.equal(b.volleyWarn,0);assert.equal(b.warn,0);}
 assert.ok(frames<400);update(w,{});assert.ok(b.attackRecovery>0);
 // Every branch completes with timeout; no accidental hang.
 for(let i=0;i<4000&&w.state==='play';i++)update(w,{});
 assert.equal(w.state,'clear');assert.equal(w.clearReason,'timeout');
}
const broken=setup('routeA');update(broken,{});broken.boss.wings[0]=0;
for(let i=0;i<60;i++)update(broken,{});
assert.equal(broken.bullets.count,3);
// Stage1 unchanged: it still opens with its original aimed fan.
const first=setup('stage1');update(first,{});assert.equal(first.boss.specialWarn,0);assert.ok(first.boss.volleyWarn>0);
// Lethal shots during a special warning cancel its future emission.
const dying=setup('routeB');update(dying,{});dying.boss.hp=1;dying.shots.spawn({x:238,y:dying.boss.y,vx:5,vy:0,life:10});update(dying,{});
assert.ok(dying.boss.defeated);assert.equal(dying.boss.specialWarn,0);
for(let i=0;i<170;i++)update(dying,{});
assert.equal(dying.state,'clear');assert.equal(dying.bullets.count,0);
console.log('branch-boss-008: PASS (locked warnings, distinct attacks, safe gap, exclusive volleys, wing destruction, timeout, defeat cleanup, Stage1 unchanged)');
