# ?? Ganesh Chaturthi Anti-Gravity Field [Zone ID: AG-04]

A high-fidelity, interactive gameplay physics simulation set in a festive Indian courtyard during Ganesh Chaturthi. Experience a mystical zero-gravity realm where Mom (Priya) chases her mischievous son (Aarav) under dynamic gravitational shifts and celebrates with sacred Modak offerings to Lord Ganesha.

?? **Live GitHub Pages Demo**: [Play Online](https://Aryanpancharya-hub.github.io/ganesh-chaturthi-antigravity/)

---

## ?? Game Overview

In this festive simulation, Mom (Priya) follows your cursor as she tries to catch young Aarav. Aarav is hyper-agile with predictive evasion AI, acrobatically dodging Mom using floating momentum and buoyant drafts. 

When Mom successfully matches body alignment points within the precision **26px lock-on threshold** and the player presses **`Shift`**, a heartwarming reward ceremony begins:
1. **Feeding Aarav**: Mom hands a delicious golden modak to Aarav, who happily eats it with a chewing animation.
2. **Divine Prasad for Lord Ganesha**: Mom turns toward Lord Ganesha's sacred floral altar and launches an offering Modak along a glowing parabolic arc. Upon arrival, Ganesha's golden halo radiates celestial rays, a divine blessing banner appears (*"?????????? ?? ????????"*), and sacred temple chimes resonate!

---

## ??? Controls

| Control | Action |
| :--- | :--- |
| **Mouse Cursor** | Guide Mom (Priya) smoothly across the courtyard |
| **Shift Key / Click "CATCH!"** | Catch Aarav when alignment points lock within **26px** |
| **Spacebar / Button** | Toggle **AG-04 Anti-Gravity Field** |
| **Q / Left Button** | Toggle West Vayu Turbine (Wind Current Generator) |
| **E / Right Button** | Toggle East Vayu Turbine (Wind Current Generator) |
| **M** | Spawn floating golden Modak |
| **D** | Spawn floating lit Diya |
| **V** | Toggle Physics Vector Debug Overlay |

---

## ?? Physics & Simulation Architecture

### 1. Dynamic Gravity Field Transition (AG-04)
The courtyard transitions smoothly between standard Earth gravity and a low-buoyancy levitation zone:
$$\vec{g}_{\text{normal}} = (0, -9.81, 0) \text{ m/s}^2 \quad \longleftrightarrow \quad \vec{g}_{\text{AG-04}} = (0, +4.50, 0) \text{ m/s}^2$$
A cubic smoothstep function $S(t) = 3t^2 - 2t^3$ over a $1.2\text{s}$ dampening window prevents abrupt forces, allowing props and characters to float serenely.

### 2. Verlet Integration Torans & Garlands
Sacred marigold flower garlands (*Genda Phool*) and mango leaves are simulated using discrete multi-segment Verlet rope physics:
$$\vec{x}_i^{t+\Delta t} = 2\vec{x}_i^t - \vec{x}_i^{t-\Delta t} + \vec{a}_i \Delta t^2$$
In normal gravity, they sag into natural catenary arcs; in anti-gravity, they gracefully arch upward toward the heavens.

### 3. Hyper-Agile Aarav Evasion AI
- **Threat Sensing Radius**: Activates evasive maneuvers when Mom approaches within $115\text{px}$.
- **Emergency Somersault Leaps**: Triggers sudden bursts when cornered or within $88\text{px}$.
- **Reflex Sprints**: Quick $0.28\text{s}$ momentum shifts with dynamic wall bouncing and dampening curves.

### 4. Sacred Offering Parabolic Ballistics
Modaks offered to Lord Ganesha follow a quadratic Bézier trajectory:
$$B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2 \quad (t \in [0, 1])$$
leaving a trail of golden spark particles until reaching the murti.

### 5. Procedural Web Audio Synthesizer
Zero external MP3/WAV files required! The entire soundscape is generated in real time using the browser's native **Web Audio API**:
- **Sacred Tanpura Drone**: Triple oscillator drone (108 Hz base + 162 Hz Pancham fifth + 216 Hz overtone).
- **Raag Bhupali Temple Bells**: Pentatonic chimes (528 Hz, 594 Hz, 660 Hz, 792 Hz, 880 Hz, 1056 Hz).
- **Modak Munching SFX**: Formant-filtered chewing bursts.
- **Divine Blessing Chime**: Harmonic octave shimmer with reverberation.

---

## ?? Repository Structure

```
+-- index.html            # Main web application entry point
+-- standalone.html       # Single-file bundled edition (runs directly from disk)
+-- src/
¦   +-- Vector2.js        # 2D Vector mathematics & utility methods
¦   +-- PhysicsEngine.js  # AG-04 gravity & Verlet rope solver
¦   +-- Entities.js       # Aarav, Mom, Diya, Modak & Prasad classes
¦   +-- Particles.js      # Spark, dust mote, and lotus petal visual FX
¦   +-- AudioEngine.js    # Procedural Web Audio API soundscape
¦   +-- Simulation.js     # Master loop, telemetry & catch orchestration
+-- README.md             # Project documentation
```

---

## ?? Running Locally

### Option 1: Double-Click Standalone
Simply open `standalone.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server
```bash
# Python 3
python -m http.server 8080

# Or Node.js
npx serve .
```
Navigate to `http://localhost:8080` in your browser.

---

## ??? Dedication
Created with devotion for **Ganesh Chaturthi**. May Lord Ganesha bestow wisdom, peace, and prosperity upon all!

*Built by [@Aryanpancharya-hub](https://github.com/Aryanpancharya-hub)*
