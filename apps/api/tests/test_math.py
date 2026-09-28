from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_solve_quadratic_equation():
    # 2*x^2 + 5*x - 3 = 0 -> roots are 1/2 and -3
    payload = {
        "expression": "2*x^2 + 5*x - 3 = 0",
        "type": "equation",
        "variable": "x",
    }
    response = client.post("/api/v1/math/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "-3" in data["result"]
    assert "1/2" in data["result"]


def test_solve_linear_equation():
    # 2*x + 4 = 10 -> root is 3
    payload = {
        "expression": "2*x + 4 = 10",
        "type": "equation",
        "variable": "x",
    }
    response = client.post("/api/v1/math/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == ["3"]
