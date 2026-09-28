import type { MathASTNode, MathSemanticType } from '@mathboard/shared';

export interface Token {
  type:
    | 'NUMBER'
    | 'IDENTIFIER'
    | 'OPERATOR'
    | 'EQUALS'
    | 'RELATION'
    | 'LPAREN'
    | 'RPAREN'
    | 'LBRACE'
    | 'RBRACE'
    | 'POWER'
    | 'COMMAND'
    | 'EOF';
  value: string;
  position: number;
}

export class MathLexer {
  private pos = 0;
  private input: string;

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      // Whitespace
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      // Numbers (integers & decimals)
      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(this.input[this.pos + 1] || ''))) {
        let num = '';
        const start = this.pos;
        while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
          num += this.input[this.pos++];
        }
        tokens.push({ type: 'NUMBER', value: num, position: start });
        continue;
      }

      // LaTeX commands: e.g. \frac, \sqrt, \int, \sin, \cos, \cdot, \pm
      if (char === '\\') {
        const start = this.pos++;
        let cmd = '';
        while (this.pos < this.input.length && /[a-zA-Z]/.test(this.input[this.pos])) {
          cmd += this.input[this.pos++];
        }
        tokens.push({ type: 'COMMAND', value: cmd, position: start });
        continue;
      }

      // Identifiers / variables (e.g. x, y, a, b, f)
      if (/[a-zA-Z]/.test(char)) {
        tokens.push({ type: 'IDENTIFIER', value: char, position: this.pos++ });
        continue;
      }

      // Operators and Symbols
      if (char === '=') {
        tokens.push({ type: 'EQUALS', value: '=', position: this.pos++ });
        continue;
      }
      if (char === '<' || char === '>') {
        let rel = char;
        const start = this.pos++;
        if (this.input[this.pos] === '=') {
          rel += '=';
          this.pos++;
        }
        tokens.push({ type: 'RELATION', value: rel, position: start });
        continue;
      }
      if (['+', '-', '*', '/'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char, position: this.pos++ });
        continue;
      }
      if (char === '^') {
        tokens.push({ type: 'POWER', value: '^', position: this.pos++ });
        continue;
      }
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: this.pos++ });
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: this.pos++ });
        continue;
      }
      if (char === '{') {
        tokens.push({ type: 'LBRACE', value: '{', position: this.pos++ });
        continue;
      }
      if (char === '}') {
        tokens.push({ type: 'RBRACE', value: '}', position: this.pos++ });
        continue;
      }

      // Skip unknown or advance
      this.pos++;
    }

    tokens.push({ type: 'EOF', value: '', position: this.pos });
    return tokens;
  }
}

export interface SemanticAnalysisResult {
  semanticType: MathSemanticType;
  variables: string[];
  degree?: number;
  isLinear: boolean;
  isQuadratic: boolean;
  hasDerivatives: boolean;
  hasIntegrals: boolean;
  hasMatrices: boolean;
}

export class SemanticAnalyzer {
  static analyze(latex: string): SemanticAnalysisResult {
    const trimmed = latex.trim();
    const lexer = new MathLexer(trimmed);
    const tokens = lexer.tokenize();

    // Extract variables (excluding known math function names and commands)
    const knownFunctions = new Set(['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'ln', 'log', 'exp', 'sqrt', 'frac', 'int']);
    const varsSet = new Set<string>();

    let hasEquals = false;
    let hasInequality = false;
    let hasIntegrals = false;
    let hasDerivatives = false;
    let hasMatrices = false;
    let maxDegree = 0;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'EQUALS') hasEquals = true;
      if (t.type === 'RELATION') hasInequality = true;
      if (t.type === 'COMMAND') {
        if (t.value === 'int') hasIntegrals = true;
        if (t.value.includes('matrix')) hasMatrices = true;
        if (t.value === 'frac' && trimmed.includes('{d}{dx}')) hasDerivatives = true;
      }
      if (trimmed.includes('matrix') || trimmed.includes('pmatrix') || trimmed.includes('bmatrix')) {
        hasMatrices = true;
      }
      if (trimmed.includes("'") || trimmed.includes('\\frac{d}{dx}')) {
        hasDerivatives = true;
      }

      if (t.type === 'IDENTIFIER' && !knownFunctions.has(t.value)) {
        varsSet.add(t.value);
        // Lookahead for power: x^2 or x^{2}
        if (tokens[i + 1]?.type === 'POWER') {
          let degCandidate = 1;
          const next = tokens[i + 2];
          if (next?.type === 'NUMBER') {
            degCandidate = parseInt(next.value, 10) || 1;
          } else if (next?.type === 'LBRACE' && tokens[i + 3]?.type === 'NUMBER') {
            degCandidate = parseInt(tokens[i + 3].value, 10) || 1;
          }
          if (degCandidate > maxDegree) maxDegree = degCandidate;
        } else if (maxDegree === 0) {
          maxDegree = 1;
        }
      }
    }

    const variables = Array.from(varsSet).sort();

    // Determine semantic type
    let semanticType: MathSemanticType = 'expression';
    if (hasMatrices) {
      semanticType = 'matrix';
    } else if (hasIntegrals) {
      semanticType = 'integral';
    } else if (hasDerivatives) {
      semanticType = 'derivative';
    } else if (hasInequality) {
      semanticType = 'inequality';
    } else if (hasEquals) {
      semanticType = 'equation';
    } else if (maxDegree > 1) {
      semanticType = 'polynomial';
    } else if (variables.length > 0 && (trimmed.includes('f(') || trimmed.includes('y='))) {
      semanticType = 'function';
    } else if (variables.length === 1 && trimmed.length === 1) {
      semanticType = 'variable';
    } else if (variables.length === 0 && !isNaN(Number(trimmed))) {
      semanticType = 'number';
    }

    return {
      semanticType,
      variables,
      degree: maxDegree > 0 ? maxDegree : undefined,
      isLinear: maxDegree === 1 && (hasEquals || semanticType === 'equation'),
      isQuadratic: maxDegree === 2 && (hasEquals || semanticType === 'equation'),
      hasDerivatives,
      hasIntegrals,
      hasMatrices,
    };
  }
}

export function parseLatexToAST(latex: string): MathASTNode {
  const analysis = SemanticAnalyzer.analyze(latex);
  return {
    type: analysis.semanticType.toUpperCase() + '_NODE',
    value: latex,
    meta: {
      ...analysis,
    },
  };
}

export function classifyExpression(latex: string): MathSemanticType {
  return SemanticAnalyzer.analyze(latex).semanticType;
}
