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

class MockBoy:
    def __init__(self, x, y, width=1000.0):
        self.pos = Vector2(x, y)
        self.vel = Vector2(160, 0)
        self.facing = 1
        self.state = "RUNNING"
        self.target_point = Vector2(x, y - 18)
        self.run_speed = 210          # Medium Dodge rebalance (down from 240)
        self.danger_zone_radius = 125 # Reduced danger zone (down from 160)
        self.catch_threshold = 28     # Expanded catch accuracy (up from 14)
        self.dash_cooldown = 0.0
        self.corner_dodge_cooldown = 0.0
        self.align_reflex_timer = 0.0
        self.dash_timer = 0.0
        self.is_point_matched = False
        self.is_caught = False
        self.caught_timer = 0.0
        self.caught_count = 0
        self.modaks_eaten_count = 0
        self.is_eating = False
        self.speech_text = ""
        self.width = width

    def update_target_point(self):
        self.target_point.x = self.pos.x
        self.target_point.y = self.pos.y - 18

    def trigger_caught(self, chaser):
        self.is_caught = True
        self.caught_timer = 3.6
        self.state = "CAUGHT"
        self.caught_count += 1
        self.modaks_eaten_count += 1
        self.is_eating = True
        self.vel.set(0, 0)
        self.facing = 1 if chaser.pos.x > self.pos.x else -1
        self.speech_text = "Pranam Ganesh Ji! Your modaks are divine! \U0001F95F\U0001F64F\u2728"

    def update_evasion_test(self, dt, chaser, is_anti_gravity=False, ground_y=520.0):
        self.dash_cooldown = max(0.0, self.dash_cooldown - dt)
        self.corner_dodge_cooldown = max(0.0, self.corner_dodge_cooldown - dt)
        dist_to_chaser = self.pos.distance_to(chaser.catch_point)
        dist_points = self.target_point.distance_to(chaser.catch_point)
        escape_dir_x = 1 if self.pos.x >= chaser.pos.x else -1

        evasion_triggered = None

        # A. Corner Trap Detection & Medium Wall-Kick Long Dodge
        is_near_left_corner = self.pos.x < 220
        is_near_right_corner = self.pos.x > self.width - 220
        chaser_trapping_left = is_near_left_corner and chaser.pos.x > self.pos.x and (chaser.pos.x - self.pos.x) < 220
        chaser_trapping_right = is_near_right_corner and chaser.pos.x < self.pos.x and (self.pos.x - chaser.pos.x) < 220

        if (chaser_trapping_left or chaser_trapping_right) and self.corner_dodge_cooldown <= 0:
            launch_dir = 1 if chaser_trapping_left else -1
            if not is_anti_gravity:
                self.vel.x = launch_dir * 320.0  # Medium leap (manageable hop)
                self.vel.y = -350.0
            else:
                self.vel.x = launch_dir * 300.0
                self.vel.y = -220.0 if self.pos.y < chaser.pos.y else 240.0
            self.facing = launch_dir
            self.dash_timer = 0.50
            self.state = "DASHING"
            self.dash_cooldown = 1.0
            self.corner_dodge_cooldown = 2.4
            self.align_reflex_timer = 0.0
            evasion_triggered = "CORNER_WALL_KICK"
            return evasion_triggered

        # B. Proactive Mid-field & Airborne Evasion
        elif dist_to_chaser < self.danger_zone_radius:
            if not is_anti_gravity and self.pos.y >= ground_y - 30:
                if dist_to_chaser < 80 and self.dash_cooldown <= 0:
                    self.vel.y = -330.0
                    self.vel.x = escape_dir_x * 280.0
                    self.facing = escape_dir_x
                    self.dash_timer = 0.40
                    self.state = "DASHING"
                    self.dash_cooldown = 0.95
                    evasion_triggered = "VAULT_LEAP"
                else:
                    self.vel.x += escape_dir_x * 520.0 * dt
                    evasion_triggered = "SPRINT_BURST"
            elif self.pos.y < ground_y - 30 and dist_to_chaser < 75 and self.dash_cooldown <= 0:
                self.vel.y = -220.0
                self.vel.x = escape_dir_x * 300.0
                self.facing = escape_dir_x
                self.dash_timer = 0.38
                self.state = "DASHING"
                self.dash_cooldown = 1.0
                evasion_triggered = "AIR_FEINT"
            elif is_anti_gravity:
                self.vel.x += escape_dir_x * 450.0 * dt
                self.vel.y += -180.0 * dt if self.pos.y < chaser.pos.y else 180.0 * dt
                evasion_triggered = "AG_SURF"

        # C. Reflex Escape when points closely matched (<= 28px, 0.36s window)
        if dist_points <= self.catch_threshold:
            self.align_reflex_timer += dt
            if self.align_reflex_timer >= 0.36:
                self.vel.x = escape_dir_x * 350.0
                self.vel.y = -220.0
                self.facing = escape_dir_x
                self.dash_timer = 0.40
                self.state = "DASHING"
                self.align_reflex_timer = 0.0
                self.dash_cooldown = 1.0
                evasion_triggered = "REFLEX_ESCAPE"
        else:
            self.align_reflex_timer = 0.0

        return evasion_triggered

