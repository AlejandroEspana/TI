from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Any, Optional
from app.application.use_cases.matrix_use_cases import MatrixOperationUseCase
from app.presentation.dependencies import get_matrix_use_case

router = APIRouter()


class MatrixRequest(BaseModel):
    matrix: List[List[float]]
    operation: str = "determinant"


class MatrixResponseDto(BaseModel):
    operation: str
    result: List[List[Any]]
    determinant: Optional[Any] = None
    latex_result: str


@router.post("/operation", response_model=MatrixResponseDto)
def execute_matrix_operation(
    payload: MatrixRequest,
    use_case: MatrixOperationUseCase = Depends(get_matrix_use_case),
) -> MatrixResponseDto:
    try:
        res = use_case.execute(payload.matrix, payload.operation)
        return MatrixResponseDto(
            operation=res.operation,
            result=res.result,
            determinant=res.determinant,
            latex_result=res.latex_result,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
