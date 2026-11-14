/* =====================================================================
   minijuegos.js — 21 minijuegos. Cada uno: MG[nombre](caja, ganar, o, ctx)
   y devuelve una función de limpieza. ctx = {retardo, color}.
   ===================================================================== */
const MG = {};
const teclas = new Set();
window.addEventListener('keydown',e=>teclas.add(e.key.toLowerCase()));
window.addEventListener('keyup',e=>teclas.delete(e.key.toLowerCase()));
function lienzoMG(caja,w,h,clase='mgcv'){const c=document.createElement('canvas');c.width=w;c.height=h;c.className=clase;caja.appendChild(c);const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g];}
function botonMantener(btn,alPulsar,alSoltar){
  const d=e=>{e.preventDefault();alPulsar();},u=()=>alSoltar();
  btn.addEventListener('pointerdown',d);window.addEventListener('pointerup',u);btn.addEventListener('pointercancel',u);btn.addEventListener('pointerleave',u);
  return ()=>window.removeEventListener('pointerup',u);
}

/* 1 · Interruptores en orden (también: ponerse el traje, cronologías). */
MG.interruptores=(caja,ganar,o)=>{
  const items=o.items||['ENERGÍA','COMUNICACIONES','PROPULSIÓN','SOPORTE VITAL','AVIÓNICA'],orden=items.map((_,i)=>i);let i=0;
  caja.innerHTML=`<p class="estado">${o.titulo||'Activa en este orden'}</p><div class="seq">${orden.map((k,j)=>`<b id="sq${j}">${j+1}. ${items[k]}</b>`).join('')}</div><div class="sws"></div><p class="pista">Si te equivocas, empiezas de nuevo.</p>`;
  const sws=caja.querySelector('.sws'),bs=[];
  barajar(items.map((_,k)=>k)).forEach(k=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=items[k];bs.push(b);
    b.onclick=()=>{if(orden[i]===k){b.disabled=true;caja.querySelector('#sq'+i).classList.add('ok');i++;Sonido.tono(500+i*80,.08);if(i===items.length)ganar();}
      else{Sonido.error();i=0;bs.forEach(x=>x.disabled=false);caja.querySelectorAll('.seq b').forEach(x=>x.classList.remove('ok'));}};sws.appendChild(b);});
};
/* 2 · Sincronía: fija la marca en la zona verde. */
MG.sincronia=(caja,ganar,o)=>{
  let pos=0,dir=1,vel=o.vel||.9,ac=0,ult=performance.now(),raf=0;const N=o.aciertos||3;
  caja.innerHTML=`<div class="puntos" id="nd">${'○'.repeat(N)}</div><div class="pista2"><div class="zona"></div><div class="marca" id="nm"></div></div><button class="btn grande" id="nf" type="button">${o.boton||'FIJAR'}</button><p class="pista">Pulsa cuando la marca esté en la zona verde. Necesitas ${N} aciertos.</p>`;
  const m=caja.querySelector('#nm'),p=caja.querySelector('#nd');
  const bucle=t=>{const dt=Math.min(.05,(t-ult)/1000);ult=t;pos+=dir*vel*dt;if(pos>1){pos=1;dir=-1;}if(pos<0){pos=0;dir=1;}m.style.left=`calc(${pos*100}% - 3px)`;raf=requestAnimationFrame(bucle);};
  raf=requestAnimationFrame(bucle);
  caja.querySelector('#nf').onclick=()=>{if(Math.abs(pos-.5)<=.09){ac++;vel*=1.2;Sonido.tono(660,.1);}else{ac=Math.max(0,ac-1);Sonido.error();}p.textContent='●'.repeat(ac)+'○'.repeat(N-ac);if(ac>=N)ganar();};
  return ()=>cancelAnimationFrame(raf);
};
/* 3 · Memoria de luces. */
MG.memoria=(caja,ganar,o)=>{
  const L=o.lens||[3,4,5],tm=[];let sec=[],ronda=0,ent=0,bloq=true;
  caja.innerHTML='<p class="estado" id="rs"></p><div class="pads"></div><p class="pista">Repite la secuencia de luces en el mismo orden.</p>';
  const st=caja.querySelector('#rs'),pads=caja.querySelector('.pads'),bs=[];
  for(let i=0;i<9;i++){const b=document.createElement('button');b.type='button';b.className='pad';b.setAttribute('aria-label','Panel '+(i+1));b.onclick=()=>pulsa(i);pads.appendChild(b);bs.push(b);}
  const flash=n=>{bs[n].classList.add('lit');Sonido.tono(300+n*60,.2);tm.push(setTimeout(()=>bs[n].classList.remove('lit'),350));};
  function jugar(){sec=Array.from({length:L[ronda]},()=>rand(9));bloq=true;ent=0;st.textContent=`Ronda ${ronda+1}/${L.length}: mira la secuencia`;
    let i=0;const paso=()=>{if(i>=sec.length){bloq=false;st.textContent='Tu turno';return;}flash(sec[i++]);tm.push(setTimeout(paso,650));};tm.push(setTimeout(paso,700));}
  function pulsa(n){if(bloq)return;flash(n);
    if(n===sec[ent]){ent++;if(ent===sec.length){ronda++;bloq=true;if(ronda===L.length){ganar();return;}st.textContent='¡Bien!';tm.push(setTimeout(jugar,900));}}
    else{bloq=true;Sonido.error();st.textContent='Fallaste. Otra vez.';tm.push(setTimeout(jugar,1000));}}
  jugar();return ()=>tm.forEach(clearTimeout);
};
/* 4 · Dial: alinea la aguja con la marca. */
MG.dial=(caja,ganar,o)=>{
  const N=o.n||3;let k=0,obj=0;
  caja.innerHTML=`<p class="estado" id="ds"></p><svg class="wsvg" viewBox="0 0 300 170"><path d="M30 150 A120 120 0 0 1 270 150" fill="none" stroke="#2c2a5c" stroke-width="14"/><line id="dt" stroke="#7be07b" stroke-width="10"/><line id="dn" x1="150" y1="150" stroke="#ffb347" stroke-width="6"/><circle cx="150" cy="150" r="9" fill="#ffb347"/></svg><input id="dr" type="range" min="0" max="180" value="90" aria-label="Ángulo"><button class="btn ancho" id="dok" type="button">CONFIRMAR</button><p class="pista">Alinea la aguja naranja con la marca verde.</p>`;
  const dn=caja.querySelector('#dn'),dt=caja.querySelector('#dt'),dr=caja.querySelector('#dr'),ds=caja.querySelector('#ds');
  const pos=(a,r)=>{const th=Math.PI-a*Math.PI/180;return[150+r*Math.cos(th),150-r*Math.sin(th)];};
  const pon=()=>{const[a,b]=pos(+dr.value,100);dn.setAttribute('x2',a);dn.setAttribute('y2',b);};
  const nuevo=()=>{obj=10+rand(161);const[a,b]=pos(obj,108),[c,d]=pos(obj,134);dt.setAttribute('x1',a);dt.setAttribute('y1',b);dt.setAttribute('x2',c);dt.setAttribute('y2',d);ds.textContent=`${o.etiqueta||'Alinea'} (${k+1}/${N})`;};
  dr.oninput=pon;pon();nuevo();
  caja.querySelector('#dok').onclick=()=>{if(Math.abs(+dr.value-obj)<=7){k++;Sonido.tono(660,.1);if(k>=N)ganar();else nuevo();}else Sonido.error();};
};
/* 5 · Equilibrio: mantén dos niveles en verde. */
MG.equilibrio=(caja,ganar,o)=>{
  let a=50,b=50,p=0;
  caja.innerHTML=`<p class="estado">${o.titulo||'Mantén los dos niveles en la zona verde'}</p><div class="vbars"><div class="vcol"><div class="vbar"><div class="vzona"></div><i id="va"></i></div><span>${o.a}</span></div><div class="vcol"><div class="vbar"><div class="vzona"></div><i id="vb"></i></div><span>${o.b}</span></div></div><div class="barra"><i id="bp"></i></div><div class="dos"><button class="btn" id="ba" type="button">${o.ba}</button><button class="btn" id="bb" type="button">${o.bb}</button></div>`;
  const va=caja.querySelector('#va'),vb=caja.querySelector('#vb'),bp=caja.querySelector('#bp');
  const aj=w=>()=>{const d=(w==='a'?o.da:o.db)<0?15:-15;if(w==='a')a=clamp(a+d,0,100);else b=clamp(b+d,0,100);Sonido.tono(420,.05);};
  caja.querySelector('#ba').onclick=aj('a');caja.querySelector('#bb').onclick=aj('b');
  const iv=setInterval(()=>{a=clamp(a+o.da*(.8+Math.random()*1.6),0,100);b=clamp(b+o.db*(.8+Math.random()*1.6),0,100);
    const ok=a>=35&&a<=65&&b>=35&&b<=65;p=ok?p+1:Math.max(0,p-1);
    va.style.height=a+'%';vb.style.height=b+'%';va.style.background=(a>=35&&a<=65)?'#7be07b':'#ff6b6b';vb.style.background=(b>=35&&b<=65)?'#7be07b':'#ff6b6b';
    bp.style.width=Math.min(100,p/(o.necesita||60)*100)+'%';if(p>=(o.necesita||60)){clearInterval(iv);ganar();}},100);
  return ()=>clearInterval(iv);
};
/* 6 · Alinear el retículo sobre un blanco que se mueve. */
MG.alinear=(caja,ganar,o)=>{
  caja.innerHTML=`<p class="estado">${o.etiqueta}</p><div class="barra"><i id="ap"></i></div>`;
  const [cv,g]=lienzoMG(caja,300,190,'mgcv campo');caja.insertAdjacentHTML('beforeend','<p class="pista">Arrastra el dedo o el ratón sobre la imagen.</p>');
  const bar=caja.querySelector('#ap'),W=300,H=190,est=Arte.crearEstrellas(40,3);let rx=W/2,ry=H/2,t=0,p=0,ult=performance.now(),raf=0;
  const mov=e=>{const r=cv.getBoundingClientRect();rx=clamp((e.clientX-r.left)/r.width*W,0,W);ry=clamp((e.clientY-r.top)/r.height*H,0,H);};
  cv.addEventListener('pointermove',mov);cv.addEventListener('pointerdown',mov);
  const bucle=ahora=>{const dt=Math.min(.05,(ahora-ult)/1000);ult=ahora;t+=dt*(o.vel||1);
    const tx=W/2+Math.sin(t*1.3)*W*.3,ty=H/2+Math.sin(t*.9+1)*H*.28;
    g.drawImage(Arte.cielo(W,H),0,0);Arte.estrellas(g,W,H,ahora/1000,est);
    if(o.fondo==='luna'){g.drawImage(Arte.luna(110,ahora/9000,-.4),W*.62-110,H*.62-110);}
    else if(o.fondo==='antena'){g.drawImage(Arte.tierra(40,ahora/3000,ahora/2000),tx-41,ty-41);}
    if(o.fondo==='etapa'){g.fillStyle='#c8ccec';g.fillRect(tx-14,ty-8,28,16);g.fillStyle='#8a8fc0';g.fillRect(tx+14,ty-5,8,10);g.fillStyle='#ffb347';g.fillRect(tx-16,ty-3,3,6);}
    const dentro=Math.hypot(tx-rx,ty-ry)<26;
    g.strokeStyle=dentro?'#7be07b':'#ffb347';g.lineWidth=3;g.beginPath();g.arc(tx,ty,24,0,7);g.stroke();
    g.strokeStyle='#eef0ff';g.lineWidth=2;g.beginPath();g.arc(rx,ry,11,0,7);g.moveTo(rx-16,ry);g.lineTo(rx+16,ry);g.moveTo(rx,ry-16);g.lineTo(rx,ry+16);g.stroke();
    p=dentro?p+dt:Math.max(0,p-dt*.6);bar.style.width=Math.min(100,p/(o.necesita||5)*100)+'%';
    if(p>=(o.necesita||5)){ganar();return;}raf=requestAnimationFrame(bucle);};
  raf=requestAnimationFrame(bucle);return ()=>cancelAnimationFrame(raf);
};
/* 7 · Mantener pulsado (se corta con interferencias). */
MG.mantener=(caja,ganar,o)=>{
  let on=false,p=0,ok=true,rojo=0;
  caja.innerHTML=`<div class="sig" id="sg"><i></i><span id="sgt">SEÑAL ESTABLE</span></div><div class="barra alta"><i id="dp"></i></div><button class="btn grande" id="dh" type="button">MANTENER</button><p class="pista">${o.etiqueta}. Suelta si hay interferencia.</p>`;
  const bar=caja.querySelector('#dp'),sig=caja.querySelector('#sg'),sgt=caja.querySelector('#sgt');
  const quitar=botonMantener(caja.querySelector('#dh'),()=>on=true,()=>on=false);
  const iv=setInterval(()=>{if(ok){if(Math.random()<.045){ok=false;rojo=14+rand(10);}}else{rojo--;if(rojo<=0)ok=true;}
    sig.classList.toggle('rojo',!ok);sgt.textContent=ok?'SEÑAL ESTABLE':'¡INTERFERENCIA!';
    if(on)p+=ok?1.6:-3;if(teclas.has(' '))p+=ok?1.6:-3;p=clamp(p,0,100);bar.style.width=p+'%';if(p>=100){clearInterval(iv);ganar();}},50);
  return ()=>{clearInterval(iv);quitar();};
};
/* 8 · Toques rápidos. */
MG.toques=(caja,ganar,o)=>{
  let n=0,quedan=o.seg,emp=false;
  caja.innerHTML=`<p class="estado">${o.etiqueta}: ${o.n} toques en ${o.seg} segundos</p><div class="barra alta"><i id="tp"></i></div><div class="puntos" id="tt">${o.seg}s</div><button class="btn grande" id="tb" type="button">${o.boton||'¡YA!'}</button>`;
  const tp=caja.querySelector('#tp'),tt=caja.querySelector('#tt');
  const iv=setInterval(()=>{if(!emp)return;quedan-=.1;tt.textContent=Math.max(0,quedan).toFixed(1)+'s';if(quedan<=0){n=0;quedan=o.seg;emp=false;tp.style.width='0%';tt.textContent=o.seg+'s';Sonido.error();}},100);
  caja.querySelector('#tb').onclick=()=>{emp=true;n++;Sonido.tono(300+n*10,.04);tp.style.width=Math.min(100,n/o.n*100)+'%';if(n>=o.n){clearInterval(iv);ganar();}};
  return ()=>clearInterval(iv);
};
/* 9 · Estrellas en orden (rastreador estelar). */
MG.estrellas=(caja,ganar,o)=>{
  const N=o.n||5;let i=0;
  caja.innerHTML=`<p class="estado">Toca las estrellas guía en orden: 1 a ${N}</p><div class="campo cielo" id="sf"></div><p class="pista">El rastreador compara las estrellas con su mapa interno.</p>`;
  const f=caja.querySelector('#sf'),celdas=barajar([0,1,2,3,4,5]).slice(0,N);
  celdas.forEach((c,idx)=>{const b=document.createElement('button');b.type='button';b.className='blanco estrella';b.textContent=String(idx+1);
    b.style.left=(6+(c%3)*31+rand(5))+'%';b.style.top=(8+Math.floor(c/3)*45+rand(8))+'%';
    b.onclick=()=>{if(idx===i){b.disabled=true;b.classList.add('ok');i++;Sonido.tono(500+i*90,.08);if(i>=N)ganar();}else Sonido.error();};f.appendChild(b);});
};
/* 10 · Objetivos que aparecen (cráteres, fugas, polvo, hielo). */
MG.objetivos=(caja,ganar,o)=>{
  let n=0,tm=0;const cls=o.clase||'crater';
  caja.innerHTML=`<p class="estado">${o.etiqueta}</p><div class="puntos" id="ln">0/${o.n}</div><div class="campo f-${cls}" id="lb"></div>`;
  const lb=caja.querySelector('#lb'),cnt=caja.querySelector('#ln'),b=document.createElement('button');b.type='button';b.className='blanco '+cls;b.setAttribute('aria-label','Objetivo');lb.appendChild(b);
  const sale=()=>{b.style.left=(4+rand(80))+'%';b.style.top=(6+rand(72))+'%';clearTimeout(tm);tm=setTimeout(sale,1400);};
  b.onclick=()=>{n++;Sonido.tono(500+n*60,.08);cnt.textContent=n+'/'+o.n;if(n>=o.n){clearTimeout(tm);ganar();}else sale();};
  sale();return ()=>clearTimeout(tm);
};
/* 11 · Código de Control de Misión (con retardo de radio). */
MG.codigo=(caja,ganar,o,ctx)=>{
  const D=o.digitos||4,cod=String(Math.pow(10,D-1)+rand(9*Math.pow(10,D-1)));let ent='',listo=!o.retardo,tm=0;
  const ida=Math.max(.3,(ctx&&ctx.retardo)||1.28);
  caja.innerHTML=`<p class="estado" id="ce">${o.retardo?`Transmitiendo… retardo de ida ${num(ida,2)} s`:'Código recibido de Control de Misión'}</p><div class="lcd" id="cc">${o.retardo?'· · · · ·':cod}</div><div class="lcd ent" id="ci">${'-'.repeat(D)}</div><div class="keys" id="kp"></div>`;
  const ci=caja.querySelector('#ci'),kp=caja.querySelector('#kp'),ver=()=>{ci.textContent=(ent+'-'.repeat(D)).slice(0,D);};
  if(o.retardo)tm=setTimeout(()=>{listo=true;caja.querySelector('#cc').textContent=cod;caja.querySelector('#ce').textContent=`Llegó tras ${num(ida*2,2)} s (ida y vuelta)`;Sonido.tono(700,.08);},ida*2000);
  ['1','2','3','4','5','6','7','8','9','C','0','←'].forEach(k=>{const b=document.createElement('button');b.type='button';b.className='key';b.textContent=k;
    b.onclick=()=>{if(!listo)return;Sonido.tono(400,.05);if(k==='C')ent='';else if(k==='←')ent=ent.slice(0,-1);else if(ent.length<D)ent+=k;ver();
      if(ent.length===D){if(ent===cod)ganar();else{Sonido.error();ci.classList.add('mal');setTimeout(()=>{ent='';ci.classList.remove('mal');ver();},500);}}};kp.appendChild(b);});
  return ()=>clearTimeout(tm);
};
/* 12 · Cables por colores. */
MG.cables=(caja,ganar)=>{
  const cols=['#ff5d5d','#4f8bff','#ffd84a','#ff6bd6'],R=barajar([0,1,2,3]),yy=i=>35+i*50;let sel=null;const uni=[];
  caja.innerHTML='<svg class="wsvg" viewBox="0 0 300 220"></svg><p class="pista">Toca un cable de la izquierda y luego su pareja de la derecha.</p>';
  const svg=caja.querySelector('svg');
  function pinta(){let h='';uni.forEach(l=>{h+=`<line x1="30" y1="${yy(l.l)}" x2="270" y2="${yy(l.r)}" stroke="${cols[l.l]}" stroke-width="8"/>`;});
    for(let i=0;i<4;i++){h+=`<rect x="6" y="${yy(i)-12}" width="14" height="24" fill="${cols[i]}"/><circle data-s="l" data-i="${i}" cx="30" cy="${yy(i)}" r="14" fill="${cols[i]}" stroke="${sel===i?'#fff':'#070612'}" stroke-width="4"/>`;
      h+=`<rect x="280" y="${yy(i)-12}" width="14" height="24" fill="${cols[R[i]]}"/><circle data-s="r" data-i="${i}" cx="270" cy="${yy(i)}" r="14" fill="${cols[R[i]]}" stroke="#070612" stroke-width="4"/>`;}
    svg.innerHTML=h;}
  svg.addEventListener('click',e=>{const t=e.target;if(!t.dataset||!t.dataset.s)return;const i=+t.dataset.i;
    if(t.dataset.s==='l'){if(!uni.some(l=>l.l===i)){sel=i;Sonido.tono(440,.06);pinta();}}
    else if(sel!==null&&!uni.some(l=>l.r===i)){if(R[i]===sel){uni.push({l:sel,r:i});sel=null;Sonido.tono(660,.08);pinta();if(uni.length===4)ganar();}else{Sonido.error();sel=null;pinta();}}});
  pinta();
};
/* 13 · Salida: traje, despresurizar y caminar (espacio o Luna). */
MG.eva=(caja,ganar,o,ctx)=>{
  const limp=[],limpiar=()=>limp.splice(0).forEach(f=>f()),luna=o.modo==='luna';
  function s1(){const partes=luna?['TRAJE DE SUPERFICIE','GUANTES','CASCO','MOCHILA DE SOPORTE','PRUEBA DE PRESIÓN']:['CASCO','GUANTES','MOCHILA DE SOPORTE','CABLE DE SEGURIDAD'];
    MG.interruptores(caja,()=>setTimeout(s2,400),{titulo:'1/3 · Ponte el traje en este orden',items:partes});}
  function s2(){let on=false,p=100;
    caja.innerHTML='<p class="estado">2/3 · Despresuriza la esclusa</p><div class="puntos" id="pr">PRESIÓN 100%</div><div class="barra alta"><i id="pb" style="width:100%;background:var(--cian)"></i></div><button class="btn grande" id="ph" type="button">MANTENER</button><p class="pista">Mantén pulsado hasta llegar a 0%.</p>';
    const pb=caja.querySelector('#pb'),pr=caja.querySelector('#pr'),q=botonMantener(caja.querySelector('#ph'),()=>on=true,()=>on=false);
    const iv=setInterval(()=>{if(on||teclas.has(' ')){p=Math.max(0,p-2.2);Sonido.tono(200+(100-p)*3,.04,'sine',.03);}pb.style.width=p+'%';pr.textContent='PRESIÓN '+Math.round(p)+'%';if(p<=0){clearInterval(iv);setTimeout(s3,400);}},50);
    limp.push(()=>{clearInterval(iv);q();});}
  function s3(){limpiar();
    caja.innerHTML=`<p class="estado">3/3 · ${luna?'Camina con baja gravedad y llega a los 3 puntos':'Sal y repara los 3 puntos amarillos'}</p>`;
    const [cv,g]=lienzoMG(caja,200,130,'mgcv evac');caja.insertAdjacentHTML('beforeend',`<div class="dpad"><button class="u" type="button" aria-label="${luna?'Saltar':'Arriba'}">▲</button><button class="l" type="button" aria-label="Izquierda">◀</button><button class="d" type="button" aria-label="Abajo">▼</button><button class="r" type="button" aria-label="Derecha">▶</button></div><p class="pista">${luna?'Flechas: en la Luna pesas una sexta parte y saltas despacio.':'Flechas o botones. Sin gravedad, ¡sigues flotando!'}</p>`);
    const W=200,H=130,hold={u:0,d:0,l:0,r:0},est=Arte.crearEstrellas(40,8);
    caja.querySelectorAll('.dpad button').forEach(b=>{const k=b.className;const on=e=>{e.preventDefault();hold[k]=1;},off=()=>{hold[k]=0;};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
    const suelo=H-22,obj=luna?[{x:70,y:suelo,f:0,n:'BANDERA'},{x:125,y:suelo,f:0,n:'MUESTRA'},{x:178,y:suelo,f:0,n:'FOTO'}]:[{x:56,y:12,f:0},{x:110,y:12,f:0},{x:166,y:12,f:0}];
    const a={x:16,y:luna?suelo:30,vx:0,vy:0,cara:1};let ult=performance.now(),raf=0,tt=0;
    function bucle(ahora){const dt=Math.min(.05,(ahora-ult)/1000);ult=ahora;tt+=dt;
      const ax=((hold.r||teclas.has('d')||teclas.has('arrowright'))?1:0)-((hold.l||teclas.has('a')||teclas.has('arrowleft'))?1:0);
      const ay=((hold.d||teclas.has('s')||teclas.has('arrowdown'))?1:0)-((hold.u||teclas.has('w')||teclas.has('arrowup'))?1:0);
      if(luna){a.vx=ax*28;if(ay<0&&a.y>=suelo-.5)a.vy=-34;a.vy+=16*dt;a.y+=a.vy*dt;if(a.y>suelo){a.y=suelo;a.vy=0;}a.x+=a.vx*dt;}
      else{a.vx+=ax*55*dt;a.vy+=ay*55*dt;a.vx*=1-.25*dt;a.vy*=1-.25*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;}
      if(ax)a.cara=ax;a.x=clamp(a.x,6,W-6);a.y=clamp(a.y,14,luna?suelo:H-8);
      obj.forEach(t=>{const cerca=Math.hypot(t.x-a.x,(t.y+(luna?0:4))-a.y)<14;t.f=cerca?t.f+dt:Math.max(0,t.f-dt*.5);});
      if(luna){Arte.escenaLunar(g,W,H,ahora/1000,est,{horizonte:H-34,radioTierra:16,tierraX:W*.75});}
      else{g.drawImage(Arte.cielo(W,H),0,0);Arte.estrellas(g,W,H,ahora/1000,est);g.drawImage(Arte.tierra(90,ahora/9000,ahora/6000),W/2-91,H*.75);g.fillStyle='#8a8fc0';g.fillRect(0,0,W,10);g.fillStyle='#c8c6f0';g.fillRect(0,0,W,2);}
      obj.forEach(t=>{const ok=t.f>=.9;g.fillStyle=ok?'#7be07b':(((tt*4)|0)%2?'#ffd84a':'#ffb347');if(luna){g.fillRect(t.x-1,t.y-12,2,12);g.fillRect(t.x+1,t.y-12,6,4);}else g.fillRect(t.x-3,t.y-2,7,7);
        if(!ok&&t.f>0){g.fillStyle='#fff';g.fillRect(t.x-4,t.y+(luna?2:7),Math.round(8*t.f/.9),1);}});
      if(!luna){g.fillStyle='#e8ecff';for(let k=0;k<=12;k++){const u=k/12,px=10+(a.x-10)*u,py=10+(a.y-10)*u+Math.sin(u*Math.PI)*5;if(k%2===0)g.fillRect(Math.round(px),Math.round(py),1,1);}}
      g.save();g.translate(Math.round(a.x),Math.round(a.y)-6);if(a.cara<0)g.scale(-1,1);g.drawImage(spriteAstro((ctx&&ctx.color)||'#ff7a59',luna&&Math.abs(a.vx)>1?((tt*6)|0)%2:0),-6,-6);g.restore();
      if(obj.every(t=>t.f>=.9)){ganar();return;}raf=requestAnimationFrame(bucle);}
    raf=requestAnimationFrame(bucle);limp.push(()=>cancelAnimationFrame(raf));}
  s1();return limpiar;
};
/* 14 · Sondeo GO/NO-GO (nuevo). */
MG.gonogo=(caja,ganar)=>{
  const P=[
    {n:'PROPULSIÓN',p:'Presión baja en un tanque',o:['Volver a presurizar el tanque','Ignorarlo','Despegar igual'],b:0},
    {n:'METEOROLOGÍA',p:'Viento fuerte en altura',o:['Despegar ya','Esperar a que amaine dentro de la ventana','Apagar la radio'],b:1},
    {n:'TRAYECTORIA',p:'Falta confirmar la ventana de lanzamiento',o:['Adivinar la hora','Despegar mañana','Recalcular y confirmar la ventana'],b:2},
    {n:'COMUNICACIONES',p:'Ruido en un canal de voz',o:['Cambiar al canal de respaldo','Gritar más fuerte','Cancelar la misión'],b:0},
    {n:'SOPORTE VITAL',p:'Un sensor de O₂ no envía datos',o:['Taparlo con cinta','Reiniciar y verificar el sensor','No usar oxígeno'],b:1},
    {n:'SEGURIDAD DEL ÁREA',p:'Un barco entró en la zona de exclusión',o:['Despegar encima del barco','Apagar los motores para siempre','Esperar a que salga de la zona'],b:2}];
  const malos=new Set(barajar([0,1,2,3,4,5]).slice(0,3));const go=P.map((_,i)=>!malos.has(i));
  function pinta(){caja.innerHTML=`<p class="estado">Sondeo de la directora de lanzamiento: resuelve cada NO-GO</p><div class="gonogo">${P.map((x,i)=>`<button type="button" class="gng ${go[i]?'go':'nogo'}" data-i="${i}"><b>${x.n}</b><span>${go[i]?'GO':'NO-GO'}</span></button>`).join('')}</div><div id="gp"></div><p class="pista">Simulación del procedimiento: con un solo NO-GO, no se despega.</p>`;
    caja.querySelectorAll('.gng').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(go[i])return;pregunta(i);});
    if(go.every(Boolean)){caja.querySelector('#gp').innerHTML='<p class="okmsg">¡GO para el lanzamiento!</p>';setTimeout(ganar,700);}}
  function pregunta(i){const x=P[i],gp=caja.querySelector('#gp');gp.innerHTML=`<p class="estado">${x.n}: ${x.p}</p><div class="opciones">${x.o.map((t,k)=>`<button type="button" class="btn alt" data-k="${k}">${t}</button>`).join('')}</div>`;
    gp.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(+b.dataset.k===x.b){go[i]=true;Sonido.tono(700,.08);pinta();}else{Sonido.error();b.disabled=true;}});}
  pinta();
};
/* 15 · Encendido de precisión (nuevo): suelta en la zona de Δv. */
MG.encendido=(caja,ganar,o)=>{
  const MAX=130,rondas=o.rondas||1;let ronda=0,dv=0,on=false,vel=0,obj=0,raf=0,ult=performance.now();
  caja.innerHTML=`<p class="estado" id="ee">${o.etiqueta}</p><div class="dvbar"><div class="dvzona" id="ez"></div><i id="ei"></i></div><div class="puntos" id="ev">Δv 0 m/s</div><button class="btn grande" id="eb" type="button">MANTENER: ENCENDER</button><p class="pista">Mantén pulsado (o la barra espaciadora) y suelta dentro de la zona verde.</p>`;
  const ez=caja.querySelector('#ez'),ei=caja.querySelector('#ei'),ev=caja.querySelector('#ev'),ee=caja.querySelector('#ee');
  function nueva(){dv=0;vel=0;obj=clamp((o.dv||80)+rand(17)-8,25,MAX-15);const tol=o.tol||7;ez.style.bottom=((obj-tol)/MAX*100)+'%';ez.style.height=(2*tol/MAX*100)+'%';ee.textContent=`${o.etiqueta} · encendido ${ronda+1}/${rondas}`;}
  let antes=false;
  const q=botonMantener(caja.querySelector('#eb'),()=>on=true,()=>on=false);
  function bucle(ahora){const dt=Math.min(.05,(ahora-ult)/1000);ult=ahora;const pulsado=on||teclas.has(' ');
    if(pulsado){vel=Math.min(48,vel+70*dt);dv+=vel*dt;Sonido.tono(90+dv,.03,'sawtooth',.015);}
    if(antes&&!pulsado&&dv>2){const tol=o.tol||7;if(Math.abs(dv-obj)<=tol){Sonido.tono(700,.12);ronda++;if(ronda>=rondas){ganar();return;}nueva();}else{Sonido.error();ee.textContent=dv>obj?'Te pasaste: Δv excesivo. Repite.':'Corto: falta Δv. Repite.';dv=0;vel=0;}}
    antes=pulsado;if(dv>MAX){Sonido.error();dv=0;vel=0;}
    ei.style.height=(dv/MAX*100)+'%';ev.textContent=`Δv ${num(dv*10,0)} m/s · objetivo ${num(obj*10,0)} m/s (simulado)`;raf=requestAnimationFrame(bucle);}
  nueva();raf=requestAnimationFrame(bucle);return ()=>{cancelAnimationFrame(raf);q();};
};
/* 16 · Red del Espacio Profundo (nuevo): elige la estación que ve la nave. */
MG.dsn=(caja,ganar,o)=>{
  const EST=[{n:'Goldstone (California)',lon:-117},{n:'Madrid (España)',lon:-4},{n:'Canberra (Australia)',lon:149}];
  let ronda=0,giro=0,raf=0;const rondas=o.rondas||3;
  caja.innerHTML='<p class="estado" id="de"></p>';const [cv,g]=lienzoMG(caja,300,170);
  caja.insertAdjacentHTML('beforeend',`<div class="opciones" id="do">${EST.map((e,i)=>`<button type="button" class="btn alt" data-i="${i}">${e.n}</button>`).join('')}</div><p class="pista">Vista desde el polo norte: la Tierra gira y la nave está a la derecha. Elige la estación que tiene la nave sobre su horizonte.</p>`);
  const est=Arte.crearEstrellas(30,4);
  const ang=e=>((e.lon*Math.PI/180)+giro);
  function mejor(){let b=0,bd=9;EST.forEach((e,i)=>{let d=Math.abs(Math.atan2(Math.sin(ang(e)),Math.cos(ang(e))));if(d<bd){bd=d;b=i;}});return b;}
  function nueva(){giro=Math.random()*Math.PI*2;caja.querySelector('#de').textContent=`Enlace ${ronda+1}/${rondas}: ¿qué complejo de la DSN apunta a la nave?`;}
  function dibuja(){g.drawImage(Arte.cielo(300,170),0,0);Arte.estrellas(g,300,170,performance.now()/1000,est);
    const cx=120,cy=85,R=52;Arte.disco(g,cx,cy,R,'#1c4ea0');Arte.disco(g,cx,cy,R-4,'#2a6fd0');Arte.disco(g,cx,cy,9,'#e8f0ff');
    g.fillStyle='rgba(6,7,26,.45)';g.beginPath();g.arc(cx,cy,R,Math.PI/2,Math.PI*1.5);g.fill();
    EST.forEach((e,i)=>{const a=ang(e),x=cx+Math.cos(a)*(R-2),y=cy+Math.sin(a)*(R-2);g.fillStyle=['#ffd84a','#ff7a59','#7be07b'][i];g.fillRect(x-3,y-3,6,6);g.font='8px monospace';g.fillText(['G','M','C'][i],x+Math.cos(a)*10-3,y+Math.sin(a)*10+3);});
    Cine.orion(g,262,85,1,0);g.strokeStyle='rgba(79,209,255,.5)';g.setLineDash([3,4]);g.beginPath();g.moveTo(cx+R,cy);g.lineTo(246,85);g.stroke();g.setLineDash([]);
    raf=requestAnimationFrame(dibuja);}
  caja.querySelectorAll('#do button').forEach(b=>b.onclick=()=>{if(+b.dataset.i===mejor()){Sonido.tono(700,.1);ronda++;if(ronda>=rondas){ganar();return;}nueva();}else Sonido.error();});
  nueva();dibuja();return ()=>cancelAnimationFrame(raf);
};
/* 17 · Tuberías (nuevo): gira las piezas para conectar. */
MG.tuberias=(caja,ganar,o)=>{
  const N=4,rot=m=>((m<<1)|(m>>3))&15,DIR=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]],OP={1:4,2:8,4:1,8:2};
  let m,ent,sal;
  function generar(){m=Array.from({length:N*N},()=>rand(2)?5:3);ent=rand(N);
    const vis=new Set();let x=0,y=ent,desde=8,camino=[];
    function dfs(x,y,desde){vis.add(x+','+y);if(x===N-1){camino.push({x,y,desde,hacia:2});return true;}
      for(const [dx,dy,bit] of barajar(DIR.slice())){if(bit===desde)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N||vis.has(nx+','+ny)||dx<0)continue;
        camino.push({x,y,desde,hacia:bit});if(dfs(nx,ny,OP[bit]))return true;camino.pop();}
      return false;}
    dfs(0,ent,8);
    camino.forEach(c=>{m[c.y*N+c.x]=c.desde|c.hacia;});
    const ult=camino[camino.length-1];sal=ult.y;
    for(let i=0;i<N*N;i++){const v=m[i];const recta=v===5||v===10;m[i]=recta?(rand(2)?5:10):[3,6,12,9][rand(4)];
      const enCamino=camino.find(c=>c.y*N+c.x===i);if(enCamino){let t=enCamino.desde|enCamino.hacia;for(let k=rand(4);k>0;k--)t=rot(t);m[i]=t;}}
    if(conectado())generar();}
  function conectado(){if(!(m[ent*N]&8))return false;const vis=new Set([ent*N]),q=[[0,ent]];
    while(q.length){const [x,y]=q.shift(),v=m[y*N+x];if(x===N-1&&y===sal&&(v&2))return true;
      for(const [dx,dy,bit] of DIR){if(!(v&bit))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const k=ny*N+nx;if(vis.has(k)||!(m[k]&OP[bit]))continue;vis.add(k);q.push([nx,ny]);}}
    return false;}
  generar();
  const buzon=o.modo==='buzon';
  caja.innerHTML=`<p class="estado">${buzon?'Adapta el cartucho cuadrado a la toma redonda':'Lleva el agua del tanque al dispensador'}</p>`;
  const [cv,g]=lienzoMG(caja,288,240);caja.insertAdjacentHTML('beforeend',`<p class="pista">${buzon?'Como en el Apolo 13: conecta con piezas sueltas de a bordo.':'Toca una pieza para girarla.'}</p>`);
  const C=60,OX=24;
  function dibuja(){g.fillStyle='#0b0b20';g.fillRect(0,0,288,240);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=m[y*N+x],px=OX+x*C,py=y*C;g.fillStyle=(x+y)%2?'#1b1a3a':'#221f4a';g.fillRect(px,py,C,C);
      g.fillStyle=buzon?'#c8ccec':'#4fd1ff';const c=C/2,w=10;g.fillRect(px+c-w/2,py+c-w/2,w,w);
      if(v&1)g.fillRect(px+c-w/2,py,w,c);if(v&4)g.fillRect(px+c-w/2,py+c,w,c);if(v&8)g.fillRect(px,py+c-w/2,c,w);if(v&2)g.fillRect(px+c,py+c-w/2,c,w);}
    g.fillStyle='#ffb347';if(buzon)g.fillRect(2,ent*C+18,20,24);else{g.fillRect(2,ent*C+14,18,32);}
    g.fillStyle='#7be07b';if(buzon){Arte.disco(g,276,sal*C+30,10,'#7be07b');}else g.fillRect(270,sal*C+20,16,20);}
  cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)/r.width*288-OX)/C),y=Math.floor((e.clientY-r.top)/r.height*240/C);
    if(x<0||y<0||x>=N||y>=N)return;m[y*N+x]=rot(m[y*N+x]);Sonido.tono(380,.04);dibuja();if(conectado()){Sonido.exito();setTimeout(ganar,300);}});
  dibuja();
};
/* 18 · Sitio de alunizaje (nuevo): polo sur o evitar peligros. */
MG.sitio=(caja,ganar,o)=>{
  if(o.modo==='peligros'){
    let ronda=0,tm=0,quedan=10;const N=5;let seguro=0,peligro=[];
    caja.innerHTML='<p class="estado" id="se"></p><div class="puntos" id="st"></div><div class="radar" id="sr"></div><p class="pista">Rojo: rocas. Naranja: cráteres. Amarillo: pendiente. Elige la única zona verde y plana.</p>';
    function nueva(){quedan=10;seguro=rand(N*N);peligro=Array.from({length:N*N},(_,i)=>i===seguro?0:1+rand(3));
      caja.querySelector('#se').textContent=`Descenso ${ronda+1}/2: el radar muestra el terreno`;
      const sr=caja.querySelector('#sr');sr.innerHTML='';peligro.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='celda p'+p;b.setAttribute('aria-label',p?'Peligro':'Zona plana');b.onclick=()=>{if(i===seguro){Sonido.tono(700,.1);ronda++;if(ronda>=2){clearInterval(tm);ganar();}else nueva();}else{Sonido.error();b.classList.add('x');}};sr.appendChild(b);});}
    tm=setInterval(()=>{quedan-=.1;caja.querySelector('#st').textContent='Combustible para planear: '+Math.max(0,quedan).toFixed(1)+' s';if(quedan<=0){Sonido.error();nueva();}},100);
    nueva();return ()=>clearInterval(tm);
  }
  const C=[];const bien=rand(9);
  for(let i=0;i<9;i++){let c={pend:2+rand(6),vista:true,hielo:['alta','media'][rand(2)],luz:60+rand(30)};
    if(i!==bien){const fallo=rand(3);if(fallo===0)c.pend=12+rand(14);else if(fallo===1)c.vista=false;else c.hielo='nula';}else c.hielo='alta';C.push(c);}
  caja.innerHTML=`<p class="estado">Elige el sitio: pendiente suave (menos de 8°), vista de la Tierra y hielo cerca</p><div class="sitios">${C.map((c,i)=>`<button type="button" class="sitio" data-i="${i}"><b>Región ${i+1}</b><span>Pendiente ${c.pend}°</span><span>Tierra: ${c.vista?'visible':'oculta'}</span><span>Hielo: ${c.hielo}</span></button>`).join('')}</div><p class="pista">Criterios reales de Artemis; los valores de cada región son simulados.</p>`;
  caja.querySelectorAll('.sitio').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(i===bien){Sonido.exito();b.classList.add('ok');setTimeout(ganar,400);}else{Sonido.error();b.classList.add('x');b.disabled=true;}});
};
/* 19 · Descenso motorizado (nuevo): aterriza suave en la zona marcada. */
MG.descenso=(caja,ganar,o,ctx)=>{
  const W=300,H=200;caja.innerHTML='<p class="estado" id="le">Aterriza en la zona verde: velocidad vertical menor de 2 m/s</p>';
  const [cv,g]=lienzoMG(caja,W,H);
  caja.insertAdjacentHTML('beforeend','<div class="dos"><button class="btn alt" id="li" type="button">◀ DERIVA</button><button class="btn alt" id="ld" type="button">DERIVA ▶</button></div><button class="btn grande" id="lm" type="button">MANTENER: MOTOR</button><p class="pista">Teclado: flechas o A/D para derivar y espacio o W para el motor. Gravedad lunar simulada.</p>');
  const est=Arte.crearEstrellas(40,6);let L,ter,zona,raf=0,ult=performance.now(),on=false,izq=false,der=false,fin=false;
  const q1=botonMantener(caja.querySelector('#lm'),()=>on=true,()=>on=false),q2=botonMantener(caja.querySelector('#li'),()=>izq=true,()=>izq=false),q3=botonMantener(caja.querySelector('#ld'),()=>der=true,()=>der=false);
  function reinicia(){L={x:40,y:24,vx:8,vy:0,comb:100};zona=120+rand(120);ter=[];let y=H-30;
    for(let x=0;x<=W;x+=6){if(x>=zona-18&&x<=zona+18)ter.push(H-30);else{y=clamp(y+rand(13)-6,H-58,H-18);ter.push(y);}}fin=false;}
  const altura=x=>ter[clamp(Math.round(x/6),0,ter.length-1)];
  function bucle(ahora){const dt=Math.min(.05,(ahora-ult)/1000);ult=ahora;
    if(!fin){const mot=(on||teclas.has(' ')||teclas.has('w')||teclas.has('arrowup'))&&L.comb>0;const lat=((der||teclas.has('d')||teclas.has('arrowright'))?1:0)-((izq||teclas.has('a')||teclas.has('arrowleft'))?1:0);
      L.vy+=6.5*dt;if(mot){L.vy-=15*dt;L.comb-=9*dt;}if(lat&&L.comb>0){L.vx+=lat*9*dt;L.comb-=3*dt;}
      L.x=clamp(L.x+L.vx*dt,8,W-8);L.y+=L.vy*dt;
      const suelo=altura(L.x)-6;
      if(L.y>=suelo){L.y=suelo;fin=true;const ok=Math.abs(L.x-zona)<16&&L.vy<2.2&&Math.abs(L.vx)<2;
        caja.querySelector('#le').textContent=ok?'¡Contacto! Aterrizaje suave.':`Aterrizaje duro (vertical ${num(L.vy,1)} m/s). Inténtalo otra vez.`;
        if(ok){Sonido.exito();setTimeout(ganar,700);}else{Sonido.error();setTimeout(reinicia,1300);}}
      g.drawImage(Arte.cielo(W,H),0,0);Arte.estrellas(g,W,H,ahora/1000,est);g.drawImage(Arte.tierra(14,ahora/8000,ahora/5000),236,20);
      g.fillStyle='#8e8e9c';ter.forEach((y,i)=>g.fillRect(i*6,y,6,H-y));g.fillStyle='#c4c4d2';ter.forEach((y,i)=>g.fillRect(i*6,y,6,2));
      g.fillStyle='#7be07b';g.fillRect(zona-18,H-31,36,2);
      g.fillStyle='#c8ccec';g.fillRect(L.x-6,L.y-8,12,8);g.fillStyle='#d8b04a';g.fillRect(L.x-3,L.y-12,6,4);g.fillStyle='#8a8fc0';g.fillRect(L.x-8,L.y,3,5);g.fillRect(L.x+5,L.y,3,5);
      if(mot){g.fillStyle=Math.random()<.5?'#ffd84a':'#ff9a3c';g.fillRect(L.x-2,L.y+1,4,4+rand(6));}
      g.fillStyle='#eef0ff';g.font='9px monospace';g.fillText(`ALT ${Math.max(0,Math.round(suelo-L.y))} m  V ${num(L.vy,1)} m/s  H ${num(L.vx,1)}  COMB ${Math.max(0,Math.round(L.comb))}%`,6,12);}
    raf=requestAnimationFrame(bucle);}
  reinicia();raf=requestAnimationFrame(bucle);return ()=>{cancelAnimationFrame(raf);q1();q2();q3();};
};
/* 20 · Acoplamiento (nuevo): alinea y llega despacio al puerto. */
MG.acople=(caja,ganar)=>{
  const W=300,H=190;caja.innerHTML='<p class="estado" id="ae">Acopla con el módulo de aterrizaje: llega centrado y a menos de 0.3 m/s</p>';
  const [cv,g]=lienzoMG(caja,W,H);
  caja.insertAdjacentHTML('beforeend','<div class="dpad"><button class="u" type="button" aria-label="Arriba">▲</button><button class="l" type="button" aria-label="Izquierda">◀</button><button class="d" type="button" aria-label="Abajo">▼</button><button class="r" type="button" aria-label="Derecha">▶</button></div><div class="dos"><button class="btn alt" id="af" type="button">FRENAR</button><button class="btn alt" id="aa" type="button">ACERCAR</button></div><p class="pista">Flechas para centrar; FRENAR y ACERCAR cambian la velocidad de cierre.</p>');
  const est=Arte.crearEstrellas(40,12),hold={u:0,d:0,l:0,r:0};let s,raf=0,ult=performance.now();
  caja.querySelectorAll('.dpad button').forEach(b=>{const k=b.className;const on=e=>{e.preventDefault();hold[k]=1;},off=()=>{hold[k]=0;};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);});
  const reinicia=d=>{s={d:d||60,v:.6,x:azar(-30,30),y:azar(-20,20),vx:azar(-4,4),vy:azar(-3,3)};};
  caja.querySelector('#af').onclick=()=>{s.v=Math.max(0,s.v-.1);Sonido.clic();};caja.querySelector('#aa').onclick=()=>{s.v=Math.min(1.5,s.v+.1);Sonido.clic();};
  function bucle(ahora){const dt=Math.min(.05,(ahora-ult)/1000);ult=ahora;
    const ax=((hold.r||teclas.has('arrowright')||teclas.has('d'))?1:0)-((hold.l||teclas.has('arrowleft')||teclas.has('a'))?1:0),ay=((hold.d||teclas.has('arrowdown')||teclas.has('s'))?1:0)-((hold.u||teclas.has('arrowup')||teclas.has('w'))?1:0);
    s.vx+=(ax*14+azar(-2,2))*dt;s.vy+=(ay*14+azar(-2,2))*dt;s.vx*=1-.6*dt;s.vy*=1-.6*dt;s.x=clamp(s.x+s.vx*dt,-60,60);s.y=clamp(s.y+s.vy*dt,-45,45);
    s.d-=s.v*dt*4;
    g.drawImage(Arte.cielo(W,H),0,0);Arte.estrellas(g,W,H,ahora/1000,est);
    const esc=clamp(60/(s.d+8),.3,6),cx=W/2+s.x*esc*.4,cy=H/2+s.y*esc*.4;
    g.fillStyle='#c8ccec';g.fillRect(cx-22*esc/2,cy-22*esc/2,22*esc,22*esc);g.fillStyle='#4a4a6a';Arte.disco(g,Math.round(cx),Math.round(cy),Math.max(2,Math.round(7*esc)),'#3a3a5a');Arte.disco(g,Math.round(cx),Math.round(cy),Math.max(1,Math.round(3*esc)),'#ffd84a');
    const centrado=Math.hypot(s.x,s.y)<8;g.strokeStyle=centrado?'#7be07b':'#ffb347';g.lineWidth=2;g.beginPath();g.moveTo(W/2-14,H/2);g.lineTo(W/2+14,H/2);g.moveTo(W/2,H/2-14);g.lineTo(W/2,H/2+14);g.stroke();
    g.fillStyle='#eef0ff';g.font='9px monospace';g.fillText(`DIST ${num(Math.max(0,s.d),1)} m  CIERRE ${num(s.v,2)} m/s  DESVÍO ${num(Math.hypot(s.x,s.y),1)}`,6,12);
    if(s.d<=0){if(centrado&&s.v<=.35){Sonido.exito();caja.querySelector('#ae').textContent='¡Acoplados! Captura y cierre de enganches.';ganar();return;}
      Sonido.error();caja.querySelector('#ae').textContent=centrado?'Demasiado rápido: rebote. Repite desde 20 m.':'Descentrado: rebote. Repite desde 20 m.';reinicia(20);}
    raf=requestAnimationFrame(bucle);}
  reinicia();raf=requestAnimationFrame(bucle);return ()=>cancelAnimationFrame(raf);
};
/* 21 · Refugio contra la radiación (nuevo): bolsas densas a la pared débil. */
MG.refugio=(caja,ganar,o)=>{
  const N=o.n||6;let puestos=0;const BOLSAS=[{n:'Agua',densa:true},{n:'Comida',densa:true},{n:'Herramientas',densa:true},{n:'Ropa',densa:false},{n:'Toallas',densa:false},{n:'Agua',densa:true},{n:'Comida',densa:true},{n:'Papeles',densa:false},{n:'Baterías',densa:true}];
  caja.innerHTML=`<p class="estado">Arma el refugio: pon bolsas DENSAS en la pared menos protegida</p><div class="refugio"><div class="pared" id="rp">${'<i></i>'.repeat(N)}</div><div class="bolsas" id="rb"></div></div><p class="pista">Así lo planea la NASA para Orión: las bolsas más densas, donde hay menos blindaje.</p>`;
  const rp=caja.querySelectorAll('#rp i'),rb=caja.querySelector('#rb');
  barajar(BOLSAS.slice()).forEach(b=>{const e=document.createElement('button');e.type='button';e.className='bolsa'+(b.densa?' densa':'');e.textContent=b.n;
    e.onclick=()=>{if(!b.densa){Sonido.error();e.classList.add('x');e.disabled=true;return;}rp[puestos].classList.add('ok');rp[puestos].textContent=b.n;puestos++;e.remove();Sonido.tono(400+puestos*60,.07);if(puestos>=N)ganar();};rb.appendChild(e);});
};
