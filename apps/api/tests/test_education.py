from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_verify_student_answer_correct():
    # Student: x^2 - 4, Expected: (x-2)*(x+2) -> algebraically equivalent!
    payload = {
        "student_answer": "(x - 2)*(x + 2)",
        "expected_answer": "x^2 - 4",
    }
    res = client.post("/api/v1/education/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_correct"] is True


def test_verify_student_answer_incorrect():
    payload = {
        "student_answer": "x^2 + 4",
        "expected_answer": "x^2 - 4",
    }
    res = client.post("/api/v1/education/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_correct"] is False
