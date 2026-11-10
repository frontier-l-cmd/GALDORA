export class Pool {
  constructor(limit){this.limit=limit;this.items=Array.from({length:limit},()=>({active:false}));this.highWater=0;}
  spawn(data){const item=this.items.find(x=>!x.active);if(!item)return null;const generation=(item._generation??0)+1;Object.assign(item,data,{active:true,_generation:generation});this.highWater=Math.max(this.highWater,this.count);return item;}
  get count(){return this.items.reduce((n,x)=>n+Number(x.active),0);}
  clear(){for(const x of this.items)x.active=false;}
  each(fn){for(const x of this.items)if(x.active)fn(x);}
}
export function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

