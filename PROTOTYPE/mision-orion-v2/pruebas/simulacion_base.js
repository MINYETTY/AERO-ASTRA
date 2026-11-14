// Jugador «razonable» frente a jugador pasivo. Uso: node estrategia.js [horas] [semilla] [pasivo]
const fs=require('fs'),path=require('path');const S=path.join(__dirname,'..','src');
global.window={};global.document={createElement:()=>({getContext:()=>({})})};
let semilla=+(process.argv[3]||1);Math.random=()=>{semilla=(semilla*16807)%2147483647;return (semilla-1)/2147483646;};
const pasivo=process.argv[4]==='pasivo';
const codigo=['datos_nave.js','dialogos.js','datos_base.js'].map(f=>fs.readFileSync(path.join(S,f),'utf8')).join('\n');
const motor=fs.readFileSync(path.join(S,'motor.js'),'utf8').split('/* ---------- Sonido')[0];
const base=fs.readFileSync(path.join(S,'base_lunar.js'),'utf8');
const stubs=`const JUEGO={hecho:new Array(40).fill(false),rol:3,acto:2,base:null};const Red={activa:false,esAnfitrion:()=>true};
function esNpc(r){return r!==JUEGO.rol;}function rolesHumanos(){return new Set([JUEGO.rol]);}function reqOk(m){return m.req.every(i=>JUEGO.hecho[i]);}
const Nave={completar:(id)=>{JUEGO.hecho[id]=true;BaseLunar.alCompletarMision(id);}};`;
eval(codigo+'\n'+motor+'\n'+stubs+'\n'+base+`
const horas=+(process.argv[2]||1500);const b=BaseLunar.nueva();
const A=a=>{const r=BaseLunar.accion(a,JUEGO.rol);if(!r.ok&&process.env.V)console.log('  ✗',a.t,a.tipo||a.id||'',r.msg);return r;};
const S=t=>b.salas.find(s=>s.tipo===t);const libre=()=>b.trip.find(t=>t.sala==null&&!t.exp);
const construidos=[];const plan=[['agua_o2',1,2],['laboratorio',2,2],['energia',1,8],['invernadero',2,6],['taller',2,9],['habitaculo',3,0],['energia',3,2],['gimnasio',3,6],['habitaculo',3,8],['almacen',3,10],['enfermeria',4,0],['habitaculo',4,2]];
let paso=0;
// reparto inicial: Ortiz a agua y O2, Rivas al laboratorio cuando exista

for(let h=0;h<horas;h++){
  if(!pasivo){
    if(h===40)Nave.completar(36);if(h===80)Nave.completar(39);if(h===95)Nave.completar(37);if(h===110)Nave.completar(38);
    if(paso<plan.length){const [t,p,c]=plan[paso];if(p>b.plantas)A({t:'excavar'});const r=A({t:'construir',tipo:t,planta:p,col:c});if(r.ok)paso++;}
    const ag=S('agua_o2'),lab=S('laboratorio');if(ag&&b.trip[2]&&b.trip[2].sala!==ag.id&&b.trip[2].rep===undefined&&!b.trip[2].exp&&!(b.trip[2].enfermo>0)&&b.trip[2].nombre==='Dra. Ortiz')A({t:'asignar',trip:b.trip[2].id,sala:ag.id});
    if(lab&&b.trip[0]&&b.trip[0].nombre==='Cdte. Rivas'&&b.trip[0].sala!==lab.id&&b.trip[0].rep===undefined&&!b.trip[0].exp)A({t:'asignar',trip:b.trip[0].id,sala:lab.id});
    // asignar libres a salas con puestos
    for(const s of b.salas){for(let k=0;k<4&&BaseLunar.trabajadores(s).length<BaseLunar.capacidad(s);k++){const l=libre();if(!l)break;if(!A({t:'asignar',trip:l.id,sala:s.id}).ok)break;}}
    if(!b.investigado.reactor)A({t:'investigar',id:'reactor'});else for(const x of ['agua98','led','electrolisis','polvo','blindaje','rover','isru'])A({t:'investigar',id:x});
    if(!b.expedicion&&h>60&&b.recursos.hielo<60){const ts=b.trip.filter(t=>!t.exp&&!t.enfermo&&t.rol===1).slice(0,1);if(ts.length)A({t:'expedicion',id:'sombra',trip:ts.map(t=>t.id)});}
    if(b.tormenta&&!b.refugio)A({t:'refugio'});
    const enf=S('enfermeria');if(enf)b.trip.filter(t=>t.enfermo>0&&t.sala!==enf.id).forEach(t=>A({t:'asignar',trip:t.id,sala:enf.id}));
    if(b.recursos.energia<200&&!BaseLunar.esDia()&&!b.investigado.reactor)A({t:'prioridad',p:'energia'});else if(b.prioridad!=='equilibrio')A({t:'prioridad',p:'equilibrio'});
  }
  BaseLunar.paso(1);
  if(h%100===0||h===horas-1){const r=b.recursos;console.log('h',String(Math.round(b.hora)).padStart(4),BaseLunar.esDia()?'D':'N','E',r.energia.toFixed(0).padStart(4),'O2',r.o2.toFixed(0).padStart(3),'agua',r.agua.toFixed(0).padStart(3),'com',r.alimentos.toFixed(0).padStart(3),'hielo',r.hielo.toFixed(0).padStart(3),'mat',r.materiales.toFixed(0).padStart(4),'cien',r.ciencia.toFixed(0).padStart(3),'T',r.temp.toFixed(0),'moral',r.moral.toFixed(0),b.apagon?'APAGÓN':'','trip',b.trip.length,'salud media',(b.trip.reduce((a,t)=>a+t.salud,0)/Math.max(1,b.trip.length)).toFixed(0),'evac',b.evac);}
}
const o=BaseLunar.objetivos();console.log('OBJETIVOS:',o.map(x=>(x.hecho?'✔':'·')+x.id).join(' '));
console.log('Incidentes:',b.log.filter(l=>['fuga','electrico','incendio','impacto','enfermedad','tormenta'].includes(l.tipo)).length,'(últimos 40 registros)');
`);
