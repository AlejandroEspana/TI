import pytest
from app.application.use_cases.solve_equation import SolveEquationUseCase
from app.infrastructure.adapters.sympy_adapter import SymPyAdapter


def test_solve_equation_use_case_with_sympy():
    adapter = SymPyAdapter()
    use_case = SolveEquationUseCase(math_engine=adapter)

    result = use_case.execute("x**2 - 9 = 0", variable="x")
    assert "-3" in result.solutions
    assert "3" in result.solutions
    assert result.variable == "x"


def test_solve_equation_empty_input():
    adapter = SymPyAdapter()
    use_case = SolveEquationUseCase(math_engine=adapter)

    with pytest.raises(ValueError, match="Expression cannot be empty"):
        use_case.execute("   ")
