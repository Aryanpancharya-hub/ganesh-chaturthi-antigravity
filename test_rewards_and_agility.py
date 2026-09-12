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
        self.vel = Vector2(170, 0)
        self.facing = 1
        self.state = "RUNNING"
        self.target_point = Vector2(x, y - 18)
        self.run_speed = 240
        self.danger_zone_radius = 160
        self.catch_threshold = 14
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

    def trigger_caught(self, mom):
        self.is_caught = True
        self.caught_timer = 3.6
        self.state = "CAUGHT"
        self.caught_count += 1
        self.modaks_eaten_count += 1
        self.is_eating = True
        self.vel.set(0, 0)
        self.facing = 1 if mom.pos.x > self.pos.x else -1
        self.speech_text = "Mmm! Ma's modaks are the best! ????"

    def update_evasion_test(self, dt, mom, is_anti_gravity=False, ground_y=520.0):
        self.dash_cooldown = max(0.0, self.dash_cooldown - dt)
        self.corner_dodge_cooldown = max(0.0, self.corner_dodge_cooldown - dt)
        dist_to_mom = self.pos.distance_to(mom.catch_point)
        dist_points = self.target_point.distance_to(mom.catch_point)
        escape_dir_x = 1 if self.pos.x >= mom.pos.x else -1

        evasion_triggered = None

        # A. Corner Trap Detection & Explosive Wall-Kick Long Dodge
        is_near_left_corner = self.pos.x < 240
        is_near_right_corner = self.pos.x > self.width - 240
        mom_trapping_left = is_near_left_corner and mom.pos.x > self.pos.x and (mom.pos.x - this_x if False else (mom.pos.x - self.pos.x) < 260)
        mom_trapping_right = is_near_right_corner and mom.pos.x < self.pos.x and (self.pos.x - mom.pos.x) < 260

        if (mom_trapping_left or mom_trapping_right) and self.corner_dodge_cooldown <= 0:
            launch_dir = 1 if mom_trapping_left else -1
            if not is_anti_gravity:
                self.vel.x = launch_dir * 540.0
                self.vel.y = -470.0
            else:
                self.vel.x = launch_dir * 500.0
                self.vel.y = -320.0 if self.pos.y < mom.pos.y else 340.0
            self.facing = launch_dir
            self.dash_timer = 0.70
            self.state = "DASHING"
            self.dash_cooldown = 1.1
            self.corner_dodge_cooldown = 1.6
            self.align_reflex_timer = 0.0
            evasion_triggered = "CORNER_WALL_KICK"
            return evasion_triggered

        # B. Proactive Mid-field & Airborne Evasion
        elif dist_to_mom < self.danger_zone_radius:
            if not is_anti_gravity and self.pos.y >= ground_y - 30:
                if dist_to_mom < 100 and self.dash_cooldown <= 0:
                    self.vel.y = -410.0
                    self.vel.x = escape_dir_x * 380.0
                    self.facing = escape_dir_x
                    self.dash_timer = 0.50
                    self.state = "DASHING"
                    self.dash_cooldown = 0.85
                    evasion_triggered = "VAULT_LEAP"
                else:
                    self.vel.x += escape_dir_x * 840.0 * dt
                    evasion_triggered = "SPRINT_BURST"
            elif self.pos.y < ground_y - 30 and dist_to_mom < 95 and self.dash_cooldown <= 0:
                self.vel.y = -260.0
                self.vel.x = escape_dir_x * 420.0
                self.facing = escape_dir_x
                self.dash_timer = 0.45
                self.state = "DASHING"
                self.dash_cooldown = 0.9
                evasion_triggered = "AIR_FEINT"
            elif is_anti_gravity:
                self.vel.x += escape_dir_x * 720.0 * dt
                self.vel.y += -240.0 * dt if self.pos.y < mom.pos.y else 240.0 * dt
                evasion_triggered = "AG_SURF"

        # C. Reflex Escape when points closely matched (<= 14px, 0.12s window)
        if dist_points <= 14.0:
            self.align_reflex_timer += dt
            if self.align_reflex_timer >= 0.12:
                self.vel.x = escape_dir_x * 460.0
                self.vel.y = -280.0
                self.facing = escape_dir_x
                self.dash_timer = 0.50
                self.state = "DASHING"
                self.align_reflex_timer = 0.0
                self.dash_cooldown = 0.9
                evasion_triggered = "REFLEX_ESCAPE"
        else:
            self.align_reflex_timer = 0.0

        return evasion_triggered

