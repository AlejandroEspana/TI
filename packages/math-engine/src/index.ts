import type { MathObject, MathSolveResponse } from '@mathboard/shared';

export interface MathOperation<TResult = unknown> {
  id: string;
  name: string;
  canExecute(input: MathObject): boolean;
  execute(input: MathObject): Promise<TResult>;
}

export class SolveOperation implements MathOperation<MathSolveResponse> {
  id = 'op-solve';
  name = 'Solve Equation';

  canExecute(input: MathObject): boolean {
    return input.semanticType === 'equation' || input.latex.includes('=');
  }

  async execute(input: MathObject): Promise<MathSolveResponse> {
    return {
      expression: input.latex,
      semanticType: 'equation',
      variable: input.variable ?? 'x',
      result: [],
      steps: [],
    };
  }
}
