from functools import lru_cache
from app.infrastructure.adapters.sympy_adapter import SymPyAdapter
from app.application.use_cases.solve_equation import SolveEquationUseCase


@lru_cache()
def get_sympy_adapter() -> SymPyAdapter:
    return SymPyAdapter()


def get_solve_equation_use_case() -> SolveEquationUseCase:
    return SolveEquationUseCase(math_engine=get_sympy_adapter())
