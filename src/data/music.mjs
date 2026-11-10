// GALDORA Build 003 sound benchmark. Original scores and synthesizer patches.
// This local synthesis trial does not settle the canonical, still-open sound policy.
// Tracker units: 4 beats per bar, 16 steps per bar; MIDI pitches, no samples.
export const MUSIC_SETTINGS=Object.freeze({masterGain:.4,musicGain:.26,lookAhead:.12,startDelay:.025,maxVoices:24,maxSources:48,maxEventsPerTick:32,maxDuration:2.5});
export const MUSIC_PATCHES=Object.freeze({
 lead:Object.freeze({gain:.075,ratio:2,index:1.35,attack:.009,release:.085}),
 bass:Object.freeze({gain:.075,ratio:1,index:1.55,attack:.005,release:.045}),
 arp:Object.freeze({gain:.040,ratio:3,index:1.4,attack:.003,release:.055}),
 pad:Object.freeze({gain:.018,ratio:1,index:.35,attack:.12,release:.16}),
 kick:Object.freeze({gain:.13,attack:.002,release:.035}),
 snare:Object.freeze({gain:.065,attack:.002,release:.04}),
 hat:Object.freeze({gain:.025,attack:.001,release:.018})
});
export const midiFrequency=note=>440*2**((note-69)/12);

// A/A'/B/A'' phrases. The first falling answer comes back an octave lower
// in the bridge, then the last four bars open up before the loop cadence.
const stageMelody=[
 [[0,2,74],[3,1,77],[4,3,81],[8,2,79],[10,2,77],[12,3,76]],
 [[0,3,74],[4,2,77],[6,2,79],[9,3,77],[12,3,72]],
 [[0,2,72],[2,2,77],[5,3,81],[8,2,84],[10,2,81],[12,3,79]],
 [[0,3,79],[4,2,76],[6,2,74],[9,3,72],[13,2,76]],
 [[0,2,79],[3,1,81],[4,3,82],[8,2,81],[10,2,79],[12,3,77]],
 [[0,3,77],[4,2,74],[6,2,77],[8,3,79],[12,3,81]],
 [[0,2,81],[2,2,79],[4,3,77],[8,2,76],[10,2,74],[13,2,76]],
 [[0,3,73],[4,2,76],[6,2,81],[9,3,79],[13,2,73]],
 [[0,3,74],[4,2,81],[6,2,84],[9,2,81],[12,3,79]],
 [[0,2,77],[3,1,74],[4,3,70],[8,2,72],[10,2,74],[12,3,77]],
 [[0,3,81],[4,2,79],[6,2,77],[8,3,72],[12,3,69]],
 [[0,2,72],[2,2,74],[5,3,76],[8,3,79],[12,3,84]],
 [[0,3,82],[4,2,81],[6,2,79],[9,3,77],[12,2,74]],
 [[0,3,77],[4,3,79],[8,3,81],[12,3,82]],
 [[0,2,81],[2,2,79],[4,2,77],[7,1,76],[8,3,74],[12,3,77]],
 [[0,3,76],[4,2,73],[7,1,69],[8,3,73],[12,3,76]]
];
// Bass roots D2, Bb1, F2, C2, G1, Bb1, D2, A1, with chord intervals.
const stageHarmony=[[38,3,7],[34,4,7],[41,4,7],[36,4,7],[31,3,7],[34,4,7],[38,3,7],[33,4,7]];
const bossHarmony=[[38,3,7],[38,3,7],[34,4,7],[36,4,7],[31,3,7],[34,4,7],[33,4,7],[33,4,7]];
const bossMelody=[
 [[0,1,74],[2,1,74],[5,2,81],[8,1,77],[10,2,76],[13,2,74]],
 [[0,2,69],[3,1,74],[6,2,77],[9,1,76],[12,3,74]],
 [[0,1,70],[2,1,74],[5,2,77],[8,1,81],[10,2,79],[13,2,77]],
 [[0,2,76],[3,1,79],[6,2,84],[9,1,79],[12,3,76]],
 [[0,1,79],[2,1,79],[5,2,82],[8,1,81],[10,2,79],[13,2,77]],
 [[0,2,77],[3,1,74],[6,2,70],[9,1,74],[12,3,77]],
 [[0,1,76],[2,1,73],[5,2,69],[8,1,73],[10,2,76],[13,2,79]],
 [[0,2,81],[3,1,79],[6,2,76],[9,1,73],[12,1,76],[14,1,73]]
];
function makeTrack(id,bpm,bars){
 const events=[],boss=id==='boss';
 const add=(bar,step,length,note,instrument,velocity=1)=>events.push({beat:bar*4+step/4,duration:length/4,note,instrument,velocity});
 for(let bar=0;bar<bars;bar++){
  const [root,third,fifth]=(boss?bossHarmony:stageHarmony)[bar%8],bridge=!boss&&bar>=16&&bar<24;
  const phrase=(boss?bossMelody:stageMelody)[bar%(boss?8:16)];
  for(const [step,length,note] of phrase){
   // The bridge leaves space for a lower answering melody and lighter drums.
   if(bridge&&step===3)continue;
   add(bar,step,length*.91,note-(bridge?12:0),'lead',bridge?.72:.9);
  }
  const bassSteps=boss?[0,2,3,6,8,10,11,14]:[0,3,6,8,11,14];
  bassSteps.forEach((step,i)=>add(bar,step,(i%3===0?1.65:1.35),root+(i%3===2?12:0),'bass',step%4===0?1:.78));
  const chord=[root+24,root+24+third,root+24+fifth,root+36];
  const arpSteps=bridge?[2,6,10,14]:[0,2,4,6,8,10,12,14];
  arpSteps.forEach((step,i)=>add(bar,step,1.25,chord[(i+(bar%2?2:0))%4]+12,'arp',i%2?.64:.82));
  if(!boss)for(const pitch of chord.slice(0,3))add(bar,0,14.8,pitch,'pad',bridge?1:.72);
  for(const step of boss?[0,3,6,8,11,14]:bridge?[0,8]:[0,6,8,14])add(bar,step,1.25,36,'kick',step%8===0?1:.75);
  for(const step of [4,12])add(bar,step,1.5,38,'snare',.95);
  for(const step of [0,2,4,6,8,10,12,14])add(bar,step,.65,42,'hat',step%4===2?.75:.4);
  // A short fill every fourth bar, and a slightly denser final boss phrase.
  if(bar%4===3)for(const step of [13,14,15])add(bar,step,.8,38,'snare',.35+(step-13)*.15);
  if(boss&&bar>=8)for(const step of [7,15])add(bar,step,.55,42,'hat',.45);
 }
 const priority={kick:0,snare:1,hat:2,bass:3,pad:4,arp:5,lead:6};
 events.sort((a,b)=>a.beat-b.beat||priority[a.instrument]-priority[b.instrument]);
 const secondsPerBeat=60/bpm;
 return Object.freeze({id,bpm,bars,beats:bars*4,duration:bars*4*secondsPerBeat,events:Object.freeze(events.map(event=>Object.freeze({...event,time:event.beat*secondsPerBeat,seconds:Math.min(MUSIC_SETTINGS.maxDuration,event.duration*secondsPerBeat)})))});
}
export const MUSIC_TRACKS=Object.freeze({stage:makeTrack('stage',132,32),boss:makeTrack('boss',148,16)});

