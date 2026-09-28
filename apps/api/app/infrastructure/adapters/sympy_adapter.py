import sympy
from typing import List, Any, Optional
from app.domain.ports.math_engine import (
    MathEnginePort,
    CalculusResult,
    MatrixOpResult,
    StepDetail,
)
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
            raise ValueError(f"SymPy solve error: {str(e)}") from e

    def simplify(self, expression: str) -> str:
        try:
            clean_str = expression.replace("^", "**")
            expr = sympy.sympify(clean_str)
            simplified = sympy.simplify(expr)
            return str(simplified)
        except Exception as e:
            raise ValueError(f"SymPy simplify error: {str(e)}") from e

    def factor(self, expression: str) -> str:
        try:
            clean_str = expression.replace("^", "**")
            expr = sympy.sympify(clean_str)
            factored = sympy.factor(expr)
            return str(factored)
        except Exception as e:
            raise ValueError(f"SymPy factor error: {str(e)}") from e

    def derivative(self, expression: str, variable: str = "x", order: int = 1) -> CalculusResult:
        try:
            var = sympy.Symbol(variable)
            clean_str = expression.replace("^", "**")
            expr = sympy.sympify(clean_str)
            diff_res = sympy.diff(expr, var, order)

            steps = [
                StepDetail(
                    step_number=1,
                    before=f"f({variable}) = {str(expr)}",
                    operation="differentiate",
                    after=f"f'({variable}) = {str(diff_res)}",
                    explanation=f"Se aplicó la regla de derivación con respecto a {variable}",
                )
            ]

            return CalculusResult(
                expression=expression,
                operation="derivative",
                variable=variable,
                result=str(diff_res),
                latex_result=sympy.latex(diff_res),
                steps=steps,
            )
        except Exception as e:
            raise ValueError(f"SymPy derivative error: {str(e)}") from e

    def integrate(self, expression: str, variable: str = "x") -> CalculusResult:
        try:
            var = sympy.Symbol(variable)
            clean_str = expression.replace("^", "**")
            expr = sympy.sympify(clean_str)
            int_res = sympy.integrate(expr, var)

            steps = [
                StepDetail(
                    step_number=1,
                    before=f"∫ ({str(expr)}) d{variable}",
                    operation="integrate",
                    after=f"{str(int_res)} + C",
                    explanation=f"Se calculó la antiderivada con respecto a {variable}",
                )
            ]

            return CalculusResult(
                expression=expression,
                operation="integral",
                variable=variable,
                result=f"{str(int_res)} + C",
                latex_result=f"{sympy.latex(int_res)} + C",
                steps=steps,
            )
        except Exception as e:
            raise ValueError(f"SymPy integrate error: {str(e)}") from e

    def matrix_operation(self, matrix_data: List[List[float]], operation: str) -> MatrixOpResult:
        try:
            M = sympy.Matrix(matrix_data)
            op = operation.lower().strip()

            if op == "determinant":
                det_val = M.det()
                return MatrixOpResult(
                    operation="determinant",
                    result=matrix_data,
                    determinant=float(det_val) if det_val.is_number else str(det_val),
                    latex_result=sympy.latex(det_val),
                )
            elif op == "inverse":
                inv_M = M.inv()
                res_data = [[float(x) if x.is_number else str(x) for x in row] for row in inv_M.tolist()]
                return MatrixOpResult(
                    operation="inverse",
                    result=res_data,
                    latex_result=sympy.latex(inv_M),
                )
            elif op == "transpose":
                trans_M = M.T
                res_data = [[float(x) if x.is_number else str(x) for x in row] for row in trans_M.tolist()]
                return MatrixOpResult(
                    operation="transpose",
                    result=res_data,
                    latex_result=sympy.latex(trans_M),
                )
            else:
                raise ValueError(f"Unsupported matrix operation: {operation}")
        except Exception as e:
            raise ValueError(f"SymPy matrix error: {str(e)}") from e

    def generate_steps(self, expression_raw: str, variable: str = "x") -> List[StepDetail]:
        """
        Deterministic Step Generator for linear and quadratic equations
        """
        try:
            var = sympy.Symbol(variable)
            clean_str = expression_raw.replace("^", "**")
            steps: List[StepDetail] = []

            if "=" in clean_str:
                lhs_str, rhs_str = clean_str.split("=", 1)
                lhs = sympy.sympify(lhs_str)
                rhs = sympy.sympify(rhs_str)
                eq_expr = sympy.simplify(lhs - rhs)
            else:
                eq_expr = sympy.sympify(clean_str)

            # Check polynomial degree
            poly = sympy.Poly(eq_expr, var)
            degree = poly.degree()

            # Step 1: Standard form
            steps.append(
                StepDetail(
                    step_number=1,
                    before=expression_raw,
                    operation="standard_form",
                    after=f"{str(eq_expr)} = 0",
                    explanation=f"Reorganizar todos los términos en el lado izquierdo para obtener la forma canónica: {eq_expr} = 0",
                )
            )

            if degree == 1:
                # Linear: ax + b = 0 -> ax = -b -> x = -b/a
                coeffs = poly.all_coeffs()
                a, b = coeffs[0], coeffs[1]
                steps.append(
                    StepDetail(
                        step_number=2,
                        before=f"{a}*{variable} + {b} = 0",
                        operation="isolate_constant",
                        after=f"{a}*{variable} = {-b}",
                        explanation=f"Restar el término constante {b} de ambos lados de la ecuación.",
                    )
                )
                solution = -b / a
                steps.append(
                    StepDetail(
                        step_number=3,
                        before=f"{a}*{variable} = {-b}",
                        operation="isolate_variable",
                        after=f"{variable} = {solution}",
                        explanation=f"Dividir ambos lados entre el coeficiente {a} para despejar {variable}.",
                    )
                )
            elif degree == 2:
                # Quadratic: ax^2 + bx + c = 0
                coeffs = poly.all_coeffs()
                a, b, c = coeffs[0], coeffs[1], coeffs[2]
                delta = b**2 - 4 * a * c
                steps.append(
                    StepDetail(
                        step_number=2,
                        before=f"a = {a}, b = {b}, c = {c}",
                        operation="discriminant",
                        after=f"Δ = b² - 4ac = ({b})² - 4({a})({c}) = {delta}",
                        explanation=f"Identificar los coeficientes a={a}, b={b}, c={c} y calcular el discriminante Δ.",
                    )
                )

                if delta > 0:
                    r1 = (-b + sympy.sqrt(delta)) / (2 * a)
                    r2 = (-b - sympy.sqrt(delta)) / (2 * a)
                    steps.append(
                        StepDetail(
                            step_number=3,
                            before=f"x = (-b ± √Δ) / 2a",
                            operation="quadratic_formula",
                            after=f"{variable}₁ = {r1}, {variable}₂ = {r2}",
                            explanation=f"Como Δ > 0, existen dos raíces reales distintas calculadas mediante la fórmula general.",
                        )
                    )
                elif delta == 0:
                    r = -b / (2 * a)
                    steps.append(
                        StepDetail(
                            step_number=3,
                            before=f"x = -b / 2a",
                            operation="quadratic_formula",
                            after=f"{variable} = {r}",
                            explanation=f"Como Δ = 0, existe una única raíz real con multiplicidad 2.",
                        )
                    )
                else:
                    steps.append(
                        StepDetail(
                            step_number=3,
                            before=f"Δ = {delta} < 0",
                            operation="complex_roots",
                            after=f"Raíces complejas conjugadas",
                            explanation=f"Como Δ < 0, no existen raíces reales; las soluciones son dos números complejos conjugados.",
                        )
                    )

            return steps
        except Exception as e:
            raise ValueError(f"Step generator error: {str(e)}") from e
