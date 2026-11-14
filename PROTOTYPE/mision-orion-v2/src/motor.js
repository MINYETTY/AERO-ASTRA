/* =====================================================================
   motor.js — utilidades, sonido y arte pixelado dibujado por código.
   El estilo sigue la imagen de referencia: cielo azul noche que pasa a
   morado con tramado (dithering), estrellas en cruz que titilan, Tierra
   pixelada que gira con continentes y nubes, y regolito gris con cráteres.
   ===================================================================== */
const $ = id => document.getElementById(id);
const rand = n => Math.floor(Math.random()*n);
const azar = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,k) => a+(b-a)*k;
const elegir = a => a[rand(a.length)];
function barajar(a){for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const LOCAL = 'es-DO';
const num = (v,d=0) => Number(v).toLocaleString(LOCAL,{maximumFractionDigits:d,minimumFractionDigits:d});
/* Reloj de misión: T−hh:mm:ss antes del despegue; d hh:mm:ss después. */
function fmtMET(s){
  const neg = s<0; s = Math.abs(Math.floor(s));
  const d = Math.floor(s/86400), h = Math.floor(s%86400/3600), m = Math.floor(s%3600/60), x = s%60;
  const p = n => String(n).padStart(2,'0');
  return (neg?'T−':'')+(d?d+'d ':'')+p(h)+':'+p(m)+':'+p(x);
}
function fmtKm(km){return km>=100000?num(km/1000,0)+' mil km':num(km,0)+' km';}
function escHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
/* Texto normalizado para buscar: minúsculas y sin tildes. */
function normalizar(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u00bf?\u00a1!.,;:()\u00ab\u00bb"']/g,' ').replace(/\s+/g,' ').trim();}

/* ---------- Sonido (WebAudio, sin archivos) ---------- */
const Sonido = {on:true, ctx:null,
  tono(f,d,tipo='square',v=.04,en=0){
    if(!this.on)return;
    try{this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)();
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=tipo;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(this.ctx.destination);
      const t=this.ctx.currentTime+en;o.start(t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.stop(t+d+.02);}catch(e){}
  },
  exito(){this.tono(523,.12);this.tono(659,.12,'square',.04,.1);this.tono(784,.22,'square',.04,.2);},
  error(){this.tono(150,.25,'sawtooth',.05);},
  clic(){this.tono(520,.05);},
  alarma(){this.tono(880,.15,'square',.05);this.tono(660,.15,'square',.05,.18);}
};

/* ---------- Ruido determinista para el arte ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash3(x,y,z,s){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177)^Math.imul(s,2246822519);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295;}
function ruido3(x,y,z,s){
  const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  const c=(a,b,cc)=>hash3(xi+a,yi+b,zi+cc,s);
  const x00=lerp(c(0,0,0),c(1,0,0),u),x10=lerp(c(0,1,0),c(1,1,0),u),x01=lerp(c(0,0,1),c(1,0,1),u),x11=lerp(c(0,1,1),c(1,1,1),u);
  return lerp(lerp(x00,x10,v),lerp(x01,x11,v),w);
}
function fbm3(x,y,z,s,oct=4){let a=0,amp=.5,f=1,t=0;for(let i=0;i<oct;i++){a+=amp*ruido3(x*f,y*f,z*f,s+i*17);t+=amp;amp*=.5;f*=2.03;}return a/t;}
/* Matriz de Bayer 4×4: da el tramado típico del pixel art. */
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].map(r=>r.map(v=>(v+.5)/16));

/* ---------- ARTE ---------- */
const Arte = (()=>{
  const cache = new Map();
  /* Paleta tomada de la imagen de referencia. */
  const CIELO=[[6,7,26],[10,11,40],[16,15,58],[24,20,76],[33,25,94],[44,31,110],[58,38,126],[74,46,140],[92,56,150]];
  const MAR=[[8,22,60],[16,46,112],[28,82,170],[48,124,220],[96,168,250]];
  const DESIERTO=[[70,40,22],[120,74,36],[176,116,56],[214,160,86],[238,196,128]];
  const VERDE=[[28,52,30],[50,90,42],[82,128,58],[120,164,78],[158,196,104]];
  const HIELO=[[90,104,130],[150,168,196],[204,216,236],[234,240,252],[255,255,255]];
  const NUBE=[[70,80,110],[140,150,180],[200,208,228],[236,240,250],[255,255,255]];
  const GRIS=[[34,34,46],[64,64,80],[104,104,122],[150,150,168],[196,196,212],[226,226,236]];
  const LUZ=(()=>{const v=[-.62,-.38,.69],m=Math.hypot(...v);return v.map(x=>x/m);})();

  function lienzo(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c;}
  /* Textura equirectangular de la Tierra (sin costuras: ruido 3D en la esfera). */
  let texTierra=null;
  function crearTexTierra(){
    const W=160,H=80,suelo=new Uint8Array(W*H),bio=new Float32Array(W*H),nube=new Float32Array(W*H);
    for(let v=0;v<H;v++){const lat=(.5-(v+.5)/H)*Math.PI;for(let u=0;u<W;u++){
      const lon=(u+.5)/W*Math.PI*2,x=Math.cos(lat)*Math.cos(lon),y=Math.sin(lat),z=Math.cos(lat)*Math.sin(lon);
      const n=fbm3(x*1.7+3,y*1.7+1,z*1.7+5,11,5)+.18*fbm3(x*5,y*5,z*5,23,3)-.09;
      const i=v*W+u;suelo[i]=Math.abs(lat)>1.3?2:(n>.52?1:0);
      bio[i]=fbm3(x*3+9,y*3,z*3,31,3)-Math.abs(lat)*.12;
      nube[i]=fbm3(x*2.6,y*4.2,z*2.6,47,4);
    }}
    texTierra={W,H,suelo,bio,nube};
  }
  /* Esfera de la Tierra en píxeles. rot = giro (rad); nubesRot aparte. */
  function tierra(r,rot,nubesRot){
    r=Math.max(2,Math.round(r));
    const paso=Math.round(((rot%(Math.PI*2))+Math.PI*2)/(Math.PI*2)*256)%256, pasoN=Math.round(((nubesRot%(Math.PI*2))+Math.PI*2)/(Math.PI*2)*256)%256;
    const k='T'+r+'_'+paso+'_'+pasoN;if(cache.has(k))return cache.get(k);
    if(!texTierra)crearTexTierra();
    const T=texTierra,S=2*r+2,c=lienzo(S,S),g=c.getContext('2d'),img=g.createImageData(S,S),d=img.data;
    const ro=paso/256*Math.PI*2,rn=pasoN/256*Math.PI*2;
    for(let j=0;j<S;j++)for(let i=0;i<S;i++){
      const dx=(i-r-.5)/r,dy=(j-r-.5)/r,d2=dx*dx+dy*dy;if(d2>1)continue;
      const nz=Math.sqrt(1-d2),lat=Math.asin(-dy),lon=Math.atan2(dx,nz);
      const tu=((lon+ro)/(Math.PI*2)*T.W%T.W+T.W)%T.W|0,tv=clamp((.5-lat/Math.PI)*T.H|0,0,T.H-1),idx=tv*T.W+tu;
      const tn=((lon+rn)/(Math.PI*2)*T.W%T.W+T.W)%T.W|0,nub=T.nube[tv*T.W+tn];
      let pal;const s=T.suelo[idx];
      if(nub>.64)pal=NUBE;else if(s===2)pal=HIELO;else if(s===1)pal=T.bio[idx]>.5?VERDE:DESIERTO;else pal=MAR;
      const luz=dx*LUZ[0]+dy*LUZ[1]+nz*LUZ[2];
      const b=BAYER[j&3][i&3];
      let nivel=Math.floor(clamp(luz*4.2+.6+(b-.5)*.9,0,4.99));
      if(luz<-.05)nivel=0;
      let col=pal[nivel];
      if(luz<-.05&&pal!==MAR)col=MAR[0];
      const o=(j*S+i)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;
      if(d2>.9&&luz>-.1){const a=(d2-.9)*10;d[o]=lerp(d[o],120,a*.6);d[o+1]=lerp(d[o+1],190,a*.6);d[o+2]=lerp(d[o+2],255,a*.7);}
    }
    g.putImageData(img,0,0);
    if(cache.size>400)cache.clear();
    cache.set(k,c);return c;
  }
  /* Luna pixelada con mares y cráteres. fase = ángulo de la luz. */
  let texLuna=null;
  function crearTexLuna(){
    const W=160,H=80,al=new Float32Array(W*H),rnd=mulberry32(77);
    for(let v=0;v<H;v++){const lat=(.5-(v+.5)/H)*Math.PI;for(let u=0;u<W;u++){const lon=(u+.5)/W*Math.PI*2,x=Math.cos(lat)*Math.cos(lon),y=Math.sin(lat),z=Math.cos(lat)*Math.sin(lon);
      const m=fbm3(x*1.3+7,y*1.3,z*1.3,5,4);al[v*W+u]=.62+.25*(fbm3(x*6,y*6,z*6,9,3)-.5)-(m>.55?(m-.55)*1.8:0);}}
    for(let k=0;k<70;k++){const cu=rnd()*W,cv=8+rnd()*(H-16),cr=1.5+rnd()*rnd()*7;
      for(let v=Math.floor(cv-cr-2);v<=cv+cr+2;v++)for(let u=Math.floor(cu-cr-2);u<=cu+cr+2;u++){
        if(v<0||v>=H)continue;const uu=(u%W+W)%W,dd=Math.hypot(u-cu,v-cv)/cr;
        if(dd<.85)al[v*W+uu]-=.12*(1-dd)+.04;else if(dd<1.15)al[v*W+uu]+=.1;}}
    texLuna={W,H,al};
  }
  function luna(r,giro=0,luzX=LUZ[0]){
    r=Math.max(2,Math.round(r));const k='L'+r+'_'+Math.round(giro*20)+'_'+Math.round(luzX*10);if(cache.has(k))return cache.get(k);
    if(!texLuna)crearTexLuna();
    const T=texLuna,S=2*r+2,c=lienzo(S,S),g=c.getContext('2d'),img=g.createImageData(S,S),d=img.data;
    const L=[luzX,LUZ[1],Math.sqrt(Math.max(.05,1-luzX*luzX-LUZ[1]*LUZ[1]))];
    for(let j=0;j<S;j++)for(let i=0;i<S;i++){
      const dx=(i-r-.5)/r,dy=(j-r-.5)/r,d2=dx*dx+dy*dy;if(d2>1)continue;
      const nz=Math.sqrt(1-d2),lat=Math.asin(-dy),lon=Math.atan2(dx,nz)+giro;
      const tu=((lon/(Math.PI*2))*T.W%T.W+T.W)%T.W|0,tv=clamp((.5-lat/Math.PI)*T.H|0,0,T.H-1);
      const luz=dx*L[0]+dy*L[1]+nz*L[2],b=BAYER[j&3][i&3];
      const val=T.al[tv*T.W+tu]*clamp(luz*1.3+.25,0,1.2);
      const col=GRIS[Math.floor(clamp(val*5.2+(b-.5)*.8,0,5.99))];
      const o=(j*S+i)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;
    }
    g.putImageData(img,0,0);if(cache.size>400)cache.clear();cache.set(k,c);return c;
  }
  /* Cielo con degradado en bandas y tramado (como la imagen). */
  function cielo(w,h,tipo='espacio'){
    w|=0;h|=0;const k='C'+w+'x'+h+tipo;if(cache.has(k))return cache.get(k);
    const c=lienzo(w,h),g=c.getContext('2d'),img=g.createImageData(c.width,c.height),d=img.data;
    const pal=tipo==='dia'?[[60,110,190],[80,130,205],[100,150,215],[130,175,230],[160,200,240]]:tipo==='negro'?CIELO.slice(0,4):CIELO;
    for(let y=0;y<c.height;y++){const t=y/(c.height-1||1)*(pal.length-1);
      for(let x=0;x<c.width;x++){const b=BAYER[y&3][x&3],i=Math.min(pal.length-1,Math.floor(t+b-.5+.5));const col=pal[clamp(i,0,pal.length-1)];const o=(y*c.width+x)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;}}
    g.putImageData(img,0,0);cache.set(k,c);return c;
  }
  /* Lista de estrellas: puntos y chispas en cruz. */
  function crearEstrellas(n,semilla=1){
    const r=mulberry32(semilla),l=[];
    for(let i=0;i<n;i++){const ch=r()<.16;l.push({x:r(),y:r(),chispa:ch,f:.6+r()*1.8,p:r()*6.28,col:r()<.2?'#cfe0ff':(r()<.1?'#ffe9b0':'#ffffff'),z:.05+r()*.2});}
    return l;
  }
  function chispa(g,x,y,tam,col){
    g.fillStyle=col;g.fillRect(x,y,1,1);
    if(tam>=1){g.fillRect(x-1,y,1,1);g.fillRect(x+1,y,1,1);g.fillRect(x,y-1,1,1);g.fillRect(x,y+1,1,1);}
    if(tam>=2){g.globalAlpha=.55;g.fillRect(x-2,y,1,1);g.fillRect(x+2,y,1,1);g.fillRect(x,y-2,1,1);g.fillRect(x,y+2,1,1);g.globalAlpha=1;}
    if(tam>=3){g.globalAlpha=.25;g.fillRect(x-3,y,1,1);g.fillRect(x+3,y,1,1);g.fillRect(x,y-3,1,1);g.fillRect(x,y+3,1,1);g.globalAlpha=1;}
  }
  function estrellas(g,w,h,t,lista,dx=0,dy=0,hmax=1){
    for(const s of lista){
      if(s.y>hmax)continue;
      const x=Math.floor((((s.x*w-dx*s.z)%w)+w)%w),y=Math.floor((((s.y*h-dy*s.z)%h)+h)%h);
      const br=Math.abs(Math.sin(t*s.f+s.p));
      if(s.chispa){chispa(g,x,y,Math.floor(br*3.6),s.col);}
      else{g.globalAlpha=.35+.65*br;g.fillStyle=s.col;g.fillRect(x,y,1,1);g.globalAlpha=1;}
    }
  }
  /* Horizonte lunar con regolito tramado y cráteres en perspectiva. */
  function superficie(w,h,semilla=3,curva=6){
    w|=0;h|=0;const k='S'+w+'x'+h+'_'+semilla+'_'+curva;if(cache.has(k))return cache.get(k);
    const c=lienzo(w,h+curva),g=c.getContext('2d'),img=g.createImageData(c.width,c.height),d=img.data,r=mulberry32(semilla);
    const H=c.height,crat=[];
    for(let i=0;i<Math.max(8,w/11|0);i++){const cy=curva+3+Math.pow(r(),.75)*(H-curva-4),prof=(cy-curva)/(H-curva),rx=1.5+prof*prof*w*.11*(.35+r());crat.push({cx:r()*w,cy,rx,ry:rx*(.24+prof*.28)});}
    for(let y=0;y<H;y++)for(let x=0;x<w;x++){
      const t=(x/w-.5)*2,top=curva*t*t;
      if(y<top)continue;
      const prof=(y-top)/(H-top||1),b=BAYER[y&3][x&3];
      let v=.62+.26*(fbm3(x*.07,y*.07/(.25+prof),0,semilla,3)-.5)-prof*.2;
      if(y-top<1.2)v+=.22;else if(y-top<3)v+=.1;
      for(const q of crat){const ex=(x-q.cx)/q.rx,ey=(y-q.cy)/q.ry,e=ex*ex+ey*ey;
        if(e<1){v+=ey<0?-.38*(1-e*.6):.1*(1-e);}else if(e<1.4){v+=ey>0?.16:-.06;}}
      const col=GRIS[Math.floor(clamp(v*5.3+(b-.5)*.9,0,5.99))];
      const o=(y*c.width+x)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;
    }
    g.putImageData(img,0,0);cache.set(k,c);return c;
  }
  function disco(g,cx,cy,r,col){g.fillStyle=col;for(let dy=-r;dy<=r;dy++){const w=Math.floor(Math.sqrt(r*r-dy*dy));g.fillRect(cx-w,cy+dy,2*w+1,1);}}
  /* Escena completa estilo imagen: cielo + estrellas + Tierra asomando +
     superficie lunar. Se usa en la base y en cinemáticas. */
  function escenaLunar(g,w,h,t,est,opc={}){
    const hs=opc.horizonte!=null?opc.horizonte:Math.round(h*.62);
    g.drawImage(cielo(w,hs+4,opc.cielo||'espacio'),0,0);
    estrellas(g,w,hs+4,t,est,opc.dx||0,0);
    const er=opc.radioTierra||Math.round(Math.min(w,h)*.16),ex=opc.tierraX!=null?opc.tierraX:Math.round(w*.5),ey=opc.tierraY!=null?opc.tierraY:hs-Math.round(er*.55);
    const tc=tierra(er,t*.05,t*.08);g.drawImage(tc,ex-er-1,ey-er-1);
    g.drawImage(superficie(w,h-hs+2,opc.semilla||3,opc.curva!=null?opc.curva:Math.max(3,w/60|0)),0,hs-2);
  }
  return {tierra,luna,cielo,estrellas,crearEstrellas,superficie,disco,chispa,escenaLunar,GRIS,lienzo,limpiar:()=>cache.clear()};
})();

/* ---------- Sprites de astronauta (12×12) ---------- */
const SPRITE_ASTRO=[
 ['....kkkk....','...kwwwwk...','..kwvvvvwk..','..kwvvvvwk..','..kwwwwwwk..','...kkkkkk...','..kbbbbbbk..','.kwkbbbbkwk.','.kwkbbbbkwk.','..kwwwwwwk..','..kwk..kwk..','..kkk..kkk..'],
 ['....kkkk....','...kwwwwk...','..kwvvvvwk..','..kwvvvvwk..','..kwwwwwwk..','...kkkkkk...','..kbbbbbbk..','.kwkbbbbkwk.','.kwkbbbbkwk.','..kwwwwwwk..','..kwk.kwk...','..kkk.kkk...']
];
const cacheSprite={};
function spriteAstro(col,cuadro=0,traje='#e8ecff'){
  const k=col+cuadro+traje;if(cacheSprite[k])return cacheSprite[k];
  const c=document.createElement('canvas');c.width=12;c.height=12;const x=c.getContext('2d');
  const pal={k:'#14102a',w:traje,v:'#3aa0d8',b:col};
  SPRITE_ASTRO[cuadro].forEach((fila,j)=>[...fila].forEach((ch,i)=>{if(ch!=='.'){x.fillStyle=pal[ch];x.fillRect(i,j,1,1);}}));
  return(cacheSprite[k]=c);
}
