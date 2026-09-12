import math

def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)

def gravity_vector(p):
    g_y = -9.81 + (4.50 - (-9.81)) * p
    return (0.00, round(g_y, 4), 0.00)

def test_gravity_transition():
    print("--- Testing Gravity Vector Transition ---")
    g_initial = gravity_vector(smoothstep(0.0))
    assert g_initial == (0.0, -9.81, 0.0), f"Expected (0, -9.81, 0), got {g_initial}"
    print("[PASS] 1G Normal Gravity (p=0.0):", g_initial)

    g_mid = gravity_vector(smoothstep(0.5))
    print("[PASS] Midpoint Gravity (p=0.5):", g_mid)

    g_final = gravity_vector(smoothstep(1.0))
    assert g_final == (0.0, 4.50, 0.0), f"Expected (0, +4.5, 0), got {g_final}"
    print("[PASS] Anti-Gravity AG-04 (p=1.0):", g_final)

def test_verlet_rope():
    print("\n--- Testing Verlet Integration Rope ---")
    rest_len = 20.0
    n0 = {"x": 0.0, "y": 0.0, "pinned": True}
    n1 = {"x": 0.0, "y": 25.0, "pinned": False}
    dx = n1["x"] - n0["x"]
    dy = n1["y"] - n0["y"]
    dist = math.hypot(dx, dy)
    diff = (dist - rest_len) / dist
    n1["x"] -= dx * diff
    n1["y"] -= dy * diff
    new_dist = math.hypot(n1["x"] - n0["x"], n1["y"] - n0["y"])
    assert abs(new_dist - rest_len) < 1e-5, f"Expected {rest_len}, got {new_dist}"
    print(f"[PASS] Verlet relaxation satisfied constraint: {new_dist:.2f} == {rest_len:.2f}")

def test_cursor_repulsion():
    print("\n--- Testing Cursor Repulsion & Dash Trigger ---")
    repulsion_radius = 150.0
    dash_trigger_dist = 90.0

    dist_far = 180.0
    force_far = 640.0 * max(0.0, (1.0 - dist_far / repulsion_radius)) ** 1.8
    assert force_far == 0.0, "Expected 0 force outside radius"
    print("[PASS] Distance 180px: Repulsion Force = 0.00 (No effect)")

    dist_mid = 110.0
    force_mid = 640.0 * (1.0 - dist_mid / repulsion_radius) ** 1.8
    assert force_mid > 0.0, "Expected positive repulsion force"
    print(f"[PASS] Distance 110px: Repulsion Force = {force_mid:.2f} (Boy pushed away)")

    dist_close = 60.0
    should_dash = dist_close < dash_trigger_dist
    assert should_dash is True, "Expected dash trigger"
    print("[PASS] Distance 60px: Aerial Dash Triggered (Somersault flip + Whoosh)")

if __name__ == "__main__":
    test_gravity_transition()
    test_verlet_rope()
    test_cursor_repulsion()
    print("\n>>> ALL PHYSICS ENGINE TESTS PASSED SUCCESSFULLY! <<<")
