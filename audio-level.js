// Keep the same media element, source and gain for every playthrough, including
// iOS, where the media element's volume property alone does not provide fades.
export class SongLevel {
 constructor(media){this.media=media;this.context=null;this.source=null;this.gain=null;this.level=1;}
 unlock(){
  if(!this.context){
   const Context=window.AudioContext||window.webkitAudioContext;
   if(!Context)return Promise.resolve();
   this.context=new Context();this.gain=this.context.createGain();
   this.source=this.context.createMediaElementSource(this.media);
   this.source.connect(this.gain);this.gain.connect(this.context.destination);
   this.media.volume=1;this.gain.gain.value=this.level;
  }
  return this.context.state==='running'?Promise.resolve():this.context.resume();
 }
 set(value){
  const next=Math.max(.3,Math.min(1,value));
  if(Math.abs(this.level-next)<.00001)return;
  this.level=next;
  if(this.gain){
   const now=this.context.currentTime,param=this.gain.gain;
   // Short audio-rate smoothing bridges consecutive frame samples. All future
   // automation is cancelled when pausing, reversing a fade, or restarting.
   param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);param.linearRampToValueAtTime(next,now+.025);
  }else this.media.volume=next;
 }
 reset(){
  this.level=1;
  if(this.gain){const now=this.context.currentTime;this.gain.gain.cancelScheduledValues(now);this.gain.gain.setValueAtTime(1,now);}
  this.media.volume=1;
 }
 get state(){return {level:this.level,audibleLevel:this.gain?.gain.value??this.media.volume,context:this.context?.state??'uninitialized',connections:this.source?1:0};}
}
