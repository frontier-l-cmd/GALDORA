import {CONFIG as C} from '../data/config.mjs';
import {Pool,rng} from '../core/pool.mjs';
import {TimelineRunner} from './timeline.mjs';
import {aimed,fan} from './patterns.mjs';
import {STAGES,ROUTE_CHOICES} from '../data/stages.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
const overlaps=(x,y,cx,cy,w,h,pad=0)=>Math.abs(x-cx)<=w/2+pad&&Math.abs(y-cy)<=h/2+pad;

export function makeWorld(seed=718,stageId='stage1'){
 const stage=STAGES[stageId];
 if(!stage)throw new Error('Unknown stage: '+stageId);
 return {
  stage,stageId,stageNumber:stage.number,routeChoices:[],campaignMisses:0,
  frame:0,timeline:new TimelineRunner(stage.timeline),state:'play',section:stage.timeline[0].name,warningTicks:0,
  clearReason:null,clearBonus:0,seed,random:rng(seed),score:0,chain:0,chainAt:-C.chainWindow-1,kills:0,misses:0,
  burst:C.burstStart,burstTicks:0,
  player:{...C.playerStart,bank:0,lives:C.playerLives,invul:C.startInvulnerability,cooldown:0,level:1,shield:0},
  enemies:new Pool(C.enemyLimit),shots:new Pool(C.playerBulletLimit),bullets:new Pool(C.enemyBulletLimit),
  obstacles:new Pool(C.obstacleLimit),effects:new Pool(C.effectLimit),items:new Pool(C.itemLimit),boss:null,events:[],debugInvincible:false
 };
}

// A fresh world prevents timeline/pool leakage between routes. Only durable run
// progress crosses the checkpoint; health and equipment are never replenished.
export function continueRoute(previous,routeId){
 if(previous.stageId!=='stage1'||previous.state!=='clear'||!ROUTE_CHOICES.some(r=>r.id===routeId))
  throw new Error('Route selection requires a completed first stage');
 const next=makeWorld(previous.seed,routeId);
 for(const key of ['lives','level','shield'])next.player[key]=previous.player[key];
 next.score=previous.score;next.burst=previous.burst;
 next.campaignMisses=(previous.campaignMisses||0)+previous.misses;
 next.debugInvincible=previous.debugInvincible;
 return next;
}

function fx(w,x,y,color,n=C.fx.killCount){
 for(let i=0;i<n;i++){
  const a=w.random()*Math.PI*2,s=C.fx.speedMin+w.random()*C.fx.speedRange;
  w.effects.spawn({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:C.fx.lifeMin+Math.floor(w.random()*C.fx.lifeRange),color});
 }
}

function kill(w,e){
 if(!e.active)return;
 e.active=false;w.kills++;
 w.chain=w.frame-w.chainAt<C.chainWindow?Math.min(w.chain+1,C.chainMax):1;
 w.chainAt=w.frame;w.score+=(C.enemyTypes[e.kind]?.score??C.enemyTypes.wave.score)*w.chain;
 w.burst=Math.min(C.burstCapacity,w.burst+C.killBurstGain);
 if(e.kind==='carrier'){
  const y=clamp(e.y,C.playerBounds.top,C.playerBounds.bottom);
  w.items.spawn({kind:e.itemKind,x:Math.min(e.x,C.width-C.item.radius),y,baseY:y,age:0,life:C.item.life,radius:C.item.radius});
 }
 fx(w,e.x,e.y,C.colors.explosion);w.events.push('kill');
}

function hit(w){
 const p=w.player;
 if(w.state!=='play'||w.boss?.defeated||p.invul>0||w.debugInvincible)return;
 if(p.shield>0){
  p.shield--;p.invul=C.shieldInvulnerability;
  fx(w,p.x,p.y,C.colors.shield,C.fx.shieldCount);w.events.push('shield');return;
 }
 p.lives--;p.invul=C.invulnerability;p.level=Math.max(1,p.level-1);
 w.misses++;w.chain=0;w.bullets.clear();
 fx(w,p.x,p.y,C.colors.hit,C.fx.missCount);w.events.push('hit');
 if(p.lives<=0)w.state='over';
}

