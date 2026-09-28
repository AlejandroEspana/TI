import sympy
from app.domain.ports.math_engine import MathEnginePort
from app.domain.models.expression import MathExpression, MathResult


class SymPyAdapter(MathEnginePort):
    """
    Concrete adapter connecting the MathEnginePort to SymPy CAS.
    """

    def get_engine_version(self) -> str:
        return f"sympy-{sympy.__version__}"

    def solve(self, expression: MathExpression) -> MathResult:
        try:
            var = sympy.Symbol(expression.variable)
            clean_str = expression.raw.replace("^", "**")

            if "=" in clean_str:
                lhs_str, rhs_str = clean_str.split("=", 1)
                lhs = sympy.sympify(lhs_str)
                rhs = sympy.sympify(rhs_str)
                eq = sympy.Eq(lhs, rhs)
                solutions = sympy.solve(eq, var)
            else:
                eq = sympy.sympify(clean_str)
                solutions = sympy.solve(eq, var)

            str_solutions = [str(sol) for sol in solutions]
            latex_solutions = [sympy.latex(sol) for sol in solutions]

            return MathResult(
                expression=expression.raw,
                variable=expression.variable,
                solutions=str_solutions,
                latex_solutions=latex_solutions,
            )
        except Exception as e:
            raise ValueError(f"SymPy engine computation error: {str(e)}") from e
