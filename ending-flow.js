// One pausable clock and explicit routes. No delayed callbacks survive restart.
export const endingLines={
 farewell:'well this was all i hope u liked it baby',
 pssst:'psssstt…',
 entrance:'you didn’t think that was the whole gift, did you?',
 question:'before i hand this over… whats ur name?',
 snark:'ignoring a cat with secret mail? bold choice, girl.',
 reassure:'are you suuure? i think you’ll reaaaaalllyyyy want this.',
 phew:'phew. i was about to get dramatic.',
 milo:'ohhh. so YOU’RE his Milo.',
 disclosure:'zayd told me to save this for later… but i’m a cat. patience isn’t really my thing :3',
 grumpyFirst:'hmph. fine, keep your secrets then.',
 grumpySecond:'i already know you’re the Melanie he won’t stop talking about. take your letter, silly >:3',
 asideFirst:"okay okay, i'll stop being nosy now...",
 asideSecond:"but don't tell zayd i peeked :3"
};
export class EndingFlow {
 constructor(){this.reset();}
 reset(){this.state='idle';this.elapsed=0;this.entered=0;this.inputElapsed=0;this.inputEntered=0;this.farewellAt=null;this.pusheenAt=null;this.name='';this.returnChoice=null;this.revision=0;this.readableAt=null;}
 enter(state){this.state=state;this.entered=this.elapsed;this.inputEntered=this.inputElapsed;this.revision++;}
 start(){if(this.state!=='idle')return false;this.enter('foreground');return true;}
 get age(){return this.elapsed-this.entered;}
 get t(){return this.farewellAt===null?null:this.elapsed-this.farewellAt;}
 get grumpy(){return ['grumpyFirst','grumpySecond'].includes(this.state);}
 get readable(){return this.readableAt!==null;}
 get interactive(){return this.inputElapsed-this.inputEntered>=.35;}
 tick(dt,running=true){
  // Input protection expires even while music is deliberately paused, so a
  // modal opened during a pause can still be submitted or closed.
  this.inputElapsed+=Math.max(0,dt);
  if(!running||this.state==='idle')return;
  this.elapsed+=Math.max(0,dt);
  if(this.state==='foreground'&&this.age>=2){this.farewellAt=this.elapsed;this.enter('farewell');}
  else if(this.state==='farewell'&&this.age>=3)this.enter('pusheenWait');
  else if(this.state==='pusheenWait'&&this.age>=5){this.pusheenAt=this.elapsed;this.enter('pssst');}
  else if(this.state==='envelope'&&this.age>=2.9)this.enter('unfold');
  else if(this.state==='unfold'&&this.age>=.7){this.readableAt=this.elapsed;this.enter('asideFirst');}
  else if(this.state==='asideFirst'&&this.age>=3)this.enter('asideSecond');
  else if(this.state==='asideSecond'&&this.age>=3)this.enter('asideExit');
  else if(this.state==='asideExit'&&this.age>=.7)this.enter('letter');
 }
 // The view supplies the revision it rendered. Stale taps/forms cannot consume
 // the next bubble, and a new state has a short input guard against double taps.
 act(action,revision=this.revision,value=''){
  if(revision!==this.revision||!this.interactive)return false;
  const state=this.state;
  if(['choicesFirst','choicesSecond'].includes(state)){
   if(action==='answer'){this.returnChoice=state;this.enter(state==='choicesSecond'?'phew':'name');return true;}
   if(action==='ignore'){this.enter(state==='choicesFirst'?'snark':'grumpyFirst');return true;}
  }
  if(state==='name'){
   if(action==='close'){this.enter(this.returnChoice);return true;}
   if(action==='submit'&&String(value).trim()){this.name=String(value).trim();this.enter('milo');return true;}
  }
  if(action==='continue'){
   const next={pssst:'entrance',entrance:'question',question:'choicesFirst',snark:'reassure',reassure:'choicesSecond',phew:'name',milo:'disclosure',disclosure:'envelope',grumpyFirst:'grumpySecond',grumpySecond:'envelope'}[state];
   if(next){if(state==='grumpySecond')this.name='Melanie';this.enter(next);return true;}
  }
  return false;
 }
 snapshot(){return {state:this.state,name:this.name,revision:this.revision,t:this.t,age:this.age,readableAt:this.readableAt};}
}

// The level is relative to the gift's normal volume. The return ramp captures
// the audible level at the instant the unfolded letter becomes readable.
export class EndingLevel {
 constructor(){this.reset();}
 reset(){this.level=1;this.returnAt=null;this.returnFrom=null;}
 downward(t){return t<3?1:t<5?1-(t-3)*.25:t<9?.5-(t-5)*.05:.3;}
 update(t,readable=false,audible=this.level){
  if(t===null)return this.level;
  if(readable&&this.returnAt===null){this.returnFrom=audible;this.returnAt=t;}
  this.level=this.returnAt===null?this.downward(t):this.returnFrom+(1-this.returnFrom)*Math.min(1,Math.max(0,(t-this.returnAt)/2));
  return this.level;
 }
}
