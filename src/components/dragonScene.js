export const DRAGON_SCENE_PHASES=[{start:6,line:0},{start:13,line:1},{start:20,line:2}];
export const DRAGON_SCENE_DURATION=29;
export function dragonSceneLineAt(seconds) { return DRAGON_SCENE_PHASES.reduce((line,phase)=>seconds>=phase.start?phase.line:line,-1); }
