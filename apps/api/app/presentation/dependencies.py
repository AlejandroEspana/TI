from functools import lru_cache
from app.infrastructure.adapters.sympy_adapter import SymPyAdapter
from app.application.use_cases.solve_equation import SolveEquationUseCase
from app.application.use_cases.calculus_use_cases import (
    CalculateDerivativeUseCase,
    CalculateIntegralUseCase,
)
from app.application.use_cases.matrix_use_cases import MatrixOperationUseCase
from app.application.use_cases.step_by_step_use_cases import GenerateStepsUseCase
from app.application.use_cases.algebra_use_cases import SimplifyUseCase, FactorUseCase


@lru_cache()
def get_sympy_adapter() -> SymPyAdapter:
    return SymPyAdapter()


def get_solve_equation_use_case() -> SolveEquationUseCase:
    return SolveEquationUseCase(math_engine=get_sympy_adapter())


def get_derivative_use_case() -> CalculateDerivativeUseCase:
    return CalculateDerivativeUseCase(math_engine=get_sympy_adapter())


def get_integral_use_case() -> CalculateIntegralUseCase:
    return CalculateIntegralUseCase(math_engine=get_sympy_adapter())


def get_matrix_use_case() -> MatrixOperationUseCase:
    return MatrixOperationUseCase(math_engine=get_sympy_adapter())


def get_steps_use_case() -> GenerateStepsUseCase:
    return GenerateStepsUseCase(math_engine=get_sympy_adapter())


def get_simplify_use_case() -> SimplifyUseCase:
    return SimplifyUseCase(math_engine=get_sympy_adapter())


def get_factor_use_case() -> FactorUseCase:
    return FactorUseCase(math_engine=get_sympy_adapter())
