/* =====================================================================
   datos_nave.js — DATOS del acto 1 (nave Orión). Solo datos, sin lógica.
   Todo dato marcado como «dato» está verificado en la fuente indicada
   (NASA, ESA o NTRS de la NASA). Lo que es invento del juego lleva sim:true.
   ===================================================================== */

/* Fuentes reutilizables (nombre visible + enlace). */
const FUENTES = {
  a2tripulacion:{n:'NASA · Tripulación de Artemis II',u:'https://www.nasa.gov/general/nasa-names-astronauts-to-next-moon-mission-first-crew-under-artemis/'},
  a2kit:{n:'NASA · Kit de prensa de Artemis II',u:'https://www.nasa.gov/artemis-ii-press-kit/'},
  a2mision:{n:'NASA · Misión Artemis II',u:'https://www.nasa.gov/mission/artemis-ii/'},
  a2record:{n:'NASA · Récord de distancia de Artemis II',u:'https://www.nasa.gov/news-release/nasas-artemis-ii-crew-eclipses-record-for-farthest-human-spaceflight'},
  a1:{n:'NASA · Misión Artemis I',u:'https://www.nasa.gov/mission/artemis-i/'},
  a3:{n:'NASA · Misión Artemis III',u:'https://www.nasa.gov/mission/artemis-iii/'},
  a4:{n:'NASA · Misión Artemis IV',u:'https://www.nasa.gov/mission/artemis-iv/'},
  a4det:{n:'NASA · Artemis IV en el polo sur',u:'https://www.nasa.gov/?p=971710'},
  acelera:{n:'NASA · Avances hacia Artemis III y IV',u:'https://www.nasa.gov/?p=1062413'},
  ignition:{n:'NASA · Iniciativas «Ignition» y base lunar',u:'https://www.nasa.gov/news-release/nasa-unveils-initiatives-to-achieve-americas-national-space-policy/'},
  esm:{n:'NASA · Módulo de Servicio Europeo',u:'https://www.nasa.gov/humans-in-space/orion-spacecraft/european-service-module/'},
  esm2:{n:'NASA · Enciclopedia del Módulo de Servicio',u:'https://www.nasa.gov/?p=1001593'},
  esaEsm:{n:'ESA · Motores del Módulo de Servicio Europeo',u:'https://www.esa.int/ESA_Multimedia/Images/2026/02/European_Service_Module_engines'},
  orion:{n:'NASA · Guía de referencia de Orión',u:'https://www.nasa.gov/reference/orion-spacecraft/'},
  orionPagina:{n:'NASA · Nave Orión',u:'https://www.nasa.gov/humans-in-space/orion-spacecraft/'},
  orionComp:{n:'NASA · Componentes de Orión',u:'https://www.nasa.gov/?p=621903'},
  escudo:{n:'NASA · Escudo térmico de Orión',u:'https://www.nasa.gov/?p=786888'},
  avcoat:{n:'NASA · Componentes de la nave (Avcoat)',u:'https://www.nasa.gov/reference/spacecraft-components'},
  las:{n:'NASA · Ficha del sistema de escape (LAS)',u:'https://www.nasa.gov/sites/default/files/files/orion_las_fact_sheet.pdf'},
  lasPrueba:{n:'NASA · Prueba del motor de aborto',u:'https://www.nasa.gov/?p=96358'},
  sls:{n:'NASA · Space Launch System',u:'https://www.nasa.gov/humans-in-space/space-launch-system/'},
  sls1:{n:'NASA · El SLS en Artemis I',u:'https://www.nasa.gov/?p=320690'},
  navegacion:{n:'NASA · Láseres, estrellas y sensores guían a Orión',u:'https://www.nasa.gov/missions/lasers-stars-and-sensors-will-guide-nasas-orion-spacecraft/'},
  opnav:{n:'NASA NTRS · Navegación de Artemis I',u:'https://ntrs.nasa.gov/api/citations/20230000714/downloads/AAS-23-057_Artemis_1_Navigation_HoltDsouzaWasinger_FINALfinal.pdf'},
  dsn:{n:'NASA · Red del Espacio Profundo',u:'https://www.nasa.gov/communicating-with-missions/dsn/'},
  alsj:{n:'NASA · Apollo Lunar Surface Journal (retardo de radio)',u:'https://www.nasa.gov/history/alsj/a12/A12Audio_Moon_Houston.html'},
  cuerpo:{n:'NASA · El cuerpo humano en el espacio',u:'https://www.nasa.gov/humans-in-space/the-human-body-in-space/'},
  agua98:{n:'NASA · Hito de recuperación de agua en la EEI',u:'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station'},
  eclss:{n:'NASA · Ficha del soporte vital (ECLSS)',u:'https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf'},
  eclss2:{n:'NASA · Ficha del ECLSS (electrólisis)',u:'https://www.nasa.gov/wp-content/uploads/2020/10/g-281237_eclss_0.pdf'},
  ap13:{n:'NASA · Misión Apolo 13',u:'https://www.nasa.gov/mission/apollo-13/'},
  ap13nssdc:{n:'NASA NSSDC · Accidente del Apolo 13',u:'https://nssdc.gsfc.nasa.gov/planetary/lunar/ap13acc.html'},
  ap13bote:{n:'NASA · Apolo 13 y el bote salvavidas',u:'https://www.nasa.gov/?p=69973'},
  radOrion:{n:'NASA · Protección contra la radiación en Orión',u:'https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/'},
  radCiencia:{n:'NASA Science · Radiación en la Luna',u:'https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon'},
  ap8:{n:'NASA · Misión Apolo 8',u:'https://www.nasa.gov/mission/apollo-8/'},
  ap11:{n:'NASA · Misión Apolo 11',u:'https://www.nasa.gov/mission/apollo-11/'},
  lro:{n:'NASA · LRO: temperaturas en la Luna',u:'https://science.nasa.gov/wp-content/uploads/2024/01/lrolitho7temperaturevariation27may2014.pdf'},
  luna:{n:'NASA Science · Datos de la Luna',u:'https://science.nasa.gov/moon/facts/'},
  lcross:{n:'NASA · Misión LCROSS',u:'https://www.nasa.gov/?p=263227'},
  polvo:{n:'NASA NTRS · Abrasión del polvo lunar',u:'https://ntrs.nasa.gov/citations/20100033103'},
  regiones:{n:'NASA NTRS · Panorama de Artemis',u:'https://ntrs.nasa.gov/api/citations/20230012221/downloads/Cohenartemispresentation.pdf'},
  doce:{n:'NASA Marshall · Historia del vehículo lunar',u:'https://www.nasa.gov/centers/marshall/history/this-week-in-nasa-history-first-use-of-the-lunar-roving-vehicle-july-31.html'},
  lrv:{n:'NASA · Primer uso del vehículo lunar',u:'https://www.nasa.gov/?p=430103'},
  lrv2:{n:'NASA · Apolo 15 y el vehículo lunar',u:'https://www.nasa.gov/?p=418985'},
  armor:{n:'NASA NTRS · Concepto ARMOR (regolito)',u:'https://ntrs.nasa.gov/citations/20130009378'},
  fision:{n:'NASA · Energía de fisión en superficie',u:'https://www.nasa.gov/?p=901246'},
  isru:{n:'NASA NTRS · Oxígeno del regolito',u:'https://ntrs.nasa.gov/api/citations/20260004073/downloads/ASCEND2026-Solar%20Carbothermal_rev3.pdf'},
  veggie:{n:'NASA · La tripulación prueba lechuga de Veggie',u:'http://www.nasa.gov/mission_pages/station/research/news/meals_ready_to_eat'},
  iss:{n:'NASA · Datos de la Estación Espacial',u:'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/'},
  marte:{n:'NASA Science · Datos de Marte',u:'https://science.nasa.gov/mars/facts/'},
  moxie:{n:'NASA · MOXIE completa su misión',u:'https://www.nasa.gov/missions/mars-2020-perseverance/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/'},
  sol:{n:'NASA Science · Datos del Sol',u:'https://science.nasa.gov/sun/facts/'},
  agujeros:{n:'NASA Science · Agujeros negros',u:'https://science.nasa.gov/universe/black-holes/'},
  webb:{n:'NASA Science · Telescopio Webb',u:'https://science.nasa.gov/mission/webb/'},
  hubbleWebb:{n:'NASA Science · Hubble frente a Webb',u:'https://science.nasa.gov/mission/hubble/observatory/hubble-vs-webb/'},
  hubble:{n:'NASA Science · Datos de Hubble',u:'https://science.nasa.gov/missions/hubble/a-nasa-refresher-on-hubble-facts-for-the-25th-anniversary'},
  historia:{n:'NASA · Breve historia de la NASA',u:'https://www.nasa.gov/history/SP-4225/documentation/brief-history/history.htm'},
  gagarin:{n:'NASA · Abril de 1961: primer humano en el espacio',u:'https://www.nasa.gov/?p=407852'}
};

