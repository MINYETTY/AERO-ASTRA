/* =====================================================================
   trayecto.js — MODELO DEL TRAYECTO TIERRA → LUNA (simplificado).

   Constantes: μT = 398 600.4 km³/s² (Tierra), μL = 4 902.8 km³/s² (Luna),
   RT = 6 371 km, RL = 1 737.4 km, D = 384 400 km (distancia media
   Tierra–Luna, NASA), c = 299 792.458 km/s.

   1) ASCENSO (MET 0 a 486 s, corte de motores de Artemis II a 8 min 6 s):
      curva de juego h(t) = 160·(t/486)^1.3 km y v(t) = 7.8·(t/486)^1.1 km/s.
      El exponente 1.1 hace que pase por unos 1.8 km/s (≈4,000 mph) a los
      2 min, como informó la NASA para Artemis I.

   2) ÓRBITA TERRESTRE (leyes de Kepler). Para perigeo rp y apogeo ra:
         a = (rp + ra)/2,  e = (ra − rp)/(ra + rp),  n = √(μT/a³)
         M = n·(t − tp)  →  se resuelve  E − e·sen E = M  (Newton)
         r = a·(1 − e·cos E)        v = √(μT·(2/r − 1/a))   (vis-viva)
      Por eso la nave va rápida en el perigeo y lenta en el apogeo.
      · Órbita inicial: 185 × 2 222 km (115 × 1381 millas, kit de prensa).
      · Órbita alta desde 1 h 47 min 57 s: 185 × 71 655 km
        (115 × 44 525 millas). El perigeo coincide con la TLI.

   3) TRÁNSITO TRANSLUNAR desde la TLI (MET 1 d 1 h 37 min = 92 220 s).
      Modelo de energía en la recta Tierra–Luna (problema de tres cuerpos
      reducido a una dimensión, la Luna quieta):
         ε = v²/2 − μT/r − μL/(D − r) = constante
         v(r) = √( 2·(ε + μT/r + μL/(D − r)) )
      Al alejarse domina μT/r y la nave FRENA; cerca de la Luna crece
      μL/(D − r) y ACELERA. El tiempo sale de integrar dt = dr / v(r)
      (regla del trapecio). ε se ajusta por bisección para llegar al máximo
      acercamiento (6 545 km sobre la superficie, dato de Artemis II) a
      MET 5 d 1 h 23 min (436 980 s, plan de Artemis II).

   4) ÓRBITA LUNAR (SIMULACIÓN: Artemis II no orbitó la Luna). La altitud
      baja de 6 545 km a 100 km con una exponencial y luego es circular:
         v = √(μL/r),  periodo T = 2π·√(r³/μL)  (≈ 2 h a 100 km)
      Hay pérdida de señal cuando la nave queda detrás de la Luna vista
      desde la Tierra: cos θ < 0 y |sen θ| < RL/r.

   5) Retardo de radio (una vía) = distancia a la Tierra / c.
   ===================================================================== */
