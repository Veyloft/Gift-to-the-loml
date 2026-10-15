// Measured in the supplied MP3: independent word ASR and forced alignment
// agree on 71.96s. Progress uses the existing song clock, including its gates.
export const mineCue=71.96;
export const togetherAssets={
 closerCharacter:'assets/bring-closer-character-transparent.png',
 angelDetails:'assets/angel-details.png',
 kissingFace:'assets/kissing-face-transparent.png',
 iphoneEyes:'assets/iphone-eyes.png',
 ...Object.fromEntries(['golden','strawberry','harlequin','bat','chocolate-chip'].map(name=>['dragon-'+name,`assets/${name}-dragon-transparent.png`]))
};
export const dragons=[
 {name:'golden',x:2.5,y:17,width:12,eye:[81.5,39.5,30],bubble:[1.2,10.5],tail:'down'},
 {name:'strawberry',x:87,y:25,width:10.5,eye:[20,51,31],bubble:[83,48],tail:'up'},
 {name:'bat',x:1.5,y:48,width:12.5,eye:[80,53,29],bubble:[1.3,67],tail:'up'},
 {name:'chocolate-chip',x:84.5,y:70,width:13.5,eye:[16.5,51,31],bubble:[81.5,61],tail:'down'},
 {name:'harlequin',x:5.5,y:81,width:12,eye:[33,48,25],bubble:[3,74],tail:'down'}
];
const piece=(name,box)=>{const [x,y,w,h]=box;return `<span class="angel-piece angel-${name}" style="aspect-ratio:${w}/${h};--sheet-width:${1254/w*100}%;--sheet-left:${-x/w*100}%;--sheet-top:${-y/h*100}%"><img class="angel-sheet" src="${togetherAssets.angelDetails}" alt="" draggable="false"></span>`;};
export const angelDetails=()=>piece('halo',[390,182,475,161])+`<span class="angel-wings">${piece('wing-left',[34,507,540,655])+piece('wing-right',[680,507,540,655])}</span>`;
const iphoneEyes=()=>`<img class="iphone-eyes-image" src="${togetherAssets.iphoneEyes}" alt="" draggable="false"><span class="emoji-label">👀</span>`;
export const dragonParty=()=>`<div class="dragon-party" aria-hidden="true">${dragons.map(d=>`<div class="dragon-group" data-dragon="${d.name}"><div class="dragon-sprite" style="left:${d.x}%;top:${d.y}%;width:${d.width}%;--eye-x:${d.eye[0]}%;--eye-y:${d.eye[1]}%;--eye-size:${d.eye[2]}cqw"><img src="${togetherAssets['dragon-'+d.name]}" alt="" draggable="false"><span class="dragon-eyes">${iphoneEyes()}</span></div><span class="reaction-bubble dragon-bubble tail-${d.tail}" style="left:${d.bubble[0]}%;top:${d.bubble[1]}%">ouu shii <span class="bubble-emoji">${iphoneEyes()}</span></span></div>`).join('')}</div>`;
export const kissingReaction=()=>`<img class="kissing-face" src="${togetherAssets.kissingFace}" alt="" draggable="false"><span class="reaction-bubble kiss-bubble">mwah my fav jew</span>`;
export class TogetherScene{
 constructor(root){
  this.root=root;this.reacted=false;this.attemptMoved=false;this.repeat=0;this.finished=false;
  this.photos=[...root.querySelectorAll('.person')];
  this.imageLoaded=()=>this.resize();
  this.resizeObserver=new ResizeObserver(()=>this.resize());
  this.photos.forEach(photo=>{this.resizeObserver.observe(photo);photo.querySelector('.person-photo').addEventListener('load',this.imageLoaded);});this.resize();
 }
 resize(){
  for(const photo of this.photos){const frame=photo.querySelector('.person-portrait'),image=photo.querySelector('.person-photo');if(!image?.naturalWidth)continue;const scale=Math.min(photo.clientWidth/image.naturalWidth,photo.clientHeight/image.naturalHeight);frame.style.width=image.naturalWidth*scale+'px';frame.style.height=image.naturalHeight*scale+'px';}
 }
 beginAttempt(){this.attemptMoved=false;}
 movement(progress){
  if(progress<=0||this.attemptMoved)return;this.attemptMoved=true;
  if(this.reacted){this.root.dataset.reactionRepeat=++this.repeat%2?'a':'b';}
  else{this.reacted=true;this.root.classList.add('dragons-reacting');}
 }
 update(time,completed){
  const p=Math.max(0,Math.min(1,(time-mineCue)/.36));
  this.root.style.setProperty('--mine-reveal',p);this.root.classList.toggle('mine-sung',p>0);
  if(completed&&!this.finished){this.finished=true;this.root.classList.add('kiss-complete');}
 }
 dispose(){this.resizeObserver.disconnect();this.photos.forEach(photo=>photo.querySelector('.person-photo').removeEventListener('load',this.imageLoaded));}
}
