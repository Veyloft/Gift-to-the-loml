const clamp=n=>Math.max(0,Math.min(1,n));
export const turnDuration=1.04;
export const easePaper=p=>{p=clamp(p);return p*p*p*(p*(p*6-15)+10);};

// Four adjoining surfaces follow the same sheet. The outside edge leads the
// spine while lifting, then releases its bend as the paper comes to rest.
export function paperGeometry(progress,count=4){
 const p=clamp(progress),travel=180*easePaper(p);
 const bend=Math.min(38*Math.sin(Math.PI*p)**2,(180-travel)*.85);
 let x=0,z=0,angle=-travel;
 return Array.from({length:count},(_,i)=>{
  angle-=bend*(i+1)/(count*(count+1)/2);
  const facet={x,z,angle},radians=angle*Math.PI/180;
  x+=Math.cos(radians)/count;z-=Math.sin(radians)/count;
  return facet;
 });
}

// Preserve ID-based artwork styles without duplicate IDs or active controls.
function snapshotStyles(){
 if(document.getElementById('paper-snapshot-styles'))return;
 const mirror=rules=>[...rules].map(rule=>{
  if(rule.type===CSSRule.STYLE_RULE)return /#[\w-]+/.test(rule.selectorText)?`${rule.selectorText.replace(/#([\w-]+)/g,'.paper-id-$1')}{${rule.style.cssText}}`:'';
  if(rule.type===CSSRule.MEDIA_RULE)return `@media ${rule.conditionText}{${mirror(rule.cssRules)}}`;
  return '';
 }).join('');
 const css=[...document.styleSheets].map(sheet=>mirror(sheet.cssRules)).join('');
 const style=document.createElement('style');style.id='paper-snapshot-styles';style.textContent=css;document.head.append(style);
}

export function capturePaper(source,side='whole'){
 const copy=source.cloneNode(true),canvases=source.querySelectorAll('canvas');
 if(source.isConnected){const originals=source.querySelectorAll('.ambient');copy.querySelectorAll('.ambient').forEach((el,i)=>{el.style.transform=getComputedStyle(originals[i]).transform;el.style.animation='none';});}
 const pages=[...copy.children].filter(el=>el.classList.contains('page'));
 if(pages.length===2&&side!=='whole')pages[side==='left'?1:0].replaceChildren();
 copy.querySelectorAll('canvas').forEach((canvas,i)=>{
  if(side==='right'&&source.classList.contains('blue')){canvas.remove();return;}
  const original=canvases[i],scale=Math.min(1,1200/Math.max(original.width,original.height));
  canvas.width=Math.max(1,Math.round(original.width*scale));canvas.height=Math.max(1,Math.round(original.height*scale));
  canvas.getContext('2d').drawImage(original,0,0,canvas.width,canvas.height);
 });
 for(const el of [copy,...copy.querySelectorAll('[id]')])if(el.id){el.classList.add('paper-id-'+el.id);el.removeAttribute('id');}
 copy.querySelectorAll('button,input').forEach(el=>el.disabled=true);
 const paragraph=source.querySelector('#pink-text,.paper-id-pink-text');
 const copiedParagraph=copy.querySelector('#pink-text,.paper-id-pink-text');
 if(paragraph&&copiedParagraph){const scroll=paragraph.scrollTop||Number(paragraph.dataset.paperScroll)||0;if(scroll)copiedParagraph.dataset.paperScroll=scroll;}
 copy.classList.add('paper-content');copy.inert=true;copy.setAttribute('aria-hidden','true');
 return copy;
}

// All curved surfaces share one decoded bitmap for each canvas artwork.
// Encode off the animation path instead of uploading four large canvases.
async function prepareTextures(paper,turn){
 await Promise.all([...paper.querySelectorAll('canvas')].map(async canvas=>{
  const blob=await new Promise(resolve=>canvas.toBlob(resolve));
  if(!blob||turn.cancelled)return;
  const url=URL.createObjectURL(blob),image=new Image();turn.urls.push(url);
  image.className=canvas.className;image.style.cssText=canvas.style.cssText;image.width=canvas.width;image.height=canvas.height;image.src=url;
  try{await image.decode();if(!turn.cancelled)canvas.replaceWith(image);}catch{URL.revokeObjectURL(url);}
 }));
}

