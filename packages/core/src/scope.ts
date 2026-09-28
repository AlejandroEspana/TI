/**
 * BoardScope: Reactive Variable Environment for MathBoard Whiteboard
 * Allows users to assign variables (e.g. a = 5, m = 2) which dynamically propagate
 * to equations, graphs, and simulations on the whiteboard.
 */

export type ScopeChangeListener = (variables: Record<string, number | string>) => void;

export class BoardScope {
  private variables: Map<string, number | string> = new Map();
  private listeners: ScopeChangeListener[] = [];

  constructor(initialVars?: Record<string, number | string>) {
    if (initialVars) {
      for (const [k, v] of Object.entries(initialVars)) {
        this.variables.set(k, v);
      }
    }
  }

  setVariable(name: string, value: number | string): void {
    const cleanName = name.trim();
    if (!cleanName) return;
    this.variables.set(cleanName, value);
    this.notify();
  }

  removeVariable(name: string): boolean {
    const removed = this.variables.delete(name.trim());
    if (removed) this.notify();
    return removed;
  }

  getVariable(name: string): number | string | undefined {
    return this.variables.get(name.trim());
  }

  hasVariable(name: string): boolean {
    return this.variables.has(name.trim());
  }

  getAllVariables(): Record<string, number | string> {
    const result: Record<string, number | string> = {};
    for (const [k, v] of this.variables.entries()) {
      result[k] = v;
    }
    return result;
  }

  clear(): void {
    this.variables.clear();
    this.notify();
  }

  /**
   * Parse potential variable assignment from a formula (e.g. "a = 5" or "m = 2.5")
   */
  static parseAssignment(
    rawText: string
  ): { variable: string; value: number; rawExpr: string } | null {
    const clean = rawText.replace(/\s+/g, '').replace(/\\left|\\right/g, '');
    const match = clean.match(/^([a-zA-Z][a-zA-Z0-9_]*)=(-?\d+(\.\d+)?)$/);
    if (match) {
      const variable = match[1];
      const value = parseFloat(match[2]);
      return { variable, value, rawExpr: clean };
    }
    return null;
  }

  /**
   * Substitute all assigned scope variables into a mathematical expression string
   * E.g. "a*x + b" with { a: 4, b: 2 } -> "(4)*x + (2)"
   */
  substituteVariables(expression: string): string {
    let result = expression;
    for (const [varName, val] of this.variables.entries()) {
      // Regex word boundary matching identifier
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      result = result.replace(regex, `(${val})`);
    }
    return result;
  }

  subscribe(listener: ScopeChangeListener): () => void {
    this.listeners.push(listener);
    listener(this.getAllVariables());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const current = this.getAllVariables();
    for (const l of this.listeners) {
      l(current);
    }
  }
}
