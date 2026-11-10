// Structural Web Audio regression checks, not an auditory-quality assessment.
import assert from 'node:assert/strict';
import {createSoundEngine} from '../src/audio.mjs';
class Param {
 constructor(){this.value=0;this.events=[];}
 setValueAtTime(value,time){assert.ok(Number.isFinite(value)&&Number.isFinite(time));this.events.push({value,time});}
 linearRampToValueAtTime(value,time){this.setValueAtTime(value,time);}
 exponentialRampToValueAtTime(value,time){assert.ok(value>0);this.setValueAtTime(value,time);}
}
class Node {
 constructor(context,source=false){this.context=context;this.source=source;this.gain=new Param();this.frequency=new Param();this.Q=new Param();this.disconnected=false;context.nodes.push(this);}
 connect(){}
 disconnect(){this.disconnected=true;}
 start(at){this.started=at;}
 stop(at){if(at===undefined){this.killed=true;this.onended?.();}else this.end=at;}
}
class Context {
 static instances=[];
 constructor(){this.state='running';this.currentTime=0;this.sampleRate=48000;this.nodes=[];this.destination={};Context.instances.push(this);}
 createGain(){return new Node(this);}
 createOscillator(){return new Node(this,true);}
 createBufferSource(){return new Node(this,true);}
 createBiquadFilter(){return new Node(this);}
 createBuffer(channels,length){const data=new Float32Array(length);return {getChannelData:()=>data};}
 resume(){this.state='running';return Promise.resolve();}
 advance(time){this.currentTime=time;for(const node of this.nodes)if(node.source&&!node.disconnected&&node.end<=time)node.onended?.();}
}
const sound=createSoundEngine({AudioContext:Context});
const cues=['boss-defeat','boss-explosion','boss-break','boss-final','clear'];
for(const cue of cues)assert.equal(sound.play(cue),false,'SFX defaults off');
assert.equal(Context.instances.length,0,'no context before opt-in');
await sound.setMusicEnabled(true);
const context=Context.instances.at(-1);
sound.setScene('boss');assert.equal(sound.tickMusic(),true);
assert.ok(sound.diagnostics().musicVoices>0);
assert.equal(sound.play('boss-defeat'),false,'music opt-in is not SFX opt-in');
sound.setScene('defeat');
assert.equal(sound.diagnostics().musicTrack,null);
assert.equal(sound.diagnostics().musicVoices,0);
assert.equal(sound.diagnostics().musicStatus,'defeat');
assert.equal(sound.tickMusic(),false);
await sound.setEnabled(true);
for(let i=0;i<cues.length;i++){
 context.advance(i*2);assert.equal(sound.play(cues[i]),true,`${cues[i]} exists`);
 assert.equal(sound.play(cues[i]),false,`${cues[i]} throttles`);
 assert.ok(sound.diagnostics().voices<=12);
}
sound.silence();
assert.equal(sound.diagnostics().voices,0);
assert.equal(sound.diagnostics().musicVoices,0);
assert.ok(context.nodes.filter(n=>n.source).every(n=>n.disconnected),'all source nodes disconnected');
sound.setScene('defeat');assert.equal(sound.tickMusic(),false,'restart or resume during defeat never schedules boss track');
sound.play('boss-defeat');sound.setScene('paused');sound.silence({preserveMusic:true});sound.setScene('defeat');
assert.equal(sound.tickMusic(),false);assert.equal(sound.diagnostics().musicStatus,'defeat');
assert.equal(sound.diagnostics().voices,0,'pause kills pending effects');
for(let i=0;i<30;i++){
 context.currentTime+=.11;
 for(const cue of cues)sound.play(cue);
 assert.ok(sound.diagnostics().voices<=12,'hard cap even when ended callbacks are delayed');
}
await sound.setEnabled(false);
assert.equal(sound.diagnostics().voices,0);
for(const cue of cues)assert.equal(sound.play(cue),false,'muting rejects new effects');
sound.setScene('stage');assert.equal(sound.tickMusic(),true,'music remains independent of SFX');
sound.silence();sound.setScene('boss');assert.equal(sound.tickMusic(),true,'restart can return to boss music');
sound.silence();assert.equal(sound.diagnostics().musicVoices,0,'blur/restart silence kills music too');
await sound.setMusicEnabled(false);
assert.equal(sound.diagnostics().musicEnabled,false);
const unavailable=createSoundEngine({});
assert.equal(await unavailable.setEnabled(true),false);
assert.equal(unavailable.diagnostics().status,'unavailable');
assert.equal(unavailable.play('boss-final'),false);
console.log('PASS: defeat cue availability/throttle, 12-voice cap, mute, pause/restart/blur cleanup, unavailable audio, independent BGM and defeat scene. No actual audition performed.');
