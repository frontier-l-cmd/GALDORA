import {CONFIG} from './config.mjs';
import {PILOT_STAGE} from './pilot-stage.mjs';

// Branch previews, not the complete nine-zone campaign. Timings are frames.
// Obstacles always announce themselves and leave a broad traversable corridor.
const SKYWAY = [
 {t:0,type:'section',name:'02A / AMBER SKYWAY'},
 {t:90,type:'wave',kind:'straight',count:3,interval:36,y:65},
 {t:320,type:'carrier',item:'shot',y:112},
 {t:560,type:'wave',kind:'wave',count:3,interval:36,y:164},
 {t:900,type:'section',name:'CROSSWIND RUN'},
 {t:920,type:'wreckage',lanes:[56,178]},
 {t:1200,type:'wave',kind:'rush',count:2,interval:120,y:72,yStep:85},
 {t:1500,type:'carrier',item:'shield',y:112},
 {t:1800,type:'section',name:'SUNLIT CONVOY'},
 {t:1830,type:'wave',kind:'straight',count:4,interval:42,y:164},
 {t:2100,type:'carrier',item:'shot',y:90},
 {t:2400,type:'wave',kind:'wave',count:3,interval:38,y:65},
 {t:2700,type:'section',name:'AMBER APPROACH'},
 {t:2730,type:'wave',kind:'rush',count:2,interval:120,y:62,yStep:100},
 {t:3010,type:'carrier',item:'shield',y:112},
 {t:3299,type:'warning',name:'AMBER WARDEN INBOUND'}
];
const RUINS = [
 {t:0,type:'section',name:'02B / COBALT RUINS'},
 {t:90,type:'wreckage',lanes:[58,178]},
 {t:370,type:'carrier',item:'shot',y:112},
 {t:650,type:'wave',kind:'shooter',count:1,y:62},
 {t:900,type:'section',name:'BROKEN VIADUCT'},
 {t:930,type:'wreckage',lanes:[112]},
 {t:1260,type:'wave',kind:'straight',count:3,interval:38,y:62},
 {t:1520,type:'carrier',item:'shield',y:164},
 {t:1800,type:'section',name:'RELAY STATION'},
 {t:1830,type:'wave',kind:'shooter',count:1,y:164},
 {t:2140,type:'wreckage',lanes:[58,108]},
 {t:2440,type:'carrier',item:'shot',y:166},
 {t:2700,type:'section',name:'COBALT APPROACH'},
 {t:2730,type:'wave',kind:'wave',count:3,interval:40,y:70},
 {t:3010,type:'carrier',item:'shield',y:112},
 {t:3299,type:'warning',name:'COBALT WARDEN INBOUND'}
];
export const ROUTE_CHOICES = Object.freeze([
 Object.freeze({id:'routeA',name:'AMBER SKYWAY',label:'02A',description:'開けた空域・高速編隊 / 道中60秒',seconds:60}),
 Object.freeze({id:'routeB',name:'COBALT RUINS',label:'02B',description:'遺構・障害物と射撃敵 / 道中60秒',seconds:60})
]);
export const STAGES = Object.freeze({
 stage1:Object.freeze({id:'stage1',number:1,label:'01',name:'CLOUD GATE',bossName:'SKY WARDEN',bossArrival:CONFIG.bossArrival,sectionFrames:900,theme:'cloud',timeline:PILOT_STAGE}),
 routeA:Object.freeze({id:'routeA',number:2,label:'02A',name:'AMBER SKYWAY',bossName:'AMBER WARDEN',bossArrival:3600,sectionFrames:900,theme:'amber',timeline:SKYWAY}),
 routeB:Object.freeze({id:'routeB',number:2,label:'02B',name:'COBALT RUINS',bossName:'COBALT WARDEN',bossArrival:3600,sectionFrames:900,theme:'cobalt',timeline:RUINS})
});
