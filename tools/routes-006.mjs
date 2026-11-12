import assert from 'node:assert/strict';
import {makeWorld,continueRoute,summonBoss,update} from '../src/game/world.mjs';
function clear(w){summonBoss(w);Object.assign(w.boss,{x:243,y:112,hp:1,age:200,attackRecovery:100});w.debugInvincible=true;w.shots.spawn({x:238,y:112,vx:5,vy:0,life:10});update(w);for(let i=0;i<162;i++)update(w);assert.equal(w.state,'clear');}
const first=makeWorld();clear(first);assert.equal(first.routeChoices.length,2);first.player.lives=2;first.player.level=3;first.player.shield=2;first.burst=67;first.misses=1;
for(const id of ['routeA','routeB']){
 const w=continueRoute(first,id);assert.equal(w.stageNumber,2);assert.equal(w.frame,0);assert.equal(w.score,first.score);assert.equal(w.player.lives,2);assert.equal(w.player.level,3);assert.equal(w.player.shield,2);assert.equal(w.burst,67);assert.equal(w.campaignMisses,1);assert.equal(w.effects.count,0);
 w.debugInvincible=true;for(let i=0;i<3600;i++)update(w);assert.ok(w.boss);assert.equal(w.boss.hp,180);clear(w);assert.equal(w.routeChoices.length,0);assert.throws(()=>continueRoute(w,id));
}
assert.throws(()=>continueRoute(makeWorld(),'routeA'));assert.throws(()=>continueRoute(first,'bad'));
console.log('routes-006: PASS (branches, carryover, timing, full completion, invalid transition)');
