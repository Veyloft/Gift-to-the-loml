// Original complete drawings. Normal Besbes has an exterior-background alpha
// mask only; the cat-family scene's separate stinky asset is never used here.
export const letterCatAssets={
 letterMinoucha:'assets/cat-family-minoucha.png',
 letterMala:'assets/cat-family-mala.png',
 letterBesbes:'assets/besbes-normal-original-cutout.png',
 letterSiva:'assets/cat-family-siva.png'
};
export function letterFamilyDecorations(){
 return `<div class="letter-family" aria-hidden="true">${[
  ['minoucha','left','letterMinoucha'],['mala','right','letterMala'],
  ['besbes','left','letterBesbes'],['siva','right','letterSiva']
 ].map(([name,side,asset])=>`<img class="letter-family-cat letter-family-${side} letter-family-${name} ambient" src="${letterCatAssets[asset]}" alt="" draggable="false">`).join('')}</div>`;
}
