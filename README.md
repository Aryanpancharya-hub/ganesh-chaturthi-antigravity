# 🪔 Ganesh Chaturthi Anti-Gravity Field [Zone ID: AG-04]

A high-fidelity, interactive gameplay physics simulation set in a festive Indian courtyard during Ganesh Chaturthi. Experience a mystical zero-gravity realm where **Lord Ganesha (Ganesh Ji)** gracefully glides across the courtyard with divine kinematics to catch young Aarav, bless him with fresh sweet Modaks, and consecrate sacred offerings at the sanctum altar.

🎮 **Live GitHub Pages Demo**: [Play Online](https://Aryanpancharya-hub.github.io/ganesh-chaturthi-antigravity/)

---

## 🌟 Game Overview

In this divine edition, you directly guide **Lord Ganesha (Ganesh Ji)** with your cursor. Lord Ganesha glides with smooth, critically-damped kinematics while Aarav playfully runs and performs acrobatic evasions across the courtyard:

1. **Playable Lord Ganesha (Ganesh Ji)**:
   - **Divine Iconography**: Mukut crown with ruby kalash, majestic elephant head with fluttering pink-lobed ears, Vakratunda trunk, Ekadanta white tusk, Lambodara pot belly with sacred Yajnopavita janeu thread, and flowing golden Pitambar silk dhoti.
   - **Four Sacred Arms**: Radiating Abhaya Mudra (blessing of protection & fearlessness) and holding a freshly prepared sweet modak.
   - **Mooshak Raj**: Lord Ganesha's faithful companion mouse scampering alongside him with synchronized footwork and a tiny sweet treat.
   - **Prabhavali Halo**: Radiant aura shimmering with divine particles and sacred light.

2. **Kinematic Movement Stability & Zero Jitter**:
   - **Anti-Jitter Deadzone ($< 6\text{px}$)**: Eliminates micro-stutter by smoothly dampening target velocity to zero when cursor is hovered near Ganesh Ji.
   - **Facing Hysteresis ($> 10\text{px}$)**: Prevents erratic sprite-flipping near the cursor pivot.
   - **Critically Damped Glide**: Smooth spring-damper physics ($k = 9.5 \cdot dt$) for fluid horizontal tracking.
   - **1G Ground-Lock Stability**: Vertical position stays firmly locked to the courtyard floor ($vy = 0$) during 1G, transitioning into ethereal celestial hovering inside the AG-04 field.

3. **Aarav Medium Dodge ("Medimum Doogle") Balance**:
   - **Calibrated Run Speed**: Balanced to $210\text{ px/s}$ (down from 240 px/s) with a $125\text{px}$ danger perception radius.
   - **Manageable Corner Wall-Kick Hop**: When cornered near haveli walls, Aarav leaps with an arched wall-kick hop ($320\text{ px/s}$ and $v_y = -350\text{ px/s}$) rather than an impossible cross-screen hypersonic dash, keeping gameplay challenging yet fair!
   - **Fair 0.36s Reflex Escape**: Aarav waits $360\text{ms}$ upon lock-on before performing an escape slide, giving players ample reaction time.

4. **Improved 28px Catch Accuracy & Shift Input Buffering**:
   - **Expanded $\le 28\text{px}$ Alignment Radius**: Doubled from the old strict 14px threshold to 28px.
   - **120ms Shift Key Input Buffering**: Pressing `Shift` up to 120ms before or during alignment registers instantly with zero dropped frames.
   - **Dynamic HUD Lock-On Telemetry**: Real-time laser reticle indicators displaying `⚡ ACCURACY LOCKED (XXpx <= 28px) - PRESS SHIFT! ⚡`.

5. **Sacred Dual Reward Ceremony**:
   - **Stage 1 (Blessing & Modak to Aarav)**: Ganesh Ji feeds a sacred modak to Aarav with festive chew animations, modak crumbs, and joyful dialogues.
   - **Stage 2 (Consecration of Sanctum Altar)**: A blessed Modak travels along a parabolic quadratic Bézier curve to Lord Ganesha's altar, activating a rotating golden halo blessing aura (*"विघ्नहर्ता का आशीर्वाद"*), temple chimes, and modak counters!

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **Mouse Cursor** | Guide **Lord Ganesha (Ganesh Ji)** smoothly across the courtyard |
| **Shift Key / Click "CATCH!"** | Bless & Catch Aarav when alignment locks within **$\le 28\text{px}$** (with 120ms buffer) |
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

### 2. Spring-Damper Kinematics & Stability Solver
Lord Ganesha's tracking velocity dynamically adjusts to cursor coordinates:
$$v_{x}^{t+\Delta t} = v_x^t + (v_{\text{desired}} - v_x^t) \cdot 9.5 \Delta t$$
where $v_{\text{desired}} = 0$ when $|dx| < 6\text{px}$, guaranteeing rock-solid stability without cursor hunting.

### 3. Verlet Integration Torans & Garlands
Sacred marigold flower garlands (*Genda Phool*) and mango leaves are simulated using discrete multi-segment Verlet rope physics:
$$\vec{x}_i^{t+\Delta t} = 2\vec{x}_i^t - \vec{x}_i^{t-\Delta t} + \vec{a}_i \Delta t^2$$
In normal gravity, they sag into natural catenary arcs; in anti-gravity, they gracefully arch upward toward the heavens.

### 4. Sacred Offering Parabolic Ballistics
Modaks offered to the altar sanctum follow a quadratic Bézier trajectory:
$$B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2 \quad (t \in [0, 1])$$
leaving a trail of golden sparkles and stardust until reaching the murti.

### 5. Procedural Web Audio Synthesizer
Zero external MP3/WAV files required! The entire soundscape is generated in real time using the browser's native **Web Audio API**:
- **Sacred Tanpura Drone**: Triple oscillator drone (108 Hz base + 162 Hz Pancham fifth + 216 Hz overtone).
- **Raag Bhupali Temple Bells**: Pentatonic chimes (528 Hz, 594 Hz, 660 Hz, 792 Hz, 880 Hz, 1056 Hz).
- **Modak Munching SFX**: Formant-filtered chewing bursts.
- **Divine Blessing Chime**: Harmonic octave shimmer with reverberation.

---

## 📁 Repository Structure

```
├── index.html                  # Main web application entry point (Modular ES)
├── standalone.html             # Single-file bundled edition (runs directly from disk)
├── test_physics.py             # Gravity vector & Verlet constraint validation
├── test_rewards_and_agility.py # Ganesh Ji stability, medium dodge & 28px accuracy tests
├── src/
│   ├── Vector2.js              # 2D Vector mathematics & utility methods
│   ├── PhysicsEngine.js        # AG-04 gravity & Verlet rope solver
│   ├── Entities.js             # Aarav evasion AI, Ganesh Ji divine kinematics & Mooshak Raj
│   ├── Particles.js            # Spark, dust mote, and lotus petal visual FX
│   ├── AudioEngine.js          # Procedural Web Audio API soundscape
│   └── Simulation.js           # Master loop, 28px telemetry, shift buffer & catch orchestration
└── README.md                   # Project documentation
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