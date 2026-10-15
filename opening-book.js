import {easePaper} from './paper-turn.js';
const clamp=p=>Math.max(0,Math.min(1,p));
const smooth=p=>clamp(easePaper(clamp(p)));
export const openingDuration=2.05;

// A board has two faces and an edge. Its blue lining is the actual first
// left page, so the artwork stays connected to the hinge throughout opening.
export function openingPose(progress){
 const p=clamp(progress),travel=smooth((p-.13)/.68);
 const settle=p>.81&&p<1?Math.sin((p-.81)/.19*Math.PI)**2:0;
 // Once the cover is flat, both leaves settle as one book. Rebounding the
 // left board alone separates its baseline from the stationary right leaf.
 return {angle:travel?-180*travel:0,camera:smooth(p/.76),light:Math.sin(Math.PI*travel)**2,land:smooth((p-.81)/.19),settle};
}

// Bound the visible board and its attached bow after perspective projection.
// This uses cached local geometry, avoiding layout reads during the animation.
function openingFraming(turn,pose,sx,sy,rotation,tx,ty){
 const {width:w,height:h,depth:d,origin,center,viewport}=turn;
 const angle=pose.angle*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle),ox=w/2,oy=h/2;
 const cos=Math.cos(rotation),sin=Math.sin(rotation);
 const points=[[w/2,0,0],[w+5,0,0],[w+5,h+17,0],[w/2,h+17,0],
  [w/2-w/2*origin.bindingRatio,0,0],[w/2-w/2*origin.bindingRatio,h+5,0]];
 const face=[[0,0],[w/2,0],[w/2,h],[0,h]];
 for(const z of [d/2,-d/2])for(const [x,y]of face)points.push([w/2+ca*x+sa*z,y,-sa*x+ca*z-d/2]);
 // Retain the bow's clearance briefly after its face turns away. Releasing
 // that space gradually prevents a framing snap at the back-face switch.
 const bowWeight=1-smooth((Math.abs(pose.angle)-90)/45);
 for(const [bx,by]of origin.bowBounds){
  const x=(Math.min(1,Math.max(0,bx))+(bx-Math.min(1,Math.max(0,bx)))*bowWeight)*w/2;
  const y=(Math.min(1,Math.max(0,by))+(by-Math.min(1,Math.max(0,by)))*bowWeight)*h;
  points.push([w/2+ca*x+sa*d/2,y,-sa*x+ca*d/2-d/2]);
 }
 const projected=points.map(([x,y,z])=>{
  const perspective=1500/(1500-z),px=(x-ox)*perspective*sx,py=(y-oy)*perspective*sy;
  return {x:center.x+tx+cos*px-sin*py,y:center.y+ty+sin*px+cos*py};
 });
 const bounds={left:Math.min(...projected.map(p=>p.x)),right:Math.max(...projected.map(p=>p.x)),top:Math.min(...projected.map(p=>p.y)),bottom:Math.max(...projected.map(p=>p.y))};
 const margin=6,fit=Math.min(1,(viewport.width-2*margin)/(bounds.right-bounds.left),(viewport.height-2*margin)/(bounds.bottom-bounds.top));
 const cx=center.x+tx,cy=center.y+ty;
 const left=cx+(bounds.left-cx)*fit,right=cx+(bounds.right-cx)*fit;
 const top=cy+(bounds.top-cy)*fit,bottom=cy+(bounds.bottom-cy)*fit;
 const x=left<margin?margin-left:right>viewport.width-margin?viewport.width-margin-right:0;
 const y=top<margin?margin-top:bottom>viewport.height-margin?viewport.height-margin-bottom:0;
 return {fit,x,y};
}