/* Roles jugables. home = casilla de inicio en la nave. */
const ROLES = [
  {n:'Comandante',k:'CDTE',c:'#ff7a59',quien:'Cdte. Rivas',d:'Lidera la misión: ignición, órbitas, decisiones y prioridades.',home:[6,8],base:'Decide prioridades y el ritmo del reloj.'},
  {n:'Piloto',k:'PILT',c:'#4fd1ff',quien:'Piloto Vega',d:'Maniobras, encendidos, acoplamiento y descenso.',home:[8,14],base:'Conduce los rovers y las expediciones.'},
  {n:'Especialista',k:'ESPC',c:'#ffd84a',quien:'Dra. Ortiz',d:'Soporte vital, comunicaciones, navegación y ciencia.',home:[18,5],base:'Investiga y dirige expediciones científicas.'},
  {n:'Ingeniero',k:'INGE',c:'#8bd96b',quien:'Ing. Soto',d:'Energía, agua, estructura y computadoras.',home:[52,11],base:'Construye, mejora y repara la base.'}
];

/* Fases. met0/met1 = ventana del reloj de misión (segundos de MET).
   vel = segundos de MET por segundo real (el reloj se acelera así).
   cine = cinemática al terminar la fase. */
const FASES = [
  {n:'Preparación y lanzamiento',corto:'Lanzamiento',met0:-7200,met1:0,vel:40,cine:'despegue'},
  {n:'Ascenso y órbita terrestre',corto:'Órbita terrestre',met0:0,met1:92220,vel:420,cine:'tli'},
  {n:'Inyección translunar',corto:'Inyección translunar',met0:92220,met1:176400,vel:560,cine:null},
  {n:'Tránsito translunar',corto:'Tránsito',met0:176400,met1:388800,vel:760,cine:'caraoculta'},
  {n:'Aproximación y órbita lunar',corto:'Órbita lunar',met0:388800,met1:453600,vel:300,cine:null},
  {n:'Descenso y aterrizaje (simulado)',corto:'Descenso',met0:453600,met1:475200,vel:110,cine:'base'},
  {n:'Montaje de la base',corto:'Base lunar',acto:2}
];

