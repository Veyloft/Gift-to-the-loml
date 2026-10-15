// One reading surface for the optional welcome note and the existing pink page.
// It never touches the story or media clocks.
export class ReadingSheet {
 constructor(layer){this.layer=layer;this.returnTo=null;this.locked=[];}
 close(){
  if(this.layer.hidden)return;
  this.layer.hidden=true;this.layer.innerHTML='';this.layer.className='';
  for(const element of this.locked)element.inert=false;
  this.locked=[];this.returnTo?.focus({preventScroll:true});this.returnTo=null;
 }
 open({text,label,returnTo,closeLabel,kind=''}){
  this.close();this.returnTo=returnTo;
  const layer=this.layer;let down=null,backdropClick=false;
  layer.className=kind;
  layer.innerHTML='<div class="reading-sheet" role="dialog" aria-modal="true"><button id="close-reading" class="reading-close" data-interactive></button><div id="large-paragraph" class="large-prose" tabindex="0"></div></div>';
  layer.firstElementChild.setAttribute('aria-label',label);
  const prose=layer.querySelector('.large-prose'),close=layer.querySelector('.reading-close');
  prose.textContent=text;close.textContent=closeLabel;layer.hidden=false;
  this.locked=[...layer.parentElement.children].filter(el=>el!==layer&&!el.hidden&&el.tagName!=='AUDIO'&&!el.inert);
  for(const el of this.locked)el.inert=true;
  layer.onpointerdown=e=>{backdropClick=false;down=e.isPrimary&&e.button===0&&e.target===layer?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;};
  layer.onpointermove=e=>{if(down?.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)down=null;};
  layer.onpointercancel=()=>{down=null;backdropClick=false;};
  layer.onpointerup=e=>{backdropClick=down?.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<=8&&document.elementFromPoint(e.clientX,e.clientY)===layer;down=null;};
  layer.onclick=e=>{const dismiss=backdropClick&&e.target===layer;backdropClick=false;if(dismiss){e.preventDefault();e.stopImmediatePropagation();this.close();}};
  layer.onkeydown=e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();}
   if(e.key==='Tab'){
    if(e.shiftKey&&document.activeElement===close){e.preventDefault();prose.focus();}
    else if(!e.shiftKey&&document.activeElement===prose){e.preventDefault();close.focus();}
   }
  };
  close.onclick=()=>this.close();close.focus({preventScroll:true});
 }
}

export const welcomeParagraph='i know i couldn’t make this a real life experience and give you something physical to hold in your hands the way i’ve been wanting to for months, but i refuse to let a little distance stop me from doing something special for you. so i went ahead and made the virtual version of the little book i’ve been dying to make for you, filled with everything i could possibly put into words about how much you mean to me. it may be on a screen instead of in your hands, but every word in it was made with you in mind';
