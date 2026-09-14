import math
import sys

# Ensure UTF-8 output on Windows console
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class Vector2:
    def __init__(self, x=0.0, y=0.0):
        self.x = float(x)
        self.y = float(y)
    
    def set(self, x, y):
        self.x = float(x)
        self.y = float(y)
        return self

    def distance_to(self, other):
        return math.hypot(self.x - other.x, self.y - other.y)


class MockBalGanesh:
    """
    Lord Ganesha (Ganesh Ji / Bal Ganesh) - Player-Controlled Chaser
    Follows mouse cursor with critically-damped spring kinematics, anti-jitter deadzone,
    facing hysteresis, and 100% accurate reaching trunk/hand catchPoint.
    """
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.facing = 1
        self.reach_up = False
        self.reach_arm = 0.0
        self.catch_point = Vector2(x + 22, y - 18)
        self.is_point_matched = False
        self.is_eating = False
        self.caught_count = 0
        self.modaks_eaten_count = 0
        self.speech_text = ""
        self.state = "CHASING"

    def update_catch_point(self):
        reach_offset = self.reach_arm * 12.0
        reach_up_offset = -10.0 if self.reach_up else 0.0
        self.catch_point.set(
            self.pos.x + self.facing * (22.0 + reach_offset),
            self.pos.y + (-18.0 + reach_up_offset)
        )

    def update_kinematics(self, dt, cursor_pos, is_cursor_active=True, is_anti_gravity=False, ground_y=520.0):
        if is_cursor_active:
            dx = cursor_pos.x - self.pos.x
            dist_to_cursor_x = abs(dx)

            # Facing hysteresis: only flip when mouse clearly moves across body (> 10px)
            if dist_to_cursor_x > 10:
                self.facing = 1 if dx > 0 else -1

            # Anti-jitter deadzone (< 6px dampens velocity smoothly to 0)
            desired_vx = 0.0
            if dist_to_cursor_x > 6:
                max_speed = 280.0
                desired_vx = (1.0 if dx > 0 else -1.0) * min(max_speed, (dist_to_cursor_x - 6) * 4.6)

            # Spring-damper horizontal tracking
            self.vel.x += (desired_vx - self.vel.x) * 9.5 * dt
            self.pos.x += self.vel.x * dt

            # Vertical kinematics
            if is_anti_gravity:
                target_y = max(90.0, min(ground_y - 15.0, cursor_pos.y))
                desired_vy = (target_y - self.pos.y) * 3.8
                self.vel.y += (desired_vy - self.vel.y) * 6.0 * dt
                self.pos.y += self.vel.y * dt
                self.reach_up = cursor_pos.y < (self.pos.y - 25)
            else:
                # 1G Ground-lock stability (no vertical jitter)
                self.pos.y += (ground_y - self.pos.y) * 12.0 * dt
                self.vel.y = 0.0
                self.reach_up = cursor_pos.y < (ground_y - 35)

        self.update_catch_point()

    def trigger_catch_success(self, runner):
        self.caught_count += 1
        self.modaks_eaten_count += 1
        self.is_eating = True
        self.state = "CELEBRATING"
        self.speech_text = "Yay Maa! Caught you! Modaks are mine! 🥟❤️"


# Aliases
MockChaser = MockBalGanesh
MockGaneshJi = MockBalGanesh


