# Arquitectura del Sistema — MathBoard

MathBoard es una plataforma educativa e interactiva basada en un **tablero virtual inteligente** para matemáticas y física.

Para el documento exhaustivo de visión técnica, Clean Architecture, principios de diseño y el roadmap completo de 12 fases, consulta:
👉 **[Blueprint Técnico Completo (technical_blueprint.md)](./architecture/technical_blueprint.md)**

---

## 🏛️ Principios Rectores

1. **Determinismo Primero**: La computación simbólica y numérica reside en motores formales verificables (SymPy, NumPy). Ningún modelo generativo o LLM actúa como fuente de verdad en las fases centrales (Fases 0–6).
2. **Clean Architecture & Ports and Adapters**:
   - `Domain`: Reglas y entidades de negocio puras (`MathExpression`, `BoardObject`, interfaces de puertos).
   - `Application`: Casos de uso (`SolveEquationUseCase`, `SimplifyExpressionUseCase`).
   - `Infrastructure`: Adaptadores concretos (`SymPyAdapter`, `RapierAdapter`, `PostgresRepository`).
   - `Presentation`: Controladores FastAPI y UI React.
3. **Desacoplamiento Tecnológico**: Cada componente (tldraw, MathLive, SymPy, Plotly) se conecta mediante puertos y adaptadores para permitir sustitución sin afectar las reglas de negocio.

---

## 🔄 Flujo de Trabajo en el Backend

```text
HTTP Request (POST /api/v1/math/solve)
      │
      ▼
Presentation: Router FastAPI
      │
      ▼
Application: SolveEquationUseCase
      │
      ▼
Domain Port: MathEnginePort (Abstracción)
      │
      ▼
Infrastructure: SymPyAdapter (Implementación concreta con SymPy)
      │
      ▼
Retorno: MathResult (Entidad de Dominio) -> Response DTO
```

---

## 🗺️ Fases del Desarrollo

- **Fase 0**: Arquitectura y Preparación *(Completada)*
- **Fase 1**: Smart Canvas (tldraw, Board Engine, Commands) *(Siguiente)*
- **Fase 2**: Editor Matemático (MathLive, KaTeX, MathObject)
- **Fase 3**: Parser + AST Propio + Análisis Semántico
- **Fase 4**: Math Engine (Álgebra, Cálculo, Matrices con SymPy)
- **Fase 5**: Transformation / Step Engine (Procedimientos explicados)
- **Fase 6**: Graph Engine 2D (Plotly, D3, Especificaciones desacopladas)
- **Fase 7 a 12**: Geometría, Física, 3D, Reconocimiento Manuscrito, Educación e IA Tutor.
