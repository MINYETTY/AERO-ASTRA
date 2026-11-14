/* =====================================================================
   dialogos.js — DATOS de diálogo de los cuatro tripulantes (NPC).
   Más de 40 líneas por rol, repartidas por fase, recursos, eventos,
   hora del ciclo, afinidad, comentarios sobre el jugador e incidentes de
   la base. {mision} se sustituye por el nombre de una misión.
   Los datos científicos que aparecen aquí están verificados en datos_nave.
   ===================================================================== */
const DIALOGOS = [
 /* 0 · Comandante Rivas: sereno, formal, frases cortas. */
 {personalidad:'Sereno y formal. Frases cortas: «tripulación», «afirmativo», «procedimiento».',
  fase:[
   ['Tripulación, revisión final. Nadie se sienta hasta que todo esté en verde.','El sondeo GO/NO-GO no es un trámite. Si alguien dice NO-GO, paramos.','Respiren hondo. Hemos ensayado esto cientos de veces.'],
   ['Estamos en órbita. Procedimiento primero, fotos después.','La órbita alta nos da tiempo para revisarlo todo antes de ir a la Luna.','Buen trabajo en el ascenso. Ahora, paciencia y listas de verificación.'],
   ['El encendido translunar nos compromete con la Luna. Confirmen cada paso.','A partir de aquí, la Red del Espacio Profundo es nuestra voz con casa.','Rumbo fijado. Mantengan la disciplina, tripulación.'],
   ['Cuatro días de tránsito. La rutina nos mantiene sanos.','Si suena la alarma de radiación, al refugio sin discutir.','Cada hora la Tierra se ve más pequeña. Eso no cambia el procedimiento.'],
   ['Detrás de la Luna estaremos solos. Revisen todo antes de perder la señal.','El polo sur es exigente: sombras largas y terreno difícil.','Elegiremos el sitio con datos, no con prisas.'],
   ['Descenso simulado, pero lo trataremos como real.','Afirmativo, módulo listo. Nadie baja con un traje sucio de polvo.','Un paso a la vez. Literalmente.'],
   ['Primera prioridad de la base: energía para la noche lunar.','Asignen a cada uno donde rinde más. Así se sostiene una base.','No construimos rápido: construimos para durar.']],
  recurso:{o2:['El oxígeno baja. Especialista, prioridad uno.'],co2:['CO₂ alto. Atentos a dolores de cabeza; Especialista, al filtro.'],agua:['Agua por debajo de lo previsto. Racionamos hasta reciclar.'],energia:['Energía baja. Apaguen lo que no sea esencial.'],temp:['La cabina se calienta. Ingeniero, revise el control térmico.'],rad:['Dosis de radiación en aumento. Prepárense para refugiarse.']},
  evento:{co2:['Alarma de CO₂. Especialista al filtro; el resto, respiren despacio.'],ventilador:['Ventilador caído. Ingeniero, es su turno.'],tormenta:['¡Tormenta solar! Todos al Habitáculo, ya.'],micrometeoroide:['Impacto en el casco. Ingeniero a la Esclusa; los demás, calma.'],desvio:['Desvío detectado. Piloto, corrija el rumbo.']},
  ciclo:{sueno:['Turno de sueño. Una tripulación cansada comete errores.'],comida:['Hora de comer. Hasta el comandante obedece al horario de comidas.'],ejercicio:['Ejercicio. En gravedad cero, los huesos no se cuidan solos.'],trabajo:['Turno de trabajo. Revisen la lista de misiones.']},
  afinidad:{baja:['Afirmativo. ¿Algo más?','Concéntrese en su estación, por favor.'],alta:['Me alegra tenerle en esta tripulación.','Si todos trabajaran como usted, iríamos adelantados.']},
  jugador:['Bien hecho con «{mision}». Así se hace.','«{mision}» completada. Lo anoto en la bitácora.','Vi lo de «{mision}». Procedimiento impecable.'],
  general:['En el espacio, la calma es una herramienta.','Una lista de verificación es un mapa para no perderse.','Control de Misión quiere informes breves. Yo también.','La Tierra nos mira. Demos un buen ejemplo.','¿Su estación está en verde? Entonces, adelante.'],
  base:{fuga:['Fuga en la base. Ingeniero a esa sala; los demás, sellen puertas.'],electrico:['Fallo eléctrico. Prioridad: soporte vital primero.'],tormenta:['Tormenta solar: todos a las plantas más profundas.'],enfermedad:['Tenemos a alguien enfermo. Enfermería, prioridad uno.'],incendio:['¡Incendio! Extintores, y fuera de la sala quien no ayude.'],impacto:['Impacto de micrometeorito. Revisen la estructura.'],apagon:['Apagón nocturno. Ahorro total hasta que vuelva el Sol.']}},

 /* 1 · Piloto Vega: entusiasta, bromista, metáforas de velocidad. */
 {personalidad:'Entusiasta y bromista. Habla de velocidad, música y vuelo.',
  fase:[
   ['¡Por fin! Llevo años soñando con este asiento.','Sistema de escape listo… aunque espero no estrenarlo.','Cuenta atrás y a volar. ¡Esto es mejor que cualquier montaña rusa!'],
   ['¿Sentiste los propulsores separarse? ¡Qué empujón!','Maniobrar junto a la etapa superior es como bailar con un camión.','La Tierra desde aquí… ni el mejor simulador se le parece.'],
   ['Encendido translunar: el encendido más importante de mi vida.','Rumbo a la Luna. ¡Agárrense, que ya no hay vuelta atrás!','Pequeñas correcciones, grandes resultados. Así se pilota.'],
   ['Cuatro días sin semáforos. El tráfico aquí es estupendo.','Pedalear en gravedad cero es raro: pedaleas y no vas a ninguna parte.','Si veo un micrometeoroide, prometo no tocarle el claxon.'],
   ['¡Mira esa Luna! Ocupa toda la ventana.','Al pasar por detrás perdemos la señal. Momento de silencio cósmico.','Sobrevolar la Luna… se lo contaré a mis nietos con efectos de sonido.'],
   ['Acoplar es como enhebrar una aguja… a toda velocidad.','Descenso motorizado: suave como la seda, prometido.','Buscaré un sitio plano. Nada de aterrizar dentro de un cráter, gracias.'],
   ['El rover está listo. ¿Quién quiere dar un paseo hasta un cráter?','Echar regolito sobre la base: soy piloto, no albañil… pero me encanta.','Con una sexta parte de la gravedad, hasta cargar cajas es divertido.']],
  recurso:{o2:['Oye, el oxígeno baja. Yo respiro poco, pero no tanto.'],co2:['Siento la cabeza pesada… ¿será el CO₂?'],agua:['¿Poca agua? Pues nada de desperdiciar ni una gota.'],energia:['Energía baja. Apago mi música, lo prometo.'],temp:['¡Qué calor! Parece una tarde de verano en el Caribe.'],rad:['Radiación alta. Mejor no asomarse mucho a la ventana.']},
  evento:{co2:['Alarma de CO₂. Dra. Ortiz, ¡usted es nuestra heroína!'],ventilador:['Se paró un ventilador. Soto lo arregla en un momento.'],tormenta:['¡Tormenta solar! Al refugio; yo llevo la almohada.'],micrometeoroide:['¿Oyeron ese clic? Algo nos rozó el casco.'],desvio:['Desvío de rumbo. ¡Déjenmelo a mí!']},
  ciclo:{sueno:['Dormir flotando es lo mejor… si no chocas con el compañero.'],comida:['Hora de comer. ¡Mi parte favorita del plan de vuelo!'],ejercicio:['Ejercicio: hoy bato mi récord en la bici estática.'],trabajo:['A trabajar. Las maniobras no se hacen solas.']},
  afinidad:{baja:['Ah, hola. Estoy algo ocupado con los controles.','Hablamos luego, ¿vale?'],alta:['¡Eres de mis tripulantes favoritos! No se lo digas a los demás.','Contigo a bordo, hasta las correcciones de rumbo son divertidas.']},
  jugador:['¡Lo de «{mision}» estuvo de diez!','¿«{mision}» ya está? ¡Vas más rápido que yo!','Vi «{mision}» en la pantalla. ¡Así se hace!'],
  general:['Aquí arriba no hay arriba ni abajo. Yo decido que arriba es donde está la comida.','Mi sueño: pilotar algo aún más rápido. Pero esto ya está muy bien.','Si te mareas, mira un punto fijo. A mí me funciona… casi siempre.','Los controles responden como un guante.','Cuando volvamos, invito yo. En la Tierra, claro.'],
  base:{fuga:['¡Fuga! Cierren esa compuerta, rápido.'],electrico:['Se fue la luz. Menos mal que tengo vista de piloto.'],tormenta:['Tormenta solar: nadie sale en rover, ni siquiera yo.'],enfermedad:['Alguien está enfermo. Le llevo sopa… de sobre.'],incendio:['¡Fuego! Esto no es un simulacro, ¿verdad?'],impacto:['Un micrometeorito golpeó la superficie. Revisaré el rover.'],apagon:['Apagón. Noche lunar larga, chistes largos.']}},

 /* 2 · Dra. Ortiz: científica curiosa, «fascinante», habla con datos. */
 {personalidad:'Científica curiosa. Dice «fascinante», cita datos y distingue hecho, hipótesis y simulación.',
  fase:[
   ['Mis sensores están calibrados. Fascinante cómo vibra la nave antes del despegue.','Revisé los trajes dos veces. La seguridad también es ciencia.','Dentro de poco veremos la Tierra entera. Literalmente.'],
   ['El soporte vital funciona. El aire que respiramos es un pequeño milagro de ingeniería.','Desde la órbita alta, las nubes parecen pinceladas.','Registro temperatura, presión y humedad. Los datos no mienten.'],
   ['Lejos de la Tierra nos guiamos con estrellas y con la Red del Espacio Profundo.','Goldstone, Madrid y Canberra: tres complejos para que nunca estemos solos.','Los rastreadores estelares comparan el cielo con un mapa. Navegación clásica, versión digital.'],
   ['Fascinante: en el espacio los huesos pierden densidad. Por eso pedaleamos.','Vigilo la radiación. Lejos de la Tierra, cada dosis cuenta.','El agua es el recurso más valioso a bordo. Cada gota se recicla.'],
   ['Mapeo de cráteres en curso. Algunos nunca han recibido luz del Sol.','En el cráter Hermite se midieron unos −250 °C. ¡De lo más frío medido en el sistema solar!','Cuando pasemos detrás de la Luna, haré observaciones sin ruido de radio.'],
   ['El polvo lunar es abrasivo. Limpiaré los visores con mucho cuidado.','Quiero muestras de las zonas en sombra. Ahí puede haber hielo.','Descenso simulado, sí, pero mis notas serán muy reales.'],
   ['El hielo de los cráteres podría darnos agua y oxígeno. ¡Química útil!','El regolito tiene casi la mitad de su masa en oxígeno. Fascinante, ¿no?','Cada experimento de la base es un paso hacia Marte.']],
  recurso:{o2:['El oxígeno está bajo. Voy a ajustar el soporte vital.'],co2:['CO₂ alto: dolor de cabeza y cansancio. No ignoren los síntomas.'],agua:['Agua baja. Reciclar es obligatorio, no opcional.'],energia:['Con poca energía se apagan mis instrumentos. Triste para la ciencia.'],temp:['La temperatura sube. Mis muestras también lo notan.'],rad:['La dosis de radiación sube. Al refugio si llega la alerta.']},
  evento:{co2:['Alarma de CO₂. Voy al filtro de aire.'],ventilador:['Sin ventilador, el aire no circula y el CO₂ se acumula. ¡Rápido, Soto!'],tormenta:['Partículas solares en aumento. Las bolsas densas, al lado menos protegido.'],micrometeoroide:['Un micrometeoroide: pequeñito, pero muy rápido.'],desvio:['Detecto un desvío en la navegación. Vega, te paso los datos.']},
  ciclo:{sueno:['Dormiré ocho horas. Bueno, siete. Bueno, cuando termine este gráfico.'],comida:['Comer en el espacio: las migas flotan, así que se come con cuidado.'],ejercicio:['Ejercicio: mi experimento favorito, aunque el sujeto soy yo.'],trabajo:['Turno de trabajo. Tengo tres experimentos esperando.']},
  afinidad:{baja:['Disculpa, estoy midiendo algo.','Luego te explico. Ahora mismo: datos.'],alta:['¡Me encanta hablar contigo! Haces las mejores preguntas.','Te enseñaré mis gráficos. Son preciosos, en serio.']},
  jugador:['Tus datos de «{mision}» son impecables.','«{mision}»: completado. Lo añado a mi informe científico.','Fascinante cómo resolviste «{mision}».'],
  general:['La ciencia empieza con una buena pregunta.','Si quieres saber más, la Dra. Solís, de Control de Misión, tiene un archivo enorme.','Me gusta medirlo todo. Hasta cuánto flota mi taza.','Cada dato que mandamos a casa ayuda a la próxima tripulación.','Hecho, hipótesis o simulación: siempre hay que distinguirlos.'],
  base:{fuga:['Fuga detectada: la presión de esa sala baja.'],electrico:['Fallo eléctrico: mis experimentos, en pausa.'],tormenta:['Tormenta solar: el regolito sobre la base es nuestro mejor escudo.'],enfermedad:['Tenemos a alguien enfermo. Voy a la enfermería.'],incendio:['¡Incendio! El oxígeno alimenta el fuego; hay que actuar ya.'],impacto:['Impacto de micrometeorito registrado. Analizaré el cráter nuevo.'],apagon:['Apagón: aprovecharé para observar las estrellas.']}},

 /* 3 · Ing. Soto: práctico, gruñón amable, herramientas. */
 {personalidad:'Práctico y gruñón amable. Habla de tornillos, cables y manuales.',
  fase:[
   ['Cada cable revisado. Si funciona, no lo toques.','Los tanques se llenan despacio. El hidrógeno líquido no perdona prisas.','Unas veinte mil piezas en el módulo de servicio… y las conozco todas. Casi.'],
   ['Paneles solares desplegados. Ahora sí, luz gratis.','Las alas solares siguen al Sol. Yo sigo al café.','Los motores van finos. Que nadie toque mis ajustes.'],
   ['El motor principal da 6,000 libras de empuje. Lo cuido como a un hijo.','El retardo de radio desde la Luna es de unos 1.3 segundos. No es mucho… salvo para los chistes.','Revisé las computadoras. Todo responde.'],
   ['El agua se recicla y queda limpia. No preguntes más.','Si un ventilador hace un ruido raro, me llaman. Si deja de hacer ruido, también.','El Apolo 13 nos enseñó a improvisar con lo que hay a bordo.'],
   ['Detrás de la Luna no hay señal. Mis sistemas no necesitan compañía.','Las pantallas del laboratorio echan humo… en sentido figurado.','Calculo el combustible para la inserción. Las cuentas cuadran.'],
   ['Revisé las patas del módulo de descenso. Firmes como una mesa.','El polvo lunar se mete en todo. Traje limpio, mecanismo feliz.','Si el radar dice peligro, le hacemos caso al radar.'],
   ['La base necesita estructura: anclajes, sellos y mucho regolito encima.','Excavar plantas nuevas es mi pasatiempo favorito.','De noche, sin Sol, mandan las baterías. Las cuido yo.']],
  recurso:{o2:['Oxígeno bajo. Revisaré si hay fugas.'],co2:['CO₂ alto. ¿Alguien tocó mis filtros?'],agua:['Agua baja. Toca reciclar en la cocina.'],energia:['Energía baja. Apaguen lo que no sirva. Ya.'],temp:['Temperatura alta. El control térmico pide ayuda.'],rad:['Radiación alta. Mis circuitos y ustedes, al refugio.']},
  evento:{co2:['Alarma de CO₂. Ortiz, ¿te echo una mano?'],ventilador:['Ventilador caído. Voy con la caja de herramientas.'],tormenta:['Tormenta solar. Guardo los equipos sensibles y voy al refugio.'],micrometeoroide:['¿Una fuga? Voy a la Esclusa a sellar el panel.'],desvio:['Desvío. Vega, revisa los propulsores; yo miro el software.']},
  ciclo:{sueno:['Duermo, pero con un ojo en las alarmas.'],comida:['Comida. ¿Quién se comió mi postre? Era el último.'],ejercicio:['Ejercicio obligatorio. Mis rodillas protestan.'],trabajo:['Turno de trabajo. Hay tornillos que apretar.']},
  afinidad:{baja:['Mmm. ¿Qué necesitas? Estoy ocupado.','Si no es una emergencia, luego.'],alta:['Tú sí sabes tratar a las máquinas.','Te dejo usar mi destornillador favorito. Es un honor.']},
  jugador:['«{mision}» hecho y sin romper nada. Respeto.','Revisé lo de «{mision}». Trabajo limpio.','«{mision}» completada. Así da gusto.'],
  general:['Las mejores reparaciones son las que nadie nota.','Cinta adhesiva, paciencia y un buen manual: mi equipo básico.','Cada pieza tiene un porqué. Si sobra una, algo va mal.','No me hables de planos: los sueño.','Si algo suena distinto, avísame antes de que deje de sonar.'],
  base:{fuga:['Fuga. Voy con sellador y paciencia.'],electrico:['Fallo eléctrico. Revisaré el cuadro de esa sala.'],tormenta:['Tormenta solar. Nadie a la superficie hasta nuevo aviso.'],enfermedad:['¿Enfermo? Que lo lleven a la enfermería. Yo sostengo la base.'],incendio:['¡Incendio! Corten la energía de esa sala.'],impacto:['Impacto en la superficie. Más regolito encima, ¿lo ven?'],apagon:['Apagón. Las baterías no son infinitas, ya se lo dije.']}}
];

