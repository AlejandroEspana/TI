import type {
  MathBoardObject,
  MathSemanticType,
} from '@mathboard/shared';

export interface MathActionDescriptor {
  id: string;
  label: string;
  description: string;
  icon?: string;
  category: 'algebra' | 'calculus' | 'linear_algebra' | 'visualization';
}

export interface MathOperation<TInput = MathBoardObject, TResult = unknown> {
  readonly id: string;
  readonly name: string;
  canExecute(input: TInput): boolean;
  execute(input: TInput, options?: Record<string, unknown>): Promise<TResult>;
}

/**
 * Action Registry: determines applicable mathematical operations based on object type
 */
export class ActionRegistry {
  static getActionsForType(semanticType: MathSemanticType): MathActionDescriptor[] {
    const actions: MathActionDescriptor[] = [];

    switch (semanticType) {
      case 'equation':
        actions.push(
          { id: 'solve', label: 'Resolver', description: 'Encontrar raíces o soluciones', category: 'algebra' },
          { id: 'steps', label: 'Paso a Paso', description: 'Procedimiento detallado', category: 'algebra' },
          { id: 'graph', label: 'Graficar 2D', description: 'Trazar curva y raíces', category: 'visualization' }
        );
        break;

      case 'polynomial':
      case 'expression':
        actions.push(
          { id: 'simplify', label: 'Simplificar', description: 'Reducir términos semejantes', category: 'algebra' },
          { id: 'factor', label: 'Factorizar', description: 'Descomponer en factores', category: 'algebra' },
          { id: 'derivative', label: 'Derivar d/dx', description: 'Cálculo de derivada', category: 'calculus' },
          { id: 'integral', label: 'Integrar ∫', description: 'Integral indefinida', category: 'calculus' },
          { id: 'graph', label: 'Graficar 2D', description: 'Representar curva cartesiana', category: 'visualization' }
        );
        break;

      case 'function':
        actions.push(
          { id: 'derivative', label: 'Derivar f\'(x)', description: 'Calcular razón de cambio', category: 'calculus' },
          { id: 'integral', label: 'Integrar ∫', description: 'Área bajo la curva', category: 'calculus' },
          { id: 'graph', label: 'Graficar Función', description: 'Trazar en plano cartesiano', category: 'visualization' },
          { id: 'extrema', label: 'Puntos Críticos', description: 'Máximos y mínimos', category: 'calculus' }
        );
        break;

      case 'derivative':
        actions.push(
          { id: 'evaluate_derivative', label: 'Resolver Derivada', description: 'Aplicar reglas de derivación', category: 'calculus' },
          { id: 'steps', label: 'Procedimiento', description: 'Ver reglas aplicadas', category: 'calculus' }
        );
        break;

      case 'integral':
        actions.push(
          { id: 'evaluate_integral', label: 'Resolver Integral', description: 'Calcular primitiva', category: 'calculus' },
          { id: 'steps', label: 'Procedimiento', description: 'Ver método de integración', category: 'calculus' }
        );
        break;

      case 'matrix':
        actions.push(
          { id: 'determinant', label: 'Determinante det(A)', description: 'Calcular escalar det', category: 'linear_algebra' },
          { id: 'inverse', label: 'Inversa A⁻¹', description: 'Matriz inversa', category: 'linear_algebra' },
          { id: 'transpose', label: 'Transpuesta Aᵀ', description: 'Filas por columnas', category: 'linear_algebra' }
        );
        break;

      default:
        actions.push(
          { id: 'simplify', label: 'Simplificar', description: 'Evaluar expresión', category: 'algebra' },
          { id: 'graph', label: 'Graficar', description: 'Graficar', category: 'visualization' }
        );
        break;
    }

    return actions;
  }
}
