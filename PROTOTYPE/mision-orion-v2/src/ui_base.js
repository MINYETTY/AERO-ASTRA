/* =====================================================================
   ui_base.js — ACTO 2: dibujo del corte de la base lunar (estilo de la
   imagen de referencia: cielo tramado azul-morado, estrellas en cruz, la
   Tierra asomando por el horizonte y regolito gris) y paneles de gestión.
   La simulación está en base_lunar.js.
   ===================================================================== */
const BaseUI = (()=>{
  const CW=20,FH=30,INT=26,SUP=64,CAPA=12,MX=10,ANCHO=BASE_COLS*CW+MX*2;
  const B=()=>JUEGO.base,T=t=>TIPOS_SALA[t];
  const CORTO={esclusa:'ESCLUSA',habitaculo:'CAMAS',invernadero:'HUERTO',energia:'ENERGIA',taller:'TALLER',agua_o2:'AGUA·O2',laboratorio:'LAB',enfermeria:'ENFERM.',refugio:'REFUGIO',control:'CONTROL',almacen:'ALMACEN',gimnasio:'GIMNASIO',ocio:'OCIO'};
  const NOMBRE_REC={energia:'Energía',alimentos:'Alimentos',agua:'Agua',o2:'O₂',co2:'CO₂',materiales:'Materiales',hielo:'Hielo',ciencia:'Ciencia',integridad:'Estructura',moral:'Moral',salud:'Salud',curacion:'Curación',depura:'Depura CO₂'};
  const FRASES=['Todo en orden por aquí.','Este polvo se mete en todas partes.','¡Qué vista de la Tierra desde la ventana!','Echo de menos la lluvia.','Hoy me toca ejercicio.','El reciclaje de agua funciona de maravilla.','Cuando acabe el turno, a mirar las estrellas.','Seis veces menos peso: aún me cuesta caminar.'];
  let cv,g,escala=2,lw=0,lh=0,ox=0,oy=0,camY=0,est,modo=null,panel=null,vis={},burb={},puntero=null,tHud=0,tCharla=10,colaDatos=[],ultimoToque=0,firmaPanel='',ganadoVisto=false;
  const esc=escHtml;

  /* ---------- fuente de píxeles 3×5 propia: nítida a cualquier escala ---------- */
  const FUENTE={};
  (()=>{const D={A:'.#.|#.#|###|#.#|#.#',B:'##.|#.#|##.|#.#|##.',C:'.##|#..|#..|#..|.##',D:'##.|#.#|#.#|#.#|##.',E:'###|#..|##.|#..|###',F:'###|#..|##.|#..|#..',G:'.##|#..|#.#|#.#|.##',H:'#.#|#.#|###|#.#|#.#',
    I:'###|.#.|.#.|.#.|###',J:'..#|..#|..#|#.#|.#.',K:'#.#|#.#|##.|#.#|#.#',L:'#..|#..|#..|#..|###',M:'#.#|###|###|#.#|#.#',N:'##.|#.#|#.#|#.#|#.#',O:'.#.|#.#|#.#|#.#|.#.',P:'##.|#.#|##.|#..|#..',
    Q:'.#.|#.#|#.#|##.|.##',R:'##.|#.#|##.|#.#|#.#',S:'.##|#..|.#.|..#|##.',T:'###|.#.|.#.|.#.|.#.',U:'#.#|#.#|#.#|#.#|###',V:'#.#|#.#|#.#|#.#|.#.',W:'#.#|#.#|###|###|#.#',X:'#.#|#.#|.#.|#.#|#.#',
    Y:'#.#|#.#|.#.|.#.|.#.',Z:'###|..#|.#.|#..|###','0':'###|#.#|#.#|#.#|###','1':'.#.|##.|.#.|.#.|###','2':'##.|..#|.#.|#..|###','3':'##.|..#|.#.|..#|##.','4':'#.#|#.#|###|..#|..#',
    '5':'###|#..|##.|..#|##.','6':'.##|#..|###|#.#|###','7':'###|..#|.#.|.#.|.#.','8':'###|#.#|###|#.#|###','9':'###|#.#|###|..#|##.','.':'...|...|...|...|.#.',',':'...|...|...|.#.|#..',
    '·':'...|...|.#.|...|...','-':'...|...|###|...|...','+':'...|.#.|###|.#.|...','%':'#.#|..#|.#.|#..|#.#','/':'..#|..#|.#.|#..|#..',':':'...|.#.|...|.#.|...','!':'.#.|.#.|.#.|...|.#.',
    '?':'##.|..#|.#.|...|.#.','(':'.#.|#..|#..|#..|.#.',')':'.#.|..#|..#|..#|.#.','×':'...|#.#|.#.|#.#|...',' ':'...|...|...|...|...'};
    for(const k in D){const px=[];D[k].split('|').forEach((f,y)=>{for(let x=0;x<3;x++)if(f[x]==='#')px.push([x,y]);});FUENTE[k]=px;}})();
  function txt(s,x,y,col='#eef0ff',sombra='#0b0b1a'){
    s=String(s).toUpperCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/₂/g,'2');let cx=Math.round(x);y=Math.round(y);
    for(const ch of s){const p=FUENTE[ch]||FUENTE[' '];if(sombra){g.fillStyle=sombra;for(const [a,b] of p)g.fillRect(cx+a+1,y+b+1,1,1);}g.fillStyle=col;for(const [a,b] of p)g.fillRect(cx+a,y+b,1,1);cx+=4;}
    return cx-x;
  }
  const anchoTxt=s=>String(s).length*4;
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};

  /* ---------- geometría ---------- */
  const yPlanta=p=>p===0?SUP-FH+4:SUP+CAPA+(p-1)*FH;
  const yPies=p=>yPlanta(p)+INT;
  const altoMundo=()=>SUP+CAPA+B().plantas*FH+(B().plantas<BASE_PLANTAS?FH+8:12);
  const maxCam=()=>Math.max(0,altoMundo()-lh);
  const salaX=s=>MX+s.col*CW, salaW=s=>T(s.tipo).ancho*CW;
  const ascX=()=>MX+BASE_ASCENSOR*CW+CW/2;

  /* ---------- capa de regolito en corte (tramado, en caché) ---------- */
  const cacheRoca=new Map();
  function roca(w,h){
    const k=w+'x'+h;if(cacheRoca.has(k))return cacheRoca.get(k);
    const c=Arte.lienzo(w,h),gg=c.getContext('2d'),img=gg.createImageData(w,h),d=img.data,r=mulberry32(77);
    const PAL=[[26,24,34],[40,36,50],[58,54,70],[82,78,96],[110,106,124]];
    const piedras=[];for(let i=0;i<w*h/260;i++)piedras.push({x:r()*w,y:r()*h,r:1+r()*2.6});
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const prof=y/h,bb=BAYER[y&3][x&3];let v=.58-prof*.32+.3*(fbm3(x*.09,y*.13,2,5,3)-.5);
      for(const p of piedras){const dx=x-p.x,dy=y-p.y,e=dx*dx+dy*dy;if(e<p.r*p.r){v+=dy<0?.2:.08;break;}}
      const col=PAL[Math.floor(clamp(v*4.4+(bb-.5)*.9,0,4.99))],o=(y*w+x)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;}
    gg.putImageData(img,0,0);if(cacheRoca.size>6)cacheRoca.clear();cacheRoca.set(k,c);return c;
  }

  function enlazar(){
    cv=$('cv');g=cv.getContext('2d');est=Arte.crearEstrellas(70,41);
    cv.addEventListener('pointerdown',e=>{if(JUEGO.acto!==2||JUEGO.enCine)return;puntero={id:e.pointerId,x0:e.clientX,y0:e.clientY,cam0:camY,mov:false};try{cv.setPointerCapture(e.pointerId);}catch(_){}});
    cv.addEventListener('pointermove',e=>{if(!puntero||e.pointerId!==puntero.id)return;const dy=e.clientY-puntero.y0;if(Math.abs(dy)>7||Math.abs(e.clientX-puntero.x0)>7)puntero.mov=true;if(puntero.mov)camY=clamp(puntero.cam0-dy/escala,0,maxCam());});
    cv.addEventListener('pointerup',e=>{if(!puntero||e.pointerId!==puntero.id)return;const p=puntero;puntero=null;if(!p.mov)tocar(e);});
    cv.addEventListener('pointercancel',()=>{puntero=null;});
    cv.addEventListener('wheel',e=>{if(JUEGO.acto!==2)return;e.preventDefault();camY=clamp(camY+e.deltaY/escala*.5,0,maxCam());},{passive:false});
    $('mcuerpo').addEventListener('pointerdown',()=>{ultimoToque=performance.now();});
    $('mcuerpo').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||!panel)return;accionPanel(b.dataset.a,b.dataset);});
    $('mcuerpo').addEventListener('change',e=>{if(!panel)return;const s=e.target,luego=()=>setTimeout(()=>reabrir(true),Red.activa?500:0);
      if(s.matches('select[data-asignar]')){const v=s.value;hacer({t:'asignar',trip:+s.dataset.asignar,sala:v===''?null:+v},luego);}
      else if(s.matches('select[data-asignar-sala]')&&s.value){hacer({t:'asignar',trip:+s.value,sala:+s.dataset.asignarSala},luego);}});
  }
  function ajustar(){
    const r=$('escena').getBoundingClientRect();if(!r.width||!cv)return;
    let s=Math.min(r.width/ANCHO,r.height/200);s=s>=2?Math.floor(s):Math.max(1,s);escala=s;
    lw=Math.ceil(r.width/s);lh=Math.ceil(r.height/s);cv.width=lw;cv.height=lh;cv.style.width=(lw*s)+'px';cv.style.height=(lh*s)+'px';g.imageSmoothingEnabled=false;
    ox=Math.floor((lw-ANCHO)/2);camY=clamp(camY,0,maxCam());
  }
  function entrar(){vis={};burb={};camY=0;modo=null;panel=null;ganadoVisto=!!(B()&&B().ganado);ajustar();construirBarra();hud();}

  /* =====================================================================
     DIBUJO
     ===================================================================== */
  function dibujar(t){
    const b=B();if(!b||!g)return;
    const dia=BaseLunar.esDia(),hl=BaseLunar.horaLunar();
    g.fillStyle='#05050f';g.fillRect(0,0,lw,lh);
    oy=Math.max(0,Math.floor((lh-altoMundo())*.6));   // en pantallas altas, más cielo arriba
    g.save();g.translate(0,oy-camY);
    // cielo, estrellas, Sol bajo del polo y la Tierra asomando
    g.drawImage(Arte.cielo(lw,SUP+oy+2,dia?'espacio':'negro'),0,-oy);
    g.save();g.translate(0,-oy);Arte.estrellas(g,lw,SUP+oy-8,t,est,0,0);g.restore();
    if(b.tormenta){g.fillStyle=`rgba(255,120,60,${.10+.06*Math.sin(t*5)})`;g.fillRect(0,-oy,lw,SUP+oy);for(let i=0;i<14;i++){const x=((i*53+t*90)%(lw+40))-20,y=(i*17)%(SUP-14);R(x,y,6,1,'rgba(255,210,150,.75)');}}
    if(dia){const k=hl/DIA_LUZ_H,sx=Math.round(lerp(-.05,1.05,k)*lw),sy=SUP-18;
      for(const [rr,a] of [[11,.08],[8,.16],[6,.35]]){g.globalAlpha=a;Arte.disco(g,sx,sy,rr,'#fff2c0');}g.globalAlpha=1;Arte.disco(g,sx,sy,4,'#fffbe8');}
    const er=11,ex=ox+Math.round(ANCHO*.8),ey=SUP-14;g.drawImage(Arte.tierra(er,t*.05,t*.08),ex-er-1,ey-er-1);
    // horizonte lunar (la parte de abajo de la Tierra queda tapada, como en la imagen)
    g.drawImage(Arte.superficie(lw,14,7,2),0,SUP-14);
    if(!dia){g.fillStyle='rgba(8,8,40,.5)';g.fillRect(0,SUP-14,lw,16);}
    // corte del regolito
    const altoR=Math.max(altoMundo(),lh-oy)-SUP+40;g.drawImage(roca(lw,altoR),0,SUP);
    g.fillStyle='rgba(255,255,255,.16)';g.fillRect(0,SUP,lw,1);
    if(b.hechos[37]){for(let x=ox+MX-6;x<ox+MX+BASE_COLS*CW+6;x+=4){const yy=SUP-3-Math.round(2*Math.sin((x-ox)/14));R(x,yy,4,SUP-yy+1,'#8e8e9c');R(x,yy,4,1,'#c4c4d2');}}
    // plantas excavadas
    for(let p=1;p<=b.plantas;p++){const y=yPlanta(p),x0=ox+MX;
      R(x0-2,y-2,BASE_COLS*CW+4,FH,'#110e18');R(x0,y,BASE_COLS*CW,INT,'#1a1524');
      for(let c=0;c<=BASE_COLS;c+=2){R(x0+c*CW-1,y,2,INT,'#2a2236');}
      R(x0,y+INT,BASE_COLS*CW,4,'#3d3450');R(x0,y+INT,BASE_COLS*CW,1,'#5a4e70');}
    // excavación siguiente
    if(b.plantas<BASE_PLANTAS){const y=yPlanta(b.plantas+1),x0=ox+MX,on=((t*2)|0)%2;
      g.strokeStyle=modo?'rgba(255,179,71,.25)':'rgba(255,179,71,.55)';g.setLineDash([3,3]);g.strokeRect(x0+.5,y+.5,BASE_COLS*CW-1,INT-1);g.setLineDash([]);
      const lbl=`EXCAVAR PLANTA ${b.plantas+1} · ${BaseLunar.costeExcavar()} KG`;txt(lbl,x0+(BASE_COLS*CW-anchoTxt(lbl))/2,y+10,on?'#ffb347':'#c8903a');}
    dibAscensor(t);
    for(const s of b.salas)dibSala(s,t);
    dibSuperficie(t);
    // modo construir: celdas libres
    if(modo){const tp=T(modo.tipo);for(let p=1;p<=b.plantas;p++)for(let c=0;c<BASE_COLS;c++){if(c===BASE_ASCENSOR)continue;if(colocacion(p,c,tp.ancho)==null)continue;
      const x=ox+MX+c*CW,y=yPlanta(p);g.fillStyle=`rgba(123,224,123,${.16+.1*Math.sin(t*4)})`;g.fillRect(x+1,y+1,CW-2,INT-2);g.strokeStyle='rgba(123,224,123,.7)';g.strokeRect(x+1.5,y+1.5,CW-3,INT-3);}}
    // tripulación
    for(const tr of b.trip){const v=vis[tr.id];if(!v||v.oculto)continue;dibTrip(tr,v,t);}
    for(const tr of b.trip){const v=vis[tr.id],bu=burb[tr.id];if(v&&!v.oculto&&bu&&bu.t>0)dibBurbuja(ox+v.x,v.y-14,bu.txt);}
    g.restore();
    if(b.apagon){g.fillStyle=`rgba(0,0,0,${.32+.05*Math.sin(t*3)})`;g.fillRect(0,0,lw,lh);}
    if(b.tormenta){g.fillStyle=`rgba(255,60,40,${.06+.05*Math.sin(t*6)})`;g.fillRect(0,0,lw,3);g.fillRect(0,lh-3,lw,3);g.fillRect(0,0,3,lh);g.fillRect(lw-3,0,3,lh);}
    if(maxCam()>0){const k=camY/maxCam(),hh=Math.max(10,lh*lh/altoMundo());R(lw-3,2+(lh-4-hh)*k,2,hh,'rgba(238,240,255,.35)');}
  }
  function dibAscensor(t){
    const b=B(),x=ox+MX+BASE_ASCENSOR*CW,y0=yPlanta(0),y1=yPies(b.plantas)+2;
    R(x,y0,CW,y1-y0,'#141022');R(x+2,y0,1,y1-y0,'#5a5a78');R(x+CW-3,y0,1,y1-y0,'#5a5a78');
    for(let y=y0;y<y1;y+=6)R(x+3,y,CW-6,1,'#241e34');
    let cy=yPies(1);for(const tr of b.trip){const v=vis[tr.id];if(v&&v.enAsc){cy=v.y;break;}}
    R(x+CW/2,y0,1,cy-y0-12,'#8a8fc0');
    R(x+3,cy-15,CW-6,15,'#8a8fc0');R(x+4,cy-14,CW-8,13,'#2c2a5c');R(x+3,cy-15,CW-6,1,'#c8ccec');R(x+3,cy,CW-6,1,'#c8ccec');
    for(let p=0;p<=b.plantas;p++){const yy=yPlanta(p)+3;R(x+CW/2-1,yy,3,2,((t*2+p)|0)%3?'#ffb347':'#6a4a1e');}
  }
  function dibSala(s,t){
    const b=B(),tp=T(s.tipo),x=ox+salaX(s),y=yPlanta(s.planta),w=salaW(s),h=INT;
    const luz=!b.apagon||((t*1.3+s.id)%3<.4)||s.tipo==='energia';
    if(s.planta===0){ // edificio de superficie con cúpula
      R(x-2,y-6,w+4,h+6,'#6a6f9a');for(let i=0;i<w+4;i++){const k=(i/(w+3))*2-1,hh=Math.round(6*Math.sqrt(Math.max(0,1-k*k)));R(x-2+i,y-hh,1,hh,'#8a8fc0');}
      R(x-2,y-1,w+4,1,'#c8ccec');}
    R(x,y,w,h,tp.c);
    g.fillStyle='rgba(0,0,0,.22)';for(let yy=y+h-6;yy<y+h;yy+=2)g.fillRect(x,yy,w,1);
    R(x,y,w,2,'rgba(255,255,255,.12)');
    for(let lx=x+5;lx<x+w-4;lx+=12)R(lx,y+2,5,1,luz?'#ffe9b0':'#4a4234');
    props(s,x,y,w,h,t,luz);
    if(!luz){g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x,y,w,h);if(((t*2)|0)%2)R(x+w-4,y+3,2,2,'#ff3b3b');}
    txt(CORTO[s.tipo]||'',x+3,y+4,'#eef0ff','#0b0b1a');
    for(let i=0;i<s.nivel;i++)R(x+w-4-i*3,y+4,2,2,'#ffb347');
    if(tp.trab){const e=BaseLunar.eficiencia(s),ww=Math.round(clamp(e/1.2,0,1)*(w-6));R(x+3,y+10,w-6,1,'rgba(0,0,0,.4)');R(x+3,y+10,ww,1,e>=.8?'#7be07b':e>=.45?'#ffb347':'#ff6b6b');}
    if(s.inc)dibIncidente(s,x,y,w,h,t);
    if(panel&&panel.tipo==='sala'&&panel.id===s.id&&!$('modal').hidden){g.strokeStyle='#ffffff';g.lineWidth=1;g.strokeRect(x-.5,y-.5,w+1,h+1);}
  }
  function props(s,x,y,w,h,t,luz){
    const pie=y+h,b=B(),parp=((t*2)|0)%2;
    switch(s.tipo){
      case 'habitaculo':for(let i=0;i+20<=w;i+=20){const bx=x+i+3;R(bx,pie-12,14,2,'#8a8fc0');R(bx,pie-4,14,2,'#8a8fc0');R(bx,pie-14,14,2,'#4f8bff');R(bx,pie-6,14,2,'#ff7a59');R(bx,pie-14,3,2,'#eef0ff');R(bx,pie-6,3,2,'#eef0ff');R(bx+14,pie-15,1,15,'#c8ccec');}break;
      case 'invernadero':for(let i=0;i<2;i++){const yy=pie-8-i*8;R(x+3,yy-6,w-22,1,luz?'#ff4fd8':'#5a2a50');R(x+3,yy,w-22,2,'#5a3f2a');for(let k=x+4;k<x+w-20;k+=3){const hh=2+((k*7+i*3)%3);R(k,yy-hh,2,hh,(k+i)%2?'#7be07b':'#4fbf5a');}}
        R(x+w-16,pie-7,13,7,'#c8ccec');R(x+w-15,pie-9,4,2,'#ff7a3c');R(x+w-9,pie-10,3,3,'#eef0ff');break;
      case 'energia':{const k=clamp(b.recursos.energia/BaseLunar.topes().energia,0,1);for(let i=0;i<Math.floor((w-8)/9);i++){const bx=x+4+i*9;R(bx,pie-16,7,16,'#2c2a5c');R(bx+1,pie-15,5,14,'#14122a');const n=Math.round(k*7);for(let j=0;j<7;j++)R(bx+2,pie-3-j*2,3,1,j<n?(k<.2?'#ff6b6b':'#7be07b'):'#2a2a3a');}break;}
      case 'taller':R(x+3,pie-6,w-18,2,'#8a5a2a');R(x+4,pie-4,2,4,'#5a3f2a');R(x+w-17,pie-4,2,4,'#5a3f2a');R(x+6,pie-9,4,3,'#c8ccec');R(x+12,pie-10,2,4,'#ffb347');
        R(x+w-13,pie-14,10,14,'#4a4682');R(x+w-12,pie-12,8,6,'#14122a');R(x+w-9,pie-9,2,2,parp&&luz?'#ff9a3c':'#5a3a1a');break;
      case 'agua_o2':{const k=clamp(b.recursos.agua/BaseLunar.topes().agua,0,1),k2=clamp(b.recursos.o2/BaseLunar.topes().o2,0,1);
        R(x+4,pie-18,10,18,'#8a8fc0');R(x+5,pie-17,8,16,'#14122a');R(x+5,pie-1-Math.round(15*k),8,Math.round(15*k),'#2a6fd0');
        R(x+17,pie-18,10,18,'#8a8fc0');R(x+18,pie-17,8,16,'#14122a');R(x+18,pie-1-Math.round(15*k2),8,Math.round(15*k2),'#dfe6ff');
        R(x+30,pie-12,w-34,12,'#3a3880');R(x+31,pie-11,w-36,10,'#0a1f3a');for(let i=0;i<4;i++){const bx=x+33+((i*7)%(w-40)),by=pie-2-((t*9+i*4)%8);R(bx,by,1,1,'#b8e8ff');}R(x+14,pie-14,3,1,'#c8ccec');R(x+27,pie-10,3,1,'#c8ccec');break;}
      case 'laboratorio':R(x+3,pie-7,w-6,2,'#c8ccec');R(x+5,pie-12,3,5,'#8a8fc0');R(x+4,pie-13,5,1,'#eef0ff');R(x+12,pie-11,8,4,'#14122a');R(x+13,pie-10,6,2,luz?'#4fd1ff':'#1a3a4a');R(x+w-12,pie-12,8,5,'#2a6f9a');R(x+w-11,pie-11,2,2,'#ffd84a');R(x+w-8,pie-10,2,2,'#ff7a59');break;
      case 'enfermeria':R(x+4,pie-6,18,3,'#eef0ff');R(x+4,pie-3,2,3,'#8a8fc0');R(x+20,pie-3,2,3,'#8a8fc0');R(x+w-12,pie-18,7,7,'#eef0ff');R(x+w-10,pie-17,3,5,'#ff3b3b');R(x+w-11,pie-16,5,3,'#ff3b3b');
        R(x+w-14,pie-9,10,6,'#14122a');for(let i=0;i<8;i++){const yy=pie-6+((i===3||i===4)?-2:0);R(x+w-13+i,yy,1,1,'#7be07b');}break;
      case 'control':R(x+3,pie-6,w-6,6,'#3a3880');for(let i=0;i<Math.floor((w-6)/10);i++){R(x+5+i*10,pie-10,7,4,'#14122a');R(x+6+i*10,pie-9,5,2,luz?((i+((t*2)|0))%3?'#4fd1ff':'#7be07b'):'#1a3a4a');}
        R(x+w/2-6,y+12,12,7,'#06102a');if(luz)Arte.disco(g,Math.round(x+w/2),y+15,2,'#2a6fd0');break;
      case 'almacen':for(let i=0;i+9<=w-4;i+=9){const bx=x+3+i;R(bx,pie-6,7,6,'#8a5a2a');R(bx+1,pie-5,5,1,'#b07a3a');if(i%18===0){R(bx+1,pie-12,6,6,'#6a6a7a');R(bx+2,pie-11,4,1,'#9a9aaa');}}R(x+2,pie-14,w-4,1,'#5a5a6a');break;
      case 'gimnasio':R(x+4,pie-4,16,4,'#3a3880');R(x+4,pie-5,16,1,'#8a8fc0');R(x+19,pie-14,2,10,'#8a8fc0');R(x+16,pie-15,5,2,'#c8ccec');R(x+w-14,pie-8,9,2,'#8a8fc0');Arte.disco(g,x+w-12,pie-3,2,'#5a5a6a');Arte.disco(g,x+w-6,pie-3,2,'#5a5a6a');R(x+w-10,pie-12,2,4,'#c8ccec');break;
      case 'ocio':R(x+4,pie-6,16,4,'#8a3a5a');R(x+4,pie-9,3,3,'#8a3a5a');R(x+17,pie-9,3,3,'#8a3a5a');R(x+w-15,pie-18,12,8,'#14122a');if(luz){R(x+w-14,pie-17,10,6,'#203e72');Arte.disco(g,x+w-9,pie-14,2,'#2a6fd0');}R(x+w-5,pie-6,2,6,'#4fbf5a');R(x+w-6,pie-8,4,2,'#7be07b');break;
      case 'refugio':R(x+2,y+3,w-4,3,'#5a6a5a');R(x+2,y+h-3,w-4,3,'#5a6a5a');for(let i=0;i+8<=w-6;i+=8){R(x+4+i,pie-12,6,8,'#3a6fd0');R(x+5+i,pie-11,4,2,'#6a9aff');}R(x+3,pie-3,w-6,3,'#8a5a2a');R(x+w-9,pie-18,6,5,b.tormenta?(parp?'#ff3b3b':'#ffd84a'):'#2a3a2a');break;
      case 'esclusa':R(x+4,pie-15,5,12,'#ff7a3c');R(x+5,pie-17,3,3,'#eef0ff');R(x+11,pie-15,5,12,'#ff7a3c');R(x+12,pie-17,3,3,'#eef0ff');Arte.disco(g,x+w-11,pie-10,7,'#8a8fc0');Arte.disco(g,x+w-11,pie-10,5,'#2c2a5c');R(x+w-12,pie-12,3,4,'#ffb347');
        R(x+22,pie-10,6,4,'#14122a');R(x+23,pie-9,4,2,b.expedicion?'#ffb347':'#7be07b');break;
    }
  }
  function dibIncidente(s,x,y,w,h,t){
    const parp=((t*4)|0)%2,I=INCIDENTES_BASE[s.inc.tipo];
    g.strokeStyle=parp?'#ff3b3b':'#ffd84a';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);
    if(s.inc.tipo==='incendio'){for(let i=0;i<w;i+=3){const hh=3+((i*7+(t*20|0))%6);R(x+i,y+h-hh,3,hh,i%2?'#ff9a3c':'#ff5a2a');R(x+i+1,y+h-hh-1,1,1,'#ffe9a0');}g.fillStyle='rgba(40,30,30,.35)';g.fillRect(x,y,w,8);}
    else if(s.inc.tipo==='fuga'){for(let i=0;i<5;i++){const k=((t*.8+i*.2)%1);R(x+w-4-k*14,y+8+i*3-k*4,2,2,`rgba(238,240,255,${1-k})`);}}
    else if(s.inc.tipo==='electrico'){for(let i=0;i<3;i++)if(Math.random()<.5)R(x+rand(w),y+rand(h),1,2,'#ffe94a');}
    else if(s.inc.tipo==='impacto'){R(x+w/2-6,y+1,5,1,'#0b0b1a');R(x+w/2-2,y+2,4,1,'#0b0b1a');R(x+w/2+2,y+3,3,1,'#0b0b1a');for(let i=0;i<3;i++)R(x+w/2-3+i*3,y+4+((t*12+i*5)%14),1,1,'#c4c4d2');}
    if(I.trabajo>0){const k=clamp(s.inc.prog/I.trabajo,0,1);R(x+3,y+h-3,w-6,2,'#0b0b1a');R(x+3,y+h-3,Math.round((w-6)*k),2,'#eef0ff');}
    if(parp){R(x+w/2-3,y-7,7,7,'#ff3b3b');R(x+w/2-1,y-6,2,3,'#ffffff');R(x+w/2-1,y-2,2,1,'#ffffff');}
  }
  function dibSuperficie(t){
    const b=B(),xs=ox+MX,suelo=SUP;
    // antena de comunicaciones hacia la Tierra
    R(xs+16,suelo-16,1,16,'#8a8fc0');R(xs+13,suelo-20,8,1,'#c8ccec');R(xs+12,suelo-21,2,4,'#c8ccec');R(xs+20,suelo-21,2,4,'#c8ccec');R(xs+16,suelo-24,1,3,'#8a8fc0');if(((t*2)|0)%2)R(xs+16,suelo-25,1,1,'#ff4a4a');
    // paneles solares: dos por cada nivel de planta de energía (máx. 8)
    const n=Math.min(8,BaseLunar.cuenta('energia')*2),vert=!!b.hechos[36];
    for(let i=0;i<n;i++){const x=xs+30+i*11;
      R(x+4,suelo-10,1,10,'#8a8fc0');if(vert){R(x,suelo-24,9,14,'#1d3f8f');for(let r=suelo-24;r<suelo-10;r+=3)R(x,r,9,1,'#3a6fd0');R(x+4,suelo-24,1,14,'#2a5ab0');}
      else{R(x-1,suelo-14,11,4,'#1d3f8f');R(x-1,suelo-14,11,1,'#3a6fd0');}}
    // reactor de fisión de superficie (si se investigó), lejos del hábitat
    if(b.investigado.reactor){const x=Math.max(2,ox-34);R(x,suelo-14,8,14,'#c8ccec');R(x+1,suelo-15,6,1,'#eef0ff');R(x-7,suelo-12,6,10,'#4a5a8a');R(x+9,suelo-12,6,10,'#4a5a8a');
      for(let k=0;k<10;k+=2){R(x-7,suelo-12+k,6,1,'#6a7ab0');R(x+9,suelo-12+k,6,1,'#6a7ab0');}R(x+3,suelo-10,2,2,((t*2)|0)%2?'#7be07b':'#2a5a2a');
      for(let k=x+16;k<xs+20;k+=4)R(k,suelo-1,2,1,'#5a5a6a');}
    // rover
    const es=b.salas.find(s=>s.tipo==='esclusa');if(!es)return;const rx0=ox+salaX(es)+salaW(es)+4;
    if(b.expedicion){const k=clamp(b.expedicion.t/b.expedicion.dur,0,1),ida=k<.5?k*2:(1-k)*2,x=lerp(rx0,-20,ida);dibRover(x,suelo,t,true,k<.5?-1:1);}
    else dibRover(rx0,suelo,t,false,1);
  }
  function dibRover(x,y,t,mov,dir){
    g.save();g.translate(Math.round(x)+8,0);g.scale(dir,1);const X=-8;
    R(X,y-8,16,5,'#d8dcf0');R(X+1,y-8,14,1,'#ffffff');R(X+9,y-11,6,3,'#c8ccec');R(X+3,y-12,1,4,'#8a8fc0');R(X+2,y-13,3,1,'#ffb347');
    const k=mov?((t*8)|0)%2:0;for(const wx of [X+1,X+11]){R(wx,y-3,4,3,'#3a3a4a');R(wx+1+k,y-3,1,1,'#9a9aaa');}
    if(mov){g.fillStyle='rgba(196,196,210,.5)';g.fillRect(X-4-((t*20)|0)%3,y-2,3,1);}
    g.restore();
  }
  function dibTrip(tr,v,t){
    const x=Math.round(ox+v.x),y=Math.round(v.y),col=ROLES[tr.rol].c;
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x-4,y-1,8,1);
    g.save();g.translate(x,y-12);if(v.cara<0)g.scale(-1,1);g.drawImage(spriteAstro(col,v.mov&&(((t*7)|0)%2)?1:0),-6,0);g.restore();
    if(tr.enfermo>0){R(x-1,y-17,3,1,'#7be07b');R(x,y-18,1,3,'#7be07b');}
    else if(tr.salud<40&&((t*2)|0)%2)R(x-1,y-16,2,2,'#ff6b6b');
    const jug=Red.activa?[...rolesHumanos()]:[JUEGO.rol];
    if(tr.nombre===ROLES[tr.rol].quien&&jug.includes(tr.rol)){const bb=((t*3)|0)%2;R(x-2,y-20+bb,5,1,'#ffb347');R(x-1,y-19+bb,3,1,'#ffb347');R(x,y-18+bb,1,1,'#ffb347');}
  }
  function envolver(s,max){const ps=s.split(' '),l=[];let a='';for(const p of ps){if((a+' '+p).trim().length>max){if(a)l.push(a);a=p;}else a=(a+' '+p).trim();}if(a)l.push(a);return l;}
  function dibBurbuja(cx,y,s){
    g.font='6px "Press Start 2P",monospace';g.textBaseline='top';let ls=envolver(s,22);if(ls.length>3){ls=ls.slice(0,3);ls[2]=ls[2].slice(0,20)+'…';}
    const w=Math.max(...ls.map(l=>l.length))*6+8,h=ls.length*8+4,x=clamp(Math.round(cx-w/2),2,lw-w-2),yy=Math.round(y-h-2);
    g.fillStyle='#eef0ff';g.fillRect(x,yy,w,h);g.fillRect(Math.round(cx)-1,yy+h,3,3);g.fillStyle='#1b1a3a';ls.forEach((l,i)=>g.fillText(l,x+4,yy+3+i*8));
  }

  /* ---------- tripulación: caminar, ascensor y puestos ---------- */
  function objetivoDe(tr){
    const b=B();if(tr.exp)return null;let s=tr.sala?BaseLunar.sala(tr.sala):null;
    if(!s)s=b.salas.find(x=>x.tipo==='habitaculo')||b.salas.find(x=>x.planta>=1)||b.salas[0];
    if(!s)return {p:1,x0:MX+4,x1:MX+30};
    const x=salaX(s),w=salaW(s);return {p:s.planta,x0:x+5,x1:x+w-5};
  }
  function actualizarVis(dt){
    const b=B(),vivos=new Set();
    for(const tr of b.trip){vivos.add(tr.id);const obj=objetivoDe(tr);let v=vis[tr.id];
      if(!v){const p=obj?obj.p:1;v=vis[tr.id]={x:obj?azar(obj.x0,obj.x1):ascX(),y:yPies(p),p,dest:null,espera:Math.random()*2,cara:1,mov:false,enAsc:false};}
      v.mov=false;if(!obj){v.oculto=true;continue;}
      if(v.oculto){v.oculto=false;v.p=0;v.y=yPies(0);v.x=ascX()+20;}
      if(v.p!==obj.p){const ex=ascX();
        if(!v.enAsc&&Math.abs(v.x-ex)>.8){const d=Math.sign(ex-v.x);v.x+=d*Math.min(34*dt,Math.abs(ex-v.x));v.cara=d;v.mov=true;}
        else{v.enAsc=true;v.x=ex;const ty=yPies(obj.p),d=ty-v.y;if(Math.abs(d)<=48*dt){v.y=ty;v.p=obj.p;v.enAsc=false;v.dest=null;}else v.y+=Math.sign(d)*48*dt;}
      }else{v.y=yPies(v.p);v.enAsc=false;
        if(v.x<obj.x0||v.x>obj.x1)v.dest=clamp(v.x,obj.x0,obj.x1);
        else if(v.dest==null){v.espera-=dt;if(v.espera<=0)v.dest=azar(obj.x0,obj.x1);}
        if(v.dest!=null){const d=v.dest-v.x;if(Math.abs(d)<.8){v.dest=null;v.espera=1.5+Math.random()*4;}else{v.x+=Math.sign(d)*Math.min(20*dt,Math.abs(d));v.cara=Math.sign(d);v.mov=true;}}}
    }
    for(const k in vis)if(!vivos.has(+k))delete vis[k];
    for(const k in burb){burb[k].t-=dt;if(burb[k].t<=0)delete burb[k];}
  }
  const principales=()=>B().trip.filter(t=>t.nombre===ROLES[t.rol].quien&&!t.exp);
  function decir(trId,s,seg=4){if(s)burb[trId]={txt:s,t:seg};}
  function decirRol(rol,s){const t=B().trip.find(x=>x.rol===rol&&x.nombre===ROLES[rol].quien&&!x.exp);if(t&&esNpc(rol))decir(t.id,s);}
  function charlas(dt){tCharla-=dt;if(tCharla>0)return;tCharla=16+Math.random()*14;const ps=principales().filter(t=>esNpc(t.rol));if(!ps.length)return;const t=elegir(ps);decir(t.id,Dialogo.linea(t.rol));}
  function comentar(m){const ps=principales().filter(t=>esNpc(t.rol));if(!ps.length)return;const t=elegir(ps);setTimeout(()=>decir(t.id,elegir(DIALOGOS[t.rol].jugador).replace('{mision}',m.n)),900);}

  /* ---------- toques en el lienzo ---------- */
  function aMundo(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/escala,y:(e.clientY-r.top)/escala+camY-oy};}
  function colocacion(p,c,ancho){for(let k=0;k<ancho;k++){const col=c-k;if(!BaseLunar.ocupada(p,col,ancho))return col;}return null;}
  function tocar(e){
    const b=B();if(!b)return;const m=aMundo(e),bx=m.x-ox,by=m.y;
    const col=Math.floor((bx-MX)/CW);let planta=-1;
    for(let p=0;p<=b.plantas+1;p++){const y=yPlanta(p);if(by>=y-1&&by<=y+INT+3){planta=p;break;}}
    if(modo){
      if(planta>=1&&planta<=b.plantas&&col>=0&&col<BASE_COLS){const c=colocacion(planta,col,T(modo.tipo).ancho);
        if(c!=null){const tipo=modo.tipo;hacer({t:'construir',tipo,planta,col:c},res=>{if(res&&res.ok){modo=null;construirBarra();}});return;}}
      UI.aviso('Toca una celda verde.');return;}
    for(const tr of b.trip){const v=vis[tr.id];if(!v||v.oculto)continue;if(Math.abs(bx-v.x)<=4&&by>=v.y-13&&by<=v.y-3){hablarTrip(tr);return;}}
    const s=b.salas.find(s=>s.planta===planta&&bx>=salaX(s)&&bx<salaX(s)+salaW(s));
    if(s){abrirPanel({tipo:'sala',id:s.id});return;}
    if(planta===b.plantas+1&&b.plantas<BASE_PLANTAS){confirmarExcavar();return;}
    if(by<SUP&&by>SUP-26){const es=b.salas.find(x=>x.tipo==='esclusa');if(es&&bx>salaX(es)+salaW(es)&&bx<salaX(es)+salaW(es)+24){abrirPanel({tipo:'rover'});return;}
      if(bx<MX+28&&bx>MX){UI.dato('ANTENA · DATO NASA','La Red del Espacio Profundo de la NASA tiene antenas en California, España y Australia, separadas unos 120 grados para no perder el contacto.',['dsn'],false);return;}
      if(b.investigado.reactor&&m.x<Math.max(2,ox-34)+16){const x=INVESTIGACIONES.find(i=>i.id==='reactor');UI.dato('REACTOR · DATO NASA',x.dato,x.f,false);return;}
      if(BaseLunar.cuenta('energia')){UI.dato('PANELES SOLARES · DATO NASA',T('energia').dato,T('energia').f,false);return;}}
  }
  function hablarTrip(tr){
    const r=ROLES[tr.rol],princ=tr.nombre===r.quien,s=tr.sala?BaseLunar.sala(tr.sala):null,donde=tr.exp?'en expedición':(s?'en '+T(s.tipo).n:'sin puesto asignado');
    if(princ&&esNpc(tr.rol)){const l=Dialogo.linea(tr.rol);JUEGO.afinidad[tr.rol]=Math.min(100,JUEGO.afinidad[tr.rol]+2);UI.dialogo(`${r.quien} · ${r.n}`,l,r.c,tr.rol);return;}
    const estado=`Salud ${num(tr.salud,0)} %${tr.enfermo>0?' · enfermo':''} · ${donde}. Bonificación: ${r.n}.`;
    UI.dialogo(`${tr.nombre}${princ?' (tú)':''}`,princ?estado:`«${elegir(FRASES)}» ${estado}`,r.c,null);
  }

  /* =====================================================================
     ACCIONES Y PANELES
     ===================================================================== */
  function hacer(a,alFin){
    if(Red.activa&&!Red.esAnfitrion()){Red.accion(a,res=>{if(res&&!res.ok&&res.msg){UI.aviso(res.msg);Sonido.error();}else Sonido.clic();alFin&&alFin(res);});return;}
    const res=BaseLunar.accion(a,JUEGO.rol);if(!res.ok){if(res.msg)UI.aviso(res.msg);Sonido.error();}else Sonido.clic();alFin&&alFin(res);hud();
  }
  function abrirPanel(p){panel=p;firmaPanel='';reabrir(true);}
  function reabrir(forzar){
    if(!panel)return;const P=generar(panel);if(!P){panel=null;return;}
    if(!forzar&&P.firma===firmaPanel){refrescar(P);return;}
    if(!forzar&&performance.now()-ultimoToque<700)return;
    const caja=$('mcuerpo'),y=caja.parentElement?caja.parentElement.scrollTop:0;
    UI.modalHtml(P.titulo,P.html);firmaPanel=P.firma;refrescar(P);if(caja.parentElement)caja.parentElement.scrollTop=y;
  }
  function refrescar(P){const d=P.dyn?P.dyn():{};for(const k in d){const el=$('mcuerpo').querySelector(`[data-dyn="${k}"]`);if(el&&el.textContent!==d[k])el.textContent=d[k];}}
  function generar(p){
    switch(p.tipo){case 'sala':return pSala(p.id);case 'construir':return pConstruir();case 'trip':return pTrip();case 'inv':return pInv();case 'rover':return pRover();case 'prio':return pPrio();case 'informe':return pInforme();}
    return null;
  }
  const f2=v=>(v>=0?'+':'−')+num(Math.abs(v),2);
  const nombreSala=s=>s?T(s.tipo).n+(BaseLunar.cuenta(s.tipo)>s.nivel?' (planta '+s.planta+')':''):'Sin puesto';
  const misionesSala=s=>MISIONES.filter(m=>m.fase===6&&m.sala===s.tipo);
  function htmlMisiones(s){
    const ms=misionesSala(s);if(!ms.length)return '';
    return '<h4>Tareas de superficie</h4>'+ms.map(m=>{const r=ROLES[m.rol];let est;
      if(JUEGO.hecho[m.id])est='<span class="hecho">HECHA</span>';
      else if(!reqOk(m))est=`<small>Requiere: ${m.req.filter(i=>!JUEGO.hecho[i]).map(i=>esc(MISIONES[i].n)).join(', ')}</small>`;
      else if(m.rol===JUEGO.rol)est=`<button type="button" class="btn" data-a="mision" data-id="${m.id}">HACER MISIÓN</button>`;
      else est=`<small>${esNpc(m.rol)?'La hace '+esc(r.quien)+' (IA)':'La hace el jugador '+esc(r.n)}</small>`;
      return `<div class="fila-m"><span class="dot" style="background:${r.c}"></span><b>${esc(m.n)}</b> ${est}</div>`;}).join('');
  }
  function pSala(id){
    const s=BaseLunar.sala(id);if(!s)return null;const b=B(),t=T(s.tipo),m=NIVEL_MULT[s.nivel],ws=b.trip.filter(x=>x.sala===s.id),cup=BaseLunar.cupo(s);
    const cm=s.nivel<3?BaseLunar.costeMejora(s):0;
    const firma=[s.id,s.nivel,s.inc?s.inc.tipo:'',ws.map(w=>w.id+(w.exp?'x':'')+(w.enfermo>0?'e':'')).join(','),b.trip.map(x=>x.id+':'+(x.sala||0)).join(','),misionesSala(s).map(x=>x.id+(JUEGO.hecho[x.id]?'h':'')).join(','),b.expedicion?1:0,b.recursos.materiales>=cm?1:0].join('|');
    let h=`<p class="logi">${esc(t.desc)}</p><div class="filas"><span>Nivel</span><b>${s.nivel}/3</b><span>Planta</span><b>${s.planta===0?'superficie':s.planta}</b>`;
    if(t.trab)h+=`<span>Puestos</span><b data-dyn="puestos"></b><span>Eficiencia</span><b data-dyn="efi"></b>`;
    if(t.camas)h+=`<span>Camas</span><b>${t.camas*s.nivel}</b>`;
    if(t.plazas)h+=`<span>Plazas de refugio</span><b>${t.plazas*s.nivel}</b>`;
    if(t.almacen)h+=`<span>Capacidad extra</span><b>+${t.almacen*s.nivel}</b>`;
    if(t.bateria)h+=`<span>Batería</span><b>+${t.bateria*s.nivel} kWh</b>`;
    h+='</div>';
    const prod=Object.entries(t.prod||{}).map(([k,v])=>`${NOMBRE_REC[k]||k} +${num(v*m,2)}/h${s.tipo==='energia'?' (solo de día)':''}`);
    const cons=Object.entries(t.cons||{}).map(([k,v])=>`${NOMBRE_REC[k]||k} −${num(v*m,2)}/h`);
    if(prod.length)h+=`<p class="logi"><b>Produce</b> (con todos los puestos): ${esc(prod.join(' · '))}</p>`;
    if(cons.length)h+=`<p class="logi"><b>Consume</b>: ${esc(cons.join(' · '))}</p>`;
    if(s.inc){const I=INCIDENTES_BASE[s.inc.tipo];h+=`<div class="incid"><b>${I.icono} ${esc(I.n)}</b><p>${esc(I.desc)}</p>${I.trabajo>0?`<div class="barra"><i data-dynw="incprog"></i></div><p class="pista" data-dyn="incp"></p><button type="button" class="btn" data-a="ayudar" data-id="${s.id}">AYUDAR A REPARAR</button>`:''}</div>`;}
    h+=htmlMisiones(s);
    if(t.trab||s.tipo==='enfermeria'||s.inc||(s.tipo==='refugio'&&B().tormenta)){
      h+=`<h4>Tripulación en la sala</h4>`+(ws.length?ws.map(w=>`<div class="fila-t"><span class="dot" style="background:${ROLES[w.rol].c}"></span><span>${esc(w.nombre)}<small>${ROLES[w.rol].n}${t.rol===w.rol?' · bonificación ×1.5':''}${w.enfermo>0?' · enfermo':''}${w.exp?' · en expedición':''}</small></span><button type="button" class="btn alt" data-a="sacar" data-id="${w.id}">Sacar</button></div>`).join(''):'<p class="pista">Nadie trabaja aquí.</p>');
      const libres=b.trip.filter(x=>x.sala!==s.id&&!x.exp);
      if(ws.length<cup&&libres.length)h+=`<label class="sel">Añadir: <select data-asignar-sala="${s.id}" id="selAnadir"><option value="">— elige —</option>${libres.map(x=>`<option value="${x.id}">${esc(x.nombre)} · ${ROLES[x.rol].n} · ${esc(x.sala?CORTO[(BaseLunar.sala(x.sala)||{}).tipo]||'':'libre')}</option>`).join('')}</select></label>`;
    }
    const botones=[];
    if(s.nivel<3&&!t.superficie)botones.push(`<button type="button" class="btn" data-a="mejorar" data-id="${s.id}" ${b.recursos.materiales<cm?'disabled':''}>MEJORAR A NIVEL ${s.nivel+1} · ${cm} kg</button>`);
    if(s.tipo==='control')botones.push('<button type="button" class="btn alt" data-a="asesora">Hablar con la Dra. Solís</button>');
    if(s.tipo==='esclusa')botones.push('<button type="button" class="btn alt" data-a="panel" data-p="rover">Expediciones en rover</button>');
    if(s.tipo==='energia')botones.push('<button type="button" class="btn alt" data-a="panel" data-p="informe">Informe de energía</button>');
    if(s.tipo==='laboratorio')botones.push('<button type="button" class="btn alt" data-a="panel" data-p="inv">Investigaciones</button>');
    if(botones.length)h+=`<div class="pila">${botones.join('')}</div>`;
    h+=`<p class="logi dato"><span class="hecho">DATO NASA</span> ${esc(t.dato)}<br><small>${UI.fuentesHtml(t.f)}</small></p>`;
    const dyn=()=>{const ws2=BaseLunar.trabajadores(s),I=s.inc?INCIDENTES_BASE[s.inc.tipo]:null,o={};
      if(t.trab){o.puestos=`${ws2.length}/${BaseLunar.capacidad(s)}`;o.efi=num(BaseLunar.eficiencia(s)*100,0)+' %';}
      if(I&&I.trabajo>0){const k=clamp(s.inc.prog/I.trabajo,0,1);o.incp=`Reparación: ${num(k*100,0)} %`;const bar=$('mcuerpo').querySelector('[data-dynw="incprog"]');if(bar)bar.style.width=(k*100)+'%';}
      return o;};
    return {titulo:t.n.toUpperCase(),html:h,firma,dyn};
  }
  function pConstruir(){
    const b=B(),mat=b.recursos.materiales;
    const firma=[Math.floor(mat/10),b.plantas,b.salas.length].join('|');
    let h=`<p class="estado">Materiales: <b data-dyn="mat"></b> kg</p><div class="lista-c">`;
    for(const k of MENU_SALAS){const t=T(k),unica=t.unico&&b.salas.some(s=>s.tipo===k),no=unica||mat<t.costo;
      const pr=Object.entries(t.prod||{}).map(([a,v])=>`+${num(v,1)} ${NOMBRE_REC[a]||a}`).join(', ');
      h+=`<button type="button" class="item-c" data-a="construir" data-tipo="${k}" ${no?'disabled':''}><span class="mini" style="background:${t.c}"></span><span><b>${esc(t.n)}</b><small>${t.costo} kg · ${t.ancho} celdas${t.trab?' · '+t.trab+' puestos':''}${pr?' · '+esc(pr)+'/h':''}${unica?' · ya existe':''}</small><small>${esc(t.desc)}</small></span></button>`;}
    h+='</div>';
    if(b.plantas<BASE_PLANTAS){const c=BaseLunar.costeExcavar();h+=`<button type="button" class="btn ancho" data-a="excavar" ${mat<c?'disabled':''}>⛏️ EXCAVAR PLANTA ${b.plantas+1} · ${c} kg</button>`;}
    h+='<p class="pista">Las plantas profundas protegen mejor de la radiación (simulación). El ascensor ocupa la columna central.</p>';
    return {titulo:'CONSTRUIR',html:h,firma,dyn:()=>({mat:num(B().recursos.materiales,0)})};
  }
  function pTrip(){
    const b=B(),opciones=tr=>{const os=b.salas.filter(s=>BaseLunar.cupo(s)>0);
      return `<option value="">Sin puesto</option>`+os.map(s=>{const n=b.trip.filter(x=>x.sala===s.id).length,lleno=n>=BaseLunar.cupo(s)&&tr.sala!==s.id;return `<option value="${s.id}" ${tr.sala===s.id?'selected':''} ${lleno?'disabled':''}>${esc(CORTO[s.tipo])} · P${s.planta} (${n}/${BaseLunar.cupo(s)})</option>`;}).join('');};
    const firma=b.trip.map(t=>[t.id,t.sala||0,t.exp?1:0,t.enfermo>0?1:0].join(':')).join(',')+'|'+b.salas.map(s=>s.id+':'+s.nivel+(s.inc?'i':'')).join(',');
    const libresCamas=BaseLunar.camas()-b.trip.length;
    let h=`<p class="estado">Tripulantes: ${b.trip.length} · camas: ${BaseLunar.camas()} · próxima carga en <b data-dyn="lleg"></b></p>`;
    if(libresCamas<=0)h+='<p class="pista">No hay camas libres: construye o mejora habitáculos para recibir tripulantes.</p>';
    h+='<div class="tabla-t">'+b.trip.map(tr=>`<div class="fila-t"><span class="dot" style="background:${ROLES[tr.rol].c}"></span><span>${esc(tr.nombre)}<small>${ROLES[tr.rol].n} · <i data-dyn="s${tr.id}"></i></small></span>${tr.exp?'<small>En expedición</small>':`<select data-asignar="${tr.id}" aria-label="Puesto de ${esc(tr.nombre)}">${opciones(tr)}</select>`}</div>`).join('')+'</div>';
    h+='<button type="button" class="btn ancho" data-a="auto">AUTOASIGNAR PUESTOS LIBRES</button><p class="pista">Cada sala tiene un rol con bonificación ×1.5. Los tripulantes sin puesto acuden solos a los incidentes.</p>';
    return {titulo:'TRIPULACIÓN',html:h,firma,dyn:()=>{const o={lleg:num(B().proxLlegada,0)+' h'};B().trip.forEach(tr=>{o['s'+tr.id]=`salud ${num(tr.salud,0)} %${tr.enfermo>0?' · enfermo':''}`;});return o;}};
  }
  function pInv(){
    const b=B(),lab=b.salas.some(s=>s.tipo==='laboratorio');
    const firma=INVESTIGACIONES.map(x=>(b.investigado[x.id]?1:0)+(b.recursos.ciencia>=BaseLunar.costeInv(x)?'s':'n')).join('')+(lab?'L':'')+(b.hechos[39]?'p':'');
    let h=`<p class="estado">Ciencia: <b data-dyn="cien"></b> pts${lab?'':' · necesitas un laboratorio'}</p>`;
    h+=INVESTIGACIONES.map(x=>{const c=BaseLunar.costeInv(x),hecho=b.investigado[x.id];return `<div class="item-i"><b>${esc(x.n)}</b>${hecho?' <span class="hecho">HECHA</span>':''}<small>${esc(x.efecto)}</small><small class="dato">Dato NASA: ${esc(x.dato)} · ${UI.fuentesHtml(x.f)}</small>${hecho?'':`<button type="button" class="btn" data-a="investigar" data-id="${x.id}" ${!lab||b.recursos.ciencia<c?'disabled':''}>INVESTIGAR · ${c} pts${c<x.costo?' (rebajado)':''}</button>`}</div>`;}).join('');
    return {titulo:'INVESTIGACIÓN',html:h,firma,dyn:()=>({cien:num(B().recursos.ciencia,0)})};
  }
  let selExp='sombra',selTrip=[];
  function pRover(){
    const b=B(),x=b.expedicion;
    if(x){const E=EXPEDICIONES.find(e=>e.id===x.id);const firma='x'+x.id;
      const h=`<p class="estado">El rover está en «${esc(E.n)}».</p><div class="barra alta"><i data-dynw="xp"></i></div><p class="pista" data-dyn="xt"></p><p class="logi">${x.trip.map(id=>{const t=BaseLunar.tripulante(id);return t?esc(t.nombre):'';}).join(' y ')} van a bordo.</p><p class="logi dato"><span class="hecho">DATO NASA</span> ${esc(E.dato)}<br><small>${UI.fuentesHtml(E.f)}</small></p>`;
      return {titulo:'EXPEDICIÓN EN CURSO',html:h,firma,dyn:()=>{const xx=B().expedicion;if(!xx)return {};const k=clamp(xx.t/xx.dur,0,1);const bar=$('mcuerpo').querySelector('[data-dynw="xp"]');if(bar)bar.style.width=(k*100)+'%';return {xt:`Vuelve en ${num(Math.max(0,xx.dur-xx.t),0)} h`};}};}
    const disp=b.trip.filter(t=>!t.exp&&!(t.enfermo>0));selTrip=selTrip.filter(id=>disp.some(t=>t.id===id)).slice(0,2);
    const piloto=selTrip.some(id=>{const t=BaseLunar.tripulante(id);return t&&t.rol===1;});
    const firma=['n',selExp,selTrip.join(','),disp.map(t=>t.id).join(','),b.tormenta?1:0,b.investigado.rover?1:0].join('|');
    let h='<p class="estado">Elige destino y 1 o 2 tripulantes. Un Piloto reduce el riesgo a la mitad.</p><div class="lista-c">';
    h+=EXPEDICIONES.map(e=>{const r=e.riesgo*(b.investigado.rover?.5:1)*(piloto?.5:1),d=e.dur*(b.investigado.rover?.75:1);
      const bot=Object.entries(e.botin).map(([k,v])=>`${v[0]}–${v[1]} ${k==='ciencia'?'pts ciencia':k}`).join(', ');
      return `<button type="button" class="item-c ${selExp===e.id?'sel':''}" data-a="exp" data-id="${e.id}"><span><b>${esc(e.n)}</b><small>${num(d,0)} h · riesgo ${num(r*100,0)} % · trae ${esc(bot)}</small><small>${esc(e.desc)}</small></span></button>`;}).join('');
    h+='</div><h4>Tripulantes</h4><div class="chips">'+disp.map(t=>`<button type="button" class="chip ${selTrip.includes(t.id)?'sel':''}" data-a="xtrip" data-id="${t.id}"><span class="dot" style="background:${ROLES[t.rol].c}"></span>${esc(t.nombre)}</button>`).join('')+'</div>';
    h+=`<button type="button" class="btn ancho" data-a="lanzar" ${!selTrip.length||b.tormenta?'disabled':''}>🚙 LANZAR EXPEDICIÓN</button>${b.tormenta?'<p class="pista">Con tormenta solar el rover no sale.</p>':''}<p class="pista">Duraciones, riesgos y botín son de juego (simulación).</p>`;
    return {titulo:'EXPEDICIONES EN ROVER',html:h,firma};
  }
  function pPrio(){
    const b=B(),OPC=[['equilibrio','Equilibrio','Todo funciona normal.'],['energia','Ahorrar energía','Laboratorio, gimnasio y ocio trabajan y gastan la mitad.'],['soporte','Soporte vital','Agua, O₂ y comida +20 %; el laboratorio, a la mitad.'],['ciencia','Ciencia','Laboratorio +30 %; el resto, un poco menos.']];
    const firma=b.prioridad+(b.tormenta?'t':'')+(b.refugio?'r':'');
    let h='<p class="estado">El Comandante fija la prioridad de la base.</p><div class="lista-c">'+OPC.map(([k,n,d])=>`<button type="button" class="item-c ${b.prioridad===k?'sel':''}" data-a="prio" data-p="${k}"><span><b>${n}</b><small>${d}</small></span></button>`).join('')+'</div>';
    if(b.tormenta)h+=`<button type="button" class="btn ancho" data-a="refugio" ${b.refugio?'disabled':''}>☀️ ${b.refugio?'REFUGIO ORDENADO':'ORDENAR REFUGIO'}</button>`;
    return {titulo:'PRIORIDADES',html:h,firma};
  }
  function pInforme(){
    const b=B();const firma='inf'+(BaseLunar.esDia()?1:0)+b.salas.length+(b.investigado.reactor?1:0)+(b.log.length?b.log[b.log.length-1].n:0);
    let h='<h4>Energía y noche lunar</h4><div class="filas"><span>Ahora</span><b data-dyn="ciclo"></b><span>Batería</span><b data-dyn="bat"></b><span>Solar de día</span><b data-dyn="sol"></b><span>Consumo de noche</span><b data-dyn="cn"></b><span>Autonomía nocturna</span><b data-dyn="aut"></b></div>';
    h+='<p class="logi dato"><span class="hecho">DATO NASA</span> En la Luna, el día dura unos 14 días terrestres y la noche otros 14, con temperaturas extremas. <small>'+UI.fuentesHtml(['lro'])+'</small></p>';
    h+='<h4>Flujos por hora (simulación)</h4><div class="filas" data-flujos="1">'+['energia','o2','agua','alimentos','hielo','materiales','ciencia'].map(k=>`<span>${NOMBRE_REC[k]}</span><b data-dyn="f_${k}"></b>`).join('')+'</div>';
    h+='<h4>Registro</h4><div class="registro">'+b.log.slice(-12).reverse().map(l=>`<p><small>h ${l.h}</small> ${esc(l.msg)}</p>`).join('')+'</div>';
    return {titulo:'INFORME DE LA BASE',html:h,firma,dyn:()=>{const n=BaseLunar.informeNoche(),f=BaseLunar.calcularFlujo(),o={};
      o.ciclo=(n.esDia?'Día':'Noche')+` · faltan ${num(n.faltan,0)} h para ${n.esDia?'la noche':'el día'}`;o.bat=`${num(n.bateria,0)} / ${num(n.tope,0)} kWh`;o.sol=`${num(n.solarDia,1)} kWh/h`;
      o.cn=`${num(n.consumoNoche,1)} kWh/h`;o.aut=n.consumoNoche<=0?'ilimitada (reactor)':`${num(Math.min(n.autonomia,9999),0)} h de ${n.noche} h`;
      for(const k of ['energia','o2','agua','alimentos','hielo','materiales','ciencia'])o['f_'+k]=f2(f[k]);return o;}};
  }
  function confirmarExcavar(){panel={tipo:'construir'};firmaPanel='';const P=pConstruir();UI.modalHtml(P.titulo,P.html);firmaPanel=P.firma;refrescar(P);}
  function accionPanel(a,d){
    const b=B();
    switch(a){
      case 'mision':misionBase(MISIONES[+d.id]);break;
      case 'ayudar':hacer({t:'ayudar',sala:+d.id},()=>reabrir(false));break;
      case 'sacar':hacer({t:'asignar',trip:+d.id,sala:null},()=>reabrir(true));break;
      case 'mejorar':hacer({t:'mejorar',sala:+d.id},()=>setTimeout(()=>reabrir(true),Red.activa?500:0));break;
      case 'asesora':UI.cerrarModal();panel=null;Asesora.abrir();break;
      case 'panel':abrirPanel({tipo:d.p});break;
      case 'construir':modo={tipo:d.tipo};panel=null;UI.cerrarModal();construirBarra();UI.aviso('Toca una celda verde para construir: '+T(d.tipo).n+'.');break;
      case 'excavar':hacer({t:'excavar'},()=>setTimeout(()=>reabrir(true),Red.activa?500:0));break;
      case 'auto':autoasignar();setTimeout(()=>reabrir(true),Red.activa?700:50);break;
      case 'investigar':hacer({t:'investigar',id:d.id},()=>setTimeout(()=>{if(panel&&panel.tipo==='inv'&&!$('modal').hidden)reabrir(true);},Red.activa?500:0));break;
      case 'exp':selExp=d.id;reabrir(true);break;
      case 'xtrip':{const id=+d.id;if(selTrip.includes(id))selTrip=selTrip.filter(x=>x!==id);else{selTrip.push(id);if(selTrip.length>2)selTrip.shift();}reabrir(true);break;}
      case 'lanzar':hacer({t:'expedicion',id:selExp,trip:selTrip.slice()},res=>{if(res&&res.ok){selTrip=[];setTimeout(()=>reabrir(true),Red.activa?500:0);}});break;
      case 'prio':hacer({t:'prioridad',p:d.p},()=>setTimeout(()=>reabrir(true),Red.activa?500:0));break;
      case 'refugio':hacer({t:'refugio'},()=>setTimeout(()=>reabrir(true),Red.activa?500:0));break;
    }
  }
  /* Rellena puestos vacíos con tripulantes libres, prefiriendo su rol. */
  function autoasignar(){
    const b=B(),orden=['agua_o2','invernadero','energia','taller','laboratorio','control','enfermeria','gimnasio','ocio','esclusa'];
    const libres=b.trip.filter(t=>t.sala==null&&!t.exp);const acciones=[];const ocup={};b.trip.forEach(t=>{if(t.sala)ocup[t.sala]=(ocup[t.sala]||0)+1;});
    for(const tipo of orden)for(const s of b.salas.filter(x=>x.tipo===tipo)){const cap=BaseLunar.capacidad(s);
      while((ocup[s.id]||0)<cap&&libres.length){let i=libres.findIndex(t=>t.rol===T(s.tipo).rol);if(i<0)i=0;const t=libres.splice(i,1)[0];
        if(tipo==='enfermeria'&&!(t.enfermo>0)&&libres.some(x=>x.enfermo>0)){libres.push(t);break;}
        acciones.push({t:'asignar',trip:t.id,sala:s.id});ocup[s.id]=(ocup[s.id]||0)+1;}}
    const enf=b.salas.find(s=>s.tipo==='enfermeria');if(enf)b.trip.filter(t=>t.enfermo>0&&t.sala!==enf.id&&!t.exp).forEach(t=>acciones.push({t:'asignar',trip:t.id,sala:enf.id}));
    if(!acciones.length){UI.aviso('No hay tripulantes libres o puestos vacíos.');return;}
    acciones.forEach(a=>hacer(a));UI.aviso(`Asignados ${acciones.length} puestos.`);
  }
  function misionBase(m){
    if(!m)return;
    if(JUEGO.hecho[m.id]){UI.aviso('Esa tarea ya está completa.');return;}
    if(m.rol!==JUEGO.rol){const r=ROLES[m.rol];UI.aviso(esNpc(m.rol)?`${r.quien} (${r.n}) se encarga de esta tarea.`:`Esta tarea es del jugador ${r.n}.`);return;}
    if(!reqOk(m)){UI.aviso('Primero hay que completar: '+m.req.filter(i=>!JUEGO.hecho[i]).map(i=>MISIONES[i].n).join(', ')+'.');return;}
    panel=null;UI.minijuego(m.n.toUpperCase(),m.mg,m.o,()=>{Nave.completar(m.id,'yo');UI.dato('DATO NASA · '+m.n,m.dato,m.f,!!m.sim);});
  }

  /* ---------- barra de recursos y botones ---------- */
  function construirBarra(){
    const rb=$('recBase');
    if(!rb.dataset.listo){rb.dataset.listo='1';
      rb.innerHTML=['rbE','rbO','rbA','rbC','rbH','rbM','rbS','rbI','rbT','rbX','rbR','rbMo','rbP','rbD'].map(id=>`<span class="rc" id="${id}"></span>`).join('')+
        `<span class="vel" role="group" aria-label="Velocidad del reloj">${[0,1,3,6].map(v=>`<button type="button" class="btn alt" data-vel="${v}" aria-label="${v?'Velocidad ×'+v:'Pausa'}">${v?'×'+v:'❚❚'}</button>`).join('')}</span>`;
      rb.querySelectorAll('[data-vel]').forEach(bt=>bt.onclick=()=>hacer({t:'velocidad',v:+bt.dataset.vel}));}
    const bb=$('barraBase');
    if(modo){bb.innerHTML=`<span class="modo">Construyendo: ${esc(T(modo.tipo).n)} · ${T(modo.tipo).costo} kg</span><button type="button" class="btn alt" id="bbCancelar">Cancelar</button>`;$('bbCancelar').onclick=()=>{modo=null;construirBarra();};return;}
    bb.innerHTML=[['construir','🏗️ Construir'],['trip','👩‍🚀 Tripulación'],['inv','🔬 Investigar'],['rover','🚙 Rover'],['prio','⭐ Prioridad'],['informe','📋 Informe']].map(([k,n])=>`<button type="button" class="btn alt" data-panel="${k}">${n}</button>`).join('')+'<button type="button" class="btn" id="bbRefugio" hidden>☀️ REFUGIO</button>';
    bb.querySelectorAll('[data-panel]').forEach(bt=>bt.onclick=()=>abrirPanel({tipo:bt.dataset.panel}));
    $('bbRefugio').onclick=()=>hacer({t:'refugio'});
  }
  const flecha=v=>v>.02?'▲':v<-.02?'▼':'·';
  function hud(){
    const b=B();if(!b||JUEGO.acto!==2)return;const r=b.recursos,tp=BaseLunar.topes(),f=BaseLunar.calcularFlujo(),obj=BaseLunar.objetivos(),hechos=obj.filter(o=>o.hecho).length;
    $('fase').textContent=`FASE 7/7 · Base lunar · día lunar ${BaseLunar.diaLunar()}`;
    $('barra').style.width=Math.round(hechos/obj.length*100)+'%';$('progtxt').textContent=hechos+'/'+obj.length;
    const pon=(id,html,mal)=>{const e=$(id);if(!e)return;if(e.innerHTML!==html)e.innerHTML=html;e.classList.toggle('mal',!!mal);};
    pon('rbE',`⚡<b>${num(r.energia,0)}</b><small>/${tp.energia}</small>${flecha(f.energia)}`,r.energia<tp.energia*.15);
    pon('rbO',`O₂<b>${num(r.o2,0)}</b>${flecha(f.o2)}`,r.o2<20);
    pon('rbA',`💧<b>${num(r.agua,0)}</b>${flecha(f.agua)}`,r.agua<30);
    pon('rbC',`🥗<b>${num(r.alimentos,0)}</b>${flecha(f.alimentos)}`,r.alimentos<25);
    pon('rbH',`🧊<b>${num(r.hielo,0)}</b>`,false);
    pon('rbM',`🧱<b>${num(r.materiales,0)}</b>`,false);
    pon('rbS',`🔬<b>${num(r.ciencia,0)}</b>`,false);
    pon('rbI',`🛡️<b>${num(r.integridad,0)}%</b>`,r.integridad<40);
    pon('rbT',`🌡️<b>${num(r.temp,0)}°</b>`,r.temp<12||r.temp>28);
    pon('rbX',`CO₂<b>${num(r.co2,1)}</b>`,r.co2>1.5);
    pon('rbR',`☢️<b>${num(r.rad||0,1)}</b>`,(r.rad||0)>5);
    pon('rbMo',`🙂<b>${num(r.moral,0)}%</b>`,r.moral<45);
    pon('rbP',`👩‍🚀<b>${b.trip.length}</b><small>/${BaseLunar.camas()}</small>`,b.trip.length>BaseLunar.camas());
    const dia=BaseLunar.esDia();pon('rbD',`${dia?'☀️ Día':'🌙 Noche'}<small>${num(BaseLunar.horasCambio(),0)} h</small>`,!dia&&r.energia<tp.energia*.15);
    $('recBase').querySelectorAll('[data-vel]').forEach(bt=>bt.classList.toggle('sel',+bt.dataset.vel===b.vel));
    const ref=$('bbRefugio');if(ref)ref.hidden=!(b.tormenta&&!b.refugio&&BaseLunar.puede('refugio',JUEGO.rol));
    if(b.tormenta)UI.alerta(`☀️ TORMENTA SOLAR · ${b.refugio?'refugio en plantas profundas':'¡el Comandante debe ordenar el refugio!'}`);
    else if(b.apagon)UI.alerta('🌑 APAGÓN · sin baterías: todo funciona al mínimo');
    else UI.alerta(null);
  }
  /* ---------- avisos ---------- */
  function notificar(msg,tipo){
    if(JUEGO.acto!==2)return;UI.aviso(msg);
    if(['fuga','electrico','incendio','impacto','tormenta','apagon'].includes(tipo))Sonido.alarma();else if(tipo==='logro')Sonido.exito();
    const I=INCIDENTES_BASE[tipo];if(I&&I.rol!=null){const D=DIALOGOS[I.rol].base[tipo];if(D)decirRol(I.rol,elegir(D));}
    else if(I&&tipo==='incendio'){const ps=principales().filter(t=>esNpc(t.rol));if(ps.length){const t=elegir(ps);const D=DIALOGOS[t.rol].base.incendio;if(D)decir(t.id,elegir(D));}}
  }
  function datoReal(titulo,dato,f){colaDatos.push([titulo,dato,f]);}
  /* Avisos de Control de Misión al cruzar umbrales críticos (una vez por episodio). */
  const avisados=new Set();
  function vigilar(){
    const b=B(),r=b.recursos,n=BaseLunar.informeNoche();
    const reglas=[
      ['o2',r.o2<25,'El oxígeno baja: pon tripulantes en la planta de agua y oxígeno o construye una.'],
      ['co2',r.co2>1.5,'El CO₂ sube: hace falta la planta de agua y oxígeno, que también depura el aire.'],
      ['agua',r.agua<30,'Queda poca agua: trae hielo con el rover y fúndelo en la planta de agua y oxígeno.'],
      ['comida',r.alimentos<25,'Quedan pocos alimentos: construye la cocina e invernadero.'],
      ['noche',n.esDia&&n.faltan<90&&n.consumoNoche>0&&n.autonomia<n.noche,`La noche lunar llega en ${num(n.faltan,0)} h y las baterías solo aguantarán unas ${num(Math.min(n.autonomia,9999),0)} h de ${n.noche}. Más plantas de energía, ahorro o el reactor de fisión.`],
      ['estructura',r.integridad<35,'La estructura está dañada: el taller la repara y el regolito la protege.']];
    for(const [k,cond,msg] of reglas){if(cond&&!avisados.has(k)){avisados.add(k);UI.control(msg);}else if(!cond)avisados.delete(k);}
  }
  function derrotaSuave(se){UI.dialogo('CONTROL DE MISIÓN',`Evacuación parcial (simulación): ${se} tripulantes regresan a la Tierra y las salas pierden un nivel. Llega un suministro de emergencia. Revisa el oxígeno, el agua, la comida y la estructura: si faltan 24 h seguidas, hay que evacuar.`,'#ff6b6b',null);}

  /* ---------- bucle del acto 2 ---------- */
  function actualizar(dt){
    const b=B();if(!b)return;const anf=Red.esAnfitrion(),pausaLocal=JUEGO.pausa&&!Red.activa;
    if(anf&&!pausaLocal&&!JUEGO.enCine&&!b.ganado){let dh=dt*b.vel;while(dh>1e-6){const p=Math.min(1,dh);BaseLunar.paso(p);dh-=p;}if(b.vel>0)BaseLunar.tareasNpc(dt);}
    if(!JUEGO.pausa){const v=Entrada.vector();if(v.y)camY=clamp(camY+v.y*140*dt,0,maxCam());}
    actualizarVis(dt);charlas(dt);
    if(colaDatos.length&&!UI.dialogoAbierto()&&$('asesora').hidden&&!JUEGO.enCine){const [t1,d1,f1]=colaDatos.shift();UI.dato(t1,d1,f1,false);}
    tHud-=dt;if(tHud<=0){tHud=.25;hud();if(!JUEGO.enCine)vigilar();if(panel&&!$('modal').hidden)reabrir(false);else if($('modal').hidden)panel=null;}
    if(!ganadoVisto&&(b.ganado||(anf&&BaseLunar.objetivos().every(o=>o.hecho)))){ganadoVisto=true;b.ganado=true;setTimeout(()=>Principal.victoria(),600);}
    Red.tic(dt);
  }
  return {enlazar,ajustar,entrar,dibujar,actualizar,hud,notificar,datoReal,derrotaSuave,misionBase,comentar,hacer,abrirPanel,construirBarra,decir,
    get modo(){return modo;},get camY(){return camY;},set camY(v){camY=v;},get vis(){return vis;},
    _prueba:{aMundo,colocacion,yPlanta,yPies,salaX,salaW,tocarMundo:(x,y)=>{const r=cv.getBoundingClientRect();tocar({clientX:r.left+(x+ox)*escala,clientY:r.top+(y-camY+oy)*escala});},get ox(){return ox;},get oy(){return oy;},get escala(){return escala;}}};
})();
