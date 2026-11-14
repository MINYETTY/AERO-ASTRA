/* =====================================================================
   base_lunar.js — SIMULACIÓN del acto 2 (sin dibujo). El anfitrión es la
   autoridad: ejecuta paso() y aplica las acciones de todos los jugadores.
   Unidades de juego (SIMULADAS): kWh, kg, L, % y puntos de ciencia.
   1 hora de juego = 1 s real a velocidad ×1.
   ===================================================================== */
const BaseLunar = (()=>{
  const B=()=>JUEGO.base;
  const T=t=>TIPOS_SALA[t];
  const TIPOS=Object.keys(TIPOS_SALA), INCS=Object.keys(INCIDENTES_BASE), PRIOS=['equilibrio','energia','soporte','ciencia'];
  const NOMBRES_ROL=ROLES.map(r=>r.quien);
  let sigId=1, flujo={};

  function nueva(){
    const ini=JSON.parse(JSON.stringify(BASE_INICIAL));sigId=1;
    const b={hora:ini.hora,plantas:ini.plantas,recursos:ini.recursos,salas:[],trip:[],investigado:{},expedicion:null,tormenta:null,refugio:false,apagon:false,
      prioridad:'equilibrio',vel:1,stats:{aguaProducida:0,noches:0,autosuf:0,hielo:0,sinVital:0},hechos:{},ganado:false,evac:0,proxLlegada:110,
      tareaNpc:{36:30,37:45,38:55,39:40},log:[],logSeq:0,nocheAnt:false};
    b.recursos.rad=.4;
    JUEGO.base=b;
    ini.salas.forEach(s=>b.salas.push({id:sigId++,tipo:s.tipo,planta:s.planta,col:s.col,nivel:s.nivel,inc:null}));
    ROLES.forEach((r,i)=>b.trip.push({id:sigId++,nombre:r.quien,rol:i,salud:100,enfermo:0,sala:null,exp:false}));
    const en=b.salas.find(s=>s.tipo==='energia'),ct=b.salas.find(s=>s.tipo==='control'),es=b.salas.find(s=>s.tipo==='esclusa');
    b.trip[3].sala=en.id;b.trip[0].sala=ct.id;b.trip[1].sala=en.id;b.trip[2].sala=ct.id;void es;
    return b;
  }
  /* ---------- consultas ---------- */
  const sala=id=>B().salas.find(s=>s.id===id);
  const tripulante=id=>B().trip.find(t=>t.id===id);
  const capacidad=s=>{const t=T(s.tipo);return t.trab?t.trab+(s.nivel-1):0;};
  /* Puestos admitidos: los de trabajo, la enfermería admite enfermos y una
     sala con incidente admite reparadores. */
  const cupo=s=>Math.max(capacidad(s)+(s.tipo==='enfermeria'?2*s.nivel:0)+(s.tipo==='refugio'&&B().tormenta?T(s.tipo).plazas*s.nivel:0),s.inc?2:0);
  const trabajadores=s=>B().trip.filter(t=>t.sala===s.id&&!t.exp&&!(t.enfermo>0&&s.tipo!=='enfermeria'));
  const horaLunar=()=>((B().hora%DIA_LUNAR_H)+DIA_LUNAR_H)%DIA_LUNAR_H;
  const esDia=()=>horaLunar()<DIA_LUZ_H;
  const horasCambio=()=>{const h=horaLunar();return h<DIA_LUZ_H?DIA_LUZ_H-h:DIA_LUNAR_H-h;};
  const diaLunar=()=>Math.floor(B().hora/DIA_LUNAR_H)+1;
  const cuenta=tipo=>B().salas.filter(s=>s.tipo===tipo).reduce((a,s)=>a+s.nivel,0);
  function topes(){const alm=cuenta('almacen'),en=cuenta('energia');return {alimentos:300+250*alm,agua:300+250*alm,o2:200+200*alm,hielo:300+250*alm,materiales:700+300*alm,energia:200+350*en};}
  const camas=()=>B().salas.filter(s=>s.tipo==='habitaculo').reduce((a,s)=>a+T(s.tipo).camas*s.nivel,0);
  function eficiencia(s){
    const t=T(s.tipo),b=B();if(s.inc&&(s.inc.tipo==='electrico'||s.inc.tipo==='incendio'))return 0;
    let e=1;
    if(t.trab){const ws=trabajadores(s);let p=0;ws.forEach(w=>p+=(t.rol!=null&&w.rol===t.rol)?1.5:1);e=.25+.75*Math.min(1.6,p/t.trab);}
    if(b.apagon&&s.tipo!=='energia')e*=s.tipo==='agua_o2'?.5:.3;   // el soporte vital tiene prioridad en la reserva
    const pr=b.prioridad;
    if(pr==='energia'&&['laboratorio','ocio','gimnasio'].includes(s.tipo))e*=.5;
    if(pr==='soporte'){if(['agua_o2','invernadero'].includes(s.tipo))e*=1.2;if(s.tipo==='laboratorio')e*=.5;}
    if(pr==='ciencia'){if(s.tipo==='laboratorio')e*=1.3;else if(s.tipo!=='energia')e*=.9;}
    return e;
  }
  /* ---------- flujos por hora (función pura: también la usan los
     jugadores que no son anfitrión para mostrar tendencias) ---------- */
  function calcularFlujo(opc={}){
    const b=B(),r=b.recursos,dia=opc.dia!=null?opc.dia:esDia(),inv=b.investigado;
    const f={energia:0,alimentos:0,agua:0,o2:0,co2:0,materiales:0,hielo:0,ciencia:0,integridad:0,demanda:0,solar:0,fundido:0};
    const nTrip=b.trip.filter(t=>!t.exp).length;let hieloDisp=Math.max(0,r.hielo);const topeO2=topes().o2;
    for(const s of b.salas){const t=T(s.tipo),m=NIVEL_MULT[s.nivel],e=eficiencia(s),p=t.prod||{},c=t.cons||{};
      const ahorro=b.prioridad==='energia'&&['laboratorio','ocio','gimnasio'].includes(s.tipo)?.5:1;
      f.demanda+=(c.energia||0)*m*ahorro+(dia?.2:.5);
      if(s.tipo==='energia'&&dia){const sol=p.energia*m*Math.max(.5,e)*(b.hechos[36]?1.25:1);f.energia+=sol;f.solar+=sol;}
      if(p.alimentos){f.alimentos+=p.alimentos*m*e*(inv.led?1.5:1);f.agua-=(c.agua||0)*m*e;}
      if(s.tipo==='agua_o2'){
        const fundir=Math.min(c.hielo*m*e,hieloDisp);hieloDisp-=fundir;f.hielo-=fundir;f.fundido+=fundir;f.agua+=fundir*(p.agua/c.hielo);
        // electrólisis bajo demanda: solo si falta O₂ y queda reserva de agua para beber
        const elec=p.o2*m*e*(inv.electrolisis?1.5:1);if(r.agua>25&&r.o2<topeO2*.6){f.o2+=elec;f.agua-=elec*.9;}
        if(inv.isru)f.o2+=.35*m*e;
        f.co2-=p.depura*m*e;}
      if(p.materiales)f.materiales+=p.materiales*m*e;
      if(p.integridad)f.integridad+=p.integridad*m*e;
      if(p.ciencia)f.ciencia+=p.ciencia*m*e;
      if(s.tipo==='habitaculo')f.co2-=.06*m;else if(s.tipo==='control')f.co2-=.03*m;   // depuradores básicos del hábitat
    }
    if(inv.reactor)f.energia+=18;
    f.o2-=CONSUMO_PERSONA.o2*nTrip;f.agua-=CONSUMO_PERSONA.agua*nTrip*(inv.agua98?.5:1);f.alimentos-=CONSUMO_PERSONA.alimentos*nTrip;f.co2+=CONSUMO_PERSONA.co2*nTrip;
    if(b.expedicion)f.o2-=.02;
    for(const s of b.salas)if(s.inc&&s.inc.tipo==='fuga')f.o2-=.45;
    f.energia-=f.demanda;
    return f;
  }
  /* Informe para la noche lunar: ¿cuánto duran las baterías? */
  function informeNoche(){
    const b=B(),fN=calcularFlujo({dia:false}),fD=calcularFlujo({dia:true});
    const consumo=Math.max(0,-fN.energia),aut=consumo>0?b.recursos.energia/consumo:Infinity;
    return {consumoNoche:consumo,netoDia:fD.energia,solarDia:fD.solar,bateria:b.recursos.energia,tope:topes().energia,autonomia:aut,noche:DIA_LUNAR_H-DIA_LUZ_H,esDia:esDia(),faltan:horasCambio(),reactor:!!b.investigado.reactor};
  }
  /* ---------- paso de simulación (dh en horas de juego, ≤ 1) ---------- */
  function paso(dh){
    const b=B(),r=b.recursos,tp=topes(),dia=esDia(),inv=b.investigado;
    const f=calcularFlujo();flujo=f;
    b.stats.aguaProducida+=f.fundido*dh;
    for(const k of ['alimentos','agua','o2','hielo','materiales']){r[k]=clamp(r[k]+f[k]*dh,0,tp[k]);}
    r.ciencia+=f.ciencia*dh;r.co2=clamp(r.co2+f.co2*dh,.04,6);r.integridad=clamp(r.integridad+f.integridad*dh,0,100);
    r.energia+=f.energia*dh;
    if(r.energia<=0){r.energia=0;if(!b.apagon){b.apagon=true;registrar('🌑 Apagón: las baterías se vaciaron. Todo funciona al mínimo.','apagon');}}
    else if(b.apagon&&r.energia>tp.energia*.1){b.apagon=false;registrar('Energía restablecida.','resuelto');}
    r.energia=Math.min(r.energia,tp.energia);
    // temperatura interior: el control térmico necesita energía; el regolito aísla
    const objT=b.apagon?(dia?30:(b.hechos[37]?14:10)):21;r.temp+=(objT-r.temp)*Math.min(1,dh*(b.apagon?.05:.4));
    // radiación (índice simulado) y salud
    const blind=(b.hechos[37]?.6:1)*(inv.blindaje?.4:1),gim=cuenta('gimnasio');
    const cur=b.salas.filter(x=>x.tipo==='enfermeria').reduce((a,x)=>a+T(x.tipo).prod.curacion*NIVEL_MULT[x.nivel]*eficiencia(x),0);
    let radMedia=0;
    for(const t of b.trip){
      const s=t.sala?sala(t.sala):null,pl=t.exp?0:(s?s.planta:1);
      const tor=b.tormenta?(s&&s.tipo==='refugio'?1:((b.refugio&&pl>=2)?2:25)):1;
      let tasa=Math.pow(.5,pl)*blind*tor;if(t.exp)tasa*=1.5;radMedia+=tasa;
      let ds=(r.alimentos>0&&r.o2>0&&r.agua>0)?.05:0;
      ds-=tasa*.03;ds+=gim?.05*gim:-.03;
      if(r.o2<=0)ds-=2;if(r.agua<=0)ds-=1;if(r.alimentos<=0)ds-=.6;if(r.co2>2)ds-=.8;if(r.temp<12||r.temp>28)ds-=.15;
      if(t.enfermo>0){if(s&&s.tipo==='enfermeria'){t.enfermo=Math.max(0,t.enfermo-cur*dh);ds+=1;}else{t.enfermo=Math.max(0,t.enfermo-.2*dh);ds-=.3;}
        if(t.enfermo<=0)registrar(`${t.nombre} se recuperó.`,'resuelto');}
      else if(s&&s.tipo==='enfermeria')ds+=.3;
      t.salud=clamp(t.salud+ds*dh,0,100);
    }
    r.rad=b.trip.length?radMedia/b.trip.length*1.6:0;
    for(const t of b.trip.slice()){if(t.salud<=0){b.trip=b.trip.filter(x=>x!==t);registrar(`${t.nombre} fue evacuado de emergencia a la Tierra por su salud.`,'enfermedad');}}
    // moral
    const nInc=b.salas.filter(s=>s.inc).length,haci=Math.max(0,b.trip.length-camas());
    const objM=58+6*cuenta('ocio')+4*cuenta('control')+(cuenta('invernadero')?5:0)-(r.alimentos<=0?30:0)-(b.apagon?18:0)-(dia?0:5)-5*nInc-6*haci-(b.tormenta?6:0);
    r.moral=clamp(r.moral+(clamp(objM,0,100)-r.moral)*Math.min(1,dh*.04),0,100);
    incidentes(dh);autoRespuesta();
    if(b.tormenta&&!b.refugio&&b.tormenta.t>=4&&typeof esNpc==='function'&&esNpc(0)){accion({t:'refugio'},0);}
    // tormenta solar
    if(b.tormenta){b.tormenta.t+=dh;if(b.tormenta.t>=b.tormenta.dur){b.tormenta=null;b.refugio=false;volverDelRefugio();registrar('La tormenta solar terminó.','resuelto');}}
    // expedición
    if(b.expedicion){const x=b.expedicion;x.t+=dh;if(x.t>=x.dur)terminarExpedicion();}
    // llegada de tripulantes y carga
    b.proxLlegada-=dh;
    if(b.proxLlegada<=0){b.proxLlegada=110;const libres=camas()-b.trip.length,tp2=topes();
      r.alimentos=Math.min(tp2.alimentos,r.alimentos+40);r.materiales=Math.min(tp2.materiales,r.materiales+80);
      if(libres>0&&r.moral>=45){const n=Math.min(2,libres);for(let i=0;i<n;i++)nuevoTripulante();registrar(`Llegó un módulo de carga con ${n} tripulante${n>1?'s':''} nuevo${n>1?'s':''}.`,'llegada');}
      else registrar(libres<=0?'Llegó carga, pero no hay camas libres para más tripulantes: construye habitáculos.':'Llegó carga. La moral está baja para recibir tripulantes.','llegada');}
    // noches y autosuficiencia
    if(!dia)b.nocheAnt=true;else if(b.nocheAnt){b.nocheAnt=false;if(b.trip.length){b.stats.noches++;registrar('¡Sobrevivieron a una noche lunar completa!','logro');}}
    const okR=k=>f[k]>=0||r[k]>=tp[k]*.5;   // un recurso cuenta si no baja o si hay reserva de sobra
    const autos=okR('o2')&&okR('agua')&&okR('alimentos')&&!b.apagon&&b.trip.length>0;b.stats.autosuf=autos?b.stats.autosuf+dh:0;
    // derrota suave
    const vital=r.o2<=0||r.agua<=0||r.alimentos<=0||r.integridad<=5;b.stats.sinVital=vital?b.stats.sinVital+dh:0;
    if(b.stats.sinVital>=24)evacuacion();
    if(b.trip.length===0)rescate();
    b.hora+=dh;
  }
  function registrar(msg,tipo='info'){const b=B();b.logSeq=(b.logSeq||0)+1;b.log.push({n:b.logSeq,h:Math.round(b.hora),msg,tipo});if(b.log.length>40)b.log.shift();if(window.BaseUI)BaseUI.notificar(msg,tipo);}
  function nuevoTripulante(){const b=B(),usados=new Set(b.trip.map(t=>t.nombre)),libres=NOMBRES_TRIPULANTES.filter(n=>!usados.has(n));
    b.trip.push({id:sigId++,nombre:libres.length?elegir(libres):'Tripulante '+sigId,rol:rand(4),salud:100,enfermo:0,sala:null,exp:false});}
  function incidentes(dh){
    const b=B(),polvo=b.investigado.polvo?.5:1;
    for(const s of b.salas){if(s.inc){const I=INCIDENTES_BASE[s.inc.tipo];
        if(I.trabajo>0){const ws=trabajadores(s);let p=0;ws.forEach(w=>p+=(I.rol!=null&&w.rol===I.rol)?2:1);s.inc.prog+=p*dh;
          if(s.inc.prog>=I.trabajo){resuelto(s);continue;}}
        s.inc.t+=dh;
        if(s.inc.tipo==='incendio'){b.recursos.integridad=Math.max(0,b.recursos.integridad-.4*dh);
          if(s.inc.t>8&&Math.random()<.05*dh){const vec=b.salas.find(o=>o!==s&&o.planta===s.planta&&!o.inc&&Math.abs(o.col-s.col)<=3);if(vec){vec.inc={tipo:'incendio',prog:0,t:0};registrar('🔥 ¡El incendio se extendió a '+T(vec.tipo).n+'!','incendio');}}}
        continue;}
      for(const k of ['fuga','electrico','incendio']){const I=INCIDENTES_BASE[k];const pr=I.prob*(k!=='incendio'?polvo:1)*(s.tipo==='esclusa'&&k==='fuga'?1.5:1);
        if(Math.random()<pr*dh*.15){s.inc={tipo:k,prog:0,t:0};registrar(`${I.icono} ${I.n} en ${T(s.tipo).n}.`,k);break;}}
    }
    if(Math.random()<INCIDENTES_BASE.impacto.prob*dh){const altas=b.salas.filter(s=>s.planta<=1&&!s.inc);const s=altas.length?elegir(altas):null;if(s){const dano=8*(b.hechos[37]?.5:1)*(b.investigado.blindaje?.5:1);
      b.recursos.integridad=Math.max(0,b.recursos.integridad-dano);s.inc={tipo:'impacto',prog:0,t:0};registrar(`${INCIDENTES_BASE.impacto.icono} Impacto de micrometeorito sobre ${T(s.tipo).n}.`,'impacto');}}
    if(!b.tormenta&&Math.random()<INCIDENTES_BASE.tormenta.prob*dh){b.tormenta={t:0,dur:INCIDENTES_BASE.tormenta.dur};registrar('☀️ ¡Tormenta solar! El Comandante debe ordenar el refugio en las plantas profundas.','tormenta');}
    const sanos=b.trip.filter(t=>!t.enfermo&&!t.exp);if(sanos.length&&Math.random()<INCIDENTES_BASE.enfermedad.prob*dh){const t=elegir(sanos);t.enfermo=10;registrar(`🤒 ${t.nombre} está enfermo: llévalo a la enfermería.`,'enfermedad');}
  }
  function resuelto(s){const I=INCIDENTES_BASE[s.inc.tipo];registrar(`${I.n} resuelto en ${T(s.tipo).n}.`,'resuelto');s.inc=null;
    B().trip.forEach(t=>{if(t.sala!==s.id)return;if(t.rep!==undefined){t.sala=t.rep;delete t.rep;}else if(!capacidad(s)&&s.tipo!=='enfermeria')t.sala=null;});}
  /* Un incidente sin atender durante 3 h: acude alguien sin puesto o, si no
     hay, quien tenga el rol adecuado; vuelve a su puesto al terminar. */
  function autoRespuesta(){const b=B();
    for(const s of b.salas){if(!s.inc)continue;const I=INCIDENTES_BASE[s.inc.tipo];if(!I.trabajo||s.inc.t<3||trabajadores(s).length)continue;
      let t=b.trip.find(x=>x.sala==null&&!x.exp&&!(x.enfermo>0));
      if(!t){const cand=b.trip.filter(x=>!x.exp&&!(x.enfermo>0)&&x.sala!==s.id&&x.rep===undefined);cand.sort((a,c)=>(c.rol===I.rol)-(a.rol===I.rol));t=cand[0];if(t)t.rep=t.sala;}
      if(t){t.sala=s.id;registrar(`${t.nombre} acude a ${T(s.tipo).n}.`);}}}
  function volverDelRefugio(){const b=B();b.trip.forEach(t=>{if(t.antes===undefined)return;const s=t.antes?sala(t.antes):null;
    if(!s||b.trip.filter(x=>x.sala===s.id&&x!==t).length<cupo(s))t.sala=t.antes;delete t.antes;});}
  function terminarExpedicion(){
    const b=B(),x=b.expedicion,E=EXPEDICIONES.find(e=>e.id===x.id);b.expedicion=null;
    const piloto=x.trip.some(id=>{const t=tripulante(id);return t&&t.rol===1;});
    const riesgo=E.riesgo*(b.investigado.rover?.5:1)*(piloto?.5:1),fallo=Math.random()<riesgo;
    const botin={};for(const k in E.botin){const [a,bb]=E.botin[k];botin[k]=Math.round((a+Math.random()*(bb-a))*(fallo?.5:1));}
    const tp=topes();for(const k in botin){if(k==='ciencia')b.recursos.ciencia+=botin[k];else b.recursos[k]=Math.min(tp[k],(b.recursos[k]||0)+botin[k]);if(k==='hielo')b.stats.hielo+=botin[k];}
    x.trip.forEach(id=>{const t=tripulante(id);if(t){t.exp=false;if(fallo)t.salud=Math.max(5,t.salud-20);}});
    const txt=Object.entries(botin).map(([k,v])=>`${v} ${k==='ciencia'?'pts de ciencia':k==='hielo'?'kg de hielo':k==='materiales'?'kg de materiales':'kg de alimentos'}`).join(', ');
    registrar(fallo?`🚙 El rover volvió de «${E.n}» con problemas (polvo y averías): trajo ${txt}.`:`🚙 El rover volvió de «${E.n}»: trajo ${txt}.`,'expedicion');
    if(window.BaseUI)BaseUI.datoReal('EXPEDICIÓN · '+E.n,E.dato,E.f);
  }
  function evacuacion(){
    const b=B();b.evac++;b.stats.sinVital=0;
    const quedan=Math.max(2,Math.ceil(b.trip.length/2));const se=b.trip.length-quedan;b.trip=b.trip.slice(0,quedan);
    b.salas.forEach(s=>{if(s.nivel>1)s.nivel--;s.inc=null;});b.trip.forEach(t=>{if(t.rep!==undefined){t.sala=t.rep;delete t.rep;}});const tp=topes();
    b.recursos.o2=tp.o2*.4;b.recursos.agua=tp.agua*.4;b.recursos.alimentos=tp.alimentos*.4;b.recursos.integridad=Math.max(b.recursos.integridad,40);
    registrar(`Evacuación parcial: ${se} tripulantes vuelven a la Tierra y las salas pierden un nivel. Llegan suministros y un equipo de reparación.`,'evacuacion');
    if(window.BaseUI)BaseUI.derrotaSuave(se);
  }
  function rescate(){const b=B(),tp=topes(),r=b.recursos;ROLES.forEach((x,i)=>b.trip.push({id:sigId++,nombre:x.quien,rol:i,salud:80,enfermo:0,sala:null,exp:false}));
    r.o2=Math.max(r.o2,tp.o2*.4);r.agua=Math.max(r.agua,tp.agua*.4);r.alimentos=Math.max(r.alimentos,tp.alimentos*.4);r.energia=Math.max(r.energia,tp.energia*.3);b.apagon=false;b.stats.sinVital=0;
    registrar('Misión de rescate: llega una tripulación nueva de 4 personas con suministros de emergencia.','evacuacion');}

  /* ---------- acciones (validadas por el anfitrión) ---------- */
  /* En el multijugador, cada acción es de un rol; si ese rol no lo lleva
     ningún jugador humano, cualquiera puede hacerla. */
  function puede(acc,rol){
    if(!Red.activa)return true;const p=PERMISOS_ROL[acc];if(!p||p.includes(rol))return true;
    const hum=rolesHumanos();return !p.some(r=>hum.has(r));
  }
  function ocupada(planta,col,ancho,ignorar){
    if(planta===0)return true;
    if(col<0||col+ancho>BASE_COLS)return true;if(col<=BASE_ASCENSOR&&col+ancho>BASE_ASCENSOR)return true;
    return B().salas.some(s=>s!==ignorar&&s.planta===planta&&col<s.col+T(s.tipo).ancho&&s.col<col+ancho);
  }
  function validarConstruccion(tipo,planta,col){const t=T(tipo);if(!t||t.superficie)return 'Tipo no válido.';if(planta<1||planta>B().plantas)return 'Esa planta no está excavada.';
    if(t.unico&&B().salas.some(s=>s.tipo===tipo))return 'Solo puede haber una.';if(ocupada(planta,col,t.ancho))return 'No cabe ahí.';if(B().recursos.materiales<t.costo)return `Faltan materiales (${t.costo} kg).`;return null;}
  const costeMejora=s=>Math.round((T(s.tipo).costo||150)*NIVEL_COSTE[s.nivel+1]);
  const costeExcavar=()=>COSTE_EXCAVAR+40*B().plantas;
  function accion(a,rol){
    const b=B();if(!b||!a)return {ok:false,msg:'Sin base.'};
    const no=acc=>({ok:false,msg:`En el multijugador, ${NOMBRE_PERMISO[acc]||acc} corresponde a: ${PERMISOS_ROL[acc].map(i=>ROLES[i].n).join(' o ')}.`});
    switch(a.t){
      case 'construir':{if(!puede('construir',rol))return no('construir');const err=validarConstruccion(a.tipo,a.planta|0,a.col|0);if(err)return {ok:false,msg:err};
        b.recursos.materiales-=T(a.tipo).costo;const s={id:sigId++,tipo:a.tipo,planta:a.planta|0,col:a.col|0,nivel:1,inc:null};b.salas.push(s);registrar(`🏗️ Construida: ${T(a.tipo).n}.`,'obra');return {ok:true,id:s.id};}
      case 'mejorar':{if(!puede('mejorar',rol))return no('mejorar');const s=sala(a.sala);if(!s||s.nivel>=3)return {ok:false,msg:'Ya está al máximo.'};const c=costeMejora(s);
        if(b.recursos.materiales<c)return {ok:false,msg:`Faltan materiales (${c} kg).`};b.recursos.materiales-=c;s.nivel++;registrar(`${T(s.tipo).n} mejorada a nivel ${s.nivel}.`,'obra');return {ok:true};}
      case 'excavar':{if(!puede('excavar',rol))return no('excavar');if(b.plantas>=BASE_PLANTAS)return {ok:false,msg:'No se puede excavar más.'};const c=costeExcavar();
        if(b.recursos.materiales<c)return {ok:false,msg:`Faltan materiales (${c} kg).`};b.recursos.materiales-=c;b.plantas++;registrar(`⛏️ Excavada la planta ${b.plantas}.`,'obra');return {ok:true};}
      case 'asignar':{const t=tripulante(a.trip);if(!t||t.exp)return {ok:false,msg:'No disponible.'};if(!puede('asignar',rol))return no('asignar');
        if(a.sala==null){t.sala=null;delete t.antes;delete t.rep;return {ok:true};}
        const s=sala(a.sala);if(!s)return {ok:false,msg:'Sala no válida.'};const cap=cupo(s);
        if(!cap)return {ok:false,msg:'En esa sala no hay puestos de trabajo.'};const ocup=b.trip.filter(x=>x.sala===s.id&&x!==t).length;if(ocup>=cap)return {ok:false,msg:'La sala está llena.'};
        t.sala=s.id;delete t.antes;delete t.rep;return {ok:true};}
      case 'investigar':{if(!puede('investigar',rol))return no('investigar');const x=INVESTIGACIONES.find(i=>i.id===a.id);if(!x||b.investigado[x.id])return {ok:false,msg:'No disponible.'};
        if(!b.salas.some(s=>s.tipo==='laboratorio'))return {ok:false,msg:'Necesitas un laboratorio.'};const c=costeInv(x);if(b.recursos.ciencia<c)return {ok:false,msg:`Faltan ${Math.ceil(c-b.recursos.ciencia)} pts de ciencia.`};
        b.recursos.ciencia-=c;b.investigado[x.id]=true;registrar(`🔬 Investigación completada: ${x.n}.`,'logro');if(window.BaseUI)BaseUI.datoReal('INVESTIGACIÓN · '+x.n,x.dato,x.f);return {ok:true};}
      case 'expedicion':{if(!puede('expedicion',rol))return no('expedicion');if(b.expedicion)return {ok:false,msg:'El rover ya está fuera.'};if(!b.salas.some(s=>s.tipo==='esclusa'))return {ok:false,msg:'Necesitas la esclusa.'};
        const E=EXPEDICIONES.find(e=>e.id===a.id);const ts=(a.trip||[]).map(tripulante).filter(t=>t&&!t.exp&&!t.enfermo);if(!E||!ts.length)return {ok:false,msg:'Elige 1 o 2 tripulantes sanos.'};
        if(b.tormenta)return {ok:false,msg:'Con tormenta solar no sale el rover.'};
        ts.slice(0,2).forEach(t=>{t.exp=true;});b.expedicion={id:E.id,trip:ts.slice(0,2).map(t=>t.id),t:0,dur:E.dur*(b.investigado.rover?.75:1)};registrar(`🚙 El rover sale hacia «${E.n}».`,'expedicion');return {ok:true};}
      case 'prioridad':{if(!puede('prioridad',rol))return no('prioridad');if(!PRIOS.includes(a.p))return {ok:false};b.prioridad=a.p;registrar('Nueva prioridad: '+({equilibrio:'equilibrio',energia:'ahorrar energía',soporte:'soporte vital',ciencia:'ciencia'}[a.p])+'.');return {ok:true};}
      case 'velocidad':{if(!puede('reloj',rol))return no('reloj');if(![0,1,3,6].includes(a.v))return {ok:false};b.vel=a.v;return {ok:true};}
      case 'refugio':{if(!puede('refugio',rol))return no('refugio');if(!b.tormenta)return {ok:false,msg:'No hay tormenta solar.'};if(b.refugio)return {ok:true};b.refugio=true;
        const refs=b.salas.filter(s=>s.tipo==='refugio'),prof=b.salas.filter(s=>s.planta>=2&&s.tipo!=='refugio').sort((x,y)=>y.planta-x.planta);
        b.trip.forEach(t=>{if(t.exp)return;const s=t.sala?sala(t.sala):null;if(s&&s.tipo==='refugio')return;
          const r=refs.find(x=>b.trip.filter(y=>y.sala===x.id).length<T('refugio').plazas*x.nivel);
          if(r){t.antes=t.sala;t.sala=r.id;return;}
          if(s&&s.planta>=2)return;
          const d=prof.find(x=>b.trip.filter(y=>y.sala===x.id).length<Math.max(cupo(x),2)+2);if(d){t.antes=t.sala;t.sala=d.id;}});
        registrar('Refugio ordenado: la tripulación baja a las plantas profundas.','resuelto');return {ok:true};}
      case 'ayudar':{const s=sala(a.sala);if(!s||!s.inc)return {ok:false};const I=INCIDENTES_BASE[s.inc.tipo];if(I.trabajo>0)s.inc.prog+=1.2;if(s.inc.prog>=I.trabajo)resuelto(s);return {ok:true};}
    }
    return {ok:false,msg:'Acción desconocida.'};
  }
  const costeInv=x=>Math.round(x.costo*(x.id==='reactor'&&B().hechos[39]?.6:1));
  /* Efectos de las misiones de superficie (fase 7). */
  function alCompletarMision(id){
    const b=B();if(!b||b.hechos[id])return;b.hechos[id]=true;
    if(id===36)registrar('Paneles de superficie inclinados hacia el Sol bajo del polo: +25 % de energía solar.','logro');
    if(id===37){b.recursos.integridad=Math.min(100,b.recursos.integridad+20);registrar('Hábitat cubierto con regolito: menos radiación y menos daño por impactos.','logro');}
    if(id===38){b.recursos.hielo=Math.min(topes().hielo,b.recursos.hielo+80);b.stats.hielo+=80;registrar('El rover encontró hielo: +80 kg.','logro');}
    if(id===39)registrar('Plan de energía nocturno aprobado: el reactor de fisión cuesta menos ciencia.','logro');
  }
  /* Tareas de superficie de los roles que lleva la IA (segundos reales). */
  function tareasNpc(dtReal){const b=B();for(const id of [36,37,38,39]){if(JUEGO.hecho[id])continue;const m=MISIONES[id];if(!esNpc(m.rol)||!reqOk(m))continue;b.tareaNpc[id]-=dtReal;if(b.tareaNpc[id]<=0)Nave.completar(id,'npc');}}
  /* ---------- objetivos ---------- */
  function objetivos(){
    const b=B();if(!b)return [];
    const ok={montaje:[36,37,38,39].every(i=>JUEGO.hecho[i]),agua_o2:b.salas.some(s=>s.tipo==='agua_o2'),invernadero:b.salas.some(s=>s.tipo==='invernadero'),hielo:b.stats.hielo>=100,
      noche:b.stats.noches>=1,aguaPropia:b.stats.aguaProducida>=100,trip8:b.trip.length>=8,reactor:!!b.investigado.reactor,trip12:b.trip.length>=12,autosuficiente:b.stats.autosuf>=DIA_LUNAR_H||!!b.hechos.auto};
    if(ok.autosuficiente)b.hechos.auto=true;
    let actual=true;return OBJETIVOS_BASE.map(o=>{const h=!!ok[o.id];const r={id:o.id,n:o.n,hecho:h,actual:!h&&actual};if(!h)actual=false;return r;});
  }
  /* ---------- red: instantánea compacta (cabe en la presencia de 4 KiB) ---------- */
  const r1=v=>Math.round((+v||0)*10)/10;
  const codNombre=n=>{let i=NOMBRES_ROL.indexOf(n);if(i>=0)return 'R'+i;i=NOMBRES_TRIPULANTES.indexOf(n);return i>=0?i:String(n).slice(0,30);};
  const decNombre=c=>typeof c==='number'?(NOMBRES_TRIPULANTES[c]||'Tripulante'):(/^R[0-3]$/.test(String(c))?NOMBRES_ROL[+String(c)[1]]:String(c||'Tripulante').slice(0,30));
  function snapshot(){const b=B(),r=b.recursos;
    return {h:r1(b.hora),p:b.plantas,
      r:[r.energia,r.alimentos,r.agua,r.o2,r.co2,r.materiales,r.hielo,r.ciencia,r.integridad,r.temp,r.moral,r.rad||0].map(v=>Math.round((+v||0)*100)/100),
      s:b.salas.map(s=>[s.id,TIPOS.indexOf(s.tipo),s.planta,s.col,s.nivel,s.inc?INCS.indexOf(s.inc.tipo):-1,s.inc?r1(s.inc.prog):0,s.inc?r1(s.inc.t):0]),
      t:b.trip.map(t=>[t.id,codNombre(t.nombre),t.rol,Math.round(t.salud),r1(t.enfermo),t.sala||0,t.exp?1:0]),
      i:INVESTIGACIONES.map(x=>b.investigado[x.id]?'1':'0').join(''),
      x:b.expedicion?[EXPEDICIONES.findIndex(e=>e.id===b.expedicion.id),r1(b.expedicion.t),r1(b.expedicion.dur),...b.expedicion.trip]:0,
      to:b.tormenta?[r1(b.tormenta.t),b.tormenta.dur]:0,rf:b.refugio?1:0,ap:b.apagon?1:0,pr:PRIOS.indexOf(b.prioridad),v:b.vel,
      st:[r1(b.stats.aguaProducida),b.stats.noches,r1(b.stats.autosuf),r1(b.stats.hielo),r1(b.stats.sinVital)],
      hc:[36,37,38,39].map(i=>b.hechos[i]?'1':'0').join('')+(b.hechos.auto?'1':'0'),
      g:b.ganado?1:0,e:b.evac,px:r1(b.proxLlegada),nl:b.nocheAnt?1:0,
      l:b.log.slice(-4).map(l=>[l.n,l.h,l.tipo,String(l.msg).slice(0,220)])};
  }
  function aplicarSnapshot(s){
    if(!s||typeof s!=='object')return;if(!JUEGO.base)nueva();const b=B();
    try{
      b.hora=+s.h||0;b.plantas=clamp(s.p|0,1,BASE_PLANTAS);
      const R=Array.isArray(s.r)?s.r:[];['energia','alimentos','agua','o2','co2','materiales','hielo','ciencia','integridad','temp','moral','rad'].forEach((k,i)=>{if(typeof R[i]==='number'&&isFinite(R[i]))b.recursos[k]=R[i];});
      b.salas=(Array.isArray(s.s)?s.s:[]).filter(a=>Array.isArray(a)&&TIPOS[a[1]]).map(a=>({id:a[0]|0,tipo:TIPOS[a[1]],planta:clamp(a[2]|0,0,BASE_PLANTAS),col:clamp(a[3]|0,0,BASE_COLS-1),nivel:clamp(a[4]|0,1,3),inc:(a[5]>=0&&INCS[a[5]])?{tipo:INCS[a[5]],prog:+a[6]||0,t:+a[7]||0}:null}));
      b.trip=(Array.isArray(s.t)?s.t:[]).filter(Array.isArray).map(a=>({id:a[0]|0,nombre:decNombre(a[1]),rol:clamp(a[2]|0,0,3),salud:clamp(+a[3]||0,0,100),enfermo:+a[4]||0,sala:(a[5]|0)||null,exp:!!a[6]}));
      b.investigado={};INVESTIGACIONES.forEach((x,i)=>{if(String(s.i||'')[i]==='1')b.investigado[x.id]=true;});
      b.expedicion=Array.isArray(s.x)&&EXPEDICIONES[s.x[0]]?{id:EXPEDICIONES[s.x[0]].id,t:+s.x[1]||0,dur:+s.x[2]||1,trip:s.x.slice(3).map(v=>v|0)}:null;
      b.tormenta=Array.isArray(s.to)?{t:+s.to[0]||0,dur:+s.to[1]||30}:null;
      b.refugio=!!s.rf;b.apagon=!!s.ap;b.prioridad=PRIOS[s.pr]||'equilibrio';b.vel=[0,1,3,6].includes(s.v)?s.v:1;
      const st=Array.isArray(s.st)?s.st:[];b.stats={aguaProducida:+st[0]||0,noches:st[1]|0,autosuf:+st[2]||0,hielo:+st[3]||0,sinVital:+st[4]||0};
      const hc=String(s.hc||'');b.hechos={};[36,37,38,39].forEach((id,i)=>{if(hc[i]==='1')b.hechos[id]=true;});if(hc[4]==='1')b.hechos.auto=true;
      b.ganado=!!s.g;b.evac=s.e|0;b.proxLlegada=+s.px||0;b.nocheAnt=!!s.nl;
      for(const l of (Array.isArray(s.l)?s.l:[])){if(!Array.isArray(l))continue;const n=l[0]|0;
        if(n>(b.logSeq||0)){b.logSeq=n;const e={n,h:l[1]|0,tipo:String(l[2]||'info').slice(0,20),msg:String(l[3]||'').slice(0,220)};b.log.push(e);if(b.log.length>40)b.log.shift();if(window.BaseUI)BaseUI.notificar(e.msg,e.tipo);}}
      sigId=Math.max(sigId,...b.salas.map(x=>x.id+1),...b.trip.map(x=>x.id+1));
    }catch(e){console.warn('Instantánea de la base no válida',e);}
  }
  function cargar(b){JUEGO.base=b;b.log=b.log||[];b.logSeq=b.logSeq||b.log.length;b.tareaNpc=b.tareaNpc||{36:30,37:45,38:55,39:40};sigId=Math.max(1,...b.salas.map(x=>x.id+1),...b.trip.map(x=>x.id+1));}
  return {nueva,paso,accion,puede,objetivos,validarConstruccion,ocupada,capacidad,cupo,trabajadores,eficiencia,esDia,horaLunar,horasCambio,diaLunar,topes,camas,cuenta,sala,tripulante,
    alCompletarMision,tareasNpc,snapshot,aplicarSnapshot,cargar,costeInv,costeMejora,costeExcavar,calcularFlujo,informeNoche,registrar,get flujo(){return flujo;}};
})();
