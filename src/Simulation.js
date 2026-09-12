/**
 * Simulation.js - Main Canvas simulation renderer and scene orchestrator
 * Traditional Indian Courtyard during Ganesh Chaturthi & Mystical Anti-Gravity Realm
 */
import { PhysicsEngine } from "./PhysicsEngine.js";
import { ParticleSystem } from "./Particles.js";
import { AudioEngine } from "./AudioEngine.js";
import { Boy, Mom, Toran, Modak, Diya, Lever, WindGenerator, OfferingModak } from "./Entities.js";
import { Vector2 } from "./Vector2.js";

export class CourtyardSimulation {
  constructor(canvas, telemetryCallback = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.telemetryCallback = telemetryCallback;

    this.width = canvas.width;
    this.height = canvas.height;

    // Subsystems
    this.physics = new PhysicsEngine(this.width, this.height);
    this.particles = new ParticleSystem(this.width, this.height);
    this.audio = new AudioEngine();

    // Input state
    this.cursorPos = new Vector2(this.width / 2, this.height / 2);
    this.isCursorActive = false;
    this.debugVectors = false;

    // Entities
    this.initEntities();

    // Loop
    this.lastTime = performance.now();
    this.isRunning = false;

    this.bindEvents();
  }

  initEntities() {
    // 1. Characters
    this.boy = new Boy(this.width * 0.48, this.physics.groundY);
    this.mom = new Mom(this.width * 0.28, this.physics.groundY);

    // 2. Torans (Festive marigold garlands strung between courtyard pillars)
    this.torans = [
      new Toran(80, 110, this.width * 0.5 - 20, 110, 16),
      new Toran(this.width * 0.5 + 20, 110, this.width - 80, 110, 16),
      new Toran(160, 160, this.width - 160, 160, 20),
    ];

    // 3. Wall Levers (for toggling AG-04)
    this.levers = [
      new Lever(80, this.physics.groundY - 55, "LEVER-WEST"),
      new Lever(this.width - 80, this.physics.groundY - 55, "LEVER-EAST"),
    ];

    // 4. Wind-Current Generators (Vayu Pedestals)
    this.windGenerators = [
      new WindGenerator(60, this.physics.groundY - 140, 1),      // blows right
      new WindGenerator(this.width - 60, this.physics.groundY - 140, -1), // blows left
    ];

    // 5. Dynamic Props (Modaks and Diyas)
    this.modaks = [];
    this.diyas = [];

    // Spawn initial offering of modaks on brass plate
    for (let i = 0; i < 7; i++) {
      this.modaks.push(new Modak(this.width * 0.45 + (i - 3) * 16, this.physics.groundY - 10));
    }

    // Sacred diyas along courtyard floor and altar
    for (let i = 0; i < 5; i++) {
      this.diyas.push(new Diya(140 + i * 180, this.physics.groundY - 4));
    }

    // 6. Sacred Offerings & Reward Tracking
    this.offeringModaks = [];
    this.prasadGaneshCount = 0;
    this.aaravModakCount = 0;
    this.altarBlessingTimer = 0;
  }

  bindEvents() {
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.cursorPos.set((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      this.isCursorActive = true;
      this.audio.init();
      this.audio.resume();
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.isCursorActive = false;
    });

    this.canvas.addEventListener("click", (e) => {
      this.audio.init();
      this.audio.resume();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // 1. Check Levers
      for (const lever of this.levers) {
        if (lever.isClicked(clickX, clickY)) {
          lever.toggle(this.physics, this.audio);
          this.particles.addDistortionWave(lever.pos.x, lever.pos.y, 160, 1.4);
          return;
        }
      }

      // 2. Check Wind Generators
      for (const fan of this.windGenerators) {
        if (fan.isClicked(clickX, clickY)) {
          fan.toggle();
          this.audio.playLeverClick();
          this.audio.setWindGeneratorVolume(this.getActiveWindCount());
          return;
        }
      }

      // 3. If points matched, click can also catch!
      if (this.mom && this.boy && this.mom.catchPoint.distanceTo(this.boy.targetPoint) <= 26) {
        if (this.attemptCatch()) return;
      }

      // 4. Click near boy triggers aerial dash
      const distToBoy = Math.hypot(clickX - this.boy.pos.x, clickY - this.boy.pos.y);
      if (distToBoy < 160) {
        const dir = this.boy.pos.clone().sub(new Vector2(clickX, clickY)).normalize();
        this.boy.triggerAerialDash(dir, 680, this.particles, this.audio);
        this.particles.addDistortionWave(clickX, clickY, 130, 1.2);
        return;
      }

      // 5. Click elsewhere adds gravitational distortion ripple
      this.particles.addDistortionWave(clickX, clickY, 110, 0.9);
    });

    // Press Shift key to catch when points match
    window.addEventListener("keydown", (e) => {
      if (e.key === "Shift") {
        this.attemptCatch();
      }
    });
  }

