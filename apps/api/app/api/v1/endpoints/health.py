from fastapi import APIRouter
from datetime import datetime, timezone
import sympy
from pydantic import BaseModel
from typing import Dict
from app.core.config import settings

router = APIRouter()


class ServiceStatus(BaseModel):
    math_engine: str
    sympy_version: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    services: ServiceStatus


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.VERSION,
        services=ServiceStatus(
            math_engine="available",
            sympy_version=sympy.__version__,
        ),
    )