export function summonBoss(w){
 if(w.boss||w.state!=='play')return;
 w.enemies.clear();w.obstacles.clear();w.bullets.clear();w.frame=Math.max(w.frame,w.stage.bossArrival);
 w.section=w.stage.bossName;w.warningTicks=0;
 w.boss={...C.bossStart,hp:C.bossHealth,age:0,phase:1,wings:[C.wingHealth,C.wingHealth],
  start:w.frame,escape:false,defeated:false,warn:0,beamY:C.bossStart.y,beamTicks:0,
  beamHalfHeight:C.beamHalfHeight,beamX:C.bossStart.x+C.bossMuzzleX,nextBeam:C.beamFirstAge,
  hitFlash:0,wingFlash:[0,0],attack:'entry',attackRecovery:0,nextVolley:0,
  specialWarn:0,specialShots:[],safeGap:null,specialLabel:'',
  volleyWarn:0,volleyAngle:Math.PI,volleyX:C.bossStart.x+C.bossMuzzleX,volleyY:C.bossStart.y,
  volleyCount:C.bossShotCounts[1],volleySpeed:C.bossShotSpeeds[1],wingWarn:0,wingLanes:[]};
 w.events.push('boss');
}

function spawnEnemy(w,event){
 const entry=event.entry,kind=event.kind==='carrier'?'carrier':entry.kind??'wave',data=C.enemyTypes[kind];
 if(!data)return;
 const y=entry.y+event.index*(entry.yStep??0);
 // Set every behavior field: Pool.spawn reuses objects rather than replacing them.
 w.enemies.spawn({kind,state:kind==='wave'||kind==='straight'?'cruise':'enter',
  x:C.enemySpawnX,y,baseY:y,age:0,hp:data.hp,speed:entry.speed??data.speed,
  w:data.w,h:data.h,hitW:data.hitW,hitH:data.hitH,variant:event.index%2,
  warn:0,targetX:0,targetY:0,vx:0,vy:0,holdAge:0,nextShot:data.firstShot??0,
  itemKind:entry.item??'shot',hitFlash:0});
}

function spawnWreckage(w,event){
 const d=C.obstacle;
 for(const [i,baseY] of event.entry.lanes.entries())w.obstacles.spawn({kind:'wreck',
  x:d.x,y:baseY,baseY,w:d.w,h:d.h,hitW:d.hitW,hitH:d.hitH,
  hp:d.hp,maxHp:d.hp,warn:d.warning,age:0,rotation:i*.7,hitFlash:0,variant:i%2});
 w.events.push('wreck-warning');
}

function updateObstacle(w,o){
 // Preserve a full 90-frame readable cue, including the spawning frame.
 o.age++;o.hitFlash=Math.max(0,o.hitFlash-1);
 if(o.warn>0){if(o.age>1)o.warn--;return;}
 o.x-=C.obstacle.speed;
 o.y=o.baseY+Math.sin((o.age-C.obstacle.warning)*C.obstacle.frequency)*C.obstacle.amplitude;
 o.rotation+=.009;
 if(o.x<C.obstacle.cullX){o.active=false;return;}
 if(overlaps(w.player.x,w.player.y,o.x,o.y,o.hitW,o.hitH,C.playerHitRadius))hit(w);
}

function destroyObstacle(w,o){
 if(!o.active)return;
 o.active=false;w.score+=C.obstacle.score;
 // Wreckage is a small fixed reward, never a farmable enemy chain or item drop.
 fx(w,o.x,o.y,C.colors.explosion);w.events.push('wreck-destroyed');
}

