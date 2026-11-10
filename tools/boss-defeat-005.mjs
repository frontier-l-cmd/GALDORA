import assert from 'node:assert/strict';
import {makeWorld,summonBoss,update} from '../src/game/world.mjs';
import {CONFIG as C} from '../src/data/config.mjs';
let cases=0,frames=0;
const tick=(w,input={})=>{update(w,input);frames++;};
function ready(seed=718){
 const w=makeWorld(seed);summonBoss(w);Object.assign(w.boss,{x:C.bossStopX,y:112,hp:1,age:200,attackRecovery:100});
 w.player.invul=0;w.events=[];return w;
}
function lethal(w,count=1){
 for(let i=0;i<count;i++)w.shots.spawn({x:w.boss.x-5,y:w.boss.y,vx:5,vy:0,life:10});
 tick(w);assert.equal(w.boss.defeated,true);return w;
}
function test(name,fn){fn();cases++;console.log(`PASS ${name}`);}

test('lethal multi-shot starts a single nonterminal sequence without early bonus',()=>{
 const w=ready();w.score=123;lethal(w,30);
 assert.equal(w.state,'play');assert.equal(w.clearReason,null);assert.equal(w.score,123);
 assert.equal(w.boss.hp,0);assert.equal(w.boss.defeatAge,0);
 assert.equal(w.events.filter(e=>e==='boss-defeat').length,1);
 assert.equal(w.events.includes('clear'),false);assert.equal(w.shots.count,0);
});
test('162-frame sequence has six small blasts, two breaks and one final burst/clear',()=>{
 const w=lethal(ready());const events=[...w.events];const bonus=w.boss.defeatBonus;
 for(let a=1;a<=C.bossDefeat.duration;a++){
  tick(w);events.push(...w.events);
  assert.equal(w.boss.defeatAge,a);
  assert.equal(w.boss.bodyVisible,a<C.bossDefeat.burstFrame);
  assert.equal(w.state,a===C.bossDefeat.duration?'clear':'play');
  if(a<C.bossDefeat.duration)assert.equal(w.score,0);
  assert.ok(w.boss.fragments.length<=C.bossDefeat.fragmentLimit);
  assert.ok(w.effects.count<=C.effectLimit);
 }
 for(const [type,n] of [['boss-defeat',1],['boss-explosion',6],['boss-break',2],['boss-final',1],['clear',1]])assert.equal(events.filter(e=>e===type).length,n,type);
 assert.equal(w.score,bonus+C.noMissBonus);assert.equal(w.clearReason,'destroyed');
 assert.equal(w.boss.fragments.length,0);assert.equal(w.effects.count,0);assert.equal(w.boss.explosions.length,0);
 const before=JSON.stringify(w);for(let i=0;i<10;i++)tick(w);assert.equal(JSON.stringify(w),before);
});
test('lethal clears hazards and prevents all subsequent damage, actions and item rewards',()=>{
 const w=ready();w.burst=C.burstCapacity;
 // Far-away hazards survive the pre-shot update but are removed on lethal.
 w.bullets.spawn({x:w.player.x,y:w.player.y,vx:0,vy:0,life:10});
 w.obstacles.spawn({x:300,y:30,baseY:30,age:0,rotation:0,warn:50,hitFlash:0});
 w.enemies.spawn({kind:'straight',state:'cruise',x:300,y:30,baseY:30,age:0,speed:0,nextShot:99,hitW:22,hitH:16,hp:2,hitFlash:0});
 w.items.spawn({kind:'shot',x:w.player.x,y:w.player.y,age:0,life:50});
 lethal(w);assert.equal(w.player.lives,C.playerLives);assert.equal(w.misses,0);
 for(const key of ['enemies','obstacles','bullets','shots','items'])assert.equal(w[key].count,0,key);
 const timeline=w.timeline.frame,player={...w.player};
 for(let i=0;i<100;i++)tick(w,{fire:true,burst:true,right:true,axisY:1});
 assert.deepEqual(w.player,player);assert.equal(w.timeline.frame,timeline);assert.equal(w.burst,C.burstCapacity);assert.equal(w.score,0);
});
test('bonus uses lethal age and no-miss eligibility, not animation length',()=>{
 const w=ready();w.misses=1;w.score=444;lethal(w);
 const bonus=C.bossScore+Math.max(0,C.bossSpeedBonus-Math.floor(w.boss.age/C.bossBonusDivisor));
 for(let i=0;i<C.bossDefeat.duration;i++)tick(w);
 assert.equal(w.clearBonus,bonus);assert.equal(w.score,444+bonus);
});
test('timeout retreat stays separate and cannot be shot for kill bonus',()=>{
 const w=ready();w.boss.age=C.bossTimeout-1;w.boss.x=C.bossRetreatX-1;
 w.shots.spawn({x:w.boss.x,y:w.boss.y,vx:0,life:10});tick(w);
 assert.equal(w.state,'clear');assert.equal(w.clearReason,'timeout');assert.equal(w.boss.defeated,false);
 assert.equal(w.clearBonus,C.noMissBonus);assert.equal(w.events.includes('boss-defeat'),false);
});
test('already destroyed wings never reappear or earn a second score',()=>{
 const w=ready();w.boss.wings=[0,0];lethal(w);
 const events=[];for(let i=0;i<107;i++){tick(w);events.push(...w.events);assert.equal(w.boss.fragments.length,0);}
 assert.equal(events.includes('boss-break'),false);assert.equal(w.score,0);
});
test('seeded simulation and pool ceilings stay deterministic at every death frame',()=>{
 const a=lethal(ready(12)),b=lethal(ready(12));
 for(let i=0;i<162;i++){
  tick(a);tick(b);assert.deepEqual(a.boss,b.boss);assert.deepEqual(a.effects.items,b.effects.items);
  assert.ok(a.effects.highWater<=C.effectLimit);
  for(const f of a.boss.fragments)for(const k of ['x','y','vx','vy','rotation'])assert.ok(Number.isFinite(f[k]));
 }
});
test('pause has no wall clock timers; state pause and resumed fixed steps preserve age',()=>{
 const w=lethal(ready());for(let i=0;i<70;i++)tick(w);
 w.state='paused';const before=JSON.stringify(w);for(let i=0;i<600;i++)tick(w);assert.equal(JSON.stringify(w),before);
 w.state='play';tick(w);assert.equal(w.boss.defeatAge,71);assert.equal(w.state,'play');
});
test('restart constructs a fresh world with no carried death effects or reward',()=>{
 const old=lethal(ready());for(let i=0;i<115;i++)tick(old);
 const w=makeWorld();assert.equal(w.state,'play');assert.equal(w.boss,null);assert.equal(w.score,0);assert.equal(w.effects.count,0);
 summonBoss(w);assert.equal(w.boss.defeated,false);assert.equal(w.boss.hp,180);assert.equal(w.boss.defeatAge,undefined);
});
test('approved stage and movement tuning unchanged',()=>{
 assert.equal(C.bossHealth,180);assert.equal(C.bossArrival,5400);assert.equal(C.touchPlayerSpeed,2.6);
 assert.deepEqual(C.bossShotCounts,[0,3,3,5]);assert.deepEqual(C.bossShotSpeeds,[0,1.25,1.35,1.5]);
 assert.equal(C.beamWarning,90);assert.equal(C.beamDuration,36);
});
console.log(`Boss defeat Build005: ${cases} cases, ${frames} fixed steps passed.`);
