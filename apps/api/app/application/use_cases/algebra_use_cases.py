from app.domain.ports.math_engine import MathEnginePort


class SimplifyUseCase:
    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, expression: str) -> str:
        if not expression or not expression.strip():
            raise ValueError("Expression cannot be empty")
        return self.math_engine.simplify(expression.strip())


class FactorUseCase:
    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, expression: str) -> str:
        if not expression or not expression.strip():
            raise ValueError("Expression cannot be empty")
        return self.math_engine.factor(expression.strip())
