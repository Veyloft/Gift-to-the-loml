import {trackPointer} from './pointer-gesture.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const edgeWidth=width=>clamp(width*.09,56,88);
export const swipeDistance=width=>clamp(width*.08,36,64);
export function isPageTurnGesture({pointerType,dx,dy,age,width,travel=Math.hypot(dx,dy),cancelled=false}){
 if(cancelled)return false;
 const click=pointerType==='mouse'&&travel<=8&&age<=500;
 return click||(dx>=swipeDistance(width)&&dx>=Math.abs(dy)*1.5);
}

// This only recognizes input. PaperTurn continues to own every animated pose.
export class PageEdgeFlip {
 constructor({book,cue,available,key,flip}){
  Object.assign(this,{book,cue,available,key,flip});this.gesture=null;
  book.addEventListener('pointerdown',e=>this.down(e));
  this.access=document.createElement('span');this.access.className='page-edge-access';this.access.setAttribute('role','button');this.access.tabIndex=-1;
  this.access.setAttribute('aria-label','Turn the page: swipe left from its right edge');this.access.dataset.interactive='';
  this.access.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat&&this.available()){e.preventDefault();e.stopPropagation();this.flip();}};
  book.append(this.access);
  addEventListener('resize',()=>this.positionCue());
 }
 down(e){
  if(this.gesture||!e.isPrimary||e.button!==0||!this.available()||e.target.closest('[data-interactive],button,input,textarea,select,dialog,[role="dialog"],.letter-sheet,.reading-sheet'))return;
  const r=this.book.getBoundingClientRect();
  if(e.clientX<r.right-edgeWidth(r.width)||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
  e.preventDefault();e.stopImmediatePropagation();
  this.gesture={id:e.pointerId,key:this.key(),pointerType:e.pointerType,x:e.clientX,y:e.clientY,dx:0,dy:0,travel:0,age:performance.now(),width:r.width};
  const g=this.gesture;
  g.pointer=trackPointer(this.book,e,{move:event=>this.move(event),end:event=>this.up(event),cancel:()=>{if(this.gesture===g)this.cancel();}});
 }
 move(e){
  if(this.gesture?.id!==e.pointerId)return;
  e.preventDefault();e.stopImmediatePropagation();
  this.gesture.dx=this.gesture.x-e.clientX;this.gesture.dy=e.clientY-this.gesture.y;
  this.gesture.travel=Math.max(this.gesture.travel,Math.hypot(this.gesture.dx,this.gesture.dy));
 }
 up(e){
  if(this.gesture?.id!==e.pointerId)return;
  this.move(e);const g=this.gesture;
  const turn=this.available()&&g.key===this.key()&&isPageTurnGesture({...g,age:performance.now()-g.age});
  this.cancel();if(turn)this.flip();
 }
 cancel(){
  const g=this.gesture;this.gesture=null;
  g?.pointer?.stop();
 }
 update(ready){
  const changed=this.cue.hidden===ready;
  this.book.classList.toggle('page-flip-ready',ready);
  this.cue.hidden=!ready;this.access.tabIndex=ready?0:-1;this.access.setAttribute('aria-disabled',String(!ready));
  if(!ready){this.cancel();return;}
  if(changed)this.positionCue();
 }
 positionCue(){
  if(this.cue.hidden)return;
  const r=this.book.getBoundingClientRect(),room=Math.max(0,innerWidth-r.right-2);
  this.access.style.width=edgeWidth(r.width)+'px';
  this.cue.style.left=(r.right+1)+'px';this.cue.style.top=(r.top+r.height*.5)+'px';
  this.cue.style.setProperty('--cue-room',room+'px');
  this.cue.style.width=Math.min(96,room)+'px';this.cue.classList.toggle('narrow-edge-cue',room<46);
 }
}
