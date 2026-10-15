import {familyBase,familyBasket,familyGarland} from './cat-family-art.js';

// Coordinates come from the approved 1800 x 1005 composition. Each untouched
// square image scales uniformly within a room that keeps the source aspect.
const cats={
 minoucha:{asset:'familyMinoucha',x:125,y:95,size:350,alt:'Minoucha in her woven basket'},
 mala:{asset:'familyMala',x:590,y:62,size:400,alt:'Mala reclining at her original angle'},
 siva:{asset:'familySiva',x:1235,y:108,size:415,alt:'Siva with her full stretched paw, pink pads and raised tail'},
 besbes:{asset:'familyBesbes',x:245,y:450,size:480,alt:'Besbes with his original curved tail and exactly three flies'}
};
function cat(name,assets){
 const {asset,x,y,size,alt}=cats[name];
 return `<img class="family-cat family-${name}" src="${assets[asset]}" alt="${alt}" draggable="false" style="left:${(x-26)/1748*100}%;top:${(y-16)/958*100}%;width:${size/1748*100}%">`;
}
const connector=(name,d)=>`<svg class="family-connectors family-tail-${name} ${name==='siva'?'':'ambient'}" viewBox="26 16 1748 958" aria-hidden="true"><path d="${d}"/></svg>`;

export function catFamilySpread(assets){
 return `<div class="family-room">
  ${familyBase()}
  <div class="family-garland ambient" aria-hidden="true">${familyGarland()}</div>
  <div class="family-basket family-basket-left ambient">${familyBasket('minoucha')}${cat('minoucha',assets)}</div>
  <div class="family-basket family-basket-middle ambient">${familyBasket('mala')}${cat('mala',assets)}</div>
  ${cat('siva',assets)}
  <div class="family-haze" aria-hidden="true"></div>
  ${cat('besbes',assets)}
  <p class="family-caption"><span>our kids btw</span><span>( ꈍᴗꈍ)</span></p>
  <svg class="family-caption-arrow" viewBox="0 0 150 65" aria-hidden="true"><path d="M8 10Q63 59 138 12M123 15l16-5-5 16"/></svg>
  <div class="family-dialogue" data-at="66.70">
   ${connector('minoucha','M795 516C630 483 470 493 408 419C418 482 590 499 786 542Z')}
   ${connector('mala','M910 498C957 464 960 452 967 419C973 453 963 478 955 501Z')}
   ${connector('siva','M1117 542C1219 510 1294 450 1320 409C1309 477 1213 541 1129 559Z')}
   <div class="family-speech">that mf stink</div>
  </div>
 </div>`;
}
