// Composed once rather than shuffled at refresh. Coordinates are heart
// centers within the collage, followed by width (%) and paper rotation.
export const heartWaves=[
 [[52,29,37,-19],[27,22,33,13],[77,20,32,-9],
  [21,42,34,-28],[63,46,38,7],[79,44,35,24],
  [34,49,37,-5],[55,19,33,22],[72,64,34,-24],
  [24,64,35,17],[47,61,37,-31],[80,63,32,4],
  [22,20,32,-13],[78,18,33,31],[50,41,34,-2],
  [20,56,33,-21],[76,33,34,-34],[36,18,35,10]],
 [[40,31,43,26],[69,20,42,-32],[24,30,40,-7],
  [77,35,44,16],[48,52,42,-18],[30,19,41,9],
  [22,53,43,32],[66,42,44,-9],[31,63,40,21],
  [78,63,42,-27],[51,19,43,-16],[79,52,40,4],
  [60,57,44,29],[26,47,41,-35],[73,25,42,11],
  [23,20,42,-23],[42,41,44,5],[55,28,43,-28]]
];

export function bookmarkPose({time,firstAt,secondAt,firstDone,secondDone,prepared=false,drag=0,gateAt=null}){
 const clamp=n=>Math.max(0,Math.min(1,n));
 const lastAt=secondDone?secondAt:firstDone?firstAt:null;
 // Both pulls hold for the existing 0.55 s, then crawl back for 1.2 s.
 const retract=lastAt===null?0:1-clamp((time-lastAt-.55)/1.2);
 const progress=Math.max(clamp(drag),prepared?1:0,retract);
 // Preparation can move the object; its word remains tied to the song cue.
 const inkReady=retract>0||(gateAt!==null&&time>=gateAt);
 return {retract,progress,inkReady};
}