class MockMom:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.facing = 1
        self.reach_up = False
        self.catch_point = Vector2(x + 24, y - 44)
        self.is_point_matched = False
        self.is_hugging = False
        self.hug_timer = 0.0
        self.speech_text = ""

    def update_catch_point(self):
        if self.reach_up:
            self.catch_point.x = self.pos.x + self.facing * 14
            self.catch_point.y = self.pos.y - 68
        else:
            self.catch_point.x = self.pos.x + self.facing * 24
            self.catch_point.y = self.pos.y - 44

    def trigger_catch_success(self, boy):
        self.is_hugging = True
        self.hug_timer = 3.6
        self.speech_text = "Caught you, Aarav! Here is your favorite sweet modak! ????"

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
        # Quadratic Bezier formula
        self.pos.x = inv_t * inv_t * self.start_x + 2 * inv_t * t * self.ctrl_x + t * t * self.target_x
        self.pos.y = inv_t * inv_t * self.start_y + 2 * inv_t * t * self.ctrl_y + t * t * self.target_y
        if self.progress >= 1.0:
            self.is_finished = True
            if self.on_arrive:
                self.on_arrive()

class SimulationRewardSystem:
    def __init__(self, mom, boy, altar_x=500.0, altar_y=494.0):
        self.mom = mom
        self.boy = boy
        self.altar_x = altar_x
        self.altar_y = altar_y
        self.catch_threshold = 14  # Strict 14px threshold
        self.aarav_modak_count = 0
        self.prasad_ganesh_count = 0
        self.altar_blessing_timer = 0.0
        self.offering_modaks = []

    def check_alignment(self):
        dist = self.mom.catch_point.distance_to(self.boy.target_point)
        is_matched = dist <= self.catch_threshold
        self.mom.is_point_matched = is_matched
        self.boy.is_point_matched = is_matched
        return dist, is_matched

    def attempt_catch(self):
        dist, is_matched = self.check_alignment()
        if is_matched and not self.boy.is_caught:
            self.mom.trigger_catch_success(self.boy)
            self.boy.trigger_caught(self.mom)
            # Stage 1: Feed Aarav
            self.aarav_modak_count += 1

            # Stage 2: Offering modak flight
            def on_arrive():
                self.prasad_ganesh_count += 1
                self.altar_blessing_timer = 3.2

            offering = MockOfferingModak(
                self.mom.catch_point.x, self.mom.catch_point.y,
                self.altar_x, self.altar_y, on_arrive
            )
            self.offering_modaks.append(offering)
            return True
        return False

