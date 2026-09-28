from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(frozen=True)
class MathExpression:
    raw: str
    variable: str = "x"
    expression_type: str = "equation"


@dataclass(frozen=True)
class MathResult:
    expression: str
    variable: str
    solutions: List[str] = field(default_factory=list)
    latex_solutions: List[str] = field(default_factory=list)
    steps: Optional[List[str]] = None
