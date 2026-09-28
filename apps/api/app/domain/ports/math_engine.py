from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.domain.models.expression import MathExpression, MathResult
from dataclasses import dataclass


@dataclass(frozen=True)
class StepDetail:
    step_number: int
    before: str
    operation: str
    after: str
    explanation: str


@dataclass(frozen=True)
class CalculusResult:
    expression: str
    operation: str
    variable: str
    result: str
    latex_result: str
    steps: Optional[List[StepDetail]] = None


@dataclass(frozen=True)
class MatrixOpResult:
    operation: str
    result: List[List[Any]]
    determinant: Optional[Any] = None
    latex_result: str = ""


class MathEnginePort(ABC):
    """
    Port interface for mathematical symbolic and numerical engines.
    """

    @abstractmethod
    def solve(self, expression: MathExpression) -> MathResult:
        """Solve an equation or system of equations."""
        pass

    @abstractmethod
    def simplify(self, expression: str) -> str:
        """Algebraic simplification."""
        pass

    @abstractmethod
    def factor(self, expression: str) -> str:
        """Algebraic factorization."""
        pass

    @abstractmethod
    def derivative(self, expression: str, variable: str = "x", order: int = 1) -> CalculusResult:
        """Compute symbolic derivative."""
        pass

    @abstractmethod
    def integrate(self, expression: str, variable: str = "x") -> CalculusResult:
        """Compute symbolic indefinite integral."""
        pass

    @abstractmethod
    def matrix_operation(self, matrix_data: List[List[float]], operation: str) -> MatrixOpResult:
        """Perform linear algebra operations on matrices."""
        pass

    @abstractmethod
    def generate_steps(self, expression_raw: str, variable: str = "x") -> List[StepDetail]:
        """Generate explainable step-by-step solution procedure."""
        pass

    @abstractmethod
    def get_engine_version(self) -> str:
        """Return underlying engine version."""
        pass