export class PaperTurn{
 constructor(host){this.host=host;this.active=null;this.width=0;snapshotStyles();}
 resize(){
  const book=this.host.parentElement,rect=book.getBoundingClientRect();this.width=book.clientWidth/2;
  this.host.style.setProperty('--paper-width',this.width+'px');
  // A phone's short landscape viewport needs shallower perspective so a lifted
  // edge stays on screen. Keep the book's resting size and layout unchanged.
  const clearance=Math.max(2,Math.min(rect.top,innerHeight-rect.bottom)-4);
  book.style.perspective=Math.ceil(Math.max(1500,this.width*(1+book.clientHeight/(2*clearance))*1.05))+'px';
 }
 clear(){if(this.active){this.active.cancelled=true;for(const url of this.active.urls)URL.revokeObjectURL(url);}this.incoming?.classList.remove('paper-arriving');this.incoming=null;this.active=null;this.host.classList.remove('visible');this.host.replaceChildren();this.host.style.cssText='';delete this.host.dataset.progress;}
 begin(outgoing,incoming,at,scene){
  this.clear();this.resize();this.incoming=incoming;incoming.classList.add('paper-arriving');const count=4,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  this.host.style.setProperty('--paper-strips',count);this.host.classList.add('visible');this.host.dataset.scene=scene.id;
  const turn={at,elapsed:0,last:performance.now(),duration:reduced?.42:turnDuration,reduced,preparing:true,cancelled:false,urls:[]};this.active=turn;this.host.dataset.progress='0';
  const standby=document.createElement('div');standby.className='paper-standby';standby.append(capturePaper(outgoing));this.host.append(standby);
  const next=capturePaper(incoming,'left');
  const assemble=()=>{
  if(this.active!==turn)return;
  this.host.replaceChildren();
  const shade=document.createElement('div');shade.className='paper-contact-shadow';this.host.append(shade);
  const underlay=document.createElement('div');underlay.className='paper-underlay';underlay.append(capturePaper(outgoing,'left'));this.host.append(underlay);
  const facets=[],backs=[];
  for(let i=0;i<count;i++){
   const strip=document.createElement('div');strip.className='paper-strip';
   const front=document.createElement('div'),back=document.createElement('div');front.className='paper-face paper-front';back.className='paper-face paper-back';
   const frontContent=capturePaper(outgoing,'right'),backContent=capturePaper(next);
   frontContent.style.left=`calc(var(--paper-width) * ${-(1+i/count)})`;backContent.style.left=`calc(var(--paper-width) * ${-(count-1-i)/count})`;
   const frontShade=document.createElement('div'),backShade=document.createElement('div');frontShade.className=backShade.className='paper-shade';
   frontShade.style.left=`calc(var(--paper-width) * ${-i/count})`;backShade.style.left=`calc(var(--paper-width) * ${-(count-1-i)/count})`;
   front.append(frontContent,frontShade);back.append(backContent,backShade);strip.append(front,back);this.host.append(strip);
   facets.push({strip,frontShade,backShade});backs.push(backContent);
  }
  const cues=backs.flatMap(back=>[...back.querySelectorAll('[data-at]')]);
  const hearts=scene.waves?backs.flatMap(back=>[...back.querySelectorAll('[data-heart]')].map(el=>{const [wave,index]=el.dataset.heart.split('-').map(Number);return {el,at:scene.waves[wave][Math.floor(index/3)]};}).filter(({at:cue})=>cue<=at+turnDuration)):[];
  const balloons=backs.flatMap(back=>[...back.querySelectorAll('.paper-id-balloon-rise')]);
  this.host.querySelectorAll('[data-paper-scroll]').forEach(el=>el.scrollTop=Number(el.dataset.paperScroll));
  Object.assign(turn,{last:performance.now(),preparing:false,facets,shade,cues,hearts,balloons});this.tick(at);
  };
  if(outgoing.querySelector('canvas')||next.querySelector('canvas'))Promise.all([prepareTextures(outgoing,turn),prepareTextures(next,turn)]).then(assemble,assemble);
  else assemble();
 }
 tick(time,moving=true){
  const turn=this.active;if(!turn||turn.preparing)return;
  // Media position updates may arrive in chunks. They still control the song
  // cues, while a bounded visual clock prevents a dropped frame from snapping
  // the paper across the book. Reading, rotation and playback pauses freeze it.
  const now=performance.now();if(moving)turn.elapsed+=Math.min(.05,Math.max(0,(now-turn.last)/1000));turn.last=now;
  const p=clamp(turn.elapsed/turn.duration);this.host.dataset.progress=p.toFixed(4);
  for(const el of turn.cues){const at=Number(el.dataset.at);el.classList.toggle('revealed',time>=at);el.style.setProperty('--reveal',clamp((time-at)/.3));}
  for(const {el,at} of turn.hearts){el.classList.toggle('revealed',time>=at);el.style.setProperty('--heart-reveal',clamp((time-at)/.35));}
  for(const el of turn.balloons)el.style.transform=`translateY(${-Math.max(0,Math.min(16,(time-61.6)*3.5))}%)`;
  if(turn.reduced)this.host.style.opacity=1-easePaper(p);
  else{
   const geometry=paperGeometry(p,turn.facets.length);
   geometry.forEach(({x,z,angle},i)=>{
    const {strip,frontShade,backShade}=turn.facets[i];
    strip.style.transform=`translate3d(${x*turn.facets.length*100}%,0,${z*this.width}px) rotateY(${angle}deg)`;
    const light=Math.sin(angle*Math.PI/180)**2*.32;
    frontShade.style.opacity=light;backShade.style.opacity=light*.75;
   });
   turn.shade.style.opacity=Math.sin(Math.PI*p)**2*.28;
   turn.shade.style.transform=`scaleX(${.3+.7*Math.sin(Math.PI*p)})`;
  }
  if(p===1)this.clear();
 }
}
