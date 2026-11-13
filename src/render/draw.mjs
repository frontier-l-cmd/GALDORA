import {CONFIG as C} from '../data/config.mjs';
import {pixelText} from './pixel-font.mjs';
const half=v=>Math.round(v*2)/2;
const ink='#102b3c',paper='#edf0cf',accent='#ffd27d',mint='#86f1dd';
function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(half(x),half(y),Math.round(w),Math.round(h));}
function sprite(ctx,img,x,y,w,h){if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,half(x-w/2),half(y-h/2),w,h);else rect(ctx,x-w/2,y-h/2,w,h,paper);}
function text(ctx,str,x,y,color=paper,align='left',size=7){pixelText(ctx,str,x,y,color,align,size);}
function tile(ctx,img,offset){if(!img?.naturalWidth)return;let x=-half(offset%320);ctx.drawImage(img,x,0,320,224);ctx.drawImage(img,x+320,0,320,224);}
function line(ctx,x0,y0,x1,y1,color,dash=0){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy,n=0;for(let limit=0;limit<1000;limit++){if(!dash||Math.floor(n/dash)%2===0)rect(ctx,x0,y0,1,1,color);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}n++;}}
function chip(ctx,kind,x,y,frame=0,assets={}){
 const image=assets[kind==='shot'?'item-shot':'item-shield'];
 if(image?.complete&&image.naturalWidth){
  sprite(ctx,image,x,y,20,20);
  if(frame%48<24){rect(ctx,x-12,y-1,2,2,kind==='shot'?accent:mint);rect(ctx,x+11,y-1,2,2,kind==='shot'?accent:mint);}
  return;
 }
 // Original machined pickup emblems. Outer geometry, not only color, names the type.
 x=half(x);y=half(y);
 if(kind==='shot'){
  const triangle=(top,height,color)=>{for(let row=0;row<height;row++){const half=Math.floor(row*.6);rect(ctx,x-half,top+row,half*2+1,1,color);}};
  triangle(y-10,18,'#0b202c');triangle(y-8,14,'#c3965b');triangle(y-6,11,accent);triangle(y-4,8,ink);
  line(ctx,x-8,y+5,x,y-8,paper);line(ctx,x-6,y+6,x+7,y+6,'#955740');
  rect(ctx,x-1,y-2,3,6,paper);rect(ctx,x-3,y+1,7,1,paper);rect(ctx,x,y-5,1,3,mint);
  rect(ctx,x-9,y+7,5,2,ink);rect(ctx,x+5,y+7,5,2,ink);
 }else{
  const hex=(radius,height,color)=>{for(let row=-height;row<=height;row++){const inset=Math.max(0,Math.abs(row)-Math.floor(height/2));rect(ctx,x-radius+inset,y+row,radius*2+1-inset*2,1,color);}};
  hex(10,9,'#0b202c');hex(8,7,'#819a95');hex(7,6,paper);hex(6,5,ink);hex(4,4,mint);hex(2,2,'#2160a7');
  rect(ctx,x-6,y-7,6,1,paper);rect(ctx,x+7,y-3,2,6,'#3f5c66');rect(ctx,x-1,y-3,2,2,paper);
  for(const side of [-1,1]){rect(ctx,x+side*9-1,y-2,2,5,ink);rect(ctx,x+side*9-1,y-1,2,2,accent);}
 }
 if(frame%48<24){rect(ctx,x-12,y-1,2,2,kind==='shot'?accent:mint);rect(ctx,x+11,y-1,2,2,kind==='shot'?accent:mint);}
}
function enemySprite(ctx,e,assets,frame){
 const x=half(e.x),y=half(e.y),kind=e.kind||'wave';
 if(kind==='carrier'){
  rect(ctx,x-12,y-12,27,25,ink);rect(ctx,x-9,y-15,23,7,'#705e70');rect(ctx,x-9,y+9,23,7,'#705e70');
  rect(ctx,x-7,y-14,17,2,paper);rect(ctx,x-7,y+10,17,2,'#c3965b');
  rect(ctx,x+13,y-8,5,3,accent);rect(ctx,x+13,y+5,5,3,accent);
  sprite(ctx,assets['enemy-drone'],x-5,y,24,24);chip(ctx,e.itemKind||'shot',x+6,y,frame,assets);
 }else{
  if(kind==='shooter'){rect(ctx,x-12,y-10,24,20,ink);rect(ctx,x-5,y-14,18,5,'#705e70');rect(ctx,x-5,y+10,18,5,'#705e70');rect(ctx,x-12,y-11,9,2,accent);rect(ctx,x-12,y+10,9,2,accent);}
  sprite(ctx,assets['enemy-drone'],x,y,kind==='rush'?28:24,kind==='rush'?20:24);
  if(kind==='straight'){rect(ctx,x+7,y-8,7,2,paper);rect(ctx,x+7,y+6,7,2,paper);}
  if(kind==='rush'){line(ctx,x-8,y-7,x+12,y-3,accent);line(ctx,x-8,y+7,x+12,y+3,accent);if(e.state==='dash'){rect(ctx,x+13,y-1,13+(frame%4),2,mint);}}
 }
 if(e.warn>0&&e.state==='windup'){
  if(frame%12<8)line(ctx,x-12,y,e.targetX??30,e.targetY??y,accent,4);
  rect(ctx,x-2,y-17,4,5,accent);rect(ctx,x-2,y-10,4,2,paper);
 }
 if(e.hitFlash>0){rect(ctx,x-14,y-3,4,2,paper);rect(ctx,x-11,y+4,3,2,paper);}
}
function wreckSprite(ctx,o,frame){
 const y=half(o.y);
 if(o.warn>0){
  // Explicit edge warning before the hull enters the playable area.
  const x=309,lit=frame%18<12;
  if(lit){line(ctx,x+6,y-8,x,y,accent);line(ctx,x,y,x+6,y+8,accent);rect(ctx,x+7,y-5,2,11,paper);}
  rect(ctx,284,y-16,34,8,ink);text(ctx,'DEBRIS',286,y-10,accent,undefined,6);
  return;
 }
 const x=half(o.x),upper=o.variant%2===0;
 rect(ctx,x-10,y-15,19,30,'#0b202c');rect(ctx,x-15,y-9,30,19,'#0b202c');
 rect(ctx,x-11,y-12,22,25,'#3f5c66');rect(ctx,x-13,y-7,26,15,'#3f5c66');
 rect(ctx,x-9,y-11,18,3,'#819a95');rect(ctx,x-11,y-7,3,14,'#819a95');
 rect(ctx,x-6,y-7,14,15,ink);rect(ctx,x-3,y-5,8,11,'#705e70');
 rect(ctx,x+8,y-5,3,14,'#955740');rect(ctx,x-7,y+10,14,2,'#955740');
 for(let i=0;i<3;i++){rect(ctx,x-9+i*6,y+(upper?-12:9),4,3,accent);rect(ctx,x-7+i*6,y+(upper?-12:9),2,3,ink);}
 rect(ctx,x-2,y-2,5,4,upper?'#c3965b':'#819a95');
 if(o.hp<o.maxHp){line(ctx,x-4,y-11,x,y-4,'#0b202c');line(ctx,x,y-4,x-5,y+2,'#0b202c');}
 if(o.hp<=o.maxHp/2){line(ctx,x-5,y+2,x+3,y+11,accent);rect(ctx,x-4,y-3,3,2,accent);}
 if(o.hitFlash>0){rect(ctx,x-13,y-7,4,2,paper);rect(ctx,x-9,y+9,4,2,paper);}
}
function blastDisk(ctx,x,y,r,color){
 const radius=Math.max(1,Math.round(r));
 for(let row=-radius;row<=radius;row+=3){const span=Math.sqrt(Math.max(0,radius*radius-row*row));rect(ctx,x-span,y+row,span*2+1,3,color);}
}
function explosionSprite(ctx,e){
 const t=Math.max(0,Math.min(1,e.age/e.life)),r=e.radius*(.3+.7*t);
 if(t<.58){
  blastDisk(ctx,e.x,e.y,r,ink);blastDisk(ctx,e.x,e.y,r*.84,'#955740');
  blastDisk(ctx,e.x,e.y,r*.65,accent);blastDisk(ctx,e.x,e.y,r*(.43-.4*t),paper);
  if(e.final){for(let i=0;i<8;i++){const a=i*Math.PI/4,reach=r+8;line(ctx,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,e.x+Math.cos(a)*reach,e.y+Math.sin(a)*reach,accent);}}
 }else{
  for(let i=0;i<6;i++){const a=i*Math.PI/3,spread=r*.7,chunk=Math.max(1,(1-t)*r*.5);blastDisk(ctx,e.x+Math.cos(a)*spread,e.y+Math.sin(a)*spread,chunk,i%2?ink:'#3f5c66');}
 }
}
function defeatSprite(ctx,b,assets){
 // Local, brief energy flashes; no full-screen strobe or camera shake.
 if(b.bodyVisible!==false){
  const shake=(b.shake||0),sx=Math.sin(b.defeatAge*1.7)*shake,sy=Math.cos(b.defeatAge*2.1)*shake*.6;
  ctx.save();ctx.translate(half(b.x+sx),half(b.y+sy));ctx.rotate(b.rotation||0);
  for(let i=0;i<2;i++)if(b.wings[i]>0){ctx.save();if(i)ctx.scale(1,-1);const wing=assets['boss-wing'];if(wing?.naturalWidth)ctx.drawImage(wing,-13,-34,64,40);ctx.restore();}
  sprite(ctx,assets['boss-body'],0,0,80,64);
  line(ctx,-16,-19,-4,-7,accent);line(ctx,-4,-7,-13,5,'#0b202c');line(ctx,-13,5,2,18,accent);
  if((b.defeatFlash||0)>.35){blastDisk(ctx,-8,0,5+b.defeatFlash*5,accent);blastDisk(ctx,-8,0,2+b.defeatFlash*3,paper);}
  rect(ctx,20,-13,7,3,'#f18180');rect(ctx,20,10,5,3,accent);ctx.restore();
 }
 for(const part of b.fragments||[]){
  ctx.save();ctx.translate(half(part.x),half(part.y));ctx.rotate(part.rotation||0);
  if(part.kind==='wing'){if(part.side===1)ctx.scale(1,-1);sprite(ctx,assets['boss-wing'],0,0,52,32);}
  else{rect(ctx,-5,-3,11,7,ink);rect(ctx,-4,-3,8,4,'#c3965b');rect(ctx,-2,-2,5,1,accent);}
  ctx.restore();
 }
 for(const e of b.explosions||[])explosionSprite(ctx,e);
 if(b.defeatAge<108){rect(ctx,176,20,134,11,ink);text(ctx,b.defeatAge<48?'REACTOR FAILURE':'ARMOR BREAK',307,28,accent,'right',6);}
 else if(b.defeatAge<162){rect(ctx,178,20,132,11,ink);text(ctx,'WARDEN DESTROYED',307,28,mint,'right',6);}
}
function background(ctx,w,assets){
 rect(ctx,0,0,C.width,C.height,'#1d3e53');tile(ctx,assets['bg-far'],w.frame*.15);
 // Distant navigation structures remain outside the flight corridor.
 const section=Math.min(5,Math.floor(w.frame/(w.stage?.sectionFrames||900)));
 // Route identity is visible without relying on tiny text or a color swap alone.
 if(w.stage?.theme==='amber'){
  rect(ctx,0,15,320,206,'#544d59');
  for(let i=0;i<6;i++){const x=((i*74+444-w.frame*.12)%444+444)%444-80;rect(ctx,x,40+i%3*45,72,4,'#d1aa79');rect(ctx,x+20,46+i%3*45,39,2,'#897d7c');}
  rect(ctx,256,36,26,26,'#c89965');rect(ctx,261,41,16,16,'#f0cf91');
 }else if(w.stage?.theme==='cobalt'){
  rect(ctx,0,15,320,206,'#162c45');
  for(let i=0;i<7;i++){const x=((i*61+427-w.frame*.2)%427+427)%427-40;rect(ctx,x,26,17,40+i%3*13,'#304962');rect(ctx,x+5,35,2,13,'#6884a3');rect(ctx,x,173+i%2*13,20,48,'#304962');}
 }
 if(section>=2){for(let i=0;i<3;i++){const x=((i*150+450-w.frame*.25)%450+450)%450-65;rect(ctx,x,188,58,3,'#2160a7');rect(ctx,x+9,191,6,28,'#2160a7');rect(ctx,x+40,191,5,28,'#2160a7');rect(ctx,x+4,186,5,2,mint);}}
 if(w.stage?.theme==='cloud'||!w.stage)tile(ctx,assets['bg-near'],w.frame*.45);
 if(section>=3){for(let i=0;i<4;i++){const x=((i*113+452-w.frame*.65)%452+452)%452-30;rect(ctx,x,216,25,8,ink);rect(ctx,x+3,213,19,3,'#3f5c66');rect(ctx,x+5,211,3,2,accent);}}
}
export function draw(ctx,w,assets,{paused=false,demo=false,highScore=0,recordEligible=true}={}){
 ctx.imageSmoothingEnabled=false;background(ctx,w,assets);const b=w.boss;
 if(b){
  if(b.defeated)defeatSprite(ctx,b,assets);
  else{
  if(b.specialWarn>0){
   const color=w.stage.theme==='cobalt'?mint:accent;
   if(b.safeGap){
    const gap=b.safeGap;line(ctx,5,gap.top+4,195,gap.top+4,mint,5);line(ctx,5,gap.bottom-4,195,gap.bottom-4,mint,5);
    text(ctx,'SAFE',12,(gap.top+gap.bottom)/2,mint,undefined,6);
   }
   for(const shot of b.specialShots){
    if(shot.wing>=0&&b.wings[shot.wing]<=0)continue;
    const scale=b.safeGap?165:64;
    line(ctx,shot.x,shot.y,shot.x+shot.vx*scale,shot.y+shot.vy*scale,color,5);
    rect(ctx,shot.x-2,shot.y-2,4,4,color);
   }
   rect(ctx,70,35,180,10,ink);text(ctx,b.specialLabel,160,43,color,'center',6);
  }
  if(b.volleyWarn>0){
   const count=b.volleyCount||3,mx=b.volleyX??b.x-34,my=b.volleyY??b.y;
   for(let i=0;i<count;i++){const angle=(b.volleyAngle??Math.PI)+(i-(count-1)/2)*C.bossFanStep;line(ctx,mx,my,mx+Math.cos(angle)*48,my+Math.sin(angle)*48,accent,4);}
   rect(ctx,mx-27,my-16,51,8,ink);text(ctx,'AIM LOCK',mx-23,my-10,accent,undefined,6);
   rect(ctx,mx-3,my-3,6,6,accent);rect(ctx,mx-1,my-1,2,2,paper);
  }
  if(b.wingWarn>0){for(const lane of b.wingLanes||[]){line(ctx,0,lane.y,lane.x,lane.y,accent,5);rect(ctx,lane.x-3,lane.y-3,6,6,accent);}text(ctx,'WING LANES',b.x-26,b.y+49,accent,'center',6);}
  if(b.attackRecovery>0){rect(ctx,b.x-40,b.y+41,80,9,ink);text(ctx,'WEAPONS COOLING',b.x,b.y+48,mint,'center',6);}
  if(b.warn>0){const yy=Math.round(b.beamY),end=Math.round(b.beamX??b.x-34);line(ctx,0,yy-9,end,yy-9,accent,4);line(ctx,0,yy+9,end,yy+9,accent,4);if(w.frame%12<6)line(ctx,0,yy,end,yy,'#f18180',3);rect(ctx,5,yy-19,64,8,ink);text(ctx,'LOCKED / MOVE',8,yy-13,accent,undefined,6);}
  if(b.beamTicks>0){const yy=Math.round(b.beamY),end=Math.round(b.beamX??b.x-34);rect(ctx,0,yy-9,end,18,ink);rect(ctx,0,yy-7,end,14,'#f18180');rect(ctx,0,yy-3,end,6,accent);rect(ctx,0,yy-1,end,2,paper);}
  const wing=assets['boss-wing'];for(let i=0;i<2;i++)if(b.wings[i]>0){ctx.save();ctx.translate(half(b.x-5),half(b.y));if(i)ctx.scale(1,-1);const height=40+Math.round(Math.sin(b.age*.045)*4);if(wing?.naturalWidth)ctx.drawImage(wing,-8,-Math.round(height*.85),64,height);ctx.restore();if(b.wingFlash?.[i]>0)rect(ctx,b.x+12,b.y+(i?30:-30),7,2,paper);}
  sprite(ctx,assets['boss-body'],b.x,b.y,80,64);if(b.hitFlash>0){rect(ctx,b.x-36,b.y-3,5,3,paper);rect(ctx,b.x-32,b.y+5,3,2,paper);}
  rect(ctx,166,18,144,3,ink);rect(ctx,166,18,Math.max(0,144*b.hp/C.bossHealth),3,accent);
  text(ctx,(w.stage?.bossName||'SKY WARDEN')+' / PHASE '+b.phase,310,29,accent,'right',6);
  }
 }
 w.obstacles?.each(o=>wreckSprite(ctx,o,w.frame));
 w.enemies.each(e=>enemySprite(ctx,e,assets,w.frame));
 w.items?.each(item=>{const y=item.y+Math.sin((item.age||0)*.08)*2;chip(ctx,item.kind,item.x,y,w.frame,assets);});
 w.shots.each(s=>{rect(ctx,s.x-3,s.y-1,8,2,w.burstTicks?accent:mint);rect(ctx,s.x+3,s.y-1,2,2,paper);});
 const p=w.player;
 {
  if(p.shield>0){const x=p.x,y=p.y;line(ctx,x-18,y-9,x-10,y-13,mint);line(ctx,x-10,y-13,x+13,y-9,mint);line(ctx,x+13,y-9,x+19,y,mint);line(ctx,x+19,y,x+13,y+9,mint);line(ctx,x+13,y+9,x-10,y+13,mint);line(ctx,x-10,y+13,x-18,y+9,mint);}
  sprite(ctx,assets[p.bank<0?'player-up':p.bank>0?'player-down':'player-level'],p.x,p.y,32,16);
  rect(ctx,p.x-2,p.y-2,4,4,ink);rect(ctx,p.x-1,p.y-1,2,2,mint);
  if(p.invul>0&&w.frame%12<6){line(ctx,p.x-20,p.y-6,p.x-20,p.y+6,mint);line(ctx,p.x+19,p.y-6,p.x+19,p.y+6,mint);}
  rect(ctx,p.x-23,p.y-2,w.frame%8<4?10:6,4,ink);rect(ctx,p.x-21,p.y-1,w.frame%8<4?8:4,2,w.frame%8<4?accent:paper);
 }
 w.bullets.each(x=>{rect(ctx,x.x-3,x.y-3,6,6,'#14273a');rect(ctx,x.x-2,x.y-2,4,4,'#f18180');rect(ctx,x.x-1,x.y-1,2,2,'#ffe5bc');});
 w.effects.each(e=>rect(ctx,e.x,e.y,e.life>12?2:1,e.life>12?2:1,e.color));
 // Two compact strips preserve a clear play area and legible status at native resolution.
 rect(ctx,0,0,320,15,'#0b202c');text(ctx,String(w.score).padStart(7,'0'),7,10);text(ctx,'LIFE '+p.lives,79,10);text(ctx,'LV '+(p.level||1),120,10,mint);text(ctx,'SH '+(p.shield||0),154,10,mint);text(ctx,'BURST',193,10,'#9fb3b0',undefined,6);rect(ctx,218,5,42,5,'#3f5c66');rect(ctx,218,5,Math.floor(w.burst*.42),5,w.burst>=100?accent:'#95d0c5');text(ctx,demo?'DEMO':w.chain?'x'+w.chain:(w.stage?.label||'01'),312,10,accent,'right',6);
 rect(ctx,0,221,320,3,ink);rect(ctx,0,221,Math.min(320,320*w.frame/(w.stage?.bossArrival||C.bossArrival)),2,b?accent:mint);
 if(w.burstTicks){rect(ctx,0,15,320,1,paper);rect(ctx,0,15,1,206,paper);rect(ctx,319,15,1,206,paper);text(ctx,'BURST ACTIVE',160,213,accent,'center',6);}
 if(!b&&w.frame>(w.stage?.bossArrival||C.bossArrival)-180){rect(ctx,58,87,204,34,ink);text(ctx,'AIRSPACE CLOSED',160,99,accent,'center',8);text(ctx,'HEAVY INTERCEPTOR APPROACHING',160,111,paper,'center',6);}
 else if(!b&&w.frame%(w.stage?.sectionFrames||900)<120){const title=w.section||'CLOUD APPROACH';rect(ctx,6,24,Math.min(208,title.length*4+8),13,ink);text(ctx,title,10,33,paper,undefined,7);}
 if(paused||w.state!=='play'){
  rect(ctx,32,65,256,104,'#061923');rect(ctx,32,65,256,2,accent);
  text(ctx,paused?'PAUSED':w.state==='clear'?'STAGE COMPLETE':'GAME OVER',160,88,paper,'center',12);
  if(paused){text(ctx,'P / ESC / PAUSE TO RESUME',160,108,accent,'center',7);text(ctx,'FLIGHT DATA HELD',160,127,'#95d0c5','center',7);}
  else{const outcome=w.state==='clear'?(w.clearReason==='timeout'?'INTERCEPTOR WITHDREW':(w.stage?.bossName||'SKY WARDEN')+' DESTROYED'):'ENTER / START TO RETRY';text(ctx,outcome,160,103,accent,'center',7);text(ctx,'SCORE '+String(w.score).padStart(7,'0'),160,119,paper,'center',7);text(ctx,demo?'DEMO / UNRANKED':!recordEligible?'PRACTICE / UNRANKED':'BEST '+String(Math.max(highScore,w.score)).padStart(7,'0'),160,132,'#95d0c5','center',7);text(ctx,w.routeChoices?.length?'SELECT NEXT ROUTE BELOW':w.stageNumber===2?'TRIAL COMPLETE / FLY AGAIN':'ENTER OR START / FLY AGAIN',160,152,paper,'center',7);}
 }
}