class MockParvatiMata:
    """
    Maa Parvati (Parvati Mata / Mom) - Stabilized Autonomous Agile Runner
    Playfully runs away holding brass modak thali, with:
    - Stabilized 1G ground locking and zero-tilt running
    - Directional hysteresis preventing alternating-frame oscillation
    - Sub-pixel transformed targetPoint matching visual modak thali
    - Anti-tunneling continuous swept collision support
    """
    def __init__(self, x, y, width=1000.0):
        self.pos = Vector2(x, y)
        self.vel = Vector2(170, 0)
        self.acc = Vector2(0, 0)
        self.facing = -1
        self.angle = 0.0
        self.state = "RUNNING"
        self.target_point = Vector2(x - 24, y - 44)
        self.run_speed = 250          # Playful evasion sprint
        self.danger_zone_radius = 185 # Danger perception radius
        self.catch_threshold = 20.0   # Calibrated 20px precision threshold
        self.dash_cooldown = 0.0
        self.corner_dodge_cooldown = 0.0
        self.facing_hysteresis_timer = 0.0
        self.align_reflex_timer = 0.0
        self.dash_timer = 0.0
        self.evasion_count = 0
        self.is_point_matched = False
        self.is_caught = False
        self.caught_timer = 0.0
        self.caught_count = 0
        self.speech_text = ""
        self.width = width

    def update_target_point(self):
        # Exact trigonometric local-to-world transformation of the brass Modak Thali
        rad = self.angle
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        lx = self.facing * 24.0
        ly = -44.0
        wx = lx * cos_a - ly * sin_a
        wy = lx * sin_a + ly * cos_a
        self.target_point.set(self.pos.x + wx, self.pos.y + wy)

    def trigger_caught(self, chaser):
        self.is_caught = True
        self.caught_timer = 3.6
        self.state = "CAUGHT"
        self.caught_count += 1
        self.vel.set(0, 0)
        self.facing = 1 if chaser.pos.x > self.pos.x else -1
        self.speech_text = "Hehe little Ganesha! You caught Maa, take your sweet modaks! 🥟❤️"

    def update_evasion_test(self, dt, chaser, is_anti_gravity=False, ground_y=520.0):
        self.dash_cooldown = max(0.0, self.dash_cooldown - dt)
        self.corner_dodge_cooldown = max(0.0, self.corner_dodge_cooldown - dt)
        self.facing_hysteresis_timer = max(0.0, self.facing_hysteresis_timer - dt)
        dist_to_chaser = self.pos.distance_to(chaser.catch_point)
        dist_points = self.target_point.distance_to(chaser.catch_point)
        escape_dir_x = 1 if self.pos.x >= chaser.pos.x else -1

        evasion_triggered = None

        # A. Corner Trap Detection & Long Wall-Kick Dodge
        is_near_left_corner = self.pos.x < 230
        is_near_right_corner = self.pos.x > self.width - 230
        chaser_trapping_left = is_near_left_corner and chaser.pos.x > self.pos.x and (chaser.pos.x - self.pos.x) < 230
        chaser_trapping_right = is_near_right_corner and chaser.pos.x < self.pos.x and (self.pos.x - chaser.pos.x) < 230

        if (chaser_trapping_left or chaser_trapping_right) and self.corner_dodge_cooldown <= 0:
            launch_dir = 1 if chaser_trapping_left else -1
            if not is_anti_gravity:
                self.vel.x = launch_dir * 500.0  # High-velocity somersault leap away from corner
                self.vel.y = -450.0
            else:
                self.vel.x = launch_dir * 460.0
                self.vel.y = -340.0 if self.pos.y < chaser.pos.y else 340.0
            self.facing = launch_dir
            self.facing_hysteresis_timer = 0.6
            self.dash_timer = 0.55
            self.state = "DASHING"
            self.dash_cooldown = 0.65
            self.corner_dodge_cooldown = 0.95
            self.align_reflex_timer = 0.0
            self.evasion_count += 1
            evasion_triggered = "CORNER_WALL_KICK"
            return evasion_triggered

        # B. Proactive Mid-field & Airborne Evasion
        elif dist_to_chaser < self.danger_zone_radius:
            if not is_anti_gravity and self.pos.y >= ground_y - 25:
                if dist_to_chaser < 95 and self.dash_cooldown <= 0:
                    self.vel.y = -380.0
                    self.vel.x = escape_dir_x * 360.0
                    self.facing = escape_dir_x
                    self.facing_hysteresis_timer = 0.5
                    self.dash_timer = 0.45
                    self.state = "DASHING"
                    self.dash_cooldown = 0.65
                    self.evasion_count += 1
                    evasion_triggered = "VAULT_LEAP"
                else:
                    self.vel.x += escape_dir_x * 720.0 * dt
                    if self.facing_hysteresis_timer <= 0:
                        self.facing = escape_dir_x
                        self.facing_hysteresis_timer = 0.35
                    evasion_triggered = "SPRINT_BURST"
            elif self.pos.y < ground_y - 25 and dist_to_chaser < 85 and self.dash_cooldown <= 0:
                self.vel.y = -270.0
                self.vel.x = escape_dir_x * 350.0
                self.facing = escape_dir_x
                self.facing_hysteresis_timer = 0.45
                self.dash_timer = 0.42
                self.state = "DASHING"
                self.dash_cooldown = 0.65
                self.evasion_count += 1
                evasion_triggered = "AIR_FEINT"
            elif is_anti_gravity:
                self.vel.x += escape_dir_x * 560.0 * dt
                self.vel.y += -240.0 * dt if self.pos.y < chaser.pos.y else 240.0 * dt
                evasion_triggered = "AG_SURF"

        # C. Reflex Escape when points matched (<= 20px, 0.14s window)
        if dist_points <= self.catch_threshold:
            self.align_reflex_timer += dt
            if self.align_reflex_timer >= 0.14:
                self.vel.x = escape_dir_x * 440.0
                self.vel.y = -240.0
                self.facing = escape_dir_x
                self.facing_hysteresis_timer = 0.5
                self.dash_timer = 0.45
                self.state = "DASHING"
                self.align_reflex_timer = 0.0
                self.dash_cooldown = 0.65
                self.evasion_count += 1
                evasion_triggered = "REFLEX_ESCAPE"
        else:
            self.align_reflex_timer = 0.0

        return evasion_triggered


