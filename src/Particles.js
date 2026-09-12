/**
 * Particles.js - Visual FX for Anti-Gravity Field
 * Golden dust motes, upward-drifting glowing lotus petals, and gravitational distortion waves
 */
export class ParticleSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.goldenMotes = [];
    this.lotusPetals = [];
    this.distortionWaves = [];
    this.dashTrails = [];
    this.windParticles = [];
    this.sparkles = [];

    this.initMotes(90);
    this.initLotusPetals(45);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  initMotes(count) {
    this.goldenMotes = [];
    for (let i = 0; i < count; i++) {
      this.goldenMotes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 15,
        vy: -10 - Math.random() * 25,
        baseSize: 1.0 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }
  }

  initLotusPetals(count) {
    this.lotusPetals = [];
    for (let i = 0; i < count; i++) {
      this.lotusPetals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 20,
        vy: -20 - Math.random() * 40,
        size: 7 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.4 + Math.random() * 0.5,
        hue: 330 + Math.random() * 30, // Sacred pink-magenta lotus colors
      });
    }
  }

  addDistortionWave(x, y, maxRadius = 140, intensity = 1.0) {
    this.distortionWaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      intensity,
      alpha: 0.85,
      speed: 160 + intensity * 60,
    });
  }

  addDashTrail(x, y, vx, vy) {
    for (let i = 0; i < 4; i++) {
      this.dashTrails.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: -vx * 0.25 + (Math.random() - 0.5) * 40,
        vy: -vy * 0.25 + (Math.random() - 0.5) * 40,
        size: 3 + Math.random() * 4,
        life: 1.0,
        decay: 2.2 + Math.random() * 1.5,
      });
    }
  }

  addWindParticle(x, y, dirX, dirY, speed = 280) {
    this.windParticles.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 28,
      vx: dirX * (speed + (Math.random() - 0.5) * 60),
      vy: dirY * speed + (Math.random() - 0.5) * 30,
      length: 12 + Math.random() * 16,
      life: 1.0,
      decay: 1.2 + Math.random() * 0.8,
    });
  }

  addSparkle(x, y, color = "#fbbf24") {
    for (let i = 0; i < 3; i++) {
      this.sparkles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        size: 2 + Math.random() * 3,
        color,
        life: 1.0,
        decay: 2.0,
      });
    }
  }

  update(dt, agFactor, cursorX, cursorY, isCursorActive) {
    // 1. Update Golden Motes
    for (const m of this.goldenMotes) {
      m.phase += dt * m.speed;
      m.x += m.vx * dt + Math.sin(m.phase) * 12 * dt;
      // In AG-04, motes ascend faster and float higher
      const verticalLift = agFactor > 0.05 ? -45 * agFactor : -12;
      m.y += (m.vy + verticalLift) * dt;

      // Wrap-around
      if (m.y < -10) {
        m.y = this.height + 10;
        m.x = Math.random() * this.width;
      } else if (m.y > this.height + 10) {
        m.y = -10;
      }
      if (m.x < -10) m.x = this.width + 10;
      if (m.x > this.width + 10) m.x = -10;
    }

    // 2. Update Lotus Petals (Ascend vividly in AG-04)
    for (const p of this.lotusPetals) {
      p.phase += dt * 1.5;
      p.angle += p.vRot * dt;
      p.x += (p.vx + Math.sin(p.phase) * 25) * dt;
      const agLift = agFactor > 0.05 ? -95 * agFactor : -18;
      p.y += (p.vy + agLift) * dt;

      if (p.y < -30) {
        p.y = this.height + 30;
        p.x = Math.random() * this.width;
      }
      if (p.x < -30) p.x = this.width + 30;
      if (p.x > this.width + 30) p.x = -30;
    }

    // 3. Update Distortion Waves
    for (let i = this.distortionWaves.length - 1; i >= 0; i--) {
      const w = this.distortionWaves[i];
      w.radius += w.speed * dt;
      w.alpha -= dt * (w.speed / w.maxRadius);
      if (w.radius >= w.maxRadius || w.alpha <= 0) {
        this.distortionWaves.splice(i, 1);
      }
    }

    // Ambient continuous cursor distortion wave
    if (isCursorActive && Math.random() < 0.25) {
      this.distortionWaves.push({
        x: cursorX,
        y: cursorY,
        radius: 10,
        maxRadius: 110,
        intensity: 0.6,
        alpha: 0.5,
        speed: 95,
      });
    }

    // 4. Update Dash Trails
    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      const t = this.dashTrails[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.life -= t.decay * dt;
      if (t.life <= 0) {
        this.dashTrails.splice(i, 1);
      }
    }

    // 5. Update Wind Particles
    for (let i = this.windParticles.length - 1; i >= 0; i--) {
      const wp = this.windParticles[i];
      wp.x += wp.vx * dt;
      wp.y += wp.vy * dt;
      wp.life -= wp.decay * dt;
      if (wp.life <= 0 || wp.x < 0 || wp.x > this.width) {
        this.windParticles.splice(i, 1);
      }
    }

    // 6. Update Sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= sp.decay * dt;
      if (sp.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  draw(ctx, agFactor, cursorX, cursorY, isCursorActive) {
    ctx.save();

    // 1. Draw Golden Motes
    for (const m of this.goldenMotes) {
      const flicker = 0.7 + 0.3 * Math.sin(m.phase * 2);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.baseSize * (1 + agFactor * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${m.alpha * flicker})`;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 6 * (1 + agFactor);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 2. Draw Glowing Lotus Petals
    for (const p of this.lotusPetals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      const glow = agFactor > 0.1 ? 8 : 2;
      ctx.shadowColor = `hsl(${p.hue}, 90%, 65%)`;
      ctx.shadowBlur = glow;

      // Draw stylized tear/petal curve
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.75, -p.size * 0.3, p.size * 0.6, p.size * 0.7, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.7, -p.size * 0.75, -p.size * 0.3, 0, -p.size);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
      grad.addColorStop(0, `hsla(${p.hue}, 95%, 80%, ${p.alpha})`);
      grad.addColorStop(0.6, `hsla(${p.hue - 15}, 85%, 65%, ${p.alpha * 0.9})`);
      grad.addColorStop(1, `hsla(45, 90%, 65%, ${p.alpha * 0.8})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Central vein line
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.7);
      ctx.lineTo(0, p.size * 0.6);
      ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.6})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Draw Wind Particles
    ctx.lineWidth = 2;
    for (const wp of this.windParticles) {
      ctx.strokeStyle = `rgba(253, 224, 71, ${wp.life * 0.55})`;
      ctx.beginPath();
      ctx.moveTo(wp.x, wp.y);
      ctx.lineTo(wp.x - (wp.vx / 280) * wp.length, wp.y - (wp.vy / 280) * wp.length);
      ctx.stroke();
    }

    // 4. Draw Dash Trails
    for (const t of this.dashTrails) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${t.life * 0.8})`;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 5. Draw Sparkles
    for (const sp of this.sparkles) {
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.fill();
    }

    // 6. Draw Gravitational Distortion Waves around Cursor
    for (const w of this.distortionWaves) {
      ctx.save();
      ctx.lineWidth = 2.5;

      // Chromatic aberration / multi-band gravitational refraction rings
      // Cyan inner ring
      ctx.beginPath();
      ctx.arc(w.x, w.y, Math.max(1, w.radius - 2), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${w.alpha * 0.4 * w.intensity})`;
      ctx.stroke();

      // Golden main shock ring
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(251, 191, 36, ${w.alpha * 0.7 * w.intensity})`;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12 * w.intensity;
      ctx.stroke();

      // Magenta outer dispersion ring
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${w.alpha * 0.4 * w.intensity})`;
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
}
