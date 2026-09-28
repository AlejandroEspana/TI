from app.domain.ports.math_engine import MathEnginePort, CalculusResult


class CalculateDerivativeUseCase:
    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, expression: str, variable: str = "x", order: int = 1) -> CalculusResult:
        if not expression or not expression.strip():
            raise ValueError("Expression cannot be empty")
        return self.math_engine.derivative(expression.strip(), variable.strip() or "x", order)


class CalculateIntegralUseCase:
    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, expression: str, variable: str = "x") -> CalculusResult:
        if not expression or not expression.strip():
            raise ValueError("Expression cannot be empty")
        return self.math_engine.integrate(expression.strip(), variable.strip() or "x")
