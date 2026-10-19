// One Pointer Events path for touch, pen and mouse. Capture is an optimization:
// document tracking keeps a moving control usable if WebKit transfers or loses it.
export function trackPointer(target, down, callbacks, {capture=true,consume=true}={}) {
 const doc=target.ownerDocument,view=doc.defaultView;
 const scope=new AbortController();
 const options={capture:true,passive:false,signal:scope.signal};
 let active=true,lostCapture=false;
 const matches=e=>active&&e.pointerId===down.pointerId;
 const intercept=e=>{if(typeof consume==='function'?!consume(e):!consume)return;if(e.cancelable)e.preventDefault();e.stopPropagation();};
 const stop=()=>{
  if(!active)return;active=false;scope.abort();
  try{if(capture&&target.hasPointerCapture(down.pointerId))target.releasePointerCapture(down.pointerId);}catch{}
 };
 const finish=(kind,e)=>{stop();callbacks[kind]?.(e);};
 doc.addEventListener('pointermove',e=>{
  if(!matches(e))return;
  intercept(e);
  if(e.pointerType==='mouse'&&e.buttons===0){finish('cancel',e);return;}
  callbacks.move?.(e);
 },options);
 doc.addEventListener('pointerup',e=>{if(matches(e)){intercept(e);finish('end',e);}},options);
 doc.addEventListener('pointercancel',e=>{if(matches(e)){intercept(e);finish('cancel',e);}},options);
 doc.addEventListener('lostpointercapture',e=>{
  // A descendant's implicit capture can be released while capture moves to its
  // control. Neither that transfer nor capture loss is a pointer cancellation.
  if(matches(e)&&e.target===target)lostCapture=true;
 },options);
 view.addEventListener('blur',e=>{if(active)finish('cancel',e);},{signal:scope.signal});
 try{if(capture)target.setPointerCapture(down.pointerId);}catch{}
 return {stop,get active(){return active;},get lostCapture(){return lostCapture;}};
}

// Pointer positions are viewport pixels; the mechanism uses untransformed book
// pixels. Snapshot the inverse linear transform, never the moving photo's box.
export function bookAxes(book) {
 try{
  const m=new DOMMatrix(getComputedStyle(book).transform),det=m.a*m.d-m.b*m.c;
  if(Number.isFinite(det)&&Math.abs(det)>1e-8)return {a:m.d/det,b:-m.b/det,c:-m.c/det,d:m.a/det};
 }catch{}
 return {a:1,b:0,c:0,d:1};
}

export function bookDelta(axes,x,y) {
 return {x:axes.a*x+axes.c*y,y:axes.b*x+axes.d*y};
}