/* Misiones. rol: 0 Cdte, 1 Piloto, 2 Especialista, 3 Ingeniero.
   req = misiones que deben estar hechas antes. reloj = el MET no pasa de
   ese valor hasta completar la misión (coherencia con el plan de vuelo).
   tipo = aspecto del objeto en el mapa; tx,ty = casilla. */
const MISIONES = [
 /* ---------- F0 · Preparación y lanzamiento ---------- */
 {n:'Sondeo GO/NO-GO',rol:0,fase:0,req:[],mg:'gonogo',o:{},tipo:'consola',tx:3,ty:6,
  dato:'En Artemis II, Reid Wiseman fue el comandante; Victor Glover, el piloto; y Christina Koch y Jeremy Hansen (Agencia Espacial Canadiense), los especialistas de misión. El sondeo del juego es una simulación del procedimiento.',f:['a2tripulacion']},
 {n:'Verificación de sistemas',rol:3,fase:0,req:[],mg:'interruptores',o:{titulo:'Activa los sistemas en este orden',items:['ENERGÍA','AVIÓNICA','COMUNICACIONES','SOPORTE VITAL','PROPULSIÓN']},tipo:'breaker',tx:27,ty:2,
  dato:'El Módulo de Servicio Europeo tiene unas 20,000 piezas y componentes, y empresas de 11 países construyeron piezas para Orión.',f:['esm']},
 {n:'Trajes de supervivencia',rol:2,fase:0,req:[],mg:'interruptores',o:{titulo:'Ponte el traje en este orden',items:['TRAJE NARANJA','GUANTES','CASCO','PRUEBA DE PRESIÓN','ARNÉS DEL ASIENTO']},tipo:'trajes',tx:14,ty:22,
  dato:'Los trajes de Orión pueden mantener vivos a los astronautas hasta seis días si la cabina pierde presión.',f:['orion']},
 {n:'Armar el sistema de escape',rol:1,fase:0,req:[1],mg:'memoria',o:{lens:[3,4,5]},tipo:'consola',tx:10,ty:9,
  dato:'El sistema de escape de lanzamiento (LAS) puede activarse en milisegundos para alejar la cápsula de un cohete con problemas. En una prueba en tierra, su motor de aborto dio casi 400,000 libras de empuje durante unos 4 segundos.',f:['las','lasPrueba']},
 {n:'Carga de propelentes',rol:3,fase:0,req:[1],mg:'equilibrio',o:{a:'HIDRÓGENO',b:'OXÍGENO',ba:'+ HIDRÓGENO',bb:'+ OXÍGENO',da:-1,db:-1,necesita:60,titulo:'Mantén los dos tanques en la zona verde'},tipo:'tanques',tx:52,ty:6,
  dato:'Los dos grandes tanques de la etapa central del SLS guardan más de 733,000 galones de propelente súper frío para sus cuatro motores RS-25.',f:['sls']},
 {n:'Cuenta atrás e ignición',rol:0,fase:0,req:[0,2,3,4],mg:'sincronia',o:{aciertos:3,vel:.9,boton:'IGNICIÓN'},tipo:'consola',tx:5,ty:6,reloj:0,
  dato:'Artemis II despegó el 1 de abril de 2026 desde el Centro Espacial Kennedy. El SLS despega con más de 8.8 millones de libras de empuje.',f:['a2mision','a2kit']},
 /* ---------- F1 · Ascenso y órbita terrestre ---------- */
 {n:'Separación de los propulsores',rol:1,fase:1,req:[],mg:'sincronia',o:{aciertos:2,vel:1.3,boton:'SEPARAR'},tipo:'joystick',tx:10,ty:7,reloj:128,
  dato:'Según el plan de vuelo de Artemis II, los propulsores sólidos se separan a los 2 min 8 s del despegue y el sistema de escape se descarta a los 3 min 18 s.',f:['a2kit']},
 {n:'Corte de motores principales',rol:0,fase:1,req:[6],mg:'mantener',o:{etiqueta:'Mantén el empuje hasta el corte de motores'},tipo:'consola',tx:7,ty:6,reloj:486,
  dato:'La etapa central funciona algo más de ocho minutos con más de 2 millones de libras de empuje. En Artemis II, el corte de motores estaba previsto a los 8 min 6 s.',f:['sls','a2kit']},
 {n:'Desplegar paneles solares',rol:3,fase:1,req:[7],mg:'dial',o:{n:3,etiqueta:'Orienta las alas solares'},tipo:'solarctl',tx:55,ty:9,reloj:1200,
  dato:'Fuera de la atmósfera se descartan los paneles que cubren el módulo de servicio y las cuatro alas solares se despliegan hasta unos 62 pies (19 m). En Artemis II, el despliegue estaba previsto a los 20 minutos.',f:['orionComp','a2kit']},
 {n:'Soporte vital cerca de la Tierra',rol:2,fase:1,req:[7],mg:'equilibrio',o:{a:'OXÍGENO',b:'CO₂',ba:'+ OXÍGENO',bb:'FILTRAR CO₂',da:-1,db:1,necesita:60},tipo:'tanque',tx:14,ty:4,
  dato:'En las primeras horas de Artemis II se comprobó que el soporte vital de Orión generaba aire respirable mientras la nave seguía cerca de la Tierra.',f:['a2kit']},
 {n:'Elevar la órbita',rol:0,fase:1,req:[8],mg:'encendido',o:{dv:60,tol:8,rondas:1,etiqueta:'Encendido de elevación del apogeo'},tipo:'timon',tx:9,ty:6,reloj:6477,
  dato:'Una maniobra llevó a Orión a una órbita terrestre alta de unas 44,525 × 115 millas (unos 71,650 × 185 km), donde la tripulación hizo una revisión de cerca de 23 horas.',f:['a2kit']},
 {n:'Aproximación a la etapa superior',rol:1,fase:1,req:[10],mg:'alinear',o:{fondo:'etapa',necesita:5,vel:1,etiqueta:'Mantén el retículo sobre la etapa superior'},tipo:'joystick',tx:10,ty:15,reloj:16500,
  dato:'Orión se separó de la etapa superior a las 3 h 24 min de misión, y la tripulación practicó maniobras de aproximación usándola como blanco hasta cerca de las 4 h 35 min.',f:['a2kit']},
 /* ---------- F2 · Inyección translunar ---------- */
 {n:'Encendido de inyección translunar',rol:1,fase:2,req:[9,11],mg:'encendido',o:{dv:100,tol:6,rondas:2,etiqueta:'Encendido TLI: suelta en la zona verde'},tipo:'joystick',tx:4,ty:17,reloj:92220,
  dato:'En Artemis II, el encendido de inyección translunar lo hizo el motor principal de Orión, al día 1 y 1 h 37 min de misión. Ese motor da 6,000 libras de empuje.',f:['a2kit','esm']},
 {n:'Navegación con rastreadores estelares',rol:2,fase:2,req:[12],mg:'estrellas',o:{n:5},tipo:'starcam',tx:26,ty:5,
  dato:'Orión lleva dos rastreadores estelares: cámaras sensibles, hechas en Alemania, que fotografían las estrellas y las comparan con un mapa interno para saber hacia dónde apunta la nave.',f:['navegacion']},
 {n:'Enlace con la Red del Espacio Profundo',rol:2,fase:2,req:[12],mg:'dsn',o:{rondas:3},tipo:'antena',tx:39,ty:2,
  dato:'La Red del Espacio Profundo tiene complejos en Goldstone (California), cerca de Madrid (España) y cerca de Canberra (Australia). Cuando una nave se oculta tras el horizonte de una estación, otra puede recoger la señal.',f:['dsn']},
 {n:'Primera corrección de trayectoria',rol:0,fase:2,req:[13],mg:'dial',o:{n:3,etiqueta:'Ajusta el ángulo de corrección'},tipo:'rueda',tx:2,ty:10,reloj:173220,
  dato:'El plan de Artemis II incluía tres correcciones de trayectoria en la ida, en los días 2, 3 y 4 de misión.',f:['a2kit']},
 {n:'Prueba del retardo de radio',rol:3,fase:2,req:[14],mg:'codigo',o:{digitos:5,retardo:true},tipo:'servidor',tx:44,ty:2,
  dato:'Una señal de radio tarda unos 1.3 segundos en ir de la Luna a la Tierra; por eso, entre una pregunta y su respuesta pasan al menos unos 2.6 segundos.',f:['alsj']},
 /* ---------- F3 · Tránsito translunar ---------- */
 {n:'Ejercicio diario',rol:2,fase:3,req:[],mg:'toques',o:{n:28,seg:8,etiqueta:'Pedalea sin parar',boton:'PEDALEAR'},tipo:'ejercicio',tx:21,ty:16,
  dato:'En el espacio, los huesos que soportan peso pierden de media entre el 1 % y el 1.5 % de su densidad mineral al mes. El ejercicio aeróbico y de fuerza ayuda a proteger corazón, huesos y músculos.',f:['cuerpo']},
 {n:'Gestión del agua',rol:3,fase:3,req:[],mg:'tuberias',o:{modo:'agua'},tipo:'tuberias',tx:21,ty:2,
  dato:'El módulo de servicio aporta agua, oxígeno y nitrógeno a la tripulación. En la Estación Espacial, el reciclaje ya recupera el 98 % del agua, incluida la que se obtiene de la orina y del sudor.',f:['esm','agua98']},
 {n:'Filtro de CO₂',rol:2,fase:3,req:[],mg:'equilibrio',o:{a:'CO₂',b:'HUMEDAD',ba:'FILTRAR CO₂',bb:'SECAR AIRE',da:1,db:1,necesita:60},tipo:'filtro',tx:15,ty:2,
  dato:'En la Estación Espacial, el CO₂ se retira del aire con tamices moleculares, materiales que atrapan los gases según el tamaño de sus moléculas.',f:['eclss']},
 {n:'La lección del Apolo 13',rol:3,fase:3,req:[19],mg:'tuberias',o:{modo:'buzon'},tipo:'buzon',tx:14,ty:7,
  dato:'Unas 56 horas después del despegue explotó el tanque de oxígeno n.º 2 del Apolo 13, y la tripulación usó el módulo lunar como bote salvavidas. El 14 de abril de 1970 instalaron un «buzón» para purgar el CO₂ del módulo lunar.',f:['ap13nssdc','ap13bote','ap13']},
 {n:'Refugio contra tormenta solar',rol:0,fase:3,req:[],mg:'refugio',o:{n:6},tipo:'refugio',tx:14,ty:19,
  dato:'Los sensores HERA de Orión avisan si hay que refugiarse de la radiación. Entonces la tripulación se coloca en el centro del módulo y arma un refugio con las bolsas de almacenamiento, poniendo las más densas donde hay menos blindaje.',f:['radOrion']},
 {n:'Reparar el ventilador',rol:3,fase:3,req:[18],mg:'cables',o:{},tipo:'ventilador',tx:22,ty:7,sim:true,
  dato:'El Módulo de Servicio Europeo da a la tripulación aire, agua y una temperatura cómoda, además de electricidad con sus cuatro alas solares. La avería del ventilador es una simulación del juego.',f:['esaEsm']},
 {n:'Hito histórico: Apolo 8',rol:0,fase:3,req:[],mg:'interruptores',o:{titulo:'Ordena la misión Apolo 8 en el tiempo',items:['21 DIC: DESPEGUE','24 DIC: ÓRBITA LUNAR','24 DIC: FOTO EARTHRISE','27 DIC: AMERIZAJE']},tipo:'archivo',tx:2,ty:16,
  dato:'Apolo 8 (21–27 de diciembre de 1968) convirtió a Frank Borman, Jim Lovell y Bill Anders en los primeros humanos en orbitar la Luna. Anders tomó la foto «Earthrise» el 24 de diciembre de 1968.',f:['ap8']},
 /* ---------- F4 · Aproximación y órbita lunar ---------- */
 {n:'Paso por la cara oculta',rol:2,fase:4,req:[],mg:'memoria',o:{lens:[4,5,6]},tipo:'consola',tx:38,ty:5,reloj:430000,
  dato:'Cuando Orión pasa detrás de la Luna se pierde el contacto con la Tierra. Para Artemis II se calculó una pérdida de señal de 30 a 50 minutos, según la hora del lanzamiento.',f:['a2kit']},
 {n:'Inserción en órbita lunar',rol:1,fase:4,req:[24],mg:'encendido',o:{dv:80,tol:7,rondas:2,etiqueta:'Frena para entrar en órbita'},tipo:'joystick',tx:6,ty:17,reloj:436980,sim:true,
  dato:'Simulación: Artemis II no entró en órbita lunar. Siguió una trayectoria de retorno libre: tras el sobrevuelo, la gravedad de la Tierra y la Luna la devolvió a casa sin usar el motor.',f:['a2kit']},
 {n:'Mapeo con datos de LRO',rol:2,fase:4,req:[25],mg:'objetivos',o:{n:5,etiqueta:'Toca cada cráter para mapearlo',clase:'crater'},tipo:'camara',tx:33,ty:2,
  dato:'El Lunar Reconnaissance Orbiter (LRO) da una vuelta a la Luna cada 120 minutos. Su instrumento Diviner midió unos −250 °C (25 K) en el cráter Hermite, una de las temperaturas más frías medidas en el sistema solar.',f:['lro']},
 {n:'Sobrevuelo récord',rol:1,fase:4,req:[24],mg:'alinear',o:{fondo:'luna',necesita:6,vel:1.4,etiqueta:'Mantén el retículo en el borde lunar'},tipo:'joystick',tx:8,ty:17,
  dato:'El 6 de abril de 2026, la tripulación de Artemis II superó el récord del Apolo 13 (248,655 millas) y llegó a unas 252,756 millas (406,771 km) de la Tierra. Su máximo acercamiento a la superficie lunar fue de unas 4,067 millas (6,545 km).',f:['a2record']},
 {n:'Elegir sitio cerca del polo sur',rol:0,fase:4,req:[26],mg:'sitio',o:{modo:'polo'},tipo:'mapa',tx:2,ty:13,
  dato:'La NASA identificó nueve regiones candidatas de alunizaje cerca del polo sur lunar. Allí hay regiones en sombra permanente con altas concentraciones de hielo de agua.',f:['a4','luna']},
 {n:'Hielo en Cabeus: LCROSS',rol:3,fase:4,req:[26],mg:'sincronia',o:{aciertos:3,vel:1.1,boton:'IMPACTO'},tipo:'pantalla',tx:34,ty:5,
  dato:'El 9 de octubre de 2009, la misión LCROSS impactó en el cráter Cabeus, una región en sombra permanente cerca del polo sur. El 13 de noviembre de 2009, la NASA confirmó que había encontrado agua.',f:['lcross']},
 /* ---------- F5 · Descenso y aterrizaje (simulado) ---------- */
 {n:'Acoplamiento con el módulo de aterrizaje',rol:1,fase:5,req:[],mg:'acople',o:{},tipo:'puerto',tx:34,ty:19,sim:true,
  dato:'Artemis III (2027) probará en órbita terrestre el encuentro y el acoplamiento de Orión con uno o ambos módulos de aterrizaje comerciales, antes del alunizaje de Artemis IV.',f:['a3']},
 {n:'Revisión del módulo de descenso',rol:3,fase:5,req:[30],mg:'interruptores',o:{titulo:'Revisa el módulo en este orden',items:['BATERÍAS','RADAR','MOTOR DE DESCENSO','PATAS','ESCOTILLA']},tipo:'breaker',tx:38,ty:18,sim:true,
  dato:'En Artemis IV, dos astronautas bajarán a la superficie y pasarán cerca de una semana junto al polo sur antes de volver a la órbita lunar. SpaceX y Blue Origin trabajan para poder llevarlos en 2028.',f:['a4det','acelera']},
 {n:'Trajes y polvo lunar',rol:2,fase:5,req:[30],mg:'objetivos',o:{n:6,etiqueta:'Limpia el polvo del visor',clase:'polvo'},tipo:'trajes',tx:26,ty:22,sim:true,
  dato:'En las misiones Apolo, el polvo lunar, muy abrasivo, rayó visores y provocó fugas en los sellos de presión de los trajes.',f:['polvo']},
 {n:'Evitar peligros del terreno',rol:1,fase:5,req:[31],mg:'sitio',o:{modo:'peligros'},tipo:'radar',tx:40,ty:22,sim:true,
  dato:'Para elegir dónde alunizar, Artemis busca cercanía al polo sur, pendientes suaves para aterrizar y caminar, y vista constante de la Tierra para comunicarse.',f:['regiones']},
 {n:'Descenso motorizado',rol:1,fase:5,req:[33],mg:'descenso',o:{},tipo:'joystick',tx:43,ty:22,reloj:470000,sim:true,
  dato:'El Apolo 11 alunizó el 20 de julio de 1969 con el módulo lunar Eagle. Neil Armstrong y Buzz Aldrin pasaron unas 22 horas en la Luna mientras Michael Collins seguía en órbita.',f:['ap11']},
 {n:'Primer paso en la Luna',rol:0,fase:5,req:[32,34],mg:'eva',o:{modo:'luna'},tipo:'escotilla',tx:30,ty:22,reloj:475000,sim:true,
  dato:'La gravedad en la superficie de la Luna es una sexta parte de la terrestre. Entre 1969 y 1972, doce astronautas caminaron sobre la Luna.',f:['luna','doce']},
 /* ---------- F6 · Montaje de la base (acto 2) ---------- */
 {n:'Paneles solares en la superficie',rol:3,fase:6,req:[],mg:'dial',o:{n:3,etiqueta:'Inclina los paneles hacia el Sol bajo del polo'},sala:'energia',
  dato:'En la Luna, el día dura unos 14 días terrestres y la noche otros 14, así que una base solar necesita guardar energía para la noche.',f:['lro']},
 {n:'Cubrir el hábitat con regolito',rol:1,fase:6,req:[36],mg:'toques',o:{n:30,seg:9,etiqueta:'Echa regolito con la pala del rover',boton:'PALEAR'},sala:'esclusa',
  dato:'Un estudio de la NASA propone cubrir los módulos con unos 3 m de regolito: ese espesor protege de los rayos cósmicos y de los protones solares, incluso durante las erupciones, y también de los micrometeoritos.',f:['armor']},
 {n:'Buscar hielo con el rover',rol:2,fase:6,req:[36],mg:'objetivos',o:{n:5,etiqueta:'Toca las señales de hielo del radar',clase:'hielo'},sala:'esclusa',
  dato:'En 2008, la sonda Chandrayaan-1 hizo la primera detección definitiva de agua en la Luna (moléculas de hidroxilo). En octubre de 2020, el observatorio SOFIA confirmó moléculas de agua en el cráter Clavius, que recibe luz solar.',f:['luna']},
 {n:'Plan de energía para la noche',rol:0,fase:6,req:[36],mg:'equilibrio',o:{a:'BATERÍAS',b:'CONSUMO',ba:'+ CARGA',bb:'− CONSUMO',da:-1,db:1,necesita:60},sala:'control',
  dato:'Para no depender solo del Sol, la NASA quiere poner un reactor de fisión en la Luna hacia el primer trimestre del año fiscal 2030, con al menos 100 kilovatios de potencia eléctrica.',f:['fision']}
];
MISIONES.forEach((m,i)=>{m.id=i;});
const N_MISIONES = MISIONES.length;
const N_MISIONES_NAVE = MISIONES.filter(m=>m.fase<6).length;

