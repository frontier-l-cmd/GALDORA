// Stage 1: six authored 15-second movements, then the Sky Warden.
// Short formations and dedicated wreckage beats replace repetition, not double density.
export const PILOT_STAGE = [
 {t:0,type:'section',name:'CLOUD GATE'},
 {t:90,type:'wave',kind:'wave',count:3,interval:30,y:70},
 {t:280,type:'carrier',item:'shot',y:112},
 {t:520,type:'wave',kind:'straight',count:3,interval:28,y:164},
 {t:680,type:'carrier',item:'shield',y:112},

 {t:900,type:'section',name:'WIND LANE'},
 {t:920,type:'wreckage',lanes:[56,178]},
 {t:1140,type:'wave',kind:'rush',count:2,interval:105,y:76,yStep:74},
 {t:1440,type:'carrier',item:'shot',y:112},
 {t:1650,type:'wave',kind:'wave',count:3,interval:30,y:155},

 {t:1800,type:'section',name:'CARRIER PASS'},
 {t:1820,type:'wave',kind:'shooter',count:1,y:62},
 {t:2070,type:'carrier',item:'shield',y:112},
 {t:2250,type:'wreckage',lanes:[112]},
 {t:2430,type:'wave',kind:'straight',count:3,interval:32,y:62},
 {t:2550,type:'carrier',item:'shot',y:168},

 {t:2700,type:'section',name:'STORM FRONT'},
 {t:2730,type:'wave',kind:'rush',count:2,interval:105,y:59,yStep:100},
 {t:2970,type:'wreckage',lanes:[58,108]},
 {t:3200,type:'wave',kind:'wave',count:4,interval:30,y:168},
 {t:3420,type:'carrier',item:'shield',y:148},

 {t:3600,type:'section',name:'SKY FORTRESS'},
 {t:3630,type:'wave',kind:'shooter',count:2,interval:100,y:62,yStep:99},
 {t:3890,type:'carrier',item:'shot',y:112},
 {t:4110,type:'wreckage',lanes:[128,178]},
 {t:4340,type:'wave',kind:'straight',count:3,interval:28,y:62},

 {t:4500,type:'section',name:'WARDEN APPROACH'},
 {t:4530,type:'wave',kind:'wave',count:3,interval:30,y:73},
 {t:4710,type:'carrier',item:'shot',y:109},
 {t:4860,type:'wave',kind:'rush',count:2,interval:95,y:62,yStep:100},
 {t:4980,type:'carrier',item:'shield',y:113},
 {t:5099,type:'warning',name:'WARDEN INBOUND'}
];

