/* =====================================================================
   datos_base.js — DATOS del acto 2 (base lunar en corte, estilo Fallout
   Shelter). Solo datos, sin lógica. Las cifras de producción y consumo son
   de juego (simuladas); los «dato» de cada elemento son reales y llevan
   fuente.
   ===================================================================== */

/* Rejilla de la base: 12 columnas; planta 0 = superficie; plantas 1..8
   bajo el regolito. El ascensor ocupa la columna 5. */
const BASE_COLS = 12, BASE_PLANTAS = 8, BASE_ASCENSOR = 5;
/* Día lunar simplificado: unos 14 días terrestres de luz y 14 de noche
   (LRO). 1 hora de juego = 1 segundo real a velocidad ×1. */
const DIA_LUNAR_H = 708, DIA_LUZ_H = 354;

/* Tipos de sala. ancho en celdas; costo en materiales; trab = puestos de
   trabajo; rol = rol con bonificación ×1.5; prod/cons por hora a nivel 1
   con todos los puestos ocupados (valores de juego). */
const TIPOS_SALA = {
  esclusa:{n:'Esclusa y garaje del rover',ancho:3,costo:0,trab:1,rol:1,superficie:true,unico:true,cons:{energia:.4},c:'#5a4a6a',
    desc:'Entrada a la base y salida del rover. Sin esclusa no hay expediciones.',dato:'El vehículo lunar del Apolo 15, usado por primera vez el 31 de julio de 1971, era eléctrico y ligero.',f:['lrv']},
  habitaculo:{n:'Habitáculos',ancho:2,costo:120,trab:0,camas:4,cons:{energia:.5},c:'#4a3a6e',
    desc:'Camas para 4 tripulantes por nivel. Sin camas no llegan tripulantes nuevos.',dato:'En la Estación Espacial, las tripulaciones suelen quedarse entre seis y doce meses.',f:['cuerpo']},
  invernadero:{n:'Cocina e invernadero',ancho:3,costo:200,trab:2,rol:2,prod:{alimentos:1.1},cons:{energia:1.8,agua:.35},c:'#2f5a3a',
    desc:'Cultivo con luz LED y cocina. Produce alimentos; gasta agua y energía.',dato:'Veggie usa luces LED rojas, azules y verdes; en 2015 la tripulación de la Estación Espacial comió lechuga cultivada en él.',f:['veggie']},
  energia:{n:'Planta de energía',ancho:2,costo:180,trab:2,rol:3,prod:{energia:9},bateria:350,c:'#5a5226',
    desc:'Gestiona los paneles solares de la superficie y las baterías. De noche no hay luz solar.',dato:'En la Luna, el día dura unos 14 días terrestres y la noche otros 14.',f:['lro']},
  taller:{n:'Taller de anclaje y estructura',ancho:2,costo:150,trab:2,rol:3,prod:{materiales:3,integridad:.7},cons:{energia:1.1},c:'#5a3f2a',
    desc:'Procesa regolito en materiales, sella fugas y repara la estructura.',dato:'En las misiones Apolo, el polvo lunar rayó visores y causó fugas en los sellos de los trajes.',f:['polvo']},
  agua_o2:{n:'Planta de agua y oxígeno',ancho:3,costo:220,trab:2,rol:2,prod:{agua:1.4,o2:.55,depura:.18},cons:{energia:2.4,hielo:1.4},c:'#2a4f66',
    desc:'Funde hielo para obtener agua, separa oxígeno por electrólisis y depura el CO₂.',dato:'En la Estación Espacial, la electricidad de los paneles separa el agua en hidrógeno y oxígeno: es la electrólisis.',f:['eclss2']},
  laboratorio:{n:'Laboratorio',ancho:2,costo:200,trab:2,rol:2,prod:{ciencia:1},cons:{energia:1.4},c:'#2c3f6a',
    desc:'Genera puntos de ciencia para investigar mejoras.',dato:'El regolito lunar tiene alrededor de un 45 % de oxígeno en masa.',f:['isru']},
  enfermeria:{n:'Enfermería',ancho:2,costo:160,trab:1,rol:2,prod:{curacion:3},cons:{energia:.9},c:'#6a2f3a',
    desc:'Cura a los enfermos y recupera la salud de la tripulación.',dato:'En microgravedad, los huesos que soportan peso pierden de media entre el 1 % y el 1.5 % de densidad mineral al mes.',f:['cuerpo']},
  control:{n:'Sala de control y comunicaciones',ancho:2,costo:180,trab:2,rol:0,prod:{ciencia:.3,moral:.2},cons:{energia:1},unico:true,c:'#3a3a72',
    desc:'Enlace con la Tierra y consola de la Dra. Solís. Mejora la moral y da algo de ciencia.',dato:'Desde la Luna, la radio tarda unos 1.3 segundos en llegar a la Tierra.',f:['alsj']},
  almacen:{n:'Almacén',ancho:2,costo:100,trab:0,almacen:250,cons:{energia:.15},c:'#4a4a52',
    desc:'Aumenta la capacidad de alimentos, agua, oxígeno, hielo y materiales.',dato:'Orión lleva comida y agua para toda su misión.',f:['orion']},
  gimnasio:{n:'Gimnasio',ancho:2,costo:120,trab:1,rol:1,prod:{salud:1.2},cons:{energia:.5},c:'#3a5a5a',
    desc:'El ejercicio protege huesos, músculos y corazón.',dato:'El ejercicio aeróbico y de fuerza ayuda a proteger corazón, huesos y músculos en el espacio.',f:['cuerpo']},
  refugio:{n:'Refugio contra la radiación',ancho:2,costo:140,trab:0,plazas:4,cons:{energia:.2},c:'#34503e',
    desc:'Sala blindada para 4 personas por nivel. Con tormenta solar, el refugio manda aquí primero a la tripulación.',dato:'Un estudio de la NASA calculó que unos 3 m de regolito sobre un hábitat lunar protegerían de los protones de las tormentas solares.',f:['armor']},
  ocio:{n:'Zona de ocio',ancho:2,costo:100,trab:1,prod:{moral:.6},cons:{energia:.4},c:'#5a3a5e',
    desc:'Pantallas, juegos y una ventana a la Tierra. Sube la moral.',dato:'La NASA cuenta el aislamiento y el encierro entre los cinco peligros de los vuelos espaciales.',f:['cuerpo']}
};
/* Orden del menú de construcción. */
const MENU_SALAS = ['habitaculo','invernadero','energia','agua_o2','taller','laboratorio','enfermeria','refugio','almacen','gimnasio','ocio','control'];
/* Multiplicador de producción por nivel y coste de mejora (× costo). */
const NIVEL_MULT = [0,1,1.6,2.2], NIVEL_COSTE = [0,0,1.2,2];
const COSTE_EXCAVAR = 160;

