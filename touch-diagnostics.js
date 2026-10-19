// Opt-in, local-only evidence. It never prepares actions, seeks audio or changes
// the photographs. No names, letter text, pictures or telemetry are collected.
export function createTouchDiagnostics({build,readState}){
 const events=[],samples=[],checks=[],timers=new Set();let lastSample=0,lastScene='',run=0;
 const round=n=>Number.isFinite(n)?Math.round(n*10000)/10000:null;
 const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return Object.fromEntries(['x','y','width','height'].map(k=>[k,round(r[k])]));};
 const translation=transform=>{
  const values=transform.match(/^matrix(3d)?\((.+)\)$/);
  if(!values)return transform==='none'?0:null;
  return Number(values[2].split(',')[values[1]?12:4]);
 };
 const photo=id=>{
  const el=document.getElementById(id);if(!el)return null;
  const css=getComputedStyle(el),width=parseFloat(css.width);
  return {id,rect:rect(el),portrait:rect(el.querySelector('.person-portrait')),image:rect(el.querySelector('.person-photo')),transform:css.transform,translateX:round(translation(css.transform)),width:round(width),joined:css.getPropertyValue('--joined').trim(),transition:css.transition,touchAction:css.touchAction,pointerEvents:css.pointerEvents,inlineTransform:el.style.transform};
 };
 const snapshot=()=>{
  const spread=document.getElementById('spread'),cue=document.getElementById('together-cue');
  return {ms:round(performance.now()),run,...readState(),joined:spread?.style.getPropertyValue('--joined')??null,computedJoined:spread?getComputedStyle(spread).getPropertyValue('--joined').trim():null,pull:spread?.style.getPropertyValue('--pull')??null,cue:cue?{hidden:cue.hidden,disabled:cue.disabled,rect:rect(cue)}:null,photos:[photo('person-left'),photo('person-right')].filter(Boolean)};
 };
 const append=(list,value,max)=>{list.push(value);if(list.length>max)list.shift();};
 function record(type,data={}){
  const entry={type,data,snapshot:snapshot()};append(events,entry,300);
  if(type==='action'){
   const timer=setTimeout(()=>{timers.delete(timer);append(events,{type:'settled-after-action',data,snapshot:snapshot()},300);},300);
   timers.add(timer);
  }
  return entry;
 }
 // Resolve the EXACT current expressions in this browser, at fixed and changing
 // inherited values, without altering the live scene or selecting a workaround.
 function probeTransforms(){
  const host=document.createElement('div');host.setAttribute('aria-hidden','true');
  host.style.cssText='position:fixed;left:-10000px;top:0;width:100px;height:10px;opacity:0;pointer-events:none;';
  const expressions=['translateX(calc(var(--joined)*65%))','translateX(calc(var(--joined)*-65%))'];
  const elements=expressions.map(expression=>{const el=document.createElement('div');el.style.cssText='position:absolute;left:0;top:0;width:100px;height:10px;margin:0;padding:0;border:0;transition:none;';el.style.transform=expression;host.append(el);return el;});
  document.body.append(host);const result=[];
  for(const joined of [0,.25,.8,1,0]){
   host.style.setProperty('--joined',joined);
   result.push({joined,photos:elements.map((el,i)=>{const transform=getComputedStyle(el).transform,x=translation(transform),expected=joined*(i===0?65:-65);return {expression:expressions[i],syntax:CSS.supports('transform',expressions[i]),computed:transform,translateX:x,expected,rect:rect(el),matches:x!==null&&Math.abs(x-expected)<.1};})});
  }
  host.remove();return result;
 }
 const probe=probeTransforms();
 const resources=[];
 async function fingerprint(){
  for(const path of ['index.html','boot.js?v='+build,'app.js?v='+build,'pointer-gesture.js?v='+build,'styles.css','together-scene.css','touch-diagnostics.js?v='+build]){
   try{
    const response=await fetch(path,{cache:'no-store'}),bytes=await response.arrayBuffer();
    const digest=globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join(''):null;
    resources.push({path,status:response.status,bytes:bytes.byteLength,sha256:digest,etag:response.headers.get('etag'),modified:response.headers.get('last-modified')});
   }catch(error){resources.push({path,error:String(error)});}
  }
 }
 fingerprint();
 const listeners=[];
 function listen(target,type,fn,options){target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));}
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture','click','touchstart','touchcancel']){
  listen(document,type,e=>{
   const state=readState();if(state.scene!=='together')return;
   if(e.target.closest?.('[data-touch-diagnostics]'))return;
   if(type==='pointermove'&&performance.now()-lastSample<80)return;
   const target=e.target.closest?.('[id]'),point=Number.isFinite(e.clientX)?{x:round(e.clientX),y:round(e.clientY)}:null;
   const hit=point?document.elementFromPoint(point.x,point.y):null;
   const ancestors=[];
   if(type==='pointerdown'||type==='touchstart')for(let el=e.target;el instanceof Element;el=el.parentElement){const css=getComputedStyle(el);ancestors.push({tag:el.tagName,id:el.id,classes:el.getAttribute('class'),touchAction:css.touchAction,pointerEvents:css.pointerEvents,userSelect:css.userSelect,overflow:css.overflow});}
   record('event',{type,target:target?.id??e.target.tagName,hit:hit?.closest?.('[id]')?.id??hit?.tagName,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:e.isPrimary,detail:e.detail,buttons:e.buttons,cancelable:e.cancelable,defaultPrevented:e.defaultPrevented,trusted:e.isTrusted,point,ancestors});
  },{capture:true,passive:true});
 }
 listen(window,'error',e=>record('error',{message:e.message,file:e.filename,line:e.lineno}),false);
 listen(window,'unhandledrejection',e=>record('rejection',{message:String(e.reason)}),false);
 const interval=setInterval(()=>{
  const state=readState();
  if(state.phase==='welcome'&&lastScene!=='welcome'){
   run++;for(const timer of timers)clearTimeout(timer);timers.clear();
  }
  const key=state.phase==='welcome'?'welcome':state.phase+':'+state.scene;
  if(key!==lastScene){lastScene=key;append(checks,{type:'scene',snapshot:snapshot()},80);}
  if(state.scene==='together'&&state.phase==='story'){lastSample=performance.now();append(samples,snapshot(),320);}
 },100);
 function report(){return {build,createdAt:new Date().toISOString(),userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,visualWidth:window.visualViewport?.width,visualHeight:window.visualViewport?.height},path:location.pathname,loadedScripts:[...document.scripts].map(s=>s.src).filter(Boolean),loadedResources:performance.getEntriesByType('resource').filter(r=>/\.(js|css)(\?|$)/.test(r.name)).map(r=>({url:r.name,transferSize:r.transferSize})),resources,transformProbe:probe,checks,events,samples,current:snapshot()};}
 const box=document.createElement('div');box.dataset.touchDiagnostics='';box.dataset.interactive='';
 box.style.cssText='position:fixed;left:4px;top:4px;z-index:10000;font:12px/1.4 system-ui;color:#fff;';
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='touch trace';toggle.style.cssText='font:12px system-ui;padding:5px 9px;min-height:30px;color:#fff;background:#332533;border:1px solid #b69bad;border-radius:8px;';
 const panel=document.createElement('div');panel.hidden=true;panel.style.cssText='max-width:min(90vw,540px);padding:12px;background:#332533;border:1px solid #b69bad;border-radius:8px;';
 const label=document.createElement('p');label.textContent=build+' · local diagnostic report';label.style.cssText='margin:0 0 8px;';
 const copy=document.createElement('button');copy.type='button';copy.textContent='copy report';
 const download=document.createElement('button');download.type='button';download.textContent='save report';
 const output=document.createElement('textarea');output.readOnly=true;output.setAttribute('aria-label','Touch diagnostic report');output.style.cssText='display:block;width:min(80vw,490px);height:40vh;margin-top:8px;font:11px monospace;touch-action:pan-y;user-select:text;-webkit-user-select:text;';
 for(const button of [copy,download])button.style.cssText='margin-right:8px;min-height:36px;padding:5px 9px;font:13px system-ui;';
 toggle.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)output.value=JSON.stringify(report(),null,2);};
 copy.onclick=async()=>{output.value=JSON.stringify(report(),null,2);try{await navigator.clipboard.writeText(output.value);label.textContent='report copied';}catch{output.focus();output.select();label.textContent='select and copy the report below';}};
 download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='melanina-touch-report.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 panel.append(label,copy,download,output);box.append(toggle,panel);document.body.append(box);
 return {record,report,dispose(){clearInterval(interval);for(const timer of timers)clearTimeout(timer);listeners.forEach(remove=>remove());box.remove();}};
}
