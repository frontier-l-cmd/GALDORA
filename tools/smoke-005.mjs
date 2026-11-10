import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeWorld,update,summonBoss} from '../src/game/world.mjs';
import {CONFIG as C} from '../src/data/config.mjs';
import {draw} from '../src/render/draw.mjs';
let frames=0,rendered=0;
const names=['player-level','player-up','player-down','enemy-drone','boss-body','boss-wing','bg-far','bg-near','item-shot','item-shield'];
const assets=Object.fromEntries(names.map(name=>{const data=fs.readFileSync(`assets/${name}.png`);assert.equal(data.toString('ascii',1,4),'PNG');return [name,{complete:true,naturalWidth:data.readUInt32BE(16),naturalHeight:data.readUInt32BE(20)}];}));
let color,depth=0,calls=0;
const ctx={set imageSmoothingEnabled(v){assert.equal(v,false)},set fillStyle(v){assert.match(v,/^#[0-9a-f]{6}$/i);color=v},fillRect(...args){assert.ok(args.every(Number.isFinite));assert.ok(color);calls++},drawImage(img,...args){assert.ok(img.naturalWidth);assert.ok(args.every(Number.isFinite));calls++},save(){depth++},restore(){assert.ok(depth>0);depth--},translate(...args){assert.ok(args.every(Number.isFinite))},rotate(v){assert.ok(Number.isFinite(v))},scale(...args){assert.ok(args.every(Number.isFinite))}};
function render(w){draw(ctx,w,assets,{demo:true});assert.equal(depth,0);rendered++}
function run(seed){
 const w=makeWorld(seed);w.debugInvincible=true;let clearEvents=0,deathEvents=0;
 for(let i=0;i<18000&&w.state==='play';i++){
  const target=w.boss?w.boss.y:112+Math.sin(w.frame*.012)*58;
  update(w,{fire:true,burst:true,up:w.player.y>target+1,down:w.player.y<target-1});frames++;
  if(w.boss&&!w.boss.defeated){w.player.level=3;w.player.shield=3;}
  for(const name of ['enemies','obstacles','items','shots','bullets','effects']){const p=w[name];assert.ok(p.count<=p.limit);p.each(o=>{assert.ok(Number.isFinite(o.x));assert.ok(Number.isFinite(o.y))})}
  assert.ok(w.player.x>=C.playerBounds.left&&w.player.x<=C.playerBounds.right);assert.ok(w.player.y>=C.playerBounds.top&&w.player.y<=C.playerBounds.bottom);
  clearEvents+=w.events.filter(e=>e==='clear').length;deathEvents+=w.events.filter(e=>e==='boss-defeat').length;
  if(i%120===0||w.boss?.defeated)render(w);
 }
 assert.equal(w.state,'clear');assert.equal(w.clearReason,'destroyed');assert.equal(clearEvents,1);assert.equal(deathEvents,1);assert.equal(w.boss.bodyVisible,false);assert.equal(w.boss.fragments.length,0);assert.equal(w.boss.explosions.length,0);
 const score=w.score,frame=w.frame;update(w,{fire:true,burst:true});assert.equal(w.score,score);assert.equal(w.frame,frame);
 return {seed,frame,seconds:frame/60,score,misses:w.misses,defeatAge:w.boss.defeatAge};
}
const one=run(718),repeat=run(718);assert.deepEqual(one,repeat);const other=run(123);
for(const frame of [0,32,70,110,145,162]){const w=makeWorld();summonBoss(w);w.boss.x=243;w.boss.y=112;w.boss.hp=1;w.shots.spawn({x:230,y:112,vx:5,vy:0,life:30});update(w);for(let i=0;i<frame;i++)update(w);render(w);assert.equal(w.state,frame===162?'clear':'play')}
console.log(JSON.stringify({status:'PASS',kind:'simulation/renderer regression, not manual play',simulationFrames:frames,renderedFrames:rendered,drawCalls:calls,runs:[one,other],assets:names.length},null,2));
