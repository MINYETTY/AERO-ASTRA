/* =====================================================================
   cinematicas.js — escenas cortas dibujadas en píxeles (estilo imagen).
   Cada escena: dur (s), texto(t) y dibujo(g,w,h,t).
   ===================================================================== */
const Cine = (()=>{
  const est=Arte.crearEstrellas(90,9);
  const R=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  /* Cohete SLS + Orión en píxeles (x centro, y base). */
  function sls(g,x,y,conBoost=true,llama=0){
    R(g,x-4,y-48,8,48,'#e0782e');R(g,x-4,y-48,2,48,'#f5a050');R(g,x+2,y-48,2,48,'#b85a1e');
    R(g,x-3,y-56,6,8,'#e8ecff');R(g,x-2,y-60,4,4,'#d0d4ec');R(g,x-1,y-66,2,6,'#c8ccec');
    if(conBoost){[-9,5].forEach(dx=>{R(g,x+dx,y-38,4,38,'#eef0ff');R(g,x+dx,y-42,4,4,'#d8dcf4');R(g,x+dx+3,y-38,1,38,'#b8bcd8');});}
    if(llama>0){const L=llama;R(g,x-3,y,6,L,'#ffd84a');R(g,x-2,y,4,L*.6,'#ffffff');
      if(conBoost){[-9,5].forEach(dx=>{R(g,x+dx,y,4,L*1.2,'#ff9a3c');R(g,x+dx+1,y,2,L*.7,'#ffe9a0');});}}
  }
  /* Orión con módulo de servicio y alas solares en X. */
  function orion(g,x,y,esc=1,motor=0){
    const s=esc;R(g,x-6*s,y-4*s,10*s,8*s,'#d8dcf0');R(g,x+4*s,y-3*s,4*s,6*s,'#eef0ff');R(g,x+8*s,y-2*s,2*s,4*s,'#c8ccec');
    R(g,x-8*s,y-3*s,2*s,6*s,'#8a8fc0');
    for(const [dx,dy] of [[-1,-1],[-1,1]]){for(let i=0;i<4;i++)R(g,x-4*s+dx*i*3*s,y+dy*(5+i*3)*s,3*s,2*s,i%2?'#2f5fbf':'#3f7ae0');}
    R(g,x+5*s,y-1*s,2*s,2*s,'#3aa0d8');
    if(motor>0){R(g,x-12*s-motor*s,y-1*s,4*s+motor*s,2*s,Math.random()<.5?'#ffd84a':'#ff9a3c');}
  }
  const ESCENAS={
    intro:{dur:7,texto:t=>t<3.5?'Centro Espacial Kennedy, Florida':'Misión Orión · Comienza la cuenta atrás',
      dibujo(g,w,h,t){
        g.drawImage(Arte.cielo(w,h,'espacio'),0,0);Arte.estrellas(g,w,h*.7,t,est);
        const amanecer=clamp(t/7,0,1);g.globalAlpha=.35*amanecer;R(g,0,h*.55,w,h*.45,'#ff8a5a');g.globalAlpha=1;
        R(g,0,h*.82,w,h*.18,'#1d2a1e');R(g,0,h*.82,w,1,'#3a5a3a');
        const cx=w*.5,base=h*.82;R(g,cx-40,base-74,5,74,'#7a7a92');for(let i=0;i<7;i++)R(g,cx-40,base-70+i*10,14,2,'#7a7a92');
        sls(g,cx,base-2,true,0);
        if(((t*2)|0)%2)R(g,cx-38,base-76,2,2,'#ff4a4a');
      }},
    despegue:{dur:10,texto:t=>t<3?'T−'+Math.ceil(3-t):t<3.6?'¡IGNICIÓN!':t<6.5?'DESPEGUE':t<8?'Separación de los propulsores':'Rumbo a la órbita',
      dibujo(g,w,h,t){
        const alt=clamp((t-3.4)/5,0,1);
        g.drawImage(Arte.cielo(w,h,alt<.5?'dia':'espacio'),0,0);
        if(alt>.4){g.globalAlpha=(alt-.4)/.6;g.drawImage(Arte.cielo(w,h,'espacio'),0,0);Arte.estrellas(g,w,h,t,est,0,t*30);g.globalAlpha=1;}
        const lt=Math.max(0,t-3.4),gy=h*.82+lt*lt*7,cx=w*.5;
        const sube=Math.min(lt*lt*5,h*.32),by=gy-2-sube,sh=t>2.2&&t<3.6?(Math.random()<.5?1:-1):0;
        if(gy<h){R(g,0,gy,w,h-gy,'#1d2a1e');R(g,cx-40,gy-74,5,74,'#7a7a92');}
        const conB=t<6.8;
        sls(g,cx+sh,by,conB,t>2.4?8+Math.random()*12+lt*4:0);
        if(!conB){const k=t-6.8;[-1,1].forEach(s=>{R(g,cx+s*(10+k*10),by-30+k*k*14,4,30,'#eef0ff');});}
        if(t>2.4&&gy<h){g.fillStyle='rgba(235,235,245,.75)';for(let i=0;i<9;i++){const r=5+i*3+lt*4;g.fillRect(cx-28-i*6-lt*5,gy-r*.5,r,r*.5);g.fillRect(cx+22+i*6+lt*5,gy-r*.5,r,r*.5);}}
        if(t>2.2&&t<3.6)Sonido.tono(70+Math.random()*50,.08,'sawtooth',.025);
      }},
    tli:{dur:8,texto:t=>t<3?'Órbita terrestre alta':t<6?'Encendido de inyección translunar':'Rumbo a la Luna',
      dibujo(g,w,h,t){
        g.drawImage(Arte.cielo(w,h),0,0);Arte.estrellas(g,w,h,t,est,t*4,0);
        const k=clamp((t-3)/5,0,1),er=Math.round(lerp(h*.7,h*.22,k*k));
        g.drawImage(Arte.tierra(er,t*.06,t*.09),Math.round(w*.18-er-k*w*.1),Math.round(h*.95-er+k*h*.2));
        orion(g,w*.55+k*w*.18,h*.4,1,t>3&&t<6.5?4+Math.random()*3:0);
      }},
    caraoculta:{dur:9,texto:t=>t<3?'La Luna llena la ventana':t<6?'Pérdida de señal: detrás de la Luna':'Adquisición de señal',
      dibujo(g,w,h,t){
        g.drawImage(Arte.cielo(w,h),0,0);Arte.estrellas(g,w,h,t,est);
        const lr=Math.round(lerp(h*.25,h*.62,clamp(t/6,0,1)));g.drawImage(Arte.luna(lr,t*.03,-.3),Math.round(w*.62-lr),Math.round(h*.55-lr));
        orion(g,w*.28,h*.42,1,0);
        if(t>3&&t<6){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,w,h);for(let i=0;i<120;i++){g.fillStyle=Math.random()<.5?'#2a2a3a':'#6a6a7a';g.fillRect(rand(w),rand(h),2,1);}}
        if(t>6){const er=Math.round(h*.08);g.drawImage(Arte.tierra(er,t*.05,t*.07),Math.round(w*.62+lr*.2-er),Math.round(h*.55-lr-er*1.2+(t-6)*-2));}
      }},
    alunizaje:{dur:9,texto:t=>t<4?'Descenso final':t<6.5?'Contacto. Motor apagado.':'Bienvenidos a la Luna',
      dibujo(g,w,h,t){
        Arte.escenaLunar(g,w,h,t,est,{horizonte:Math.round(h*.6),radioTierra:Math.round(h*.12),tierraX:Math.round(w*.72)});
        const y=lerp(h*.15,h*.6+4,clamp(t/5,0,1)),x=w*.4;
        R(g,x-7,y-14,14,10,'#c8ccec');R(g,x-6,y-13,12,3,'#eef0ff');R(g,x-9,y-4,3,6,'#8a8fc0');R(g,x+6,y-4,3,6,'#8a8fc0');R(g,x-2,y-18,4,4,'#d8b04a');
        if(t<5){R(g,x-2,y+2,4,4+Math.random()*4,'#ffd84a');g.fillStyle='rgba(200,200,215,.55)';for(let i=0;i<10;i++){const k=(5-t);g.fillRect(x-20-i*4+Math.random()*3,h*.6+2-k,6,2);g.fillRect(x+16+i*4,h*.6+2-k,6,2);}}
      }},
    base:{dur:10,texto:t=>t<4?'Un primer paso para toda la tripulación':t<7?'Empieza la base lunar':'Acto 2 · Base lunar',
      dibujo(g,w,h,t){
        const pan=clamp((t-5)/4,0,1),hs=Math.round(h*.6-pan*h*.45);
        Arte.escenaLunar(g,w,h,t,est,{horizonte:hs,radioTierra:Math.round(h*.12),tierraX:Math.round(w*.72)});
        if(pan>0){R(g,0,hs+6,w,h-hs-6,'#4a4048');for(let i=0;i<w;i+=7)R(g,i,hs+10+((i*13)%20),3,2,'#3a3238');
          const k=pan;for(let p=0;p<3;p++){R(g,w*.2,hs+18+p*16,w*.6*k,12,['#3d2d5c','#203e52','#5a5226'][p]);}}
        if(t<5){const x=w*.4+t*3,y=h*.6;g.drawImage(spriteAstro('#ff7a59',((t*3)|0)%2),Math.round(x),Math.round(y-12));
          for(let i=0;i<t*2;i++)R(g,w*.4+i*3,y-1,2,1,'#5a5a6a');}
      }}
  };
  let activa=null;
  function reproducir(tipo,alTerminar){
    const sec=$('cine'),cv=$('cinecv'),g=cv.getContext('2d'),E=ESCENAS[tipo];
    if(!E){if(alTerminar)alTerminar();return;}
    sec.hidden=false;const esc=4;cv.width=Math.max(60,Math.ceil(sec.clientWidth/esc));cv.height=Math.max(60,Math.ceil(sec.clientHeight/esc));g.imageSmoothingEnabled=false;
    const t0=performance.now();let raf=0,fin=false;
    const terminar=()=>{if(fin)return;fin=true;cancelAnimationFrame(raf);sec.hidden=true;$('saltar').onclick=null;activa=null;if(alTerminar)alTerminar();};
    $('saltar').onclick=terminar;activa={tipo,terminar};
    (function bucle(ahora){const t=(ahora-t0)/1000;E.dibujo(g,cv.width,cv.height,t);$('cinetxt').textContent=E.texto(t);if(t>=E.dur)terminar();else raf=requestAnimationFrame(bucle);})(t0);
  }
  return {reproducir,ESCENAS,get activa(){return activa;},orion,sls};
})();
