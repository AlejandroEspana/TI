from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.application.use_cases.calculus_use_cases import (
    CalculateDerivativeUseCase,
    CalculateIntegralUseCase,
)
from app.presentation.dependencies import (
    get_derivative_use_case,
    get_integral_use_case,
)

router = APIRouter()


class CalculusRequest(BaseModel):
    expression: str
    variable: str = "x"
    order: int = 1


class StepDto(BaseModel):
    step_number: int
    before: str
    operation: str
    after: str
    explanation: str


class CalculusResponseDto(BaseModel):
    expression: str
    operation: str
    variable: str
    result: str
    latex_result: str
    steps: Optional[List[StepDto]] = None


@router.post("/derivative", response_model=CalculusResponseDto)
def compute_derivative(
    payload: CalculusRequest,
    use_case: CalculateDerivativeUseCase = Depends(get_derivative_use_case),
) -> CalculusResponseDto:
    try:
        res = use_case.execute(payload.expression, payload.variable, payload.order)
        steps_dto = [
            StepDto(
                step_number=s.step_number,
                before=s.before,
                operation=s.operation,
                after=s.after,
                explanation=s.explanation,
            )
            for s in (res.steps or [])
        ]
        return CalculusResponseDto(
            expression=res.expression,
            operation=res.operation,
            variable=res.variable,
            result=res.result,
            latex_result=res.latex_result,
            steps=steps_dto,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/integrate", response_model=CalculusResponseDto)
def compute_integral(
    payload: CalculusRequest,
    use_case: CalculateIntegralUseCase = Depends(get_integral_use_case),
) -> CalculusResponseDto:
    try:
        res = use_case.execute(payload.expression, payload.variable)
        steps_dto = [
            StepDto(
                step_number=s.step_number,
                before=s.before,
                operation=s.operation,
                after=s.after,
                explanation=s.explanation,
            )
            for s in (res.steps or [])
        ]
        return CalculusResponseDto(
            expression=res.expression,
            operation=res.operation,
            variable=res.variable,
            result=res.result,
            latex_result=res.latex_result,
            steps=steps_dto,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
