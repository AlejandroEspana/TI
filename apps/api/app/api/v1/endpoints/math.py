from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sympy

router = APIRouter()


class MathSolveRequest(BaseModel):
    expression: str
    type: str = "equation"
    variable: str = "x"


class MathSolveResponse(BaseModel):
    expression: str
    variable: str
    result: List[str]
    latex_result: List[str]


@router.post("/solve", response_model=MathSolveResponse)
def solve_expression(payload: MathSolveRequest) -> MathSolveResponse:
    try:
        var = sympy.Symbol(payload.variable)
        # Parse equation: e.g. "2*x**2 + 5*x - 3 = 0" or "2*x^2 + 5*x - 3"
        expr_str = payload.expression.replace("^", "**")
        if "=" in expr_str:
            lhs_str, rhs_str = expr_str.split("=", 1)
            lhs = sympy.sympify(lhs_str)
            rhs = sympy.sympify(rhs_str)
            eq = sympy.Eq(lhs, rhs)
            solutions = sympy.solve(eq, var)
        else:
            eq = sympy.sympify(expr_str)
            solutions = sympy.solve(eq, var)

        str_solutions = [str(sol) for sol in solutions]
        latex_solutions = [sympy.latex(sol) for sol in solutions]

        return MathSolveResponse(
            expression=payload.expression,
            variable=payload.variable,
            result=str_solutions,
            latex_result=latex_solutions,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Math engine error: {str(e)}")