const Trayecto = (()=>{
  const MU_T=398600.4418, MU_L=4902.8, R_T=6371, R_L=1737.4, D=384400, C=299792.458;
  const LEO={rp:R_T+185,ra:R_T+2222}, HEO={rp:R_T+185,ra:R_T+71655};
  const T_MECO=486, T_HEO0=6477, T_TLI=92220, T_CA=436980, ALT_CA=6545, ALT_LLO=100;
  const periodo=o=>2*Math.PI*Math.sqrt(Math.pow((o.rp+o.ra)/2,3)/MU_T);
  const T_LEO=periodo(LEO), T_HEO=periodo(HEO);
  const TP_HEO=T_TLI-T_HEO, TP_LEO=T_MECO;

  function kepler(o,t,tp){
    const a=(o.rp+o.ra)/2,e=(o.ra-o.rp)/(o.ra+o.rp),n=Math.sqrt(MU_T/(a*a*a));
    let M=(n*(t-tp))%(2*Math.PI);if(M<0)M+=2*Math.PI;
    let E=e>.8?Math.PI:M;
    for(let i=0;i<40;i++){const f=E-e*Math.sin(E)-M;E-=f/(1-e*Math.cos(E));}
    const r=a*(1-e*Math.cos(E));return {r,v:Math.sqrt(MU_T*(2/r-1/a)),M};
  }
  /* ---- tránsito: tabla tiempo → (r, v) ---- */
  let tabla=null;
  const vEn=(r,eps)=>{const x=2*(eps+MU_T/r+MU_L/(D-r));return x>0?Math.sqrt(x):0;};
  const rDe=(r0,r1,s)=>r0+(r1-r0)*(.5-.5*Math.cos(Math.PI*s)); // malla más fina en los extremos
  function integrar(eps,r0,r1,N){
    let t=0,rp=r0,vp=vEn(r0,eps);const ts=[0],rs=[r0],vs=[vp];
    for(let i=1;i<=N;i++){const r=rDe(r0,r1,i/N),v=vEn(r,eps);if(v<=0)return null;t+=(r-rp)*2/(v+vp);ts.push(t);rs.push(r);vs.push(v);rp=r;vp=v;}
    return {ts,rs,vs};
  }
  function construir(){
    const r0=HEO.rp,r1=D-(R_L+ALT_CA),dur=T_CA-T_TLI;let lo=-1.6,hi=1;
    for(let k=0;k<64;k++){const m=(lo+hi)/2,res=integrar(m,r0,r1,1200);const t=res?res.ts[res.ts.length-1]:Infinity;if(t>dur)lo=m;else hi=m;}
    const eps=(lo+hi)/2;tabla=integrar(eps,r0,r1,3000);tabla.eps=eps;
  }
  function transito(dt){
    if(!tabla)construir();const {ts,rs,vs}=tabla,n=ts.length-1;
    if(dt<=0)return {r:rs[0],v:vs[0]};if(dt>=ts[n])return {r:rs[n],v:vs[n]};
    let lo=0,hi=n;while(hi-lo>1){const m=(lo+hi)>>1;if(ts[m]<=dt)lo=m;else hi=m;}
    const k=(dt-ts[lo])/(ts[hi]-ts[lo]);return {r:lerp(rs[lo],rs[hi],k),v:lerp(vs[lo],vs[hi],k)};
  }
  /* Estado completo para un MET dado.
     ctx = {loi: MET de la inserción lunar o null, aterrizado: bool}. */
  function estado(met,ctx={}){
    const s={met,zona:'',rT:R_T,v:0,dT:0,dL:0,altL:null,los:false,retardo:0,theta:0};
    if(ctx.aterrizado){s.zona='superficie';s.rT=D;s.dT=D-R_T-R_L;s.dL=0;s.v=0;s.altL=0;}
    else if(met<0){s.zona='plataforma';s.rT=R_T;s.dT=0;s.v=0;}
    else if(met<T_MECO){const k=clamp(met/T_MECO,0,1);s.zona='ascenso';s.rT=R_T+160*Math.pow(k,1.3);s.v=7.8*Math.pow(k,1.1);}
    else if(met<T_HEO0){const o=kepler(LEO,met,TP_LEO);s.zona='orbita baja';s.rT=o.r;s.v=o.v;}
    else if(met<T_TLI){const o=kepler(HEO,met,TP_HEO);s.zona='órbita alta';s.rT=o.r;s.v=o.v;}
    else if(ctx.loi==null||met<ctx.loi){
      const o=transito(met-T_TLI);s.zona=met<T_CA-40000?'tránsito':'aproximación';s.rT=o.r;s.v=o.v;
      if(met>T_CA&&ctx.loi==null){s.rT=D-(R_L+ALT_CA);s.v=vEn(s.rT,tabla.eps);}
    }else{
      const tl=met-ctx.loi,alt=ALT_LLO+(ALT_CA-ALT_LLO)*Math.exp(-tl/5400),r=R_L+alt;
      const w=Math.sqrt(MU_L/(r*r*r)),th=Math.PI/2+w*tl;
      s.zona='órbita lunar (simulada)';s.altL=alt;s.v=Math.sqrt(MU_L/r);s.theta=th;
      s.rT=D-r*Math.cos(th);
      const c=Math.cos(th),sn=Math.abs(Math.sin(th));s.los=c<0&&sn<R_L/r;
    }
    if(s.zona!=='órbita lunar (simulada)'&&s.zona!=='superficie'){s.dL=Math.max(0,D-s.rT-R_L);}
    else if(s.altL!=null)s.dL=s.altL;
    s.dT=Math.max(0,s.rT-R_T);
    s.retardo=s.zona==='plataforma'?0:s.rT/C;
    return s;
  }
  /* Tiempo (MET) que falta para recuperar la señal tras la cara oculta. */
  function aosEn(met,ctx){let t=met;for(let i=0;i<400;i++){t+=20;if(!estado(t,ctx).los)return t-met;}return 0;}
  return {estado,aosEn,transito,constantes:{MU_T,MU_L,R_T,R_L,D,C,T_TLI,T_CA,T_HEO,T_LEO},get eps(){if(!tabla)construir();return tabla.eps;}};
})();
