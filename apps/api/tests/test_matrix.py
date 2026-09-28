from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_matrix_determinant():
    # [[1, 2], [3, 4]] -> det = 1*4 - 2*3 = -2
    payload = {
        "matrix": [[1.0, 2.0], [3.0, 4.0]],
        "operation": "determinant",
    }
    res = client.post("/api/v1/matrix/operation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert float(data["determinant"]) == -2.0


def test_matrix_transpose():
    payload = {
        "matrix": [[1.0, 2.0], [3.0, 4.0]],
        "operation": "transpose",
    }
    res = client.post("/api/v1/matrix/operation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["result"] == [[1.0, 3.0], [2.0, 4.0]]
