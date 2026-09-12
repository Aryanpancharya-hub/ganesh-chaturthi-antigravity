# 🪔 Ganesh Chaturthi Anti-Gravity Field [Zone ID: AG-04]

A high-fidelity, interactive gameplay physics simulation set in a festive Indian courtyard during Ganesh Chaturthi. Experience a mystical zero-gravity realm where Mom (Priya) chases her mischievous son (Aarav) under dynamic gravitational shifts and celebrates with sacred Modak offerings to Lord Ganesha.

🎮 **Live GitHub Pages Demo**: [Play Online](https://Aryanpancharya-hub.github.io/ganesh-chaturthi-antigravity/)

---

## 🌟 Game Overview

Mom (Priya) follows your mouse cursor across the traditional courtyard as she tries to catch young Aarav. Aarav is equipped with hyper-agility evasion AI, rendering catches exceptionally rare (~1 out of 100 encounters):

1. **Corner Trap Detection & Explosive Wall-Kick Long Dodge**:
   When Mom attempts to corner Aarav against courtyard haveli walls or stone pillars, Aarav detects the trap early and kicks off the wall with a high-velocity somersault vault ($v_x > 530\text{ px/s}, v_y < -470\text{ px/s}$), soaring across the courtyard far above Mom's reach!
2. **Razor-Sharp 14px Catch Threshold**:
   Mom's reaching hands must match Aarav's chest target point within a microscopic **$\le 14\text{px}$ alignment radius**.
3. **Lightning 0.12s Reflex Slide Dash**:
   Even if Mom achieves sub-14px alignment, Aarav's lightning reflexes trigger in just **$0.12\text{s}$ ($120\text{ms}$)**, slipping underneath Mom's arms unless the player hits `Shift` instantly.
4. **Sacred Dual Reward Ceremony**:
   When the rare catch succeeds:
   - **Stage 1 (Feeding Aarav)**: Mom feeds a golden modak to Aarav, who eats it with animated chewing and crumb particle effects.
   - **Stage 2 (Prasad to Lord Ganesha)**: Mom offers a sacred modak that arcs along a quadratic Bézier curve to Lord Ganesha's sanctum altar, triggering rotating golden halo rays, a divine blessing banner (*"विघ्नहर्ता का आशीर्वाद"*), and sacred temple chimes!

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **Mouse Cursor** | Guide Mom (Priya) smoothly across the courtyard |
| **Shift Key / Click "CATCH!"** | Catch Aarav when alignment locks within **$\le 14\text{px}$** |
| **Spacebar / Button** | Toggle **AG-04 Anti-Gravity Field** |
| **Q / Left Button** | Toggle West Vayu Turbine (Wind Current Generator) |
| **E / Right Button** | Toggle East Vayu Turbine (Wind Current Generator) |
| **M** | Spawn floating golden Modak |
| **D** | Spawn floating lit Diya |
| **V** | Toggle Physics Vector Debug Overlay |

---

## 🔬 Physics & Simulation Architecture

### 1. Dynamic Gravity Field Transition (AG-04)
The courtyard transitions smoothly between standard Earth gravity and a low-buoyancy levitation zone:
$$\vec{g}_{\text{normal}} = (0, -9.81, 0) \text{ m/s}^2 \quad \longleftrightarrow \quad \vec{g}_{\text{AG-04}} = (0, +4.50, 0) \text{ m/s}^2$$
A cubic smoothstep function $S(t) = 3t^2 - 2t^3$ over a $1.2\text{s}$ dampening window prevents abrupt forces, allowing props and characters to float serenely.

### 2. Hyper-Agility Evasion AI & Corner Wall-Kicks
- **Anti-Cornering Trap AI**: Senses traps when $x < 240\text{px}$ or $x > \text{width} - 240\text{px}$ and Mom is within $260\text{px}$. Launches a supersonic wall-kick long dodge toward the arena center.
- **Threat Sensing Radius ($160\text{px}$)**: Activates preemptive evasion sprints and lateral feints.
- **Airborne Mid-Air Flips**: Aarav redirects trajectory mid-air ($v_x = \pm 420\text{ px/s}$) if Mom tracks his landing zone.
- **Emergency Boundary Springs**: Touching wall limits with Mom nearby unleashes an immediate $520\text{ px/s}$ launch.

### 3. Verlet Integration Torans & Garlands
Sacred marigold flower garlands (*Genda Phool*) and mango leaves are simulated using discrete multi-segment Verlet rope physics:
$$\vec{x}_i^{t+\Delta t} = 2\vec{x}_i^t - \vec{x}_i^{t-\Delta t} + \vec{a}_i \Delta t^2$$
In normal gravity, they sag into natural catenary arcs; in anti-gravity, they gracefully arch upward toward the heavens.

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

## 📁 Repository Structure

```
├── index.html            # Main web application entry point (Modular ES)
├── standalone.html       # Single-file bundled edition (runs directly from disk)
├── src/
│   ├── Vector2.js        # 2D Vector mathematics & utility methods
│   ├── PhysicsEngine.js  # AG-04 gravity & Verlet rope solver
│   ├── Entities.js       # Aarav evasion AI, Mom kinematics, OfferingModak class
│   ├── Particles.js      # Spark, dust mote, and lotus petal visual FX
│   ├── AudioEngine.js    # Procedural Web Audio API soundscape
│   └── Simulation.js     # Master loop, 14px telemetry & catch orchestration
└── README.md             # Project documentation
```

---

## 🚀 Running Locally

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

## 🕉️ Dedication
Created with devotion for **Ganesh Chaturthi**. May Lord Ganesha bestow wisdom, peace, and prosperity upon all!

*Built by [@Aryanpancharya-hub](https://github.com/Aryanpancharya-hub)*