export class OpeningBook{
 constructor(book,spread){this.book=book;this.spread=spread;this.active=null;}
 capture(closed){
  const front=closed.querySelector('.cover-board'),matrix=new DOMMatrixReadOnly(getComputedStyle(closed).transform);
  const bow=front.querySelector('.cover-bow'),w=front.offsetWidth,h=front.offsetHeight;
  const bowBounds=[[bow.offsetLeft/w,bow.offsetTop/h],[(bow.offsetLeft+bow.offsetWidth)/w,bow.offsetTop/h],[(bow.offsetLeft+bow.offsetWidth)/w,(bow.offsetTop+bow.offsetHeight)/h],[bow.offsetLeft/w,(bow.offsetTop+bow.offsetHeight)/h]];
  return {rect:front.getBoundingClientRect(),width:w,height:h,html:front.innerHTML,angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI,bindingRatio:closed.querySelector('.cover-binding').offsetWidth/w,bowBounds};
 }
 begin(origin){
  this.clear();
  const book=this.book,spread=this.spread,{rect}=origin;
  const width=book.clientWidth,height=book.clientHeight,rest=book.getBoundingClientRect();
  const sx=origin.width/(width/2),sy=origin.height/height,r=origin.angle*Math.PI/180;
  const start={sx,sy,x:rect.x+rect.width/2-(rest.x+rest.width/2)-Math.cos(r)*width*sx/4,y:rect.y+rect.height/2-(rest.y+rest.height/2)-Math.sin(r)*width*sx/4};
  const left=spread.firstElementChild,placeholder=document.createElement('div');
  placeholder.className='opening-placeholder';left.replaceWith(placeholder);
  const rig=document.createElement('div');rig.id='opening-rig';rig.setAttribute('aria-hidden','true');rig.inert=true;
  rig.innerHTML='<div class="opening-shadow"></div><div class="opening-binding"></div><div class="opening-board"><div class="opening-perimeter opening-perimeter-left"></div><div class="opening-face opening-front cover-board"></div><div class="opening-face opening-inside"></div><div class="opening-edge opening-fore-edge"></div><div class="opening-edge opening-top-edge"></div><div class="opening-edge opening-bottom-edge"></div><div class="opening-face-light"></div></div><div class="opening-spine"></div>';
  const base=document.createElement('div');base.className='opening-perimeter opening-perimeter-right';base.setAttribute('aria-hidden','true');
  const front=rig.querySelector('.opening-front');
  const art=document.createElement('div');art.className='opening-cover-art';art.innerHTML=origin.html;
  art.style.width=origin.width+'px';art.style.height=origin.height+'px';
  art.style.transform=`scale(${width/2/origin.width},${height/origin.height})`;
  front.append(art);
  rig.querySelector('.opening-inside').append(left);
  book.append(base,rig);book.classList.add('book-opening');spread.inert=true;
  book.style.setProperty('--book-edge',getComputedStyle(book).borderLeftWidth);
  book.style.setProperty('--opening-height',height+'px');
  book.style.setProperty('--opening-binding-width',width/2*origin.bindingRatio+'px');
  const depth=Math.max(3,Math.min(6,height*.009));book.style.setProperty('--board-depth',depth+'px');
  this.active={elapsed:0,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,start,origin,viewport:{width:innerWidth,height:innerHeight},center:{x:rest.x+rest.width/2,y:rest.y+rest.height/2},left,placeholder,rig,base,art,width,height,depth,board:rig.querySelector('.opening-board'),shadow:rig.querySelector('.opening-shadow'),light:rig.querySelector('.opening-face-light')};
  this.paint(0);
 }
 resize(){
  const turn=this.active;if(!turn)return;
  const {book}=this,{origin,viewport}=turn,rest=book.getBoundingClientRect();
  turn.width=book.clientWidth;turn.height=book.clientHeight;turn.depth=Math.max(3,Math.min(6,turn.height*.009));
  turn.center={x:rest.x+rest.width/2,y:rest.y+rest.height/2};
  const sx=origin.width/(turn.width/2),sy=origin.height/turn.height,r=origin.angle*Math.PI/180;
  turn.start={sx,sy,x:(origin.rect.x+origin.rect.width/2)*innerWidth/viewport.width-(rest.x+rest.width/2)-Math.cos(r)*turn.width*sx/4,y:(origin.rect.y+origin.rect.height/2)*innerHeight/viewport.height-(rest.y+rest.height/2)-Math.sin(r)*turn.width*sx/4};
  book.style.setProperty('--opening-height',turn.height+'px');book.style.setProperty('--board-depth',turn.depth+'px');
  book.style.setProperty('--book-edge',getComputedStyle(book).borderLeftWidth);
  book.style.setProperty('--opening-binding-width',turn.width/2*origin.bindingRatio+'px');
  turn.art.style.transform=`scale(${turn.width/2/origin.width},${turn.height/origin.height})`;
 }
 paint(progress){
  const turn=this.active;if(!turn)return;
  const {book}=this,{start,board,shadow,light,depth}=turn,pose=openingPose(progress),c=pose.camera;
  const sx=start.sx+(1-start.sx)*c,sy=start.sy+(1-start.sy)*c;
  const rotation=turn.origin.angle+(-.7-turn.origin.angle)*c+pose.settle*.12;
  const tx=start.x*(1-c),ty=start.y*(1-c)+pose.settle*1.2;
  const framing=openingFraming({...turn,viewport:{width:innerWidth,height:innerHeight}},pose,sx,sy,rotation*Math.PI/180,tx,ty);
  book.dataset.openingProgress=progress.toFixed(4);
  book.style.transform=`translate3d(${tx+framing.x}px,${ty+framing.y}px,0) rotate(${rotation}deg) scale(${sx*framing.fit},${sy*framing.fit})`;
  book.style.setProperty('--opening-type-x',sy/sx);
  board.style.transform=`translateZ(${-depth/2}px) rotateY(${pose.angle}deg)`;
  board.style.setProperty('--face-shade',pose.light*.27);
  light.style.opacity=pose.light*.22;
  shadow.style.opacity=pose.light*.34;
  shadow.style.transform=`scaleX(${.12+.88*pose.light})`;
  book.style.setProperty('--opening-land',pose.land);
 }
 tick(dt,moving=true){
  const turn=this.active;if(!turn)return false;
  if(moving)turn.elapsed+=Math.min(.05,Math.max(0,dt));
  const p=clamp(turn.elapsed/(turn.reduced?.45:openingDuration));this.paint(p);
  if(p<1)return false;
  // The inside face and spread have identical geometry and the same DOM page.
  // Keep the physical board behind it instead of deleting it at the landing.
  turn.placeholder.replaceWith(turn.left);
  turn.base.remove();
  turn.rig.classList.add('opening-settled');
  this.book.classList.remove('book-opening');this.book.classList.add('book-opened');
  this.book.style.transform='';this.spread.inert=false;
  delete this.book.dataset.openingProgress;this.active=null;return true;
 }
 clear(){
  if(this.active)this.active.placeholder.replaceWith(this.active.left);
  this.active=null;this.book.querySelector('#opening-rig')?.remove();
  this.book.querySelector('.opening-perimeter-right')?.remove();
  this.book.classList.remove('book-opening','book-opened');this.book.style.transform='';
  for(const key of ['--opening-height','--board-depth','--opening-land','--opening-type-x','--book-edge','--opening-binding-width'])this.book.style.removeProperty(key);
  delete this.book.dataset.openingProgress;this.spread.inert=false;
 }
}
