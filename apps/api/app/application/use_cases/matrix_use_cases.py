from typing import List
from app.domain.ports.math_engine import MathEnginePort, MatrixOpResult


class MatrixOperationUseCase:
    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, matrix_data: List[List[float]], operation: str) -> MatrixOpResult:
        if not matrix_data or len(matrix_data) == 0:
            raise ValueError("Matrix data cannot be empty")
        return self.math_engine.matrix_operation(matrix_data, operation)
