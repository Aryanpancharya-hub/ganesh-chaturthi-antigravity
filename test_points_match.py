import math
import sys

# Ensure UTF-8 output on Windows console if supported, otherwise safe encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class Vector2:
    def __init__(self, x=0.0, y=0.0):
        self.x = float(x)
        self.y = float(y)
    
    def distance_to(self, other):
        return math.hypot(self.x - other.x, self.y - other.y)

class MockBoy:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(190, 0)
        self.facing = 1
        self.state = "RUNNING"
        self.target_point = Vector2(x, y - 18)
        self.is_point_matched = False
        self.is_caught = False
        self.caught_timer = 0.0
        self.caught_count = 0
        self.speech_text = ""

    def update_target_point(self):
        self.target_point.x = self.pos.x
        self.target_point.y = self.pos.y - 18

    def trigger_caught(self, mom):
        self.is_caught = True
        self.caught_timer = 2.2
        self.state = "CAUGHT"
        self.caught_count += 1
        self.vel.x = 0
        self.vel.y = 0
        self.speech_text = "Aww, you got me, Ma!"

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
        self.hug_timer = 2.2
        self.speech_text = "Gotcha, my little hero!"

class SimulationCatchSystem:
    def __init__(self, mom, boy):
        self.mom = mom
        self.boy = boy
        self.catch_threshold = 38.0

    def check_alignment(self):
        dist = self.mom.catch_point.distance_to(self.boy.target_point)
        is_matched = dist <= self.catch_threshold
        self.mom.is_point_matched = is_matched
        self.boy.is_point_matched = is_matched
        return dist, is_matched

    def attempt_catch(self, shift_pressed=True):
        if not shift_pressed:
            return False
        dist, is_matched = self.check_alignment()
        if is_matched and not self.boy.is_caught:
            self.mom.trigger_catch_success(self.boy)
            self.boy.trigger_caught(self.mom)
            return True
        return False

def test_point_matching_and_catch():
    print("--- 1. Testing Initial State & Points Geometry ---")
    ground_y = 520.0
    mom = MockMom(200.0, ground_y)
    boy = MockBoy(400.0, ground_y)
    sim = SimulationCatchSystem(mom, boy)

    mom.update_catch_point()
    boy.update_target_point()

    assert mom.catch_point.x == 224.0 and mom.catch_point.y == 476.0, "Mom catch point should be at hands"
    assert boy.target_point.x == 400.0 and boy.target_point.y == 502.0, "Aarav target point should be at chest"
    print(f"[PASS] Mom catch point: ({mom.catch_point.x}, {mom.catch_point.y})")
    print(f"[PASS] Aarav target point: ({boy.target_point.x}, {boy.target_point.y})")

    print("\n--- 2. Testing Distance Above Threshold (> 38px) ---")
    dist, matched = sim.check_alignment()
    assert not matched, f"Points should NOT match at distance {dist:.2f}px"
    assert dist > 38.0
    print(f"[PASS] Distance is {dist:.2f}px (> 38px threshold) -> Alignment matched: {matched}")

    # Pressing Shift when NOT matched should fail
    caught_success = sim.attempt_catch(shift_pressed=True)
    assert not caught_success, "Attempting catch when points are not matched must fail"
    assert not boy.is_caught, "Boy must not be caught"
    assert boy.caught_count == 0, "Caught count must remain 0"
    print("[PASS] Shift pressed while out of range: Catch rejected successfully.")

    print("\n--- 3. Testing Mom Cursor Follow & Alignment Matching (<= 38px) ---")
    # Move Mom close to Aarav as cursor tracks Aarav
    mom.pos.x = 380.0
    mom.pos.y = ground_y
    mom.facing = 1
    mom.reach_up = False
    mom.update_catch_point() # catch_point: (380 + 24 = 404, 520 - 44 = 476)

    # Aarav target_point is at (400, 502)
    dist, matched = sim.check_alignment()
    print(f"[PASS] Mom moved near Aarav. Catch Point: ({mom.catch_point.x}, {mom.catch_point.y})")
    print(f"[PASS] Aarav Target Point: ({boy.target_point.x}, {boy.target_point.y})")
    print(f"[PASS] Inter-point Euclidean distance: {dist:.2f}px")
    assert dist <= 38.0, f"Distance {dist:.2f}px should be within 38px"
    assert matched, "Points should be marked as MATCHED"
    print("[PASS] Points successfully aligned! Green lock-on beam active.")

    print("\n--- 4. Testing Shift Key Catch Execution ---")
    caught_result = sim.attempt_catch(shift_pressed=True)
    assert caught_result is True, "attempt_catch() must return True on valid alignment + Shift"
    assert boy.is_caught is True, "Aarav isCaught flag must be True"
    assert boy.state == "CAUGHT", "Aarav state must be CAUGHT"
    assert boy.caught_count == 1, "Aarav caughtCount must increment to 1"
    assert mom.is_hugging is True, "Mom isHugging flag must be True"
    assert "got me" in boy.speech_text.lower(), f"Aarav dialogue triggered: {boy.speech_text}"
    assert "gotcha" in mom.speech_text.lower(), f"Mom dialogue triggered: {mom.speech_text}"
    print(f"[PASS] Aarav state: {boy.state}, caughtCount: {boy.caught_count}")
    print(f"[PASS] Aarav Dialogue: '{boy.speech_text}'")
    print(f"[PASS] Mom Dialogue: '{mom.speech_text}'")

    print("\n--- 5. Testing Secondary Shift When Already Caught (Idempotency) ---")
    second_attempt = sim.attempt_catch(shift_pressed=True)
    assert second_attempt is False, "Repeated catch while already caught should be safely ignored"
    assert boy.caught_count == 1, "Caught count should not increment again during celebration"
    print("[PASS] Repeated Shift press while hugging is safely ignored.")

if __name__ == "__main__":
    test_point_matching_and_catch()
    print("\n>>> ALL BODY POINT MATCHING & CATCH TESTS PASSED! <<<")
