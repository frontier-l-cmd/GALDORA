// Adapted from the user's SECTOR NOVA 2 TimelineRunner at commit 305ac1b6.
// Original: sector-nova-2/src/timeline.js, lines 509–588.
// GALDORA differences: t is already in frames; no FPS/global or enemy factory.
export class TimelineRunner {
 constructor(entries=[]){this.events=TimelineRunner.compile(entries);this.frame=0;this.index=0;this.paused=false;}
 static compile(entries){const events=[];entries.forEach((entry,order)=>{if(!Number.isInteger(entry.t)||entry.t<0)throw new Error('Timeline t must be a non-negative integer frame');const count=entry.type==='wave'?(entry.count??1):1;if(!Number.isInteger(count)||count<1||count>64)throw new Error('Invalid wave count');for(let i=0;i<count;i++)events.push({kind:entry.type,frame:entry.t+i*(entry.interval??0),order,index:i,entry});});events.sort((a,b)=>a.frame-b.frame||a.order-b.order||a.index-b.index);return events;}
 get finished(){return this.index>=this.events.length;}
 update(handler){if(this.paused)return;while(!this.paused&&this.index<this.events.length&&this.events[this.index].frame<=this.frame)handler(this.events[this.index++]);if(!this.paused)this.frame++;}
 pause(){this.paused=true;}
 resume(){this.paused=false;}
}

