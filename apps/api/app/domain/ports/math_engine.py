from abc import ABC, abstractmethod
from app.domain.models.expression import MathExpression, MathResult


class MathEnginePort(ABC):
    """
    Port interface for mathematical symbolic and numerical engines.
    Isolates external CAS libraries (SymPy, SciPy, etc.) from the core domain.
    """

    @abstractmethod
    def solve(self, expression: MathExpression) -> MathResult:
        """Solve an equation or system of equations."""
        pass

    @abstractmethod
    def get_engine_version(self) -> str:
        """Return the underlying engine version."""
        pass