function updateEnemy(w,e){
 const data=C.enemyTypes[e.kind],p=w.player;
 e.age++;e.hitFlash=Math.max(0,e.hitFlash-1);
 if(e.state==='cruise'){
  e.x-=e.speed;
  if(e.kind==='wave')e.y=e.baseY+Math.sin(e.age*data.frequency)*data.amplitude;
  if(e.age>=e.nextShot&&e.x<C.width&&e.x>p.x){
   aimed(w.bullets,{x:e.x-e.hitW/2,y:e.y,tx:p.x,ty:p.y,speed:data.shotSpeed});
   e.nextShot+=data.shotInterval;
  }
 }else if(e.state==='enter'){
  e.x=Math.max(data.stopX,e.x-e.speed);
  if(e.x===data.stopX){
   if(e.kind==='rush'){
    e.state='windup';e.warn=data.windup;e.targetX=p.x;e.targetY=p.y;
   }else{e.state='hold';e.holdAge=0;}
  }
 }else if(e.state==='windup'){
  e.warn--;
  if(e.warn<=0){
   const a=Math.atan2(e.targetY-e.y,e.targetX-e.x);
   e.vx=Math.cos(a)*data.dashSpeed;e.vy=Math.sin(a)*data.dashSpeed;e.state='dash';
  }
 }else if(e.state==='dash'){
  e.x+=e.vx;e.y+=e.vy;
 }else if(e.state==='hold'){
  e.holdAge++;
  const until=e.nextShot-e.holdAge;
  e.warn=until>0&&until<=data.windup?until:0;
  if(e.holdAge>=e.nextShot){
   fan(w.bullets,{x:e.x-e.hitW/2,y:e.y,angle:Math.atan2(p.y-e.y,p.x-e.x),
    count:data.fanCount,step:data.fanStep,speed:data.shotSpeed});
   e.nextShot+=data.shotInterval;
  }
  if(e.holdAge>=data.hold){e.state='exit';e.warn=0;}
 }else if(e.state==='exit')e.x-=data.exitSpeed;
 if(e.x<C.enemyCullX||e.x>C.enemySpawnX+C.enemyTypes.carrier.w||e.y<C.enemyCullY||e.y>C.enemyMaxY){e.active=false;return;}
 if(overlaps(p.x,p.y,e.x,e.y,e.hitW,e.hitH,C.playerHitRadius))hit(w);
}

function finishStage(w,reason,bossBonus=0){
 if(w.state!=='play')return;
 w.clearReason=reason;w.clearBonus=bossBonus+(w.misses===0?C.noMissBonus:0);
 w.score+=w.clearBonus;w.state='clear';w.routeChoices=w.stageId==='stage1'?ROUTE_CHOICES:[];w.bullets.clear();w.events.push('clear');
}

// Death runs in the fixed-step simulation, never in rendering or wall-clock time.
// Keep `play` until all debris has cleared so pause and record saving stay natural.
function beginBossDefeat(w,b){
 if(b.defeated)return;
 b.defeated=true;b.specialWarn=0;b.specialShots=[];b.safeGap=null;b.defeatAge=0;b.defeatStage='collapse';b.bodyVisible=true;
 b.defeatX=b.x;b.defeatY=b.y;b.rotation=0;b.shake=0;b.defeatFlash=0;
 b.fragments=[];b.explosions=[];
 b.defeatBonus=C.bossScore+Math.max(0,C.bossSpeedBonus-Math.floor(b.age/C.bossBonusDivisor));
 b.warn=0;b.beamTicks=0;b.volleyWarn=0;b.wingWarn=0;b.wingLanes=[];
 b.attackRecovery=0;b.attack='defeated';b.hitFlash=0;b.wingFlash=[0,0];
 w.bullets.clear();w.enemies.clear();w.obstacles.clear();w.shots.clear();w.items.clear();
 w.burstTicks=0;w.warningTicks=0;w.events.push('boss-defeat');
}

function defeatExplosion(w,b,x,y,final=false){
 b.explosions.push({x,y,age:0,life:final?40:23,radius:final?48:13,final});
 fx(w,x,y,C.colors.explosion,final?C.fx.bossCount:12);
 b.defeatFlash=final?1:.42;
 w.events.push(final?'boss-final':'boss-explosion');
}

function addFragment(b,fragment){
 if(b.fragments.length<C.bossDefeat.fragmentLimit)b.fragments.push({life:80,...fragment,age:0});
}

