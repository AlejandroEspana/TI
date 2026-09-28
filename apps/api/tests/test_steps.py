from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_linear_equation_steps():
    # 2*x + 4 = 10 -> steps isolate constant then variable
    payload = {"expression": "2*x + 4 = 10", "variable": "x"}
    res = client.post("/api/v1/steps/solve", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["steps"]) >= 3
    assert any("isolate_constant" == s["operation"] for s in data["steps"])
    assert any("isolate_variable" == s["operation"] for s in data["steps"])


def test_quadratic_equation_steps():
    # 2*x^2 + 5*x - 3 = 0 -> discriminat Delta = 25 - 4(2)(-3) = 49
    payload = {"expression": "2*x^2 + 5*x - 3 = 0", "variable": "x"}
    res = client.post("/api/v1/steps/solve", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["steps"]) >= 3
    assert any("discriminant" == s["operation"] for s in data["steps"])
    assert any("quadratic_formula" == s["operation"] for s in data["steps"])
