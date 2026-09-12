/**
 * AudioEngine.js - Procedural Web Audio API Soundscape
 * Ganesh Chaturthi Courtyard & Mystical Anti-Gravity Resonance
 */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Drone Nodes
    this.droneMaster = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneOsc3 = null;
    this.droneFilter = null;
    this.droneLfo = null;
    this.droneLfoGain = null;

    // Chime Nodes (Pentatonic Raag Bhupali / Ethereal Resonance: Sa, Re, Ga, Pa, Dha)
    this.chimeMaster = null;
    this.chimeDelay = null;
    this.chimeFeedback = null;
    this.chimeNotes = [528, 594, 660, 792, 880, 1056, 1188]; // Hz
    this.chimeInterval = null;

    // Wind Generator Sound Nodes
    this.windGain = null;
    this.windFilter = null;

    this.antiGravityState = 0; // 0 = 1G, 1 = AG-04 active
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupDrone();
      this.setupChimes();
      this.setupWindSound();
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setupDrone() {
    const t = this.ctx.currentTime;
    this.droneMaster = this.ctx.createGain();
    this.droneMaster.gain.setValueAtTime(0.22, t);

    // Filter - warm Indian classical tanpura resonance
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.setValueAtTime(260, t);
    this.droneFilter.Q.setValueAtTime(3.5, t);

    // Root fundamental (108 Hz - Sacred drone frequency), Fifth (162 Hz), Octave (216 Hz)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = "sawtooth";
    this.droneOsc1.frequency.setValueAtTime(108, t);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = "triangle";
    this.droneOsc2.frequency.setValueAtTime(162, t);

    this.droneOsc3 = this.ctx.createOscillator();
    this.droneOsc3.type = "sine";
    this.droneOsc3.frequency.setValueAtTime(216, t);

    // Subtly modulate drone filter for breathing courtyard atmosphere
    this.droneLfo = this.ctx.createOscillator();
    this.droneLfo.frequency.setValueAtTime(0.18, t);
    this.droneLfoGain = this.ctx.createGain();
    this.droneLfoGain.gain.setValueAtTime(45, t);
    this.droneLfo.connect(this.droneLfoGain);
    this.droneLfoGain.connect(this.droneFilter.frequency);

    // Connect
    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneOsc3.connect(this.droneFilter);
    this.droneFilter.connect(this.droneMaster);
    this.droneMaster.connect(this.ctx.destination);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.droneOsc3.start();
    this.droneLfo.start();
  }

  setupChimes() {
    const t = this.ctx.currentTime;
    this.chimeMaster = this.ctx.createGain();
    this.chimeMaster.gain.setValueAtTime(0.0, t); // starts muted until AG-04 activates

    // Stereo ping-pong feedback delay line
    this.chimeDelay = this.ctx.createDelay();
    this.chimeDelay.delayTime.setValueAtTime(0.38, t);

    this.chimeFeedback = this.ctx.createGain();
    this.chimeFeedback.gain.setValueAtTime(0.42, t);

    this.chimeDelay.connect(this.chimeFeedback);
    this.chimeFeedback.connect(this.chimeDelay);

    this.chimeDelay.connect(this.chimeMaster);
    this.chimeMaster.connect(this.ctx.destination);
  }

  setupWindSound() {
    // Generate filtered pink noise for wind-current generators
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    whiteNoise.start();
  }

  setAntiGravityTransition(progress) {
    if (!this.isInitialized || !this.ctx) return;
    this.antiGravityState = progress;
    const t = this.ctx.currentTime;

    // Shift drone lowpass filter from 260 Hz (1G warm earthy drone) up to 1800 Hz (mystical shimmer)
    const droneCutoff = 260 + progress * 1540;
    this.droneFilter.frequency.setTargetAtTime(droneCutoff, t, 0.1);

    // Chime presence fades in
    const chimeGain = progress * 0.32;
    this.chimeMaster.gain.setTargetAtTime(this.isMuted ? 0 : chimeGain, t, 0.1);

    // Trigger procedural chime sparkles when entering AG-04
    if (progress > 0.4 && !this.chimeInterval) {
      this.startChimeLoop();
    } else if (progress <= 0.2 && this.chimeInterval) {
      this.stopChimeLoop();
    }
  }

  startChimeLoop() {
    if (this.chimeInterval) return;
    this.chimeInterval = setInterval(() => {
      if (this.antiGravityState > 0.3 && !this.isMuted) {
        const note = this.chimeNotes[Math.floor(Math.random() * this.chimeNotes.length)];
        this.playTempleChime(note, 0.25 + Math.random() * 0.2);
      }
    }, 450);
  }

  stopChimeLoop() {
    if (this.chimeInterval) {
      clearInterval(this.chimeInterval);
      this.chimeInterval = null;
    }
  }

  playTempleChime(freq, gainLevel = 0.3) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    // Add high crystal harmonic
    const harmonic = this.ctx.createOscillator();
    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(freq * 2.76, t); // Tibetan singing bowl / Indian bell harmonic
    const harmGain = this.ctx.createGain();
    harmGain.gain.setValueAtTime(gainLevel * 0.25, t);

    gain.gain.setValueAtTime(gainLevel, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    osc.connect(gain);
    harmonic.connect(harmGain);
    harmGain.connect(gain);

    gain.connect(this.chimeMaster);
    gain.connect(this.chimeDelay);

    osc.start(t);
    harmonic.start(t);
    osc.stop(t + 2.5);
    harmonic.stop(t + 2.5);
  }

  playDashWhoosh(velocityMagnitude) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.35);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(Math.min(0.4, velocityMagnitude * 0.0007), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  playLeverClick() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  setWindGeneratorVolume(activeCount) {
    if (!this.ctx || !this.windGain) return;
    const target = this.isMuted ? 0 : Math.min(0.28, activeCount * 0.14);
    this.windGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  playPropBounce() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freqs = [784, 880, 1046, 1175];
    const f = freqs[Math.floor(Math.random() * freqs.length)];

    osc.type = "sine";
    osc.frequency.setValueAtTime(f, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  playModakMunch() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const startT = t + i * 0.09;
      osc.frequency.setValueAtTime(420 + i * 90, startT);
      osc.frequency.exponentialRampToValueAtTime(180, startT + 0.07);
      gain.gain.setValueAtTime(0.24, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.075);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.08);
    }
  }

  playDivineBlessingChime() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Multi-harmonic temple bell chord: Sa (528), Pa (792), Tar Sa (1056), Tar Ga (1320)
    const chordNotes = [528, 792, 1056, 1320];
    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const harmGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      harmonic.type = "triangle";
      harmonic.frequency.setValueAtTime(freq * 2.76, t + idx * 0.08);

      const noteGain = 0.26 / (idx + 1);
      harmGain.gain.setValueAtTime(noteGain * 0.35, t + idx * 0.08);
      gain.gain.setValueAtTime(noteGain, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 3.2);

      osc.connect(gain);
      harmonic.connect(harmGain);
      harmGain.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      harmonic.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 3.3);
      harmonic.stop(t + idx * 0.08 + 3.3);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.droneMaster) {
      this.droneMaster.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
      this.chimeMaster.gain.setValueAtTime(this.isMuted ? 0 : this.antiGravityState * 0.32, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
