from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from app.application.use_cases.step_by_step_use_cases import GenerateStepsUseCase
from app.presentation.dependencies import get_steps_use_case

router = APIRouter()


class StepRequest(BaseModel):
    expression: str
    variable: str = "x"


class StepDto(BaseModel):
    step_number: int
    before: str
    operation: str
    after: str
    explanation: str


class StepsResponse(BaseModel):
    expression: str
    variable: str
    steps: List[StepDto]


@router.post("/solve", response_model=StepsResponse)
def solve_with_steps(
    payload: StepRequest,
    use_case: GenerateStepsUseCase = Depends(get_steps_use_case),
) -> StepsResponse:
    try:
        steps_raw = use_case.execute(payload.expression, payload.variable)
        steps_dto = [
            StepDto(
                step_number=s.step_number,
                before=s.before,
                operation=s.operation,
                after=s.after,
                explanation=s.explanation,
            )
            for s in steps_raw
        ]
        return StepsResponse(
            expression=payload.expression,
            variable=payload.variable,
            steps=steps_dto,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
