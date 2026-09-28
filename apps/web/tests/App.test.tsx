import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mock fetch to simulate healthcheck response
globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/health')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '0.1.0',
          services: {
            math_engine: 'available',
            sympy_version: '1.14.0',
          },
        }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe('MathBoard App (Phase 0)', () => {
  it('renders the MathBoard title and Fase 0 badge', async () => {
    render(<App />);
    expect(screen.getByText('MathBoard')).toBeInTheDocument();
    expect(screen.getByText('Fase 0 Activa')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('API Connected')).toBeInTheDocument();
    });
  });

  it('renders the monorepo packages section', async () => {
    render(<App />);
    expect(screen.getByText('@mathboard/shared')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/core')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/parser')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/math-engine')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/visualization')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('API Connected')).toBeInTheDocument();
    });
  });
});