function updateBossDefeat(w){
 const b=w.boss,d=C.bossDefeat,a=++b.defeatAge;
 b.defeatFlash=Math.max(0,b.defeatFlash-.075);
 b.explosions=b.explosions.filter(e=>++e.age<e.life);
 b.fragments=b.fragments.filter(f=>{
  f.age++;f.x+=f.vx;f.y+=f.vy;f.vy+=.025;f.rotation+=f.spin;
  return f.age<f.life;
 });
 b.defeatStage=a<d.breakFrames[0]?'collapse':a<d.burstFrame?'breakup':a<d.aftermathFrame?'burst':'aftermath';
 b.shake=a<d.burstFrame?d.shake*(.4+.6*a/d.burstFrame):0;
 if(b.bodyVisible){
  b.x=b.defeatX-a*.035;b.y=b.defeatY+Math.min(19,a*a*.0017);
  b.rotation=Math.min(.16,a*.0015);
 }
 if(d.explosionFrames.includes(a)){
  const i=d.explosionFrames.indexOf(a);
  // Authored local positions remain stable across render rates and RNG seeds.
  const offsets=[[-23,-10],[21,18],[8,-20],[-28,12],[25,-8],[-5,8]];
  defeatExplosion(w,b,b.x+offsets[i][0],b.y+offsets[i][1]);
 }
 for(let side=0;side<2;side++)if(a===d.breakFrames[side]&&b.wings[side]>0){
  const sign=side?1:-1;
  addFragment(b,{kind:'wing',side,x:b.x+C.wingOffset.x,y:b.y+sign*C.wingOffset.y,
   vx:.55,vy:sign*.55,rotation:b.rotation,spin:sign*.025});
  b.wings[side]=0;w.events.push('boss-break');
 }
 if(a===d.burstFrame){
  b.bodyVisible=false;b.shake=0;
  defeatExplosion(w,b,b.x,b.y,true);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   addFragment(b,{kind:'plate',side:i%2,x:b.x+Math.cos(angle)*12,y:b.y+Math.sin(angle)*9,
    vx:Math.cos(angle)*1.2,vy:Math.sin(angle)*.9,rotation:angle,spin:(i%2?1:-1)*.035,life:42});
  }
 }
 if(a>=d.duration){
  b.fragments=[];b.explosions=[];b.defeatFlash=0;w.effects.clear();
  finishStage(w,'destroyed',b.defeatBonus);
 }
}

function updateEffects(w){
 w.effects.each(e=>{e.x+=e.vx;e.y+=e.vy;e.life--;if(e.life<=0)e.active=false;});
}

function recoverBoss(b){
 b.attack='recovery';b.attackRecovery=C.bossAttackRecovery;
}

function beginBranchAttack(w,b,p){
 const kind=w.stage.theme,d=C.branchBoss[kind];
 b.specialShots=[];b.safeGap=null;
 if(kind==='amber'){
  b.specialLabel='CROSSWIND / MOVE';
  // Both emitters lock now, not at fire time. Broken wings stop emitting.
  for(let wing=0;wing<2;wing++)if(b.wings[wing]>0){
   const x=b.x+C.wingOffset.x,y=b.y+(wing?C.wingOffset.y:-C.wingOffset.y);
   const angle=Math.atan2(p.y-y,p.x-x);
   for(let i=0;i<d.count;i++){
    const a=angle+(i-(d.count-1)/2)*d.step;
    b.specialShots.push({wing,x,y,vx:Math.cos(a)*d.speed,vy:Math.sin(a)*d.speed,life:d.life});
   }
  }
 }else{
  b.specialLabel='GATE / SAFE LANE';
  const center=d.gapCenters[b.nextVolley%d.gapCenters.length];
  b.safeGap={top:center-d.gapHalfHeight,bottom:center+d.gapHalfHeight};
  for(let y=d.top;y<=d.bottom;y+=d.laneStep){
   if(y>=b.safeGap.top&&y<=b.safeGap.bottom)continue;
   b.specialShots.push({wing:-1,x:d.originX,y,vx:-d.speed,vy:0,life:d.life});
  }
 }
 b.specialWarn=d.warning;b.attack='special-warning';w.events.push('charge');
}

