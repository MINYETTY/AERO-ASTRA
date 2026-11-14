// Sala simulada para pruebas: misma API que la capacidad «room» (presence,
// peers, onPeers, join), sobre BroadcastChannel. Aplica el límite de 4 KiB.
(()=>{const bc=new BroadcastChannel('sala-prueba'),peer='p'+Math.random().toString(36).slice(2,9);let pres={};const otros=new Map(),oy=new Set();let snap=[];
  const mk=()=>{const a=[{peer,by:null,isMe:true,sameTab:true,kind:'viewer',guest:false,presence:Object.freeze(JSON.parse(JSON.stringify(pres))),updatedAt:Date.now()}];for(const [p,v] of otros)a.push({peer:p,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:v.p,updatedAt:v.t});snap=Object.freeze(a);};
  const avisa=()=>{mk();for(const f of oy)try{f({peers:snap,joined:[],left:[],updated:[]});}catch(e){}};
  bc.onmessage=e=>{const m=e.data;if(m.t==='p'){otros.set(m.peer,{p:Object.freeze(m.p),t:Date.now()});avisa();}else if(m.t==='hola'){bc.postMessage({t:'p',peer,p:pres});}else if(m.t==='adios'){otros.delete(m.peer);avisa();}};
  const sala={presence:async patch=>{const n=JSON.parse(JSON.stringify(pres));for(const k in patch){if(patch[k]===null)delete n[k];else n[k]=patch[k];}const tam=new TextEncoder().encode(JSON.stringify(n)).length;
      if(tam>4096){window.__excesos=(window.__excesos||0)+1;throw {code:'invalid_argument',message:'presencia de '+tam+' bytes'};}window.__maxPres=Math.max(window.__maxPres||0,tam);pres=n;bc.postMessage({t:'p',peer,p:pres});avisa();},
    peers:()=>snap,onPeers:f=>{oy.add(f);setTimeout(()=>f({peers:snap,joined:snap,left:[],updated:[]}),0);return ()=>oy.delete(f);},
    join:async()=>sala,emit:async()=>{},on:()=>()=>{},connected:()=>true,onConnection:()=>()=>{},leave:async()=>{bc.postMessage({t:'adios',peer});}};
  mk();bc.postMessage({t:'hola'});window.addEventListener('beforeunload',()=>bc.postMessage({t:'adios',peer}));
  window.claude={use:async n=>n==='room'?sala:null};window.__peer=peer;})();
