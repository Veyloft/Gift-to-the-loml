// A shared raster atlas and nine permanent sprites. The story's ambient clock
// runs at the flip gate, freezes on a deliberate hold, and stops during turns.
export const cloudPoolSize=9;
const phases=[.08,.62,.37,.76,.16,.48,.31,.91,.57];
const periods=[20.7,16.9,23.3,8.4,10.2,9.1,4.3,5.6,4.9];
const depths=[
 {width:.20,variation:.08,opacity:.23,opacityVariation:.09},
 {width:.29,variation:.08,opacity:.40,opacityVariation:.12},
 {width:.39,variation:.09,opacity:.59,opacityVariation:.14}
];
function noise(index,cycle,salt){
 let n=Math.imul(index+17,374761393)^Math.imul(cycle+11,668265263)^Math.imul(salt+3,1274126177);
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
export function cloudAppearance(index,cycle){
 const depth=Math.floor(index/3),d=depths[depth];
 return {width:d.width+noise(index,cycle,0)*d.variation,
  center:-.08+noise(index,cycle,1)*1.16,
  opacity:d.opacity+noise(index,cycle,2)*d.opacityVariation,
  sprite:depth*2+Math.floor(noise(index,cycle,3)*2),
  drift:(noise(index,cycle,4)-.5)*.04};
}
export const cloudLayer=()=>`<div id="cloud-flow" class="cloud-flow" aria-hidden="true">${Array.from({length:cloudPoolSize},(_,i)=>`<div class="sky-cloud" data-depth="${Math.floor(i/3)}"></div>`).join('')}</div>`;
export class CloudFlow{
 constructor(host,time){
  this.host=host;this.origin=time;this.elapsed=0;this.lastTime=null;
  this.items=[...host.children].map((element,index)=>({element,index,cycle:-1}));
  this.resize();this.update(time);
 }
 resize(){
  if(!this.host)return;
  this.width=this.host.clientWidth;this.height=this.host.clientHeight;
  for(const item of this.items)if(item.appearance)this.size(item);
  this.lastTime=null;
 }
 size(item){item.pixels=item.appearance.width*this.width;item.element.style.width=item.pixels+'px';item.element.style.height=item.pixels+'px';}
 update(time){
  if(!this.host||time===this.lastTime||!this.width||!this.height)return;
  this.lastTime=time;this.elapsed=Math.max(0,time-this.origin);
  for(const item of this.items){
   const phase=this.elapsed/periods[item.index]+phases[item.index];
   const cycle=Math.floor(phase),progress=phase-cycle;
   if(cycle!==item.cycle){
    // Change the next pass only after the old square is wholly below the book;
    // the replacement starts wholly above it, including its feathered halo.
    item.cycle=cycle;item.appearance=cloudAppearance(item.index,cycle);
    const a=item.appearance;
    item.element.dataset.cycle=cycle;
    item.element.style.opacity=a.opacity;
    item.element.style.backgroundPosition=`${a.sprite%3*50}% ${Math.floor(a.sprite/3)*100}%`;
    this.size(item);
   }
   const a=item.appearance,padding=this.height*.08;
   const x=(a.center+a.drift*progress)*this.width-item.pixels/2;
   const y=-item.pixels-padding+progress*(this.height+item.pixels+padding*2);
   item.element.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
  }
 }
 dispose(){this.items.length=0;this.host=null;}
}
