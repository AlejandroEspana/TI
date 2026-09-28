import { describe, it, expect } from 'vitest';
import { BoardScope } from '../src/scope';

describe('BoardScope Variable Environment', () => {
  it('stores and retrieves assigned variables', () => {
    const scope = new BoardScope();
    scope.setVariable('a', 5);
    scope.setVariable('b', 12);

    expect(scope.getVariable('a')).toBe(5);
    expect(scope.getVariable('b')).toBe(12);
    expect(scope.hasVariable('a')).toBe(true);
    expect(scope.hasVariable('c')).toBe(false);
  });

  it('parses assignments from formula strings', () => {
    expect(BoardScope.parseAssignment('a = 5')).toEqual({ variable: 'a', value: 5, rawExpr: 'a=5' });
    expect(BoardScope.parseAssignment('v_0 = -9.81')).toEqual({ variable: 'v_0', value: -9.81, rawExpr: 'v_0=-9.81' });
    expect(BoardScope.parseAssignment('2x + 4 = 10')).toBeNull(); // Equation, not assignment
  });

  it('substitutes variables into expressions correctly', () => {
    const scope = new BoardScope({ a: 4, b: 3 });
    const expr = 'a*x + b';
    const substituted = scope.substituteVariables(expr);
    expect(substituted).toBe('(4)*x + (3)');
  });
});