/* Consumo por tripulante y hora (juego). */
const CONSUMO_PERSONA = {o2:.035,agua:.12,alimentos:.07,co2:.02};

/* Estado inicial de la base tras el alunizaje. */
const BASE_INICIAL = {
  hora:40, plantas:3,
  recursos:{energia:260,alimentos:150,agua:200,o2:80,co2:.3,materiales:600,hielo:0,ciencia:10,integridad:100,temp:21,moral:75},
  salas:[
    {tipo:'esclusa',planta:0,col:6,nivel:1},
    {tipo:'habitaculo',planta:1,col:0,nivel:1},
    {tipo:'energia',planta:1,col:6,nivel:1},
    {tipo:'control',planta:2,col:0,nivel:1}
  ]
};

/* Nombres de tripulantes nuevos (ficticios). */
const NOMBRES_TRIPULANTES = ['Ana Lucero','Luis Peña','Sofía Durán','Mateo Rosario','Valentina Cruz','Diego Almonte','Camila Reyes','Javier Núñez','Lucía Batista','Andrés Mejía','Elena Castillo','Tomás Guzmán','Marta Jiménez','Rafael Polanco','Paula Santana','Bruno Tavárez','Inés Méndez','Hugo Abreu','Carmen Ureña','Pablo Féliz'];