class MockGaneshJi:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.facing = 1
        self.reach_up = False
        self.catch_point = Vector2(x + 24, y - 44)
        self.is_point_matched = False
        self.is_blessing = False
        self.is_hugging = False
        self.bless_timer = 0.0
        self.speech_text = ""

    def update_catch_point(self):
        if self.reach_up:
            self.catch_point.x = self.pos.x + self.facing * 14
            self.catch_point.y = self.pos.y - 68
        else:
            self.catch_point.x = self.pos.x + self.facing * 24
            self.catch_point.y = self.pos.y - 44

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
                max_speed = 270.0
                desired_vx = (1.0 if dx > 0 else -1.0) * min(max_speed, (dist_to_cursor_x - 6) * 4.4)

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
                self.reach_up = cursor_pos.y < (ground_y - 45)

        self.update_catch_point()

    def trigger_catch_success(self, boy):
        self.is_blessing = True
        self.is_hugging = True
        self.bless_timer = 3.6
        self.speech_text = "Blessings upon you, Aarav! Have this divine modak! \U0001F95F\u2728"

# Alias for backwards compatibility
MockMom = MockGaneshJi

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
    def __init__(self, chaser, boy, altar_x=500.0, altar_y=494.0):
        self.chaser = chaser
        self.mom = chaser
        self.boy = boy
        self.altar_x = altar_x
        self.altar_y = altar_y
        self.catch_threshold = 28.0  # Accurate 28px lock-on threshold
        self.shift_buffer_timer = 0.0 # 120ms Shift key buffer
        self.aarav_modak_count = 0
        self.prasad_ganesh_count = 0
        self.altar_blessing_timer = 0.0
        self.offering_modaks = []

    def check_alignment(self):
        dist = self.chaser.catch_point.distance_to(self.boy.target_point)
        is_matched = dist <= self.catch_threshold
        self.chaser.is_point_matched = is_matched
        self.boy.is_point_matched = is_matched
        return dist, is_matched

    def press_shift(self):
        self.shift_buffer_timer = 0.12  # 120ms buffer

    def update(self, dt):
        if self.shift_buffer_timer > 0:
            self.shift_buffer_timer -= dt
            dist, is_matched = self.check_alignment()
            if is_matched and not self.boy.is_caught:
                self.attempt_catch()
                self.shift_buffer_timer = 0.0

    def attempt_catch(self):
        dist, is_matched = self.check_alignment()
        if is_matched and not self.boy.is_caught:
            self.chaser.trigger_catch_success(self.boy)
            self.boy.trigger_caught(self.chaser)
            # Stage 1: Feed Aarav
            self.aarav_modak_count += 1

            # Stage 2: Offering modak flight
            def on_arrive():
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
    print("==================================================================")
    print("TEST SUITE: GANESH JI STABILITY, MEDIUM DODGE & 28PX CATCH ACCURACY")
    print("==================================================================")

    ground_y = 520.0
    ganesh = MockGaneshJi(200.0, ground_y)
    boy = MockBoy(400.0, ground_y, width=1000.0)
    sim = SimulationRewardSystem(ganesh, boy, altar_x=500.0, altar_y=494.0)

    # 1. Test Ganesh Ji Kinematics: Deadzone & Ground Stability
    print("\n--- 1. Testing Ganesh Ji Movement Stability & Anti-Jitter Deadzone ---")
    # A: Deadzone < 6px (e.g. cursor at 204.0, distance 4.0px)
    ganesh.pos.set(200.0, ground_y)
    ganesh.vel.set(20.0, 0.0)
    cursor_pos = Vector2(204.0, ground_y)
    ganesh.update_kinematics(0.05, cursor_pos, is_cursor_active=True, is_anti_gravity=False, ground_y=ground_y)
    # Velocity should be damped towards 0 since dist <= 6
    assert abs(ganesh.vel.x) < 20.0, f"Deadzone should dampen velocity, got vx = {ganesh.vel.x}"
    assert ganesh.vel.y == 0.0, "1G ground lock must have vy == 0"
    assert ganesh.pos.y == ground_y, "1G ground lock must remain pinned to groundY"
    print(f"[PASS] Anti-Jitter Deadzone (<6px): vx damped to {ganesh.vel.x:.2f} px/s, vy locked at 0.0")

    # B: Smooth tracking when cursor is far (e.g. cursor at 350.0, distance 150px)
    cursor_pos.set(350.0, ground_y)
    ganesh.update_kinematics(0.05, cursor_pos, is_cursor_active=True, is_anti_gravity=False, ground_y=ground_y)
    assert ganesh.vel.x > 50.0, f"Ganesh Ji should glide smoothly rightward, got vx = {ganesh.vel.x}"
    assert ganesh.facing == 1, "Ganesh Ji should face rightward towards cursor"
    print(f"[PASS] Smooth glide tracking: vx = {ganesh.vel.x:.2f} px/s towards target")

    # 2. Test Corner Trap Detection & Medium Wall-Kick Dodge (Left Corner)
    print("\n--- 2. Testing Corner Trap Detection & Medium Dodge (Left Corner) ---")
    boy.pos.set(150.0, ground_y)   # Near left corner (x < 220)
    ganesh.pos.set(260.0, ground_y) # Ganesh Ji closing in (260 - 150 = 110 < 220)
    ganesh.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, ganesh, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "CORNER_WALL_KICK", f"Left corner trap must trigger CORNER_WALL_KICK, got: {evasion}"
    assert 300.0 <= boy.vel.x <= 360.0, f"Medium dodge vx should be around 320 px/s, got: {boy.vel.x}"
    assert -390.0 <= boy.vel.y <= -340.0, f"Medium dodge vy should be around -350 px/s, got: {boy.vel.y}"
    assert boy.facing == 1, "Aarav must face rightward into open courtyard"
    assert boy.state == "DASHING", "Aarav must enter DASHING state"
    print(f"[PASS] Left Corner Medium Wall-Kick Dodge: vx = {boy.vel.x:.1f} px/s, vy = {boy.vel.y:.1f} px/s (Manageable Hop!)")

    # 3. Test Corner Trap Detection & Medium Wall-Kick Dodge (Right Corner)
    print("\n--- 3. Testing Corner Trap Detection & Medium Dodge (Right Corner) ---")
    boy.corner_dodge_cooldown = 0.0 # reset cooldown
    boy.pos.set(880.0, ground_y)   # Near right corner (1000 - 880 = 120 < 220)
    ganesh.pos.set(760.0, ground_y) # Ganesh Ji closing in from left
    ganesh.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, ganesh, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "CORNER_WALL_KICK", f"Right corner trap must trigger CORNER_WALL_KICK, got: {evasion}"
    assert -360.0 <= boy.vel.x <= -300.0, f"Medium dodge vx should be around -320 px/s, got: {boy.vel.x}"
    assert boy.facing == -1, "Aarav must face leftward into open courtyard"
    print(f"[PASS] Right Corner Medium Wall-Kick Dodge: vx = {boy.vel.x:.1f} px/s, vy = {boy.vel.y:.1f} px/s")

    # 4. Test Mid-Field Threat Perception & Medium Floor Vault Leap
    print("\n--- 4. Testing Mid-Field Threat Perception & Medium Floor Vault ---")
    boy.corner_dodge_cooldown = 1.0 # not in corner
    boy.dash_cooldown = 0.0
    boy.pos.set(500.0, ground_y)
    ganesh.pos.set(450.0, ground_y) # Close mid-field (< 80px)
    ganesh.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, ganesh, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "VAULT_LEAP", f"Mid-field threat must trigger VAULT_LEAP, got: {evasion}"
    assert -370.0 <= boy.vel.y <= -320.0, f"Aarav medium vault vy should be around -330 px/s, got: {boy.vel.y}"
    assert 260.0 <= abs(boy.vel.x) <= 320.0, f"Aarav medium vault vx should be around 280 px/s, got: {boy.vel.x}"
    print(f"[PASS] Mid-field Medium Vault Leap: vy = {boy.vel.y:.1f} px/s, vx = {boy.vel.x:.1f} px/s")

    # 5. Test 28px Catch Threshold & Accuracy Lock
    print("\n--- 5. Testing Improved 28px Catch Threshold ---")
    # 35px distance (rejected!)
    ganesh.catch_point.set(boy.target_point.x + 35.0, boy.target_point.y)
    dist, matched = sim.check_alignment()
    assert not matched, f"35px should NOT match (threshold 28px), dist = {dist}"
    assert sim.attempt_catch() is False, "Catch must fail at 35px"
    print(f"[PASS] 35px distance correctly rejected! (Threshold is 28px)")

    # 25px distance (matches!)
    ganesh.catch_point.set(boy.target_point.x + 25.0, boy.target_point.y)
    dist, matched = sim.check_alignment()
    assert matched, f"25px must match (threshold 28px), dist = {dist}"
    print(f"[PASS] 25px distance successfully locked! (dist = {dist:.1f}px <= 28px)")

    # 6. Test Shift Key Input Buffering (120ms buffer)
    print("\n--- 6. Testing Shift Key Input Buffering (120ms buffer) ---")
    # First place points outside catch range
    ganesh.catch_point.set(boy.target_point.x + 40.0, boy.target_point.y)
    sim.press_shift()
    assert sim.shift_buffer_timer == 0.12, "Shift buffer should be set to 120ms"
    # Advance time 30ms (buffer still active: 90ms left)
    sim.update(0.03)
    assert not boy.is_caught, "Aarav should not be caught yet while out of range"
    # Now points move into 28px range while buffer is still alive
    ganesh.catch_point.set(boy.target_point.x + 22.0, boy.target_point.y)
    sim.update(0.02)
    assert boy.is_caught is True, "Buffered Shift key must trigger catch once alignment enters 28px threshold"
    print(f"[PASS] 120ms Shift Key Buffer successfully registered catch upon alignment!")

    # 7. Test Balanced Reflex Escape (<= 28px held for >= 0.36s)
    print("\n--- 7. Testing Balanced Reflex Escape Window (0.36s) ---")
    # Reset boy state
    boy.is_caught = False
    boy.corner_dodge_cooldown = 1.0
    boy.dash_cooldown = 0.5
    boy.align_reflex_timer = 0.0
    ganesh.catch_point.set(boy.target_point.x + 20.0, boy.target_point.y)

    # At 0.20s, reflex not yet triggered (fair window for player)
    evasion_early = boy.update_evasion_test(0.20, ganesh)
    assert evasion_early != "REFLEX_ESCAPE", f"Reflex should not trigger before 0.36s, got: {evasion_early}"
    assert round(boy.align_reflex_timer, 2) == 0.20, f"Reflex timer must be 0.20s, got: {boy.align_reflex_timer}"
    print(f"[PASS] t = 0.20s: Aarav maintains lock-on target, timer = {boy.align_reflex_timer:.2f}s (No early escape)")

    # Advance past 0.36s (e.g. +0.18s = 0.38s)
    evasion_reflex = boy.update_evasion_test(0.18, ganesh)
    assert evasion_reflex == "REFLEX_ESCAPE", f"Must trigger REFLEX_ESCAPE at >= 0.36s, got: {evasion_reflex}"
    assert abs(boy.vel.x) == 350.0, f"Reflex escape velocity must be 350 px/s, got: {boy.vel.x}"
    print(f"[PASS] t = 0.38s: Balanced Reflex Escape triggered! vx = {boy.vel.x:.1f} px/s, vy = {boy.vel.y:.1f} px/s")

    # 8. Test Dual Reward System (Aarav Modak & Lord Ganesha Prasad Offering)
    print("\n--- 8. Testing Successful Catch & Dual Reward Stages ---")
    boy.is_caught = False
    ganesh.catch_point.set(boy.target_point.x + 15.0, boy.target_point.y)
    caught = sim.attempt_catch()
    assert caught is True, "attempt_catch() should return True"
    assert boy.is_caught is True, "Aarav should be caught"
    assert sim.aarav_modak_count == 2, "Aarav modak count should increment"
    print(f"[PASS] Stage 1: Ganesh Ji blesses Aarav with delicious modak! Modaks eaten = {sim.aarav_modak_count}")

    # Advance offering modak flight to Lord Ganesha's sanctum
    assert len(sim.offering_modaks) >= 1, "OfferingModak must be launched"
    offering = sim.offering_modaks[-1]
    offering.update(1.4)
    assert offering.is_finished is True, "Offering modak must reach Lord Ganesha's thaali"
    assert sim.prasad_ganesh_count >= 1, "Prasad to Ganesh Ji count must increment"
    assert sim.altar_blessing_timer == 3.2, "Lord Ganesha divine blessing aura must be active"
    print(f"[PASS] Stage 2: Sacred Modak arrived at Lord Ganesha altar! Prasad count = {sim.prasad_ganesh_count}")
    print(f"[PASS] Lord Ganesha Divine Halo Blessing Aura Active (3.2s)")

if __name__ == "__main__":
    test_rewards_and_agility()
    print("\n>>> ALL GANESH JI STABILITY, MEDIUM DODGE & 28PX ACCURACY TESTS PASSED! <<<")
