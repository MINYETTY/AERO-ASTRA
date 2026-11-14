# Misión Orión

Juego 2D en pixel art, en español, para 1 a 4 jugadores. La tripulación viaja de la Tierra a la Luna en la nave Orión y después construye y gestiona una base lunar hasta hacerla autosuficiente.

Está inspirado en Among Us (tripulación con roles que cumple misiones) y en Fallout Shelter (base lunar vista en corte). Los datos científicos vienen de la NASA y la ESA, con su fuente citada.

![Base lunar](assets/base_lunar_1920x1080.png)

## Cómo jugar

Descarga o clona el repositorio y abre `index.html` en el navegador. No hay que instalar nada.

| Acción | Teclado | Pantalla táctil |
| --- | --- | --- |
| Moverse | Flechas o WASD | Botones en pantalla |
| Usar / interactuar | E, Espacio o Enter | Botón USAR |
| Cerrar ventanas | Esc | Botón Salir / Cerrar |

## Los dos actos

**Acto 1 · La nave Orión.** Recorre las 7 fases del viaje: preparación y lanzamiento, ascenso, inyección translunar, tránsito, órbita lunar, descenso y montaje de la base. Cada fase tiene misiones que se resuelven con alguno de los 21 minijuegos (sondeo GO/NO-GO, encendidos, acoplamiento, descenso, caminata espacial y más). El reloj de misión y la telemetría siguen un modelo simplificado del trayecto real de Artemis.

**Acto 2 · La base lunar.** Construye salas (energía, invernadero, laboratorio, enfermería, refugio contra la radiación y otras), asigna tripulantes, investiga, manda expediciones en rover y sobrevive a incidentes y tormentas solares. Ganas cuando la base es autosuficiente durante un día lunar completo.

También se puede empezar directamente en la base lunar desde el menú de inicio.

## Roles

| Rol | En la nave | En la base |
| --- | --- | --- |
| Comandante | Ignición, órbitas y decisiones | Fija prioridades y la velocidad del reloj |
| Piloto | Maniobras, acoplamiento y descenso | Conduce los rovers y las expediciones |
| Especialista | Soporte vital, comunicaciones y ciencia | Investiga y dirige expediciones científicas |
| Ingeniero | Energía, agua, estructura y computadoras | Construye, mejora y repara la base |

## Otras funciones

- **Dra. Marina Solís (asesora):** responde preguntas sobre la Luna, Marte, el Sol, cohetes, astronautas e historia espacial, con datos verificados y sus fuentes.
- **Bitácora:** registro de lo que va pasando en la misión.
- **Guardado:** automático en el navegador. También se puede exportar e importar un código de partida.
- **Sonido:** generado con Web Audio, sin archivos de audio.

## Funciones que solo van dentro de Claude

El juego se hizo como artefacto de Claude. Fuera de Claude (por ejemplo, abriendo `index.html` en tu computadora o en GitHub Pages) funcionan el modo de un jugador, el guardado en el navegador y el código de partida. Estas tres funciones necesitan la plataforma de Claude y se desactivan solas fuera de ella:

- Multijugador en línea (hasta 4 jugadores)
- Modo en línea de la asesora (respuestas generadas por Claude)
- Guardado en la nube por usuario

## Estructura del proyecto

```
├── index.html      Todo el juego: HTML, CSS y JavaScript en un solo archivo
├── assets/         Imágenes del proyecto
└── README.md
```

Dentro de `index.html`, el código está dividido en módulos marcados con comentarios:

| Módulo | Qué contiene |
| --- | --- |
| `datos_nave.js` | Roles, fases y misiones del acto 1 |
| `dialogos.js` | Diálogos de los cuatro tripulantes |
| `conocimiento.js` | Base de datos de la asesora |
| `datos_base.js` | Salas, incidentes, investigaciones y expediciones del acto 2 |
| `motor.js` | Utilidades, sonido y arte pixelado dibujado por código |
| `trayecto.js` | Modelo del trayecto Tierra → Luna |
| `cinematicas.js` | Escenas cortas entre fases |
| `minijuegos.js` | Los 21 minijuegos |
| `nave.js` | Lógica y dibujo del acto 1 |
| `ui.js` | Interfaz común: HUD, misiones, bitácora |
| `asesora.js` | La Dra. Solís |
| `base_lunar.js` | Simulación del acto 2 |
| `ui_base.js` | Dibujo y paneles de la base lunar |
| `red.js` | Multijugador |
| `principal.js` | Pantallas, guardado y bucle principal |

## Tecnología

HTML5, CSS y JavaScript puro, sin librerías. Todos los gráficos se dibujan con código en `<canvas>`. Las fuentes (Press Start 2P y VT323) se cargan desde Google Fonts.

## Créditos

Datos científicos: NASA, ESA y el NTRS de la NASA (las fuentes están citadas dentro del juego). Las cifras de producción y consumo de la base son de juego.