function updateBossAttack(w,b,p){
 if(b.specialWarn>0){
  if(--b.specialWarn===0){
   for(const shot of b.specialShots)if(shot.wing<0||b.wings[shot.wing]>0)w.bullets.spawn({...shot});
   b.attack='flight';w.events.push('volley');
  }
  return;
 }
 // Attacks are mutually exclusive, including the lifetime of their bullets.
 // The recovery clock starts only once the playfield is empty, so there is a
 // real, learnable breathing window instead of a nominal pause between walls.
 if(b.beamTicks>0){
  b.beamTicks--;
  if(!b.beamTicks)recoverBoss(b);
  return;
 }
 if(b.warn>0){
  b.warn--;
  if(!b.warn){b.attack='beam';b.beamTicks=C.beamDuration;w.events.push('beam');}
  return;
 }
 if(b.volleyWarn>0){
  b.volleyWarn--;
  if(!b.volleyWarn){
   fan(w.bullets,{x:b.volleyX,y:b.volleyY,angle:b.volleyAngle,
    count:b.volleyCount,step:C.bossFanStep,speed:b.volleySpeed});
   b.attack='flight';w.events.push('volley');
  }
  return;
 }
 if(b.wingWarn>0){
  b.wingWarn--;
  if(!b.wingWarn){
   for(const lane of b.wingLanes)if(b.wings[lane.wing]>0){
    // Fixed horizontal lanes are deliberately separate from aimed core fire.
    aimed(w.bullets,{x:lane.x,y:lane.y,tx:lane.x-1,ty:lane.y,speed:C.wingShotSpeed});
   }
   b.attack='flight';w.events.push('volley');
  }
  return;
 }
 if(b.attack==='flight'){
  if(w.bullets.count===0)recoverBoss(b);
  return;
 }
 if(b.attackRecovery>0){b.attackRecovery--;return;}
 if(b.x>C.bossStopX)return;
 if(b.age>=b.nextBeam){
  // Also remove any stray pre-boss/debug bullets before the escape-lane cue.
  w.bullets.clear();b.attack='beam-warning';b.warn=C.beamWarning;
  b.beamY=clamp(p.y,C.playerBounds.top,C.playerBounds.bottom);
  b.nextBeam=b.age+C.beamIntervals[b.phase];w.events.push('charge');
  return;
 }
 if(w.stageNumber===2&&b.nextVolley%2===0){
  b.nextVolley++;beginBranchAttack(w,b,p);return;
 }
 const useWings=b.nextVolley++%2===1&&b.wings.some(hp=>hp>0);
 if(useWings){
  b.attack='wing-warning';b.wingWarn=C.bossWingWarning;
  b.wingLanes=b.wings.flatMap((hp,i)=>hp>0?[{wing:i,x:b.x+C.wingOffset.x,y:b.y+(i?C.wingOffset.y:-C.wingOffset.y)}]:[]);
 }else{
  b.attack='volley-warning';b.volleyWarn=C.bossVolleyWarning;
  b.volleyX=b.beamX;b.volleyY=b.y;
  b.volleyAngle=Math.atan2(p.y-b.volleyY,p.x-b.volleyX);
  b.volleyCount=C.bossShotCounts[b.phase];b.volleySpeed=C.bossShotSpeeds[b.phase];
 }
}

