# Celesteela Mission

**Celesteela Mission** is an educational space exploration and resource management video game. Inspired by NASA and ESA missions, technologies and historical lessons, it turns some of the challenges of traveling to the Moon and staying there into an interactive adventure with exploration, minigames, problem solving and decision making.

> **Reaching the Moon is only the beginning. The real challenge is learning to live there.**

## About the project

The project is being developed for **Space Mission Design Game**, one of the challenges of the **NASA Space Apps Challenge 2026**. Its goal is to bring the public closer to the stages and difficulties of a crewed space mission: preparation, launch, navigation, life support, lunar exploration and establishing a base.

The problem goes beyond reaching the lunar surface. A mission must protect its crew, keep essential systems running, respond to failures and emergencies, manage limited supplies and make use of the resources available in the environment. Celesteela Mission lets players explore these challenges through a simplified educational simulation.

## Gameplay

The game consists of an optional training stage and two main acts.

### Act 0 — Space training

The player arrives at a training center and uses a rover simulator to drive across lunar terrain and find five geological samples:

- Lunar regolith.
- Lunar basalt.
- Anorthosite.
- Impact breccia.
- Regolith with potential ice.

Each sample shows information about its texture, composition, properties, formation and scientific value. There are three difficulty levels:

- **Explorers:** unlimited battery, route and samples marked.
- **Apprentices:** rechargeable battery and limited hints.
- **STEM Students:** no markers; the player must interpret the scanner and the terrain information.

### Act 1 — Journey from Earth to the Moon

The player joins the crew of the Orion spacecraft and chooses one of four roles:

| Role | Main responsibility |
|---|---|
| **Commander** | Leadership, mission decisions and priorities. |
| **Pilot** | Maneuvers, engine burns, approach and descent. |
| **Specialist** | Life support, communications, navigation and science. |
| **Engineer** | Power, water, structure and spacecraft systems. |

The journey is organized into six phases: preparation and launch; ascent and Earth orbit; translunar injection; translunar transit; approach and lunar orbit; and descent and landing, which is marked as **simulated**.

This stage contains **36 missions** spread across the four roles. It includes GO/NO-GO checks, systems checks, suit preparation, propulsion operations, navigation with star trackers, communication with the Deep Space Network, life support, water management, trajectory corrections and descent preparation.

During the journey, incidents and operational situations may come up, such as CO₂ alarms, ventilation problems, solar storms, micrometeoroid impacts and trajectory deviations. To move forward, the player walks through the spacecraft, interacts with consoles and objects, talks to the crew and completes minigames.

The telemetry interface shows variables such as speed, distance to Earth and to the Moon, oxygen, CO₂, water, power, temperature, radiation, mission time and communications status. These values are part of the game model and are not real flight telemetry.

### Act 2 — Building and managing the lunar base

After the simulated landing, the player starts managing a base near the lunar south pole. The player must build facilities, organize the crew and keep essential resources stable to reach self-sufficiency.

Available facilities include:

- Living quarters and storage.
- Kitchen and greenhouse.
- Power plant.
- Water and oxygen plant.
- Anchoring and structure workshop.
- Laboratory and control and communications room.
- Infirmary and gym.
- Radiation shelter and recreation area.

The simulation manages power, food, water, oxygen, CO₂, materials, ice, science points, structural integrity and morale. Players can also assign crew members to facilities, research technologies, organize rover expeditions and respond to incidents.

Available research includes water recycling, LED crop growing, improved electrolysis, dust mitigation, rover upgrades, regolith shielding, oxygen extraction from regolith (ISRU) and a surface fission reactor.

Expeditions let players search for ice in permanently shadowed craters, collect materials, obtain geological samples and receive supplies. Incidents that can affect the base include air leaks, electrical failures, fires, illness, impacts, solar storms and nighttime blackouts.

The economy in this version uses physical resource amounts and science points for research. **It does not include a credit currency or a market for buying materials.**

The goal is to complete the base's progressive objectives and keep it self-sufficient for a full lunar day, with its own water, oxygen and power systems.

## STEM educational content

Besides the main missions, the game includes **eight STEM problem-solving scenarios**. They combine historical, hypothetical and operational situations related to:

1. Fuel anomalies and reserve calculations.
2. An engine shutdown during ascent.
3. An oxygen and power emergency.
4. Trajectory deviation.
5. Computer overload.
6. Water and food shortage.
7. Power deficit.
8. Distributing work when a crew member is sick.

The exercises include data, numerical questions, formulas, procedures and interpretation of results. They are adapted to the **Explorers**, **Apprentices** and **STEM Students** levels.

## Advisor and logbook

**Dr. Marina Solís** is a fictional Mission Control character who accompanies the player as an educational advisor. Her local knowledge base organizes information from different perspectives:

- Scientific.
- Historical.
- Engineering.
- Crew safety.

When the content is available locally, the advisor gives an explanation along with its references. If she cannot find verified information, she says so. The interface also supports online questions through Claude's capabilities when the game runs in an environment that enables them; these answers are labeled as online content and should be checked before being used as facts.

The **NASA Logbook** collects the facts unlocked during the game, their reference links and a visual distinction between documented facts and simulated elements.

## Game modes

- **Single player:** the player selects a role; the other crew positions are handled by game-controlled characters.
- **Online (up to 4 players):** players share a room and take different roles. Unfilled positions stay with the game-controlled crew.
- **Start at the lunar base:** jumps straight to Act 2 to try building and resource management.
- **Continue or load a game:** recovers saved progress or imports a save code.

**Important note about online mode:** it uses the rooms capability (`room`) of Claude's artifact environment. The game must be opened in a view with that service enabled; it is not a standalone multiplayer server included in the HTML file.

