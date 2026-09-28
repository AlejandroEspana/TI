from app.domain.ports.math_engine import MathEnginePort
from app.domain.models.expression import MathExpression, MathResult


class SolveEquationUseCase:
    """
    Application use case for solving equations.
    Depends solely on the MathEnginePort abstraction.
    """

    def __init__(self, math_engine: MathEnginePort) -> None:
        self.math_engine = math_engine

    def execute(self, expression_raw: str, variable: str = "x") -> MathResult:
        if not expression_raw or not expression_raw.strip():
            raise ValueError("Expression cannot be empty")

        expression = MathExpression(
            raw=expression_raw.strip(),
            variable=variable.strip() or "x",
            expression_type="equation",
        )
        return self.math_engine.solve(expression)