function updateBoss(w){
 const b=w.boss,p=w.player;
 if(b.defeated)return;
 b.age++;b.hitFlash=Math.max(0,b.hitFlash-1);
 b.wingFlash=b.wingFlash.map(value=>Math.max(0,value-1));
 b.phase=b.hp>C.bossHealth*C.bossPhaseThresholds[0]?1:b.hp>C.bossHealth*C.bossPhaseThresholds[1]?2:3;
 // Retreat is a separate movement state. Clamping x to the entry point here
 // would otherwise prevent the boss ever reaching its exit boundary.
 if(b.age>=C.bossTimeout||b.escape){
  b.escape=true;b.specialWarn=0;b.specialShots=[];b.safeGap=null;b.warn=0;b.beamTicks=0;b.volleyWarn=0;b.wingWarn=0;
  b.attack='escape';b.attackRecovery=0;w.bullets.clear();b.x+=C.bossRetreatSpeed;
  if(b.x>C.bossRetreatX)finishStage(w,'timeout');
  return;
 }
 b.x=Math.max(C.bossStopX,b.x-C.bossEnterSpeed);
 // Hold the muzzle still while its telegraph is displayed. The preview and
 // actual projectile use the same locked origin, angle, count and speed.
 const targetY=b.warn||b.beamTicks?b.beamY:
  b.volleyWarn||b.wingWarn||b.specialWarn?b.y:C.bossStart.y+Math.sin(b.age*C.bossSwayFrequency)*C.bossSwayAmplitude;
 b.y+=clamp(targetY-b.y,-C.bossAlignSpeed,C.bossAlignSpeed);
 b.beamX=b.x+C.bossMuzzleX;
 updateBossAttack(w,b,p);
 if(b.beamTicks>0&&p.x<=b.beamX&&Math.abs(p.y-b.beamY)<=b.beamHalfHeight+C.playerHitRadius)hit(w);
 if(overlaps(p.x,p.y,b.x,b.y,C.bossHitW,C.bossHitH,C.playerHitRadius))hit(w);
 for(let i=0;i<2;i++)if(b.wings[i]>0&&overlaps(p.x,p.y,b.x+C.wingOffset.x,b.y+(i?C.wingOffset.y:-C.wingOffset.y),C.wingHitW,C.wingHitH,C.playerHitRadius))hit(w);
}

function updateShot(w,s){
 // Other shots in the same Pool.each must not award another boss kill.
 if(w.state!=='play'||w.boss?.defeated)return;
 s.x+=s.vx;s.y+=s.vy??0;s.life--;
 if(s.x>C.shotCullX||s.y<C.shotCullY.top||s.y>C.shotCullY.bottom||s.life<0){s.active=false;return;}
 const damage=w.burstTicks?C.burstDamageMultiplier:1;
 w.enemies.each(e=>{
  if(!s.active||!overlaps(s.x,s.y,e.x,e.y,e.hitW,e.hitH))return;
  s.active=false;e.hp-=damage;e.hitFlash=C.hitFlash;
  if(e.hp<=0)kill(w,e);
 });
 w.obstacles.each(o=>{
  if(!s.active||o.warn>0||!overlaps(s.x,s.y,o.x,o.y,o.hitW,o.hitH))return;
  s.active=false;o.hp-=damage;o.hitFlash=C.hitFlash;
  if(o.hp<=0)destroyObstacle(w,o);
 });
 const b=w.boss;
 if(!s.active||!b||b.escape||b.defeated)return;
 let struck=false;
 for(let i=0;i<2;i++){
  const wingY=b.y+(i?C.wingOffset.y:-C.wingOffset.y);
  if(b.wings[i]<=0||!overlaps(s.x,s.y,b.x+C.wingOffset.x,wingY,C.wingHitW,C.wingHitH))continue;
  b.wings[i]=Math.max(0,b.wings[i]-damage);b.wingFlash[i]=C.hitFlash;struck=true;
  if(b.wings[i]===0){w.score+=C.wingScore;fx(w,b.x,wingY,C.colors.explosion,C.fx.wingCount);w.events.push('kill');}
  break;
 }
 if(!struck&&overlaps(s.x,s.y,b.x,b.y,C.bossHitW,C.bossHitH)){
  b.hp=Math.max(0,b.hp-damage);b.hitFlash=C.hitFlash;struck=true;
  if(b.hp===0){
   beginBossDefeat(w,b);
  }
 }
 if(struck){s.active=false;fx(w,s.x,s.y,C.colors.hit,C.fx.hitCount);}
}