/* ---------- Mapa de la nave (casillas de 16 px) ---------- */
const NAVE_W = 58, NAVE_H = 25, TILE = 16;
const SALAS_NAVE = [
  {n:'Cabina de mando',x:2,y:6,w:9,h:12,c:'#2a2758'},
  {n:'Soporte vital',x:14,y:2,w:9,h:7,c:'#203e52'},
  {n:'Habitáculo',x:14,y:16,w:9,h:7,c:'#3d2d5c'},
  {n:'Laboratorio',x:26,y:2,w:9,h:7,c:'#253f5c'},
  {n:'Esclusa y acoplamiento',x:26,y:16,w:9,h:7,c:'#4b2d44'},
  {n:'Comunicaciones',x:38,y:2,w:8,h:7,c:'#2b3a62'},
  {n:'Módulo de descenso',x:38,y:16,w:8,h:7,c:'#3f3a50'},
  {n:'Módulo de servicio',x:49,y:6,w:7,h:12,c:'#383848'}
];
const PASILLOS_NAVE = [[11,11,38,2],[17,9,2,7],[29,9,2,7],[41,9,2,7]];

/* Objetos de la nave que no son misiones. Los datos llevan su fuente.
   ev = este objeto sirve para resolver ese tipo de evento. */
const MUEBLES_NAVE = [
  {tipo:'asiento',tx:5,ty:10,n:'Asiento de tripulación',dato:'En Artemis II, cuatro astronautas viajaron alrededor de la Luna dentro de Orión.',f:['orionPagina']},
  {tipo:'asiento',tx:7,ty:10,n:'Asiento de tripulación',dato:'En Artemis II, el comandante fue Reid Wiseman y el piloto, Victor Glover.',f:['a2tripulacion']},
  {tipo:'asiento',tx:5,ty:13,n:'Asiento de tripulación',dato:'La tripulación de Artemis II incluyó a la primera mujer, la primera persona de color y el primer canadiense en una misión lunar.',f:['a2tripulacion']},
  {tipo:'asiento',tx:7,ty:13,n:'Asiento de tripulación',dato:'Christina Koch tiene el récord del vuelo espacial individual más largo de una mujer: 328 días.',f:['a2tripulacion']},
  {tipo:'ventana',tx:2,ty:8,n:'Ventana de la cabina',ventana:true},
  {tipo:'paracaidas',tx:10,ty:17,n:'Compartimento de paracaídas',dato:'Al volver, los paracaídas de frenado de Orión bajan la velocidad a 307 mph a 25,000 pies, y los principales la reducen de unas 130 a 17 mph para amerizar.',f:['a2kit']},
  {tipo:'timon',tx:2,ty:6,n:'Puesto de pilotaje',ev:'desvio',dato:'En Artemis I, Orión navegó con 3 unidades inerciales, 2 receptores GPS, 2 rastreadores estelares y 1 cámara de navegación óptica.',f:['opnav']},
  {tipo:'o2',tx:14,ty:2,n:'Tanque de oxígeno',dato:'El sistema de almacenamiento del módulo de servicio suministra agua potable, nitrógeno y oxígeno al módulo de tripulación.',f:['esm2']},
  {tipo:'ventana',tx:18,ty:2,n:'Ventana del soporte vital',ventana:true},
  {tipo:'filtro_aire',tx:20,ty:8,n:'Filtro de aire',ev:'co2',dato:'En la Estación Espacial, el oxígeno se obtiene por electrólisis: la electricidad de los paneles solares separa el agua en hidrógeno y oxígeno.',f:['eclss2']},
  {tipo:'ventilador',tx:22,ty:4,n:'Ventilador de cabina',ev:'ventilador',dato:'El soporte vital de la Estación Espacial tiene tres partes clave: recuperación de agua, revitalización del aire y generación de oxígeno.',f:['eclss']},
  {tipo:'litera',tx:15,ty:16,n:'Litera',dato:'En la Estación Espacial, las tripulaciones suelen quedarse entre seis y doce meses.',f:['cuerpo']},
  {tipo:'litera',tx:14,ty:16,n:'Litera',dato:'Scott Kelly y Christina Koch fueron los primeros astronautas estadounidenses en pasar casi un año en el espacio.',f:['cuerpo']},
  {tipo:'cocina',tx:18,ty:22,n:'Cocina y agua',accion:'agua',dato:'En agosto de 2015, la tripulación de la Estación Espacial probó por primera vez, de forma oficial, lechuga cultivada en el sistema Veggie.',f:['veggie']},
  {tipo:'inodoro',tx:22,ty:22,n:'Inodoro espacial',dato:'La guía de referencia de Orión menciona un inodoro compacto a bordo.',f:['orion']},
  {tipo:'casillero',tx:22,ty:19,n:'Casillero de suministros',dato:'Orión lleva comida y agua para toda la misión.',f:['orion']},
  {tipo:'mesa',tx:30,ty:2,n:'Mesa de laboratorio',dato:'La cámara de navegación óptica de Orión toma imágenes de la Luna y de la Tierra para ayudar a guiar la nave.',f:['navegacion']},
  {tipo:'ventana',tx:34,ty:8,n:'Ventana del laboratorio',ventana:true},
  {tipo:'o2',tx:27,ty:16,n:'Tanque de la esclusa',dato:'El Módulo de Servicio Europeo aporta los consumibles para la vida a bordo: agua, oxígeno y nitrógeno.',f:['esm']},
  {tipo:'casco',tx:33,ty:16,n:'Panel del casco',ev:'micrometeoroide',dato:'Un estudio de la NASA indica que una capa de regolito de unos 3 m también protegería un hábitat lunar de los micrometeoritos.',f:['armor']},
  {tipo:'escudo',tx:33,ty:22,n:'Maqueta del escudo térmico',dato:'El escudo térmico de Orión mide 16.5 pies (5 m) y es el mayor escudo ablativo de su clase. Soporta cerca de 5,000 °F y su superficie está hecha con 186 bloques de Avcoat.',f:['escudo','avcoat']},
  {tipo:'ventana',tx:45,ty:5,n:'Ventana de comunicaciones',ventana:true},
  {tipo:'asiento',tx:45,ty:18,n:'Asiento del módulo de descenso',dato:'La NASA trabaja con dos empresas estadounidenses para desarrollar los módulos de aterrizaje tripulados.',f:['a3']},
  {tipo:'asiento',tx:45,ty:20,n:'Asiento del módulo de descenso',dato:'Antes del alunizaje de Artemis IV, Artemis III probará los módulos de aterrizaje en órbita terrestre.',f:['a3']},
  {tipo:'o2',tx:49,ty:7,n:'Tanque del módulo de servicio',dato:'Unos 1,000 sensores registraron datos del módulo de servicio durante sus pruebas de vibración.',f:['esm']},
  {tipo:'bateria',tx:55,ty:14,n:'Baterías principales',dato:'El sistema eléctrico del módulo de servicio gestiona la energía de las cuatro alas solares y carga las baterías principales del módulo de tripulación.',f:['esm2']},
  {tipo:'motor',tx:51,ty:17,n:'Motores auxiliares',dato:'El Módulo de Servicio Europeo tiene 33 motores en total.',f:['esm']},
  {tipo:'motor',tx:54,ty:17,n:'Motor principal',dato:'El motor principal del módulo de servicio da 6,000 libras de empuje y puede girar de lado a lado y de arriba abajo.',f:['esm']}
];
/* Consola de la asesora en la nave. */
const ASESORA_NAVE = {tipo:'asesora',tx:42,ty:2,n:'Consola de la Dra. Solís (Control de Misión / Archivo)'};

