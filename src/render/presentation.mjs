// Presentation only: never writes into the simulation or advances its RNG.
// Fixed-size pool slots have reusable views. A generation token distinguishes
// a newly spawned object from the previous occupant of the same pool slot.
export const BACKING_SCALE=2;
export const STEP_SECONDS=1/60;
const pools=['enemies','obstacles','items','shots','bullets','effects'];
const interpolatedFields=['age','defeatAge','rotation'];
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:1));
export function createPresentation(){
 let source=null,view=null,previousFrame=-1,previousState=null,alpha=1;
 const records=new Map(),fixedSlots=new Set();
 const fragments=[];
 function record(object){
  if(!object)return null;
  let r=records.get(object);
  if(!r){r={view:Object.create(object),frame:-1};records.set(object,r);}
  return r;
 }
 function pose(object){
  if(!object)return null;
  const r=record(object),out=r.view;
  const continuous=source.frame===previousFrame+1&&source.state===previousState&&r.frame===previousFrame&&r.generation===object._generation&&Math.hypot(object.x-r.x,object.y-r.y)<=32;
  out.x=continuous?r.x+(object.x-r.x)*alpha:object.x;
  out.y=continuous?r.y+(object.y-r.y)*alpha:object.y;
  for(const key of interpolatedFields)if(Number.isFinite(object[key])){
   const delta=object[key]-r[key],limit=key==='rotation'?Math.PI:2;
   out[key]=continuous&&Number.isFinite(delta)&&Math.abs(delta)<=limit?r[key]+delta*alpha:object[key];
  }
  return out;
 }
 function reset(world){
  source=world;records.clear();fixedSlots.clear();fragments.length=0;previousFrame=-1;previousState=null;alpha=1;
  view=Object.create(world);
  for(const name of pools)if(world[name])view[name]={each(fn){world[name].each(object=>fn(pose(object)));}};
  for(const name of pools)if(world[name])for(const slot of world[name].items)fixedSlots.add(slot);
  // Bound records to the world's fixed-capacity pools plus player and boss.
  record(world.player);if(world.boss)record(world.boss);
  return view;
 }
 function capture(object){const r=record(object);r.x=object.x;r.y=object.y;r.age=object.age;r.defeatAge=object.defeatAge;r.rotation=object.rotation;r.generation=object._generation;r.frame=source.frame;}
 function beforeStep(world){
  if(source!==world)reset(world);
  previousFrame=world.frame;previousState=world.state;
  // Pool membership is fixed for a run; only boss/fragment identities vary.
  // Reuse the reset-time Set instead of rebuilding hundreds of entries per tick.
  for(const old of records.keys())if(!fixedSlots.has(old)&&old!==world.player&&old!==world.boss&&!world.boss?.fragments?.includes(old))records.delete(old);
  capture(world.player);if(world.boss){capture(world.boss);for(const part of world.boss.fragments??[])capture(part);}
  for(const name of pools)world[name]?.each(capture);
 }
 function sample(world,fraction=1){
  if(source!==world)reset(world);
  alpha=clamp(fraction);
  view.frame=world.frame===previousFrame+1&&world.state===previousState?previousFrame+alpha:world.frame;
  view.player=pose(world.player);view.boss=pose(world.boss);
  if(world.boss?.fragments){
   fragments.length=world.boss.fragments.length;
   for(let i=0;i<fragments.length;i++)fragments[i]=pose(world.boss.fragments[i]);
   view.boss.fragments=fragments;
  }
  return view;
 }
 return {reset,beforeStep,sample,get retainedCount(){return records.size;}};
}