def test_rewards_and_agility():
    print("==================================================")
    print("TEST SUITE: CORNER LONG DODGE & 14PX RARE CATCH")
    print("==================================================")

    ground_y = 520.0
    mom = MockMom(200.0, ground_y)
    boy = MockBoy(400.0, ground_y, width=1000.0)
    sim = SimulationRewardSystem(mom, boy, altar_x=500.0, altar_y=494.0)

    # 1. Test Corner Trap Detection & Explosive Wall-Kick Long Dodge (Left Corner)
    print("\n--- 1. Testing Corner Trap Detection & Wall-Kick Long Dodge (Left Corner) ---")
    boy.pos.set(150.0, ground_y) # Near left corner (x < 240)
    mom.pos.set(280.0, ground_y) # Mom closing in from right (distance 130px < 260px)
    mom.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, mom, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "CORNER_WALL_KICK", f"Left corner trap must trigger CORNER_WALL_KICK, got: {evasion}"
    assert boy.vel.x > 500.0, f"Aarav must launch towards center with vx > 500, got: {boy.vel.x}"
    assert boy.vel.y <= -450.0, f"Aarav must vault high with vy <= -450, got: {boy.vel.y}"
    assert boy.facing == 1, "Aarav must face rightward into open courtyard"
    assert boy.state == "DASHING", "Aarav must enter DASHING state"
    print(f"[PASS] Left Corner Wall-Kick Dodge: vx = {boy.vel.x} px/s, vy = {boy.vel.y} px/s (Clears over Mom!)")

    # 2. Test Corner Trap Detection & Explosive Wall-Kick Long Dodge (Right Corner)
    print("\n--- 2. Testing Corner Trap Detection & Wall-Kick Long Dodge (Right Corner) ---")
    boy.corner_dodge_cooldown = 0.0 # reset cooldown
    boy.pos.set(880.0, ground_y) # Near right corner (1000 - 880 = 120 < 240)
    mom.pos.set(740.0, ground_y) # Mom closing in from left
    mom.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, mom, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "CORNER_WALL_KICK", f"Right corner trap must trigger CORNER_WALL_KICK, got: {evasion}"
    assert boy.vel.x < -500.0, f"Aarav must launch leftward towards center with vx < -500, got: {boy.vel.x}"
    assert boy.vel.y <= -450.0, f"Aarav must vault high with vy <= -450, got: {boy.vel.y}"
    assert boy.facing == -1, "Aarav must face leftward into open courtyard"
    print(f"[PASS] Right Corner Wall-Kick Dodge: vx = {boy.vel.x} px/s, vy = {boy.vel.y} px/s (Clears over Mom!)")

    # 3. Test Mid-Field Threat Perception & Acrobatic Vault Leap
    print("\n--- 3. Testing Mid-Field Threat Perception & Vault Leap ---")
    boy.corner_dodge_cooldown = 1.0 # not in corner
    boy.dash_cooldown = 0.0
    boy.pos.set(500.0, ground_y)
    mom.pos.set(440.0, ground_y) # Close mid-field (< 100px)
    mom.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, mom, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "VAULT_LEAP", f"Mid-field threat must trigger VAULT_LEAP, got: {evasion}"
    assert boy.vel.y <= -400.0, f"Aarav must leap with vy <= -400, got: {boy.vel.y}"
    print(f"[PASS] Mid-field Vault Leap: vy = {boy.vel.y} px/s, vx = {boy.vel.x} px/s")

    # 4. Test Strict 14px Catch Threshold
    print("\n--- 4. Testing Strict 14px Threshold ---")
    # 18px distance (fails!)
    mom.catch_point.set(boy.target_point.x + 18.0, boy.target_point.y)
    dist, matched = sim.check_alignment()
    assert not matched, f"18px should NOT match (threshold 14px), dist = {dist}"
    assert sim.attempt_catch() is False, "Catch must fail at 18px"
    print(f"[PASS] 18px distance correctly rejected! (Threshold is strictly 14px)")

    # 12px distance (matches!)
    mom.catch_point.set(boy.target_point.x + 12.0, boy.target_point.y)
    dist, matched = sim.check_alignment()
    assert matched, f"12px must match (threshold 14px), dist = {dist}"
    print(f"[PASS] 12px distance successfully matched! Lock-on beam active.")

    # 5. Test Ultra-Fast Reflex Escape (<= 14px held for >= 0.12s)
    print("\n--- 5. Testing Ultra-Fast Reflex Escape (<= 14px held for >= 0.12s) ---")
    boy.corner_dodge_cooldown = 1.0
    boy.dash_cooldown = 0.5
    boy.align_reflex_timer = 0.0
    mom.catch_point.set(boy.target_point.x + 8.0, boy.target_point.y)
    # At 0.08s, reflex not yet triggered
    evasion_early = boy.update_evasion_test(0.08, mom)
    assert evasion_early != "REFLEX_ESCAPE", f"Reflex should not trigger before 0.12s, got: {evasion_early}"
    assert round(boy.align_reflex_timer, 2) == 0.08, f"Reflex timer must be 0.08s, got: {boy.align_reflex_timer}"
    print(f"[PASS] t = 0.08s: Aarav senses razor close proximity, timer = {boy.align_reflex_timer:.2f}s")

    # Advance past 0.12s
    evasion_reflex = boy.update_evasion_test(0.05, mom)
    assert evasion_reflex == "REFLEX_ESCAPE", f"Must trigger REFLEX_ESCAPE at >= 0.12s, got: {evasion_reflex}"
    assert abs(boy.vel.x) > 400.0, f"Reflex escape velocity must exceed 400 px/s, got: {boy.vel.x}"
    print(f"[PASS] t = 0.13s: Ultra-fast Reflex Escape triggered! vx = {boy.vel.x} px/s, vy = {boy.vel.y} px/s")

    # 6. Test Rare Catch Execution & Reward Stages
    print("\n--- 6. Testing Successful Rare Catch & Dual Reward Stages ---")
    mom.catch_point.set(boy.target_point.x + 6.0, boy.target_point.y)
    caught = sim.attempt_catch()
    assert caught is True, "attempt_catch() should return True"
    assert boy.is_caught is True, "Aarav should be caught"
    assert sim.aarav_modak_count == 1, "Aarav modak count should increment to 1"
    print(f"[PASS] Stage 1: Mom feeds sweet modak to Aarav! Modaks eaten = {sim.aarav_modak_count}")

    # Advance offering modak flight to Lord Ganesha
    assert len(sim.offering_modaks) == 1, "OfferingModak must be launched"
    offering = sim.offering_modaks[0]
    offering.update(1.4)
    assert offering.is_finished is True, "Offering modak must reach Lord Ganesha's thaali"
    assert sim.prasad_ganesh_count == 1, "Prasad to Ganesh Ji count must increment to 1"
    assert sim.altar_blessing_timer == 3.2, "Lord Ganesha divine blessing aura must be active"
    print(f"[PASS] Stage 2: Sacred Modak arrived at Lord Ganesha altar! Prasad count = {sim.prasad_ganesh_count}")
    print(f"[PASS] Lord Ganesha Divine Halo Blessing Aura Active (3.2s)")

if __name__ == "__main__":
    test_rewards_and_agility()
    print("\n>>> ALL CORNER DODGE, AGILITY & 14PX THRESHOLD TESTS PASSED SUCCESSFULLY! <<<")
