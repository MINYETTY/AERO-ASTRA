/* =====================================================================
   principal.js — pantallas (inicio, roles, menú, victoria), cambio de
   acto, cola de cinemáticas, bucle principal y guardado.
   Guardado: localStorage (este navegador), código para copiar/pegar y,
   si hay cuenta, un documento privado por persona en la base de datos del
   artefacto (data/users/<id>/partida).
   ===================================================================== */
const Principal = (()=>{
  const CLAVE='orion2_partida';
  let ult=0,iniciado=false,colaCine=[],cineCorriendo=false,tGuardar=20,dbDoc=null,guardadoDb=0,ultimoDb='',partidaDb=null,enLinea=false,errores=new Set();

  function mostrar(id){['inicio','roles','victoria','menu'].forEach(s=>{$(s).hidden=s!==id;});}
  function modoActo(n){$('app').classList.toggle('acto2',n===2);}
  const tiempoJugado=()=>Math.round((Date.now()-JUEGO.inicio)/1000);

  /* ---------- cinemáticas en cola (nunca se pisan) ---------- */
  function cinematica(tipo,fin){colaCine.push({tipo,fin});if(!cineCorriendo)siguienteCine();}
  function siguienteCine(){
    const c=colaCine.shift();
    if(!c){cineCorriendo=false;JUEGO.enCine=false;UI.reanudar();return;}
    cineCorriendo=true;JUEGO.enCine=true;UI.pausar();
    Cine.reproducir(c.tipo,()=>{try{c.fin&&c.fin();}catch(e){console.error(e);}siguienteCine();});
  }

  /* ---------- roles ---------- */
  function pintarRoles(){
    const ocup=Red.activa?Red.rolesOcupados():new Set(),lista=$('listaRoles');lista.innerHTML='';
    ROLES.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.className='rolbtn';b.disabled=ocup.has(i);
      const nn=MISIONES.filter(m=>m.rol===i).length;
      b.innerHTML=`<i style="background:${r.c}"></i><span><b>${r.n.toUpperCase()} · ${escHtml(r.quien)}</b>${escHtml(r.d)}<small>${nn} misiones · En la base: ${escHtml(r.base)}${ocup.has(i)?' · ocupado por otro jugador':''}</small></span>`;
      b.onclick=()=>empezar(i,{base:$('roles').dataset.base==='1'});lista.appendChild(b);});
    $('msgRoles').textContent=Red.activa?`Jugadores en la nave: ${1+Red.pares().length}. Los roles sin jugador los llevan tripulantes de la IA.`:'Los otros tres roles los llevan tripulantes de la IA. Habla con ellos.';
  }
  function alCambiarPares(){if(!$('roles').hidden)pintarRoles();if(JUEGO.jugando)UI.hud();}

  /* ---------- empezar ---------- */
  function empezar(rol,opc={}){
    Nave.iniciar(rol);JUEGO.jugando=true;JUEGO.pausa=true;JUEGO.acto=1;modoActo(1);
    mostrar(null);UI.cerrarModal();UI.alerta(null);$('cajon').hidden=true;$('dlg').hidden=true;$('asesora').hidden=true;
    Nave.ajustar();UI.hud();Red.entrarJuego();
    if(opc.base){saltarABase();return;}
    cinematica('intro',()=>{UI.banner('FASE 1/7: '+FASES[0].n);UI.control('Orión, buenos días. Empiecen el sondeo GO/NO-GO cuando estén listos.');});
  }
  /* Empezar directamente en la base (el viaje se da por hecho). */
  function saltarABase(){
    for(let i=0;i<N_MISIONES_NAVE;i++){JUEGO.hecho[i]=true;JUEGO.bitacora.add('m:'+i);}
    JUEGO.met=FASES[5].met1;JUEGO.loi=MISIONES[25].reloj;JUEGO.aterrizado=true;
    cinematica('base',()=>iniciarActo2(false));
  }
  function iniciarActo2(silencioso){
    if(JUEGO.acto===2)return;
    JUEGO.acto=2;JUEGO.evento=null;UI.alerta(null);
    if(!JUEGO.base)BaseLunar.nueva();
    modoActo(2);BaseUI.entrar();UI.hud();
    if(!silencioso){UI.banner('FASE 7/7: '+FASES[6].n);UI.control('Bienvenidos a la superficie. Empiecen el montaje de la base: energía primero.');}
    guardar();
  }
  function victoria(){
    const b=JUEGO.base;if(!b)return;JUEGO.ganado=true;
    const s=tiempoJugado();$('vTiempo').textContent=`Tiempo de juego: ${Math.floor(s/60)} min ${s%60} s · ${b.trip.length} tripulantes · ${b.stats.noches} noches lunares superadas · ${contarHechos()}/${N_MISIONES} misiones.`;
    const datos=MISIONES.filter(m=>JUEGO.hecho[m.id]&&!m.sim);const elegidos=barajar(datos.slice()).slice(0,3);
    $('vDatos').innerHTML=elegidos.map(m=>`<p><b>${escHtml(m.n)}:</b> ${escHtml(m.dato)}</p>`).join('');
    mostrar('victoria');UI.pausar();Sonido.exito();guardar();
  }
  function reiniciarPorRed(){const rol=JUEGO.rol;JUEGO.base=null;empezar(rol);UI.aviso('Nueva misión iniciada por la tripulación.');}

  /* ---------- guardado ---------- */
  function estado(){
    return {v:2,fecha:Date.now(),acto:JUEGO.acto,rol:JUEGO.rol,hecho:hechoStr(),met:JUEGO.met,loi:JUEGO.loi,aterrizado:JUEGO.aterrizado,recursos:JUEGO.recursos,
      afinidad:JUEGO.afinidad,bitacora:[...JUEGO.bitacora],jugado:tiempoJugado(),ganado:JUEGO.ganado,base:JUEGO.base};
  }
  function guardar(){
    if(!JUEGO.jugando)return;let s;try{s=JSON.stringify(estado());}catch(e){return;}
    try{localStorage.setItem(CLAVE,s);}catch(e){}
    guardarDb(s);
  }
  async function guardarDb(s,forzar){
    if(!dbDoc||s===ultimoDb)return;if(!forzar&&Date.now()-guardadoDb<60000)return;guardadoDb=Date.now();ultimoDb=s;
    try{await dbDoc.set({v:2,fecha:Date.now(),datos:s});}catch(e){console.warn('No se pudo guardar en la nube:',e&&e.code);}
  }
  function leerLocal(){try{const s=localStorage.getItem(CLAVE);return s?JSON.parse(s):null;}catch(e){return null;}}
  function mejorPartida(){const a=leerLocal(),b=partidaDb;if(a&&b)return (b.fecha||0)>(a.fecha||0)?b:a;return a||b;}
  function mostrarContinuar(){const p=mejorPartida();$('bContinuar').hidden=!p;if(p)$('bContinuar').textContent=`CONTINUAR (${p.acto===2?'base lunar':'fase '+(Math.min(6,faseDe(p))+1)})`;}
  function faseDe(p){const h=String(p.hecho||'');for(const m of MISIONES)if(h[m.id]!=='1')return m.fase;return 6;}
  async function prepararDb(){
    try{
      const espera=new Promise(r=>setTimeout(()=>r(null),10000));
      const db=await Promise.race([window.claude&&window.claude.use?window.claude.use('db'):null,espera]);
      const us=await Promise.race([window.claude&&window.claude.use?window.claude.use('user'):null,espera]);
      if(!db||!us)return;const id=await us.id();if(!id)return;
      dbDoc=db.collection('data/users/'+id).doc('partida');
      const snap=await Promise.race([dbDoc.get(),espera]);
      if(snap&&snap.exists){const x=snap.data();if(x&&typeof x.datos==='string'){try{partidaDb=JSON.parse(x.datos);ultimoDb=x.datos;}catch(e){}}}
      if(!JUEGO.jugando)mostrarContinuar();
    }catch(e){console.warn('Base de datos no disponible:',e&&e.code);}
  }
  function cargar(d,mensaje){
    if(!d||d.v!==2||typeof d.hecho!=='string'){UI.aviso('No es una partida válida de Misión Orión v2.');return false;}
    Nave.iniciar(clamp(d.rol|0,0,3));
    JUEGO.hecho=Array.from({length:N_MISIONES},(_,i)=>d.hecho[i]==='1');
    JUEGO.met=typeof d.met==='number'?d.met:FASES[0].met0;JUEGO.loi=typeof d.loi==='number'?d.loi:null;JUEGO.aterrizado=!!d.aterrizado;
    Object.assign(JUEGO.recursos,d.recursos||{});JUEGO.afinidad=Array.isArray(d.afinidad)?d.afinidad.slice(0,4).map(v=>clamp(+v||50,0,100)):[50,50,50,50];
    JUEGO.bitacora=new Set(Array.isArray(d.bitacora)?d.bitacora:[]);JUEGO.inicio=Date.now()-(d.jugado|0)*1000;JUEGO.ganado=!!d.ganado;
    JUEGO.base=null;if(d.base&&Array.isArray(d.base.salas))BaseLunar.cargar(d.base);
    JUEGO.jugando=true;mostrar(null);UI.cerrarModal();$('dlg').hidden=true;$('cajon').hidden=true;Red.entrarJuego();
    if(d.acto===2||faseActual()>=6){JUEGO.acto=1;iniciarActo2(true);}else{JUEGO.acto=1;modoActo(1);Nave.ajustar();}
    UI.hud();JUEGO.pausa=false;UI.reanudar();UI.aviso(mensaje||'Partida cargada.');return true;
  }
  const codificar=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  const decodificar=s=>JSON.parse(decodeURIComponent(escape(atob(String(s).replace(/\s+/g,'')))));

  /* ---------- menú ---------- */
  function abrirMenu(){if(!JUEGO.jugando)return;UI.pausar();$('menuCodigo').value='';$('menuMsg').textContent='';mostrar('menu');}
  function cerrarMenu(){mostrar(null);UI.reanudar();}

  /* ---------- bucle principal ---------- */
  function cuadro(ahora){
    const dt=Math.min(.05,Math.max(0,(ahora-ult)/1000));ult=ahora;const t=ahora/1000;
    try{
      if(JUEGO.jugando){
        if(JUEGO.acto===1){Nave.actualizar(dt);Nave.dibujar(t);Nave.dibujarVista(t);}
        else{BaseUI.actualizar(dt);BaseUI.dibujar(t);}
        if(Red.activa&&Red.conflictoRol()&&!JUEGO.enCine){JUEGO.jugando=false;Red.publicar(true);pintarRoles();mostrar('roles');$('msgRoles').textContent='Otro jugador eligió ese rol a la vez. Elige otro.';}
        tGuardar-=dt;if(tGuardar<=0){tGuardar=20;guardar();}
      }
    }catch(e){const k=String(e&&e.message);if(!errores.has(k)){errores.add(k);console.error(e);}}
    requestAnimationFrame(cuadro);
  }
  function ajustar(){if(JUEGO.acto===2)BaseUI.ajustar();else Nave.ajustar();}

  function iniciar(){
    Nave.enlazar();BaseUI.enlazar();UI.iniciar();Entrada.iniciar();Asesora.iniciar();
    window.addEventListener('resize',ajustar);
    window.addEventListener('pointerdown',()=>{try{if(!Sonido.ctx)Sonido.ctx=new (window.AudioContext||window.webkitAudioContext)();if(Sonido.ctx.state==='suspended')Sonido.ctx.resume();}catch(e){}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)guardar();});
    $('bSolo').onclick=()=>{enLinea=false;$('roles').dataset.base='0';pintarRoles();mostrar('roles');};
    $('bBaseDirecta').onclick=()=>{$('roles').dataset.base='1';pintarRoles();mostrar('roles');};
    $('bEnLinea').onclick=()=>{$('cajaLinea').hidden=false;$('codigoNave').focus();};
    $('bConectar').onclick=async()=>{$('msgLinea').textContent='Conectando…';$('bConectar').disabled=true;
      const r=await Red.conectar($('codigoNave').value||'orion');$('bConectar').disabled=false;
      if(r.ok){enLinea=true;$('msgLinea').textContent='Conectado.';$('roles').dataset.base='0';setTimeout(()=>{pintarRoles();mostrar('roles');},700);}else $('msgLinea').textContent=r.msg;};
    $('bContinuar').onclick=()=>{const p=mejorPartida();if(p)cargar(p,'Partida recuperada.');};
    $('bCargarInicio').onclick=()=>{$('cajaCodigo').hidden=!$('cajaCodigo').hidden;};
    $('bCodigoInicio').onclick=()=>{try{cargar(decodificar($('codigoInicio').value));}catch(e){$('msgCodigo').textContent='El código no es válido.';}};
    $('bAtras').onclick=()=>mostrar('inicio');
    $('bMenu').onclick=abrirMenu;
    $('menuSeguir').onclick=cerrarMenu;
    $('menuGuardar').onclick=()=>{guardar();if(dbDoc)guardarDb(JSON.stringify(estado()),true);$('menuMsg').textContent=dbDoc?'Guardado en este navegador y en tu cuenta.':'Guardado en este navegador.';};
    $('menuExportar').onclick=()=>{const c=codificar(estado());$('menuCodigo').value=c;$('menuCodigo').select();
      try{navigator.clipboard.writeText(c).then(()=>{$('menuMsg').textContent='Código copiado. Guárdalo donde quieras.';},()=>{$('menuMsg').textContent='Selecciona el código y cópialo.';});}catch(e){$('menuMsg').textContent='Selecciona el código y cópialo.';}};
    $('menuImportar').onclick=()=>{try{if(cargar(decodificar($('menuCodigo').value)))mostrar(null);}catch(e){$('menuMsg').textContent='El código no es válido.';}};
    $('menuInicio').onclick=()=>{guardar();JUEGO.jugando=false;Red.publicar(true);mostrar('inicio');mostrarContinuar();};
    $('vSeguir').onclick=()=>{mostrar(null);UI.reanudar();};
    $('vOtra').onclick=()=>{const rol=JUEGO.rol;if(Red.activa)Red.nuevaEpoca();JUEGO.base=null;empezar(rol);};
    mostrar('inicio');mostrarContinuar();prepararDb();
    ult=performance.now();if(!iniciado){iniciado=true;requestAnimationFrame(cuadro);}
    if(window.__ORION_TEST)window.__ORION={JUEGO,Nave,BaseLunar,BaseUI,UI,Red,Principal:api,Asesora,Dialogo,Trayecto,MG,MISIONES,OBJETOS,transitable,bfs,CONOCIMIENTO,DIALOGOS,CHARLAS,ROLES,FASES,codificar,decodificar,get P(){return P;},get npcs(){return npcs;}};
  }
  const api={iniciar,cinematica,iniciarActo2,victoria,reiniciarPorRed,alCambiarPares,empezar,guardar,cargar,estado,codificar,decodificar,mostrar};
  return api;
})();
window.addEventListener('DOMContentLoaded',()=>Principal.iniciar());
