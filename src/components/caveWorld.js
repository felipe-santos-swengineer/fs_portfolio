export const CAVE_LENGTH = 245;
export const CAVE_SPAWN = {x:0,z:5};
export const CAVE_CHECKPOINT = {x:0,z:-76};
export const CAVE_CHECKPOINT_RADIUS = 3.2;
export function nearCaveCheckpoint(x,z) { return Math.hypot(x-CAVE_CHECKPOINT.x,z-CAVE_CHECKPOINT.z)<=CAVE_CHECKPOINT_RADIUS; }
export const CAVE_EXIT = {x:-3.5,z:7.5};
export const CAVE_EXIT_RADIUS = 4.6;
export function nearCaveExit(x,z) { return Math.hypot(x-CAVE_EXIT.x,z-CAVE_EXIT.z)<=CAVE_EXIT_RADIUS; }
export const CAVE_HAZARDS = [
  {type:'lava',x:-5,z:-18,radius:3.1},{type:'lava',x:5,z:-32,radius:3.2},
  {type:'spikes',x:-4,z:-47,radius:2.4},{type:'spikes',x:4,z:-63,radius:2.4},
  {type:'lava',x:5,z:-91,radius:3.1},{type:'spikes',x:-5,z:-109,radius:2.6},
  {type:'lava',x:0,z:-128,radius:3.2},{type:'spikes',x:6,z:-141,radius:2.1},
  {type:'spikes',x:-5,z:-163,radius:2.4},{type:'lava',x:5,z:-181,radius:3.0},{type:'spikes',x:4,z:-202,radius:2.3},
];
// Two islands split the main route; two side chambers end in alcoves.
export const CAVE_DIVIDERS = [{minX:-2.2,maxX:2.2,minZ:-39,maxZ:-27},{minX:-2.2,maxX:2.2,minZ:-119,maxZ:-107}];
export const CAVE_ALCOVES = [{minX:-23,maxX:-10,minZ:-56,maxZ:-40},{minX:10,maxX:23,minZ:-99,maxZ:-83},{minX:-23,maxX:-10,minZ:-177,maxZ:-159}];
// Narrow winding branches extend each alcove to a remote dead end.
export const CAVE_BRANCHES = [
  {minX:-32,maxX:-22,minZ:-53,maxZ:-47},
  {minX:-38,maxX:-30,minZ:-70,maxZ:-47},
  {minX:-46,maxX:-31,minZ:-75,maxZ:-65},
  {minX:22,maxX:32,minZ:-96,maxZ:-90},
  {minX:30,maxX:38,minZ:-110,maxZ:-90},
  {minX:31,maxX:46,minZ:-115,maxZ:-105},
  {minX:-33,maxX:-22,minZ:-171,maxZ:-165},
  {minX:-39,maxX:-31,minZ:-191,maxZ:-165},
  {minX:-46,maxX:-32,minZ:-198,maxZ:-186},
];
export const CAVE_LOST = [{name:'Davi',x:-41,z:-70},{name:'Mara',x:41,z:-110}];
export const CAVE_LEVERS = [{x:-41,z:-192}];
export const CAVE_STAIRS_START = -220;
export const CAVE_ARROW_TRAPS = [{z:-24,side:-1},{z:-54,side:1},{z:-100,side:-1},{z:-135,side:1},{z:-172,side:1},{z:-207,side:1}];
export const CAVE_CHAMBER_ENTRANCE = {x:0,z:-238};
export function caveStairHeight(x,z,unlocked) { return unlocked&&Math.abs(x)<=2.15&&z<CAVE_STAIRS_START ? Math.min(3.2,Math.ceil(CAVE_STAIRS_START-z)*.2) : 0; }
export function nearCaveChamberEntrance(x,z,unlocked) { return unlocked&&Math.abs(x)<2.5&&z<-235; }
export const CAVE_HEARTS = [{x:-18,z:-48},{x:18,z:-91},{x:7,z:-71},{x:-8,z:-139},{x:8,z:-172},{x:-8,z:-210}];
export function caveBlocked(x,z,unlocked=true) {
  if(z>9||z< -CAVE_LENGTH)return true;
  if(z<CAVE_STAIRS_START&&(!unlocked||Math.abs(x)>2.15||z< -239.2))return true;
  if(CAVE_DIVIDERS.some(r=>x>r.minX&&x<r.maxX&&z>r.minZ&&z<r.maxZ))return true;
  if(Math.abs(x)<=11.1)return false;
  return ![...CAVE_ALCOVES,...CAVE_BRANCHES].some(r=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ);
}
export function caveSpikeExtension(time,index,reduceMotion=false) {
  return reduceMotion ? 1 : .5+.5*Math.cos(time*1.2+index*.9);
}
// Omitting time checks the full area for route planning; runtime checks visible spikes.
export function caveHazardAt(x,z,time=null,reduceMotion=false) {
  return CAVE_HAZARDS.find((h,index)=>Math.hypot(x-h.x,z-h.z)<h.radius && (h.type!=='spikes'||time===null||caveSpikeExtension(time,index,reduceMotion)>.35)) || null;
}
export function caveRespawn(z) { return z<=CAVE_CHECKPOINT.z ? {...CAVE_CHECKPOINT} : {...CAVE_SPAWN}; }

// Matches the dungeon sword reach and facing arc.
export function caveSwordHits(player, facing, target) {
  const dx=target.x-player.x,dz=target.z-player.z,distance=Math.hypot(dx,dz);
  return distance<2.8 && (Math.sin(facing)*dx+Math.cos(facing)*dz)/Math.max(distance,.001)>-.15;
}

// Monsters notice nearby travelers, pursue within their territory and wind up a strike.
export function caveMonsterIntent(monster, player, time) {
  const distance=Math.hypot(player.x-monster.x,player.z-monster.z);
  if(monster.attackAt>0)return time>=monster.attackAt?'strike':'windup';
  if(distance<=1.45&&time>=monster.nextAttack)return 'beginAttack';
  if(distance<9&&distance>1.15)return 'chase';
  return 'idle';
}
