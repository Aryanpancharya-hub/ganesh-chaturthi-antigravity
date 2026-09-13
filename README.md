# 🪔 Maa Parvati & Bal Ganesh - Anti-Gravity Courtyard [Zone ID: AG-04]

A high-fidelity, interactive gameplay physics simulation set in a festive Indian courtyard during Ganesh Chaturthi. Experience a mystical zero-gravity realm where **Maa Parvati (Parvati Mata)** gracefully glides across the courtyard with divine kinematics to lovingly catch her mischievous son **Bal Ganesh (Lord Ganesha)**, feed him fresh sweet Modaks, and consecrate sacred offerings at the sanctum altar.

🎮 **Live GitHub Pages Demo**: [Play Online](https://Aryanpancharya-hub.github.io/ganesh-chaturthi-antigravity/)

---

## 🌟 Game Overview

In this divine edition, you directly guide **Maa Parvati (Parvati Mata)** with your cursor. Maa Parvati glides with smooth, critically-damped kinematics while her beloved child **Bal Ganesh (Lord Ganesha)** playfully runs, dodges, and performs acrobatic leaps across the courtyard accompanied by **Mooshak Raj**:

1. **Playable Maa Parvati (Parvati Mata)**:
   - **Divine Iconography**: Ornate golden Mukut crown with ruby crest and pearl strings, long lustrous dark hair adorned with a garland of fragrant white jasmine flowers (*Gajra*), auspicious red Kumkum bindi with golden sandalwood crescent, and kohl-lined lotus eyes.
   - **Royal Attire**: Splendid crimson-red and golden Kanjeevaram silk sari with shimmering Zari borders, cinched with an ornate golden *Kamarbandh*, and a translucent golden *Pallu* (veil) floating in the breeze.
   - **Motherly Gestures**: Reaching hands holding a steaming fresh golden modak ready to lovingly feed Bal Ganesh, and embracing arm.
   - **Prabhavali Halo**: Multi-layered celestial halo with golden rays and warm crimson aura radiating divine light.

2. **Mischievous Runner: Bal Ganesh (Lord Ganesha)**:
   - **Divine Child Iconography**: Petite golden Mukut with ruby gem, cute elephant face with soft cheeks, large fluttering ears with pink inner lobes, curved Vakratunda trunk playfully holding a modak, and cute white Ekadanta tusk.
   - **Lambodara Form**: Adorable pot belly adorned with the diagonal sacred *Yajnopavita* (Janeu thread) and golden necklace.
   - **Pitambar Silk Dhoti**: Radiant golden-yellow dhoti with saffron pleats and red borders, and a fluttering celestial scarf (Angavastram) trailing behind him.
   - **Mooshak Raj**: Lord Ganesha's devoted companion mouse scampering alongside him with synchronized steps and a tiny treat.
   - **Happy Eating Animation**: When caught, Bal Ganesh's eyes curve into happy crescents (`^ _ ^`), his mouth chews rhythmically with modak crumbs, floating red hearts (`❤️`), and golden sparkle stars!

3. **Kinematic Movement Stability & Zero Jitter**:
   - **Anti-Jitter Deadzone ($< 6\text{px}$)**: Eliminates micro-stutter by smoothly dampening target velocity to zero when cursor is hovered near Maa Parvati.
   - **Facing Hysteresis ($> 10\text{px}$)**: Prevents erratic sprite-flipping near the cursor pivot.
   - **Critically Damped Glide**: Smooth spring-damper physics ($k = 9.5 \cdot dt$) for fluid horizontal tracking.
   - **1G Ground-Lock Stability**: Vertical position stays firmly locked to the courtyard floor ($vy = 0$) during 1G, transitioning into ethereal celestial hovering inside the AG-04 field.

4. **Bal Ganesh Medium Dodge Balance**:
   - **Calibrated Run Speed**: Balanced to $210\text{ px/s}$ with a $125\text{px}$ danger perception radius.
   - **Manageable Corner Wall-Kick Hop**: When cornered near haveli walls, Bal Ganesh leaps with an arched wall-kick hop ($320\text{ px/s}$ and $v_y = -350\text{ px/s}$) rather than an impossible cross-screen hypersonic dash, keeping gameplay challenging yet fair!
   - **Fair 0.36s Reflex Escape**: Bal Ganesh waits $360\text{ms}$ upon lock-on before performing an escape slide, giving players ample reaction time.

5. **Improved 28px Catch Accuracy & Shift Input Buffering**:
   - **Expanded $\le 28\text{px}$ Alignment Radius**: Doubled from the previous strict 14px threshold to 28px.
   - **120ms Shift Key Input Buffering**: Pressing `Shift` up to 120ms before or during alignment registers instantly with zero dropped frames.
   - **Dynamic HUD Lock-On Telemetry**: Real-time laser reticle indicators displaying `⚡ ACCURACY LOCKED (XXpx <= 28px) - PRESS SHIFT! ⚡`.

6. **Sacred Dual Reward Ceremony**:
   - **Stage 1 (Maa Parvati Feeds Bal Ganesh)**: Maa Parvati embraces Bal Ganesh and feeds him sweet modaks with chew animations, modak crumbs, and joyful dialogues (*"Pranam Mata Parvati! Your modaks are the sweetest!"*).
   - **Stage 2 (Consecration of Sanctum Altar)**: A blessed Modak travels along a parabolic quadratic Bézier curve to the sanctum altar, activating rotating golden halo rays, temple chimes, and the divine blessing banner (*"✦ ॐ नमः शिवाय & गणेशाय नमः! MAA PARVATI'S BLESSINGS BESTOWED! 🙏 ✦"*).

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **Mouse Cursor** | Guide **Maa Parvati (Parvati Mata)** smoothly across the courtyard |
| **Shift Key / Click "EMBRACE"** | Embrace & Feed Bal Ganesh when alignment locks within **$\le 28\text{px}$** (with 120ms buffer) |
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
Maa Parvati's tracking velocity dynamically adjusts to cursor coordinates:
$$v_{x}^{t+\Delta t} = v_x^t + (v_{\text{desired}} - v_x^t) \cdot 9.5 \Delta t$$
where $v_{\text{desired}} = 0$ when $|dx| < 6\text{px}$, guaranteeing rock-solid stability without cursor hunting.

### 3. Verlet Integration Torans & Garlands
Sacred marigold flower garlands (*Genda Phool*) and mango leaves are simulated using discrete multi-segment Verlet rope physics:
$$\vec{x}_i^{t+\Delta t} = 2\vec{x}_i^t - \vec{x}_i^{t-\Delta t} + \vec{a}_i \Delta t^2$$
In normal gravity, they sag into natural catenary arcs; in anti-gravity, they gracefully arch upward toward the heavens.

### 4. Sacred Offering Parabolic Ballistics
Modaks offered to the sanctum altar follow a quadratic Bézier trajectory:
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
├── test_rewards_and_agility.py # Parvati Mata stability, Bal Ganesh dodge & 28px accuracy tests
├── src/
│   ├── Vector2.js              # 2D Vector mathematics & utility methods
│   ├── PhysicsEngine.js        # AG-04 gravity & Verlet rope solver
│   ├── Entities.js             # Bal Ganesh runner, Parvati Mata divine chaser & Mooshak Raj
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
Created with devotion for **Ganesh Chaturthi**. May Lord Ganesha and Maa Parvati bestow wisdom, peace, and prosperity upon all!

*Built by [@Aryanpancharya-hub](https://github.com/Aryanpancharya-hub)*