/* Charlas entre NPC (burbujas). a y b son roles; las líneas se alternan
   empezando por a. Humor ligero y datos verificados. */
const CHARLAS = [
 {a:0,b:1,l:['Vega, ¿lista de verificación?','Hecha, comandante. Dos veces.','Una tercera no hace daño.']},
 {a:1,b:3,l:['Soto, ¿y si le ponemos luces de colores al motor?','Ni lo sueñes, Vega.','Valía la pena preguntar.']},
 {a:2,b:3,l:['Soto, en la Estación Espacial reciclan el 98 % del agua.','Lo sé. Aquí también nos toca reciclar.','¡Ciencia y fontanería, juntas!']},
 {a:0,b:2,l:['Doctora, ¿cómo va la radiación?','Estable, comandante. Le aviso si sube.','Gracias. Sin sorpresas, por favor.']},
 {a:1,b:2,l:['¿Cuánto tarda la radio en llegar a casa?','Desde la Luna, unos 1.3 segundos.','Entonces mis chistes llegan con retraso.']},
 {a:3,b:0,l:['Comandante, los paneles rinden bien.','Buen trabajo, Soto.','Lo sé. Pero gracias.']},
 {a:2,b:1,l:['Vega, ¿has visto la Tierra? Parece una canica.','Una canica preciosa.','Y nosotros, una mota de polvo a su lado.']},
 {a:0,b:3,l:['Soto, ¿algún ruido raro?','Solo el de Vega cantando.','Eso no tiene arreglo.']},
 {a:1,b:0,l:['Comandante, ¿me deja aterrizar a mí?','Cuando toque, Vega.','¡Lo tomo como un sí!']},
 {a:3,b:2,l:['Doctora, ¿tan malo es el polvo lunar?','En el Apolo rayó visores y dañó sellos de los trajes.','Entonces compro más cepillos.']},
 {a:2,b:0,l:['Propongo explorar el cráter en sombra.','¿Riesgo?','Frío extremo, pero posible hielo.','Aprobado. Con cuidado.']},
 {a:1,b:3,l:['Soto, el rover hace un ruidito.','¿Qué ruidito?','Uno así: tac, tac.','Eso es una rueda. Ahora voy.']},
 {a:0,b:1,l:['¿Cuántos astronautas caminaron en la Luna con el Apolo?','Doce, entre 1969 y 1972.','Pronto seremos más.']},
 {a:2,b:3,l:['El regolito tiene casi la mitad de su masa en oxígeno.','¿Y cómo se saca?','Con calor y química. Trabajo para tu planta.']},
 {a:0,b:2,l:['La noche lunar dura unos 14 días terrestres.','Entonces, baterías llenas antes de que anochezca.','Afirmativo.']},
 {a:1,b:2,l:['¿Qué fue el «Earthrise»?','Una foto de la Tierra saliendo sobre la Luna, del Apolo 8.','Quiero hacer una igual.']}
];
