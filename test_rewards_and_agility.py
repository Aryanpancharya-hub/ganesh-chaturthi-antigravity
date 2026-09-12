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
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(170, 0)
        self.facing = 1
        self.state = "RUNNING"
        self.target_point = Vector2(x, y - 18)
        self.run_speed = 215
        self.danger_zone_radius = 115
        self.dash_cooldown = 0.0
        self.align_reflex_timer = 0.0
        self.is_point_matched = False
        self.is_caught = False
        self.caught_timer = 0.0
        self.caught_count = 0
        self.modaks_eaten_count = 0
        self.is_eating = False
        self.speech_text = ""

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
        self.speech_text = "Mmm! Ma's modaks are the best! 🥟❤️"

    def update_evasion_test(self, dt, mom, is_anti_gravity=False, ground_y=520.0):
        self.dash_cooldown = max(0.0, self.dash_cooldown - dt)
        dist_to_mom = self.pos.distance_to(mom.catch_point)
        escape_dir_x = 1 if self.pos.x >= mom.pos.x else -1

        evasion_triggered = None

        # 1. Danger Zone reaction
        if dist_to_mom < self.danger_zone_radius:
            if not is_anti_gravity and self.pos.y >= ground_y - 30:
                if dist_to_mom < 88 and self.dash_cooldown <= 0:
                    # Acrobatic vault leap
                    self.vel.y = -375.0
                    self.vel.x = escape_dir_x * 290.0
                    self.facing = escape_dir_x
                    self.dash_cooldown = 0.85
                    evasion_triggered = "VAULT_LEAP"
                elif dist_to_mom >= 88:
                    # Sprint burst away
                    self.vel.x += escape_dir_x * 680.0 * dt
                    evasion_triggered = "SPRINT_BURST"
            elif is_anti_gravity:
                self.vel.x += escape_dir_x * 590.0 * dt
                self.vel.y += -190.0 * dt if self.pos.y < mom.pos.y else 190.0 * dt
                evasion_triggered = "AG_SURF"

        # 2. Reflex Escape when points matched (<= 26px)
        if dist_to_mom <= 26:
            self.align_reflex_timer += dt
            if self.align_reflex_timer >= 0.28:
                self.vel.x = escape_dir_x * 360.0
                self.vel.y = -260.0
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
        self.speech_text = "Gotcha! Here is a sweet modak for you, Aarav! 🥟❤️"

class MockOfferingModak:
    def __init__(self, start_x, start_y, target_x, target_y, on_arrive):
        self.start_x = start_x
        self.start_y = start_y
        self.target_x = target_x
        self.target_y = target_y
        self.ctrl_x = (start_x + target_x) / 2
        self.ctrl_y = min(start_y, target_y) - 140
        self.progress = 0.0
        self.duration = 1.35
        self.on_arrive = on_arrive
        self.is_finished = False
        self.pos = Vector2(start_x, start_y)

    def update(self, dt):
        if self.is_finished:
            return
        self.progress += dt / self.duration
        if self.progress >= 1.0:
            self.progress = 1.0
            self.pos.set(self.target_x, self.target_y)
            self.is_finished = True
            if self.on_arrive:
                self.on_arrive()
            return
        
        t = self.progress
        inv_t = 1.0 - t
        bx = inv_t * inv_t * self.start_x + 2 * inv_t * t * self.ctrl_x + t * t * self.target_x
        by = inv_t * inv_t * self.start_y + 2 * inv_t * t * self.ctrl_y + t * t * self.target_y
        self.pos.set(bx, by)

