# Convenciones de Código y Flujo de Trabajo — MathBoard

## 🌿 Estrategia de Ramas (Git Flow)

- `main`: Rama de producción estable. Protegida.
- `develop`: Rama de integración continua.
- `feature/fase-<X>-<nombre>`: Ramas de características para cada fase o tarea específica.
- `fix/<nombre>`: Correcciones puntuales.

---

## 📝 Convenciones de Commits (Conventional Commits)

Los commits deben seguir el formato:
`<tipo>(<ámbito>): <descripción>`

Ejemplos:
- `feat(web): add mathlive input component`
- `feat(api): implement quadratic equation solver in sympy`
- `refactor(parser): improve latex tokenization for integrals`
- `test(core): add object manager deletion unit tests`
- `docs(arch): update pipeline diagram for phase 3`

---

## 🎨 Estándares de Código

### TypeScript / Frontend
- **Modo estricto**: Siempre activo (`strict: true`). No usar `any` explícito salvo excepciones justificadas mediante comentarios.
- **Formateo**: Prettier (2 espacios, comillas simples, punto y coma).
- **Componentes**: Funcionales con hooks tipados.
- **Imports**: Usar alias `@/...` para código interno de `apps/web` y `@mathboard/...` para paquetes compartidos.

### Python / Backend
- **Tipado estricto**: Uso de `typing` y modelos de datos validados con `pydantic`.
- **Formateo y linter**: `ruff format` y `ruff check`.
- **Docstrings**: Formato Google o estándar Sphinx para funciones de cálculo matemático.
- **Rutas y API**: Pydantic models para request y response en todos los endpoints FastAPI.