/* Eventos aleatorios del trayecto. desde = fase mínima. rol que resuelve.
   El minijuego es corto. dato = lección real que se muestra al resolverlo. */
const EVENTOS_NAVE = [
  {id:'co2',n:'Alarma de CO₂',rol:2,desde:1,mg:'equilibrio',o:{a:'CO₂',b:'FLUJO DE AIRE',ba:'FILTRAR CO₂',bb:'+ VENTILACIÓN',da:1,db:-1,necesita:40},
   aviso:'El CO₂ de la cabina sube. La Especialista debe ir al filtro de aire.',dato:'En el Apolo 13, el CO₂ se acumuló en el módulo lunar y la tripulación instaló un «buzón» para purgarlo.',f:['ap13']},
  {id:'ventilador',n:'Fallo de un ventilador',rol:3,desde:1,mg:'cables',o:{},
   aviso:'Un ventilador se detuvo: sube la temperatura. El Ingeniero debe repararlo en Soporte vital.',dato:'El soporte vital de la Estación Espacial combina recuperación de agua, revitalización del aire y generación de oxígeno.',f:['eclss']},
  {id:'tormenta',n:'Tormenta solar',rol:0,desde:2,mg:'refugio',o:{n:5},
   aviso:'¡Partículas solares! El Comandante debe ordenar el refugio en el Habitáculo.',dato:'Las tormentas de partículas solares son difíciles de predecir. En Orión, la tripulación usa las bolsas de almacenamiento para crear un refugio denso.',f:['radCiencia']},
  {id:'micrometeoroide',n:'Impacto de micrometeoroide',rol:3,desde:2,mg:'objetivos',o:{n:4,etiqueta:'Sella las microfugas',clase:'fuga'},
   aviso:'Un micrometeoroide dañó un panel del casco: hay una fuga lenta. El Ingeniero debe sellarla en la Esclusa.',dato:'Estudios de la NASA señalan que, en la Luna, una capa de regolito también protegería un hábitat de los micrometeoritos.',f:['armor']},
  {id:'desvio',n:'Desvío de trayectoria',rol:1,desde:2,mg:'dial',o:{n:2,etiqueta:'Corrige el rumbo'},
   aviso:'La navegación detecta un pequeño desvío. El Piloto debe corregirlo en el puesto de pilotaje.',dato:'Además de las tres correcciones de ida, el plan de Artemis II incluía tres correcciones de trayectoria en la vuelta.',f:['a2kit']}
];

/* Ciclo diario de la tripulación (hora del día a partir del MET). */
const CICLO_TRIPULACION = [
  {de:0,a:7,id:'sueno',n:'Sueño'},
  {de:7,a:8,id:'comida',n:'Desayuno'},
  {de:8,a:12,id:'trabajo',n:'Trabajo'},
  {de:12,a:13,id:'comida',n:'Comida'},
  {de:13,a:16,id:'trabajo',n:'Trabajo'},
  {de:16,a:18,id:'ejercicio',n:'Ejercicio'},
  {de:18,a:19,id:'comida',n:'Cena'},
  {de:19,a:23,id:'trabajo',n:'Tiempo libre'},
  {de:23,a:24,id:'sueno',n:'Sueño'}
];
