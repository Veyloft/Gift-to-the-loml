import {assets,pinkParagraph} from './content.js';
import {scenes,startPosition,photoWindow,secondLineCues} from './scene-map.js';
import {Story} from './story.js';
import {PaperTurn,capturePaper} from './paper-turn.js';
import {OpeningBook} from './opening-book.js';
import {heartWaves,bookmarkPose} from './love-scene.js';
import {MoonBreather,moonForeground,moonGround} from './moon-scene.js';
import {MoonSky,moonSkyLayer} from './moon-sky.js';
import {CloudFlow,cloudLayer} from './balloon-clouds.js';
import {FinaleRepeat} from './finale-repeat.js';
import {ReadingSheet,welcomeParagraph} from './reading-sheet.js';
import {TogetherScene,togetherAssets,angelDetails,dragonParty,kissingReaction} from './together-scene.js';
import {PusheenEnding,endingAssets} from './pusheen-ending.js';
import {SongLevel} from './audio-level.js';
import {PageEdgeFlip} from './page-edge.js';
import {catFamilySpread} from './cat-family.js';
let pusheenEnding=null;
let moonBreather=null;
let moonSky=null;
let cloudFlow=null;
let finaleRepeat=null;
let togetherScene=null;
const $=id=>document.getElementById(id),music=$('music'),story=new Story(),pauses=new Set();
const songLevel=new SongLevel(music);
const paperTurn=new PaperTurn($('turn-sheet'));
const bookOpening=new OpeningBook($('book'),$('spread'));
const readingSheet=new ReadingSheet($('reading'));
const pageEdge=new PageEdgeFlip({book:$('book'),cue:$('page-edge-cue'),available:()=>pageFlipReady()&&$('reading').hidden&&[...pauses].every(r=>r==='gate'),key:()=>story.gate?.id,flip:()=>prepareCurrent('flip')});
$('welcome-note').onclick=()=>{if(phase==='welcome')readingSheet.open({text:welcomeParagraph,label:'A little note for you',returnTo:$('welcome-note'),closeLabel:'back to ur gift ♡',kind:'welcome-reading'});};
let phase='welcome',letter='',ready=false,openedAt=null,restartTimer=null,holdTimer=null,holdPointer=null,drag=null,canvas=null,ctx=null,ambient=0,lastFrame=0,playbackGeneration=0,lastPlaybackPosition=startPosition,mediaNeedsReload=false,mechanismTime=0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const picture=(name,cls='',extra='')=>['moon','rock','cat','bitingCat'].includes(name)?`<span class="sprite sprite-${name} ${cls}" aria-hidden="true"><img src="${assets[name]}" alt="" draggable="false"></span>`:`<img src="${assets[name]}" class="${cls}" alt="" draggable="false" ${extra}>`;
function heart(i,wave=0){const [x,y,size,tilt]=heartWaves[wave][i];return `<div class="love-heart" data-heart="${wave}-${i}" style="left:${x}%;top:${y}%;--heart-size:${size}%;--tilt:${tilt}deg;--color:${['#f9b4d1','#c84475','#ec689b','#ffdce4'][(i+wave)%4]}"><svg class="heart-cutout" viewBox="0 0 100 92" aria-hidden="true"><path d="M50 88C36 74 0 48 3 23C6 0 35-4 50 15C64-4 94 2 97 23C100 48 70 71 50 88Z"/></svg><span>love</span></div>`;}
function words(scene,entries=scene.words){return entries.map(([word,at,x,y],i)=>`<span class="lyric ${scene.id==='moon'?'rock':'paper-word'}" data-at="${at}" ${['pink','eyes'].includes(scene.id)?`data-word="${esc(word)}"`:''} style="left:${x}%;top:${y}%;--tilt:${(i%3-1)*5}deg">${scene.id==='moon'?picture('rock','rock-image')+'<i class="rock-edge"></i>':''}<b>${esc(word)}</b></span>`).join('');}
const pull=extra=>`<button id="pull" class="pull-control ${extra}" data-interactive hidden aria-label="${extra==='blue-tab'?'Drag the blue tab upward':'Pull the bookmark downward'}"><i aria-hidden="true">${extra==='blue-tab'?'↑':'↓'}</i><span>${extra==='blue-tab'?'Drag up :D':'pull down milo :p'}</span>${extra==='blue-tab'?'<small aria-hidden="true">&nbsp;</small>':''}</button>`;
function renderScene(){
 moonBreather?.dispose();
 moonSky?.dispose();
 cloudFlow?.dispose();
 finaleRepeat?.dispose();
 togetherScene?.dispose();
 const scene=story.scene;$('spread').className=`spread ${scene.theme}`;$('spread').style.cssText='';
 const compositions={
 blue:()=>`<div class="page"><canvas id="mechanism" aria-hidden="true"></canvas></div><div class="page"><div class="blue-link" aria-hidden="true"></div><div class="pull-frame"><div id="blue-card"><span class="paper-word">AM I<br>SUPPOSED<br>TO?</span><span class="blue-okay">OKAY…</span></div></div>${pull('blue-tab')}</div>`,
 love:()=>`<div class="page heart-page"><div class="bookmark-mechanism"><div id="sex-bookmark"><span>SEX</span></div>${pull('love-tab')}</div><div class="heart-waves">${heartWaves.map((wave,k)=>wave.map((_,i)=>heart(i,k)).join('')).join('')}</div></div><div class="page"><div class="photo-mount">${picture('photo1','personal-photo rotate-minus')}<span class="tiny-heart" aria-hidden="true">♡</span></div></div>`,
 moon:()=>`${moonGround}<div class="star-field" aria-hidden="true">${Array.from({length:65},(_,i)=>`<i style="left:${(i*31+5)%99}%;top:${(i*47+7)%97}%;--star:${i%3+1}px"></i>`).join('')}</div>${moonSkyLayer()}<div class="lunar-pop">${picture('moon','moon-art ambient')}</div>${moonForeground(scene.words)}`,
 spiral:()=>`<canvas id="mechanism" aria-hidden="true"></canvas><div class="linked-strip" aria-hidden="true"></div><canvas id="spiral-core" aria-hidden="true"></canvas>${words(scene)}`,
 eyes:()=>`<div class="eye-border" aria-hidden="true">♡ ✧ ♡ ✧</div><div class="eye-frame">${picture('photo2','eyes-photo')}${words(scene,scene.words.filter(([word])=>word==='soul'))}</div>${words(scene,scene.words.filter(([word])=>word!=='soul'))}`,
 flowers:()=>`<div class="bouquet-paper-poetry" aria-hidden="true">
 <article><h3>Small news, big crush</h3><p>You have become my favourite interruption, the little smile between two ordinary thoughts. I try to act sensible, then you look at me and there goes the whole plan. If being distracted by you were a profession, baby, I would never take a day off.</p><p>Let me steal a minute, a glance, a kiss that takes its time. Let the world hurry somewhere else. I would rather learn the shape of your laughter, the way your cheeks warm, the quiet language of your hand resting in mine.</p><p>There is a seat beside me that keeps your name. There is a thought of you tucked into every pocket. Come closer, pretty girl. I have a very small secret: all this tenderness has been flirting with you from the beginning.</p></article>
 <article><h3>Forecast: butterflies</h3><p>The forecast is soft skies and a dangerous chance of missing you. Your smile has been causing butterflies again. They are terribly bad at keeping quiet, especially when you say my name like it belongs somewhere warm.</p><p>I would bring you flowers for no occasion, simply because you walked into the day and made it worth celebrating. One for your eyes, one for that little grin, one for every time I meant to be smooth and forgot my own sentence.</p><p>If the moon asks why I am smiling, I will blame you. If the stars ask what I am wishing for, I will tell them to mind their business. It is only a little wish: your head on my shoulder, your fingers in my hair, and nowhere important to be.</p></article>
 <article><h3>A very serious distraction</h3><p>I was going to write something clever. Then I pictured your face and every clever word turned into come here. So come here, darling. Let me admire you with the sort of attention that makes the rest of the room feel very far away.</p><p>You are the soft part of my stubborn days, the lovely trouble in my careful plans. I like you in the morning light, in sleepy little messages, in all the moments when you are simply yourself and somehow that is everything.</p><p>Keep a little space for me beside your smile. I will fill it with bad jokes, warm hands, and kisses I have been saving. I cannot promise to stop staring. I can promise that, every time you catch me, I will still be thinking how pretty you are.</p></article>
 <article><h3>A love across the margins</h3><p>The miles have terrible timing, always standing between me and the kiss I owe you. Still, you manage to feel close. A little message from you and suddenly the day has warmer corners, as though your voice left the door open for sunlight.</p><p>I fold a thought of you into these pages. Not a grand announcement, just a quiet invitation: let me be your favourite hello, the hand you look for, the person who makes room for all your moods and still asks for one more kiss.</p><p>Until I can hold you, let this paper do a little flirting for me. Let the flowers lean your way. Let every crease carry the same sweet news: I miss you, I want you near, and I am smiling like a fool because you exist.</p></article>
 </div><div class="bouquet-layout"><div class="bouquet ambient">${picture('flowers','flower-art')}</div></div>
 <div class="bouquet-poem bouquet-poem-left"><p>roses are red,<br>the sky can be pink,<br>i love you so much<br>i forgot how to think.</p></div>
 <figure class="bouquet-photo"><img src="${assets.bouquetPhoto}" class="bouquet-portrait" alt="Melanie holding her plush toy" draggable="false"></figure>
 <div class="bouquet-poem bouquet-poem-right"><p>And I’ll meet you<br>in my dreams<br>somewhere only<br>the two of us know<br>in the meadow<br>beyond the stream<br>where the wild<br>roses grow</p></div>
 <div class="bouquet-roses" aria-hidden="true">${[[8.5,13,14.8,-18,0],[25,62,9,-6,-5.1],[91.3,34,7.4,20,-2.7]].map(([x,y,size,tilt,delay])=>`<span class="bouquet-rose" style="left:${x}%;top:${y}%;width:${size}%;--rose-tilt:${tilt}deg;--rose-delay:${delay}s">${picture('redRose','rose-art ambient')}</span>`).join('')}</div>${words(scene)}`,
 balloons:()=>`${cloudLayer()}<div id="balloon-rise"><div class="balloon-drift ambient">${picture('balloons','balloon-art')}</div></div>${words(scene)}`,
 ours:()=>`${catFamilySpread(assets)}${words(scene)}`,
 together:()=>`<div class="page pair-left"><div class="small-hearts" aria-hidden="true">${Array.from({length:48},(_,i)=>`<span style="--color:${['#d62c5f','#f183ac','#e9a746'][i%3]}">♥</span>`).join('')}</div></div><div class="page pair-right"><div class="gold-aura" aria-hidden="true"></div></div><div class="pair-lyrics">AND YOU TOO DIVINE<br><span>TO JUST BE <b class="mine-word">MINE</b></span></div><div id="pair-strip" aria-hidden="true"></div>${dragonParty()}<button id="person-left" class="person person-left" data-interactive aria-label="Bring the photos closer"><span class="person-portrait">${picture('photo3','person-photo')}${kissingReaction()}</span></button><button id="person-right" class="person person-right" data-interactive aria-label="Bring the photos closer"><span class="person-portrait">${angelDetails()}${picture('photo4','person-photo')}</span></button><button id="together-cue" class="together-cue" data-interactive hidden><span class="closer-character" aria-hidden="true"><img src="${togetherAssets.closerCharacter}" alt="" draggable="false"></span><span class="closer-label">bring us closer :3</span></button>`,
 pink:()=>`<div class="page pink-lyrics">${words(scene)}</div><div class="page pink-prose"><div class="reference-panel"><div class="open-flap" aria-hidden="true"></div><button id="expand" data-interactive aria-label="Enlarge this paragraph"><span id="pink-text"></span><span class="read-hint">tap to read ♡</span></button></div></div>`,
 finale:()=>`<div class="purple-doodles" aria-hidden="true">♡ ✧ ♡ ✧ ♡</div>${words(scene)}<div class="final-photos">${[5,6,7].map(n=>`<div id="final-photo-${n}" class="final-photo">${picture('photo'+n,n===5?'rotate-minus':'rotate-plus')}<span>♡</span></div>`).join('')}</div>`
 };
 $('spread').innerHTML=compositions[scene.id]();
 moonBreather=scene.id==='moon'?new MoonBreather($('moon-breather')):null;
 moonSky=scene.id==='moon'?new MoonSky($('spread').querySelector('.moon-sky'),mechanismTime):null;
 cloudFlow=scene.id==='balloons'?new CloudFlow($('cloud-flow'),mechanismTime):null;
 finaleRepeat=scene.id==='finale'?new FinaleRepeat($('spread'),secondLineCues,photoWindow.photos.at(-1)+.24):null;
 togetherScene=scene.id==='together'?new TogetherScene($('spread')):null;
 if(scene.id==='pink'){$('pink-text').textContent=pinkParagraph;$('expand').onclick=expandParagraph;}
 if($('pull'))bindDrag($('pull'),scene.id==='blue'?'up':'down');
 if(scene.id==='together')for(const id of ['person-left','person-right','together-cue'])bindDrag($(id),id==='person-right'?'left':'right');
 canvas=$('mechanism');ctx=canvas?.getContext('2d');if(canvas)resizeCanvas();updateVisuals();
}
function resizeCanvas(){const transform=$('book').style.transform;if(bookOpening.active)$('book').style.transform='';paperTurn.resize();if(bookOpening.active){bookOpening.resize();$('book').style.transform=transform;};if(!canvas)return;const s=Math.min(devicePixelRatio||1,2);for(const c of [canvas,$('spiral-core')].filter(Boolean)){const r=bookOpening.active?{width:$('book').clientWidth/2,height:$('book').clientHeight}:c.getBoundingClientRect();c.width=Math.ceil(r.width*s);c.height=Math.ceil(r.height*s);}if(paperTurn.active||bookOpening.active)drawMechanism();}
function drawMechanism(){
 if(!ctx)return;const c=ctx,w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);
 if(story.scene.id==='blue'){
 c.fillStyle='#9ccadb';c.fillRect(0,0,w,h);
 const max=Math.max(w,h)*1.4;
 for(let j=0;j<2;j++){c.beginPath();for(let a=0;a<Math.PI*25;a+=.035){const r=a/(Math.PI*25)*max+j*w*.014,theta=a+mechanismTime*.025,px=w*.5+Math.cos(theta)*r*(1+.018*Math.sin(a*6)),py=h*.64+Math.sin(theta)*r;a===0?c.moveTo(px,py):c.lineTo(px,py);}c.strokeStyle=['#286283','#fff0d8'][j];c.lineWidth=Math.max(3,w*(j===0?.027:.014));c.lineCap='round';c.stroke();}
 }else{
 const cx=w*.76,cy=h*.46;c.fillStyle='#f7eddd';c.fillRect(0,0,w,h);
 for(let i=0;i<16;i++){c.beginPath();c.moveTo(cx,cy);for(let r=0;r<Math.max(w,h)*1.8;r+=4){const a=i*Math.PI/8+.8*Math.log(1+r/Math.max(w,h)*3)+mechanismTime*.18;c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}for(let r=Math.max(w,h)*1.8;r>=0;r-=4){const a=(i+.58)*Math.PI/8+.8*Math.log(1+r/Math.max(w,h)*3)+mechanismTime*.18;c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}c.fillStyle='#242229';c.fill();}
 for(let i=0;i<4;i++){const p=(i/4+mechanismTime*.07)%1;c.beginPath();c.ellipse(cx,cy,w*.21*(1-p)+3,h*.4*(1-p)+3,0,0,Math.PI*2);c.strokeStyle='#0003';c.lineWidth=Math.max(2,w*.005);c.stroke();}
  const core=$('spiral-core');if(core){const cc=core.getContext('2d'),size=h*.73;cc.clearRect(0,0,core.width,core.height);cc.drawImage(canvas,cx-size/2,cy-size/2,size,size,0,0,core.width,core.height);}
 }
}
function setPause(reason,on){on?pauses.add(reason):pauses.delete(reason);if(on)music.pause();syncPauseUI();}
function syncPauseUI(){const freeze=[...pauses].some(r=>r!=='gate');$('gift').classList.toggle('frozen',freeze);$('pause').textContent=pauses.has('manual')?'▷':'Ⅱ';$('pause').setAttribute('aria-label',pauses.has('manual')?'Resume the music':'Pause the music');}
async function play(){if(pauses.size||phase==='opening')return;const generation=playbackGeneration;try{await songLevel.unlock();if(generation!==playbackGeneration||pauses.size)return;await music.play();if(generation===playbackGeneration&&!pauses.size)$('resume-layer').hidden=true;}catch(error){if(generation!==playbackGeneration||phase==='welcome'||pauses.size||error.name==='AbortError')return;setPause('interrupted',true);showResume('tap to keep going ♡');}}
function showResume(message='right where we left it'){$('resume-note').textContent=message;$('resume-layer').hidden=false;}
function orientation(){const portrait=matchMedia('(orientation:portrait)').matches,gated=['welcome','opening','story'].includes(phase);$('orientation').hidden=!portrait||!gated;if(['opening','story'].includes(phase)&&portrait){setPause('orientation',true);cancelGesture();}else if(pauses.has('orientation')){setPause('orientation',false);setPause('interrupted',true);showResume();}resizeCanvas();moonSky?.resize();cloudFlow?.resize();finaleRepeat?.resize();}
function prepareCurrent(action){const g=story.gate;if(phase!=='story'||!g||g.action!==action||pauses.has('orientation')||pauses.has('manual'))return false;if(!story.prepare(g.id))return false;updateVisuals();if(story.waiting===g.id){step(story.time);if(!pauses.size)play();}return true;}
function bindDrag(target,direction){
 const expectedAction=target.classList.contains('person')||target.id==='together-cue'?'together':'pull';
 const move=e=>{if(!drag||drag.id!==e.pointerId||drag.target!==target)return;const d=direction==='up'?drag.y-e.clientY:direction==='down'?e.clientY-drag.y:direction==='left'?drag.x-e.clientX:e.clientX-drag.x;drag.p=clamp(d/drag.distance,0,1);$('spread').style.setProperty('--pull',drag.p);if(story.scene.id==='together')togetherScene?.movement(drag.p);target.classList.toggle('pull-ready',drag.p>=.75);e.preventDefault();};
 target.addEventListener('pointerdown',e=>{const g=story.gate;if(drag||!e.isPrimary||e.button!==0||!g||g.action!==expectedAction||!story.available()||[...pauses].some(r=>r!=='gate')||story.prepared.has(g.id))return;e.preventDefault();e.stopPropagation();const distance=clamp((story.scene.id==='love'?$('book').clientHeight:$('book').getBoundingClientRect().height)*.13,36,80);target.setPointerCapture(e.pointerId);drag={id:e.pointerId,gate:g.id,target,direction,x:e.clientX,y:e.clientY,p:0,distance};if(story.scene.id==='together')togetherScene?.beginAttempt();if(story.scene.id!=='love')$('spread').style.setProperty('--drag-distance',distance+'px');target.classList.add('dragging');$('spread').classList.add('dragging-mechanism');});
 target.addEventListener('pointermove',move);
 target.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId||drag.target!==target)return;move(e);const d=drag;cancelGesture();if(d.p>=.75&&story.gate?.id===d.gate)prepareCurrent(expectedAction);});
 const cancel=e=>{if(drag?.id===e.pointerId&&drag.target===target)cancelGesture();};
 target.addEventListener('pointercancel',cancel);target.addEventListener('lostpointercapture',cancel);target.addEventListener('click',e=>{if(e.detail===0)prepareCurrent(expectedAction);});
}
function cancelGesture(){pageEdge.cancel();if(drag){const d=drag;drag=null;d.target.classList.remove('dragging','pull-ready');$('spread').classList.remove('dragging-mechanism');$('spread').style.setProperty('--pull',0);try{if(d.target.hasPointerCapture(d.id))d.target.releasePointerCapture(d.id);}catch{}}clearTimeout(holdTimer);if(holdPointer!==null){holdPointer=null;setPause('hold',false);}}
function pageFlipReady(){const g=story.gate;return phase==='story'&&g?.action==='flip'&&story.available()&&!story.prepared.has(g.id)&&!paperTurn.active&&!drag;}
function step(t){
 if(phase!=='story')return;const result=story.tick(t);
 if(result.kind==='wait'){if(!pauses.has('gate')){setPause('gate',true);music.currentTime=result.at;story.time=result.at;}}
 else if(result.kind==='complete'||result.kind==='page'){setPause('gate',false);if(result.kind==='page')turnPage(result.previous);if(!pauses.size&&music.paused)play();}
 // Verified against the supplied MP3: the second final "you" ends at 83.46s.
 if(story.scene.id==='finale'&&t>=photoWindow.secondLineEnd)startPusheenEnding();
}
function turnPage(previous){const old=capturePaper($('spread'));paperTurn.clear();renderScene();drawMechanism();paperTurn.begin(old,$('spread'),story.time,story.scene);$('turn-sheet').dataset.theme=scenes[previous].theme;}
function updateVisuals(){
 if(phase!=='story')return;const t=story.time,g=story.gate,available=story.available(),prepared=g&&story.prepared.has(g.id);
 for(const el of $('spread').querySelectorAll('[data-at]')){const at=Number(el.dataset.at);el.classList.toggle('revealed',t>=at);el.style.setProperty('--reveal',clamp((t-at)/.3,0,1));}
 pageEdge.update(pageFlipReady());
 const pb=$('pull');if(pb){const love=story.scene.id==='love',consumed=story.scene.id==='blue'&&story.completed.has('blue-pull'),pullAvailable=g?.action==='pull'&&available;pb.hidden=love?t<story.scene.gates[0].at-story.scene.gates[0].lead:!pullAvailable&&!consumed;pb.classList.toggle('prepared',g?.action==='pull'&&!!prepared);pb.classList.toggle('consumed',consumed);pb.disabled=!!prepared||consumed||(love&&!pullAvailable);pb.classList.toggle('pulse',!love&&g?.action==='pull'&&!prepared&&g.at-t<.35);}
 const tc=$('together-cue');if(tc){tc.hidden=!(g?.action==='together'&&available);tc.classList.toggle('prepared',!!prepared);tc.disabled=!!prepared;}
 $('book').classList.toggle('waiting',!!story.waiting);
 if(story.scene.id==='blue'){$('blue-card').classList.toggle('pulled',story.completed.has('blue-pull')&&t<32.50);$('spread').style.setProperty('--prepared-pull',g?.action==='pull'&&prepared?1:0);$('spread').style.setProperty('--blue-travel',story.completed.has('blue-pull')?1-clamp((t-32.15)/.35,0,1):0);$('spread').style.setProperty('--blue-open',story.completed.has('blue-pull')?clamp((t-30.96)/.32,0,1)*(1-clamp((t-32.15)/.35,0,1)):0);}
 if(story.scene.id==='love'){
 story.scene.waves.forEach((wave,k)=>{for(let i=0;i<18;i++){const el=$('spread').querySelector(`[data-heart="${k}-${i}"]`);const at=wave[Math.floor(i/3)];el.classList.toggle('revealed',t>=at);el.style.setProperty('--heart-reveal',clamp((t-at)/.35,0,1));}});
 const pose=bookmarkPose({time:t,firstAt:story.scene.gates[0].at,secondAt:story.scene.gates[1].at,firstDone:story.completed.has('love-pull-1'),secondDone:story.completed.has('love-pull-2'),prepared:g?.action==='pull'&&prepared,drag:drag?.p??0,gateAt:g?.action==='pull'?g.at:null});$('spread').style.setProperty('--sex-reveal',pose.retract);$('spread').style.setProperty('--sex-ink',pose.inkReady?1:0);$('spread').classList.toggle('second-wave',t>=story.scene.waves[1][0]);$('spread').style.setProperty('--prepared-pull',g?.action==='pull'&&prepared?1:0);
 }
 if(story.scene.id==='together'){$('spread').style.setProperty('--joined',story.completed.has('together-pull')?1:(prepared?.valueOf()? .8:(drag?.p??0)*.8));togetherScene?.update(t,story.completed.has('together-pull'));}
 if(story.scene.id==='balloons')$('balloon-rise').style.transform=`translateY(${-clamp((t-61.6)*3.5,0,16)}%)`;
 if(story.scene.id==='finale'){photoWindow.photos.forEach((at,i)=>{const p=clamp((t-at)/.24,0,1),el=$('final-photo-'+(i+5));el.classList.toggle('revealed',p>0);el.style.setProperty('--appear',p);});$('spread').classList.toggle('second-line',t>=photoWindow.secondLineStart);if(t>=photoWindow.secondLineStart){[...$('spread').querySelectorAll('.lyric')].forEach((el,i)=>{el.classList.toggle('sung-again',t>=secondLineCues[i]);});}}
 paperTurn.tick(t,!$('gift').classList.contains('frozen')&&music.readyState>=2&&!music.seeking);
}
function frame(now){
 const elapsed=lastFrame?(now-lastFrame)/1000:0,dt=Math.min(elapsed,.06);lastFrame=now;
 if(!$('gift').classList.contains('frozen')){ambient+=dt;if(phase==='story'&&!paperTurn.active)mechanismTime+=dt;}
 if(!['welcome','opening'].includes(phase)&&!pauses.has('interrupted')&&!pauses.has('loading')&&music.readyState>=2&&!music.seeking)lastPlaybackPosition=music.currentTime;
 if(phase==='opening'&&bookOpening.tick(dt,!$('gift').classList.contains('frozen')&&music.readyState>=2&&!music.seeking)){
  phase='story';music.currentTime=startPosition;lastPlaybackPosition=startPosition;music.muted=false;$('pause').hidden=false;updateVisuals();play();
 }
 if(pusheenEnding){const running=!pauses.size&&!music.paused&&music.readyState>=2&&!music.seeking;songLevel.set(pusheenEnding.update(elapsed,running,songLevel.state.audibleLevel));}
 if(phase==='story'){
  const canAdvance=music.readyState>=2&&!music.seeking&&(!pauses.size||pauses.size===1&&pauses.has('gate'));
  if(canAdvance){step(music.currentTime);story.time=music.currentTime;}
  updateVisuals();if(!paperTurn.active){drawMechanism();if(story.scene.id==='moon'){moonBreather?.update(mechanismTime);moonSky?.update(mechanismTime);}if(story.scene.id==='balloons')cloudFlow?.update(mechanismTime);if(story.scene.id==='finale')finaleRepeat?.update(story.time);}
 }
 if(phase==='letter'&&openedAt!==null&&Date.now()-openedAt>=15000)$('restart-wrap').hidden=false;
 requestAnimationFrame(frame);
}
function expandParagraph(){
 readingSheet.open({text:pinkParagraph,label:'Our pink paragraph',returnTo:$('expand'),closeLabel:'back to our book ♡'});
}
function startPusheenEnding(){
 if(phase!=='story'||pusheenEnding)return;
 readingSheet.close();finaleRepeat?.dispose();finaleRepeat=null;cancelGesture();
 phase='ending';pageEdge.update(false);pauses.delete('gate');
 pusheenEnding=new PusheenEnding({spread:$('spread'),gift:$('gift'),picture,letter,onRestart:reset,onTogglePause:()=>$('pause').click(),isManuallyPaused:()=>pauses.has('manual'),onReadable:()=>{
  phase='letter';openedAt=Date.now();$('stage').hidden=true;
  const generation=playbackGeneration;clearTimeout(restartTimer);
  restartTimer=setTimeout(()=>{if(generation===playbackGeneration&&phase==='letter')$('restart-wrap').hidden=false;},15000);
  orientation();
 }});
 pusheenEnding.start();orientation();syncPauseUI();
}
function reset(){readingSheet.close();pusheenEnding?.dispose();pusheenEnding=null;songLevel.reset();togetherScene?.dispose();togetherScene=null;finaleRepeat?.dispose();finaleRepeat=null;cloudFlow?.dispose();cloudFlow=null;moonSky?.dispose();moonSky=null;bookOpening.clear();music.muted=false;playbackGeneration++;music.pause();music.currentTime=startPosition;lastPlaybackPosition=startPosition;mediaNeedsReload=false;clearTimeout(restartTimer);clearTimeout(holdTimer);cancelGesture();pauses.clear();story.reset();phase='welcome';openedAt=null;ambient=0;mechanismTime=0;$('ending')?.remove();paperTurn.clear();$('reading').hidden=true;$('reading').innerHTML='';$('stage').hidden=true;$('welcome').hidden=false;$('pause').hidden=true;$('resume-layer').hidden=true;$('spread').innerHTML='';$('spread').className='spread';$('spread').style.cssText='';$('gift').classList.remove('frozen');orientation();}
async function preload(){ready=false;$('start').disabled=true;$('load-note').textContent='getting ur gift ready…';try{const source=await fetch('letter.txt');if(!source.ok)throw Error('letter');letter=await source.text();await Promise.all(Object.values({...assets,...togetherAssets,...endingAssets}).concat([...document.querySelectorAll("#welcome img")].map(el=>el.getAttribute("src")),["assets/cover-paper-texture.jpg","assets/cover-berry-spine.jpg","assets/cover-start-paper.png","assets/cover-plum-texture.jpg"]).map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>img.decode().then(resolve,reject);img.onerror=reject;img.src=src;})));await document.fonts.load('32px "Lilita One"');await document.fonts.ready;if(music.readyState<2)await new Promise((resolve,reject)=>{music.addEventListener('canplay',resolve,{once:true});music.addEventListener('error',reject,{once:true});music.load();});ready=true;$('start').disabled=false;$('load-note').textContent='made with all my love';}catch{$('load-note').textContent='a little hiccup — tap to try loading again ♡';$('load-note').onclick=preload;}}
$('start').onclick=()=>{
 if(!ready||phase!=='welcome'||!$('reading').hidden||matchMedia('(orientation:portrait)').matches)return;
 const generation=++playbackGeneration;phase='opening';music.currentTime=startPosition;lastPlaybackPosition=startPosition;
 // Unlock the already-loaded media during the click, silently. Keep both the
 // song clock and the interaction gates held until the board has landed.
 music.muted=true;const unlocked=Promise.all([songLevel.unlock(),music.play()]);
 const origin=bookOpening.capture(document.querySelector('.closed-book'));
 $('welcome').hidden=true;$('stage').hidden=false;renderScene();drawMechanism();bookOpening.begin(origin);
 $('pause').hidden=true;syncPauseUI();
 unlocked.then(()=>{if(generation!==playbackGeneration||phase!=='opening')return;music.pause();music.currentTime=startPosition;}).catch(error=>{if(generation!==playbackGeneration||phase==='welcome'||error.name==='AbortError')return;setPause('interrupted',true);showResume('tap to start the music ♡');});
};
$('pause').onclick=()=>{if(pauses.has('manual')){setPause('manual',false);play();}else setPause('manual',true);};
$('resume').onclick=async()=>{
 if(music.error||mediaNeedsReload){
  const position=phase==='story'?story.time:lastPlaybackPosition;
  setPause('loading',true);$('resume-note').textContent='bringing the music back…';
  try{
   await new Promise((resolve,reject)=>{
    const fail=()=>{cleanup();reject(Error('audio'));};
    const loaded=()=>{try{music.currentTime=position;}catch{}cleanup();resolve();};
    const timeout=setTimeout(fail,15000);
    const cleanup=()=>{clearTimeout(timeout);music.removeEventListener('loadedmetadata',loaded);music.removeEventListener('error',fail);};
    music.addEventListener('loadedmetadata',loaded,{once:true});music.addEventListener('error',fail,{once:true});music.load();
   });
  }catch{setPause('loading',false);showResume('tap to try the music again ♡');return;}
  mediaNeedsReload=false;setPause('loading',false);
 }
 setPause('interrupted',false);$('resume-layer').hidden=true;play();
};
$('book').addEventListener('pointerdown',e=>{if(phase!=='story'||['love','together','pink','blue'].includes(story.scene.id)||e.target.closest('[data-interactive],button,input')||story.turning)return;holdPointer=e.pointerId;holdTimer=setTimeout(()=>{if(holdPointer===e.pointerId)setPause('hold',true);},350);});
$('gift').addEventListener('pointerdown',e=>{if(!['ending','letter'].includes(phase)||!e.isPrimary||e.button!==0||e.target.closest('[data-interactive],button,input,dialog,.letter-sheet'))return;holdPointer=e.pointerId;holdTimer=setTimeout(()=>{if(holdPointer===e.pointerId)setPause('hold',true);},350);});
addEventListener('pointerup',e=>{if(holdPointer!==e.pointerId)return;clearTimeout(holdTimer);holdPointer=null;if(pauses.has('hold')){setPause('hold',false);play();}});
addEventListener('pointercancel',()=>{const held=pauses.has('hold');cancelGesture();if(held)play();});
addEventListener('resize',orientation);addEventListener('orientationchange',()=>{if(['opening','story'].includes(phase)){setPause('orientation',true);cancelGesture();}requestAnimationFrame(()=>requestAnimationFrame(orientation));});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase!=='welcome'){cancelGesture();setPause('interrupted',true);}else if(pauses.has('interrupted'))showResume();});
music.addEventListener('waiting',()=>{if(phase==='story')$('gift').classList.add('frozen');});music.addEventListener('playing',syncPauseUI);
music.addEventListener('emptied',()=>{if(phase!=='welcome'&&!pauses.has('loading')){mediaNeedsReload=true;setPause('interrupted',true);showResume('tap to bring the music back ♡');}});
music.addEventListener('error',()=>{if(phase!=='welcome'){setPause('interrupted',true);showResume('the music needs a little retry ♡');}});
music.addEventListener('pause',()=>{if(!['welcome','opening'].includes(phase)&&!pauses.size&&!music.ended&&!music.seeking){setPause('interrupted',true);showResume();}});
music.addEventListener('ended',()=>{if(['ending','letter'].includes(phase)){music.currentTime=0;lastPlaybackPosition=0;if(!pauses.size)play();}});
addEventListener('keydown',e=>{if(e.key==='Escape'){if(drag||pageEdge.gesture)cancelGesture();if(!$('reading').hidden)$('close-reading')?.click();}});
orientation();preload();requestAnimationFrame(frame);
Object.defineProperty(window,'melanina',{value:{get state(){return {...story.snapshot(),phase,pauses:[...pauses],ready,openedAt,openingProgress:bookOpening.active?bookOpening.active.elapsed/(bookOpening.active.reduced?.45:2.05):null,audioTime:music.currentTime,playing:!music.paused,ending:pusheenEnding?.state??null,audioLevel:songLevel.state};},get letter(){return letter;}}});
