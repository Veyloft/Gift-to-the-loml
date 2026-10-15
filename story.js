// The audio clock is the only authority for lyrics, action anchors and page progression.
import {scenes,startPosition} from './scene-map.js';
export class Story {
  constructor(){this.reset();}
  reset(){this.index=0;this.prepared=new Set();this.completed=new Map();this.waiting=null;this.time=startPosition;this.turn=null;}
  get scene(){return scenes[this.index];}
  get gate(){return this.scene.gates.find(g=>!this.completed.has(g.id))??null;}
  get turning(){return this.turn!==null;}
  available(gate=this.gate){return !!gate&&!this.turning&&this.time>=gate.at-gate.lead;}
  prepare(id){const g=this.gate;if(!g||g.id!==id||!this.available(g)||this.prepared.has(id))return false;this.prepared.add(id);return true;}
  tick(audioTime){
    this.time=audioTime;
    if(this.turn&&audioTime-this.turn.at>=.42)this.turn=null;
    const g=this.gate;
    if(!g||audioTime<g.at)return {kind:'none'};
    if(!this.prepared.has(g.id)){this.waiting=g.id;return {kind:'wait',at:g.at};}
    this.completed.set(g.id,g.at);this.prepared.delete(g.id);this.waiting=null;
    if(g.next){const previous=this.index;this.index++;this.turn={at:g.at,previous};return {kind:'page',gate:g,previous,index:this.index};}
    return {kind:'complete',gate:g};
  }
  snapshot(){return {index:this.index,scene:this.scene.id,time:this.time,prepared:[...this.prepared],completed:[...this.completed.keys()],waiting:this.waiting,turn:this.turn};}
}