/* Incidentes. rol = rol con bonificación ×2 para resolverlo; trabajo =
   puntos de trabajo necesarios (cada tripulante en la sala aporta 1/h). */
const INCIDENTES_BASE = {
  fuga:{n:'Fuga de aire',icono:'💨',rol:3,trabajo:10,prob:.010,desc:'Se escapa oxígeno. Lleva tripulantes a la sala, mejor un Ingeniero.',
    dato:'En la Estación Espacial, el soporte vital combina recuperación de agua, revitalización del aire y generación de oxígeno.',f:['eclss']},
  electrico:{n:'Fallo eléctrico',icono:'⚡',rol:3,trabajo:8,prob:.010,desc:'La sala se apaga hasta repararla.',
    dato:'El sistema eléctrico del módulo de servicio de Orión gestiona la energía de las alas solares y carga las baterías.',f:['esm2']},
  incendio:{n:'Incendio',icono:'🔥',rol:null,trabajo:7,prob:.006,desc:'Daña la sala y puede extenderse. Cualquiera puede apagarlo.',
    dato:'El oxígeno alimenta el fuego, así que los incendios en un hábitat cerrado son muy peligrosos (simulación).',f:[] ,sim:true},
  enfermedad:{n:'Tripulante enfermo',icono:'🤒',rol:2,trabajo:0,prob:.002,desc:'Asigna al enfermo a la enfermería.',
    dato:'La NASA agrupa los riesgos del espacio en cinco peligros: radiación, aislamiento, distancia, gravedad y entornos hostiles.',f:['cuerpo']},
  impacto:{n:'Impacto de micrometeorito',icono:'☄️',rol:3,trabajo:9,prob:.003,desc:'Daña la estructura de la superficie o de la planta más alta.',
    dato:'Un estudio de la NASA indica que unos 3 m de regolito protegerían un hábitat de los micrometeoritos.',f:['armor']},
  tormenta:{n:'Tormenta solar',icono:'☀️',rol:0,trabajo:0,prob:.0015,dur:30,desc:'Radiación muy alta. El Comandante debe ordenar el refugio en las plantas profundas.',
    dato:'Las tormentas de partículas solares son difíciles de predecir.',f:['radCiencia']},
  apagon:{n:'Apagón nocturno',icono:'🌑',rol:3,trabajo:0,prob:0,desc:'Sin baterías durante la noche: todo funciona al mínimo.',
    dato:'La NASA quiere un reactor de fisión en la Luna para no depender solo del Sol.',f:['fision']}
};

/* Investigaciones (se pagan con puntos de ciencia). */
const INVESTIGACIONES = [
  {id:'agua98',n:'Reciclaje de agua al 98 %',costo:40,efecto:'El consumo de agua de la tripulación baja a la mitad.',dato:'La Estación Espacial ya recupera el 98 % del agua gracias a su procesador de salmuera.',f:['agua98']},
  {id:'led',n:'Cultivo con luces LED',costo:45,efecto:'El invernadero produce un 50 % más.',dato:'Veggie cultiva con luces LED rojas, azules y verdes.',f:['veggie']},
  {id:'electrolisis',n:'Electrólisis mejorada',costo:55,efecto:'La planta de agua y oxígeno produce un 50 % más de O₂.',dato:'El oxígeno de la Estación Espacial se obtiene separando el agua por electrólisis.',f:['eclss2']},
  {id:'polvo',n:'Mitigación del polvo',costo:55,efecto:'Las averías y fugas ocurren la mitad de veces.',dato:'En las misiones Apolo, el polvo lunar rayó visores y provocó fugas en los sellos de los trajes.',f:['polvo']},
  {id:'rover',n:'Rover mejorado',costo:60,efecto:'Las expediciones duran menos y son la mitad de arriesgadas.',dato:'En el Apolo 15, el vehículo lunar recorrió algo más de 17 millas.',f:['lrv2']},
  {id:'blindaje',n:'Blindaje de regolito',costo:70,efecto:'La radiación y los impactos dañan mucho menos.',dato:'Unos 3 m de regolito protegen de rayos cósmicos, protones solares y micrometeoritos.',f:['armor']},
  {id:'isru',n:'Oxígeno del regolito (ISRU)',costo:85,efecto:'La planta de agua y oxígeno obtiene O₂ del regolito sin gastar agua.',dato:'El regolito lunar tiene alrededor de un 45 % de oxígeno en masa.',f:['isru']},
  {id:'reactor',n:'Reactor de fisión de superficie',costo:120,efecto:'Da energía constante, de día y de noche.',dato:'La NASA busca un reactor de al menos 100 kW para la superficie lunar hacia 2030.',f:['fision']}
];

