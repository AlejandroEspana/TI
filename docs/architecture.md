# Arquitectura del Sistema — MathBoard

MathBoard es un tablero matemático interactivo modular diseñado para interpretar expresiones matemáticas, analizarlas semánticamente, resolverlas mediante motores simbólicos deterministas (sin LLM) y representarlas gráficamente en 2D.

---

## 🏛️ Visión General y Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React / Vite)                  │
│                                                             │
│   ┌──────────────┐     ┌──────────────┐    ┌────────────┐   │
│   │ Smart Canvas │ ──▶ │ MathLive     │ ──▶│ MathBoard  │   │
│   │ (tldraw)     │     │ Editor       │    │ Graph (2D) │   │
│   └──────────────┘     └──────────────┘    └────────────┘   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼ HTTP / REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI / uv)                   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ API Router (/api/v1/math/*)                         │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│         ┌────────────────────┴────────────────────┐         │
│         ▼                                         ▼         │
│  ┌──────────────┐                          ┌────────────┐   │
│  │ SymPy Engine │                          │ Step/Trans │   │
│  │ (Algebra/Cal)│                          │ Engine     │   │
│  └──────────────┘                          └────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Estructura de Paquetes Monorepo

* **`apps/web`**: Aplicación de usuario (React 19, TypeScript, Vite, Tailwind CSS).
* **`apps/api`**: Servicio de cálculo simbólico y numérico determinista (FastAPI, SymPy, NumPy).
* **`packages/shared`**: Definiciones de tipos comunes (AST, modelos de objetos del canvas, respuestas de API).
* **`packages/core`**: Gestión de estado del canvas, registro de objetos y viewport.
* **`packages/parser`**: Tokenizador y clasificador semántico para expresiones LaTeX.
* **`packages/math-engine`**: Abstracción de comandos de cálculo (`MathOperation`, `SolveOperation`).
* **`packages/visualization`**: Generador de especificaciones de graficación y análisis de funciones.

---

## 🔄 Pipeline Matemático (Fases 2–6)

```text
Entrada LaTeX (MathLive)
      │
      ▼
Tokenizer & Parser (packages/parser)
      │
      ▼
AST Semántico (MathAST)
      │
      ▼
Clasificador Semántico (Equation | Polynomial | Integral | Function)
      │
      ▼
Ejecutor de Operación (packages/math-engine ──▶ FastAPI / SymPy)
      │
      ├───────────────────────┬────────────────────────┐
      ▼                       ▼                        ▼
Solución Simbólica       Pasos de Transformación   Especificación Gráfica (2D)
(x = 1/2, x = -3)        (Paso a paso explícito)  (Plotly / D3)
```

---

## 🛡️ Principio de Determinismo

MathBoard **no depende de modelos de lenguaje (LLMs)** para la deducción matemática en las Fases 0 a 6. Todo cómputo, simplificación y factorización es realizado por algoritmos deterministas verificables (SymPy/NumPy).