class SimulationRewardSystem:
    def __init__(self, mom, boy, altar_x=490.0, altar_y=494.0):
        self.mom = mom
        self.boy = boy
        self.altar_x = altar_x
        self.altar_y = altar_y
        self.catch_threshold = 26.0
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
    print("TEST SUITE: HIGH AGILITY EVASION & DUAL REWARDS")
    print("==================================================")

    ground_y = 520.0
    mom = MockMom(200.0, ground_y)
    boy = MockBoy(400.0, ground_y)
    sim = SimulationRewardSystem(mom, boy, altar_x=490.0, altar_y=494.0)

    # 1. Test Threat Perception & Acrobatic Vault
    print("\n--- 1. Testing Aarav Danger Sensing & Vault Leap ---")
    mom.pos.x = 330.0 # close to Aarav (400) -> dist ~70px (< 88px)
    mom.update_catch_point()
    boy.update_target_point()
    evasion = boy.update_evasion_test(0.016, mom, is_anti_gravity=False, ground_y=ground_y)
    assert evasion == "VAULT_LEAP", f"Aarav should perform a vault leap, got: {evasion}"
    assert boy.vel.y < -300.0, "Aarav should leap with negative (upward) velocity"
    assert boy.facing == 1, "Aarav should face away from Mom (rightward)"
    print(f"[PASS] Acrobatic Vault Leap triggered! vy = {boy.vel.y} px/s, vx = {boy.vel.x} px/s")

    # 2. Test Reflex Escape after holding alignment
    print("\n--- 2. Testing Aarav Reflex Escape (<= 26px held for >0.28s) ---")
    # Position Mom right on Aarav's target point (dist = 10px)
    mom.catch_point.set(boy.target_point.x + 8.0, boy.target_point.y)
    dist = mom.catch_point.distance_to(boy.target_point)
    assert dist <= 26.0, f"Distance {dist} should be <= 26px"

    # Advance time by 0.20s (under 0.28s threshold -> reflex not yet triggered)
    evasion_mid = boy.update_evasion_test(0.20, mom)
    assert evasion_mid is None, "Reflex should NOT trigger before 0.28s"
    print(f"[PASS] t = 0.20s: Aarav senses imminent catch, timer = {boy.align_reflex_timer:.2f}s")

    # Advance past 0.28s threshold
    evasion_reflex = boy.update_evasion_test(0.10, mom)
    assert evasion_reflex == "REFLEX_ESCAPE", f"Aarav should execute emergency reflex escape, got: {evasion_reflex}"
    print(f"[PASS] t = 0.30s: Reflex Escape triggered! vx = {boy.vel.x} px/s, vy = {boy.vel.y} px/s")

    # 3. Test Strict 26px Catch Threshold
    print("\n--- 3. Testing Strict 26px Threshold ---")
    # 30px distance (was caught at 38px, but now fails!)
    mom.catch_point.set(boy.target_point.x + 30.0, boy.target_point.y)
    dist, matched = sim.check_alignment()
    assert not matched, f"30px should NOT match (threshold 26px), dist = {dist}"
    assert sim.attempt_catch() is False, "Catch must fail at 30px"
    print(f"[PASS] 30px distance correctly rejected! (Threshold is strictly 26px)")

    # 20px distance (within 26px)
    mom.catch_point.set(boy.target_point.x + 18.0, boy.target_point.y)
    dist, matched = sim.check_alignment()
    assert matched, f"18px must match (threshold 26px), dist = {dist}"
    print(f"[PASS] 18px distance successfully matched! Lock-on beam active.")

    # 4. Test Catch Execution & Reward Stage 1 (Feed Aarav)
    print("\n--- 4. Testing Reward Stage 1: Mom Feeds Aarav ---")
    caught = sim.attempt_catch()
    assert caught is True, "attempt_catch() should return True"
    assert boy.is_caught is True, "Aarav should be caught"
    assert boy.is_eating is True, "Aarav eating state should be True"
    assert boy.caught_timer == 3.6, "Caught timer should be 3.6s for celebration sequence"
    assert sim.aarav_modak_count == 1, "Aarav modak count should increment to 1"
    assert "modak" in boy.speech_text.lower(), f"Aarav eating speech: {boy.speech_text}"
    assert "modak" in mom.speech_text.lower(), f"Mom feeding speech: {mom.speech_text}"
    print(f"[PASS] Mom fed Aarav! Aarav Modaks Eaten = {sim.aarav_modak_count}")
    print(f"[PASS] Aarav Dialogue: '{boy.speech_text}'")
    print(f"[PASS] Mom Dialogue: '{mom.speech_text}'")

    # 5. Test Reward Stage 2: Sacred Modak Flight to Lord Ganesha Altar
    print("\n--- 5. Testing Reward Stage 2: Offering Flight to Ganesh Ji ---")
    assert len(sim.offering_modaks) == 1, "OfferingModak entity must be launched"
    offering = sim.offering_modaks[0]
    print(f"[PASS] Offering Modak started at ({offering.start_x:.1f}, {offering.start_y:.1f})")
    print(f"[PASS] Offering Modak target altar at ({offering.target_x:.1f}, {offering.target_y:.1f})")
    print(f"[PASS] Soaring arc apex ctrl_y = {offering.ctrl_y:.1f}")

    # Advance flight halfway
    offering.update(0.70)
    assert not offering.is_finished, "Offering should still be mid-flight at 0.70s"
    print(f"[PASS] Mid-flight at progress {offering.progress:.2f}: pos = ({offering.pos.x:.1f}, {offering.pos.y:.1f})")

    # Advance flight to arrival at altar
    offering.update(0.80)
    assert offering.is_finished is True, "Offering should complete flight"
    assert sim.prasad_ganesh_count == 1, "Prasad to Ganesh Ji counter must increment to 1"
    assert sim.altar_blessing_timer == 3.2, "Altar blessing timer must be activated (3.2s)"
    print(f"[PASS] Modak safely landed on Lord Ganesha's altar plate!")
    print(f"[PASS] Prasad to Ganesh Ji = {sim.prasad_ganesh_count}")
    print(f"[PASS] Lord Ganesha Divine Blessing Aura Active: timer = {sim.altar_blessing_timer}s")

if __name__ == "__main__":
    test_rewards_and_agility()
    print("\n>>> ALL AGILITY & DUAL REWARD TESTS PASSED SUCCESSFULLY! <<<")
