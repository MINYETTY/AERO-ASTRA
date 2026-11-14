/* =====================================================================
   ui.js — interfaz común: HUD, telemetría, avisos, diálogos, «Dato NASA»,
   ventana de minijuegos, lista de misiones, bitácora y entrada.
   ===================================================================== */
const Entrada = {
  jv:{x:0,y:0}, teclas:new Set(), jid:null,
  vector(){let x=this.jv.x,y=this.jv.y;const k=this.teclas;
    if(k.has('a')||k.has('arrowleft'))x-=1;if(k.has('d')||k.has('arrowright'))x+=1;if(k.has('w')||k.has('arrowup'))y-=1;if(k.has('s')||k.has('arrowdown'))y+=1;
    const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}return {x,y};},
  iniciar(){
    window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();
      if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
      if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)&&$('modal').hidden&&$('asesora').hidden)e.preventDefault();
      if(!$('dlg').hidden&&(k==='e'||k==='enter'||k===' ')&&!(e.target&&e.target.tagName==='BUTTON')){e.preventDefault();UI.cerrarDialogo();return;}
      if(k==='escape'){if(!$('modal').hidden){UI.cerrarModal();return;}if(!$('asesora').hidden){Asesora.cerrar();return;}if(!$('cajon').hidden){$('cajon').hidden=true;return;}}
      if(JUEGO.acto===1&&!JUEGO.pausa&&(k==='e'||k===' '||k==='enter')){e.preventDefault();Nave.usar();return;}
      this.teclas.add(k);});
    window.addEventListener('keyup',e=>this.teclas.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>this.teclas.clear());
    const joy=$('joy'),knob=$('knob');
    const upd=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width/2-8;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max;}
      knob.style.transform=`translate(${dx}px,${dy}px)`;this.jv={x:dx/max,y:dy/max};if(Math.hypot(this.jv.x,this.jv.y)<.18)this.jv={x:0,y:0};};
    joy.addEventListener('pointerdown',e=>{this.jid=e.pointerId;joy.setPointerCapture(this.jid);upd(e);});
    joy.addEventListener('pointermove',e=>{if(e.pointerId===this.jid)upd(e);});
    const fin=e=>{if(e.pointerId!==this.jid)return;this.jid=null;this.jv={x:0,y:0};knob.style.transform='';};
    joy.addEventListener('pointerup',fin);joy.addEventListener('pointercancel',fin);
  }
};

