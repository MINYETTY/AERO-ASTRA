# Misión Orión v2 — de la Tierra a la Luna y gestión de una base lunar

Juego web en un solo HTML, en pixel art dibujado por código (estilo de la imagen
de referencia: cielo tramado azul-morado, estrellas en cruz, la Tierra asomando
por un horizonte lunar gris con cráteres).

- **Acto 1 · Nave Orión:** 36 misiones en 6 fases, del sondeo GO/NO-GO al primer paso en la Luna.
- **Acto 2 · Base lunar:** base en corte al estilo Fallout Shelter cerca del polo sur, con
  4 tareas de superficie y 10 objetivos por oleadas.
- **Dra. Marina Solís:** asesora de Control de Misión con un archivo verificado de 45 respuestas
  en 10 categorías y un modo en línea opcional.
- Hasta 4 jugadores en línea.

Se trabajó sobre la versión web (el HTML subido). No había proyecto de Godot
adjunto, así que no se tocó ninguna escena de Godot.

## Controles

| Dónde | Qué |
|---|---|
| Nave | WASD / flechas o joystick táctil para moverse. **E**, espacio o **USAR** junto a una consola o un tripulante. |
| Nave | Flechas naranjas: hacia tu misión. Icono rojo: evento que te toca resolver. |
| Base | Toca una sala para ver su panel. Toca a un tripulante para hablar. Arrastra o usa la rueda (o W/S) para desplazarte. |
| Base | Barra inferior: Construir, Tripulación, Investigar, Rover, Prioridad, Informe. Arriba: recursos y velocidad (❚❚ ×1 ×3 ×6). |
| Siempre | **Misiones** (lista y objetivos), **Dra. Solís**, **Bitácora** (datos reales desbloqueados), **Menú** (guardar, exportar/importar código, sonido). **Esc** cierra ventanas. |

## Estructura

```
src/
  datos_nave.js     acto 1: fuentes, roles, fases, 40 misiones, mapa, objetos, eventos, ciclo diario
  dialogos.js       55 líneas por rol según contexto + 16 charlas entre PNJ
  conocimiento.js   archivo verificado de la asesora (45 entradas, 4 perspectivas)
  datos_base.js     acto 2: 13 tipos de sala, incidentes, investigaciones, expediciones, objetivos, permisos
  motor.js          utilidades, sonido, arte en píxeles (tramado Bayer, Tierra/Luna con ruido)
  trayecto.js       modelo de distancia y velocidad (fórmulas documentadas en el propio archivo)
  cinematicas.js    6 cinemáticas
  minijuegos.js     21 minijuegos
  nave.js           lógica y dibujo del acto 1
  ui.js             interfaz común
  asesora.js        Dra. Solís
  base_lunar.js     simulación de la base
  ui_base.js        dibujo y paneles de la base
  red.js            multijugador
  principal.js      pantallas, bucle, guardado
  estilo.css, plantilla.html
build.py            une todo en dist/index.html
pruebas/            pruebas automáticas (Playwright) y sala simulada
```

Los datos están separados de la lógica. Para cambiar una misión, un diálogo, una sala o
una respuesta de la asesora, se edita su archivo de datos y se ejecuta
`python3 build.py`.

## Veracidad

- Cada misión, objeto, sala, investigación, expedición e incidente lleva un «Dato NASA» con su
  fuente: 61 fuentes de NASA, ESA y NTRS, consultadas al escribir los datos.
- Lo que es de juego aparece marcado como **SIMULACIÓN** y no se presenta como dato:
  - 8 misiones simuladas (ventilador, inserción en órbita lunar, acople, descenso, primer paso…).
  - El modelo de trayectoria.
  - Las cifras de producción y consumo de la base.
- El archivo de la asesora se puso al día con la información de 2026:
  - Artemis II se lanzó el 1 de abril de 2026 y amerizó el 10 de abril, con récord de distancia
    de 406,771 km.
  - Artemis III (2027) será una prueba en órbita terrestre.
  - El alunizaje en el polo sur pasa a Artemis IV.
  - Gateway quedó en pausa el 24 de marzo de 2026.
- Si se le pregunta algo que no está en su archivo, la asesora responde «No tengo ese dato
  verificado».
- **Modo en línea con Claude:**
  - Es opcional y usa la capacidad del artefacto, así que **no hay clave de API en el código**.
  - Sus respuestas se marcan como contenido generado.
  - Sus instrucciones exigen español y prohíben inventar cifras. También piden distinguir hecho,
    hipótesis y simulación.

## Realismo del viaje (acto 1)

- **Distancia y velocidad:** se calculan con órbitas de Kepler y la ecuación de energía
  Tierra-Luna. La fórmula está en `trayecto.js`.
- **Hitos:** velocidad de unos 10.9 km/s tras la inyección translunar. Mínimo de unos 0.44 km/s
  cerca del punto neutro. Máximo acercamiento a unos 6,547 km de la superficie lunar.
