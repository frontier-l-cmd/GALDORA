// Direction-independent pattern maths adapted from the user's SECTOR NOVA 2
// patterns.js (305ac1b6); construction is replaced by fixed pool commands.
export function aimed(pool,{x,y,tx,ty,speed,life=240}){const angle=Math.atan2(ty-y,tx-x);return pool.spawn({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life});}
export function fan(pool,{x,y,angle=Math.PI,count=3,step=.3,speed,life=300}){const half=(count-1)/2;let created=0;for(let i=0;i<count;i++){const a=angle+(i-half)*step;if(pool.spawn({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life}))created++;}return created;}

