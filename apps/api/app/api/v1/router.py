from fastapi import APIRouter
from app.api.v1.endpoints import health, math, calculus, matrix, steps, algebra

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(math.router, prefix="/math", tags=["math"])
api_router.include_router(calculus.router, prefix="/calculus", tags=["calculus"])
api_router.include_router(matrix.router, prefix="/matrix", tags=["matrix"])
api_router.include_router(steps.router, prefix="/steps", tags=["steps"])
api_router.include_router(algebra.router, prefix="/algebra", tags=["algebra"])
