const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const breathPeriod=6.4;
export function breathingPose(time){
 const phase=((time/breathPeriod)%1+1)%1,p=phase<.35?phase/.35:(1-phase)/.65;
 return .5-.5*Math.cos(Math.PI*p);
}
export const moonGround='<div class="lunar-platform" aria-hidden="true"><div class="platform-surface"><img src="assets/lunar-platform.png" alt="" draggable="false"></div><div class="platform-depth"><img src="assets/lunar-platform.png" alt="" draggable="false"></div></div>';
// Bottom coordinates are physical contact points on the shared upper surface.
export const stoneLayout=[
 [12,73,13.5,15],[31,75,14.5,15],[10.5,91,17,17],
 [31.5,94,18,17.5],[73,73,15,16],[86,89,13.5,15.5],[64.5,94,20,18]
];
export function moonForeground(entries){
 const rocks=entries.map(([word,at],i)=>{const [x,base,w,h]=stoneLayout[i];return '<span class="lyric moon-stone" data-at="'+at+'" data-base="'+base+'" style="left:'+x+'%;top:'+(base-h)+'%;width:'+w+'%;height:'+h+'%;--tilt:'+[-2,1,2,-1,1,-2,0][i]+'deg"><i class="stone-contact" aria-hidden="true"></i><img class="stone-art" src="assets/lunar-stone-'+(i+1)+'.png" alt="" draggable="false"><b class="stone-lettering">'+esc(word)+'</b></span>';}).join('');
 return rocks+'<div id="moon-breather" class="moon-breather" role="img" aria-label="A bowed man quietly breathing, his feet planted on the stone platform"><span class="figure-contact" aria-hidden="true"></span><svg class="figure-fallback" viewBox="499 90 303 1090" aria-hidden="true"><image href="assets/bowed-silhouette.png" width="1254" height="1254"/></svg><canvas class="breathing-figure" aria-hidden="true"></canvas></div>';
}
const vertexShader=[
 'attribute vec2 point; varying vec2 uv; uniform vec2 amplitude;',
 'void main(){',
 ' uv=point;',
 // Local chest/back-shoulder envelope. Head, hands, pelvis, legs and feet stay
 // at their source positions; the image has no whole-body scaling/translation.
 ' float band=smoothstep(.095,.22,point.y)*(1.-smoothstep(.29,.36,point.y));',
 ' float chest=1.-smoothstep(.43,.58,point.x);',
 ' float headLock=1.-(1.-smoothstep(.195,.24,point.y))*smoothstep(.25,.34,point.x);',
 ' float weight=band*chest*headLock;',
 ' vec2 moved=point+vec2(-amplitude.x*weight,-amplitude.y*weight);',
 ' gl_Position=vec4(moved.x*2.-1.,1.-moved.y*2.,0.,1.);',
 '}'].join('\n');
const fragmentShader='precision mediump float; varying vec2 uv; uniform sampler2D source; void main(){gl_FragColor=texture2D(source,vec2((499.+uv.x*303.)/1254.,(90.+uv.y*1090.)/1254.));}';
export class MoonBreather{
 constructor(host){
  this.host=host;this.canvas=host.querySelector('canvas');this.fallback=host.querySelector('svg');this.image=new Image();this.time=0;this.startedAt=null;
  this.image.onload=()=>{if(host.isConnected){this.setup();this.update(this.time,true);}};this.image.src='assets/bowed-silhouette.png';
 }
 setup(){
  const gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true});if(!gl)return;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  try{
   const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexShader));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
   const vertices=[],columns=24,rows=90;
   for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=x/columns,b=y/rows,c=(x+1)/columns,d=(y+1)/rows;vertices.push(a,b,c,b,a,d,c,b,c,d,a,d);}
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.image);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);this.gl=gl;this.count=vertices.length/2;this.amplitude=gl.getUniformLocation(program,'amplitude');
   this.host.classList.add('figure-ready');
  }catch(error){console.warn('The lunar silhouette is shown without motion:',error.message);}
 }
 dispose(){this.image.onload=null;this.gl?.getExtension('WEBGL_lose_context')?.loseContext();}
 update(time,initial=false){
  this.time=time;const gl=this.gl;if(!gl)return;
  const h=this.host.clientHeight,w=this.host.clientWidth,scale=Math.min(devicePixelRatio||1,2);
  if(!h||!w)return;const cw=Math.round(w*scale),ch=Math.round(h*scale);
  if(this.canvas.width!==cw||this.canvas.height!==ch){this.canvas.width=cw;this.canvas.height=ch;gl.viewport(0,0,cw,ch);}
  const breath=initial?0:breathingPose(time-(this.startedAt??=time)),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // A small localized shoulder rise and chest expansion, with a longer
  // exhale. The source head, hands, hips, legs and planted feet stay fixed.
  const strength=reduced?.45:1,lift=Math.min(1.8,h*.011)*strength,expansion=Math.min(.65,h*.0038)*strength;
  gl.uniform2f(this.amplitude,expansion*breath/w,lift*breath/h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,this.count);
  this.canvas.dataset.breath=breath.toFixed(5);
 }
}
