import assert from 'node:assert/strict';
import {makeWorld,update} from '../src/game/world.mjs';
import {Pool} from '../src/core/pool.mjs';
import {createPresentation,BACKING_SCALE,STEP_SECONDS} from '../src/render/presentation.mjs';
import {draw} from '../src/render/draw.mjs';
const p=createPresentation(),w=makeWorld();
p.reset(w);p.beforeStep(w);w.frame++;w.player.x+=2.6;
assert.ok(Math.abs(p.sample(w,.5).player.x-(w.player.x-1.3))<1e-10);
const state=JSON.stringify(w);for(let i=0;i<20;i++)p.sample(w,i/20);assert.equal(JSON.stringify(w),state,'presentation must not mutate any simulation field');
assert.ok(Math.abs(p.sample(w,-1).player.x-(w.player.x-2.6))<1e-10);assert.equal(p.sample(w,2).player.x,w.player.x);
p.reset(w);assert.equal(p.sample(w,0).player.x,w.player.x,'pause/start resets snap');
p.beforeStep(w);w.frame++;w.player.x+=100;assert.equal(p.sample(w,.2).player.x,w.player.x,'teleports snap');
p.beforeStep(w);w.frame+=100;assert.equal(p.sample(w,.2).frame,w.frame,'summon/frame jumps snap');
const pool=new Pool(1);w.shots=pool;p.reset(w);const first=pool.spawn({x:5,y:5});p.beforeStep(w);first.active=false;
const second=pool.spawn({x:10,y:5});assert.equal(first,second);w.frame++;
let rendered;p.sample(w,0).shots.each(x=>rendered=x.x);assert.equal(rendered,10,'reuse even near previous position must snap');
p.beforeStep(w);second.x+=6;w.frame++;p.sample(w,.5).shots.each(x=>rendered=x.x);assert.equal(rendered,13);
const capacity=Object.values(w).filter(x=>x instanceof Pool).reduce((n,x)=>n+x.limit,0)+2;
for(let i=0;i<2000;i++){p.beforeStep(w);pool.clear();pool.spawn({x:10,y:10});w.frame++;p.sample(w,.3).shots.each(()=>{});}
assert.ok(p.retainedCount<=capacity,'fixed pools bound retained pose storage');
// Detached parts interpolate, but replacement parts never use stale histories.
w.boss={x:240,y:112,age:0,defeatAge:0,rotation:0,fragments:[{x:240,y:100,age:0,rotation:0}]};
p.reset(w);p.beforeStep(w);w.frame++;w.boss.fragments[0].x+=4;w.boss.fragments[0].age++;w.boss.fragments[0].rotation=.1;
assert.equal(p.sample(w,.5).boss.fragments[0].x,242);assert.equal(p.sample(w,.5).boss.fragments[0].rotation,.05);
p.beforeStep(w);w.frame++;w.boss.rotation=-Math.PI-.01;assert.equal(p.sample(w,.5).boss.rotation,w.boss.rotation,'angle discontinuities snap instead of spinning across the wrap');
for(let i=0;i<1000;i++){p.beforeStep(w);w.boss.fragments=[{x:240,y:100,age:0,rotation:0}];w.frame++;assert.equal(p.sample(w,0).boss.fragments[0].x,240);}
assert.ok(p.retainedCount<=capacity+2,'discarded fragments do not accumulate');
// Identical tick-based input gives identical world state at every display cadence.
const results=[];
for(const hz of [30,60,90,120,144]){
 const world=makeWorld(718),presentation=createPresentation();world.debugInvincible=true;
 let acc=0;const positions=[];presentation.reset(world);
 for(let frame=0;frame<hz*3;frame++){
  acc+=1/hz;
  while(acc+1e-9>=STEP_SECONDS){presentation.beforeStep(world);update(world,{right:world.frame<20,down:world.frame<15,fire:true});acc=Math.max(0,acc-STEP_SECONDS);}
  const view=presentation.sample(world,acc/STEP_SECONDS);positions.push(view.player.x);
 }
 assert.equal(world.frame,180);results.push(JSON.stringify(world));
 if(hz>60)assert.ok(positions.slice(0,hz/4).some(x=>Math.abs(x-Math.round(x))>.01),'high refresh gets fractional poses');
}
for(const result of results)assert.equal(result,results[0]);
// Renderer must preserve fractional actor positions in the 2x backing raster.
const world=makeWorld();world.player.x=70.5;world.player.y=112.5;
const calls=[];const ctx=new Proxy({fillRect(...args){calls.push(args);},drawImage(...args){calls.push(args);}}, {get(t,k){return k in t?t[k]:(()=>{});},set(t,k,v){t[k]=v;return true;}});
draw(ctx,world,{});
assert.ok(calls.some(args=>args.slice(0,2).some(x=>typeof x==='number'&&x%1!==0)),'fractional actor draws must survive renderer');
assert.equal(BACKING_SCALE,2);assert.equal(320*BACKING_SCALE*224*BACKING_SCALE,286720,'backing bounded independently of phone DPR');
console.log('motion-005: PASS (30/60/90/120/144Hz deterministic physics; fractional drawing; resets, teleport, pool reuse, bounded histories)');
