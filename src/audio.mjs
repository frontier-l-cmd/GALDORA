// Original synthesized effects and optional tracker BGM. No external samples/runtime.
import {MUSIC_SETTINGS as MUSIC,MUSIC_PATCHES,MUSIC_TRACKS,midiFrequency} from './data/music.mjs';
// The same voice renderer is used by live playback and OfflineAudioContext QA.
// Each note owns at most two sources. Noise is deterministic, generated once/context.
const noiseBuffers=new WeakMap();
function noiseFor(context){
 if(noiseBuffers.has(context))return noiseBuffers.get(context);
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.5),context.sampleRate),data=buffer.getChannelData(0);
 let seed=0x47414c44;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
 noiseBuffers.set(context,buffer);return buffer;
}
export function scheduleMusicNote(context,destination,event,at,onEnded=()=>{}){
 const patch=MUSIC_PATCHES[event.instrument],sources=[],nodes=[],duration=event.seconds,end=at+duration;
 const voice={sources,nodes,end,disposed:false};
 const remember=node=>(nodes.push(node),node);
 const source=node=>(sources.push(node),remember(node));
 try{
  const envelope=remember(context.createGain()),level=patch.gain*event.velocity,attack=Math.min(patch.attack,duration*.2),release=Math.min(patch.release,duration*.45);
  envelope.gain.setValueAtTime(.00001,at);
  envelope.gain.linearRampToValueAtTime(level,at+attack);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.00001,level*.62),end-release);
  envelope.gain.exponentialRampToValueAtTime(.00001,end);
  envelope.connect(destination);
  let carrier;
  if(event.instrument==='snare'||event.instrument==='hat'){
   carrier=source(context.createBufferSource());carrier.buffer=noiseFor(context);
   const filter=remember(context.createBiquadFilter());filter.type=event.instrument==='hat'?'highpass':'bandpass';
   filter.frequency.setValueAtTime(event.instrument==='hat'?6500:1650,at);filter.Q.setValueAtTime(.7,at);
   carrier.connect(filter);filter.connect(envelope);
   if(event.instrument==='snare'){
    const body=source(context.createOscillator()),bodyGain=remember(context.createGain());body.type='triangle';
    body.frequency.setValueAtTime(180,at);body.frequency.exponentialRampToValueAtTime(85,end);
    bodyGain.gain.value=.3;body.connect(bodyGain);bodyGain.connect(envelope);
   }
  }else{
   carrier=source(context.createOscillator());carrier.type='sine';const frequency=midiFrequency(event.note);
   carrier.frequency.setValueAtTime(event.instrument==='kick'?145:frequency,at);
   if(event.instrument==='kick')carrier.frequency.exponentialRampToValueAtTime(42,Math.min(end,at+.09));
   else{
    const modulator=source(context.createOscillator()),depth=remember(context.createGain());modulator.type='sine';
    modulator.frequency.setValueAtTime(frequency*patch.ratio,at);
    depth.gain.setValueAtTime(frequency*patch.index,at);
    depth.gain.exponentialRampToValueAtTime(Math.max(.01,frequency*patch.index*.18),end);
    modulator.connect(depth);depth.connect(carrier.frequency);
   }
   carrier.connect(envelope);
  }
  carrier.onended=()=>onEnded(voice);
  for(const node of sources){node.start(at);node.stop(end+.005);}
  voice.end=end+.005;return voice;
 }catch(error){
  for(const node of sources)try{node.stop();}catch{}
  for(const node of nodes)try{node.disconnect();}catch{}
  throw error;
 }
}
export function createSoundEngine(host=globalThis){
 const limit=12,voices=new Set(),playedAt=new Map(),musicVoices=new Set();
 let context=null,master=null,musicBus=null,enabled=false,pending=null,status='off';
 let musicEnabled=false,scene='paused',musicStatus='off',transport=null,pauseMemo=null,musicScheduled=0,musicDropped=0;
 const patches={
  shot:{gap:.055,notes:[[0,.055,920,210,'square',.045]]},
  kill:{gap:.035,notes:[[0,.13,185,42,'sawtooth',.08],[.025,.08,330,65,'triangle',.06]]},
  hit:{gap:.12,notes:[[0,.23,95,28,'sawtooth',.11],[.055,.15,140,35,'square',.045]]},
  shield:{gap:.08,notes:[[0,.16,880,440,'sine',.1],[.04,.19,1320,660,'triangle',.055]]},
  item:{gap:.06,notes:[[0,.1,523,523,'triangle',.1],[.07,.11,659,659,'triangle',.1],[.14,.18,1047,1047,'sine',.1]]},
  burst:{gap:.18,notes:[[0,.28,110,880,'sawtooth',.065],[.035,.26,165,1320,'triangle',.08],[.1,.32,660,165,'sine',.09]]},
  boss:{gap:.7,notes:[[0,.24,147,147,'square',.055],[.28,.24,123,123,'square',.055],[.56,.38,98,98,'sawtooth',.075]]},
  charge:{gap:.6,notes:[[0,.5,130,520,'triangle',.075],[.12,.38,260,780,'sine',.045]]},
  beam:{gap:.5,notes:[[0,.34,180,45,'sawtooth',.085],[.025,.25,360,90,'square',.04]]},
  // Original falling, inharmonic metal tones and short crackles. These cues
  // follow simulation events, not timers, so pause never leaves a delayed blast.
  'boss-defeat':{gap:.7,notes:[[0,.68,164,43,'sawtooth',.065],[.035,.58,237,62,'triangle',.05],[.08,.055,1350,230,'square',.025],[.19,.065,990,120,'sawtooth',.03],[.35,.08,710,85,'square',.025]]},
  'boss-explosion':{gap:.105,notes:[[0,.16,145,35,'triangle',.055],[.012,.09,780,63,'sawtooth',.035]]},
  'boss-break':{gap:.6,notes:[[0,.29,370,58,'sawtooth',.055],[.025,.36,253,41,'triangle',.065],[.07,.12,1540,95,'square',.025]]},
  'boss-final':{gap:.8,notes:[[0,.66,98,27,'sine',.09],[.012,.42,181,36,'triangle',.065],[.035,.22,690,49,'sawtooth',.045]]},
  clear:{gap:1,notes:[[0,.2,523,523,'triangle',.1],[.14,.2,659,659,'triangle',.1],[.28,.2,784,784,'triangle',.1],[.42,.44,1047,1047,'sine',.11]]}
 };
 // World events call collected upgrades pickup; item is also a supported cue name.
 patches.pickup=patches.item;
 function release(voice){
  voices.delete(voice);
  try{voice.osc.disconnect();voice.gain.disconnect();}catch{}
 }
 function stopVoice(voice){try{voice.osc.stop();}catch{}release(voice);}
 function silenceEffects(){for(const voice of [...voices])stopVoice(voice);playedAt.clear();}
 function releaseMusic(voice){
  if(voice.disposed)return;voice.disposed=true;musicVoices.delete(voice);
  for(const node of voice.nodes)try{node.disconnect();}catch{}
 }
 function stopMusicVoice(voice){for(const source of voice.sources)try{source.stop();}catch{}releaseMusic(voice);}
 function stopMusic(){for(const voice of [...musicVoices])stopMusicVoice(voice);transport=null;}
 // Existing callers use silence for restart/blur. Reset is the safe default,
 // including restart while paused. Pause callers may explicitly retain position.
 function silence({preserveMusic=false}={}){silenceEffects();stopMusic();if(!preserveMusic||scene!=='paused')pauseMemo=null;scene='paused';musicStatus=musicEnabled?'paused':'off';}
 function updateStatus(){
  const ready=context?.state==='running',wanted=enabled||musicEnabled;
  status=!wanted?'off':ready?'ready':'blocked';
  musicStatus=!musicEnabled?'off':!ready?'blocked':MUSIC_TRACKS[scene]?'ready':scene;
  return wanted&&ready;
 }
 function failAudio(){silenceEffects();stopMusic();enabled=false;musicEnabled=false;status='unavailable';musicStatus='unavailable';}
 function setScene(value){
  if(!['stage','boss','defeat','clear','over','paused'].includes(value)||value===scene)return;
  if(value==='paused'&&transport&&context){
   pauseMemo={track:transport.track.id,offset:Math.max(0,context.currentTime-transport.origin)%transport.track.duration};
  }else if(value!=='paused'&&(scene!=='paused'||pauseMemo?.track!==value))pauseMemo=null;
  stopMusic();scene=value;updateStatus();
 }
 function setMusicEnabled(value){
  musicEnabled=!!value;
  if(!musicEnabled){stopMusic();pauseMemo=null;musicStatus='off';updateStatus();return Promise.resolve(false);}
  const result=unlock();return pending?result.then(ok=>musicEnabled&&ok):result;
 }
 function tickMusic(){
  if(!musicEnabled||!context||context.state!=='running'||!MUSIC_TRACKS[scene])return false;
  const now=context.currentTime,track=MUSIC_TRACKS[scene],horizon=now+MUSIC.lookAhead;
  for(const voice of [...musicVoices])if(voice.end<=now)releaseMusic(voice);
  if(!transport){
   const offset=pauseMemo?.track===scene?pauseMemo.offset:0;
   transport={track,origin:now+MUSIC.startDelay-offset,index:0,loop:0};pauseMemo=null;
   // Seek by binary search. Never enqueue historical notes on resume.
   let low=0,high=track.events.length;
   while(low<high){const mid=(low+high)>>1;if(track.events[mid].time<offset)low=mid+1;else high=mid;}
   transport.index=low;
   if(low===track.events.length){transport.index=0;transport.loop=1;}
  }
  let steps=0;
  const nextAt=()=>transport.origin+transport.loop*track.duration+track.events[transport.index].time;
  const advance=()=>{if(++transport.index===track.events.length){transport.index=0;transport.loop++;}};
  // A stalled RAF skips straight to the current musical position; it never
  // drains a backlog or creates a burst of hundreds of missed notes.
  if(nextAt()<now-.03){
   const elapsed=Math.max(0,now-transport.origin),loop=Math.floor(elapsed/track.duration),offset=elapsed-loop*track.duration;
   let low=0,high=track.events.length;
   while(low<high){const mid=(low+high)>>1;if(track.events[mid].time<offset)low=mid+1;else high=mid;}
   transport.loop=loop;transport.index=low;
   if(low===track.events.length){transport.index=0;transport.loop++;}
  }
  try{
   while(steps<MUSIC.maxEventsPerTick&&nextAt()<=horizon){
    const event=track.events[transport.index],at=Math.max(now,nextAt());
    while(musicVoices.size>=MUSIC.maxVoices)stopMusicVoice(musicVoices.values().next().value);
    const voice=scheduleMusicNote(context,musicBus,event,at,releaseMusic);musicVoices.add(voice);musicScheduled++;steps++;advance();
   }
   // Fail closed for accidental dense/corrupt score data, without a runaway queue.
   if(steps===MUSIC.maxEventsPerTick&&nextAt()<=horizon){musicDropped++;transport=null;stopMusic();}
   musicStatus='playing';return true;
  }catch{stopMusic();musicEnabled=false;musicStatus='unavailable';return false;}
 }
 function unlock(){
  if(!enabled&&!musicEnabled)return Promise.resolve(false);
  if(pending)return pending;
  try{
   const Constructor=host.AudioContext||host.webkitAudioContext;
   if(!Constructor){failAudio();return Promise.resolve(false);}
   if(!context||context.state==='closed'){
    silenceEffects();stopMusic();context=new Constructor();master=context.createGain();master.gain.value=MUSIC.masterGain;master.connect(context.destination);
    musicBus=context.createGain();musicBus.gain.value=MUSIC.musicGain;musicBus.connect(master);
   }
   if(context.state==='running')return Promise.resolve(updateStatus());
   // resume() is invoked synchronously in the gesture, never deferred to a timer.
   pending=Promise.resolve(context.resume()).then(()=>{
    return updateStatus();
   }).catch(()=>{updateStatus();return false;}).finally(()=>{pending=null;});
   return pending;
  }catch{failAudio();return Promise.resolve(false);}
 }
 function setEnabled(value){enabled=!!value;if(!enabled){silenceEffects();updateStatus();return Promise.resolve(false);}const result=unlock();return pending?result.then(ok=>enabled&&ok):result;}
 function play(type){
  const patch=patches[type];
  if(!enabled||!patch||!context||context.state!=='running')return false;
  const now=context.currentTime;
  if(now-(playedAt.get(type)??-Infinity)<patch.gap)return false;
  playedAt.set(type,now);
  try{
   for(const [offset,duration,from,to,wave,volume] of patch.notes){
    while(voices.size>=limit)stopVoice(voices.values().next().value);
    const osc=context.createOscillator(),gain=context.createGain(),at=now+offset;
    const voice={osc,gain};voices.add(voice);
    osc.onended=()=>release(voice);osc.type=wave;
    osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+duration);
    gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.006);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+duration+.01);
   }
   return true;
  }catch{silence();status='unavailable';return false;}
 }
 return {setEnabled,setMusicEnabled,setScene,tickMusic,unlock,play,silence,diagnostics:()=>({
  enabled,status,voices:voices.size,maxVoices:limit,contextState:context?.state??'none',
  musicEnabled,musicStatus,scene,musicTrack:transport?.track.id??null,musicVoices:musicVoices.size,
  musicSources:[...musicVoices].reduce((total,voice)=>total+voice.sources.length,0),maxMusicVoices:MUSIC.maxVoices,maxMusicSources:MUSIC.maxSources,
  musicLookAhead:MUSIC.lookAhead,musicScheduled,musicDropped,musicLoop:transport?.loop??0,musicIndex:transport?.index??0
 })};
}