  attemptCatch() {
    if (!this.mom || !this.boy) return false;
    const dist = this.mom.catchPoint.distanceTo(this.boy.targetPoint);
    if (dist <= 26 && !this.boy.isCaught) {
      this.mom.triggerCatchSuccess(this.boy);
      this.boy.triggerCaught(this.mom);

      // Stage 1: Mom feeds Aarav sweet modak reward
      this.aaravModakCount++;
      this.audio.playModakMunch();

      // Festive bell fanfare
      this.audio.playTempleChime(528, 0.4);
      setTimeout(() => this.audio.playTempleChime(660, 0.4), 110);
      setTimeout(() => this.audio.playTempleChime(792, 0.4), 220);
      setTimeout(() => this.audio.playTempleChime(1056, 0.5), 330);

      // Celebration FX on contact
      this.particles.addDistortionWave(this.boy.targetPoint.x, this.boy.targetPoint.y, 160, 1.6);
      for (let i = 0; i < 22; i++) {
        this.particles.addSparkle(this.boy.targetPoint.x, this.boy.targetPoint.y, "#fde047");
      }

      // Stage 2: Sacred Offering Modak ascends to Lord Ganesha's Altar!
      setTimeout(() => {
        const startX = this.mom.catchPoint.x;
        const startY = this.mom.catchPoint.y;
        const targetX = this.width * 0.5;
        const targetY = this.physics.groundY - 26; // Lord Ganesha's brass thaali

        const offering = new OfferingModak(startX, startY, targetX, targetY, () => {
          // Offering arrives at Lord Ganesha's altar platter!
          this.prasadGaneshCount++;
          this.altarBlessingTimer = 3.2; // Divine blessing aura active
          this.audio.playDivineBlessingChime();
          this.particles.addDistortionWave(targetX, targetY - 20, 260, 2.4);
          for (let s = 0; s < 36; s++) {
            this.particles.addSparkle(targetX + (Math.random() - 0.5) * 70, targetY - 25 + (Math.random() - 0.5) * 50, "#fde047");
          }
          // Add physical modak to Lord Ganesha's altar thaali
          this.modaks.push(new Modak(targetX + (Math.random() - 0.5) * 28, targetY - 6));
        });

        this.offeringModaks.push(offering);
      }, 750);

      return true;
    }
    return false;
  }

  getActiveWindCount() {
    return this.windGenerators.filter((f) => f.isActive).length;
  }

  spawnModak(x, y) {
    this.modaks.push(new Modak(x || this.width * 0.5 + (Math.random() - 0.5) * 100, y || this.physics.groundY - 120));
    this.particles.addSparkle(x || this.width * 0.5, y || this.physics.groundY - 120, "#fbbf24");
    this.audio.playPropBounce();
  }

  spawnDiya(x, y) {
    this.diyas.push(new Diya(x || this.width * 0.5 + (Math.random() - 0.5) * 100, y || this.physics.groundY - 100));
    this.particles.addSparkle(x || this.width * 0.5, y || this.physics.groundY - 100, "#f97316");
  }