const UI = (()=>{
  let tAviso=0,tBanner=0,tControl=0,limpiezaMG=null,terminando=false,dlgRol=null,cola=[];
  const pausar=()=>{JUEGO.pausa=true;},
        reanudar=()=>{if($('modal').hidden&&$('dlg').hidden&&$('asesora').hidden&&$('menu').hidden&&!JUEGO.enCine)JUEGO.pausa=false;};
  const fuentesHtml=f=>(f||[]).filter(k=>FUENTES[k]).map(k=>`<a href="${FUENTES[k].u}" target="_blank" rel="noopener">${escHtml(FUENTES[k].n)}</a>`).join(' · ');

  function aviso(msg){const t=$('aviso');t.textContent=msg;t.hidden=false;clearTimeout(tAviso);tAviso=setTimeout(()=>{t.hidden=true;},3000);}
  function banner(msg){const b=$('banner');b.textContent=msg;b.hidden=false;clearTimeout(tBanner);tBanner=setTimeout(()=>{b.hidden=true;},3000);}
  function alerta(msg){const a=$('alerta');if(!msg){a.hidden=true;return;}a.textContent=msg;a.hidden=false;}
  /* Mensaje de Control de Misión con el retardo de radio real de ese momento. */
  function control(msg){
    const c=$('control'),ret=JUEGO.acto===1?Nave.estadoTrayecto().retardo:1.28;
    if(JUEGO.acto===1&&Nave.estadoTrayecto().los){c.innerHTML='<b>CONTROL DE MISIÓN</b><span>Sin señal: estamos detrás de la Luna. El mensaje llegará al recuperar el enlace.</span>';c.hidden=false;cola.push(msg);clearTimeout(tControl);tControl=setTimeout(()=>{c.hidden=true;},5000);return;}
    clearTimeout(tControl);
    if(ret<.05){c.innerHTML=`<b>CONTROL DE MISIÓN · enlace terrestre</b><span>${escHtml(msg)}</span>`;c.hidden=false;Sonido.tono(880,.05,'sine',.03);tControl=setTimeout(()=>{c.hidden=true;},7000);return;}
    c.innerHTML=`<b>CONTROL DE MISIÓN</b><span>📡 Recibiendo… retardo de ida ${num(ret,2)} s</span>`;c.hidden=false;
    setTimeout(()=>{c.innerHTML=`<b>CONTROL DE MISIÓN · ${num(ret,2)} s</b><span>${escHtml(msg)}</span>`;Sonido.tono(880,.05,'sine',.03);tControl=setTimeout(()=>{c.hidden=true;},7000);},Math.max(300,ret*1000));
  }
  function revisarCola(){if(cola.length&&JUEGO.acto===1&&!Nave.estadoTrayecto().los){const m=cola.shift();control(m);}}

  /* ---------- HUD ---------- */
  function hud(){
    if(JUEGO.acto===2){BaseUI.hud();return;}
    const c=contarHechos(N_MISIONES_NAVE),f=faseActual();
    $('barra').style.width=Math.round(c/N_MISIONES_NAVE*100)+'%';$('progtxt').textContent=c+'/'+N_MISIONES_NAVE;
    $('fase').textContent=`FASE ${Math.min(f,5)+1}/7 · ${FASES[Math.min(f,5)].corto}`;
    $('vtrip').textContent=Red.activa?'Tripulantes en línea: '+(1+Red.pares().length):'';
    if(!$('cajon').hidden)lista();
  }
  /* ---------- telemetría (valores simulados, fórmula en trayecto.js) ---------- */
  function telemetria(){
    if(JUEGO.acto!==1)return;
    const tr=Nave.estadoTrayecto(),r=JUEGO.recursos,b=bloqueCiclo();
    const pon=(id,txt,mal)=>{const e=$(id);if(e){e.textContent=txt;e.classList.toggle('mal',!!mal);}};
    pon('tMET',fmtMET(JUEGO.met));
    pon('tVel',tr.v<.001?'0 km/h':num(tr.v*3600,0)+' km/h');
    pon('tDT',tr.zona==='plataforma'?'0 km':fmtKm(tr.dT));
    pon('tDL',tr.zona==='superficie'?'0 km (en la Luna)':fmtKm(tr.dL));
    pon('tO2',num(r.o2,1)+' %',r.o2<85);pon('tCO2',num(r.co2,1)+' mmHg',r.co2>4);pon('tAgua',num(r.agua,0)+' %',r.agua<35);
    pon('tEner',num(r.energia,0)+' %',r.energia<30);pon('tTemp',num(r.temp,1)+' °C',r.temp>25);pon('tRad',num(r.rad,2)+' µSv/h',r.rad>10);
    pon('tZona',tr.zona.toUpperCase());pon('tRet',tr.zona==='plataforma'?'enlace terrestre':(tr.los?'SIN SEÑAL (cara oculta)':num(tr.retardo,2)+' s ida · '+num(tr.retardo*2,2)+' s ida y vuelta'),tr.los);
    pon('tCiclo',JUEGO.met<0?'Preparativos':`${b.n} · ${String(Math.floor(horaDelDia())).padStart(2,'0')} h`);
    pon('tReloj',JUEGO.ff?'⏩ Avance rápido':(JUEGO.espera?'⏸ Espera: '+JUEGO.espera:'▶ ×'+num(FASES[Math.min(faseActual(),5)].vel,0)));
    const pp=Nave.P;if(pp){const fila=SALA_DE[Math.floor((pp.y-2)/TILE)],si=fila?fila[Math.floor(pp.x/TILE)]:-1;const nom=si>=0?SALAS_NAVE[si].n:'Pasillo';if($('sala').textContent!==nom)$('sala').textContent=nom;}
    $('vtxt').textContent=tr.zona==='plataforma'?'En la plataforma de lanzamiento':tr.zona==='superficie'?'En la superficie lunar':`Tierra ${fmtKm(tr.dT)} · Luna ${fmtKm(tr.dL)}`;
    revisarCola();
  }
  function pistaUsar(){
    const c=JUEGO.cerca,h=$('pista'),b=$('bUsar');
    b.disabled=!c||JUEGO.pausa;
    h.textContent=!c?'':(c.tipo==='npc'?'Hablar: '+ROLES[c.n.rol].quien:c.o.n);
  }
  /* ---------- diálogo con NPC ---------- */
  function dialogo(nombre,texto,color,rol){
    pausar();dlgRol=rol;$('dlgnom').textContent=nombre;$('dlgnom').style.color=color||'var(--ambar)';
    $('dlgtxt').textContent=texto;$('dlgfuentes').innerHTML=rol!=null?`<span class="afin">${'♥'.repeat(Math.round(JUEGO.afinidad[rol]/20))}${'♡'.repeat(5-Math.round(JUEGO.afinidad[rol]/20))}</span> <small>${escHtml(DIALOGOS[rol].personalidad)}</small>`:'';
    $('dlgmas').hidden=rol==null;$('dlg').hidden=false;$('mandos').style.visibility='hidden';$('cajon').hidden=true;
  }
  function dato(titulo,texto,fuentes,sim){
    pausar();dlgRol=null;$('dlgnom').textContent=titulo;$('dlgnom').style.color='var(--ambar)';
    $('dlgtxt').textContent=texto;$('dlgfuentes').innerHTML=(sim?'<span class="sim">SIMULACIÓN</span> ':'<span class="hecho">DATO VERIFICADO</span> ')+(fuentes&&fuentes.length?'Fuente: '+fuentesHtml(fuentes):'');
    $('dlgmas').hidden=true;$('dlg').hidden=false;$('mandos').style.visibility='hidden';$('cajon').hidden=true;
  }
  function cerrarDialogo(){$('dlg').hidden=true;$('mandos').style.visibility='';dlgRol=null;reanudar();}
  /* ---------- minijuegos ---------- */
  function minijuego(titulo,mg,o,alGanar){
    pausar();terminando=false;Entrada.teclas.clear();Entrada.jv={x:0,y:0};
    $('mtitulo').textContent=titulo;const caja=$('mcuerpo');caja.innerHTML='';$('modal').hidden=false;$('cajon').hidden=true;
    const ctx={retardo:JUEGO.acto===1?Nave.estadoTrayecto().retardo:1.28,color:ROLES[JUEGO.rol].c};
    const ganar=()=>{if(terminando)return;terminando=true;if(limpiezaMG){limpiezaMG();limpiezaMG=null;}Sonido.exito();caja.innerHTML='<p class="okmsg">¡COMPLETADO!</p>';
      setTimeout(()=>{cerrarModal();alGanar&&alGanar();},800);};
    try{limpiezaMG=MG[mg](caja,ganar,o||{},ctx)||null;}catch(e){console.error(e);caja.innerHTML='<p class="pista">Error en el minijuego.</p>';}
  }
  function cerrarModal(){if(limpiezaMG){limpiezaMG();limpiezaMG=null;}$('modal').hidden=true;$('mcuerpo').innerHTML='';reanudar();}
  function modalHtml(titulo,html){pausar();$('mtitulo').textContent=titulo;$('mcuerpo').innerHTML=html;$('modal').hidden=false;$('cajon').hidden=true;}
  /* Ventana: vista grande del exterior con explicación. */
  function ventana(nombre){
    modalHtml(nombre.toUpperCase(),'<canvas id="vgrande" class="mgcv" width="240" height="140"></canvas><p class="logi" id="vdesc"></p>');
    const c=$('vgrande'),g2=c.getContext('2d');g2.imageSmoothingEnabled=false;let raf=0;
    const bucle=a=>{Nave.escenaExterior(g2,240,140,a/1000,true);raf=requestAnimationFrame(bucle);};raf=requestAnimationFrame(bucle);
    limpiezaMG=()=>cancelAnimationFrame(raf);
    const tr=Nave.estadoTrayecto();let d;
    if(tr.zona==='plataforma')d='Por la ventana se ve la plataforma de lanzamiento. Falta poco para el despegue.';
    else if(tr.zona==='superficie')d='Regolito gris, cielo negro y la Tierra baja en el horizonte: así se vería desde cerca del polo sur.';
    else if(tr.los)d='Detrás de la Luna: la Tierra no se ve y no hay señal de radio.';
    else d=`Velocidad: ${num(tr.v*3600,0)} km/h. Distancia a la Tierra: ${fmtKm(tr.dT)}. Distancia a la Luna: ${fmtKm(tr.dL)}. El tamaño aparente de la Tierra y la Luna se calcula con su radio real y la distancia (simulación).`;
    $('vdesc').textContent=d;
  }
  /* ---------- lista de misiones ---------- */
  function lista(){
    const ul=$('lista');ul.innerHTML='';const fa=faseActual();
    const fases=JUEGO.acto===2?[6]:[0,1,2,3,4,5];
    if(JUEGO.acto===2){const h=document.createElement('li');h.innerHTML='<h3>OBJETIVOS DE LA BASE</h3>';ul.appendChild(h);
      BaseLunar.objetivos().forEach(o=>{const li=document.createElement('li');li.className=o.hecho?'hecho':(o.actual?'':'bloq');li.innerHTML=`<button type="button"><span class="chk">${o.hecho?'✔':(o.actual?'▶':'·')}</span><span>${escHtml(o.n)}</span></button>`;ul.appendChild(li);});}
    for(const p of fases){const h=document.createElement('li');h.innerHTML=`<h3>FASE ${p+1} · ${FASES[p].n.toUpperCase()}</h3>`;ul.appendChild(h);
      MISIONES.filter(m=>m.fase===p).forEach(m=>{
        const hecho=JUEGO.hecho[m.id],li=document.createElement('li'),bloqReq=!reqOk(m);
        li.className=hecho?'hecho':((p>fa)?'bloq':'');
        const b=document.createElement('button');b.type='button';if(JUEGO.objetivo===m.id&&!hecho)b.className='sel';
        const req=bloqReq&&!hecho?`<small>Requiere: ${m.req.filter(i=>!JUEGO.hecho[i]).map(i=>escHtml(MISIONES[i].n)).join(', ')}</small>`:'';
        b.innerHTML=`<span class="chk">${hecho?'✔':(p>fa?'🔒':(bloqReq?'⏳':'▢'))}</span><span>${escHtml(m.n)}${m.sim?' <em>(sim.)</em>':''}<small><span class="dot" style="background:${ROLES[m.rol].c}"></span>${ROLES[m.rol].n}${m.rol===JUEGO.rol?' (tú)':''}</small>${req}</span>`;
        b.onclick=()=>{if(!hecho&&disponible(m,JUEGO.rol)){JUEGO.objetivo=m.id;lista();if(JUEGO.acto===2)BaseUI.misionBase(m);}};
        li.appendChild(b);ul.appendChild(li);});}
  }
  /* ---------- bitácora ---------- */
  function bitacora(){
    const items=[];
    MISIONES.forEach(m=>{if(JUEGO.hecho[m.id])items.push({t:m.n,d:m.dato,f:m.f,sim:m.sim});});
    MUEBLES_NAVE.forEach((f,i)=>{if(f.dato&&JUEGO.bitacora.has('f:'+i))items.push({t:f.n,d:f.dato,f:f.f});});
    EVENTOS_NAVE.forEach(e=>{if(JUEGO.bitacora.has('ev:'+e.id))items.push({t:'Evento: '+e.n,d:e.dato,f:e.f});});
    if(JUEGO.base)INVESTIGACIONES.forEach(x=>{if(JUEGO.base.investigado[x.id])items.push({t:'Investigación: '+x.n,d:x.dato,f:x.f});});
    const html=items.length?items.map(i=>`<p class="logi"><b>${escHtml(i.t)}</b>${i.sim?' <span class="sim">SIM.</span>':''}<br>${escHtml(i.d)}<br><small>${fuentesHtml(i.f)}</small></p>`).join(''):'<p class="pista">Aún no hay datos. Completa misiones o inspecciona objetos.</p>';
    modalHtml('BITÁCORA NASA · '+items.length+' datos',html);
  }
  function dialogoAbierto(){return !$('dlg').hidden||!$('modal').hidden;}
  function iniciar(){
    $('dlgok').onclick=cerrarDialogo;
    $('dlgmas').onclick=()=>{if(dlgRol==null)return;JUEGO.afinidad[dlgRol]=Math.min(100,JUEGO.afinidad[dlgRol]+1);$('dlgtxt').textContent=Dialogo.linea(dlgRol);Sonido.tono(500,.05);};
    $('mcerrar').onclick=cerrarModal;
    $('bMisiones').onclick=()=>{const d=$('cajon');d.hidden=!d.hidden;if(!d.hidden)lista();};
    $('bBitacora').onclick=()=>{if(!JUEGO.enCine)bitacora();};
    $('bAsesora').onclick=()=>{if(!JUEGO.enCine)Asesora.abrir();};
    $('bTele').onclick=()=>{const t=$('tele');t.classList.toggle('plegada');$('bTele').textContent=t.classList.contains('plegada')?'+':'−';};
    if(window.innerWidth<700){$('tele').classList.add('plegada');$('bTele').textContent='+';}
    $('bSonido').onclick=()=>{Sonido.on=!Sonido.on;$('bSonido').textContent='Sonido: '+(Sonido.on?'sí':'no');$('bSonido').setAttribute('aria-pressed',String(Sonido.on));};
    $('bUsar').onclick=()=>Nave.usar();
  }
  return {iniciar,hud,telemetria,pistaUsar,aviso,banner,alerta,control,dialogo,dato,cerrarDialogo,minijuego,cerrarModal,modalHtml,ventana,lista,bitacora,dialogoAbierto,fuentesHtml,pausar,reanudar};
})();
