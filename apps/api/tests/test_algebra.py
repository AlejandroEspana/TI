from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_simplify():
    # 2*x + 3*x -> 5*x
    res = client.post("/api/v1/algebra/simplify", json={"expression": "2*x + 3*x"})
    assert res.status_code == 200
    assert res.json()["result"] == "5*x"


def test_factor():
    # x^2 - 4 -> (x - 2)*(x + 2)
    res = client.post("/api/v1/algebra/factor", json={"expression": "x^2 - 4"})
    assert res.status_code == 200
    res_str = res.json()["result"]
    assert "(x - 2)*(x + 2)" in res_str or "(x + 2)*(x - 2)" in res_str
