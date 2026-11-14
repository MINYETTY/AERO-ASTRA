/* =====================================================================
   asesora.js — Dra. Marina Solís · Control de Misión / Archivo.
   Responde con la base local verificada (conocimiento.js). Si la pregunta
   no está en la base: «No tengo ese dato verificado». Modo en línea
   opcional con Claude (capacidad «sample» del artefacto): la clave de API
   nunca está en el código.
   ===================================================================== */
const Asesora = (()=>{
  let cat='misiones',entrada=null,persp=0,escribiendo=0,muestra=undefined,enLinea=false,ocupado=false;
  const PERS_ORDEN=['cientifica','historica','ingenieria','seguridad'];

  /* Puntuación por palabras clave (sin tildes). */
  function buscar(texto){
    const t=normalizar(texto),toks=t.split(' ').filter(w=>w.length>1&&!PALABRAS_VACIAS.has(w));
    if(!toks.length)return {mejor:null,lista:[]};
    const res=CONOCIMIENTO.map(e=>{let p=0;
      for(const c of e.claves){const cn=normalizar(c);if(cn.includes(' ')){if(t.includes(cn))p+=5;}else if(toks.includes(cn))p+=3;else if(cn.length>=5&&toks.some(w=>w.length>=5&&(w.startsWith(cn.slice(0,5))||cn.startsWith(w.slice(0,5)))))p+=1.5;}
      const qn=normalizar(e.q);toks.forEach(w=>{if(w.length>3&&qn.includes(w))p+=1;});return {e,p};}).sort((a,b)=>b.p-a.p);
    return {mejor:res[0].p>=3?res[0].e:null,lista:res.filter(r=>r.p>0).slice(0,3).map(r=>r.e)};
  }
  function estadoEnlace(){
    if(JUEGO.acto===2)return {ret:1.28,los:false,txt:'Enlace con la Tierra · retardo de ida ~1.28 s'};
    const tr=Nave.estadoTrayecto();
    if(tr.zona==='plataforma')return {ret:0,los:false,txt:'Enlace terrestre directo'};
    if(tr.los)return {ret:0,los:true,txt:'SIN SEÑAL: detrás de la Luna. Responde el archivo de a bordo.'};
    return {ret:tr.retardo,los:false,txt:`Enlace por la DSN · retardo de ida ${num(tr.retardo,2)} s`};
  }
  function pintarRetrato(){
    const c=$('aRetrato'),g=c.getContext('2d');g.imageSmoothingEnabled=false;
    g.fillStyle='#173458';g.fillRect(0,0,32,32);for(let i=0;i<32;i+=4){g.fillStyle='rgba(79,209,255,.08)';g.fillRect(0,i,32,1);}
    g.fillStyle='#2b1b14';g.fillRect(9,4,14,8);g.fillRect(8,7,3,10);g.fillRect(21,7,3,10);g.fillRect(13,2,6,3);
    g.fillStyle='#c98e6a';g.fillRect(10,7,12,12);g.fillStyle='#b07a58';g.fillRect(10,16,12,3);
    g.fillStyle='#1b1a3a';g.fillRect(12,11,2,2);g.fillRect(18,11,2,2);g.fillStyle='#8a3a3a';g.fillRect(14,16,4,1);
    g.fillStyle='#e8ecff';g.fillRect(7,9,2,6);g.fillRect(6,14,2,1);g.fillRect(6,15,6,1);
    g.fillStyle='#2f5fbf';g.fillRect(6,20,20,12);g.fillStyle='#ffd84a';g.fillRect(19,23,4,2);g.fillStyle='#eef0ff';g.fillRect(15,20,2,5);
  }
  function pintarCategorias(){
    $('aCats').innerHTML=CATEGORIAS_ASESORA.map(c=>`<button type="button" class="chip${c.id===cat?' sel':''}" data-c="${c.id}">${c.n}</button>`).join('');
    $('aCats').querySelectorAll('button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;pintarCategorias();});
    $('aSug').innerHTML=CONOCIMIENTO.filter(e=>e.cat===cat).map(e=>`<button type="button" class="sug" data-id="${e.id}">${escHtml(e.q)}</button>`).join('');
    $('aSug').querySelectorAll('button').forEach(b=>b.onclick=()=>responderEntrada(CONOCIMIENTO.find(e=>e.id===b.dataset.id),b.textContent));
  }
  function escribir(texto,alFin){
    clearInterval(escribiendo);const el=$('aTexto');el.textContent='';let i=0;
    escribiendo=setInterval(()=>{i+=3;el.textContent=texto.slice(0,i);if(i>=texto.length){clearInterval(escribiendo);alFin&&alFin();}},16);
  }
  /* Simula el viaje de la pregunta y la respuesta por radio (ida y vuelta). */
  function conRetardo(fn){
    const en=estadoEnlace();$('aEnlace').textContent=en.txt;
    if(en.los||en.ret===0){fn(en);return;}
    $('aPersp').textContent='';$('aFuentes').innerHTML='';$('aMas').innerHTML='';
    $('aTexto').textContent=`📡 Pregunta enviada… respuesta en ${num(en.ret*2,2)} s (ida y vuelta).`;
    setTimeout(()=>fn(en),en.ret*2000);
  }
  function responderEntrada(e,pregunta){
    if(!e)return;entrada=e;persp=0;$('aPregunta').textContent=pregunta||e.q;
    conRetardo(en=>mostrar(en.los));
  }
  function disponibles(){return PERS_ORDEN.filter(k=>entrada&&entrada.p[k]);}
  function mostrar(local){
    const ks=disponibles(),k=ks[persp%ks.length];
    $('aPersp').textContent=(local?'ARCHIVO DE A BORDO · ':'')+'Perspectiva: '+PERSPECTIVAS[k]+(ks.length>1?` (${persp%ks.length+1}/${ks.length})`:'');
    $('aOtra').hidden=ks.length<2;
    escribir(entrada.p[k],()=>{
      $('aFuentes').innerHTML='<span class="hecho">DATO VERIFICADO</span> Fuente: '+UI.fuentesHtml(entrada.f);
      $('aMas').innerHTML=entrada.mas&&entrada.mas.length?'<span>¿Quieres saber más sobre…?</span>'+entrada.mas.map(id=>{const x=CONOCIMIENTO.find(c=>c.id===id);return x?`<button type="button" class="sug" data-id="${id}">${escHtml(x.q)}</button>`:'';}).join(''):'';
      $('aMas').querySelectorAll('button').forEach(b=>b.onclick=()=>responderEntrada(CONOCIMIENTO.find(c=>c.id===b.dataset.id)));
      JUEGO.bitacora.add('k:'+entrada.id);
    });
  }
  function noSe(pregunta,lista){
    entrada=null;$('aOtra').hidden=true;$('aPregunta').textContent=pregunta;$('aPersp').textContent='';
    conRetardo(()=>{
      escribir('No tengo ese dato verificado. Prefiero no inventarlo: en el archivo solo guardo datos comprobados en la NASA y la ESA.'+(lista.length?' Quizá te sirva alguno de estos temas:':''),()=>{
        $('aFuentes').innerHTML='';
        $('aMas').innerHTML=lista.map(x=>`<button type="button" class="sug" data-id="${x.id}">${escHtml(x.q)}</button>`).join('')+(muestra?`<button type="button" class="btn alt" id="aLinea2">Preguntar en línea a Claude</button>`:'');
        $('aMas').querySelectorAll('.sug').forEach(b=>b.onclick=()=>responderEntrada(CONOCIMIENTO.find(c=>c.id===b.dataset.id)));
        const b2=$('aLinea2');if(b2)b2.onclick=()=>preguntarEnLinea(pregunta);
      });
    });
  }
  /* ---------- modo en línea (opcional) ---------- */
  async function prepararLinea(){
    if(muestra!==undefined)return;muestra=null;
    try{if(window.claude&&window.claude.use){muestra=await window.claude.use('sample');}}catch(e){muestra=null;}
    $('aModo').hidden=!muestra;
  }
  async function preguntarEnLinea(pregunta){
    if(!muestra||ocupado)return;const en=estadoEnlace();
    if(en.los){$('aTexto').textContent='Sin señal: el modo en línea vuelve cuando salgamos de detrás de la Luna.';return;}
    ocupado=true;entrada=null;$('aOtra').hidden=true;$('aMas').innerHTML='';$('aPregunta').textContent=pregunta;
    $('aPersp').textContent='EN LÍNEA · respuesta generada por Claude (divulgación)';$('aTexto').textContent='📡 Consultando…';
    const prompt=PROMPT_ASESORA_LINEA.replace('{perspectiva}','la que mejor encaje').replace('{pregunta}',pregunta);
    try{const r=await muestra([{role:'user',content:prompt}],{modelTier:'quick',cache:false});
      escribir(String(r.text||'').trim()||'No hubo respuesta.',()=>{$('aFuentes').innerHTML='<span class="sim">EN LÍNEA</span> Contenido generado: compruébalo en nasa.gov antes de usarlo como dato.';});}
    catch(e){const c=e&&e.code;$('aTexto').textContent=c==='not_granted'?'El modo en línea no está permitido en esta vista.':c==='rate_limited'?'Demasiadas consultas seguidas. Espera un poco.':'No se pudo consultar en línea. Usa el archivo verificado.';
      if(c==='not_granted'){muestra=null;$('aModo').hidden=true;enLinea=false;}}
    ocupado=false;
  }
  function preguntar(){
    const txt=$('aCampo').value.trim();if(!txt)return;$('aCampo').value='';
    if(enLinea&&muestra){preguntarEnLinea(txt);return;}
    const {mejor,lista}=buscar(txt);if(mejor)responderEntrada(mejor,txt);else noSe(txt,lista);
  }
  function abrir(){
    UI.pausar();$('asesora').hidden=false;pintarRetrato();pintarCategorias();$('aEnlace').textContent=estadoEnlace().txt;
    if(!entrada&&!$('aTexto').textContent)escribir('Hola, soy la Dra. Marina Solís, de Control de Misión. Pregúntame sobre la NASA y el espacio: elige un tema o escribe tu pregunta. Solo respondo con datos verificados y te digo la fuente.');
    prepararLinea();
  }
  function cerrar(){$('asesora').hidden=true;clearInterval(escribiendo);UI.reanudar();}
  function iniciar(){
    $('aCerrar').onclick=cerrar;$('aEnviar').onclick=preguntar;$('aCampo').addEventListener('keydown',e=>{if(e.key==='Enter')preguntar();});
    $('aOtra').onclick=()=>{if(!entrada)return;persp++;mostrar(estadoEnlace().los);};
    $('aModo').onclick=()=>{enLinea=!enLinea;$('aModo').textContent='Modo en línea: '+(enLinea?'sí':'no');$('aModo').setAttribute('aria-pressed',String(enLinea));};
  }
  return {iniciar,abrir,cerrar,buscar};
})();