  toggleAntiGravity() {
    this.audio.init();
    this.audio.resume();
    this.physics.toggleAntiGravity();
    for (const lever of this.levers) {
      lever.targetAngle = this.physics.isAntiGravityActive ? 0.6 : -0.6;
    }
    this.audio.playLeverClick();
    this.particles.addDistortionWave(this.width / 2, this.height / 2, 280, 1.6);
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  stop() {
    this.isRunning = false;
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min(0.033, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // 1. Physics Engine Global Step
    this.physics.update(dt);
    const agFactor = this.physics.getDampenedProgress();
    const effectiveGravityY = this.physics.getCurrentGravityY();

    // 2. Audio Engine transition sync
    this.audio.setAntiGravityTransition(agFactor);

    // 3. Characters Step
    // Mom follows and behaves according to mouse cursor
    this.mom.update(dt, this.cursorPos, this.isCursorActive, this.physics, this.audio, this.boy);

    // Aarav runs automatically
    this.physics.applyForces(this.boy, dt);
    this.boy.update(dt, this.physics, this.particles, this.audio, this.mom);

    // Check Body Target Points Match! (Strict 26px high-agility threshold)
    const distPoints = this.mom.catchPoint.distanceTo(this.boy.targetPoint);
    const isMatched = distPoints <= 26 && !this.boy.isCaught;
    this.mom.isPointMatched = isMatched;
    this.boy.isPointMatched = isMatched;

    // 4. Wind Generators
    const allProps = [...this.modaks, ...this.diyas];
    for (const fan of this.windGenerators) {
      fan.update(dt, this.particles, this.boy, allProps);
    }

    // 5. Dynamic Props (Modaks & Diyas)
    for (const modak of this.modaks) {
      this.physics.applyForces(modak, dt);
      modak.update(dt, this.physics, this.audio);
      // Interaction with boy
      if (this.boy.pos.distanceTo(modak.pos) < this.boy.radius + modak.radius) {
        modak.vel.add(this.boy.vel.clone().multiplyScalar(0.4));
        this.particles.addSparkle(modak.pos.x, modak.pos.y, "#fef08a");
      }
    }

    for (const diya of this.diyas) {
      this.physics.applyForces(diya, dt);
      diya.update(dt, this.physics, this.particles);
    }

    // 6. Sacred Offering Modaks Flight to Ganesh Ji
    for (let i = this.offeringModaks.length - 1; i >= 0; i--) {
      const off = this.offeringModaks[i];
      off.update(dt, this.particles, this.audio);
      if (off.isFinished) {
        this.offeringModaks.splice(i, 1);
      }
    }

    // Altar Blessing Timer
    this.altarBlessingTimer = Math.max(0, this.altarBlessingTimer - dt);

    // 7. Torans (Verlet Rope Strings)
    // In 1G they sag down, in AG-04 they invert and float upwards!
    const windPushX = (this.windGenerators[0].isActive ? 90 : 0) + (this.windGenerators[1].isActive ? -90 : 0);
    for (const toran of this.torans) {
      toran.update(dt, effectiveGravityY, windPushX);
      toran.interactWithBody(this.boy.pos, 35);
    }

    // 8. Levers
    for (const lever of this.levers) {
      lever.update(dt);
    }

    // 9. Visual Particles
    this.particles.update(dt, agFactor, this.cursorPos.x, this.cursorPos.y, this.isCursorActive);

    // 10. Telemetry Update
    if (this.telemetryCallback) {
      this.telemetryCallback({
        gravityVectorStr: this.physics.getPhysicalGravityVectorString(),
        isAntiGravity: this.physics.isAntiGravityActive,
        transitionProgress: agFactor,
        boyVelocity: this.boy.vel.length(),
        boyState: this.boy.state,
        boyMomentum: `(${this.boy.floatingMomentum.x.toFixed(1)}, ${this.boy.floatingMomentum.y.toFixed(1)})`,
        propsCount: this.modaks.length + this.diyas.length,
        windActive: this.getActiveWindCount(),
        pointsDistance: Math.round(distPoints),
        pointsMatched: isMatched,
        isCaught: this.boy.isCaught,
        caughtCount: this.boy.caughtCount,
        aaravModakCount: this.aaravModakCount,
        prasadGaneshCount: this.prasadGaneshCount,
        altarBlessing: this.altarBlessingTimer > 0,
        momState: this.mom.state,
        boySpeech: this.boy.speechText,
        momSpeech: this.mom.speechText,
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const agFactor = this.physics.getDampenedProgress();

    // 1. Draw Traditional Indian Haveli Courtyard Environment
    this.drawCourtyardBackground(ctx, agFactor);

    // 2. Draw Anti-Gravity Sector (AG-04) Mystic Portal Bounds & Shimmer
    this.drawAntiGravityZoneFX(ctx, agFactor);

    // 3. Draw Sanctum & Festive Altar (with Lord Ganesha Murti and Divine Aura)
    this.drawSanctumAltar(ctx, agFactor);

    // 4. Draw Torans (Marigold Garlands)
    for (const toran of this.torans) {
      toran.draw(ctx);
    }

    // 5. Draw Wind Generators & Levers
    for (const fan of this.windGenerators) {
      fan.draw(ctx);
    }
    for (const lever of this.levers) {
      lever.draw(ctx, this.physics.isAntiGravityActive);
    }

    // 6. Draw Props (Diyas & Modaks)
    for (const diya of this.diyas) {
      diya.draw(ctx);
    }
    for (const modak of this.modaks) {
      modak.draw(ctx);
    }

    // 7. Draw Sacred Offering Modaks Flight to Ganesh Ji
    for (const off of this.offeringModaks) {
      off.draw(ctx);
    }

    // 8. Draw Characters (Mom & Boy)
    this.mom.draw(ctx);
    this.boy.draw(ctx, this.debugVectors);

    // 8. Draw Point Matching Alignment Guide & Catch Prompt
    this.drawPointAlignmentGuide(ctx);

    // 9. Draw Visual FX (Golden Motes, Lotus Petals, Distortion Waves)
    this.particles.draw(ctx, agFactor, this.cursorPos.x, this.cursorPos.y, this.isCursorActive);

    // 10. Draw Cursor Reticle
    this.drawCursorReticle(ctx);
  }

  drawCourtyardBackground(ctx, agFactor) {
    // Twilight festival sky transitioning into mystical floating realm
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (agFactor > 0.05) {
      // Mystical realm transition: Deep cosmic indigo to radiant celestial violet/gold
      skyGrad.addColorStop(0, "#0b0826");
      skyGrad.addColorStop(0.4, "#1e1147");
      skyGrad.addColorStop(0.8, "#3b1764");
      skyGrad.addColorStop(1, "#180c2e");
    } else {
      // Traditional Indian twilight: Deep indigo to warm saffron dusk
      skyGrad.addColorStop(0, "#0f172a");
      skyGrad.addColorStop(0.5, "#1e1b4b");
      skyGrad.addColorStop(0.85, "#431407");
      skyGrad.addColorStop(1, "#1c1917");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars and Crescent Moon in open courtyard roof
    ctx.save();
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 35; i++) {
      const sx = ((i * 97) % (this.width - 200)) + 100;
      const sy = (i * 47) % 150 + 20;
      const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.003 + i);
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3 === 0 ? 1.8 : 1.0), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
      ctx.fill();
    }

    // Festive Crescent Moon
    ctx.beginPath();
    ctx.arc(this.width * 0.82, 70, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#fef08a";
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 15;
    ctx.fill();
    // Moon cutout
    ctx.beginPath();
    ctx.arc(this.width * 0.82 + 8, 66, 20, 0, Math.PI * 2);
    ctx.fillStyle = agFactor > 0.05 ? "#1e1147" : "#0f172a";
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();

    // Courtyard Architecture: Arched Haveli Sandstone Pillars & Jharokha Screens
    this.drawCourtyardPillars(ctx);

    // Stepped Courtyard Floor with Sandstone Tiles & Central Floral Rangoli
    this.drawCourtyardFloor(ctx);
  }

  drawCourtyardPillars(ctx) {
    ctx.save();

    // Ornate Carved Pillars on Left and Right
    const pillarWidth = 44;
    const leftPillarX = 50;
    const rightPillarX = this.width - 50;

    // Pillar Grand Columns
    ctx.fillStyle = "#78350f"; // Rajasthani red/yellow sandstone
    ctx.fillRect(leftPillarX - pillarWidth / 2, 80, pillarWidth, this.physics.groundY - 80);
    ctx.fillRect(rightPillarX - pillarWidth / 2, 80, pillarWidth, this.physics.groundY - 80);

    // Stone decorative fluting & highlights
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    for (let offset of [-14, -5, 5, 14]) {
      ctx.beginPath();
      ctx.moveTo(leftPillarX + offset, 100);
      ctx.lineTo(leftPillarX + offset, this.physics.groundY - 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightPillarX + offset, 100);
      ctx.lineTo(rightPillarX + offset, this.physics.groundY - 20);
      ctx.stroke();
    }

    // Pillar Capital & Carved Brackets
    for (let px of [leftPillarX, rightPillarX]) {
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.moveTo(px - 34, 80);
      ctx.lineTo(px + 34, 80);
      ctx.lineTo(px + 22, 105);
      ctx.lineTo(px - 22, 105);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Top Haveli Arch connecting pillars
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, 85);
    ctx.quadraticCurveTo(this.width * 0.25, 45, this.width * 0.5, 45);
    ctx.quadraticCurveTo(this.width * 0.75, 45, this.width, 85);
    ctx.stroke();

    ctx.restore();
  }

  drawCourtyardFloor(ctx) {
    ctx.save();
    // Courtyard Floor Base
    ctx.fillStyle = "#292524"; // Polished stone tiles
    ctx.fillRect(0, this.physics.groundY, this.width, this.height - this.physics.groundY);

    // Floor Border Inlay
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.physics.groundY);
    ctx.lineTo(this.width, this.physics.groundY);
    ctx.stroke();

    // Central Ganesh Chaturthi Rangoli (Geometric Petal Mandala)
    const rx = this.width * 0.5;
    const ry = this.physics.groundY + 28;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale(1.0, 0.45); // Perspective oval

    // Rangoli Outer Ring
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.stroke();

    // Yellow Marigold Petal Ring
    ctx.fillStyle = "#fbbf24";
    for (let a = 0; a < 12; a++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.ellipse(0, 70, 8, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner White Chalk / Rice Flour Mandala Ring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Rose Petal Center
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  drawSanctumAltar(ctx, agFactor) {
    ctx.save();
    const ax = this.width * 0.5;
    const ay = this.physics.groundY - 45;

    // Altar Stone Pedestal
    ctx.fillStyle = "#451a03";
    ctx.fillRect(ax - 60, ay + 15, 120, 30);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(ax - 60, ay + 15, 120, 30);

    // Decorative Mandap Arch behind Lord Ganesha
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ax, ay + 10, 48, Math.PI, 0);
    ctx.stroke();

    // Lord Ganesha Brass Murti / Idol (Silhouette with golden aura)
    ctx.save();
    ctx.translate(ax, ay + 8);
    const ganeshaGlow = 8 + agFactor * 14;
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = ganeshaGlow;

    // Golden Body
    ctx.fillStyle = "#f59e0b";
    // Crown (Mukut)
    ctx.beginPath();
    ctx.moveTo(-9, -24);
    ctx.lineTo(9, -24);
    ctx.lineTo(0, -38);
    ctx.closePath();
    ctx.fill();

    // Head & Large Ears
    ctx.beginPath();
    ctx.arc(0, -14, 11, 0, Math.PI * 2);
    ctx.arc(-13, -15, 8, 0, Math.PI * 2); // Left ear
    ctx.arc(13, -15, 8, 0, Math.PI * 2);  // Right ear
    ctx.fill();

    // Trunk (Vakratunda)
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.quadraticCurveTo(-4, -4, -6, 2);
    ctx.quadraticCurveTo(-2, 5, 2, 4);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f59e0b";
    ctx.stroke();

    // Big Belly (Lambodara)
    ctx.beginPath();
    ctx.arc(0, 4, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Brass Thaali (Offering platter of Modaks) on pedestal
    ctx.beginPath();
    ctx.ellipse(ax, ay + 20, 36, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#eab308";
    ctx.fill();
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Divine Blessing Aura when Sacred Modak is Offered to Ganesh Ji!
    if (this.altarBlessingTimer > 0) {
      const tBless = this.altarBlessingTimer;
      const pulse = Math.sin(Date.now() * 0.009) * 0.15 + 0.85;

      // Rotating Golden Halo Rays
      ctx.save();
      ctx.translate(ax, ay - 10);
      ctx.rotate(Date.now() * 0.0012);
      for (let r = 0; r < 12; r++) {
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = `rgba(251, 191, 36, ${0.35 * pulse * Math.min(1, tBless / 1.5)})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-14, -85);
        ctx.lineTo(14, -85);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Pulsing Outer Sanctum Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay - 8, 70 + (3.2 - tBless) * 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 * Math.min(1, tBless)})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.restore();

      // Floating Divine Blessing Banner
      ctx.save();
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 14;
      ctx.fillText("✦ ॐ GANPATI BAPPA MORYA! PRASAD OFFERED! 🙏 ✦", ax, ay - 75);
      ctx.restore();
    }

    ctx.restore();
  }

  drawAntiGravityZoneFX(ctx, agFactor) {
    if (agFactor <= 0.01) return;

    ctx.save();
    const sec = this.physics.sector;

    // Volumetric mystical light shaft in AG-04 Sector
    const zoneGrad = ctx.createLinearGradient(0, sec.y + sec.height, 0, sec.y);
    zoneGrad.addColorStop(0, `rgba(56, 189, 248, ${0.08 * agFactor})`);
    zoneGrad.addColorStop(0.5, `rgba(251, 191, 36, ${0.12 * agFactor})`);
    zoneGrad.addColorStop(1, `rgba(168, 85, 247, ${0.15 * agFactor})`);
    ctx.fillStyle = zoneGrad;
    ctx.fillRect(sec.x, sec.y, sec.width, sec.height);

    // Glowing AG-04 Boundary Lines (Left and Right Portal Thresholds)
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 * agFactor})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);

    // Left boundary
    ctx.beginPath();
    ctx.moveTo(sec.x, sec.y);
    ctx.lineTo(sec.x, sec.y + sec.height);
    ctx.stroke();

    // Right boundary
    ctx.beginPath();
    ctx.moveTo(sec.x + sec.width, sec.y);
    ctx.lineTo(sec.x + sec.width, sec.y + sec.height);
    ctx.stroke();

    // Shimmering Sector Header Marker
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.8 * agFactor})`;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("▲ ANTI-GRAVITY FIELD ZONE: AG-04 (VECTOR: (0, +4.5, 0)) ▲", this.width / 2, sec.y + 14);

    ctx.restore();
  }

  drawPointAlignmentGuide(ctx) {
    if (!this.mom || !this.boy) return;
    const cp = this.mom.catchPoint;
    const tp = this.boy.targetPoint;
    const dist = cp.distanceTo(tp);
    const isMatched = dist <= 26;

    // Show proximity alignment tether when characters are near
    if (dist < 150) {
      ctx.save();
      // Connecting beam
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y);
      ctx.lineTo(tp.x, tp.y);
      ctx.lineWidth = isMatched ? 3.0 : 1.5;
      ctx.strokeStyle = isMatched 
        ? "rgba(74, 222, 128, 0.9)" 
        : "rgba(251, 191, 36, 0.45)";
      if (!isMatched) ctx.setLineDash([4, 4]);
      ctx.stroke();

      // If MATCHED: show lock-on reticle and prominent press shift prompt!
      if (isMatched && !this.boy.isCaught) {
        const midX = (cp.x + tp.x) / 2;
        const midY = Math.min(cp.y, tp.y) - 26;

        // Lock-on rotating halo
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 16 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.stroke();

        // Prompt Banner
        ctx.font = "bold 11px system-ui, sans-serif";
        const promptText = "⚡ MATCHED! PRESS SHIFT TO CATCH! ⚡";
        const tw = ctx.measureText(promptText).width;
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.roundRect(midX - tw / 2 - 12, midY - 14, tw + 24, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#4ade80";
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 10;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(promptText, midX, midY - 1);
      }
      ctx.restore();
    }
  }

  drawCursorReticle(ctx) {
    if (!this.isCursorActive) return;
    ctx.save();
    const cx = this.cursorPos.x;
    const cy = this.cursorPos.y;

    // Repulsion Target Rings
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    // Proximity line to boy
    const dist = this.cursorPos.distanceTo(this.boy.pos);
    if (dist < 260) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(this.boy.pos.x, this.boy.pos.y);
      ctx.strokeStyle = dist < this.boy.repulsionRadius ? "rgba(244, 63, 94, 0.65)" : "rgba(251, 191, 36, 0.35)";
      ctx.lineWidth = dist < this.boy.repulsionRadius ? 2 : 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }

    ctx.restore();
  }
}