/* Expediciones en rover desde la esclusa. dur en horas; riesgo 0..1;
   botín [mín, máx]. */
const EXPEDICIONES = [
  {id:'sombra',n:'Cráter en sombra permanente',dur:20,riesgo:.28,botin:{hielo:[70,130]},desc:'Mucho hielo, frío extremo.',
   dato:'En 2009, LCROSS confirmó agua en el cráter Cabeus, en sombra permanente cerca del polo sur.',f:['lcross']},
  {id:'borde',n:'Borde iluminado del cráter',dur:10,riesgo:.1,botin:{materiales:[70,130]},desc:'Regolito fácil de recoger.',
   dato:'Para alunizar, Artemis busca pendientes suaves y vista constante de la Tierra.',f:['regiones']},
  {id:'muestras',n:'Campo de muestras geológicas',dur:14,riesgo:.16,botin:{ciencia:[18,36]},desc:'Rocas para el laboratorio.',
   dato:'Entre 1969 y 1972, doce astronautas caminaron sobre la Luna y trajeron muestras.',f:['doce']},
  {id:'carga',n:'Módulo de carga robótico',dur:8,riesgo:.06,botin:{alimentos:[40,80],materiales:[30,60]},desc:'Suministros enviados desde la Tierra.',
   dato:'La NASA planea hasta 30 alunizajes robóticos comerciales a partir de 2027.',f:['ignition']}
];

/* Objetivos por oleadas. La comprobación está en base_lunar.js. */
const OBJETIVOS_BASE = [
  {id:'montaje',n:'Montaje: completa las 4 tareas de superficie'},
  {id:'agua_o2',n:'Construye una planta de agua y oxígeno'},
  {id:'invernadero',n:'Construye la cocina e invernadero'},
  {id:'hielo',n:'Trae hielo con una expedición al cráter en sombra'},
  {id:'noche',n:'Sobrevive a una noche lunar completa'},
  {id:'aguaPropia',n:'Produce 100 L de agua propia'},
  {id:'trip8',n:'Llega a 8 tripulantes'},
  {id:'reactor',n:'Investiga el reactor de fisión'},
  {id:'trip12',n:'Llega a 12 tripulantes'},
  {id:'autosuficiente',n:'Base autosuficiente durante un día lunar completo'}
];

/* Permisos por rol en el multijugador del acto 2. */
const PERMISOS_ROL = {
  construir:[3], mejorar:[3], excavar:[3], investigar:[2], expedicion:[1,2],
  prioridad:[0], reloj:[0], refugio:[0], asignar:[0,1,2,3], ayudar:[0,1,2,3]
};
const NOMBRE_PERMISO = {construir:'construir',mejorar:'mejorar salas',excavar:'excavar',investigar:'investigar',expedicion:'lanzar expediciones',prioridad:'fijar prioridades',reloj:'cambiar la velocidad',refugio:'ordenar el refugio'};
