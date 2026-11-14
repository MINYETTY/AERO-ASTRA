/* =====================================================================
   nave.js — ACTO 1: la nave Orión de la Tierra a la Luna.
   Mapa, movimiento, NPC, reloj de misión, telemetría, eventos, ciclo de
   la tripulación, diálogos y dibujo del interior y de la ventana.
   ===================================================================== */

/* ---------- Estado global del juego (compartido con base y red) ---------- */
const JUEGO = {
  acto:1, rol:0, epoca:0, hecho:new Array(N_MISIONES).fill(false),
  met:-7200, ff:null, loi:null, aterrizado:false, pausa:true, enCine:false,
  recursos:{o2:98,co2:2,agua:100,energia:100,temp:21,rad:.05},
  evento:null, proxEvento:60, tFase:0,
  afinidad:[50,50,50,50], memoria:[{},{},{},{}], ultimaLinea:['','','',''],
  registro:[], bitacora:new Set(), inicio:Date.now(), ganado:false, base:null,
  objetivo:null, cerca:null, jugando:false, espera:null
};
const hechoStr = () => JUEGO.hecho.map(b=>b?'1':'0').join('');
const contarHechos = (hasta=N_MISIONES) => JUEGO.hecho.slice(0,hasta).filter(Boolean).length;

/* Fase actual = la primera fase con misiones pendientes (0..6). */
function faseActual(){for(const m of MISIONES)if(!JUEGO.hecho[m.id])return m.fase;return 6;}
const reqOk = m => m.req.every(i=>JUEGO.hecho[i]);
const disponible = (m,rol) => !JUEGO.hecho[m.id] && m.rol===rol && m.fase<=faseActual() && reqOk(m) && (m.fase<6||JUEGO.acto===2);

/* ---------- Mapa ---------- */
const MAPA = Array.from({length:NAVE_H},()=>Array(NAVE_W).fill(0));
const SALA_DE = Array.from({length:NAVE_H},()=>Array(NAVE_W).fill(-1));
const SOLIDO = Array.from({length:NAVE_H},()=>Array(NAVE_W).fill(false));
function tallar(x,y,w,h,s){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){MAPA[j][i]=1;SALA_DE[j][i]=s;}}
PASILLOS_NAVE.forEach(p=>tallar(p[0],p[1],p[2],p[3],-1));
SALAS_NAVE.forEach((s,i)=>tallar(s.x,s.y,s.w,s.h,i));
for(let y=0;y<NAVE_H;y++)for(let x=0;x<NAVE_W;x++){if(MAPA[y][x])continue;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<NAVE_W&&ny<NAVE_H&&MAPA[ny][nx]===1)MAPA[y][x]=2;}}
const OBJETOS=[];
MISIONES.filter(m=>m.fase<6).forEach(m=>OBJETOS.push({clase:'m',m,tipo:m.tipo,tx:m.tx,ty:m.ty,n:m.n}));
MUEBLES_NAVE.forEach((f,i)=>OBJETOS.push({clase:'f',f,tipo:f.tipo,tx:f.tx,ty:f.ty,n:f.n,id:i}));
OBJETOS.push({clase:'a',tipo:'asesora',tx:ASESORA_NAVE.tx,ty:ASESORA_NAVE.ty,n:ASESORA_NAVE.n});
OBJETOS.forEach(o=>{SOLIDO[o.ty][o.tx]=true;});
const transitable=(tx,ty)=>tx>=0&&ty>=0&&tx<NAVE_W&&ty<NAVE_H&&MAPA[ty][tx]===1&&!SOLIDO[ty][tx];
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
function bfs(sx,sy,metas){
  const k=(x,y)=>y*NAVE_W+x,prev=new Map([[k(sx,sy),null]]),q=[[sx,sy]],gs=new Set(metas.map(g=>k(g[0],g[1])));let fin=null;
  while(q.length){const [x,y]=q.shift();if(gs.has(k(x,y))){fin=[x,y];break;}
    for(const [dx,dy] of D4){const nx=x+dx,ny=y+dy;if(!transitable(nx,ny)||prev.has(k(nx,ny)))continue;prev.set(k(nx,ny),[x,y]);q.push([nx,ny]);}}
  if(!fin)return null;const camino=[];let c=fin;while(c){camino.push(c);c=prev.get(k(c[0],c[1]));}
  return camino.reverse().slice(1).map(([x,y])=>({x:x*TILE+8,y:y*TILE+10}));
}
const centroObj=o=>({x:o.tx*TILE+8,y:o.ty*TILE+8});
const objDeMision=id=>OBJETOS.find(o=>o.clase==='m'&&o.m.id===id);
const objDeEvento=ev=>ev==='tormenta'?objDeMision(21):OBJETOS.find(o=>o.clase==='f'&&o.f.ev===ev);

/* ---------- Jugador, NPC y otros jugadores ---------- */
let P=null, npcs=[], remotos={};
const cam={x:0,y:0};
function nuevoNpc(r){const h=ROLES[r].home;return {rol:r,x:h[0]*TILE+8,y:h[1]*TILE+10,tx:h[0]*TILE+8,ty:h[1]*TILE+10,cara:1,mov:false,estado:'quieto',timer:1+Math.random()*2,camino:[],meta:null,dice:'',diceT:0,charla:null};}
function rolesHumanos(){const s=new Set([JUEGO.rol]);if(Red.activa)Red.pares().forEach(p=>s.add(p.r));return s;}
const esNpc=r=>!rolesHumanos().has(r);

/* ---------- Ciclo de la tripulación ---------- */
function horaDelDia(){return (((JUEGO.met+7*3600)/3600)%24+24)%24;}
function bloqueCiclo(){if(JUEGO.met<0)return {id:'trabajo',n:'Preparativos'};const h=horaDelDia();return CICLO_TRIPULACION.find(c=>h>=c.de&&h<c.a)||CICLO_TRIPULACION[0];}

/* ---------- Telemetría ---------- */
function estadoTrayecto(){return Trayecto.estado(JUEGO.met,{loi:JUEGO.loi,aterrizado:JUEGO.aterrizado});}

/* =====================================================================
   DIÁLOGO con memoria (sin repetir línea dos veces seguidas) y contexto.
   ===================================================================== */
