/**
 * Entities.js - Characters and dynamic props for Ganesh Chaturthi Courtyard
 * Mom (follows cursor, catch point), Aarav (runs automatically, target point, caught state)
 */
import { Vector2 } from "./Vector2.js";

// ==========================================
// 1. THE BOY (AARAV) - AUTOMATIC RUNNER
// ==========================================
export class Boy {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(160, 0); // Automatic initial run velocity
    this.acc = new Vector2(0, 0);
    this.mass = 28;
    this.radius = 22;

    this.state = "RUNNING"; // "RUNNING", "FLOATING", "DASHING", "CAUGHT"
    this.facing = 1;
    this.angle = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.floatingMomentum = new Vector2(0, 0);
    this.trailTimer = 0;

    // Body Target Point (for catching)
    this.targetPoint = new Vector2(x, y - 18);
    this.isPointMatched = false;

    // Autonomous behavior & agility variables (Medium Dodge balance)
    this.runSpeed = 210;
    this.dangerZoneRadius = 125;
    this.catchThreshold = 28;
    this.alignReflexTimer = 0;
    this.cornerDodgeCooldown = 0;
    this.autoHopTimer = 1.4 + Math.random() * 2.0;
    this.turnTimer = 3.5 + Math.random() * 3.0;

    // Caught & Modak Reward state
    this.isCaught = false;
    this.caughtTimer = 0;
    this.caughtCount = 0;
    this.modaksEatenCount = 0;
    this.isEating = false;

