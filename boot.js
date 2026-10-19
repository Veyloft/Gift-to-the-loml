// A classic script can explain local-file startup before modules are attempted.
const startButton=document.getElementById('start');
const loadingNote=document.getElementById('load-note');
if(location.protocol==='file:'){
  document.getElementById('music').removeAttribute('src');
  loadingNote.textContent='First double-click Open Melanina.cmd in the Melanina folder.';
  loadingNote.style.cssText='max-width:340px;text-align:center;padding:0 16px';
  startButton.textContent='open local gift ♡';
  startButton.disabled=false;
  startButton.onclick=()=>location.assign('http://127.0.0.1:4173/');
}else{
  import('./app.js?v=touch-20261017-2').catch(error=>{
    console.error('Melanina could not initialize',error);
    loadingNote.textContent='a little hiccup — tap to reload ur gift ♡';
    startButton.textContent='try again ♡';
    startButton.disabled=false;
    startButton.onclick=()=>location.reload();
  });
}
