# MathBoard — Documento Base de Contexto Técnico y Arquitectura

**MathBoard** es una plataforma educativa e interactiva orientada al aprendizaje y resolución de problemas de matemáticas y física mediante un **tablero virtual inteligente**. El objetivo principal es crear un entorno donde el usuario pueda escribir, editar, manipular, interpretar, resolver, transformar y visualizar expresiones matemáticas y elementos físicos de manera interactiva.

El sistema no se limita a funcionar como una calculadora: es un **entorno matemático computacional y educativo**, donde cada elemento colocado en el tablero tiene una representación semántica que permite realizar operaciones sobre él.

La inteligencia inicial del sistema no depende de modelos de inteligencia artificial generativa. Las primeras fases utilizan **parsers, árboles sintácticos (AST), motores matemáticos deterministas, reglas formales y sistemas de transformación**. La IA será una capa posterior (Fase 12) encargada de tutoría, explicación adaptativa y contextualización.

---

## 1. Visión del Sistema

MathBoard permite que un usuario:
- Cree un tablero virtual infinito.
- Escriba fórmulas matemáticas mediante teclado (MathLive) y posteriormente lápiz/mouse (OCR).
- Seleccione expresiones o fragmentos de ellas para manipularlas directamente.
- Edite, simplifique, factorice y resuelva ecuaciones y sistemas.
- Calcule derivadas, integrales, límites, series y matrices.
- Trabaje con vectores y construcciones geométricas interactivas.
- Grafique funciones y analice puntos críticos, asíntotas e intersecciones en 2D y 3D.
- Realice simulaciones físicas interactivas (cinemática, dinámica, campos).
- Observe procedimientos paso a paso explicados estructuralmente.
- Deshaga y rehaga operaciones mediante el patrón Command.
- Guarde sus tableros y sesiones de aprendizaje con estado semántico recuperable.

---

## 2. Principio Fundamental: Determinismo Primero

> **"La IA no debe ser el motor matemático principal."**

Un modelo generativo nunca debe ser la fuente de verdad para el cálculo simbólico o numérico.

```text
Parser Engine          ──▶  Comprender la expresión y construir AST
Math Engine            ──▶  Calcular y resolver deterministamente (SymPy / NumPy)
Transformation Engine  ──▶  Explicar el procedimiento estructuralmente (Paso a paso)
Graph Engine           ──▶  Visualizar e inspeccionar analíticamente (Plotly / Three.js)
Physics Engine         ──▶  Simular leyes físicas (Rapier / R3F)
Educational Engine     ──▶  Organizar secuencias y grafo de conocimiento
AI Tutor (Fase 12+)    ──▶  Explicar, adaptar pedagogía y tutorizar
```

---

## 3. Arquitectura Limpia (Clean Architecture) & Puertos y Adaptadores

El backend y los paquetes centrales implementan separación estricta de responsabilidades:

```text
                                Presentation Layer
                          (FastAPI Routers / React UI)
                                       │
                                       ▼
                               Application Layer
                           (Use Cases / Interactors)
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
                Domain Layer                    Infrastructure Layer
          (Entities, Value Objects,           (Adapters: SymPyAdapter,
           MathExpression, Ports)              PostgresRepository, Redis)
```

### Regla de Dependencia
El **Dominio** no conoce bibliotecas externas (`sympy`, `fastapi`, `tldraw`, `database`). Conoce únicamente interfaces y abstracciones (**Ports**).

```text
Domain:           MathEnginePort (Abstract Base Class)
Application:      SolveEquationUseCase(math_engine: MathEnginePort)
Infrastructure:   SymPyAdapter(MathEnginePort) -> realiza llamadas a sympy
Presentation:     API Router /api/v1/math/solve invoca SolveEquationUseCase
```

---

## 4. Hoja de Ruta Completa (Fases 0 a 12)

```text
[Fase 0]   Arquitectura, Monorepo y Pipeline CI/CD               (Completada)
   │
[Fase 1]   Smart Canvas (tldraw, Board Engine, History)          (En progreso)
   │
[Fase 2]   Math Editor (MathLive, KaTeX, MathObject)
   │
[Fase 3]   Parser Engine (Tokenizer, MathAST, Semantic Analyzer)
   │
[Fase 4]   Math Engine (Álgebra, Cálculo, Matrices con SymPy)
   │
[Fase 5]   Transformation Engine (Step-by-Step, Procedimientos)
   │
[Fase 6]   2D Graph Engine (Plotly, GraphSpecification, Raíces)
   │
[Fase 7]   Geometría Computacional (Puntos, Líneas, Vectores)
   │
[Fase 8]   Physics Engine (Rapier, Fuerzas, Cinemática)
   │
[Fase 9]   Visualización 3D (Three.js / React Three Fiber)
   │
[Fase 10]  Reconocimiento Manuscrito (Handwriting OCR)
   │
[Fase 11]  Sistema Educativo (Grafo de Conocimiento, Ejercicios)
   │
[Fase 12]  AI Tutor (LLM Gateway, RAG Pedagógico, Adaptación)
```

---

## 5. Patrones de Diseño Aplicados

- **Strategy**: Algoritmos de resolución desacoplados (`LinearEquationStrategy`, `QuadraticEquationStrategy`).
- **Factory**: Creación tipada de objetos del canvas (`MathObjectFactory`, `GraphObjectFactory`).
- **Adapter**: Aislamiento de herramientas externas (`SymPyAdapter`, `PlotlyAdapter`).
- **Command**: Ejecución y reversión de acciones en el canvas (`AddObjectCommand`, `TransformCommand`, `Undo/Redo`).
- **Observer / Event-Driven**: Desacoplamiento entre eventos del tablero y casos de uso matemáticos (`ExpressionSelected`, `SolveRequested`).
- **Composite**: Modelado jerárquico de expresiones matemáticas y términos en el AST.
- **Repository**: Persistencia agnóstica de tableros y sesiones.
