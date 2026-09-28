# 📐 MathBoard

> Tablero matemático interactivo modular capaz de interpretar expresiones, resolverlas mediante un motor determinista simbólico y representarlas gráficamente en 2D (sin IA / LLMs en Fases 0–6).

---

## 🚀 Inicio Rápido

### Prerrequisitos
- **Node.js** >= 20.x
- **Python** >= 3.12 (con [uv](https://github.com/astral-sh/uv) recomendado)
- **Docker** y Docker Compose (opcional para entornos contenerizados)

---

### 1. Instalación de dependencias

```bash
# Instalar dependencias del monorepo Node (apps/web y packages/*)
npm install

# Instalar dependencias del backend Python (apps/api)
cd apps/api
uv sync --extra dev
cd ../..
```

---

### 2. Ejecución en Desarrollo

Puedes arrancar tanto el frontend como el backend de forma simultánea con un solo comando:

```bash
npm run dev
```

O arrancarlos por separado:

```bash
# Frontend (React + Vite en http://localhost:5173)
npm run dev:web

# Backend (FastAPI + Uvicorn en http://localhost:8000)
npm run dev:api
```

---

### 3. Ejecución con Docker Compose

```bash
docker compose up --build
```
- Frontend accesible en: `http://localhost:3000`
- Backend API en: `http://localhost:8000` (Documentación Swagger en `http://localhost:8000/docs`)

---

### 4. Pruebas Automatizadas

```bash
# Ejecutar todas las pruebas (Vitest + Pytest)
npm run test

# Pruebas frontend
npm run test:web

# Pruebas backend
npm run test:api
```

---

## 📦 Estructura del Monorepo

```text
mathboard/
├── apps/
│   ├── web/                     # Frontend React 19 + TypeScript + Vite + Tailwind
│   └── api/                     # Backend Python FastAPI + SymPy (uv)
│
├── packages/
│   ├── shared/                  # Modelos de datos y tipos AST compartidos
│   ├── core/                    # Gestor de objetos y estado del canvas (Fase 1)
│   ├── parser/                  # Parser y analizador semántico LaTeX (Fase 3)
│   ├── math-engine/             # Interfaces de operaciones deterministas (Fase 4)
│   └── visualization/           # Especificaciones de graficación 2D (Fase 6)
│
├── docs/                        # Documentación técnica y arquitectura
├── docker-compose.yml           # Orquestación de contenedores
└── package.json                 # Workspaces raíz
```

---

## 🗺️ Roadmap Fases 0 a 6

| Fase | Título | Estado | Descripción |
| :--- | :--- | :---: | :--- |
| **0** | **Arquitectura y Preparación** | ✅ Completa | Estructura monorepo, entornos, Docker y comunicación verificada |
| **1** | **Smart Canvas** | ⏳ Próxima | Tablero infinito con tldraw, manipulación de objetos y persistencia |
| **2** | **Editor Matemático** | ⏳ Planeada | MathLive, renderizado dinámico de LaTeX y MathObjects |
| **3** | **Parser + AST + Semántica** | ⏳ Planeada | Tokenizer, AST propio y clasificación automática de tipos |
| **4** | **Math Engine** | ⏳ Planeada | Álgebra, cálculo simbólico y operaciones con SymPy |
| **5** | **Transformation Engine** | ⏳ Planeada | Resolución explicada paso a paso e historial interactivo |
| **6** | **Graph Engine 2D** | ⏳ Planeada | Graficación interactiva 2D (Plotly/D3) de funciones y raíces |