# Aliases
MockRunner = MockParvatiMata
MockMom = MockParvatiMata
MockPriya = MockParvatiMata


class MockOfferingModak:
    def __init__(self, start_x, start_y, target_x, target_y, on_arrive):
        self.start_x = start_x
        self.start_y = start_y
        self.target_x = target_x
        self.target_y = target_y
        self.ctrl_x = (start_x + target_x) / 2.0
        self.ctrl_y = min(start_y, target_y) - 180.0
        self.pos = Vector2(start_x, start_y)
        self.t = 0.0
        self.duration = 1.3
        self.is_finished = False
        self.on_arrive = on_arrive

    def update(self, dt):
        if self.is_finished:
            return
        self.t += dt
        self.progress = min(1.0, self.t / self.duration)
        t = self.progress
        inv_t = 1.0 - t
        self.pos.x = inv_t * inv_t * self.start_x + 2 * inv_t * t * self.ctrl_x + t * t * self.target_x
        self.pos.y = inv_t * inv_t * self.start_y + 2 * inv_t * t * self.ctrl_y + t * t * self.target_y
        if self.progress >= 1.0:
            self.is_finished = True
            if self.on_arrive:
                self.on_arrive()


class SimulationRewardSystem:
    def __init__(self, chaser, runner, altar_x=500.0, altar_y=494.0):
        self.chaser = chaser
        self.bal_ganesh = chaser
        self.runner = runner
        self.parvati = runner
        self.mom = runner
        self.altar_x = altar_x
        self.altar_y = altar_y
        self.catch_threshold = 20.0   # Calibrated 20px threshold
        self.shift_buffer_timer = 0.0 # 110ms Shift key buffer
        self.swept_min_dist = 999.0
        self.bal_ganesh_modak_count = 0
        self.aarav_modak_count = 0
        self.prasad_altar_count = 0
        self.prasad_ganesh_count = 0
        self.altar_blessing_timer = 0.0
        self.offering_modaks = []

    def check_alignment(self):
        dist = self.chaser.catch_point.distance_to(self.runner.target_point)
        effective_dist = min(dist, self.swept_min_dist)
        is_matched = effective_dist <= self.catch_threshold
        self.chaser.is_point_matched = is_matched
        self.runner.is_point_matched = is_matched
        return effective_dist, is_matched

    def step_swept_distance(self, p0_catch, p0_target, p1_catch, p1_target):
        d0x = p0_catch.x - p0_target.x
        d0y = p0_catch.y - p0_target.y
        d1x = p1_catch.x - p1_target.x
        d1y = p1_catch.y - p1_target.y
        vx = d1x - d0x
        vy = d1y - d0y
        len_sq = vx * vx + vy * vy
        t_min = 0.0
        if len_sq > 0.001:
            t_min = max(0.0, min(1.0, -(d0x * vx + d0y * vy) / len_sq))
        closest_x = d0x + t_min * vx
        closest_y = d0y + t_min * vy
        self.swept_min_dist = math.hypot(closest_x, closest_y)
        return self.swept_min_dist

    def press_shift(self):
        self.shift_buffer_timer = 0.11  # 110ms buffer

    def update(self, dt):
        if self.shift_buffer_timer > 0:
            self.shift_buffer_timer -= dt
            dist, is_matched = self.check_alignment()
            if is_matched and not self.runner.is_caught:
                self.attempt_catch()
                self.shift_buffer_timer = 0.0

    def attempt_catch(self):
        dist, is_matched = self.check_alignment()
        if is_matched and not self.runner.is_caught:
            self.chaser.trigger_catch_success(self.runner)
            self.runner.trigger_caught(self.chaser)
            # Stage 1: Ganesh Ji wins modak
            self.bal_ganesh_modak_count += 1
            self.aarav_modak_count += 1

            # Stage 2: Consecrated offering modak flight to sanctum altar
            def on_arrive():
                self.prasad_altar_count += 1
                self.prasad_ganesh_count += 1
                self.altar_blessing_timer = 3.2

            offering = MockOfferingModak(
                self.chaser.catch_point.x, self.chaser.catch_point.y,
                self.altar_x, self.altar_y, on_arrive
            )
            self.offering_modaks.append(offering)
            return True
        return False


