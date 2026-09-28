from typing import List
from app.domain.ports.math_engine import MathEnginePort, StepDetail


class GenerateStepsUseCase:
    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, expression_raw: str, variable: str = "x") -> List[StepDetail]:
        if not expression_raw or not expression_raw.strip():
            raise ValueError("Expression cannot be empty")
        return self.math_engine.generate_steps(expression_raw.strip(), variable.strip() or "x")
