import {makeWorld,update,summonBoss,continueRoute} from './game/world.mjs';
import {draw} from './render/draw.mjs';
import {createPresentation,BACKING_SCALE,STEP_SECONDS} from './render/presentation.mjs';
import {createSoundEngine} from './audio.mjs';
const names=['player-level','player-up','player-down','enemy-drone','boss-body','boss-wing','bg-far','bg-near','item-shot','item-shield'];
const assets={};let missing=[];
await Promise.all(names.map(name=>new Promise(resolve=>{
 const img=new Image();img.onload=()=>{assets[name]=img;resolve();};img.onerror=()=>{missing.push(name);resolve();};
 img.src=window.GALDORA_ASSETS?.[name]||`assets/${name}.png`;
})));
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d'),auto=$('#auto'),status=$('#status'),soundToggle=$('#sound'),musicToggle=$('#music');
const sound=createSoundEngine(window),keys=new Set(),highScoreKey='galdora.highScore.campaign006';
let world=makeWorld(),paused=false,last=performance.now(),acc=0,burstQueued=false;
const presentation=createPresentation();
presentation.reset(world);
canvas.width=320*BACKING_SCALE;canvas.height=224*BACKING_SCALE;
ctx.setTransform(BACKING_SCALE,0,0,BACKING_SCALE,0,0);
let recordEligible=!auto.checked,runRecorded=false,bestScore=0,storageStatus='available';
const stickArea=$('#stick-area'),stickKnob=$('#stick-knob'),touchBurst=$('#touch-burst'),touchPause=$('#touch-pause'),touchModeToggle=$('#touch-mode');
const pauseButton=$('#pause'),startButton=$('#start'),performanceLabel=$('#performance');
let refreshMs=0,refreshCount=0,measuredFps=null,measuredFrameMs=null,refreshSkipNext=true;
function resetRefresh(){refreshSkipNext=true;refreshMs=0;refreshCount=0;measuredFps=null;measuredFrameMs=null;setValue(performanceLabel,'textContent','描画 -- FPS');}
function measureRefresh(ms){
 if(document.hidden||ms<=0){resetRefresh();return;}
 // Skip the first interval after focus/start resets, never hide active-play stalls.
 if(refreshSkipNext){refreshSkipNext=false;return;}
 refreshMs+=ms;refreshCount++;
 if(refreshMs+1e-6>=1000){
  measuredFrameMs=refreshMs/refreshCount;measuredFps=1000/measuredFrameMs;
  setValue(performanceLabel,'textContent',`描画 ${Math.round(measuredFps)} FPS`);
  refreshMs=0;refreshCount=0;
 }
}
// DOM setters are deliberately change-only: the HUD rarely changes at display rate.
function setValue(target,key,value){if(target&&target[key]!==value)target[key]=value;}
function setAttribute(target,key,value){if(target&&target.getAttribute(key)!==value)target.setAttribute(key,value);}
const coarsePointer=window.matchMedia?.('(pointer: coarse)');
let touchMode=!!coarsePointer?.matches,stickPointer=null,burstPointer=null,stickX=0,stickY=0,stickGeometry=null;
if(document.body)document.body.dataset.input=touchMode?'touch':'desktop';
if(touchModeToggle)touchModeToggle.checked=touchMode;
function readBest(){
 try{
  const raw=window.localStorage?.getItem(highScoreKey);
  if(!window.localStorage){storageStatus='session';return 0;}
  if(raw===null||raw===undefined)return 0;
  return /^(0|[1-9]\d{0,8})$/.test(raw)?Number(raw):0;
 }catch{storageStatus='session';return 0;}
}
bestScore=readBest();world.debugInvincible=auto.checked;
function saveResult(){
 if(world.state==='clear'&&world.routeChoices?.length&&recordEligible)return;
 if(world.state==='play'||runRecorded)return;
 runRecorded=true;
 if(!recordEligible||auto.checked)return;
 const score=Number.isSafeInteger(world.score)&&world.score>=0?Math.min(world.score,999999999):0;
 bestScore=Math.max(bestScore,readBest(),score);
 try{if(window.localStorage)window.localStorage.setItem(highScoreKey,String(bestScore));else storageStatus='session';}
 catch{storageStatus='session';}
}
function resetStick(){
 const pointer=stickPointer;stickPointer=null;stickX=0;stickY=0;stickGeometry=null;
 if(stickKnob)stickKnob.style.transform='translate(-50%, -50%)';
 try{if(pointer!==null&&stickArea?.hasPointerCapture?.(pointer))stickArea.releasePointerCapture(pointer);}catch{}
}
function resetBurstPointer(){
 const pointer=burstPointer;burstPointer=null;
 if(touchBurst)touchBurst.dataset.pressed='false';
 try{if(pointer!==null&&touchBurst?.hasPointerCapture?.(pointer))touchBurst.releasePointerCapture(pointer);}catch{}
}
function resetInput(){resetRefresh();keys.clear();burstQueued=false;resetStick();resetBurstPointer();acc=0;last=performance.now();presentation.reset(world);}
function resize(){
 presentation.reset(world);
 // Layout can change on rotation; discard the old gesture rather than jump direction.
 if(stickPointer!==null)resetStick();
 const available=Math.max(80,canvas.parentElement.clientWidth-30);
 let scale=available<320?available/320:Math.max(1,Math.floor(available/320));
 if(touchMode){
  const compact=window.innerWidth>window.innerHeight&&window.innerHeight<=540;
  const top=(canvas.parentElement.getBoundingClientRect?.().top??140)+(window.scrollY||0);
  const controls=compact?70:180;
  const budget=compact?Math.max(100,window.innerHeight-110):Math.max(100,window.innerHeight-Math.max(0,top)-controls);
  scale=Math.min(available/320,budget/224);
 }
 canvas.style.aspectRatio='320 / 224';
 canvas.style.width=`${Math.round(scale*320)}px`;canvas.style.height=`${Math.round(scale*224)}px`;
}
window.addEventListener('resize',resize);resize();
function setInputMode(touch){
 if(touchModeToggle)touchModeToggle.checked=touch;
 if(touchMode===touch)return;
 touchMode=touch;resetInput();
 if(document.body)document.body.dataset.input=touch?'touch':'desktop';
 resize();
}
coarsePointer?.addEventListener?.('change',event=>setInputMode(event.matches));
touchModeToggle?.addEventListener('change',()=>{setInputMode(touchModeToggle.checked);canvas.focus({preventScroll:true});});
function start({demo=false}={}){
 auto.checked=!!demo;world=makeWorld();world.debugInvincible=!!demo;paused=false;recordEligible=!demo;runRecorded=false;
 resetInput();sound.setScene('clear');sound.silence();sound.setScene('stage');void sound.unlock();canvas.focus({preventScroll:true});
}
function chooseRoute(id){
 if(world.state!=='clear'||!world.routeChoices?.some(route=>route.id===id))return;
 const next=continueRoute(world,id);if(!next)return;
 world=next;world.debugInvincible=auto.checked;paused=false;runRecorded=false;
 resetInput();sound.setScene('stage');void sound.unlock();canvas.focus({preventScroll:true});
 show();
}
$('#route-a')?.addEventListener('click',()=>chooseRoute('routeA'));
$('#route-b')?.addEventListener('click',()=>chooseRoute('routeB'));
function pause(){
 if(world.state!=='play')return;
 paused=!paused;resetInput();if(paused){sound.setScene('paused');sound.silence({preserveMusic:true});}else{sound.setScene(world.boss?.defeated?'defeat':world.boss?'boss':'stage');void sound.unlock();}canvas.focus({preventScroll:true});
}
function loseFocus(){resetInput();if(world.state==='play')paused=true;sound.setScene(paused?'paused':world.state);sound.silence({preserveMusic:paused});}
auto.addEventListener('change',()=>start({demo:auto.checked}));
$('#start').addEventListener('click',()=>start());
$('#pause').addEventListener('click',pause);
$('#boss')?.addEventListener('click',()=>{start({demo:true});summonBoss(world);for(const event of world.events??[])sound.play(event);});
$('#boss-finale')?.addEventListener('click',()=>{
 start({demo:true});summonBoss(world);
 world.boss.x=243;world.boss.y=112;world.boss.hp=1;world.player.y=112;
 presentation.reset(world);
 for(const event of world.events??[])sound.play(event);
});
$('#boss-practice')?.addEventListener('click',()=>{start();recordEligible=false;summonBoss(world);for(const event of world.events??[])sound.play(event);});
soundToggle.addEventListener('change',()=>{
 void sound.setEnabled(soundToggle.checked).then(ok=>{
  if(!ok&&sound.diagnostics().status==='unavailable'){
   soundToggle.checked=false;soundToggle.title='このブラウザーでは音声を利用できません。ゲームはそのまま遊べます。';
  }
 });
 canvas.focus({preventScroll:true});
});
musicToggle?.addEventListener('change',()=>{
 sound.setScene(paused?'paused':world.state!=='play'?world.state:world.boss?.defeated?'defeat':world.boss?'boss':'stage');
 void sound.setMusicEnabled(musicToggle.checked).then(ok=>{
  if(!ok&&(sound.diagnostics().status==='unavailable'||sound.diagnostics().musicStatus==='unavailable')){
   musicToggle.checked=false;musicToggle.title='このブラウザーでは音声を利用できません。';
  }
 });
 canvas.focus({preventScroll:true});
});
// A single lazy audio context is unlocked by either pointer or keyboard gestures.
window.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')setInputMode(true);void sound.unlock();});
canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}));
const gameKeys=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','z','x','p','Escape','Enter']);
const normalizedKey=event=>event.key.length===1?event.key.toLowerCase():event.key;
function isControlTarget(target){return !!target&&(target.isContentEditable||['INPUT','BUTTON','SELECT','TEXTAREA'].includes(target.tagName));}
window.addEventListener('keydown',event=>{
 void sound.unlock();
 const key=normalizedKey(event);
 if(!gameKeys.has(key)||event.ctrlKey||event.metaKey||event.altKey||isControlTarget(event.target))return;
 event.preventDefault();setInputMode(false);
 if(key==='p'||key==='Escape'||key==='Enter'){
  if(event.repeat)return;
  if(key==='Enter')start();else pause();
  return;
 }
 if(paused||world.state!=='play'||world.boss?.defeated)return;
 if(key==='x'&&!event.repeat&&!keys.has('x'))burstQueued=true;
 keys.add(key);
});
// Always process releases, including releases after focus moved into a control.
window.addEventListener('keyup',event=>keys.delete(normalizedKey(event)));
window.addEventListener('blur',loseFocus);
document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();else resetInput();});
// One captured pointer steers; another may press burst without cancelling the stick.
function updateStick(event){
 if(event.pointerId!==stickPointer)return;
 event.preventDefault();
 const {box,radius}=stickGeometry;
 let dx=(event.clientX-box.left-box.width/2)/radius,dy=(event.clientY-box.top-box.height/2)/radius;
 const distance=Math.hypot(dx,dy);if(distance>1){dx/=distance;dy/=distance;}
 // A small radial dead zone preserves diagonals. Continuous response removes
 // the old 0 -> 20% jump, with a gentle boost for shorter thumb travel.
 const magnitude=Math.min(1,distance),deadzone=.06;
 const response=magnitude<=deadzone+1e-12?0:Math.pow((magnitude-deadzone)/(1-deadzone),.65);
 stickX=magnitude?dx/magnitude*response:0;stickY=magnitude?dy/magnitude*response:0;
 if(stickKnob)setValue(stickKnob.style,'transform',`translate(calc(-50% + ${Math.round(dx*radius)}px), calc(-50% + ${Math.round(dy*radius)}px))`);
}
stickArea?.addEventListener('pointerdown',event=>{
 event.preventDefault();setInputMode(true);void sound.unlock();
 if(paused||world.state!=='play'||world.boss?.defeated||stickPointer!==null)return;
 const box=stickArea.getBoundingClientRect();
 stickGeometry={box,radius:Math.max(12,Math.min(box.width,box.height)*.34)};
 stickPointer=event.pointerId;try{stickArea.setPointerCapture(event.pointerId);}catch{}
 updateStick(event);canvas.focus({preventScroll:true});
});
stickArea?.addEventListener('pointermove',updateStick);
stickArea?.addEventListener('lostpointercapture',event=>{if(event.pointerId===stickPointer)resetStick();});
function requestBurst(){if(!paused&&world.state==='play'&&!world.boss?.defeated)burstQueued=true;}
touchBurst?.addEventListener('pointerdown',event=>{
 event.preventDefault();setInputMode(true);void sound.unlock();
 if(burstPointer!==null||paused||world.state!=='play'||world.boss?.defeated)return;
 burstPointer=event.pointerId;touchBurst.dataset.pressed='true';
 try{touchBurst.setPointerCapture(event.pointerId);}catch{}
 requestBurst();canvas.focus({preventScroll:true});
});
// Keyboard activation remains accessible; pointer activation already queued on down.
touchBurst?.addEventListener('click',event=>{if(event.detail===0)requestBurst();});
touchBurst?.addEventListener('lostpointercapture',event=>{if(event.pointerId===burstPointer){resetBurstPointer();burstQueued=false;}});
touchPause?.addEventListener('click',pause);
function releasePointer(event){if(event.pointerId===stickPointer)resetStick();if(event.pointerId===burstPointer)resetBurstPointer();}
window.addEventListener('pointerup',releasePointer);
window.addEventListener('pointercancel',event=>{const cancelledBurst=event.pointerId===burstPointer;releasePointer(event);if(cancelledBurst)burstQueued=false;});
function input(){
 if(world.boss?.defeated){burstQueued=false;return {};}
 if(auto.checked){
  burstQueued=false;
  let pickup=null,distance=Infinity;
  world.items?.each(item=>{const d=Math.hypot(item.x-world.player.x,item.y-world.player.y);if(item.x<210&&d<distance){pickup=item;distance=d;}});
  const targetY=pickup?pickup.y:world.boss?world.boss.y:112+Math.sin(world.frame*.012)*58;
  const targetX=pickup?Math.max(32,Math.min(150,pickup.x)):52;
  return {fire:true,left:world.player.x>targetX+2,right:world.player.x<targetX-2,up:world.player.y>targetY+1,down:world.player.y<targetY-1,burst:true};
 }
 const burst=keys.has('x')||burstQueued;burstQueued=false;
 return {left:keys.has('ArrowLeft')||keys.has('a')||stickX<0,right:keys.has('ArrowRight')||keys.has('d')||stickX>0,up:keys.has('ArrowUp')||keys.has('w')||stickY<0,down:keys.has('ArrowDown')||keys.has('s')||stickY>0,fire:touchMode||keys.has('z'),burst,touch:touchMode,axisX:touchMode?stickX:undefined,axisY:touchMode?stickY:undefined};
}
function show(fraction=1){
 const choices=world.state==='clear'?world.routeChoices??[]:[];
 setValue($('#route-panel'),'hidden',!choices.length);
 setValue($('#trial-complete'),'hidden',!(world.state==='clear'&&world.stageNumber===2));
 for(let i=0;i<2;i++){
  const route=choices[i],button=$(i?'#route-b':'#route-a');
  setValue(button,'textContent',route?`${route.name} — ${route.description}`:'');
 }
 saveResult();
 sound.setScene(paused?'paused':world.state!=='play'?world.state:world.boss?.defeated?'defeat':world.boss?'boss':'stage');
 sound.tickMusic();
 draw(ctx,presentation.sample(world,fraction),assets,{paused,demo:auto.checked,highScore:bestScore,recordEligible});
 const phase=paused?'PAUSED':world.state==='play'?(world.boss?.defeated?'FINISHING':auto.checked?'DEMO':recordEligible?'LIVE':'PRACTICE'):world.state.toUpperCase();
 const section=typeof world.section==='string'?world.section:world.section?.label??world.section?.name??(world.boss?'BOSS INTERCEPT':'CLOUD APPROACH');
 const art=missing.length?`ART ${names.length-missing.length}/${names.length} · FALLBACK`:'ART LOADED';
 setValue(status,'textContent',`${phase} / ${section} / ${String(Math.floor(world.frame/60)).padStart(2,'0')}s / LV ${world.player.level??1} · SH ${world.player.shield??0} / ${art}`);
 setValue(status,'title',missing.length?`Missing art: ${missing.join(', ')}`:'');
 setValue(pauseButton,'disabled',world.state!=='play');
 setValue(pauseButton,'textContent',paused?'再開する':'一時停止');
 setValue(startButton,'textContent',world.state==='play'?'出撃する':'もう一度出撃する');
 if(touchPause){setValue(touchPause,'disabled',world.state!=='play');setValue(touchPause,'textContent',paused?'▶ 再開':'Ⅱ 停止');}
 if(touchBurst){
  const charge=Math.max(0,Math.min(100,Math.floor(world.burst))),ready=charge>=100;
  setValue(touchBurst,'disabled',paused||world.state!=='play'||!!world.boss?.defeated);setValue(touchBurst.dataset,'ready',String(ready));
  const label=ready?'BURST READY':`BURST ${charge}%`;
  if(touchBurst.textContent!==label)touchBurst.textContent=label;
  setAttribute(touchBurst,'aria-label',ready?'バースト発動可能':`バースト充填 ${charge}%`);
 }
}
function frame(now){
 measureRefresh(now-last);
 const elapsed=Math.max(0,Math.min((now-last)/1000,.1));last=now;
 if(paused||world.state!=='play')acc=0;
 else{
  acc+=elapsed;
  while(acc+1e-9>=STEP_SECONDS){
   world.debugInvincible=auto.checked;
   if(auto.checked)recordEligible=false;
   presentation.beforeStep(world);
   update(world,input());
   for(const event of world.events??[])sound.play(event);
   acc=Math.max(0,acc-STEP_SECONDS);
   if(world.state!=='play'){resetInput();break;}
  }
 }
 show(paused||world.state!=='play'?1:acc/STEP_SECONDS);requestAnimationFrame(frame);
}
window.GALDORA_TEST={
 get world(){return world;},get paused(){return paused;},start,pause,chooseRoute,
 summon(){recordEligible=false;summonBoss(world);presentation.reset(world);},
 step(n,inputOverride={fire:true}){
  recordEligible=false;
  for(let i=0;i<Math.max(0,Math.min(36000,Math.floor(n)));i++){world.debugInvincible=true;update(world,inputOverride);}
  presentation.reset(world);show();
 },
 get diagnostics(){return {renderPerformance:{fps:measuredFps,frameMs:measuredFrameMs,backingScale:BACKING_SCALE,interpolationMaxLagMs:1000/60,retainedPoses:presentation.retainedCount},demo:auto.checked,recordEligible,highScore:bestScore,storageStatus,activeKeys:[...keys],burstQueued,touchMode,stick:{x:stickX,y:stickY,pointerId:stickPointer},audio:sound.diagnostics(),section:world.section??null,level:world.player.level??1,shield:world.player.shield??0};},
 missing,assets
};
resetRefresh();show();requestAnimationFrame(frame);

