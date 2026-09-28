import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('MathBoard App (Phases 1 to 11)', () => {
  it('renders the white canvas whiteboard with toolbar by default', () => {
    render(<App />);
    expect(screen.getByText('MathBoard')).toBeInTheDocument();
    expect(screen.getByText('Fases 1–11 Completadas')).toBeInTheDocument();
    expect(screen.getByText('Tablero Blanco')).toBeInTheDocument();
    expect(screen.getByText('Puntero')).toBeInTheDocument();
    expect(screen.getByText('Lápiz OCR')).toBeInTheDocument();
  });

  it('allows switching to Diagnostics and viewing packages status', async () => {
    render(<App />);
    const diagBtn = screen.getByText('Diagnóstico & Arquitectura');
    fireEvent.click(diagBtn);

    expect(screen.getByText('Paquetes del Monorepo Activos')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/geometry-core')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/physics-core')).toBeInTheDocument();
    expect(screen.getByText('@mathboard/handwriting')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('API Connected')).toBeInTheDocument();
    });
  });
});
