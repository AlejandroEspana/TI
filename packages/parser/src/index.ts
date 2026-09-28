import type { MathASTNode, MathSemanticType } from '@mathboard/shared';

export interface Token {
  type: 'NUMBER' | 'VARIABLE' | 'OPERATOR' | 'EQUALS' | 'FUNCTION' | 'LPAREN' | 'RPAREN';
  value: string;
  position: number;
}

export function classifyExpression(latex: string): MathSemanticType {
  const trimmed = latex.trim();
  if (trimmed.includes('=')) {
    return 'equation';
  }
  if (trimmed.startsWith('\\int')) {
    return 'integral';
  }
  if (trimmed.includes('\\frac{d}{dx}') || trimmed.includes("'")) {
    return 'derivative';
  }
  if (/^[a-zA-Z]$/.test(trimmed)) {
    return 'variable';
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return 'number';
  }
  if (trimmed.includes('^')) {
    return 'polynomial';
  }
  return 'expression';
}

export function parseLatexToAST(latex: string): MathASTNode {
  return {
    type: 'Expression',
    meta: {
      raw: latex,
      classifiedType: classifyExpression(latex),
    },
  };
}
