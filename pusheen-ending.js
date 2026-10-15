import {EndingFlow,EndingLevel,endingLines} from './ending-flow.js';
import {letterCatAssets,letterFamilyDecorations} from './letter-family.js';
export const endingAssets={pusheenNormal:'assets/pusheen-normal-transparent.png',pusheenGrumpy:'assets/pusheen-grumpy-transparent.png',pusheenHolding:'assets/pusheen-holding-letter-transparent.png',...letterCatAssets};
const clamp=n=>Math.max(0,Math.min(1,n));
const soft=n=>{const p=clamp(n);return p*p*(3-2*p);};
// The native control stays transparent. One textured sheet supplies its surface,
// clipped grain and folds; the matching tail shares the same outer shadow.
const paperBubble=(line,tag='div')=>{
 const bubble=document.createElement(tag);bubble.className='pusheen-bubble';
 const paper=document.createElement('span');paper.className='pusheen-paper';
 const text=document.createElement('span');text.textContent=line;paper.append(text);bubble.append(paper);return bubble;
};
export class PusheenEnding {
 constructor({spread,gift,picture,letter,onReadable,onRestart,onTogglePause,isManuallyPaused}){
  Object.assign(this,{spread,gift,picture,letter,onReadable,onRestart,onTogglePause,isManuallyPaused});
  this.flow=new EndingFlow();this.level=new EndingLevel();this.rendered=-1;this.disposed=false;
 }
 start(){
  if(!this.flow.start())return false;
  this.spread.classList.add('ending-foreground');
  for(const foreground of this.spread.querySelectorAll('.lyric,.final-photos'))foreground.setAttribute('aria-hidden','true');
  this.layer=document.createElement('div');this.layer.className='pusheen-ending';
  this.layer.innerHTML=`<p class="ending-farewell"></p><div class="pusheen-party" aria-hidden="true" hidden><div class="pusheen-body"><img class="pusheen-normal" src="${endingAssets.pusheenNormal}" alt="" draggable="false"><img class="pusheen-grumpy" src="${endingAssets.pusheenGrumpy}" alt="" draggable="false"></div><span class="pusheen-anger">💢</span></div><div class="pusheen-dialogue" data-interactive aria-live="polite" hidden></div>`;
  this.layer.querySelector('.ending-farewell').textContent=endingLines.farewell;
  this.spread.append(this.layer);this.render();return true;
 }
 act(action,revision,value){
  if(this.disposed||!this.flow.act(action,revision,value))return;
  this.render();
 }
 render(){
  const {state,revision}=this.flow;if(revision===this.rendered)return;const previous=this.shownState;this.rendered=revision;this.shownState=state;
  this.layer.dataset.state=state;
  this.layer.classList.toggle('is-grumpy',this.flow.grumpy);
  const dialogue=this.layer.querySelector('.pusheen-dialogue');dialogue.replaceChildren();
  const waiting=['foreground','farewell','pusheenWait'].includes(state);
  this.layer.querySelector('.pusheen-party').hidden=waiting;dialogue.hidden=waiting;
  const prior=this.nameDialog?.querySelector('input');if(prior)this.draft=prior.value;
  this.closeName();
  if(state==='name'){this.openName(revision);return;}
  if(state==='envelope'){this.openEnvelope();return;}
  if(state==='unfold'){this.showLetter();return;}
  if(state==='asideFirst'){
   this.layer.hidden=true;
   this.letterLayer.classList.remove('letter-unfolding');this.letterLayer.querySelector('#letter-sheet').inert=false;
   this.asideBubble.hidden=false;this.letterLayer.querySelector('#letter-sheet').focus({preventScroll:true});this.onReadable();return;
  }
  if(state==='asideSecond'){this.asideBubble.querySelector('.pusheen-paper > span').textContent=endingLines.asideSecond;return;}
  if(state==='asideExit')return;
  if(state==='letter'){this.aside?.remove();this.aside=null;return;}
  const choice=['choicesFirst','choicesSecond'].includes(state),line=choice?(state==='choicesFirst'?endingLines.question:endingLines.reassure):endingLines[state];
  if(!line||state==='farewell')return;
  const bubble=paperBubble(line,choice?'div':'button');
  if(!choice){
   bubble.type='button';bubble.dataset.endingAction='';bubble.dataset.interactive='';
   const cue=document.createElement('small');cue.textContent='tap to continue :3';bubble.querySelector('.pusheen-paper').append(cue);
   bubble.onclick=e=>{e.preventDefault();e.stopPropagation();if(e.detail<=1)this.act('continue',revision);};
  }
  dialogue.append(bubble);
  if(choice){
   const row=document.createElement('div');row.className='pusheen-choices';
   for(const [action,label] of [['ignore','ignore pusheen'],['answer','answer pusheen']]){
    const button=document.createElement('button');button.type='button';button.className='pusheen-choice';button.dataset.interactive='';button.dataset.endingAction='';button.textContent=label;
    button.onclick=e=>{e.preventDefault();e.stopPropagation();if(e.detail<=1)this.act(action,revision);};row.append(button);
   }
   dialogue.append(row);
   if(previous==='name')row.lastElementChild.focus({preventScroll:true});
  }
 }
 openName(revision){
  const dialog=document.createElement('dialog');dialog.className='pusheen-name-window';dialog.dataset.interactive='';dialog.setAttribute('aria-labelledby','name-title');
  dialog.innerHTML='<form id="name-form"><button type="button" class="name-music-toggle" aria-label="Pause the music">Ⅱ</button><button type="button" class="name-close" aria-label="Back to Pusheen choices">×</button><p id="name-title">whats ur name?</p><label for="her-name">write ur name here ♡</label><input id="her-name" name="name" autocomplete="given-name" enterkeyhint="done" spellcheck="false" maxlength="60" required aria-label="Your name"><button type="submit" class="name-done">done ♡</button></form>';
  this.nameDialog=dialog;this.gift.append(dialog);dialog.querySelector('input').value=this.draft??'';
  this.syncNameViewport=()=>{dialog.style.setProperty('--name-height',(window.visualViewport?.height??innerHeight)+'px');dialog.style.setProperty('--name-top',(window.visualViewport?.offsetTop??0)+'px');};
  this.syncNameViewport();window.visualViewport?.addEventListener('resize',this.syncNameViewport);window.visualViewport?.addEventListener('scroll',this.syncNameViewport);
  const close=e=>{e.preventDefault();e.stopPropagation();this.act('close',revision);};
  dialog.querySelector('.name-close').onclick=close;dialog.addEventListener('cancel',close);
  dialog.querySelector('.name-music-toggle').onclick=e=>{e.preventDefault();e.stopPropagation();this.onTogglePause();};
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();e.stopPropagation();this.act('submit',revision,dialog.querySelector('input').value);};
  // The native modal traps focus and remains scrollable when the software
  // keyboard shrinks the visual viewport. A closing tap is fully consumed.
  dialog.showModal();dialog.querySelector('input').focus({preventScroll:true});
 }
 closeName(){
  if(!this.nameDialog)return;
  window.visualViewport?.removeEventListener('resize',this.syncNameViewport);window.visualViewport?.removeEventListener('scroll',this.syncNameViewport);
  this.nameDialog.close();this.nameDialog.remove();this.nameDialog=null;this.syncNameViewport=null;
 }
 openEnvelope(){
  this.layer.classList.add('envelope-arriving');
  const envelope=document.createElement('div');envelope.className='envelope surprise-envelope';envelope.setAttribute('aria-label','Your letter is opening');
  envelope.innerHTML='<div class="envelope-back"></div><div class="envelope-letter-preview" aria-hidden="true"><span>♡</span></div><div class="envelope-top"></div><div class="envelope-front"></div><div class="envelope-address"><p></p></div>';
  envelope.querySelector('p').textContent='To my dearest '+this.flow.name;this.envelope=envelope;this.layer.append(envelope);
 }
 showLetter(){
  const e=document.createElement('section');e.id='ending';e.className='letter-ending letter-unfolding';
  e.innerHTML=`${letterFamilyDecorations()}<article id="letter-sheet" class="letter-sheet" tabindex="0" aria-label="Your love letter" data-interactive><div class="letter-paper-content"><div class="letter-pawprints" aria-hidden="true"></div><div id="letter-text"></div></div></article><div id="restart-wrap" hidden><span class="biting-cat pusheen-holding ambient" aria-hidden="true"><img src="${endingAssets.pusheenHolding}" alt="" draggable="false"></span><button id="restart" class="bubbly" data-interactive>restart gift</button></div>`;
  e.querySelector('#letter-text').textContent=this.letter;this.gift.append(e);this.letterLayer=e;
  e.querySelector('#restart').onclick=()=>this.onRestart();e.querySelector('#letter-sheet').inert=true;this.showAside();this.asideBubble.hidden=true;
 }
 showAside(){
  // onReadable hides the book stage. This quiet, non-interactive companion
  // belongs to the letter layer and sits entirely outside its scrolling sheet.
  const aside=document.createElement('aside');aside.className='pusheen-aside';aside.setAttribute('aria-live','polite');
  const bubble=paperBubble(endingLines.asideFirst);bubble.classList.add('pusheen-aside-bubble');
  const cat=document.createElement('img');cat.src=endingAssets.pusheenNormal;cat.alt='Pusheen';cat.draggable=false;
  aside.append(bubble,cat);this.letterLayer.append(aside);this.aside=aside;this.asideBubble=bubble;
 }
 update(dt,running,audible){
  if(this.disposed)return 1;
  this.flow.tick(dt,running);this.render();const f=this.flow;
  this.spread.style.setProperty('--foreground-opacity',1-clamp(f.elapsed/.55));
  const farewell=this.layer.querySelector('.ending-farewell');farewell.hidden=f.state!=='farewell';
  this.layer.style.setProperty('--farewell-opacity',f.state==='farewell'?1-clamp((f.age-1)/2):0);
  this.layer.style.setProperty('--pusheen-slide',f.pusheenAt===null?0:soft((f.elapsed-f.pusheenAt)/.85));
  if(this.envelope&&f.state==='envelope'){
   const age=f.age,flap=soft((age-.85)/.8);
   this.envelope.style.setProperty('--envelope-enter',soft(age/.75));
   this.envelope.style.setProperty('--flap-open',flap);
   // Change the occlusion at the edge-on hinge position, before extraction.
   // The open flap belongs behind the letter; the pocket stays in front.
   this.envelope.classList.toggle('flap-retracted',flap*175>=90);
   this.envelope.style.setProperty('--letter-rise',soft((age-1.7)/1));
  }
  if(f.state==='unfold'){const unfolding=soft(f.age/.7);this.letterLayer.style.setProperty('--unfold',unfolding);this.layer.style.opacity=1-unfolding;}
  if(this.aside){
   this.aside.style.opacity=f.state==='unfold'?soft(f.age/.7):f.state==='asideExit'?1-soft(f.age/.7):1;
   this.asideBubble.style.opacity=f.state==='asideFirst'||f.state==='asideSecond'?.65+.35*soft(f.age/.18):1;
  }
  for(const control of this.layer.querySelectorAll('[data-ending-action]'))control.disabled=!f.interactive;
  if(this.nameDialog){
   for(const b of this.nameDialog.querySelectorAll('button:not(.name-music-toggle)'))b.disabled=!f.interactive;
   const toggle=this.nameDialog.querySelector('.name-music-toggle'),paused=this.isManuallyPaused();toggle.textContent=paused?'▷':'Ⅱ';toggle.setAttribute('aria-label',paused?'Resume the music':'Pause the music');
  }
  return this.level.update(f.t,f.readable,audible);
 }
 get state(){return {...this.flow.snapshot(),level:this.level.level};}
 dispose(){this.disposed=true;this.closeName();this.layer?.remove();this.letterLayer?.remove();this.spread.classList.remove('ending-foreground');this.spread.style.removeProperty('--foreground-opacity');this.flow.reset();this.level.reset();}
}