const Dialogo = {
  /* Devuelve una línea según el contexto: evento, recurso bajo, misión del
     jugador reciente, ciclo, afinidad o fase. */
  linea(rol,opc={}){
    const D=DIALOGOS[rol],cand=[];
    const ev=opc.evento!==undefined?opc.evento:(JUEGO.evento&&JUEGO.evento.id);
    if(ev&&D.evento[ev])cand.push(...D.evento[ev].map(l=>({l,p:5})));
    if(opc.incidente&&D.base[opc.incidente])cand.push(...D.base[opc.incidente].map(l=>({l,p:5})));
    const bajo=opc.recursoBajo!==undefined?opc.recursoBajo:recursoBajo();
    if(bajo&&D.recurso[bajo])cand.push(...D.recurso[bajo].map(l=>({l,p:4})));
    const rec=JUEGO.registro.filter(r=>r.tipo==='mision'&&r.rol===JUEGO.rol&&Date.now()-r.t<90000).pop();
    if(rec)cand.push(...D.jugador.map(l=>({l:l.replace('{mision}',rec.n),p:3})));
    const cic=opc.ciclo||bloqueCiclo().id;if(D.ciclo[cic])cand.push(...D.ciclo[cic].map(l=>({l,p:1})));
    const af=JUEGO.afinidad[rol];if(af<35)cand.push(...D.afinidad.baja.map(l=>({l,p:1})));if(af>70)cand.push(...D.afinidad.alta.map(l=>({l,p:2})));
    const fz=opc.fase!=null?opc.fase:Math.min(6,JUEGO.acto===2?6:faseActual());cand.push(...D.fase[fz].map(l=>({l,p:2})));
    cand.push(...D.general.map(l=>({l,p:1})));
    const mem=JUEGO.memoria[rol];
    let mejor=null,mp=-1;
    for(const c of cand){if(c.l===JUEGO.ultimaLinea[rol])continue;const vistas=mem[c.l]||0;const pun=c.p*3-vistas*4+Math.random()*2;if(pun>mp){mp=pun;mejor=c.l;}}
    mejor=mejor||cand[0].l;mem[mejor]=(mem[mejor]||0)+1;JUEGO.ultimaLinea[rol]=mejor;return mejor;
  },
  total(rol){const D=DIALOGOS[rol];let n=0;D.fase.forEach(f=>n+=f.length);for(const k in D.recurso)n+=D.recurso[k].length;for(const k in D.evento)n+=D.evento[k].length;for(const k in D.ciclo)n+=D.ciclo[k].length;n+=D.afinidad.baja.length+D.afinidad.alta.length+D.jugador.length+D.general.length;for(const k in D.base)n+=D.base[k].length;return n;}
};
function recursoBajo(){
  if(JUEGO.acto===2&&JUEGO.base){const r=JUEGO.base.recursos;if(r.o2<15)return 'o2';if(r.co2>1.5)return 'co2';if(r.agua<25)return 'agua';if(r.energia<30)return 'energia';if(r.temp>28||r.temp<12)return 'temp';return null;}
  const r=JUEGO.recursos;if(r.o2<85)return 'o2';if(r.co2>4)return 'co2';if(r.agua<35)return 'agua';if(r.energia<30)return 'energia';if(r.temp>25)return 'temp';if(r.rad>10)return 'rad';return null;
}

/* =====================================================================
   NAVE: lógica del acto 1
   ===================================================================== */
