import type { HealthCheckResponse } from '@mathboard/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!response.ok) {
    throw new Error(`Healthcheck failed: ${response.statusText}`);
  }
  return response.json();
}

export interface SolveResult {
  expression: string;
  variable: string;
  result: string[];
  latex_result: string[];
}

export async function solveEquation(expression: string, variable = 'x'): Promise<SolveResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/math/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expression,
      variable,
      type: 'equation',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Solve request failed with ${response.status}`);
  }

  return response.json();
}