    // Speech bubble
    this.speechText = "";
    this.speechTimer = 0;
  }

  say(text, duration = 1.8) {
    this.speechText = text;
    this.speechTimer = duration;
  }

  triggerCaught(chaser) {
    this.isCaught = true;
    this.caughtTimer = 3.6; // Extended celebration for Modak eating & Ganesh Ji offering
    this.state = "CAUGHT";
    this.caughtCount++;
    this.modaksEatenCount++;
    this.isEating = true;
    this.vel.set(0, 0);
    this.acc.set(0, 0);

    // Turn towards Lord Ganesha
    this.facing = Math.sign(chaser.pos.x - this.pos.x) || 1;

    const caughtDialogues = [
      "Pranam Ganesh Ji! Your modaks are divine! 🥟🙏✨",
      "Delicious! Thank you, Ganpati Bappa! 🥟✨",
      "Yummy! Blessed modak from Ganesh Ji! 🥟😋"
    ];
    this.say(caughtDialogues[Math.floor(Math.random() * caughtDialogues.length)], 2.0);
  }

  update(dt, physics, particleSystem, audioEngine, chaser) {
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.cornerDodgeCooldown = Math.max(0, this.cornerDodgeCooldown - dt);

    if (this.speechTimer > 0) {
      this.speechTimer -= dt;
      if (this.speechTimer <= 0) this.speechText = "";
    }

    // 1. If currently CAUGHT with Lord Ganesha (Receiving Modak Reward)
    if (this.isCaught) {
      this.caughtTimer -= dt;
      this.vel.set(0, 0);
      this.state = "CAUGHT";

      // Gentle celebratory bounce/sway
      this.pos.y = physics.isAntiGravityActive 
        ? chaser.pos.y + Math.sin(Date.now() * 0.005) * 4
        : physics.groundY;
      this.pos.x = chaser.pos.x + (this.facing === 1 ? -18 : 18);

      // Transition to Stage 2 of reward: Offering to Ganesh Ji
      if (this.caughtTimer < 2.0 && this.caughtTimer > 0.4 && this.speechTimer <= 0) {
        this.say("Ganpati Bappa Morya! 🙏✨", 1.8);
      }

      if (this.caughtTimer <= 0) {
        // Resume automatic running with energized leap!
        this.isCaught = false;
        this.isEating = false;
        this.state = physics.isAntiGravityActive ? "FLOATING" : "RUNNING";
        this.facing = Math.random() < 0.5 ? 1 : -1;
        this.vel.set(this.facing * this.runSpeed * 1.5, -400);
        this.say("Full of energy now! Catch me if you can! 🚀", 1.8);
        audioEngine.playDashWhoosh(520);
        particleSystem.addDashTrail(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
      }

      this.updateTargetPoint();
      return;
    }

    // 2. Medium Dodge Evasion AI: Sensing Lord Ganesha's approach!
    const distToChaserCatch = this.pos.distanceTo(chaser.catchPoint);
    const escapeDirX = Math.sign(this.pos.x - chaser.pos.x) || this.facing;

    // A. CORNER TRAP DETECTION & MEDIUM WALL-KICK DODGE
    // Corners are near left wall (x < 220) or right wall (x > width - 220).
    const isNearLeftCorner = this.pos.x < 220;
    const isNearRightCorner = this.pos.x > physics.width - 220;
    const chaserTrappingLeft = isNearLeftCorner && chaser.pos.x > this.pos.x && (chaser.pos.x - this.pos.x) < 220;
    const chaserTrappingRight = isNearRightCorner && chaser.pos.x < this.pos.x && (this.pos.x - chaser.pos.x) < 220;

    if ((chaserTrappingLeft || chaserTrappingRight) && this.cornerDodgeCooldown <= 0) {
      // Launch moderately toward open center of the courtyard (Medium Dodge: ~320 px/s)
      const launchDirX = chaserTrappingLeft ? 1 : -1;
      
      if (!physics.isAntiGravityActive) {
        this.vel.x = launchDirX * (320 + Math.random() * 40);
        this.vel.y = -350 - Math.random() * 40; // Manageable arched leap
      } else {
        this.vel.x = launchDirX * (300 + Math.random() * 30);
        this.vel.y = (this.pos.y < chaser.pos.y ? -220 : 240);
      }

      this.facing = launchDirX;
      this.dashTimer = 0.50; // Medium dodge duration
      this.state = "DASHING";
      this.dashCooldown = 1.0;
      this.cornerDodgeCooldown = 2.4; // Fair cooldown allowing player to close in
      this.alignReflexTimer = 0;

      particleSystem.addDistortionWave(this.pos.x, this.pos.y, 140, 1.4);
      for (let s = 0; s < 14; s++) {
        particleSystem.addSparkle(this.pos.x + (Math.random() - 0.5) * 30, this.pos.y + (Math.random() - 0.5) * 30, "#fde047");
      }
      audioEngine.playDashWhoosh(560);

      const cornerQuips = [
        "Medium leap dodge! 💨",
        "Can't corner me! ⚡",
        "Acrobatic hop! ✨",
        "Agile corner dodge! 🪔"
      ];
      this.say(cornerQuips[Math.floor(Math.random() * cornerQuips.length)], 1.4);
    }
    // B. PROACTIVE EVASIVE ACROBATICS (Mid-field & airborne)
    else if (distToChaserCatch < this.dangerZoneRadius) {
      if (!physics.isAntiGravityActive && this.pos.y >= physics.groundY - 30) {
        // Floor vault leap when chaser gets within 80px
        if (distToChaserCatch < 80 && this.dashCooldown <= 0) {
          this.vel.y = -330 - Math.random() * 40;
          this.vel.x = escapeDirX * (280 + Math.random() * 40);
          this.facing = escapeDirX;
          this.dashTimer = 0.40;
          this.state = "DASHING";
          this.dashCooldown = 0.95;
          particleSystem.addDashTrail(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
          audioEngine.playDashWhoosh(440);
          const evasionQuips = ["Hop away! 💨", "Almost got me! ✨", "Hehe, keep trying! 🥟", "Zoom! 🪔"];
          this.say(evasionQuips[Math.floor(Math.random() * evasionQuips.length)], 1.1);
        } else {
          // Sprint burst away from chaser
          this.acc.x += escapeDirX * 520;
          this.facing = escapeDirX;
        }
      } else if (this.pos.y < physics.groundY - 30 && distToChaserCatch < 75 && this.dashCooldown <= 0) {
        // Airborne feint / mid-air flip
        this.vel.y = -220;
        this.vel.x = escapeDirX * 300;
        this.facing = escapeDirX;
        this.dashTimer = 0.38;
        this.state = "DASHING";
        this.dashCooldown = 1.0;
        particleSystem.addDashTrail(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
        audioEngine.playDashWhoosh(480);
        this.say("Mid-air leap! 💨", 1.0);
      } else if (physics.isAntiGravityActive) {
        // In AG-04 low-buoyancy: glide away using atmospheric currents
        this.acc.x += escapeDirX * 450;
        this.acc.y += (this.pos.y < chaser.pos.y ? -180 : 180);
        this.facing = escapeDirX;
      }
    }

    // 3. Balanced Reflex Escape: If points are closely matched (<= 28px), 0.36s reflex window!
    const distPoints = this.targetPoint.distanceTo(chaser.catchPoint);
    if (distPoints <= this.catchThreshold) {
      this.alignReflexTimer += dt;
      if (this.alignReflexTimer >= 0.36) {
        // Emergency escape slide dash after fair 0.36s window
        this.vel.x = escapeDirX * 350;
        this.vel.y = -220;
        this.facing = escapeDirX;
        this.dashTimer = 0.40;
        this.state = "DASHING";
        this.alignReflexTimer = 0;
        this.dashCooldown = 1.0;
        this.say("Quick hop away! 💨", 1.0);
        audioEngine.playDashWhoosh(480);
        particleSystem.addDistortionWave(this.pos.x, this.pos.y, 90, 0.9);
      }
    } else {
      this.alignReflexTimer = 0;
    }

    // 4. Automatic Running Drive
    this.autoHopTimer -= dt;
    this.turnTimer -= dt;

    // Periodic spontaneous leaps in 1G
    if (!physics.isAntiGravityActive && this.state === "RUNNING" && this.autoHopTimer <= 0) {
      this.vel.y = -290 - Math.random() * 80;
      this.autoHopTimer = 1.8 + Math.random() * 2.2;
      if (Math.random() < 0.3) this.say("Wheee! ✨", 1.2);
    }

    // Turn around when hitting wall or randomly
    if (this.pos.x < 110) {
      this.facing = 1;
      this.turnTimer = 3.0 + Math.random() * 3.0;
    } else if (this.pos.x > physics.width - 110) {
      this.facing = -1;
      this.turnTimer = 3.0 + Math.random() * 3.0;
    } else if (this.turnTimer <= 0) {
      this.facing *= -1;
      this.turnTimer = 3.5 + Math.random() * 4.0;
    }

    // Maintain running horizontal drive
    const desiredVx = this.facing * this.runSpeed;
    this.acc.x += (desiredVx - this.vel.x) * 5.8;

    // Handle dash state
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.state = "DASHING";
      this.angle += this.facing * 26 * dt;
      this.trailTimer += dt;
      if (this.trailTimer > 0.03) {
        particleSystem.addDashTrail(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
        this.trailTimer = 0;
      }
      if (this.dashTimer <= 0) {
        this.state = physics.isAntiGravityActive ? "FLOATING" : "RUNNING";
      }
    } else {
      if (physics.isAntiGravityActive || this.pos.y < physics.groundY - 25) {
        this.state = "FLOATING";
        const targetAngle = Math.atan2(this.vel.y, Math.abs(this.vel.x) + 40) * 0.4 * this.facing;
        this.angle += (targetAngle - this.angle) * 6 * dt;
      } else {
        this.state = "RUNNING";
        this.angle += (0 - this.angle) * 10 * dt;
      }
    }

    // Integrate physics
    this.vel.add(this.acc.clone().multiplyScalar(dt));
    this.pos.add(this.vel.clone().multiplyScalar(dt));
    this.acc.set(0, 0);

    this.floatingMomentum.copy(this.vel);

    // Boundaries with Emergency Wall-Kick Spring
    const minX = 60, maxX = physics.width - 60;
    const minY = 50, maxY = physics.groundY;

    if (this.pos.x <= minX) {
      this.pos.x = minX;
      if (distToChaserCatch < 200) {
        // Medium wall-kick spring out of corner
        this.vel.x = 320;
        this.vel.y = -350;
        this.facing = 1;
        this.dashTimer = 0.45;
        this.state = "DASHING";
        audioEngine.playDashWhoosh(520);
        particleSystem.addDashTrail(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
      } else {
        this.vel.x *= -0.7;
        this.facing = 1;
      }
    } else if (this.pos.x >= maxX) {
      this.pos.x = maxX;
      if (distToChaserCatch < 200) {
        // Medium wall-kick spring out of corner
        this.vel.x = -320;
        this.vel.y = -350;
        this.facing = -1;
        this.dashTimer = 0.45;
        this.state = "DASHING";
        audioEngine.playDashWhoosh(520);
        particleSystem.addDashTrail(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
      } else {
        this.vel.x *= -0.7;
        this.facing = -1;
      }
    }

    if (this.pos.y < minY) {
      this.pos.y = minY;
      this.vel.y = Math.max(0, this.vel.y * -0.4);
    } else if (this.pos.y > maxY) {
      this.pos.y = maxY;
      this.vel.y = 0;
      if (this.state !== "DASHING" && !this.isCaught) this.state = "RUNNING";
    }

    this.updateTargetPoint();
  }

  updateTargetPoint() {
    // Target catch point is on Aarav's chest/heart
    this.targetPoint.set(this.pos.x, this.pos.y - 18);
  }

  draw(ctx, debugVectors = false) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // Draw Speech Bubble if active
    if (this.speechText) {
      this.drawSpeechBubble(ctx, this.speechText, "#fbbf24", "#1e1b4b");
    }

    ctx.rotate(this.angle);
    ctx.scale(this.facing, 1);

    // Caught celebration glow or running glow
    if (this.isCaught) {
      ctx.beginPath();
      ctx.arc(0, -14, this.radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 1. Floating Scarf / Angavastram (Golden Yellow with red border)
    ctx.save();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    const trailOffset = (this.state === "DASHING" || this.state === "RUNNING") ? -24 : -14;
    const wave = Math.sin(Date.now() * 0.008) * 8;
    ctx.moveTo(-6, -18);
    ctx.bezierCurveTo(-18, -10 + wave, -30, trailOffset - wave, -44, trailOffset + wave * 1.5);
    ctx.stroke();
    ctx.restore();

    // 2. Body / Kurta (Traditional saffron/marigold orange)
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.roundRect(-10, -22, 20, 24, 6);
    ctx.fill();

    // Kurta golden border trim
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 3. Legs / Dhoti (Ivory cream with running cadence)
    ctx.fillStyle = "#fef3c7";
    if (this.state === "RUNNING" && !this.isCaught) {
      const legRun = Math.sin(Date.now() * 0.02) * 10;
      ctx.fillRect(-8, 2, 6, 14 + legRun);
      ctx.fillRect(2, 2, 6, 14 - legRun);
    } else if (this.isCaught) {
      // Standing happily together
      ctx.fillRect(-8, 2, 6, 14);
      ctx.fillRect(2, 2, 6, 14);
    } else {
      ctx.save(); ctx.rotate(-0.25); ctx.fillRect(-9, 2, 6, 16); ctx.restore();
      ctx.save(); ctx.rotate(0.35); ctx.fillRect(3, 2, 6, 14); ctx.restore();
    }

    // 4. Arms
    ctx.fillStyle = "#fbd38d";
    if (this.isCaught) {
      // Hugging Mom and holding a Modak up
      ctx.fillRect(6, -24, 14, 6);
      ctx.beginPath();
      ctx.arc(20, -22, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24"; // holding modak
      ctx.fill();
    } else if (this.state === "DASHING" || this.state === "FLOATING") {
      ctx.fillRect(8, -18, 14, 5);
      ctx.fillRect(-18, -14, 12, 5);
    } else {
      const armSwing = Math.sin(Date.now() * 0.02) * 6;
      ctx.fillRect(8, -16 + armSwing, 6, 12);
      ctx.fillRect(-12, -16 - armSwing, 6, 12);
    }

    // 5. Head & Curly Hair
    ctx.beginPath();
    ctx.arc(0, -30, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#fbd38d";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -34, 11, Math.PI, Math.PI * 2);
    ctx.arc(-8, -32, 4.5, 0, Math.PI * 2);
    ctx.arc(8, -32, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1b4b";
    ctx.fill();

    // Tilak
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.ellipse(3, -33, 1.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Smile / Eating Animation
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.arc(4, -30, 1.8, 0, Math.PI * 2);
    ctx.fill();

    if (this.isCaught) {
      // Chewing mouth animation with sweet treat
      const chew = Math.abs(Math.sin(Date.now() * 0.022)) * 2.2;
      ctx.beginPath();
      ctx.ellipse(4, -26, 2.8, chew + 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#991b1b";
      ctx.fill();

      // Holding delicious bite of modak near mouth
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.ellipse(12, -26, 4.5, 3.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Floating little heart / sparkle above head
      ctx.fillStyle = "#f43f5e";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("❤️", 8, -44 + Math.sin(Date.now() * 0.008) * 3);
    } else {
      ctx.beginPath();
      ctx.arc(4, -26, 3.5, 0.1, Math.PI - 0.2);
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();

    // DRAW AARAV'S TARGET BODY POINT (Cyan / Golden glowing jewel)
    this.drawBodyTargetPoint(ctx);
  }

  drawBodyTargetPoint(ctx) {
    ctx.save();
    const tp = this.targetPoint;
    const pulse = Math.sin(Date.now() * 0.008) * 2;
    const matched = this.isPointMatched;

    // Outer ring
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, (matched ? 12 : 7) + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = matched ? "#22c55e" : "#38bdf8";
    ctx.lineWidth = matched ? 2.5 : 1.5;
    if (matched) ctx.setLineDash([3, 3]);
    ctx.stroke();

    // Core point
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, matched ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = matched ? "#4ade80" : "#38bdf8";
    ctx.shadowColor = matched ? "#22c55e" : "#0284c7";
    ctx.shadowBlur = matched ? 14 : 8;
    ctx.fill();

    ctx.restore();
  }

  drawSpeechBubble(ctx, text, bgColor, textColor) {
    ctx.save();
    ctx.font = "bold 11px system-ui, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const padX = 8, padY = 5;
    const bw = textWidth + padX * 2;
    const bh = 22;
    const bx = -bw / 2;
    const by = -65;

    ctx.fillStyle = bgColor;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tail
    ctx.beginPath();
    ctx.moveTo(-4, by + bh);
    ctx.lineTo(0, by + bh + 6);
    ctx.lineTo(4, by + bh);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, by + bh / 2);
    ctx.restore();
  }
}

// ==========================================
// 2. LORD GANESHA (GANESH JI) - DIVINE CHASER & PROTECTOR
// ==========================================
export class GaneshJi {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.targetPos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.facing = 1;
    this.state = "FOLLOWING_CURSOR"; // "FOLLOWING_CURSOR", "BLESSING", "IDLE"
    this.reachArm = 0;
    this.reachUp = false;

    // Catch Point on Ganesh Ji's blessing hand
    this.catchPoint = new Vector2(x + 24, y - 44);
    this.isPointMatched = false;

    // Blessing & Reward celebration
    this.isBlessing = false;
    this.blessTimer = 0;
    // Compatibility aliases for simulation loops
    this.isHugging = false;
    this.hugTimer = 0;

    // Mooshak Raj (faithful mouse mount companion)
    this.mooshakX = x - 34;
    this.mooshakY = y;
    this.mooshakVel = 0;

    // Speech bubble
    this.speechText = "";
    this.speechTimer = 0;
  }

  say(text, duration = 2.0) {
    this.speechText = text;
    this.speechTimer = duration;
  }

  triggerCatchSuccess(boy) {
    this.isBlessing = true;
    this.blessTimer = 3.6;
    this.isHugging = true;
    this.hugTimer = 3.6;
    this.state = "BLESSING";
    this.reachArm = 1.0;

    const ganeshDialogues = [
      "Blessings upon you, Aarav! Have this divine modak! 🥟✨",
      "Ganpati Bappa Morya! Well caught, little hero! 🥟🙏",
      "Sweet prasad for you, beta! Joy, peace & wisdom! 🥟💖"
    ];
    this.say(ganeshDialogues[Math.floor(Math.random() * ganeshDialogues.length)], 2.2);
  }

  update(dt, cursorPos, isCursorActive, physics, audioEngine, boy) {
    if (this.speechTimer > 0) {
      this.speechTimer -= dt;
      if (this.speechTimer <= 0) this.speechText = "";
    }

    // 1. If currently BLESSING & FEEDING Aarav
    if (this.isBlessing) {
      this.blessTimer -= dt;
      this.hugTimer = this.blessTimer;
      this.state = "BLESSING";
      this.isHugging = true;

      // Phase 2 of Reward: Divine altar consecration
      if (this.blessTimer < 2.0 && this.blessTimer > 0.4 && this.speechTimer <= 0) {
        this.say("And divine prasad offered to the sanctum! Mangal Murti Morya! 🪔✨", 1.8);
      }

      if (this.blessTimer <= 0) {
        this.isBlessing = false;
        this.isHugging = false;
        this.state = "FOLLOWING_CURSOR";
      }
      this.updateCatchPoint(physics);
      this.updateMooshak(dt, physics);
      return;
    }

    // 2. Stable Kinematic Following: Spring-damper smoothing & anti-jitter deadzone
    if (isCursorActive) {
      const dx = cursorPos.x - this.pos.x;
      const distToCursorX = Math.abs(dx);

      // Facing hysteresis: only flip facing when mouse clearly moves across body
      if (distToCursorX > 10) {
        this.facing = Math.sign(dx) || 1;
      }

      // Anti-jitter deadzone (< 6px dampens velocity smoothly to 0)
      let desiredVx = 0;
      if (distToCursorX > 6) {
        const maxSpeed = 270;
        desiredVx = Math.sign(dx) * Math.min(maxSpeed, (distToCursorX - 6) * 4.4);
      }

      // Critically damped spring-damper interpolation for horizontal glide
      this.vel.x += (desiredVx - this.vel.x) * 9.5 * dt;
      this.pos.x += this.vel.x * dt;

      // Vertical Kinematics & Stability
      if (physics.isAntiGravityActive) {
        // Celestial hover in AG-04 sector
        const targetY = Math.max(90, Math.min(physics.groundY - 15, cursorPos.y));
        const desiredVy = (targetY - this.pos.y) * 3.8;
        this.vel.y += (desiredVy - this.vel.y) * 6.0 * dt;
        this.pos.y += this.vel.y * dt;
        this.reachUp = cursorPos.y < this.pos.y - 25;
      } else {
        // Grounded stability in 1G: locked smoothly to ground without vertical jitter
        this.pos.y += (physics.groundY - this.pos.y) * 12.0 * dt;
        this.vel.y = 0;
        this.reachUp = cursorPos.y < physics.groundY - 45;
      }

      // Reaching arm animation responds to cursor and Aarav proximity
      const distToBoy = this.pos.distanceTo(boy.pos);
      if (distToBoy < 110 || Math.hypot(cursorPos.x - this.pos.x, cursorPos.y - this.pos.y) < 85) {
        this.reachArm = Math.min(1.0, this.reachArm + dt * 4.5);
      } else {
        this.reachArm = Math.max(0, this.reachArm - dt * 3.0);
      }

      this.state = "FOLLOWING_CURSOR";
    } else {
      // Gentle damping when cursor leaves canvas
      this.vel.x *= Math.max(0, 1 - 8 * dt);
      this.pos.x += this.vel.x * dt;
    }

    // Boundary containment
    this.pos.x = Math.max(70, Math.min(physics.width - 70, this.pos.x));

    this.updateCatchPoint(physics);
    this.updateMooshak(dt, physics);
  }

  updateMooshak(dt, physics) {
    // Mooshak Raj runs smoothly beside Ganesh Ji
    const targetMooshakX = this.pos.x - this.facing * 34;
    const dmx = targetMooshakX - this.mooshakX;
    this.mooshakVel += (dmx * 6.0 - this.mooshakVel) * 8.0 * dt;
    this.mooshakX += this.mooshakVel * dt;
    this.mooshakY = physics.isAntiGravityActive ? this.pos.y + 14 : physics.groundY;
  }

  updateCatchPoint(physics) {
    // Catch point is located on Ganesh Ji's blessing / modak hand
    if (this.reachUp) {
      this.catchPoint.set(this.pos.x + this.facing * 18, this.pos.y - 72);
    } else {
      this.catchPoint.set(this.pos.x + this.facing * 26, this.pos.y - 44);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // Draw Speech Bubble if active
    if (this.speechText) {
      this.drawSpeechBubble(ctx, this.speechText, "#ea580c", "#ffffff");
    }

    ctx.scale(this.facing, 1);

    // Subtle breathing / hover float
    const hoverBob = Math.sin(Date.now() * 0.004) * 2.5;

    // ==========================================
    // A. CELESTIAL HALO (PRABHAVALI)
    // ==========================================
    ctx.save();
    ctx.translate(0, -62 + hoverBob);
    const haloPulse = 0.85 + Math.sin(Date.now() * 0.005) * 0.15;

    // Glowing outer halo
    const haloGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 38);
    haloGrad.addColorStop(0, "rgba(251, 191, 36, 0.45)");
    haloGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.2)");
    haloGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 38 * haloPulse, 0, Math.PI * 2);
    ctx.fill();

    // Golden halo rays
    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 12; i++) {
      const rayAngle = (i * Math.PI) / 6 + Date.now() * 0.0008;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rayAngle) * 16, Math.sin(rayAngle) * 16);
      ctx.lineTo(Math.cos(rayAngle) * 26, Math.sin(rayAngle) * 26);
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // B. DHOTI & FEET (PITAMBAR SILK & GOLDEN ZARI)
    // ==========================================
    // Radiant saffron/yellow dhoti
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.moveTo(-16, -26 + hoverBob);
    ctx.lineTo(16, -26 + hoverBob);
    ctx.lineTo(18, 0);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();

    // Golden zari border
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dhoti pleats
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1.5;
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, -20 + hoverBob);
      ctx.lineTo(i * 1.2, 0);
      ctx.stroke();
    }

    // Divine Lotus Feet (Charan Paduka)
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(-8, 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // C. BENEVOLENT BELLY (LAMBODARA) & SASH
    // ==========================================
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(0, -22 + hoverBob, 18, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Yajnopavita (Janeu thread crossing chest)
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -42 + hoverBob);
    ctx.quadraticCurveTo(-2, -26 + hoverBob, 12, -14 + hoverBob);
    ctx.stroke();

    // Golden jewel necklace / Haar
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -36 + hoverBob, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "#dc2626"; // Ruby pendant
    ctx.beginPath();
    ctx.arc(0, -26 + hoverBob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // D. FOUR DIVINE ARMS (CHATURBHUJA)
    // ==========================================
    ctx.fillStyle = "#f59e0b";

    // 1. Upper Left Arm (Holding Golden Lotus / Ankusha)
    ctx.fillRect(-22, -44 + hoverBob, 8, 16);
    ctx.fillStyle = "#fbbf24"; // Ankusha
    ctx.beginPath();
    ctx.arc(-22, -48 + hoverBob, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -48 + hoverBob);
    ctx.lineTo(-24, -58 + hoverBob);
    ctx.stroke();

    // 2. Upper Right Arm (Holding Divine Pasha / Blessing)
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(14, -44 + hoverBob, 8, 16);
    ctx.fillStyle = "#f43f5e"; // Pink lotus bud
    ctx.beginPath();
    ctx.arc(18, -48 + hoverBob, 4, 0, Math.PI * 2);
    ctx.fill();

    // 3. Lower Left Hand (Holding Fresh Golden Modak - Modak-hasta)
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(-16, -34 + hoverBob, 12, 6);
    // Golden Modak on palm
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(-18, -35 + hoverBob, 5.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Lower Right Hand (Abhaya Mudra - Blessing & Reaching Hand)
    ctx.fillStyle = "#f59e0b";
    if (this.isBlessing) {
      // Blessing pose with sweet modak offered to Aarav
      ctx.save();
      ctx.rotate(-0.35);
      ctx.fillRect(8, -46 + hoverBob, 28, 8);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(28, -47 + hoverBob, 4, 10);

      // Sweet Modak in outstretched hand
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.ellipse(36, -43 + hoverBob, 6.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Sparkle on modak
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(36, -45 + hoverBob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.reachUp) {
      // Reaching up
      ctx.save();
      ctx.rotate(-1.25);
      ctx.fillRect(6, -48 + hoverBob, 26, 7);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(24, -49 + hoverBob, 4, 9);
      ctx.restore();
    } else if (this.reachArm > 0) {
      // Reaching forward smoothly
      ctx.save();
      ctx.rotate(-0.65 * this.reachArm);
      ctx.fillRect(8, -46 + hoverBob, 28, 7);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(26, -47 + hoverBob, 4, 9);
      ctx.restore();
    } else {
      // Abhaya Mudra (blessing palm raised)
      ctx.save();
      ctx.rotate(-0.2);
      ctx.fillRect(10, -42 + hoverBob, 14, 7);
      // Open palm
      ctx.beginPath();
      ctx.arc(22, -40 + hoverBob, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      // Red auspicious lotus mark on palm
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(22, -40 + hoverBob, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ==========================================
    // E. ELEPHANT HEAD, EARS, TUSK & TRUNK
    // ==========================================
    // Large Elephant Ears with gentle flutter
    const earFlutter = Math.sin(Date.now() * 0.006) * 1.5;

    // Left Ear
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(-16 + earFlutter, -56 + hoverBob, 11, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fda4af"; // Pink inner lobe
    ctx.beginPath();
    ctx.ellipse(-16 + earFlutter, -56 + hoverBob, 7, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(16 - earFlutter, -56 + hoverBob, 11, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fda4af"; // Pink inner lobe
    ctx.beginPath();
    ctx.ellipse(16 - earFlutter, -56 + hoverBob, 7, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(0, -56 + hoverBob, 14, 0, Math.PI * 2);
    ctx.fill();

    // Ekadanta (Single Sacred White Tusk)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(8, -48 + hoverBob);
    ctx.quadraticCurveTo(12, -46 + hoverBob, 15, -42 + hoverBob);
    ctx.quadraticCurveTo(10, -44 + hoverBob, 8, -48 + hoverBob);
    ctx.fill();
    ctx.fillStyle = "#fbbf24"; // Golden band at tusk base
    ctx.fillRect(8, -49 + hoverBob, 2.5, 2.5);

    // Curved Trunk (Vakratunda)
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -52 + hoverBob);
    ctx.quadraticCurveTo(-4, -40 + hoverBob, -7, -35 + hoverBob);
    ctx.quadraticCurveTo(-10, -32 + hoverBob, -7, -28 + hoverBob);
    ctx.quadraticCurveTo(-3, -27 + hoverBob, 2, -31 + hoverBob);
    ctx.stroke();

    // Little modak at trunk tip
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(2, -31 + hoverBob, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Chandan & Kumkum Tilak on Forehead
    ctx.fillStyle = "#fef08a"; // Yellow sandalwood bands
    ctx.fillRect(-4, -62 + hoverBob, 8, 2);
    ctx.fillRect(-3, -65 + hoverBob, 6, 1.5);
    ctx.fillStyle = "#dc2626"; // Red vermillion tilak
    ctx.beginPath();
    ctx.ellipse(0, -62 + hoverBob, 1.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kind, Wise Eyes
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.ellipse(4, -58 + hoverBob, 1.8, 1.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(4.5, -58.5 + hoverBob, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // F. ROYAL MUKUT (GOLDEN CROWN WITH KALASH)
    // ==========================================
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(-11, -66 + hoverBob);
    ctx.lineTo(11, -66 + hoverBob);
    ctx.lineTo(7, -84 + hoverBob);
    ctx.lineTo(0, -92 + hoverBob); // Kalash apex
    ctx.lineTo(-7, -84 + hoverBob);
    ctx.closePath();
    ctx.fill();

    // Mukut golden borders & jewel
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ruby jewel in center of crown
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(0, -74 + hoverBob, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Golden Kalash spire
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(0, -92 + hoverBob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ==========================================
    // G. MOOSHAK RAJ (FAITHFUL COMPANION MOUSE)
    // ==========================================
    this.drawMooshak(ctx);

    // DRAW GANESH JI'S BLESSING HAND POINT (Glowing Golden Jewel)
    this.drawCatchHandPoint(ctx);
  }

  drawMooshak(ctx) {
    ctx.save();
    ctx.translate(this.mooshakX, this.mooshakY);
    ctx.scale(this.facing, 1);

    // Cute Mouse Body
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.ellipse(0, -6, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouse Head
    ctx.beginPath();
    ctx.ellipse(7, -8, 6, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Ears (Grey with pink interior)
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(5, -13, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fda4af";
    ctx.beginPath();
    ctx.arc(5, -13, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(9, -9, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Snout & Whiskers
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(12, -8);
    ctx.lineTo(16, -10);
    ctx.moveTo(12, -7);
    ctx.lineTo(16, -6);
    ctx.stroke();

    // Curved Tail
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.quadraticCurveTo(-14, -12, -12, -18);
    ctx.stroke();

    // Tiny Modak in Mooshak's hands
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(10, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCatchHandPoint(ctx) {
    ctx.save();
    const cp = this.catchPoint;
    const pulse = Math.sin(Date.now() * 0.008) * 2;
    const matched = this.isPointMatched;

    // Outer ring
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, (matched ? 14 : 8) + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = matched ? "#22c55e" : "#fbbf24";
    ctx.lineWidth = matched ? 2.5 : 1.5;
    if (matched) ctx.setLineDash([3, 3]);
    ctx.stroke();

    // Core jewel
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, matched ? 5.5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = matched ? "#4ade80" : "#fbbf24";
    ctx.shadowColor = matched ? "#22c55e" : "#f59e0b";
    ctx.shadowBlur = matched ? 16 : 9;
    ctx.fill();

    ctx.restore();
  }

  drawSpeechBubble(ctx, text, bgColor, textColor) {
    ctx.save();
    ctx.font = "bold 11px system-ui, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const padX = 8, padY = 5;
    const bw = textWidth + padX * 2;
    const bh = 22;
    const bx = -bw / 2;
    const by = -105;

    ctx.fillStyle = bgColor;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(-4, by + bh);
    ctx.lineTo(0, by + bh + 6);
    ctx.lineTo(4, by + bh);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, by + bh / 2);
    ctx.restore();
  }
}

// Backwards compatibility alias
export const Mom = GaneshJi;

// ==========================================
// 3. FESTIVE TORANS (VERLET ROPE)
// ==========================================
export class Toran {
  constructor(startX, startY, endX, endY, segments = 16) {
    this.nodes = [];
    this.segments = segments;
    this.restLength = (endX - startX) / segments;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t + Math.sin(t * Math.PI) * 25;
      this.nodes.push({
        x,
        y,
        oldX: x,
        oldY: y,
        pinned: i === 0 || i === segments,
        isMarigold: i % 2 === 1,
        color: i % 4 === 1 ? "#f97316" : "#eab308",
      });
    }
  }

  update(dt, gravityVectorY, windForceX = 0) {
    for (const node of this.nodes) {
      if (node.pinned) continue;
      const vx = (node.x - node.oldX) * 0.96;
      const vy = (node.y - node.oldY) * 0.96;

      node.oldX = node.x;
      node.oldY = node.y;

      node.x += vx + windForceX * dt * dt;
      node.y += vy + gravityVectorY * 0.45 * dt * dt;
    }

    for (let iter = 0; iter < 5; iter++) {
      for (let i = 0; i < this.segments; i++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[i + 1];

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const diff = (dist - this.restLength) / (dist || 1);

        const offsetX = dx * 0.5 * diff;
        const offsetY = dy * 0.5 * diff;

        if (!n1.pinned) {
          n1.x += offsetX;
          n1.y += offsetY;
        }
        if (!n2.pinned) {
          n2.x -= offsetX;
          n2.y -= offsetY;
        }
      }
    }
  }

  interactWithBody(bodyPos, radius = 30) {
    for (const node of this.nodes) {
      if (node.pinned) continue;
      const dx = node.x - bodyPos.x;
      const dy = node.y - bodyPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 0.1) {
        const push = (radius - dist) * 0.5;
        node.x += (dx / dist) * push;
        node.y += (dy / dist) * push;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
    for (let i = 1; i < this.nodes.length; i++) {
      ctx.lineTo(this.nodes[i].x, this.nodes[i].y);
    }
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let i = 1; i < this.nodes.length - 1; i++) {
      const node = this.nodes[i];
      if (node.isMarigold) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 4;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ea580c";
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.fillStyle = "#16a34a";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(4, 5, 4, 14, 0, 18);
        ctx.bezierCurveTo(-4, 14, -4, 5, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }
}

// ==========================================
// 4. DYNAMIC MODAK (SWEET DUMPLING)
// ==========================================
export class Modak {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2((Math.random() - 0.5) * 40, -Math.random() * 40);
    this.acc = new Vector2(0, 0);
    this.radius = 12;
    this.angle = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 2;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt, physics, audioEngine) {
    this.bobPhase += dt * 2.0;

    if (physics.isAntiGravityActive) {
      this.angle += this.vRot * dt;
      this.vel.multiplyScalar(0.985);
    }

    this.vel.add(this.acc.clone().multiplyScalar(dt));
    this.pos.add(this.vel.clone().multiplyScalar(dt));
    this.acc.set(0, 0);

    if (this.pos.y > physics.groundY) {
      this.pos.y = physics.groundY;
      if (Math.abs(this.vel.y) > 40) audioEngine.playPropBounce();
      this.vel.y *= -0.55;
      this.vel.x *= 0.8;
    }
    if (this.pos.x < 40) {
      this.pos.x = 40;
      this.vel.x *= -0.6;
    } else if (this.pos.x > physics.width - 40) {
      this.pos.x = physics.width - 40;
      this.vel.x *= -0.6;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.bezierCurveTo(this.radius * 0.9, -this.radius * 0.2, this.radius * 0.8, this.radius * 0.8, 0, this.radius * 0.9);
    ctx.bezierCurveTo(-this.radius * 0.8, this.radius * 0.8, -this.radius * 0.9, -this.radius * 0.2, 0, -this.radius);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
    grad.addColorStop(0, "#fef08a");
    grad.addColorStop(0.5, "#fde68a");
    grad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1.0;
    for (let offset of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(0, -this.radius + 1);
      ctx.quadraticCurveTo(offset * 0.8, 0, offset * 0.7, this.radius * 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ==========================================
// 5. FLOATING DIYA (EARTHEN OIL LAMP)
// ==========================================
export class Diya {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.acc = new Vector2(0, 0);
    this.radius = 16;
    this.flameTilt = 0;
  }

  update(dt, physics, particleSystem) {
    if (physics.isAntiGravityActive) {
      this.vel.multiplyScalar(0.98);
    }

    this.vel.add(this.acc.clone().multiplyScalar(dt));
    this.pos.add(this.vel.clone().multiplyScalar(dt));
    this.acc.set(0, 0);

    this.flameTilt += (-this.vel.x * 0.004 - this.flameTilt) * 8 * dt;

    if (this.pos.y > physics.groundY) {
      this.pos.y = physics.groundY;
      this.vel.y *= -0.3;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(0, 16, 16, 0);
    ctx.quadraticCurveTo(0, 4, -16, 0);
    ctx.fillStyle = "#b45309";
    ctx.fill();
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const flicker = Math.sin(Date.now() * 0.015) * 2;
    const flameHeight = 14 + flicker;

    const aura = ctx.createRadialGradient(0, -6, 2, 0, -6, 32);
    aura.addColorStop(0, "rgba(251, 191, 36, 0.45)");
    aura.addColorStop(0.5, "rgba(245, 158, 11, 0.2)");
    aura.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -6, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(0, 0);
    ctx.rotate(this.flameTilt);

    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.bezierCurveTo(-6, -flameHeight * 0.6, 0, -flameHeight, 0, -flameHeight);
    ctx.bezierCurveTo(0, -flameHeight, 6, -flameHeight * 0.6, 4, 0);
    ctx.closePath();

    const flameGrad = ctx.createLinearGradient(0, 0, 0, -flameHeight);
    flameGrad.addColorStop(0, "#38bdf8");
    flameGrad.addColorStop(0.2, "#f97316");
    flameGrad.addColorStop(0.7, "#facc15");
    flameGrad.addColorStop(1, "#ffffff");
    ctx.fillStyle = flameGrad;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

// ==========================================
// 6. GRAVITY-SWITCH LEVER
// ==========================================
export class Lever {
  constructor(x, y, id = "AG-04-LEVER") {
    this.pos = new Vector2(x, y);
    this.id = id;
    this.angle = -0.6;
    this.targetAngle = -0.6;
  }

  toggle(physics, audioEngine) {
    physics.toggleAntiGravity();
    this.targetAngle = physics.isAntiGravityActive ? 0.6 : -0.6;
    audioEngine.playLeverClick();
  }

  update(dt) {
    this.angle += (this.targetAngle - this.angle) * 14 * dt;
  }

  isClicked(mx, my) {
    const d = Math.hypot(mx - this.pos.x, my - this.pos.y);
    return d < 28;
  }

  draw(ctx, isActive) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = "#78350f";
    ctx.fillRect(-18, -26, 36, 52);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -26, 36, 52);

    ctx.beginPath();
    ctx.arc(0, -16, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? "#38bdf8" : "#f59e0b";
    ctx.shadowColor = isActive ? "#0284c7" : "#d97706";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -28);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -28, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#fef08a";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("AG-04", 0, 20);

    ctx.restore();
  }
}

// ==========================================
// 7. WIND-CURRENT GENERATOR (VAYU PEDESTAL)
// ==========================================
export class WindGenerator {
  constructor(x, y, dirX = 1) {
    this.pos = new Vector2(x, y);
    this.dirX = dirX;
    this.isActive = false;
    this.fanSpeed = 0;
    this.fanAngle = 0;
    this.power = 420;
    this.coneRange = 360;
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  update(dt, particleSystem, boy, props) {
    if (this.isActive) {
      this.fanSpeed = Math.min(24, this.fanSpeed + dt * 18);
      if (Math.random() < 0.65) {
        particleSystem.addWindParticle(this.pos.x + this.dirX * 20, this.pos.y, this.dirX, (Math.random() - 0.5) * 0.2, 380);
      }

      const dxBoy = boy.pos.x - this.pos.x;
      const dyBoy = Math.abs(boy.pos.y - this.pos.y);
      if (Math.sign(dxBoy) === this.dirX && Math.abs(dxBoy) < this.coneRange && dyBoy < 90) {
        const falloff = 1 - Math.abs(dxBoy) / this.coneRange;
        boy.acc.x += this.dirX * this.power * falloff;
        boy.acc.y -= 75 * falloff;
      }

      for (const prop of props) {
        const dx = prop.pos.x - this.pos.x;
        const dy = Math.abs(prop.pos.y - this.pos.y);
        if (Math.sign(dx) === this.dirX && Math.abs(dx) < this.coneRange && dy < 90) {
          const falloff = 1 - Math.abs(dx) / this.coneRange;
          prop.acc.x += this.dirX * this.power * falloff * 0.8;
          prop.acc.y -= 60 * falloff;
        }
      }
    } else {
      this.fanSpeed = Math.max(0, this.fanSpeed - dt * 6);
    }

    this.fanAngle += this.fanSpeed * dt;
  }

  isClicked(mx, my) {
    return Math.hypot(mx - this.pos.x, my - this.pos.y) < 32;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.isActive ? "#38bdf8" : "#fbbf24";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.rotate(this.fanAngle);
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(0, 10, 5, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.isActive ? "#38bdf8" : "#b45309";
    ctx.fill();

    ctx.restore();
  }
}

// ==========================================
// 8. SACRED OFFERING MODAK (PRASAD TO GANESH JI)
// ==========================================
export class OfferingModak {
  constructor(startX, startY, targetX, targetY, onArriveCallback) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.ctrlX = (startX + targetX) / 2;
    this.ctrlY = Math.min(startY, targetY) - 140; // High graceful soaring arc
    this.progress = 0.0;
    this.duration = 1.35; // Flight duration in seconds
    this.onArriveCallback = onArriveCallback;
    this.isFinished = false;
    this.pos = new Vector2(startX, startY);
    this.angle = 0;
    this.trailTimer = 0;
  }

  update(dt, particleSystem, audioEngine) {
    if (this.isFinished) return;
    this.progress += dt / this.duration;
    this.angle += 7.5 * dt;

    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.pos.set(this.targetX, this.targetY);
      this.isFinished = true;
      if (this.onArriveCallback) this.onArriveCallback();
      return;
    }

    // Quadratic Bezier interpolation: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const t = this.progress;
    const invT = 1 - t;
    const bx = invT * invT * this.startX + 2 * invT * t * this.ctrlX + t * t * this.targetX;
    const by = invT * invT * this.startY + 2 * invT * t * this.ctrlY + t * t * this.targetY;
    this.pos.set(bx, by);

    // Trail FX: golden sparkles and sacred lotus petals
    this.trailTimer += dt;
    if (this.trailTimer > 0.04) {
      this.trailTimer = 0;
      particleSystem.addSparkle(this.pos.x, this.pos.y, "#fde047");
      if (Math.random() < 0.3) {
        particleSystem.addDistortionWave(this.pos.x, this.pos.y, 40, 0.4);
      }
    }
  }

  draw(ctx) {
    if (this.isFinished) return;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Glowing divine aura
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 18;

    // Sacred Modak geometry (Golden dumpling)
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(0, 3, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(-5, -6, 0, -12);
    ctx.quadraticCurveTo(5, -6, 8, 3);
    ctx.closePath();
    ctx.fill();

    // Saffron pleats (Kavach)
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Little golden flame/halo tip
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -12, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

