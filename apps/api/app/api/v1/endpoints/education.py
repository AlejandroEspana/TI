from fastapi import APIRouter
from pydantic import BaseModel
import sympy

router = APIRouter()


class VerifyRequest(BaseModel):
    student_answer: str
    expected_answer: str


class VerifyResponse(BaseModel):
    is_correct: bool
    feedback: str
    latex_canonical: str


@router.post("/verify", response_model=VerifyResponse)
def verify_student_answer(payload: VerifyRequest) -> VerifyResponse:
    try:
        clean_stud = payload.student_answer.replace("^", "**").strip()
        clean_exp = payload.expected_answer.replace("^", "**").strip()

        # Check equality of expressions: diff = stud - exp -> simplify
        if "=" in clean_stud and "=" in clean_exp:
            s_lhs, s_rhs = clean_stud.split("=", 1)
            e_lhs, e_rhs = clean_exp.split("=", 1)
            s_diff = sympy.sympify(s_lhs) - sympy.sympify(s_rhs)
            e_diff = sympy.sympify(e_lhs) - sympy.sympify(e_rhs)
            # Check if proportional
            diff = sympy.simplify(s_diff - e_diff)
            is_correct = (diff == 0) or (sympy.simplify(s_diff + e_diff) == 0)
        else:
            s_expr = sympy.sympify(clean_stud)
            e_expr = sympy.sympify(clean_exp)
            diff = sympy.simplify(s_expr - e_expr)
            is_correct = (diff == 0)

        feedback = (
            "¡Excelente! Tu respuesta es matemáticamente exacta y equivalente."
            if is_correct
            else "La respuesta no es equivalente a la solución esperada. Revisa los pasos o consulta la pista."
        )

        return VerifyResponse(
            is_correct=is_correct,
            feedback=feedback,
            latex_canonical=sympy.latex(sympy.sympify(clean_exp.split("=")[0])),
        )
    except Exception as e:
        return VerifyResponse(
            is_correct=False,
            feedback=f"No se pudo evaluar algebraicamente la respuesta: {str(e)}",
            latex_canonical="",
        )