const Nave = (()=>{
  let cv,g,vc,vg,est,tiempoUI=0,tCharla=12;
  const estV=Arte.crearEstrellas(110,21),estI=Arte.crearEstrellas(90,33);

  function iniciar(rol){
    JUEGO.acto=1;JUEGO.rol=rol;JUEGO.hecho=new Array(N_MISIONES).fill(false);JUEGO.met=FASES[0].met0;JUEGO.ff=null;JUEGO.loi=null;JUEGO.aterrizado=false;
    JUEGO.recursos={o2:98,co2:2,agua:100,energia:100,temp:21,rad:.05};JUEGO.evento=null;JUEGO.proxEvento=70;JUEGO.tFase=0;
    JUEGO.afinidad=[50,50,50,50];JUEGO.memoria=[{},{},{},{}];JUEGO.ultimaLinea=['','','',''];JUEGO.registro=[];JUEGO.bitacora=new Set();JUEGO.inicio=Date.now();JUEGO.ganado=false;JUEGO.base=null;JUEGO.objetivo=null;
    colocar(rol);
  }
  function colocar(rol){const h=ROLES[rol].home;P={x:h[0]*TILE+8,y:h[1]*TILE+10,cara:1,mov:false};npcs=ROLES.map((_,r)=>nuevoNpc(r));remotos={};}
  function enlazar(){cv=$('cv');g=cv.getContext('2d');vc=$('vc');vg=vc.getContext('2d');}

  /* ---------- reloj de misión ---------- */
  function limiteReloj(){
    const f=faseActual();if(f>=6)return FASES[5].met1;
    let lim=FASES[f].met1,quien=null;
    for(const m of MISIONES){if(!JUEGO.hecho[m.id]&&m.reloj!=null&&m.fase<=f&&m.reloj<lim){lim=m.reloj;quien=m;}}
    return {lim,quien,fase:f};
  }
  function actualizarReloj(dt){
    if(JUEGO.ff){JUEGO.ff.t+=dt;const k=clamp(JUEGO.ff.t/JUEGO.ff.dur,0,1),e=k*k*(3-2*k);JUEGO.met=lerp(JUEGO.ff.de,JUEGO.ff.a,e);if(k>=1){JUEGO.ff=null;}return;}
    const {lim,quien,fase}=limiteReloj();const F=FASES[fase];
    if(JUEGO.met<F.met0)JUEGO.met=F.met0;
    const vel=JUEGO.met>=lim-1?1:F.vel;
    JUEGO.met=Math.min(lim,JUEGO.met+vel*dt);
    JUEGO.espera=JUEGO.met>=lim-1?(quien?quien.n:'Fin de fase'):null;
  }
  function avanzarA(met,dur=1.6){if(met>JUEGO.met+1)JUEGO.ff={de:JUEGO.met,a:met,t:0,dur};}

  /* ---------- recursos (valores simulados) ---------- */
  function actualizarRecursos(dt){
    const r=JUEGO.recursos,ev=JUEGO.evento&&JUEGO.evento.id,tr=estadoTrayecto();
    if(ev==='micrometeoroide')r.o2-=.3*dt;else r.o2+=clamp(98-r.o2,-.6,.6)*dt*.6;
    if(ev==='co2')r.co2+=.1*dt;else if(ev==='ventilador')r.co2+=.035*dt;else r.co2+=(2-r.co2)*Math.min(1,dt*.35);
    if(JUEGO.met>0)r.agua-=.012*dt;
    const paneles=JUEGO.hecho[8];r.energia+=(paneles?.5:(JUEGO.met>0?-.05:.2))*dt;
    if(ev==='ventilador')r.temp+=.045*dt;else r.temp+=(21-r.temp)*Math.min(1,dt*.25);
    let base=tr.zona==='plataforma'?.05:(tr.zona==='ascenso'||tr.zona==='orbita baja')?.4:tr.zona==='órbita alta'?(tr.dT<20000?3:1.2):1.6;
    if(tr.zona==='superficie')base=1.3;if(ev==='tormenta')base*=22;
    r.rad+=(base-r.rad)*Math.min(1,dt*1.5);
    r.o2=clamp(r.o2,0,100);r.co2=clamp(r.co2,0,30);r.agua=clamp(r.agua,0,100);r.energia=clamp(r.energia,0,100);
  }
  /* ---------- eventos aleatorios ---------- */
  function actualizarEventos(dt){
    if(!Red.esAnfitrion())return;
    const f=faseActual();if(f<1||f>5||JUEGO.aterrizado)return;
    if(JUEGO.evento){const E=JUEGO.evento;E.t+=dt;
      const resp=E.rol;if(esNpc(resp)){const n=npcs[resp];if(n.estado!=='evento'&&n.estado!=='trabajo_ev'){const o=objDeEvento(E.id);const c=o&&caminoA(n,o);if(c){n.camino=c;n.meta={ev:E.id};n.estado='evento';}}}
      return;}
    JUEGO.proxEvento-=dt;if(JUEGO.proxEvento>0||JUEGO.tFase<35)return;
    const pos=EVENTOS_NAVE.filter(e=>e.desde<=f);if(!pos.length)return;
    const e=elegir(pos);lanzarEvento(e.id);
  }
  function lanzarEvento(id){
    const e=EVENTOS_NAVE.find(x=>x.id===id);JUEGO.evento={id,rol:e.rol,t:0};JUEGO.proxEvento=80+Math.random()*60;
    Sonido.alarma();UI.alerta(`⚠ ${e.n}: ${e.aviso}`);
    const n=npcs.find(x=>x.rol!==e.rol&&esNpc(x.rol));if(n)decir(n,Dialogo.linea(n.rol,{evento:id}));
  }
  function resolverEvento(por){
    if(!JUEGO.evento)return;const e=EVENTOS_NAVE.find(x=>x.id===JUEGO.evento.id);JUEGO.evento=null;UI.alerta(null);
    JUEGO.registro.push({t:Date.now(),tipo:'evento',id:e.id,n:e.n,rol:e.rol,por});JUEGO.bitacora.add('ev:'+e.id);
    if(e.id==='micrometeoroide')JUEGO.recursos.o2=Math.max(JUEGO.recursos.o2,90);
    UI.aviso(`${e.n}: resuelto por ${por==='yo'?'ti':ROLES[e.rol].quien}.`);
    if(por==='yo'){JUEGO.afinidad=JUEGO.afinidad.map((a,i)=>i===JUEGO.rol?a:Math.min(100,a+4));UI.dato('LECCIÓN REAL · '+e.n,e.dato,e.f,false);}
    Red.enviar({t:'ev_fin',id:e.id});
  }

  /* ---------- NPC ---------- */
  function caminoA(n,o){const sx=Math.floor(n.x/TILE),sy=Math.floor((n.y-2)/TILE);const metas=D4.map(([dx,dy])=>[o.tx+dx,o.ty+dy]).filter(([x,y])=>transitable(x,y));return bfs(sx,sy,metas);}
  function decir(n,l,seg=3.4){n.dice=l;n.diceT=seg;}
  function siguientePara(rol){for(const m of MISIONES)if(m.fase<6&&disponible(m,rol))return m;return null;}
  function actualizarNpc(n,dt,anfitrion){
    n.mov=false;if(n.diceT>0)n.diceT-=dt;
    if(!anfitrion){const dx=n.tx-n.x,dy=n.ty-n.y;if(Math.hypot(dx,dy)>60){n.x=n.tx;n.y=n.ty;}else{n.x+=dx*Math.min(1,dt*8);n.y+=dy*Math.min(1,dt*8);}n.mov=Math.hypot(dx,dy)>1.2&&n.estado!=='trabajo';return;}
    const bloque=bloqueCiclo().id;
    if(n.estado==='quieto'||n.estado==='descanso'){
      n.timer-=dt;
      if(n.timer<=0){
        const m=siguientePara(n.rol);
        if(m){const c=caminoA(n,objDeMision(m.id));if(c){n.camino=c;n.meta={m:m.id};n.estado='andar';}else n.timer=1;}
        else{
          let dest=null;
          if(bloque==='sueno'){const camas=[[15,17],[14,17],[5,14],[7,14]];dest=camas[n.rol];n.estado='andar';n.meta={dormir:true};}
          else if(bloque==='comida'){dest=[17+n.rol%3,21];n.meta={comer:true};}
          else if(bloque==='ejercicio'){dest=[20+(n.rol%2),17];n.meta={ejercicio:true};}
          else{const s=SALAS_NAVE[[0,0,1,7][n.rol]];dest=[s.x+rand(s.w),s.y+rand(s.h)];n.meta=null;}
          if(dest&&transitable(dest[0],dest[1])){const c=bfs(Math.floor(n.x/TILE),Math.floor((n.y-2)/TILE),[dest]);if(c){n.camino=c;n.estado='andar';}}
          n.timer=4+Math.random()*5;
        }
      }
    }else if(n.estado==='andar'||n.estado==='evento'){
      if(n.meta&&n.meta.m!=null&&JUEGO.hecho[n.meta.m]){n.estado='quieto';n.timer=1;n.camino=[];return;}
      if(n.estado==='evento'&&!JUEGO.evento){n.estado='quieto';n.timer=1;n.camino=[];return;}
      const w=n.camino[0];
      if(!w){
        if(n.estado==='evento'){n.estado='trabajo_ev';n.timer=5+Math.random()*3;return;}
        if(n.meta&&n.meta.m!=null){n.estado='trabajo';n.timer=4+Math.random()*3;n.diceT=0;}
        else if(n.meta&&n.meta.dormir){n.estado='descanso';n.timer=6;decir(n,'Zzz…',2);}
        else{n.estado='quieto';n.timer=2+Math.random()*3;}
        return;}
      const dx=w.x-n.x,dy=w.y-n.y,d=Math.hypot(dx,dy);if(d<1.5){n.camino.shift();return;}
      const sp=(n.estado==='evento'?58:42)*dt;n.x+=dx/d*Math.min(sp,d);n.y+=dy/d*Math.min(sp,d);if(Math.abs(dx)>.3)n.cara=dx>0?1:-1;n.mov=true;
    }else if(n.estado==='trabajo'){
      n.timer-=dt;if(n.timer<=0){const id=n.meta&&n.meta.m;n.meta=null;n.estado='quieto';n.timer=2+Math.random()*2;
        if(id!=null&&!JUEGO.hecho[id]&&disponible(MISIONES[id],n.rol)){decir(n,'¡Listo!');completar(id,'npc');}}
    }else if(n.estado==='trabajo_ev'){
      n.timer-=dt;if(n.timer<=0){n.estado='quieto';n.timer=2;if(JUEGO.evento&&JUEGO.evento.rol===n.rol){decir(n,'Resuelto.');resolverEvento('npc');}}
    }
  }
  function charlas(dt){
    tCharla-=dt;
    for(const n of npcs){if(n.charla){n.charla.t-=dt;if(n.charla.t<=0){const c=n.charla;c.i++;if(c.i>=c.l.length){n.charla=null;continue;}const quien=c.i%2===0?c.a:c.b;decir(npcs[quien],c.l[c.i],3);c.t=2.9;}}}
    if(tCharla>0)return;tCharla=18+Math.random()*16;
    const libres=npcs.filter(n=>esNpc(n.rol)&&(n.estado==='quieto'||n.estado==='descanso')&&!n.charla&&n.diceT<=0);
    for(const a of libres)for(const b of libres){if(a===b)continue;if(Math.hypot(a.x-b.x,a.y-b.y)>80)continue;
      const op=CHARLAS.filter(c=>(c.a===a.rol&&c.b===b.rol));if(!op.length)continue;const c=elegir(op);
      a.charla={l:c.l,i:0,a:a.rol,b:b.rol,t:2.9};decir(a,c.l[0],3);return;}
  }
  function comentarJugador(m){
    const cand=npcs.filter(n=>esNpc(n.rol)&&n.estado!=='trabajo');if(!cand.length)return;
    cand.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
    const n=cand[0];setTimeout(()=>decir(n,elegir(DIALOGOS[n.rol].jugador).replace('{mision}',m.n),3.6),1200);
  }

  /* ---------- misiones ---------- */
  function completar(id,por){
    if(JUEGO.hecho[id])return;
    const antes=faseActual();JUEGO.hecho[id]=true;const m=MISIONES[id];
    JUEGO.registro.push({t:Date.now(),tipo:'mision',id,n:m.n,rol:m.rol,por});JUEGO.bitacora.add('m:'+id);
    if(por==='yo'){JUEGO.afinidad=JUEGO.afinidad.map((a,i)=>i===JUEGO.rol?a:Math.min(100,a+2));if(JUEGO.acto===1)comentarJugador(m);else if(window.BaseUI)BaseUI.comentar(m);}
    UI.aviso(por==='yo'?'Completaste: '+m.n:`${ROLES[m.rol].n} completó: ${m.n}`);
    efectosMision(m);
    if(por!=='red')Red.enviar({t:'hecho',id});
    UI.hud();
    const despues=faseActual();
    if(JUEGO.acto===1&&despues!==antes)cambioDeFase(antes,despues);
  }
  function efectosMision(m){
    if(m.reloj!=null&&JUEGO.met<m.reloj&&JUEGO.acto===1)avanzarA(m.reloj,m.id===25?2.2:1.5);
    if(m.id===25)JUEGO.loi=Math.max(JUEGO.met,m.reloj);
    if(m.id===18||m.id===19)JUEGO.recursos.agua=Math.max(JUEGO.recursos.agua,96);
    if(m.id===34&&JUEGO.acto===1){JUEGO.aterrizado=true;setTimeout(()=>Principal.cinematica('alunizaje'),900);}
    if(JUEGO.acto===2&&JUEGO.base&&Red.esAnfitrion())BaseLunar.alCompletarMision(m.id);
  }
  /* Une las misiones hechas por otros jugadores. «silencioso»: al unirse a
     una partida en curso no se repiten cinemáticas ni avisos. */
  function aplicarHechoRemoto(cadena,silencioso){
    cadena=String(cadena||'');
    if(!silencioso){for(let i=0;i<N_MISIONES;i++)if(cadena[i]==='1'&&!JUEGO.hecho[i])completar(i,'red');return;}
    let cambio=false;for(let i=0;i<N_MISIONES;i++)if(cadena[i]==='1'&&!JUEGO.hecho[i]){JUEGO.hecho[i]=true;cambio=true;JUEGO.bitacora.add('m:'+i);}
    if(!cambio)return;
    if(JUEGO.hecho[25])JUEGO.loi=MISIONES[25].reloj;
    if(JUEGO.hecho[34])JUEGO.aterrizado=true;
    const f=faseActual();if(f<6&&JUEGO.met<FASES[f].met0)JUEGO.met=FASES[f].met0;
    UI.hud();
    if(f>=6&&JUEGO.acto===1)Principal.iniciarActo2(true);
  }
  function limite(){return limiteReloj();}
  function cambioDeFase(antes,despues){
    JUEGO.tFase=0;
    const F=FASES[antes];
    const seguir=()=>{if(despues>=6){Principal.iniciarActo2();return;}
      UI.banner(`FASE ${despues+1}/7: ${FASES[despues].n}`);Sonido.exito();
      UI.control(MENSAJES_CONTROL[despues]||'Control de Misión: buen trabajo, tripulación.');};
    if(JUEGO.met<F.met1)avanzarA(F.met1,2.2);
    setTimeout(()=>{if(F.cine)Principal.cinematica(F.cine,seguir);else seguir();},F.met1>JUEGO.met+1?2300:300);
  }
  const MENSAJES_CONTROL=[null,
    'Control de Misión: Orión, despegue limpio. Comprueben sistemas en órbita.',
    'Control de Misión: tienen GO para la inyección translunar.',
    'Control de Misión: rumbo a la Luna confirmado. Mantengan la rutina.',
    'Control de Misión: se acercan a la Luna. Recuerden la pérdida de señal en la cara oculta.',
    'Control de Misión: descenso simulado aprobado. Revisen el módulo.',
    'Control de Misión: bienvenidos a la superficie. Empiecen el montaje de la base.'];

  /* ---------- entrada del jugador ---------- */
  const bloqueado=(px,py)=>[[px-4,py],[px+4,py],[px-4,py-5],[px+4,py-5]].some(([x,y])=>!transitable(Math.floor(x/TILE),Math.floor(y/TILE)));
  function autoObjetivo(){let mejor=null,bd=1e9;for(const m of MISIONES){if(m.fase>=6||!disponible(m,JUEGO.rol))continue;const c=centroObj(objDeMision(m.id)),d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;mejor=m.id;}}
    if(JUEGO.evento&&JUEGO.evento.rol===JUEGO.rol)return 'ev';return mejor;}

  function actualizar(dt){
    const anf=Red.esAnfitrion();
    if(!JUEGO.pausa&&!JUEGO.enCine){
      const v=Entrada.vector();P.mov=v.x!==0||v.y!==0;
      if(P.mov){const sp=66*dt,nx=P.x+v.x*sp,ny=P.y+v.y*sp;if(!bloqueado(nx,P.y))P.x=nx;if(!bloqueado(P.x,ny))P.y=ny;if(Math.abs(v.x)>.2)P.cara=v.x>0?1:-1;}
    }else P.mov=false;
    if(!JUEGO.enCine){
      if(anf){actualizarReloj(dt);JUEGO.tFase+=dt;}else Red.seguirReloj(dt);
      actualizarRecursos(dt);actualizarEventos(dt);
    }
    if(!anf)Red.aplicarNpc(npcs);
    npcs.forEach(n=>{if(esNpc(n.rol))actualizarNpc(n,dt,anf);});
    if(anf)charlas(dt);
    Red.actualizarRemotos(dt,remotos);
    const o=autoObjetivo();if(JUEGO.objetivo==null||JUEGO.objetivo==='ev'||(typeof JUEGO.objetivo==='number'&&(JUEGO.hecho[JUEGO.objetivo]||!disponible(MISIONES[JUEGO.objetivo],JUEGO.rol))))JUEGO.objetivo=o;
    let cerca=null,cd=24;
    for(const ob of OBJETOS){const c=centroObj(ob),d=Math.hypot(c.x-P.x,c.y-4-P.y);if(d<cd){cd=d;cerca={tipo:'obj',o:ob};}}
    for(const n of npcs){if(!esNpc(n.rol))continue;const d=Math.hypot(n.x-P.x,n.y-P.y);if(d<22&&d<cd){cd=d;cerca={tipo:'npc',n};}}
    JUEGO.cerca=cerca;
    tiempoUI-=dt;if(tiempoUI<=0){tiempoUI=.2;UI.telemetria();UI.pistaUsar();}
    Red.tic(dt);
  }

  /* ---------- usar (botón USAR / tecla E) ---------- */
  function usar(){
    if(JUEGO.pausa||JUEGO.enCine||!JUEGO.cerca)return;const c=JUEGO.cerca;
    if(c.tipo==='npc'){hablar(c.n);return;}
    const o=c.o;
    if(JUEGO.evento){const E=JUEGO.evento,eo=objDeEvento(E.id);if(eo===o){
      if(E.rol!==JUEGO.rol){UI.aviso(`Esto lo resuelve ${ROLES[E.rol].n==='Especialista'?'la':'el'} ${ROLES[E.rol].n}.`);return;}
      const e=EVENTOS_NAVE.find(x=>x.id===E.id);UI.minijuego(e.n.toUpperCase(),e.mg,e.o,()=>resolverEvento('yo'));return;}}
    if(o.clase==='m')return intentarMision(o.m);
    if(o.clase==='a'){Asesora.abrir();return;}
    const f=o.f;
    if(f.ventana){UI.ventana(o.n);return;}
    if(f.accion==='agua'){if(JUEGO.recursos.agua<90){JUEGO.recursos.agua=Math.min(100,JUEGO.recursos.agua+12);UI.aviso('Reciclaste agua en la cocina (+12 %).');Sonido.tono(500,.08);}
      JUEGO.bitacora.add('f:'+o.id);UI.dato(f.n.toUpperCase()+' · DATO NASA',f.dato,f.f,false);return;}
    JUEGO.bitacora.add('f:'+o.id);if(f.dato)UI.dato(f.n.toUpperCase()+' · DATO NASA',f.dato,f.f,false);Sonido.tono(600,.06);
  }
  function intentarMision(m){
    if(JUEGO.hecho[m.id]){UI.aviso('Esa misión ya está completa.');return;}
    if(m.rol!==JUEGO.rol){const r=ROLES[m.rol];UI.aviso(esNpc(m.rol)?`${r.quien} (${r.n}) se encarga de esta misión.`:`Esta misión es del jugador ${r.n}.`);return;}
    if(m.fase>faseActual()){UI.aviso(`Aún no: termina la fase ${faseActual()+1} (${FASES[faseActual()].n}).`);return;}
    if(!reqOk(m)){UI.aviso('Primero hay que completar: '+m.req.filter(i=>!JUEGO.hecho[i]).map(i=>MISIONES[i].n).join(', ')+'.');return;}
    UI.minijuego(m.n.toUpperCase(),m.mg,m.o,()=>{completar(m.id,'yo');if(!(JUEGO.acto===1&&faseActual()>=6))UI.dato('DATO NASA · '+m.n,m.dato,m.f,!!m.sim);});
  }
  function hablar(n){
    const D=ROLES[n.rol];JUEGO.afinidad[n.rol]=Math.min(100,JUEGO.afinidad[n.rol]+3);
    const l=Dialogo.linea(n.rol);decir(n,'…',1);
    UI.dialogo(`${D.quien} · ${D.n}`,l,D.c,n.rol);Sonido.tono(500,.06);
  }

  /* =====================================================================
     DIBUJO
     ===================================================================== */
  function ajustar(){
    const esc=$('escena').getBoundingClientRect();
    if(esc.width){const sc=Math.max(2,Math.floor(Math.min(esc.width,esc.height)/175));const lw=Math.ceil(esc.width/sc),lh=Math.ceil(esc.height/sc);cv.width=lw;cv.height=lh;cv.style.width=lw*sc+'px';cv.style.height=lh*sc+'px';g.imageSmoothingEnabled=false;}
    const v=$('vista').getBoundingClientRect();if(v.width){vc.width=Math.ceil(v.width/3);vc.height=Math.ceil(v.height/3);vg.imageSmoothingEnabled=false;}
  }
  const R=(dx,dy,w,h,c,x,y)=>{g.fillStyle=c;g.fillRect(x+dx,y+dy,w,h);};
  function dibObjeto(o,x,y,t,hecho,disp,col){
    const r=(dx,dy,w,h,c)=>R(dx,dy,w,h,c,x,y),parp=((t*2)|0)%2;
    r(1,15,14,1,'rgba(0,0,0,.35)');
    switch(o.tipo){
      case 'consola':r(1,5,14,10,'#3a3880');r(1,5,14,2,'#5a56b0');r(3,7,10,5,hecho?'#0f3a22':'#06102a');r(5,9,6,1,col);r(5,11,3,1,col);r(3,13,2,1,parp?'#ffb347':'#6b4a1e');r(7,13,2,1,'#8a82d0');r(10,13,2,1,'#8a82d0');break;
      case 'breaker':r(1,2,14,12,'#4b478c');for(let j=0;j<5;j++){r(2+j*3,5,2,6,'#1b1a3a');r(2+j*3,(j%2)?5:8,2,3,hecho?'#7be07b':'#ffb347');}r(2,3,12,1,'#8a82d0');break;
      case 'trajes':r(2,2,12,13,'#2c2a5c');r(5,3,6,10,'#ff7a3c');r(6,3,4,3,'#eef0ff');r(7,4,2,1,'#3aa0d8');r(5,9,6,1,'#c8602a');break;
      case 'tanques':r(2,2,5,13,'#d0d4ec');r(9,2,5,13,'#e0782e');r(2,2,5,2,'#eef0ff');r(9,2,5,2,'#f5a050');r(3,7,3,3,parp?col:'#4f8bff');break;
      case 'tanque':r(4,2,8,13,'#8a8fc0');r(4,2,8,2,'#b8bde8');r(6,6,4,4,'#0a0a20');r(7,7,2,2,parp?col:'#4f8bff');r(5,12,6,1,'#4b478c');break;
      case 'joystick':r(3,11,10,4,'#3a3880');r(7,4,2,8,'#c8c6f0');r(5,2,6,3,col);r(4,12,2,1,'#ffb347');r(10,12,2,1,'#7be07b');break;
      case 'solarctl':r(1,3,14,10,'#2c2a5c');r(6,5,4,4,'#ffd84a');r(5,6,6,2,'#ffd84a');r(2,10,12,2,'#4f8bff');break;
      case 'timon':case 'rueda':r(4,3,8,1,col);r(4,14,8,1,col);r(2,5,1,8,col);r(13,5,1,8,col);r(7,4,2,10,'#c8c6f0');r(3,8,10,2,'#c8c6f0');break;
      case 'starcam':r(5,12,6,3,'#4b478c');for(let i=0;i<7;i++)r(3+i,10-i,3,2,'#c8c6f0');r(10,3,4,3,col);break;
      case 'antena':r(3,3,10,2,'#c8c6f0');r(4,5,8,2,'#c8c6f0');r(5,7,6,1,'#8a8fc0');r(7,8,2,5,'#8a8fc0');r(4,13,8,2,'#4b478c');r(7,1,2,3,col);break;
      case 'servidor':r(2,2,12,13,'#2c2a5c');for(let j=0;j<4;j++){r(3,3+j*3,10,2,'#1b1a3a');r(4,3+j*3,2,1,((((t*3)|0)+j)%3===0)?'#ff6b6b':'#7be07b');r(8,3+j*3,4,1,'#4b478c');}break;
      case 'ejercicio':r(2,14,12,1,'#4b478c');r(4,4,2,10,'#8a8fc0');r(10,4,2,10,'#8a8fc0');r(4,4,8,2,'#c8c6f0');r(6,8,4,4,'#c8c6f0');r(7,9,2,2,col);break;
      case 'tuberias':r(2,4,12,2,'#8a8fc0');r(2,10,12,2,'#8a8fc0');r(6,4,2,8,'#8a8fc0');r(9,6,5,3,'#4fd1ff');r(10,5,3,1,'#b8e8ff');break;
      case 'filtro':case 'filtro_aire':r(3,3,10,12,'#4b478c');r(4,5,8,1,'#1b1a3a');r(4,8,8,1,'#1b1a3a');r(4,11,8,1,'#1b1a3a');r(11,3,2,2,parp?'#7be07b':'#2a5a2a');break;
      case 'buzon':r(2,4,7,8,'#c8ccec');r(3,5,5,6,'#8a8fc0');r(9,6,5,4,'#4f8bff');Arte.disco(g,x+12,y+8,2,'#7be07b');break;
      case 'refugio':r(1,4,4,11,'#5a56b0');r(5,6,4,9,'#6a5a9a');r(9,3,5,12,'#4a4682');r(2,6,2,2,'#ffd84a');r(10,5,3,2,'#ffd84a');break;
      case 'ventilador':{r(2,2,12,12,'#3a3880');const a=JUEGO.evento&&JUEGO.evento.id==='ventilador'?0:t*8;g.fillStyle='#c8c6f0';for(let k=0;k<4;k++){const an=a+k*Math.PI/2;g.fillRect(Math.round(x+8+Math.cos(an)*3)-1,Math.round(y+8+Math.sin(an)*3)-1,3,3);}r(7,7,2,2,'#14102a');break;}
      case 'archivo':r(2,2,12,13,'#5a3f2a');r(3,3,10,3,'#2a1a10');r(3,7,10,3,'#2a1a10');r(3,11,10,3,'#2a1a10');r(4,4,2,2,'#eef0ff');r(7,8,3,2,'#ffd84a');break;
      case 'camara':r(2,6,12,8,'#3a3880');r(5,4,6,6,'#101020');r(6,5,4,4,col);r(12,5,2,1,'#fff');break;
      case 'pantalla':r(1,3,14,10,'#2c2a5c');r(2,4,12,7,'#06102a');r(4,8,8,1,'#4fd1ff');r(6,6,1,4,'#ffd84a');r(5,13,6,2,'#4b478c');break;
      case 'mapa':r(1,4,14,10,'#4b478c');r(2,5,12,8,'#8e8e9c');Arte.disco(g,x+6,y+9,2,'#5a5a6a');Arte.disco(g,x+11,y+7,1,'#5a5a6a');r(9,10,2,2,parp?'#7be07b':'#2a5a2a');break;
      case 'puerto':r(2,2,12,12,'#8a8fc0');Arte.disco(g,x+8,y+8,5,'#3a3880');Arte.disco(g,x+8,y+8,3,'#c8c6f0');r(7,7,2,2,col);break;
      case 'radar':r(1,4,14,10,'#2c2a5c');Arte.disco(g,x+8,y+9,4,'#0f3a22');r(8,9,4,1,'#7be07b');r(10,7,1,1,'#ff6b6b');break;
      case 'escotilla':r(3,2,10,13,'#8a8fc0');r(4,3,8,11,'#3a3880');r(7,4,2,9,'#c8c6f0');r(5,7,6,2,'#c8c6f0');r(7,7,2,2,col);break;
      case 'asesora':r(1,3,14,11,'#2c2a5c');r(2,4,12,8,parp?'#1d3f6f':'#173458');r(6,5,4,3,'#e8c8a8');r(5,8,6,3,'#4fd1ff');r(6,5,4,1,'#3a2a20');r(3,12,10,2,'#4b478c');break;
      case 'asiento':r(3,2,10,13,'#c8602a');r(4,3,8,5,'#e88a4a');r(3,9,10,2,'#8a3a14');r(6,11,4,4,'#8a3a14');break;
      case 'paracaidas':r(2,3,12,12,'#d8d8e8');r(2,6,12,2,'#ff7a3c');r(2,10,12,2,'#ff7a3c');r(6,3,4,12,'#c8c6f0');break;
      case 'ventana':{r(1,2,14,11,'#8a8fc0');r(2,3,12,9,'#06071a');const tr=estadoTrayecto();const er=tr.dT<20000?5:tr.dT<150000?3:1;Arte.disco(g,x+5,y+8,er,'#2a6fd0');if(tr.dL<120000)Arte.disco(g,x+11,y+6,tr.dL<20000?4:2,'#c9c6d8');r(10,4,1,1,'#fff');break;}
      case 'o2':r(5,2,6,13,'#4fd1ff');r(5,2,6,2,'#b8e8ff');r(6,7,4,3,'#0a0a20');r(7,8,2,1,'#fff');break;
      case 'litera':r(1,3,14,12,'#2c2a5c');r(2,5,12,9,'#4f8bff');r(2,5,4,3,'#eef0ff');r(2,9,12,1,'#2a5ab0');break;
      case 'cocina':r(1,7,14,8,'#8a8fc0');r(1,6,14,2,'#c8c6f0');r(3,3,5,3,'#ff7a3c');r(4,4,3,1,'#ffb347');r(10,3,3,3,'#4fd1ff');break;
      case 'inodoro':r(5,2,6,9,'#eef0ff');r(4,10,8,4,'#c8c6f0');r(6,12,4,1,'#8a8fc0');r(11,4,2,2,'#4fd1ff');break;
      case 'casillero':r(2,2,12,13,'#5a56b0');r(7,2,1,13,'#2a2552');r(5,8,1,3,'#ffb347');r(10,8,1,3,'#ffb347');break;
      case 'mesa':r(1,8,14,7,'#8a8fc0');r(1,7,14,2,'#c8c6f0');r(4,3,7,5,'#06102a');r(5,4,5,3,'#4fd1ff');break;
      case 'casco':r(1,2,14,12,'#8a8fc0');for(let i=0;i<4;i++)r(2+i*3,3,2,10,'#6a6f9a');if(JUEGO.evento&&JUEGO.evento.id==='micrometeoroide'){r(9,6,2,2,'#ff6b6b');r(10,4,1,1,'#fff');}break;
      case 'escudo':Arte.disco(g,x+8,y+9,6,'#c8a060');Arte.disco(g,x+8,y+9,4,'#a07a40');r(4,13,8,2,'#4b478c');break;
      case 'bateria':r(2,5,12,10,'#3a3880');r(3,3,3,2,'#c8c6f0');r(10,3,3,2,'#c8c6f0');for(let j=0;j<4;j++)r(3+j*3,7,2,6,JUEGO.recursos.energia>j*25?'#7be07b':'#2a3a2a');break;
      case 'motor':r(5,1,6,3,'#8a8fc0');r(4,4,8,4,'#c8c6f0');r(2,8,12,7,'#ff7a3c');r(4,10,8,5,parp?'#ffb347':'#ffd84a');break;
      default:r(2,2,12,12,'#8a8fc0');
    }
    if(o.clase==='m'){
      if(hecho){r(10,-2,5,5,'#0f3a22');r(11,0,1,1,'#7be07b');r(12,1,1,1,'#7be07b');r(13,0,1,1,'#7be07b');r(14,-1,1,1,'#7be07b');}
      else{const by=disp?-6-(((t*4)|0)%2):-4;r(6,by,4,4,disp?'#ffb347':col);r(7,by+1,2,2,'#14102a');
        if(disp){g.strokeStyle=`rgba(255,179,71,${.35+.4*Math.abs(Math.sin(t*3))})`;g.lineWidth=1;g.strokeRect(x+.5,y+1.5,15,14);}}
    }
    if(JUEGO.evento&&objDeEvento(JUEGO.evento.id)===o){const b=((t*5)|0)%2;r(5,-8,6,6,b?'#ff3b3b':'#ffd84a');r(7,-7,2,3,'#14102a');r(7,-3,2,1,'#14102a');}
  }
  function dibPersonaje(e,t,col,etq,yo,trabajando,durmiendo){
    const sx=Math.round(e.x-cam.x),sy=Math.round(e.y-cam.y);
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(sx-5,sy-1,10,2);
    const cuadro=e.mov&&(((t*8)|0)%2)?1:0,bob=e.mov&&(((t*9)|0)%2)?-1:0;
    g.save();g.translate(sx,sy-12+bob);if(e.cara<0)g.scale(-1,1);g.drawImage(spriteAstro(col,cuadro),-6,0);g.restore();
    if(yo){const b=((t*3)|0)%2;g.fillStyle='#ffb347';g.fillRect(sx-2,sy-19+b,5,1);g.fillRect(sx-1,sy-18+b,3,1);g.fillRect(sx,sy-17+b,1,1);}
    else if(etq){g.font='6px "Press Start 2P",monospace';g.textBaseline='top';g.fillStyle='rgba(7,6,18,.8)';g.fillRect(sx-13,sy-22,26,8);g.fillStyle=col;g.fillText(etq,sx-12,sy-21);}
    if(trabajando){const n=1+((t*3)|0)%3;g.fillStyle='#fff';for(let i=0;i<n;i++)g.fillRect(sx-4+i*3,sy-17,2,2);}
  }
  function envolver(txt,max){const ps=txt.split(' '),l=[];let a='';for(const p of ps){if((a+' '+p).trim().length>max){if(a)l.push(a);a=p;}else a=(a+' '+p).trim();}if(a)l.push(a);return l;}
  function dibBurbuja(n){
    if(!(n.diceT>0)||!n.dice)return;g.font='6px "Press Start 2P",monospace';g.textBaseline='top';
    let ls=envolver(n.dice,22);if(ls.length>3){ls=ls.slice(0,3);ls[2]=ls[2].slice(0,20)+'…';}
    const w=Math.max(...ls.map(l=>l.length))*6+8,h=ls.length*8+4,x=clamp(Math.round(n.x-cam.x-w/2),2,cv.width-w-2),y=Math.round(n.y-cam.y-26-h);
    g.fillStyle='#eef0ff';g.fillRect(x,y,w,h);g.fillRect(Math.round(n.x-cam.x)-1,y+h,3,3);g.fillStyle='#1b1a3a';ls.forEach((l,i)=>g.fillText(l,x+4,y+3+i*8));
  }
  function dibAlas(t){
    const k=JUEGO.hecho[8]?1:0,x0=49*TILE-cam.x,ancho=14+k*14,alto=8+k*50;
    for(let i=0;i<4;i++){const arriba=i<2,bx=x0+(i%2)*4*TILE+8-ancho/2,y=arriba?6*TILE-cam.y-alto:18*TILE-cam.y;
      g.fillStyle='#8a8fc0';g.fillRect(Math.round(bx+ancho/2)-1,arriba?6*TILE-cam.y-3:18*TILE-cam.y,2,3);
      g.fillStyle='#1d3f8f';g.fillRect(Math.round(bx),Math.round(y),Math.round(ancho),Math.round(alto));g.fillStyle='#3a6fd0';for(let r=0;r<alto;r+=6)g.fillRect(Math.round(bx),Math.round(y+r),Math.round(ancho),1);}
  }
  function dibujar(t){
    const lw=cv.width,lh=cv.height,WW=NAVE_W*TILE,WH=NAVE_H*TILE;
    cam.x=Math.round(WW<=lw?(WW-lw)/2:clamp(P.x-lw/2,0,WW-lw));cam.y=Math.round(WH<=lh?(WH-lh)/2:clamp(P.y-8-lh/2,0,WH-lh));
    g.drawImage(Arte.cielo(lw,lh,'negro'),0,0);Arte.estrellas(g,lw,lh,t,estI,cam.x,cam.y);
    dibAlas(t);
    const x0=Math.max(0,Math.floor(cam.x/TILE)),x1=Math.min(NAVE_W-1,Math.floor((cam.x+lw)/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),y1=Math.min(NAVE_H-1,Math.floor((cam.y+lh)/TILE));
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const c=MAPA[ty][tx];if(!c)continue;const x=tx*TILE-cam.x,y=ty*TILE-cam.y;
      if(c===1){const s=SALA_DE[ty][tx];g.fillStyle=s>=0?SALAS_NAVE[s].c:'#2e2c50';g.fillRect(x,y,TILE,TILE);if((tx+ty)%2){g.fillStyle='rgba(255,255,255,.045)';g.fillRect(x,y,TILE,TILE);}
        g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x,y,TILE,1);g.fillRect(x,y,1,TILE);if(s<0&&tx%3===0){g.fillStyle='rgba(255,179,71,.3)';g.fillRect(x+6,y+7,4,2);}}
      else{g.fillStyle='#16143a';g.fillRect(x,y,TILE,TILE);
        if(ty+1<NAVE_H&&MAPA[ty+1][tx]===1){g.fillStyle='#34307a';g.fillRect(x,y+TILE-6,TILE,6);g.fillStyle='#5a52b8';g.fillRect(x,y+TILE-6,TILE,1);g.fillStyle='#8a82d0';if(tx%2===0)g.fillRect(x+3,y+TILE-4,2,1);}
        else if(ty>0&&MAPA[ty-1][tx]===1){g.fillStyle='#34307a';g.fillRect(x,y,TILE,4);}else{g.fillStyle='#2a2670';g.fillRect(x,y,TILE,TILE);}}}
    const ents=[];OBJETOS.forEach(o=>ents.push({y:o.ty*TILE+TILE,o}));ents.push({y:P.y,yo:1});
    npcs.forEach(n=>{if(esNpc(n.rol))ents.push({y:n.y,n});});Object.values(remotos).forEach(r=>ents.push({y:r.y,r}));
    ents.sort((a,b)=>a.y-b.y);
    for(const e of ents){
      if(e.o){const o=e.o,x=o.tx*TILE-cam.x,y=o.ty*TILE-cam.y;if(x<-TILE||y<-TILE||x>lw||y>lh)continue;
        const hecho=o.clase==='m'&&JUEGO.hecho[o.m.id],dsp=o.clase==='m'&&disponible(o.m,JUEGO.rol),col=o.clase==='m'?ROLES[o.m.rol].c:'#ffb347';
        dibObjeto(o,x,y,t,hecho,dsp,col);if(JUEGO.cerca&&JUEGO.cerca.tipo==='obj'&&JUEGO.cerca.o===o){g.strokeStyle='#fff';g.lineWidth=1;g.strokeRect(x-.5,y+.5,17,16);}}
      else if(e.yo)dibPersonaje(P,t,ROLES[JUEGO.rol].c,'',true,false);
      else if(e.n)dibPersonaje(e.n,t,ROLES[e.n.rol].c,'',false,e.n.estado==='trabajo'||e.n.estado==='trabajo_ev');
      else if(e.r)dibPersonaje(e.r,t,ROLES[e.r.rol].c,ROLES[e.r.rol].k,false,false);
    }
    const obj=JUEGO.objetivo;let oc=null;
    if(obj==='ev'&&JUEGO.evento)oc=objDeEvento(JUEGO.evento.id);else if(typeof obj==='number'&&!JUEGO.pausa)oc=objDeMision(obj);
    if(oc){const c=centroObj(oc),dx=c.x-P.x,dy=c.y-P.y,d=Math.hypot(dx,dy);if(d>40)for(let i=0;i<3;i++){const k=26+i*7;g.fillStyle=obj==='ev'?`rgba(255,80,80,${1-i*.3})`:`rgba(255,179,71,${1-i*.3})`;g.fillRect(Math.round(P.x-cam.x+dx/d*k)-1,Math.round(P.y-cam.y-6+dy/d*k)-1,3,3);}}
    npcs.forEach(n=>{if(esNpc(n.rol))dibBurbuja(n);});
    const b=bloqueCiclo();if(b.id==='sueno'){g.fillStyle='rgba(4,4,30,.38)';g.fillRect(0,0,lw,lh);}
    if(JUEGO.evento){g.fillStyle=`rgba(255,40,40,${.05+.05*Math.sin(t*6)})`;g.fillRect(0,0,lw,lh);}
  }

  /* ---------- ventana exterior (tira superior) ---------- */
  function escenaExterior(c2,w,h,t,grande){
    const tr=estadoTrayecto(),K=h*1.05;
    if(tr.zona==='plataforma'){c2.drawImage(Arte.cielo(w,h,'espacio'),0,0);Arte.estrellas(c2,w,h,t,estV);c2.fillStyle='#1d2a1e';c2.fillRect(0,h-6,w,6);
      const cx=Math.round(w*.62);c2.fillStyle='#7a7a92';c2.fillRect(cx-12,h-30,3,24);Cine.sls(c2,cx,h-6,true,0);return;}
    if(tr.zona==='superficie'){Arte.escenaLunar(c2,w,h,t,estV,{horizonte:Math.round(h*.6),radioTierra:Math.max(4,Math.round(h*.16)),tierraX:Math.round(w*.7)});return;}
    c2.drawImage(Arte.cielo(w,h),0,0);Arte.estrellas(c2,w,h,t,estV,t*2,0);
    const angT=Math.asin(clamp(Trayecto.constantes.R_T/tr.rT,0,1)),rT=Math.max(2,Math.round(angT*K));
    const dLc=Math.max(Trayecto.constantes.R_L*1.0001,tr.dL+Trayecto.constantes.R_L),angL=Math.asin(clamp(Trayecto.constantes.R_L/dLc,0,1)),rL=Math.max(2,Math.round(angL*K));
    if(tr.zona==='órbita lunar (simulada)'){
      if(!tr.los){const ang=(tr.theta%(Math.PI*2)+Math.PI*2)%(Math.PI*2);const ey=Math.round(h*.55-Math.sin(ang)*h*.35);const er=Math.max(3,Math.round(h*.08));c2.drawImage(Arte.tierra(er,t*.05,t*.08),Math.round(w*.62)-er-1,ey-er-1);}
      const hor=Math.round(h*(.55+clamp(tr.altL/7000,0,.4)));c2.drawImage(Arte.superficie(w,h-hor+3,5,Math.max(4,Math.round(w/14))),0,hor-3);
      if(tr.los){c2.fillStyle='rgba(0,0,0,.25)';c2.fillRect(0,0,w,h);}return;}
    if(rT>h*1.5){const cy=h+rT-Math.round(h*.38);c2.drawImage(Arte.tierra(Math.min(rT,260),t*.06,t*.09),Math.round(w*.35)-Math.min(rT,260)-1,cy-Math.min(rT,260)-1);}
    else{c2.drawImage(Arte.tierra(rT,t*.06,t*.09),Math.round(w*.2)-rT-1,Math.round(h*.55)-rT-1);}
    const mx=Math.round(w*.82),my=Math.round(h*.45);c2.drawImage(Arte.luna(Math.min(rL,220),0,-.55),mx-Math.min(rL,220)-1,my-Math.min(rL,220)-1);
    if(!grande){const k=clamp(tr.dT/(Trayecto.constantes.D),0,1),sx=Math.round(lerp(w*.2+rT+6,mx-rL-10,k)),sy=Math.round(h*.5+Math.sin(t*2));
      c2.fillStyle='#e8ecff';c2.fillRect(sx,sy-1,5,3);c2.fillStyle='#ff7a3c';c2.fillRect(sx-2,sy-1,2,3);c2.fillStyle='#4f8bff';c2.fillRect(sx+1,sy-4,3,2);c2.fillRect(sx+1,sy+2,3,2);}
  }
  function dibujarVista(t){const w=vc.width,h=vc.height;if(!w)return;escenaExterior(vg,w,h,t,false);}

  return {iniciar,colocar,enlazar,ajustar,actualizar,dibujar,dibujarVista,escenaExterior,usar,completar,aplicarHechoRemoto,lanzarEvento,resolverEvento,
    disponible,faseActual,estadoTrayecto,avanzarA,decir,limite,intentarMision,
    get P(){return P;},get npcs(){return npcs;},get remotos(){return remotos;}};
})();