## Controls

### Training — Act 0

| Action | Control |
|---|---|
| Move the rover | `W`, `A`, `S`, `D` or arrow keys. |
| Scan a nearby sample | `E`, space bar, `Enter` or the **ESCANEAR** (Scan) button. |
| Touchscreen | On-screen directional controls and scan button. |

### Orion spacecraft — Act 1

| Action | Control |
|---|---|
| Move around the spacecraft | `W`, `A`, `S`, `D` or arrow keys. |
| Interact with a nearby console, object or crew member | `E` or the **USAR** (Use) button. |
| View missions | **Misiones** (Missions) button. |
| Ask the advisor | **Dra. Solís** button. |
| View unlocked information | **Bitácora** (Logbook) button. |

### Lunar base — Act 2

Players interact by selecting rooms, facilities and crew members, and by using the management panels and the bottom action bar. On touch devices, players can select directly on the screen.

## Saving

The game offers several ways to keep your progress:

- **Autosave:** stores the game in the browser's local storage about every 20 seconds.
- **Save now:** saves manually from the menu.
- **Export code:** generates a save code that you can copy and keep.
- **Import code:** loads a game from an exported code.
- **Account save:** can sync progress with the user database when the Claude environment provides that service.

Act 0 training progress is also saved locally in the browser. Local storage depends on the browser and device; clearing its data can delete games that have not been exported.

## Technologies

- **HTML5:** application structure.
- **CSS3:** responsive interface and visual presentation.
- **JavaScript:** game logic, simulations, controls and progress management.
- **Canvas 2D:** scenes, maps and pixel-art graphics.
- **Browser storage:** local game persistence.
- **Claude capabilities (`room`, `db` and queries):** optional integration with the artifact environment for online features.

The main experience is built into a single HTML file. No build process or framework installation is needed to open single-player mode in a modern browser. Fonts load from Google Fonts when there is a connection; if they are not available, fallback fonts are used.

## How to run the project

1. Download or clone the repository.
2. Open `celesteela_index5(1).html` in a modern browser, such as Chrome, Edge or Firefox.
3. Select **UN JUGADOR** (Single player) to start a single-player game. You can also go straight to training or start at the lunar base.
4. To use online mode or the Claude-connected features, open the project inside a Claude artifact environment with those capabilities enabled.

You do not need to install Node.js or run a local server to try single-player mode from the HTML file.

## Scope and scientific accuracy

Celesteela Mission is an **educational simulation**, not a professional flight simulator or an exact representation of a NASA mission. The project uses public information and references from NASA, ESA and the NASA Technical Reports Server (NTRS), but it simplifies procedures, physical models, telemetry values, resource production and consumption, risks and timing to make them playable.

The game labels content as **DATO VERIFICADO** (verified fact) or **SIMULACIÓN** (simulation) where appropriate. Hypothetical and operational scenarios are teaching exercises and should not be read as real historical incidents. The base parameters are game design and balance values, not official specifications for a future lunar base.

## Built-in reference sources

The game includes links to public NASA, ESA and NTRS documentation. Resources included:

- [NASA — Artemis II](https://www.nasa.gov/mission/artemis-ii/) and [Artemis II press kit](https://www.nasa.gov/artemis-ii-press-kit/).
- [NASA — Orion spacecraft](https://www.nasa.gov/humans-in-space/orion-spacecraft/) and [reference guide](https://www.nasa.gov/reference/orion-spacecraft/).
- [NASA — Space Launch System (SLS)](https://www.nasa.gov/humans-in-space/space-launch-system/).
- [NASA — Artemis I](https://www.nasa.gov/mission/artemis-i/), [Artemis III](https://www.nasa.gov/mission/artemis-iii/) and [Artemis IV](https://www.nasa.gov/mission/artemis-iv/).
- [NASA — Apollo 13](https://www.nasa.gov/mission/apollo-13/), [Apollo 11](https://www.nasa.gov/mission/apollo-11/) and [Apollo 8](https://www.nasa.gov/mission/apollo-8/).
- [NASA — Deep Space Network](https://www.nasa.gov/communicating-with-missions/dsn/).
- [NASA — ECLSS life support system](https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf) and [electrolysis to generate oxygen](https://www.nasa.gov/wp-content/uploads/2020/10/g-281237_eclss_0.pdf).
- [NASA — 98% water recovery on the International Space Station](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station).
- [NASA — Moon facts](https://science.nasa.gov/moon/facts/) and [lunar temperatures measured by LRO](https://science.nasa.gov/wp-content/uploads/2024/01/lrolitho7temperaturevariation27may2014.pdf).
- [NASA — LCROSS mission](https://www.nasa.gov/?p=263227), related to the study of water in Cabeus crater.
- [NASA — Orion's European Service Module](https://www.nasa.gov/humans-in-space/orion-spacecraft/european-service-module/) and [ESA — module engines](https://www.esa.int/ESA_Multimedia/Images/2026/02/European_Service_Module_engines).
- [NASA NTRS — Lunar dust abrasion](https://ntrs.nasa.gov/citations/20100033103) and [ARMOR shielding concept](https://ntrs.nasa.gov/citations/20130009378).

The Logbook collects the references tied to the content the player unlocks. Information windows also show sources related to different missions, technologies and facilities.

## Project structure

```text
Celesteela-Mission/
├── README.md                  # Documentation in Spanish
├── README_EN.md               # Documentation in English
└── celesteela_index5(1).html  # Complete game
```

**Celesteela Mission — NASA Space Apps Challenge 2026**  
Educational project about space exploration, STEM problem solving and lunar base management.
