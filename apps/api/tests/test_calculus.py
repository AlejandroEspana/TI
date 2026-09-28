from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_derivative():
    # d/dx(x^3 + 2x^2) = 3*x^2 + 4*x
    res = client.post("/api/v1/calculus/derivative", json={"expression": "x^3 + 2*x^2", "variable": "x"})
    assert res.status_code == 200
    data = res.json()
    assert "3*x**2 + 4*x" in data["result"] or "4*x + 3*x**2" in data["result"]
    assert len(data["steps"]) > 0


def test_integral():
    # int(x^2 dx) = x^3/3 + C
    res = client.post("/api/v1/calculus/integrate", json={"expression": "x^2", "variable": "x"})
    assert res.status_code == 200
    data = res.json()
    assert "x**3/3 + C" in data["result"]
