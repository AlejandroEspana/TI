import type {
  HealthCheckResponse,
  MathSolveResponse,
  CalculusResponse,
  MatrixResponse,
  MathStep,
} from '@mathboard/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!response.ok) {
    throw new Error(`Healthcheck failed: ${response.statusText}`);
  }
  return response.json();
}

export async function solveEquation(expression: string, variable = 'x'): Promise<MathSolveResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/math/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variable, type: 'equation' }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Solve failed' }));
    throw new Error(err.detail || 'Solve failed');
  }
  return response.json();
}

export async function fetchSteps(expression: string, variable = 'x'): Promise<{ expression: string; variable: string; steps: MathStep[] }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/steps/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variable }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Steps failed' }));
    throw new Error(err.detail || 'Steps failed');
  }
  return response.json();
}

export async function fetchDerivative(expression: string, variable = 'x', order = 1): Promise<CalculusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/calculus/derivative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variable, order }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Derivative failed' }));
    throw new Error(err.detail || 'Derivative failed');
  }
  return response.json();
}

export async function fetchIntegral(expression: string, variable = 'x'): Promise<CalculusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/calculus/integrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variable }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Integral failed' }));
    throw new Error(err.detail || 'Integral failed');
  }
  return response.json();
}

export async function fetchMatrixOperation(matrix: number[][], operation = 'determinant'): Promise<MatrixResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/matrix/operation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix, operation }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Matrix operation failed' }));
    throw new Error(err.detail || 'Matrix operation failed');
  }
  return response.json();
}

export async function fetchSimplify(expression: string): Promise<{ expression: string; result: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/algebra/simplify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Simplify failed' }));
    throw new Error(err.detail || 'Simplify failed');
  }
  return response.json();
}

export async function fetchFactor(expression: string): Promise<{ expression: string; result: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/algebra/factor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Factor failed' }));
    throw new Error(err.detail || 'Factor failed');
  }
  return response.json();
}

export interface VerifyAnswerResponse {
  is_correct: boolean;
  feedback: string;
  latex_canonical: string;
}

export async function verifyAnswer(studentAnswer: string, expectedAnswer: string): Promise<VerifyAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/education/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_answer: studentAnswer, expected_answer: expectedAnswer }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(err.detail || 'Verification failed');
  }
  return response.json();
}