def test_rewards_and_agility():
    print("==========================================================================")
    print("TEST SUITE: PARVATI JI STABILITY & 20PX HIGH ACCURACY VERIFICATION")
    print("==========================================================================")

    ground_y = 520.0
    bal_ganesh = MockBalGanesh(200.0, ground_y)
    parvati = MockParvatiMata(400.0, ground_y, width=1000.0)
    sim = SimulationRewardSystem(bal_ganesh, parvati, altar_x=500.0, altar_y=494.0)

    # 1. Test Ganesh Ji Chaser Kinematics: Deadzone & Ground Stability
    print("\n--- 1. Testing Ganesh Ji Movement Stability & Anti-Jitter Deadzone ---")
    bal_ganesh.pos.set(200.0, ground_y)
    bal_ganesh.vel.set(20.0, 0.0)
    cursor_pos = Vector2(204.0, ground_y)
    bal_ganesh.update_kinematics(0.05, cursor_pos, is_cursor_active=True, is_anti_gravity=False, ground_y=ground_y)
    assert abs(bal_ganesh.vel.x) < 20.0, f"Deadzone should dampen velocity, got vx = {bal_ganesh.vel.x}"
    assert bal_ganesh.vel.y == 0.0, "1G ground lock must have vy == 0"
    assert bal_ganesh.pos.y == ground_y, "1G ground lock must remain pinned to groundY"
    print(f"[PASS] Anti-Jitter Deadzone (<6px): vx damped to {bal_ganesh.vel.x:.2f} px/s, vy locked at 0.0")

    cursor_pos.set(350.0, ground_y)
    bal_ganesh.update_kinematics(0.05, cursor_pos, is_cursor_active=True, is_anti_gravity=False, ground_y=ground_y)
    assert bal_ganesh.vel.x > 50.0, f"Ganesh Ji should glide smoothly rightward, got vx = {bal_ganesh.vel.x}"
    assert bal_ganesh.facing == 1, "Ganesh Ji should face rightward towards cursor"
    print(f"[PASS] Smooth glide tracking: vx = {bal_ganesh.vel.x:.2f} px/s towards target")

    # 2. Test Parvati Ji Sub-Pixel Transformed TargetPoint
    print("\n--- 2. Testing Parvati Ji Sub-Pixel Transformed TargetPoint ---")
    parvati.pos.set(400.0, ground_y)
    parvati.facing = 1
    parvati.angle = 0.0
    parvati.update_target_point()
    assert parvati.target_point.x == 424.0, f"Zero rotation target x should be 424.0, got {parvati.target_point.x}"
    assert parvati.target_point.y == ground_y - 44.0, f"Zero rotation target y should be {ground_y - 44.0}, got {parvati.target_point.y}"

    # Test rotated targetPoint (e.g. angle = 0.25 rad during leap)
    parvati.angle = 0.25
    parvati.update_target_point()
    expected_x = 400.0 + (24.0 * math.cos(0.25) - (-44.0) * math.sin(0.25))
    expected_y = ground_y + (24.0 * math.sin(0.25) + (-44.0) * math.cos(0.25))
    assert abs(parvati.target_point.x - expected_x) < 1e-4, "Target point x must follow trigonometric transformation"
    assert abs(parvati.target_point.y - expected_y) < 1e-4, "Target point y must follow trigonometric transformation"
    print(f"[PASS] Sub-pixel targetPoint synchronization: exact match at angle {parvati.angle:.2f} rad")

    # 3. Test Parvati Ji Directional Hysteresis (Zero Alternating-Frame Jitter)
    print("\n--- 3. Testing Parvati Ji Directional Hysteresis ---")
    parvati.angle = 0.0
    parvati.facing = 1
    parvati.facing_hysteresis_timer = 0.4
    # Attempt rapid directional perturbation in mid-range (between 95px and 185px)
    chaser_pos_right = MockBalGanesh(530.0, ground_y)
    chaser_pos_right.update_catch_point()
    parvati.update_evasion_test(0.016, chaser_pos_right, is_anti_gravity=False, ground_y=ground_y)
    assert parvati.facing == 1, "Facing direction must NOT thrash when hysteresis timer is active"
    print(f"[PASS] Directional Hysteresis locked: facing = {parvati.facing} (No rapid flip oscillation)")

    # 4. Test Maa Parvati Corner Trap Detection & Long Wall-Kick Dodge
    print("\n--- 4. Testing Maa Parvati Corner Wall-Kick Dodge ---")
    parvati.facing_hysteresis_timer = 0.0
    parvati.pos.set(150.0, ground_y)   # Near left corner (x < 230)
    bal_ganesh.pos.set(260.0, ground_y) # Ganesh Ji closing in (260 - 150 = 110 < 230)
    bal_ganesh.update_catch_point()
    parvati.update_target_point()
    evasion = parvati.update_evasion_test(0.016, bal_ganesh, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "CORNER_WALL_KICK", f"Left corner trap must trigger CORNER_WALL_KICK, got: {evasion}"
    assert parvati.vel.x == 500.0, f"Long dodge vx should be 500 px/s, got: {parvati.vel.x}"
    assert parvati.vel.y == -450.0, f"Long dodge vy should be -450 px/s, got: {parvati.vel.y}"
    assert parvati.facing == 1, "Maa Parvati must face rightward into open courtyard"
    assert parvati.state == "DASHING", "Maa Parvati must enter DASHING state"
    assert parvati.facing_hysteresis_timer >= 0.5, "Facing direction must be locked during leap"
    print(f"[PASS] Corner Wall-Kick Dodge: vx = {parvati.vel.x:.1f} px/s, vy = {parvati.vel.y:.1f} px/s, hysteresis = {parvati.facing_hysteresis_timer:.2f}s")

    # 5. Test Mid-Field Threat Perception & Floor Vault Leap
    print("\n--- 5. Testing Mid-Field Floor Vault Leap ---")
    parvati.corner_dodge_cooldown = 1.0
    parvati.dash_cooldown = 0.0
    parvati.facing_hysteresis_timer = 0.0
    parvati.pos.set(500.0, ground_y)
    bal_ganesh.pos.set(430.0, ground_y) # Close mid-field (< 95px)
    bal_ganesh.update_catch_point()
    parvati.update_target_point()
    evasion = parvati.update_evasion_test(0.016, bal_ganesh, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "VAULT_LEAP", f"Mid-field threat must trigger VAULT_LEAP, got: {evasion}"
    assert parvati.vel.y == -380.0, f"Parvati vault vy should be -380 px/s, got: {parvati.vel.y}"
    assert parvati.vel.x == 360.0, f"Parvati vault vx should be 360 px/s, got: {parvati.vel.x}"
    print(f"[PASS] Mid-field Floor Vault Leap: vy = {parvati.vel.y:.1f} px/s, vx = {parvati.vel.x:.1f} px/s")

    # 6. Test Calibrated 20px Catch Threshold & Accuracy Lock
    print("\n--- 6. Testing Calibrated 20px Catch Threshold ---")
    sim.swept_min_dist = 999.0
    # 25px distance (rejected!)
    bal_ganesh.catch_point.set(parvati.target_point.x + 25.0, parvati.target_point.y)
    dist, matched = sim.check_alignment()
    assert not matched, f"25px should NOT match (calibrated threshold 20px), dist = {dist}"
    assert sim.attempt_catch() is False, "Catch must fail at 25px"
    print(f"[PASS] 25px distance correctly rejected (Threshold is 20px)")

    # 18px distance (matches!)
    bal_ganesh.catch_point.set(parvati.target_point.x + 18.0, parvati.target_point.y)
    dist, matched = sim.check_alignment()
    assert matched, f"18px must match (calibrated threshold 20px), dist = {dist}"
    print(f"[PASS] 18px distance successfully locked! (dist = {dist:.1f}px <= 20px)")

    # 7. Test Anti-Tunneling Continuous Swept Alignment Check
    print("\n--- 7. Testing Anti-Tunneling Continuous Swept Alignment ---")
    # Simulate high speed where start of frame is 30px to left and end of frame is 30px to right
    p0_catch = Vector2(100.0, ground_y)
    p0_target = Vector2(130.0, ground_y)  # Rel dx = -30
    p1_catch = Vector2(160.0, ground_y)
    p1_target = Vector2(130.0, ground_y)  # Rel dx = +30
    swept_min = sim.step_swept_distance(p0_catch, p0_target, p1_catch, p1_target)
    assert abs(swept_min) < 1e-4, f"Swept minimum distance across passage must be 0.0, got {swept_min}"
    dist, matched = sim.check_alignment()
    assert matched is True, "Swept alignment must detect overlap even if start and end distances exceed threshold!"
    print(f"[PASS] Anti-Tunneling Verified: Swept distance = {swept_min:.2f}px (Zero Miss Guarantee!)")

    # 8. Test Shift Key Input Buffering (110ms buffer)
    print("\n--- 8. Testing Shift Key Input Buffering (110ms buffer) ---")
    sim.swept_min_dist = 999.0
    parvati.is_caught = False
    bal_ganesh.catch_point.set(parvati.target_point.x + 35.0, parvati.target_point.y)
    sim.press_shift()
    assert sim.shift_buffer_timer == 0.11, "Shift buffer should be set to 110ms"
    sim.update(0.04) # 70ms left
    assert not parvati.is_caught, "Parvati should not be caught yet while out of range"
    # Now moves into 20px range within remaining buffer window
    bal_ganesh.catch_point.set(parvati.target_point.x + 16.0, parvati.target_point.y)
    sim.update(0.03)
    assert parvati.is_caught is True, "Buffered Shift key must trigger catch once alignment enters 20px threshold"
    print(f"[PASS] 110ms Shift Key Buffer successfully registered catch upon alignment!")

    # 9. Test Razor-Sharp Reflex Escape (<= 20px held for >= 0.14s)
    print("\n--- 9. Testing Razor-Sharp Reflex Escape Window (0.14s) ---")
    parvati.is_caught = False
    parvati.corner_dodge_cooldown = 1.0
    parvati.dash_cooldown = 0.5
    parvati.align_reflex_timer = 0.0
    bal_ganesh.catch_point.set(parvati.target_point.x + 16.0, parvati.target_point.y)

    # At 0.08s, reflex not yet triggered
    evasion_early = parvati.update_evasion_test(0.08, bal_ganesh)
    assert evasion_early != "REFLEX_ESCAPE", f"Reflex should not trigger before 0.14s, got: {evasion_early}"
    assert round(parvati.align_reflex_timer, 2) == 0.08, f"Reflex timer must be 0.08s, got: {parvati.align_reflex_timer}"
    print(f"[PASS] t = 0.08s: Ganesh Ji maintains lock-on target, timer = {parvati.align_reflex_timer:.2f}s (Clean Window)")

    # Advance past 0.14s (+0.07s = 0.15s)
    evasion_reflex = parvati.update_evasion_test(0.07, bal_ganesh)
    assert evasion_reflex == "REFLEX_ESCAPE", f"Must trigger REFLEX_ESCAPE at >= 0.14s, got: {evasion_reflex}"
    assert abs(parvati.vel.x) == 440.0, f"Reflex escape velocity must be 440 px/s, got: {parvati.vel.x}"
    print(f"[PASS] t = 0.15s: Razor-sharp Reflex Escape triggered! vx = {parvati.vel.x:.1f} px/s, vy = {parvati.vel.y:.1f} px/s")

    # 10. Test Dual Reward System (Ganesh Ji wins modaks & Sanctum Altar Offering)
    print("\n--- 10. Testing Successful Catch & Dual Reward Stages ---")
    parvati.is_caught = False
    bal_ganesh.catch_point.set(parvati.target_point.x + 15.0, parvati.target_point.y)
    caught = sim.attempt_catch()
    assert caught is True, "attempt_catch() should return True"
    assert parvati.is_caught is True, "Parvati should be caught"
    assert sim.bal_ganesh_modak_count == 2, "Ganesh Ji modak count should increment"
    print(f"[PASS] Stage 1: Maa Parvati yields sweet modaks to Ganesh Ji! Modaks won = {sim.bal_ganesh_modak_count}")

    # Advance offering modak flight to sanctum altar
    assert len(sim.offering_modaks) >= 1, "OfferingModak must be launched"
    offering = sim.offering_modaks[-1]
    offering.update(1.4)
    assert offering.is_finished is True, "Offering modak must reach sanctum altar thaali"
    assert sim.prasad_altar_count >= 1, "Prasad count must increment"
    assert sim.altar_blessing_timer == 3.2, "Divine blessing aura must be active"
    print(f"[PASS] Stage 2: Sacred Modak arrived at Sanctum Altar! Prasad count = {sim.prasad_altar_count}")
    print(f"[PASS] Divine Blessing Aura Active (3.2s)")


if __name__ == "__main__":
    test_rewards_and_agility()
    print("\n>>> ALL STABILITY & ACCURACY TESTS PASSED WITH 100%! <<<")
