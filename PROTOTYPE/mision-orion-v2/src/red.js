/* =====================================================================
   red.js — multijugador (hasta 4) con la capacidad «room» del artefacto.
   Todo viaja en la PRESENCIA: cualquiera puede ponerla, también quien solo
   tiene permiso de lectura (los «eventos» de la sala son solo para
   editores). La presencia nunca es autoridad por sí sola: el ANFITRIÓN
   (quien ya lo era; si no hay, el de etiqueta de par más baja) simula el
   reloj, los PNJ, los eventos y la base, y valida las acciones de los
   demás según los permisos de su rol (PERMISOS_ROL).
   Límite de la plataforma: 4 KiB por presencia; por eso la base viaja en
   una instantánea compacta (BaseLunar.snapshot).
   Nota: en Godot se usaría ENet, que no funciona en la exportación web; la
   versión web usa esta sala de la plataforma.
   ===================================================================== */
const Red = (()=>{
  const EST=['quieto','andar','trabajo','evento','trabajo_ev','descanso'];
  let api=null,sala=null,activa=false,tUnion=0,tSinAnf=0,soyAnf=false,epoca=0,tJuego=0,sincronizado=false;
  let cola=[],sigAcc=1,cbs={},enviadoEn={},procesados={},acks=[],npcHost=null,metHost=null,resueltoLocal={},tPres=0,ultTam=0;
  const bytes=s=>{try{return new TextEncoder().encode(s).length;}catch(e){return s.length*2;}};

  async function conectar(codigo){
    try{api=window.claude&&window.claude.use?await window.claude.use('room'):null;}catch(e){api=null;}
    if(!api)return {ok:false,msg:'El modo en línea no está disponible en esta vista. Abre el juego desde su enlace de claude.ai con una cuenta que tenga acceso, o juega en solitario.'};
    const nombre='orion2-'+(String(codigo||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20)||'orion');
    try{sala=await api.join(nombre);}catch(e){sala=api;}
    activa=true;tUnion=Date.now();soyAnf=false;sincronizado=false;
    try{sala.onPeers(()=>{if(window.Principal)Principal.alCambiarPares();},err=>{console.warn('Sala:',err&&err.code);});}catch(e){}
    publicar(true);
    return {ok:true};
  }
  function todos(){if(!sala)return [];try{return sala.peers().filter(p=>p.kind==='viewer'&&p.presence&&p.presence.v===2);}catch(e){return [];}}
  const enJuego=p=>p.presence.j===1&&(p.presence.e|0)===epoca;
  /* Otros jugadores dentro de la partida (sin contarme). */
  function pares(){return todos().filter(p=>!p.sameTab&&enJuego(p)).map(p=>({peer:p.peer,r:clamp(p.presence.r|0,0,3),p:p.presence}));}
  function miPeer(){const y=todos().find(p=>p.sameTab);return y?y.peer:null;}
  const esAnfitrion=()=>!activa||soyAnf;

  function elegirAnfitrion(){
    if(!JUEGO.jugando){if(soyAnf){soyAnf=false;}return;}
    const js=todos().filter(enJuego),recl=js.filter(p=>p.presence.h===1);
    if(recl.length){const a=recl.reduce((x,y)=>y.peer<x.peer?y:x);tSinAnf=0;
      if(a.sameTab)soyAnf=true;else if(soyAnf){soyAnf=false;publicar(true);}
      return;}
    if(soyAnf)return;
    if(Date.now()-tUnion<1800)return;
    if(!tSinAnf)tSinAnf=Date.now();if(Date.now()-tSinAnf<900)return;
    const menor=js.reduce((x,y)=>(!x||y.peer<x.peer)?y:x,null);
    if(!menor||menor.sameTab){soyAnf=true;tSinAnf=0;publicar(true);}
  }
  function npcPack(){return npcs.filter(n=>esNpc(n.rol)).map(n=>[n.rol,Math.round(n.x),Math.round(n.y),n.cara>=0?1:-1,Math.max(0,EST.indexOf(n.estado)),n.diceT>0&&n.dice?String(n.dice).slice(0,90):'']);}
  function publicar(ya){
    if(!activa||!sala)return;
    const o={v:2,j:JUEGO.jugando?1:0,r:JUEGO.rol,a:JUEGO.acto,e:epoca,h:soyAnf?1:0,k:JUEGO.jugando?hechoStr():null};
    if(JUEGO.jugando&&JUEGO.acto===1&&P){o.x=Math.round(P.x);o.y=Math.round(P.y);o.f=P.cara>=0?1:-1;o.m=P.mov?1:0;}else{o.x=null;o.y=null;o.f=null;o.m=null;}
    o.q=cola.length?cola.slice(0,10):null;
    if(soyAnf&&JUEGO.jugando){
      o.mt=Math.round(JUEGO.met*10)/10;o.w=JUEGO.espera?String(JUEGO.espera).slice(0,60):null;
      o.ev=JUEGO.evento?[JUEGO.evento.id,JUEGO.evento.rol]:0;
      const r=JUEGO.recursos;o.rc=[r.o2,r.co2,r.agua,r.energia,r.temp,r.rad].map(v=>Math.round(v*100)/100);
      o.n=JUEGO.acto===1?npcPack():null;o.ak=acks.length?acks.slice(-12):null;
      o.b=JUEGO.acto===2&&JUEGO.base?BaseLunar.snapshot():null;
    }else{o.mt=null;o.w=null;o.ev=null;o.rc=null;o.n=null;o.ak=null;o.b=null;}
    let s=JSON.stringify(o);
    if(bytes(s)>3800&&o.b){o.b.l=[];s=JSON.stringify(o);}
    if(bytes(s)>3800){o.n=null;o.ak=o.ak?o.ak.slice(-4):null;s=JSON.stringify(o);}
    if(bytes(s)>3800){console.warn('Presencia demasiado grande:',bytes(s));return;}
    ultTam=bytes(s);
    try{const pr=sala.presence(o);if(pr&&pr.catch)pr.catch(e=>console.warn('presencia',e&&e.code));}catch(e){}
  }
  function tic(dt){
    if(!activa)return;
    elegirAnfitrion();procesar();
    const ahora=Date.now();for(const k in enviadoEn){if(ahora-enviadoEn[k]>9000){const cb=cbs[k];delete cbs[k];delete enviadoEn[k];cola=cola.filter(q=>q[0]!==+k);if(cb)cb({ok:false,msg:'Sin respuesta del anfitrión.'});}}
    tPres-=dt;if(tPres<=0){tPres=soyAnf?(JUEGO.acto===2?.35:.2):((P&&P.mov)?.12:.4);publicar();}
  }
  function procesar(){
    if(!JUEGO.jugando)return;
    const ps=todos().filter(p=>!p.sameTab&&p.presence.j===1);
    let maxE=epoca;ps.forEach(p=>{if((p.presence.e|0)>maxE)maxE=p.presence.e|0;});
    if(maxE>epoca){epoca=maxE;soyAnf=false;sincronizado=false;tUnion=Date.now();if(window.Principal)Principal.reiniciarPorRed();return;}
    const mismos=ps.filter(p=>(p.presence.e|0)===epoca);
    let union=null,nuevos=0;
    for(const p of mismos){const k=String(p.presence.k||'');if(k.length!==N_MISIONES)continue;
      for(let i=0;i<N_MISIONES;i++)if(k[i]==='1'&&!JUEGO.hecho[i]&&(!union||union[i]!=='1')){union=union||JUEGO.hecho.map(b=>b?'1':'0');union[i]='1';nuevos++;}}
    // al unirse tarde o si llegan muchas de golpe, se aplican sin repetir cinemáticas
    if(union)Nave.aplicarHechoRemoto(union.join(''),!sincronizado||nuevos>6);
    if(!sincronizado&&(mismos.length||Date.now()-tJuego>3000))sincronizado=true;
    if(soyAnf)procesarAcciones(mismos);
    else{const h=mismos.filter(p=>p.presence.h===1).sort((a,b)=>a.peer<b.peer?-1:1)[0];if(h)aplicarAnfitrion(h.presence);}
  }
  function procesarAcciones(mismos){
    for(const p of mismos){if(p.presence.h===1)continue;
      const q=Array.isArray(p.presence.q)?p.presence.q:[],rol=clamp(p.presence.r|0,0,3);let ult=procesados[p.peer]||0;
      for(const it of q){if(!Array.isArray(it))continue;const i=it[0]|0;if(i<=ult)continue;ult=i;
        let res;try{res=aplicarAccion(it[1],rol);}catch(e){res={ok:false,msg:'Acción no válida.'};}
        acks.push([p.peer,i,res&&res.ok?1:0,res&&!res.ok?String(res.msg||'').slice(0,140):'']);if(acks.length>24)acks.shift();}
      procesados[p.peer]=ult;}
  }
  function aplicarAccion(a,rol){
    if(!a||typeof a!=='object'||typeof a.t!=='string')return {ok:false};
    if(a.t==='ev_fin'){if(JUEGO.evento&&JUEGO.evento.id===a.id)Nave.resolverEvento('red');return {ok:true};}
    if(JUEGO.acto!==2||!JUEGO.base)return {ok:false,msg:'La base aún no está lista.'};
    const res=BaseLunar.accion(a,rol);UI.hud();return res;
  }
  function aplicarAnfitrion(h){
    const ahora=performance.now();
    if(typeof h.mt==='number'){if(!metHost||h.mt!==metHost.v){let rate=metHost?metHost.rate:0;if(metHost){const d=(ahora-metHost.t)/1000;if(d>.05)rate=clamp((h.mt-metHost.v)/d,0,50000);}metHost={v:h.mt,t:ahora,rate};}}
    JUEGO.espera=typeof h.w==='string'?h.w:null;
    if(JUEGO.acto===1){
      const ev=Array.isArray(h.ev)?h.ev:null;
      if(ev&&!JUEGO.evento&&!(resueltoLocal[ev[0]]&&Date.now()-resueltoLocal[ev[0]]<5000)){const e=EVENTOS_NAVE.find(x=>x.id===ev[0]);if(e){JUEGO.evento={id:e.id,rol:e.rol,t:0};Sonido.alarma();UI.alerta(`⚠ ${e.n}: ${e.aviso}`);}}
      else if(!ev&&JUEGO.evento){JUEGO.evento=null;UI.alerta(null);}
      if(Array.isArray(h.rc)){const r=JUEGO.recursos;['o2','co2','agua','energia','temp','rad'].forEach((k,i)=>{if(typeof h.rc[i]==='number')r[k]=h.rc[i];});}
      npcHost=Array.isArray(h.n)?h.n:null;
    }
    if(h.b&&JUEGO.acto===2)BaseLunar.aplicarSnapshot(h.b);
    const yo=miPeer();
    if(Array.isArray(h.ak)&&yo){let maxI=0;for(const a of h.ak){if(!Array.isArray(a)||a[0]!==yo)continue;const i=a[1]|0;if(i>maxI)maxI=i;
        const cb=cbs[i];if(cb){delete cbs[i];delete enviadoEn[i];try{cb({ok:!!a[2],msg:a[3]||''});}catch(e){console.error(e);}}}
      if(maxI)cola=cola.filter(q=>q[0]>maxI);}
  }
  /* Acción de un jugador que no es anfitrión: se encola en su presencia. */
  function accion(a,cb){
    if(esAnfitrion()){const res=aplicarAccion(a,JUEGO.rol);cb&&cb(res);return;}
    const i=sigAcc++;cola.push([i,a]);if(cola.length>10)cola.shift();if(cb){cbs[i]=cb;enviadoEn[i]=Date.now();}tPres=0;
  }
  function enviar(m){
    if(!activa)return;
    if(m&&m.t==='ev_fin'){resueltoLocal[m.id]=Date.now();if(!soyAnf)accion({t:'ev_fin',id:m.id});}
    tPres=0;
  }
  function seguirReloj(dt){if(!metHost)return;const ext=Math.min(1,(performance.now()-metHost.t)/1000),obj=metHost.v+metHost.rate*ext;JUEGO.met+=(obj-JUEGO.met)*Math.min(1,dt*5);}
  function aplicarNpc(lista){
    if(!npcHost)return;
    for(const it of npcHost){if(!Array.isArray(it))continue;const n=lista[clamp(it[0]|0,0,3)];if(!n)continue;
      n.tx=+it[1]||n.tx;n.ty=+it[2]||n.ty;n.cara=it[3]>=0?1:-1;n.estado=EST[it[4]|0]||'quieto';
      const d=typeof it[5]==='string'?it[5]:'';if(d&&d!==n.dice){n.dice=d;n.diceT=3.4;}}
  }
  function actualizarRemotos(dt,rem){
    const vistos=new Set();
    if(activa)for(const p of todos()){const pr=p.presence;if(p.sameTab||!enJuego(p)||pr.a!==JUEGO.acto||typeof pr.x!=='number')continue;vistos.add(p.peer);
      let r=rem[p.peer];if(!r)r=rem[p.peer]={x:pr.x,y:pr.y,cara:1,mov:false,rol:pr.r|0};
      r.rol=clamp(pr.r|0,0,3);r.cara=pr.f>=0?1:-1;const dx=pr.x-r.x,dy=pr.y-r.y,d=Math.hypot(dx,dy);
      if(d>80){r.x=pr.x;r.y=pr.y;}else{r.x+=dx*Math.min(1,dt*10);r.y+=dy*Math.min(1,dt*10);}r.mov=d>1.2||pr.m===1;}
    for(const k in rem)if(!vistos.has(k))delete rem[k];
  }
  /* ¿Otro jugador tiene mi rol y su etiqueta es menor? Entonces me toca cambiar. */
  function conflictoRol(){const yo=miPeer();if(!yo)return false;return pares().some(p=>p.r===JUEGO.rol&&p.peer<yo);}
  function rolesOcupados(){return new Set(todos().filter(p=>!p.sameTab&&enJuego(p)).map(p=>clamp(p.presence.r|0,0,3)));}
  function entrarJuego(){tJuego=Date.now();sincronizado=false;cola=[];cbs={};enviadoEn={};publicar(true);}
  function nuevaEpoca(){epoca++;soyAnf=false;sincronizado=false;tUnion=Date.now();procesados={};acks=[];publicar(true);}
  function salir(){if(!sala)return;try{sala.presence({v:null,j:null,r:null,a:null,e:null,h:null,k:null,x:null,y:null,f:null,m:null,q:null,mt:null,w:null,ev:null,rc:null,n:null,ak:null,b:null}).catch(()=>{});}catch(e){}}
  window.addEventListener('beforeunload',salir);
  return {conectar,pares,esAnfitrion,tic,accion,enviar,seguirReloj,aplicarNpc,actualizarRemotos,conflictoRol,rolesOcupados,entrarJuego,nuevaEpoca,salir,publicar,
    get activa(){return activa;},get epoca(){return epoca;},get tam(){return ultTam;},get cola(){return cola.length;}};
})();
