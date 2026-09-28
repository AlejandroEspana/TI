from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from app.application.use_cases.solve_equation import SolveEquationUseCase
from app.presentation.dependencies import get_solve_equation_use_case

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
def solve_expression(
    payload: MathSolveRequest,
    use_case: SolveEquationUseCase = Depends(get_solve_equation_use_case),
) -> MathSolveResponse:
    try:
        domain_result = use_case.execute(
            expression_raw=payload.expression,
            variable=payload.variable,
        )
        return MathSolveResponse(
            expression=domain_result.expression,
            variable=domain_result.variable,
            result=domain_result.solutions,
            latex_result=domain_result.latex_solutions,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