- **Radio:** retardo distancia ÷ c, de unos 1.25–1.3 s cerca de la Luna. Se aplica a Control de
  Misión, a la asesora y al minijuego del código. Hay pérdida de señal en la cara oculta.
- **Ritmo:** reloj MET con esperas en los hitos reales del plan de vuelo y ciclo de sueño y
  comidas de la tripulación.
- **Eventos aleatorios**, cada uno para su rol: CO₂, ventilador, tormenta solar con refugio,
  micrometeoroide y desvío de trayectoria.

## Multijugador

- Usa la sala del artefacto (código de nave compartido). Todo viaja en la *presencia*, que
  pueden usar también quienes solo tienen permiso de lectura.
- **Anfitrión:** el primero en entrar. Simula el reloj, los PNJ, los eventos y la base, y valida
  las acciones de los demás.
- **Permisos en la base:**
  - Ingeniero: construir y mejorar.
  - Especialista: investigar y expediciones.
  - Piloto: expediciones con el rover.
  - Comandante: prioridades, reloj y refugio.
  - Si nadie humano tiene el rol, cualquiera puede hacerlo.
- Si el anfitrión se va, otro jugador toma el relevo.
- **ENet:** en Godot se usaría ENet, pero no funciona en la exportación web. Por eso esta versión
  usa la sala de la plataforma, que admite hasta 4 KiB de presencia por jugador. La base viaja
  en una instantánea compacta (unos 740 bytes en las pruebas).

## Guardado

Se guarda automáticamente en este navegador cada 20 s y al cambiar de acto.
Desde el Menú se puede exportar un código para copiar y pegar en otro dispositivo.
Si hay sesión iniciada, también se guarda en un documento privado de la cuenta.

## Qué probar en cada fase

- **(a) Datos y misiones:** abre la lista de Misiones (40, con rol, fase y requisitos) y la Bitácora tras completar alguna.
- **(b) Viaje:** mira la telemetría (MET, velocidad, distancias, retardo), la ventana que cambia de tamaño de Tierra y Luna, las cinemáticas, la pérdida de señal y los eventos.
- **(c) Diálogos y asesora:** habla varias veces con un PNJ (no repite seguido y comenta lo que hiciste). Prueba «Otra perspectiva» y una pregunta sin dato.
- **(d) Base:** construye, asigna tripulantes, mira el informe de energía antes de la noche lunar (unos 14 días de luz y 14 de noche, real), investiga el reactor y lanza el rover.
- **(e) Incidentes y objetivos:** fugas, incendios, tormentas con refugio, enfermedad y apagón. Revisa la evacuación parcial (derrota suave) y la victoria.
- **(f) Multijugador:** dos pestañas con el mismo código; prueba que el Comandante no pueda construir si hay un Ingeniero humano.
- **(g) Pulido:** móvil en vertical, guardar, continuar y exportar código.

## Pruebas hechas

Todas en Chrome sin pantalla, a 1100×760 y a 390×844.

- **Sin errores de consola** en ninguno de los recorridos.
- **Mapa:** los 65 objetos de la nave son alcanzables desde la casa de cada rol.
- **Minijuegos:** abren y cierran los 21, más los 5 de eventos. Uno se jugó con clics reales.
- **Acto 1:** recorrido completo de las 36 misiones hasta el acto 2.
- **Teclado y ratón:** caminar con el teclado, usar una consola con E, hablar con un PNJ, construir
  tocando el lienzo y abrir una sala con clic real.
- **Simulación de la base (Node), con varias semillas:**
  - Un jugador atento cumple los 10 objetivos sin evacuaciones.
  - Uno pasivo sufre evacuaciones parciales pero no pierde la base.
- **Multijugador** con dos páginas y una sala simulada con la misma API y el límite de 4 KiB:
  roles ocupados, misiones y eventos sincronizados, permisos, base compartida y relevo del
  anfitrión.
- **Guardar y cargar:** exportar, importar, continuar tras recargar y victoria.

## Lo que NO se pudo probar (honestamente)

- **La sala real con varias personas en claude.ai.** Solo se probó con una sala simulada. La
  latencia real y las desconexiones pueden comportarse distinto.
- **El modo en línea de la asesora.** Necesita claude.ai y el permiso de la persona.
- **El guardado en la cuenta** (base de datos del artefacto). Si falla, queda el guardado local.
- **Las fuentes tipográficas de Google.** No hay red en las pruebas, así que las capturas usan la
  letra de reserva.
- **El sonido**, que no suena en Chrome sin pantalla.
- **El joystick táctil en un teléfono real.** Solo se probaron ratón y teclado.
- **El equilibrio fino del juego con personas reales.** Duración, dificultad de la primera noche
  y frecuencia de incidentes se ajustaron con simulaciones, no con jugadores.
- **Godot:** no se modificó; el proyecto no estaba disponible.
