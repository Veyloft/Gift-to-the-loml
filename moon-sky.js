const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export const constellationEntrance={stars:.85,lineStart:.45,lineDuration:2};

// Simplified twin figures (Castor/Pollux) and Sagittarius's familiar Teapot.
// Pattern references: NASA's Gemini and asterism guides; IAU chart listing.
export const zodiacPatterns=[
 {name:'gemini',viewBox:'0 0 200 180',
  stars:[[132,20,2],[175,46,2.15],[102,62,1.4],[83,67,1.15],
   [54,86,1.25],[31,102,1.5],[70,110,1.65],[42,156,1.55],
   [66,164,1.2],[145,85,1.4],[174,107,1.15],[120,129,1.5],
   [103,165,1.6],[145,168,1.2]],
  lines:[[0,2],[2,3],[3,4],[4,5],[2,6],[6,7],[6,8],
   [1,9],[9,10],[9,11],[11,12],[11,13],[2,9]]},
 {name:'sagittarius',viewBox:'0 0 200 150',
  stars:[[110,24,1.65],[66,72,1.7],[30,90,1.55],[68,131,2],
   [138,127,1.75],[127,70,1.45],[162,50,1.9],[182,98,1.45]],
  lines:[[1,0],[0,5],[5,1],[1,2],[2,3],[3,1],[3,4],
   [4,5],[5,6],[6,7],[7,4]]}
];
export function moonSkyLayer(){
 const figures=zodiacPatterns.map(({name,viewBox,stars,lines})=>
  `<svg class="zodiac-constellation zodiac-${name}" data-zodiac="${name}" viewBox="${viewBox}" aria-hidden="true"><g class="constellation-light" style="opacity:0"><g class="constellation-lines">${lines.map(([a,b])=>`<path pathLength="1" style="stroke-dashoffset:1" d="M${stars[a][0]} ${stars[a][1]}L${stars[b][0]} ${stars[b][1]}"/>`).join('')}</g><g class="constellation-stars">${stars.map(([x,y,r])=>`<circle class="constellation-halo" cx="${x}" cy="${y}" r="${r*2.5}"/><circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g></g></svg>`).join('');
 // One permanent meteor. Segmented opacity gives it a short trail without
 // filters, gradients with duplicated IDs, or new particles on each pass.
 return `<div class="moon-sky" aria-hidden="true">${figures}<svg class="moon-shooting-star" viewBox="0 0 100 10" style="opacity:0" aria-hidden="true"><path d="M8 5H35" opacity=".08"/><path d="M35 5H60" opacity=".18"/><path d="M60 5H80" opacity=".35"/><path d="M80 5H94" opacity=".6"/><circle cx="94" cy="5" r="1.7"/></svg></div>`;
}
export function twinkleOpacity(index,time){
 const period=6.2+(index*17%37)*.18,phase=(index*23%67)/67;
 return .76+.24*(.5+.5*Math.sin((time/period+phase)*Math.PI*2));
}
function answer(time,offset){
 const phase=((time-offset)%18+18)%18;
 return phase<7.5?Math.sin(Math.PI*phase/7.5)**2:0;
}
export function constellationPose(time,index){
 const start=constellationEntrance.lineStart;
 const draw=smooth((time-start)/constellationEntrance.lineDuration);
 const settled=time-start-constellationEntrance.lineDuration;
 return {draw,opacity:smooth(time/constellationEntrance.stars)*
  (.68+(settled>0?.15*answer(settled,index*9):0))};
}
export const shootingIntervals=[19.2,22.6,16.8,24.1,20.3];
const shootingPaths=[
 [3.5,7.5,22,17],[70,7,88,16],[5,9,24,18],
 [71,6.5,87,13],[4,8,21,16]
];
const shootingFirstAt=9.2,shootingDuration=1.15;
const shootingCycle=shootingIntervals.reduce((a,b)=>a+b,0);
export function shootingStarPose(time){
 if(time<shootingFirstAt)return null;
 let phase=(time-shootingFirstAt)%shootingCycle,index=0;
 while(index<shootingIntervals.length-1&&phase>=shootingIntervals[index])phase-=shootingIntervals[index++];
 if(phase>shootingDuration)return null;
 const progress=phase/shootingDuration,[x0,y0,x1,y1]=shootingPaths[index];
 return {x:x0+(x1-x0)*progress,y:y0+(y1-y0)*progress,
  dx:x1-x0,dy:y1-y0,opacity:.65*Math.sin(Math.PI*progress)**2};
}
export class MoonSky{
 constructor(host,time){
  this.host=host;this.origin=time;this.lastTime=null;this.lastDraw=null;
  this.stars=[...host.parentElement.querySelectorAll('.star-field i')];
  this.figures=[...host.querySelectorAll('.constellation-light')];
  this.lines=[...host.querySelectorAll('.constellation-lines path')];
  this.meteor=host.querySelector('.moon-shooting-star');
  this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  this.resize();this.update(time);
 }
 resize(){
  if(!this.host)return;
  this.width=this.host.clientWidth;this.height=this.host.clientHeight;
  this.lastTime=null;
 }
 update(time){
  if(!this.host||!this.host.isConnected)return;
  // The existing ambient clock stops on a deliberate hold, but runs at the
  // music gate. No timer, RAF, or media-time dependency is added here.
  if(this.lastTime!==null&&time-this.lastTime<1/30)return;
  this.lastTime=time;const elapsed=Math.max(0,time-this.origin);
  const twinkleScale=this.reduced?.3:1;
  this.stars.forEach((star,i)=>{star.style.opacity=
   (1-(1-twinkleOpacity(i,elapsed))*twinkleScale).toFixed(4);});
  this.figures.forEach((figure,i)=>{const pose=constellationPose(elapsed,i);
   figure.style.opacity=pose.opacity.toFixed(4);});
  const draw=constellationPose(elapsed,0).draw;
  if(draw!==this.lastDraw){this.lines.forEach(line=>
   line.style.strokeDashoffset=(1-draw).toFixed(4));this.lastDraw=draw;}
  const meteor=this.reduced?null:shootingStarPose(elapsed);
  if(meteor){
   const angle=Math.atan2(meteor.dy*this.height,meteor.dx*this.width)*180/Math.PI;
   this.meteor.style.transform=`translate3d(${(meteor.x*this.width/100).toFixed(2)}px,${(meteor.y*this.height/100).toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg)`;
  }
  this.meteor.style.opacity=meteor?meteor.opacity.toFixed(4):'0';
  this.host.dataset.elapsed=elapsed.toFixed(3);
  this.host.dataset.entrance=draw.toFixed(4);
 }
 dispose(){this.host=null;this.stars=[];this.figures=[];this.lines=[];this.meteor=null;}
}
