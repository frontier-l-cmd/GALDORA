import {ROUTE_CHOICES} from '../src/data/stages.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {makeWorld,update,summonBoss,continueRoute} from '../src/game/world.mjs';
import {createPresentation,BACKING_SCALE,STEP_SECONDS} from '../src/render/presentation.mjs';
class Target{
 constructor(){this.listeners={};this.style={};this.dataset={};this.checked=false;this.tagName='DIV';this.clientWidth=720;this.textContent='';this.captured=new Set();}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 emit(type,extra={}){const event={preventDefault(){},pointerId:1,pointerType:'touch',clientX:110,clientY:50,target:this,...extra};for(const fn of this.listeners[type]??[])fn(event);}
 getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
 setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);}
 focus(){}getAttribute(key){return this[key];}setAttribute(key,value){this[key]=value;}
}
const nodes=new Map(),document=new Target(),window=new Target();
document.querySelector=s=>{if(!nodes.has(s))nodes.set(s,new Target());return nodes.get(s);};document.body=new Target();
const canvas=document.querySelector('#game');canvas.parentElement=new Target();const transforms=[];canvas.getContext=()=>({setTransform(...args){transforms.push(args);}});
window.innerWidth=700;window.innerHeight=900;window.scrollY=0;window.matchMedia=()=>({matches:false,addEventListener(){}});window.localStorage={getItem(){return null;},setItem(){}};
const scenes=[],audio={setScene(s){scenes.push(s);},silence(){},unlock:async()=>true,tickMusic(){},play(){},diagnostics(){return {status:'available'};}};
let now=0,raf;const performance={now:()=>now};const requestAnimationFrame=fn=>{raf=fn;};
class Image{set src(value){this.complete=true;this.naturalWidth=32;this.onload();}}
const source=(await fs.readFile(new URL('../src/main.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction('ROUTE_CHOICES','makeWorld','update','summonBoss','continueRoute','draw','createSoundEngine','createPresentation','BACKING_SCALE','STEP_SECONDS','window','document','Image','performance','requestAnimationFrame',source)(ROUTE_CHOICES,makeWorld,update,summonBoss,continueRoute,()=>{},()=>audio,createPresentation,BACKING_SCALE,STEP_SECONDS,window,document,Image,performance,requestAnimationFrame);
const test=window.GALDORA_TEST,stick=nodes.get('#stick-area'),burst=nodes.get('#touch-burst');
assert.equal(canvas.width,640);assert.equal(canvas.height,448);assert.deepEqual(transforms[0],[2,0,0,2,0,0]);
stick.emit('pointerdown',{pointerId:11});burst.emit('pointerdown',{pointerId:22});
assert.equal(test.diagnostics.stick.pointerId,11);assert.equal(test.diagnostics.burstQueued,true);assert.ok(test.diagnostics.stick.x>0);
window.emit('pointercancel',{pointerId:22});assert.equal(test.diagnostics.burstQueued,false);assert.equal(test.diagnostics.stick.pointerId,11);
window.emit('resize');assert.equal(test.diagnostics.stick.pointerId,null);assert.equal(test.diagnostics.stick.x,0);
stick.emit('pointerdown',{pointerId:33});window.emit('blur');assert.equal(test.paused,true);assert.equal(test.diagnostics.stick.pointerId,null);
test.pause();assert.equal(test.paused,false);
for(let i=0;i<150;i++){now+=1000/120;raf(now);}assert.ok(Math.abs(test.diagnostics.renderPerformance.fps-120)<.01);assert.equal(test.diagnostics.renderPerformance.backingScale,2);
test.summon();test.world.boss.defeated=true;burst.emit('pointerdown',{pointerId:44});assert.equal(test.diagnostics.burstQueued,false);
now+=1000/120;raf(now);assert.equal(scenes.at(-1),'defeat');assert.ok(nodes.get('#status').textContent.startsWith('FINISHING'));
test.start();assert.equal(test.world.frame,0);assert.equal(test.diagnostics.burstQueued,false);
nodes.get('#boss-finale').emit('click');assert.equal(test.world.boss.hp,1);assert.equal(test.world.boss.x,243);assert.equal(test.world.player.y,112);assert.equal(test.diagnostics.demo,true);assert.equal(test.diagnostics.recordEligible,false);
console.log('interface-005: PASS (fixed backing, two-pointer touch, cancel/resize/blur, 120Hz FPS, defeat gating/scene, restart)');
test.start();test.world.state='clear';test.world.routeChoices=[{id:'routeA',name:'Amber',description:'Sky'},{id:'routeB',name:'Cobalt',description:'Ruins'}];test.world.score=1234;test.world.player.lives=2;
test.step(0);assert.equal(nodes.get('#route-panel').hidden,false);
nodes.get('#route-b').emit('click');assert.equal(test.world.stageId,'routeB');assert.equal(test.world.score,1234);assert.equal(test.world.player.lives,2);assert.equal(nodes.get('#route-panel').hidden,true);
nodes.get('#route-a').emit('click');assert.equal(test.world.stageId,'routeB');
test.world.state='clear';test.step(0);assert.equal(nodes.get('#trial-complete').hidden,false);test.start();test.step(0);assert.equal(nodes.get('#trial-complete').hidden,true);assert.equal(test.world.stageId,'stage1');
console.log('interface-006: PASS (selection, duplicate click ignored, end screen, restart)');
for(const [button,id] of [['#trial-a','routeA'],['#trial-b','routeB']]){
 nodes.get(button).emit('click');assert.equal(test.world.stageId,id);assert.equal(test.world.frame,0);assert.equal(test.world.player.lives,3);assert.equal(test.world.player.level,2);assert.equal(test.world.player.shield,1);assert.equal(test.diagnostics.recordEligible,false);assert.equal(test.diagnostics.demo,false);assert.equal(nodes.get('#route-panel').hidden,true);
}
test.start();assert.equal(test.world.stageId,'stage1');assert.equal(test.diagnostics.recordEligible,true);
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.indexOf('id="route-panel"')>html.indexOf('</canvas>'));assert.ok(html.indexOf('id="route-panel"')<html.indexOf('id="touch-controls"'));
console.log('interface-007: PASS (direct manual trial routes, fixed equipment, unranked, normal restart, in-screen selector)');

nodes.get('#stage-select').emit('click');assert.equal(test.world.state,'clear');assert.equal(nodes.get('#route-panel').hidden,false);assert.equal(test.diagnostics.recordEligible,false);assert.equal(test.diagnostics.demo,false);nodes.get('#route-a').emit('click');assert.equal(test.world.stageId,'routeA');assert.equal(test.world.player.level,2);assert.equal(test.diagnostics.recordEligible,false);console.log('stage-select debug: PASS');
