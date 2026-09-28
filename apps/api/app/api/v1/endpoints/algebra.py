from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.application.use_cases.algebra_use_cases import SimplifyUseCase, FactorUseCase
from app.presentation.dependencies import get_simplify_use_case, get_factor_use_case

router = APIRouter()


class AlgebraRequest(BaseModel):
    expression: str


class AlgebraResponse(BaseModel):
    expression: str
    result: str


@router.post("/simplify", response_model=AlgebraResponse)
def simplify_expression(
    payload: AlgebraRequest,
    use_case: SimplifyUseCase = Depends(get_simplify_use_case),
) -> AlgebraResponse:
    try:
        res = use_case.execute(payload.expression)
        return AlgebraResponse(expression=payload.expression, result=res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/factor", response_model=AlgebraResponse)
def factor_expression(
    payload: AlgebraRequest,
    use_case: FactorUseCase = Depends(get_factor_use_case),
) -> AlgebraResponse:
    try:
        res = use_case.execute(payload.expression)
        return AlgebraResponse(expression=payload.expression, result=res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
