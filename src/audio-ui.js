const $=id=>document.getElementById(id);
export class AudioUI{
 constructor(audio){
  this.audio=audio;audio.onChange=()=>this.refresh();
  $('audio-toggle').onclick=()=>{if(audio.settings.master===0){audio.set('master',.75);audio.set('muted',false);audio.unlock();}else if(audio.settings.muted){audio.set('muted',false);audio.unlock();}else if(!audio.ready)audio.unlock();else audio.set('muted',true);};
  $('audio-muted').onchange=()=>{audio.set('muted',$('audio-muted').checked);if(!audio.settings.muted)audio.unlock();};
  for(const key of['master','effects','ambience'])$('audio-'+key).oninput=()=>audio.set(key,Number($('audio-'+key).value)/100);
  $('audio-preview').onclick=()=>audio.preview();
  const unlock=e=>{if(!e.isTrusted||e.target.closest('#audio-toggle')||e.ctrlKey||e.metaKey||e.altKey)return;if(!audio.ready&&!audio.settings.muted)audio.unlock();};
  document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});this.refresh();
 }
 refresh(){const a=this.audio,s=a.settings,b=$('audio-toggle'),silent=s.muted||s.master===0;
  b.classList.toggle('is-muted',silent||!a.ready);b.setAttribute('aria-pressed',String(s.muted));b.setAttribute('aria-label',silent?'Activar sonido':a.ready?'Silenciar sonido':'Activar sonido');b.title=b.getAttribute('aria-label');
  $('audio-muted').checked=s.muted;for(const key of['master','effects','ambience']){$('audio-'+key).value=Math.round(s[key]*100);$('audio-'+key+'-value').textContent=`${Math.round(s[key]*100)}%`;}
  $('audio-state').textContent=a.error?'El navegador no pudo iniciar el audio. Puedes volver a tocar el botón de sonido.':s.muted?'Sonido silenciado.':!a.ready?'El sonido se activa con el primer toque o una tecla.':'Sonido activo · se pausa con el juego y al salir de esta pestaña.';
  $('audio-preview').disabled=s.muted||s.master===0||s.effects===0;
 }
}
