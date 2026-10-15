const clamp=n=>Math.max(0,Math.min(1,n));
export const repeatColors=['#cf3875','#347ed0','#168f85','#cf8a26','#9253bb','#db6640','#6255c2'];
export function rotatedRect({x,y,width,height,angle=0},scale=1,halo=0){
 const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=width*scale/2+halo,h=height*scale/2+halo;
 return [[-w,-h],[w,-h],[w,h],[-w,h]].map(([dx,dy])=>[x+dx*c-dy*s,y+dx*s+dy*c]);
}
export function overlaps(a,b){
 for(const polygon of [a,b])for(let i=0;i<4;i++){
  const p=polygon[i],q=polygon[(i+1)%4],ax=p[1]-q[1],ay=q[0]-p[0];
  const pa=a.map(([x,y])=>x*ax+y*ay),pb=b.map(([x,y])=>x*ax+y*ay);
  if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa))return false;
 }
 return true;
}
export function fitWordScales(words,photos,width,height,halo=14){
 const inside=polygon=>polygon.every(([x,y])=>x>=4&&y>=4&&x<=width-4&&y<=height-4);
 const solo=(word,scale)=>inside(rotatedRect(word,scale,halo))&&photos.every(photo=>!overlaps(rotatedRect(word,scale,5),photo));
 const search=(low,high,valid)=>{for(let i=0;i<22;i++){const mid=(low+high)/2;valid(mid)?low=mid:high=mid;}return low;};
 const caps=words.map(word=>search(0,2,scale=>solo(word,scale)));
 const valid=scales=>{
  const shapes=words.map((word,i)=>rotatedRect(word,scales[i],8));
  return shapes.every((p,i)=>solo(words[i],scales[i])&&shapes.slice(i+1).every(q=>!overlaps(p,q)));
 };
 // Grow together first so neighbouring words share space fairly. Then use the
 // remaining room independently without moving any original anchor.
 const common=search(0,1,fraction=>valid(caps.map(cap=>cap*fraction)));
 const scales=caps.map(cap=>cap*common);
 scales.forEach((scale,i)=>{scales[i]=search(scale,caps[i],value=>{const next=[...scales];next[i]=value;return valid(next);});});
 return scales;
}
export function repeatPose(age,limit,reduced=false){
 if(age<0)return {scale:Math.min(1,limit),opacity:0};
 const rest=limit/1.022,start=Math.min(1,rest),rise=clamp(age/.26),settle=clamp((age-.26)/.16);
 const scale=age<.26?start+(limit-start)*(1-(1-rise)**4):limit+(rest-limit)*(settle*settle*(3-2*settle));
 return {scale:reduced?rest:scale,opacity:clamp(age/.075)};
}
function centerIn(el,host){
 let x=el.offsetWidth/2,y=el.offsetHeight/2;
 for(let node=el;node&&node!==host;node=node.offsetParent){x+=node.offsetLeft;y+=node.offsetTop;}
 return {x,y};
}
export class FinaleRepeat{
 constructor(host,cues,photosReady){
  this.host=host;this.cues=cues;this.photosReady=photosReady;this.pending=true;this.lastTime=null;
  this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  this.measure=document.createElement('canvas').getContext('2d');
  this.items=[...host.querySelectorAll('.lyric')].map((label,i)=>{
   const face=document.createElement('span');face.className='repeat-bubble';face.textContent=label.querySelector('b').textContent;face.setAttribute('aria-hidden','true');label.append(face);
   label.style.setProperty('--word-color',repeatColors[i]);return {label,face,limit:1};
  });
 }
 resize(){this.pending=true;this.lastTime=null;}
 fit(){
  if(!this.host)return;
  for(const {face} of this.items){
   this.measure.font=`${getComputedStyle(face).fontSize} "Lilita One"`;
   const ink=this.measure.measureText(face.textContent);
   // Uppercase lettering needs no empty descender space. Keep a small buffer
   // around the real ink so the collision test doesn't count invisible leading.
   face.style.lineHeight=Math.ceil(ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent+4)+'px';
  }
  const words=this.items.map(({label,face})=>({...centerIn(label,this.host),width:face.offsetWidth,height:face.offsetHeight,angle:parseFloat(label.style.getPropertyValue('--tilt'))||0}));
  const photos=[...this.host.querySelectorAll('.final-photo')].map(el=>{
   const matrix=new DOMMatrixReadOnly(getComputedStyle(el).transform),point=centerIn(el,this.host);
   return rotatedRect({x:point.x+matrix.e,y:point.y+matrix.f,width:el.offsetWidth,height:el.offsetHeight,angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI},1,3);
  });
  this.glow=Math.min(12,this.host.clientHeight*.025);
  const fitted=fitWordScales(words,photos,this.host.clientWidth,this.host.clientHeight,this.glow+2);
  this.host.style.setProperty('--repeat-glow',this.glow+'px');
  this.items.forEach((item,i)=>{item.limit=fitted[i];item.label.style.setProperty('--repeat-limit',item.limit.toFixed(5));});
  this.pending=false;
 }
 update(time){
  if(!this.host||time===this.lastTime)return;
  this.lastTime=time;
  // All three photos finish their existing entrances before the second line.
  // Measure their actual settled transforms once, rather than guessing bounds.
  if(time>=this.photosReady&&this.pending)this.fit();
  if(time<this.cues[0])return;
  this.items.forEach((item,i)=>{
   const pose=repeatPose(time-this.cues[i],item.limit,this.reduced);
   item.label.style.setProperty('--repeat-opacity',pose.opacity.toFixed(4));
   item.face.style.setProperty('--word-scale',pose.scale.toFixed(5));
   // Keep the established glow; use a proportional radius on short screens.
   item.face.style.setProperty('--word-blur',(this.glow/Math.max(.1,pose.scale)).toFixed(3)+'px');
  });
 }
 dispose(){this.items.length=0;this.host=null;this.measure=null;}
}
