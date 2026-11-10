// All gameplay tuning lives here; logic runs at a fixed 60 Hz.
export const CONFIG = Object.freeze({
 width:320, height:224, fps:60,
 playerSpeed:2, touchPlayerSpeed:2.6, playerLives:3, playerHitRadius:2,
 playerBounds:{left:18,right:302,top:32,bottom:207},
 playerStart:{x:52,y:112}, startInvulnerability:90, invulnerability:120,
 shotSpeed:5, shotInterval:7, shotLife:75, shotOffsetX:15,
 shotPatterns:[[],[{y:0,vy:0}],[{y:-3,vy:0},{y:3,vy:0}],[{y:0,vy:0},{y:-4,vy:-.8},{y:4,vy:.8}]],
 maxShotLevel:3, maxShield:3, shieldInvulnerability:45,
 obstacleLimit:8,
 obstacle:{x:350,speed:.95,w:30,h:30,hitW:26,hitH:26,hp:4,warning:90,amplitude:5,frequency:.018,score:75,cullX:-30},
 enemyLimit:64, enemyBulletLimit:256, playerBulletLimit:64, effectLimit:256, itemLimit:16,
 enemyHealth:3, enemySpawnX:344, enemyCullX:-40, enemyCullY:-40, enemyMaxY:264,
 enemyTypes:{
  wave:{hp:3,w:24,h:24,hitW:22,hitH:18,speed:1.25,amplitude:19,frequency:.045,firstShot:75,shotInterval:210,shotSpeed:1.45,score:100},
  straight:{hp:2,w:24,h:20,hitW:22,hitH:16,speed:1.85,firstShot:90,shotInterval:240,shotSpeed:1.5,score:100},
  rush:{hp:4,w:28,h:24,hitW:24,hitH:18,speed:1.55,stopX:263,windup:54,dashSpeed:4.6,score:150},
  shooter:{hp:7,w:28,h:28,hitW:24,hitH:24,speed:1.5,stopX:246,hold:228,windup:24,firstShot:36,shotInterval:78,shotSpeed:1.65,fanCount:3,fanStep:.2,exitSpeed:2.1,score:200},
  carrier:{hp:10,w:38,h:26,hitW:34,hitH:22,speed:1.15,stopX:248,hold:216,windup:24,firstShot:96,shotInterval:120,shotSpeed:1.35,fanCount:1,fanStep:0,exitSpeed:1.65,score:250}
 },
 item:{speed:.65,radius:8,collectRadius:13,magnetRadius:32,magnetSpeed:1.6,amplitude:3,frequency:.055,life:570,score:100,burstGain:12},
 burstStart:35, burstDuration:300, burstCapacity:100, burstEnemyDamage:5, burstDamageMultiplier:2,
 chainWindow:180, chainMax:8, killBurstGain:8,
 bossArrival:5400, bossWarning:300, bossTimeout:3600, stageFinish:9200,
 bossDefeat:{duration:162,breakFrames:[48,72],burstFrame:108,aftermathFrame:126,
  explosionFrames:[1,19,37,58,81,99],fragmentLimit:12,shake:1.3},
 bossHealth:180, wingHealth:22, bossStart:{x:370,y:112}, bossStopX:243,
 bossEnterSpeed:1, bossRetreatSpeed:3, bossRetreatX:420,
 bossSwayAmplitude:38, bossSwayFrequency:.012, bossAlignSpeed:1.5, bossPhaseThresholds:[.6,.3],
 // One locked, visibly warned fan at a time. Never retarget a live volley.
 bossShotCounts:[0,3,3,5], bossShotSpeeds:[0,1.25,1.35,1.5], bossFanStep:.26,
 bossVolleyWarning:40, bossWingWarning:40, bossAttackRecovery:60,
 bossMuzzleX:-34, bossHitW:74, bossHitH:46,
 wingOffset:{x:18,y:26}, wingHitW:58, wingHitH:34,
 wingShotSpeed:1.3, wingScore:500,
 beamFirstAge:360, beamIntervals:[0,720,660,600], beamWarning:90, beamDuration:36, beamHalfHeight:7,
 bossScore:3000, bossSpeedBonus:1000, bossBonusDivisor:6, noMissBonus:2000,
 shotCullX:340, shotCullY:{top:16,bottom:232}, bulletBounds:{left:-10,right:335,top:18,bottom:235}, bulletRadius:3,
 hitFlash:6, fx:{speedMin:.3,speedRange:1.7,lifeMin:12,lifeRange:17,killCount:14,missCount:28,shieldCount:18,pickupCount:16,wingCount:30,bossCount:90,hitCount:2},
 colors:{explosion:'#ffd27d',hit:'#e9f3df',shield:'#86f1dd'}
});