function updateItems(w){
 const p=w.player;
 w.items.each(item=>{
  item.age++;item.life--;
  const distance=Math.hypot(item.x-p.x,item.y-p.y);
  if(distance<C.item.magnetRadius){
   const angle=Math.atan2(p.y-item.y,p.x-item.x);
   item.x+=Math.cos(angle)*C.item.magnetSpeed;item.y+=Math.sin(angle)*C.item.magnetSpeed;item.baseY=item.y;
  }else{item.x-=C.item.speed;item.y=item.baseY+Math.sin(item.age*C.item.frequency)*C.item.amplitude;}
  if(item.x<-item.radius||item.life<=0){item.active=false;return;}
  if(Math.hypot(item.x-p.x,item.y-p.y)>C.item.collectRadius)return;
  item.active=false;
  if(item.kind==='shot')p.level=Math.min(C.maxShotLevel,p.level+1);
  else if(item.kind==='shield')p.shield=Math.min(C.maxShield,p.shield+1);
  w.score+=C.item.score;w.burst=Math.min(C.burstCapacity,w.burst+C.item.burstGain);
  fx(w,item.x,item.y,C.colors.shield,C.fx.pickupCount);w.events.push('pickup');
 });
}

export function update(w,input={}){
 if(w.state!=='play')return;
 w.events=[];w.frame++;
 if(w.boss?.defeated){updateBossDefeat(w);updateEffects(w);return;}
 const p=w.player;
 // Analog touch input preserves small deflections for precise bullet dodging.
 // Invalid/missing axes fall back independently to ordinary keyboard input.
 const dx=Number.isFinite(input.axisX)?clamp(input.axisX,-1,1):Number(!!input.right)-Number(!!input.left);
 const dy=Number.isFinite(input.axisY)?clamp(input.axisY,-1,1):Number(!!input.down)-Number(!!input.up);
 const scale=1/Math.max(1,Math.hypot(dx,dy));
 const moveSpeed=input.touch===true?C.touchPlayerSpeed:C.playerSpeed;
 p.x=clamp(p.x+dx*moveSpeed*scale,C.playerBounds.left,C.playerBounds.right);
 p.y=clamp(p.y+dy*moveSpeed*scale,C.playerBounds.top,C.playerBounds.bottom);p.bank=dy;
 p.invul=Math.max(0,p.invul-1);p.cooldown=Math.max(0,p.cooldown-1);
 w.burstTicks=Math.max(0,w.burstTicks-1);w.warningTicks=Math.max(0,w.warningTicks-1);
 if(input.fire&&!p.cooldown){
  for(const shot of C.shotPatterns[p.level])w.shots.spawn({x:p.x+C.shotOffsetX,y:p.y+shot.y,vx:C.shotSpeed,vy:shot.vy,life:C.shotLife});
  p.cooldown=C.shotInterval;w.events.push('shot');
 }
 if(input.burst&&w.burst>=C.burstCapacity){
  w.burst=0;w.burstTicks=C.burstDuration;w.bullets.clear();
  w.enemies.each(e=>{e.hp-=C.burstEnemyDamage;e.hitFlash=C.hitFlash;if(e.hp<=0)kill(w,e);});
  w.events.push('burst');
 }
 if(!w.boss&&w.frame>=w.stage.bossArrival)summonBoss(w);
 if(!w.boss)w.timeline.update(event=>{
  if(event.kind==='section'){w.section=event.entry.name;w.events.push('section');}
  else if(event.kind==='warning'){w.section=event.entry.name;w.warningTicks=C.bossWarning;}
  else if(event.kind==='wave'||event.kind==='carrier')spawnEnemy(w,event);
  else if(event.kind==='wreckage')spawnWreckage(w,event);
 });
 w.enemies.each(e=>{if(w.state==='play')updateEnemy(w,e);});
 w.obstacles.each(o=>{if(w.state==='play')updateObstacle(w,o);});
 if(w.state==='play'&&w.boss)updateBoss(w);
 w.shots.each(s=>updateShot(w,s));
 w.bullets.each(b=>{
  if(w.state!=='play')return;
  b.x+=b.vx;b.y+=b.vy;b.life--;
  if(b.x<C.bulletBounds.left||b.x>C.bulletBounds.right||b.y<C.bulletBounds.top||b.y>C.bulletBounds.bottom||b.life<0)b.active=false;
  else if(Math.hypot(b.x-p.x,b.y-p.y)<C.playerHitRadius+C.bulletRadius){b.active=false;hit(w);}
 });
 if(w.state==='play'&&!w.boss?.defeated)updateItems(w);
 updateEffects(w);
 if(w.frame-w.chainAt>C.chainWindow)w.chain=0;
}

