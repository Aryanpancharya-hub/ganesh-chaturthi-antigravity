# 🪔 Ganesh Ji Chases Maa Parvati - Anti-Gravity Courtyard [Zone ID: AG-04]

A high-fidelity, interactive gameplay physics simulation set in a festive Indian courtyard during Ganesh Chaturthi. Experience a mystical zero-gravity realm where **Lord Ganesha (Bal Ganesh / Ganesh Ji)** is the player-controlled chaser, eagerly following your cursor to catch **Maa Parvati (Mom)**, who playfully runs away with a golden brass *thali* of warm modaks!

🎮 **Live GitHub Pages Demo**: [Play Online](https://Aryanpancharya-hub.github.io/ganesh-chaturthi-antigravity/)

---

## 🌟 Game Overview & Inverted Roles

In this festive divine chase, the traditional roles are inverted:

1. **Player-Controlled Chaser: Lord Ganesha (Ganesh Ji / Bal Ganesh)**:
   - **Playable Character**: Follows your mouse cursor with buttery-smooth critically-damped spring kinematics ($k = 9.5 \cdot dt$), anti-jitter deadzone ($< 6\text{px}$), and facing hysteresis ($> 10\text{px}$).
   - **Reaching Gesture (`catchPoint`)**: Bal Ganesh eagerly reaches forward with his curved Vakratunda trunk and chubby hands toward Maa Parvati's brass thali.
   - **Divine Child Iconography**: Petite golden Mukut with ruby gem, cute elephant face with soft cheeks, large fluttering ears, white Ekadanta tusk, Lambodara pot belly with sacred *Yajnopavita* (Janeu thread), golden Pitambar silk dhoti, and trailing celestial Angavastram.
   - **Devoted Companion Mooshak Raj**: Lord Ganesha's faithful companion mouse scampers rhythmically beside him, cheering him on to catch the modaks!
   - **Celebratory Feast Animation**: When Ganesh Ji catches Maa Parvati, his eyes curve into joyful crescent smiles (`^ _ ^`), his mouth chews rhythmically with floating modak crumbs, glowing red hearts (`❤️`), and golden sparkle stars (*"Yay Maa! Caught you! Modaks are mine! 🥟❤️"*).

2. **Agile Autonomous Runner: Maa Parvati (Parvati Mata / Mom)**:
   - **Playful Evasion**: Maa Parvati lovingly teases her divine child (*"Catch me first, little Ganesha, then you get your modak! 🥟💨"*), dashing across the courtyard with fluid grace.
   - **Brass Modak Thali (`targetPoint`)**: Carries a shimmering golden brass plate heaped with freshly steamed warm modaks ($x + \text{facing} \cdot 24, y - 44$).
   - **Divine Mother Iconography**: Ornate golden Mukut crown, ruby crest, jasmine flower *Gajra*, red Kumkum bindi with golden sandalwood crescent, lotus eyes, shimmering crimson and golden Kanjeevaram sari, ornate golden Kamarbandh, and floating celestial Pallu veil.
   - **Multi-Tiered Evasion AI**:
     - **Sensing Radius ($185\text{px}$)**: Detects Ganesh Ji approaching and sprints away proactively ($250\text{ px/s}$).
     - **Corner Wall-Kick Leap ($500\text{ px/s}$)**: When trapped near either wall ($< 230\text{px}$), executes a breathtaking wall-kick somersault arc ($v_x = \pm 500\text{ px/s}, v_y = -450\text{ px/s}$) back into the open courtyard.
     - **Mid-Field Floor Vault ($360\text{ px/s}$)**: Leaps gracefully over Ganesh Ji when he approaches within $95\text{px}$ ($v_y = -380\text{ px/s}$).
     - **Reflex Escape Window ($120\text{ms}$)**: When alignment locks within $16\text{px}$, players have a brief $120\text{ms}$ window to press Shift before Maa Parvati gracefully darts away!

3. **Strict 16px Catch Precision & Input Buffering**:
   - **Strict $\le 16\text{px}$ Alignment Radius**: Match Ganesh Ji's reaching trunk/hand with Maa Parvati's brass modak thali.
   - **70ms Shift Key Input Buffering**: Responsive key registration for rapid reaction timing.
   - **Dynamic HUD Lock-On Telemetry**: Real-time indicator displaying `16PX LOCKED! [QUICK SHIFT]` with pulsing button illumination.

4. **Sacred Dual Reward Ceremony**:
   - **Stage 1 (Maa Parvati Feeds Ganesh Ji)**: Parvati lovingly yields, stops running, and offers delicious warm modaks to Ganesh Ji with celebratory eating animations and festive dialogue (*"Hehe little Ganesha! You caught Maa, take your sweet modaks! 🥟❤️"*).
   - **Stage 2 (Consecration of Sanctum Altar)**: A consecrated golden modak travels along a parabolic quadratic Bézier curve to the sanctum altar murti, activating rotating divine golden aura rays, temple chimes, and the triumphant banner:
     `✦ ॐ गणेशाय नमः! GANESH JI CAUGHT MAA PARVATI & WON THE BLESSED MODAK! 🙏 🥟 ✦`

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **Mouse Cursor** | Guide **Ganesh Ji** smoothly across the courtyard to chase Maa Parvati |
| **Shift Key / Click "GANESH JI CATCHES MOM"** | Catch Maa Parvati when alignment locks within **$\le 16\text{px}$** to win modaks! |
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
Bal Ganesh's tracking velocity dynamically adjusts to cursor coordinates:
$$v_{x}^{t+\Delta t} = v_x^t + (v_{\text{desired}} - v_x^t) \cdot 9.5 \Delta t$$
where $v_{\text{desired}} = 0$ when $|dx| < 6\text{px}$, guaranteeing rock-solid stability without cursor hunting or micro-jitter.

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
antigravity-field-module/
├── index.html                  # Main interactive application (Modular ES build)
├── standalone.html             # Self-contained bundle with Tailwind CSS & live Web Audio
├── README.md                   # Comprehensive documentation
├── src/
│   ├── Vector2.js              # 2D Vector mathematics & Euclidean geometry
│   ├── PhysicsEngine.js        # Gravity transition, forces & Verlet ropes
│   ├── AudioEngine.js          # Procedural Tanpura drone & Bhupali bells
│   ├── Particles.js            # Sparkles, diyas, halos & cosmic stardust
│   ├── Entities.js             # Bal Ganesh (chaser) & Parvati Mata (runner)
│   └── Simulation.js           # Scene renderer, courtyard environment & loop
├── test_physics.py             # Physics engine unit tests
├── test_rewards_and_agility.py # Inverted roles, agility & reward tests
├── test_points_match.py        # Point alignment verification
└── test_chase.py               # Evasion AI verification
```

---

## 🚀 How to Run Locally

### Option 1: Direct File (Standalone Build)
Simply double-click `standalone.html` to launch the game directly in any modern browser.

### Option 2: Local HTTP Server (Modular Build)
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```
Navigate to `http://localhost:8000` to play.