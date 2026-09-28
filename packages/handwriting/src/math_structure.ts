import type { MathASTNode } from '@mathboard/shared';
import { type RecognizedSymbol, SpatialRelation, SpatialRelationAnalyzer } from './spatial_relations';

export type MathStructureNode =
  | VariableNode
  | NumberNode
  | PowerNode
  | FractionNode
  | RadicalNode
  | SubscriptNode
  | GroupNode
  | BinaryOpNode
  | EquationNode
  | CalculusNode
  | RawSymbolNode;

export interface RawSymbolNode {
  type: 'RawSymbol';
  symbol: string;
}

export interface VariableNode {
  type: 'Variable';
  name: string;
}

export interface NumberNode {
  type: 'Number';
  value: string;
}

export interface PowerNode {
  type: 'Power';
  base: MathStructureNode;
  exponent: MathStructureNode;
}

export interface FractionNode {
  type: 'Fraction';
  numerator: MathStructureNode;
  denominator: MathStructureNode;
}

export interface RadicalNode {
  type: 'Radical';
  radicand: MathStructureNode;
  index?: MathStructureNode;
}

export interface SubscriptNode {
  type: 'Subscript';
  base: MathStructureNode;
  sub: MathStructureNode;
}

export interface GroupNode {
  type: 'Group';
  content: MathStructureNode;
}

export interface BinaryOpNode {
  type: 'BinaryOp';
  op: string;
  left: MathStructureNode;
  right: MathStructureNode;
}

export interface EquationNode {
  type: 'Equation';
  left: MathStructureNode;
  right: MathStructureNode;
}

export interface CalculusNode {
  type: 'Calculus';
  kind: 'integral' | 'derivative' | 'limit';
  expression: MathStructureNode;
  variable?: string;
  limitTarget?: string;
}

export class StructuralTreeBuilder {
  /**
   * Main entry point: builds a hierarchical MathStructureNode tree from a collection of recognized symbols.
   */
  static buildTree(symbols: RecognizedSymbol[]): MathStructureNode {
    if (symbols.length === 0) {
      return { type: 'Number', value: '0' };
    }

    if (symbols.length === 1) {
      const s = symbols[0];
      if (['+', '-', '*', '/', '='].includes(s.symbol)) {
        return { type: 'RawSymbol', symbol: s.symbol };
      }
      if (s.category === 'digit') {
        return { type: 'Number', value: s.symbol };
      }
      if (s.category === 'variable') {
        return { type: 'Variable', name: s.symbol };
      }
      if (s.category === 'radical') {
        return { type: 'Radical', radicand: { type: 'Variable', name: 'x' } };
      }
      return { type: 'Variable', name: s.symbol };
    }

    // 1. Check for Equation (=)
    const equalsIdx = symbols.findIndex((s) => s.symbol === '=');
    if (equalsIdx > 0 && equalsIdx < symbols.length - 1) {
      const leftSyms = symbols.slice(0, equalsIdx);
      const rightSyms = symbols.slice(equalsIdx + 1);
      return {
        type: 'Equation',
        left: this.buildTree(leftSyms),
        right: this.buildTree(rightSyms),
      };
    }

    // 2. Check for Fraction Bars
    const fractionBar = symbols.find(
      (s) =>
        s.category === 'fraction_bar' ||
        (s.symbol === '-' && s.bbox.width > 2.0 * s.bbox.height && s.bbox.width > 25)
    );

    if (fractionBar) {
      const numeratorSyms: RecognizedSymbol[] = [];
      const denominatorSyms: RecognizedSymbol[] = [];
      const remainingSyms: RecognizedSymbol[] = [];

      for (const s of symbols) {
        if (s.id === fractionBar.id) continue;
        const rel = SpatialRelationAnalyzer.determineRelation(fractionBar, s);
        if (rel === SpatialRelation.ABOVE) {
          numeratorSyms.push(s);
        } else if (rel === SpatialRelation.BELOW) {
          denominatorSyms.push(s);
        } else {
          remainingSyms.push(s);
        }
      }

      if (numeratorSyms.length > 0 && denominatorSyms.length > 0) {
        const fracNode: FractionNode = {
          type: 'Fraction',
          numerator: this.buildTree(numeratorSyms),
          denominator: this.buildTree(denominatorSyms),
        };

        if (remainingSyms.length === 0) {
          return fracNode;
        }
        return this.combineWithRemaining(fracNode, remainingSyms);
      }
    }

    // 3. Check for Radical (√)
    const radicalSymbol = symbols.find((s) => s.symbol === '√' || s.category === 'radical');
    if (radicalSymbol) {
      const innerSyms: RecognizedSymbol[] = [];
      const outsideSyms: RecognizedSymbol[] = [];

      for (const s of symbols) {
        if (s.id === radicalSymbol.id) continue;
        const rel = SpatialRelationAnalyzer.determineRelation(radicalSymbol, s);
        if (rel === SpatialRelation.CONTAINS) {
          innerSyms.push(s);
        } else {
          outsideSyms.push(s);
        }
      }

      if (innerSyms.length > 0) {
        const radNode: RadicalNode = {
          type: 'Radical',
          radicand: this.buildTree(innerSyms),
        };
        if (outsideSyms.length === 0) return radNode;
        return this.combineWithRemaining(radNode, outsideSyms);
      }
    }

    // 4. Check for Calculus (∫, lim, d/dx)
    const integralSym = symbols.find((s) => s.symbol === '∫' || s.latex.startsWith('\\int'));
    if (integralSym) {
      const afterIntegral = symbols.filter((s) => s.centerX > integralSym.centerX);
      // Look for differential 'dx'
      let exprSyms = afterIntegral;
      let varName = 'x';
      const last = afterIntegral[afterIntegral.length - 1];
      if (last && last.symbol === 'x' && afterIntegral.length > 1) {
        const secondLast = afterIntegral[afterIntegral.length - 2];
        if (secondLast && secondLast.symbol === 'd') {
          exprSyms = afterIntegral.slice(0, afterIntegral.length - 2);
          varName = 'x';
        }
      }
      return {
        type: 'Calculus',
        kind: 'integral',
        expression: this.buildTree(exprSyms.length > 0 ? exprSyms : [{ ...integralSym, symbol: '1' }]),
        variable: varName,
      };
    }

    // 5. Sequence parsing: Parentheses, Powers, Subscripts, Digits, and Operators
    return this.parseHorizontalSequence(symbols);
  }

  private static parseHorizontalSequence(symbols: RecognizedSymbol[]): MathStructureNode {
    // Sort left to right
    const sorted = [...symbols].sort((a, b) => a.centerX - b.centerX);

    // Group adjacent multi-digit numbers (e.g. '2' then '5' on same baseline becomes '25')
    const tokens: Array<RecognizedSymbol | { isMergedNumber: true; value: string; bbox: RecognizedSymbol['bbox'] }> = [];
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr.category === 'digit') {
        let numStr = curr.symbol;
        let lastBbox = curr.bbox;
        while (
          i + 1 < sorted.length &&
          sorted[i + 1].category === 'digit' &&
          SpatialRelationAnalyzer.determineRelation(sorted[i], sorted[i + 1]) === SpatialRelation.RIGHT &&
          sorted[i + 1].bbox.minX - lastBbox.maxX < Math.max(18, lastBbox.width * 0.7)
        ) {
          i++;
          numStr += sorted[i].symbol;
          lastBbox = {
            ...lastBbox,
            maxX: sorted[i].bbox.maxX,
            width: sorted[i].bbox.maxX - lastBbox.minX,
          };
        }
        if (numStr.length > 1) {
          tokens.push({ isMergedNumber: true, value: numStr, bbox: lastBbox });
          continue;
        }
      }
      tokens.push(curr);
    }

    // Process fences (parentheses) and build operands/operators token stream
    type InfixToken = { type: 'operand'; node: MathStructureNode } | { type: 'op'; op: string };
    const infixStream: InfixToken[] = [];
    let i = 0;

    while (i < tokens.length) {
      const tok = tokens[i];

      // Handle Parentheses Group: ( ... )
      if ('symbol' in tok && tok.symbol === '(') {
        const closeIdx = tokens.findIndex((t, idx) => idx > i && 'symbol' in t && t.symbol === ')');
        if (closeIdx !== -1) {
          const innerTokens = tokens.slice(i + 1, closeIdx) as RecognizedSymbol[];
          const groupNode: GroupNode = {
            type: 'Group',
            content: this.parseHorizontalSequence(innerTokens),
          };

          // Check if power immediately follows the group: e.g. (x+2)²
          if (closeIdx + 1 < tokens.length) {
            const nextTok = tokens[closeIdx + 1];
            const closeTok = tokens[closeIdx];
            if ('symbol' in nextTok && 'symbol' in closeTok) {
              const rel = SpatialRelationAnalyzer.determineRelation(closeTok as RecognizedSymbol, nextTok);
              if (rel === SpatialRelation.SUPER_SCRIPT) {
                infixStream.push({
                  type: 'operand',
                  node: {
                    type: 'Power',
                    base: groupNode,
                    exponent: this.tokenToNode(nextTok),
                  },
                });
                i = closeIdx + 2;
                continue;
              }
            }
          }

          infixStream.push({ type: 'operand', node: groupNode });
          i = closeIdx + 1;
          continue;
        }
      }

      // Check if this token is an explicit operator (+, -, *, /)
      if ('symbol' in tok && ['+', '-', '*', '/'].includes(tok.symbol)) {
        infixStream.push({ type: 'op', op: tok.symbol });
        i++;
        continue;
      }

      // Base operand
      let baseNode = this.tokenToNode(tok);

      // Lookahead: check if next token is a SUPER_SCRIPT (Power) or SUB_SCRIPT
      if (i + 1 < tokens.length && 'symbol' in tok) {
        const nextTok = tokens[i + 1];
        if ('symbol' in nextTok && !['+', '-', '*', '/', '='].includes(nextTok.symbol)) {
          const rel = SpatialRelationAnalyzer.determineRelation(tok, nextTok);

          if (rel === SpatialRelation.SUPER_SCRIPT) {
            const exponentNode = this.tokenToNode(nextTok);
            baseNode = {
              type: 'Power',
              base: baseNode,
              exponent: exponentNode,
            };
            i += 2;
            infixStream.push({ type: 'operand', node: baseNode });
            continue;
          } else if (rel === SpatialRelation.SUB_SCRIPT) {
            baseNode = {
              type: 'Subscript',
              base: baseNode,
              sub: this.tokenToNode(nextTok),
            };
            i += 2;
            infixStream.push({ type: 'operand', node: baseNode });
            continue;
          }
        }
      }

      infixStream.push({ type: 'operand', node: baseNode });
      i++;
    }

    // Insert implicit multiplications between consecutive operands (e.g. 2 followed by x or x followed by y)
    const unifiedStream: InfixToken[] = [];
    for (let k = 0; k < infixStream.length; k++) {
      unifiedStream.push(infixStream[k]);
      if (
        k + 1 < infixStream.length &&
        infixStream[k].type === 'operand' &&
        infixStream[k + 1].type === 'operand'
      ) {
        unifiedStream.push({ type: 'op', op: '*' });
      }
    }

    if (unifiedStream.length === 0) return { type: 'Number', value: '0' };
    if (unifiedStream.length === 1 && unifiedStream[0].type === 'operand') {
      return unifiedStream[0].node;
    }

    // Reduce operators by standard precedence:
    // Pass 1: * and /
    const afterMulDiv: InfixToken[] = [];
    let p = 0;
    while (p < unifiedStream.length) {
      const item = unifiedStream[p];
      if (item.type === 'op' && (item.op === '*' || item.op === '/')) {
        const leftToken = afterMulDiv.pop();
        const rightToken = unifiedStream[p + 1];
        if (leftToken && leftToken.type === 'operand' && rightToken && rightToken.type === 'operand') {
          afterMulDiv.push({
            type: 'operand',
            node: {
              type: 'BinaryOp',
              op: item.op,
              left: leftToken.node,
              right: rightToken.node,
            },
          });
          p += 2;
          continue;
        }
      }
      afterMulDiv.push(item);
      p++;
    }

    // Pass 2: + and -
    if (afterMulDiv.length === 0) return { type: 'Number', value: '0' };
    const first = afterMulDiv[0];
    let root: MathStructureNode = first && first.type === 'operand' ? first.node : { type: 'Number', value: '0' };
    let q = 1;
    while (q < afterMulDiv.length) {
      const opTok = afterMulDiv[q];
      const rightTok = afterMulDiv[q + 1];
      if (opTok && opTok.type === 'op' && rightTok && rightTok.type === 'operand') {
        root = {
          type: 'BinaryOp',
          op: opTok.op,
          left: root,
          right: rightTok.node,
        };
        q += 2;
      } else {
        q++;
      }
    }

    return root;
  }

  private static tokenToNode(
    tok: RecognizedSymbol | { isMergedNumber: true; value: string; bbox: RecognizedSymbol['bbox'] }
  ): MathStructureNode {
    if ('isMergedNumber' in tok) {
      return { type: 'Number', value: tok.value };
    }
    if (tok.category === 'digit') {
      return { type: 'Number', value: tok.symbol };
    }
    if (tok.category === 'variable') {
      return { type: 'Variable', name: tok.symbol };
    }
    if (['+', '-', '*', '/'].includes(tok.symbol)) {
      return { type: 'RawSymbol', symbol: tok.symbol };
    }
    return { type: 'Variable', name: tok.symbol };
  }

  private static combineWithRemaining(mainNode: MathStructureNode, remaining: RecognizedSymbol[]): MathStructureNode {
    const remTree = this.parseHorizontalSequence(remaining);
    return {
      type: 'BinaryOp',
      op: '+',
      left: mainNode,
      right: remTree,
    };
  }

  /**
   * Converts a MathStructureNode tree into standard mathematical LaTeX.
   */
  static toLatex(node: MathStructureNode): string {
    switch (node.type) {
      case 'RawSymbol':
        return node.symbol;
      case 'Variable':
        return node.name;
      case 'Number':
        return node.value;
      case 'Power': {
        const baseLatex = this.toLatex(node.base);
        const expLatex = this.toLatex(node.exponent);
        return `${baseLatex}^{${expLatex}}`;
      }
      case 'Fraction':
        return `\\frac{${this.toLatex(node.numerator)}}{${this.toLatex(node.denominator)}}`;
      case 'Radical':
        return `\\sqrt{${this.toLatex(node.radicand)}}`;
      case 'Subscript':
        return `${this.toLatex(node.base)}_{${this.toLatex(node.sub)}}`;
      case 'Group':
        return `(${this.toLatex(node.content)})`;
      case 'BinaryOp': {
        const left = this.toLatex(node.left);
        const right = this.toLatex(node.right);
        if (node.op === '*') {
          // If digit and variable/power/group, render 2x without explicit \cdot
          if (node.left.type === 'Number' && (node.right.type === 'Variable' || node.right.type === 'Power' || node.right.type === 'Group')) {
            return `${left}${right}`;
          }
          return `${left} \\cdot ${right}`;
        }
        return `${left} ${node.op} ${right}`;
      }
      case 'Equation':
        return `${this.toLatex(node.left)} = ${this.toLatex(node.right)}`;
      case 'Calculus': {
        const expr = this.toLatex(node.expression);
        const v = node.variable || 'x';
        if (node.kind === 'integral') {
          return `\\int ${expr} d${v}`;
        }
        if (node.kind === 'derivative') {
          return `\\frac{d}{d${v}}(${expr})`;
        }
        if (node.kind === 'limit') {
          return `\\lim_{${v} \\to ${node.limitTarget || '0'}} ${expr}`;
        }
        return expr;
      }
    }
  }

  /**
   * Converts a MathStructureNode tree into a MathASTNode for computational evaluation.
   */
  static toAST(node: MathStructureNode): MathASTNode {
    switch (node.type) {
      case 'RawSymbol':
        return { type: 'OPERATOR', value: node.symbol };
      case 'Variable':
        return { type: 'IDENTIFIER', value: node.name };
      case 'Number':
        return { type: 'NUMBER', value: Number(node.value) };
      case 'Power':
        return {
          type: 'POWER',
          operator: '^',
          children: [this.toAST(node.base), this.toAST(node.exponent)],
        };
      case 'Fraction':
        return {
          type: 'FRACTION',
          operator: '/',
          children: [this.toAST(node.numerator), this.toAST(node.denominator)],
        };
      case 'Radical':
        return {
          type: 'FUNCTION',
          value: 'sqrt',
          children: [this.toAST(node.radicand)],
        };
      case 'Subscript':
        return {
          type: 'SUBSCRIPT',
          children: [this.toAST(node.base), this.toAST(node.sub)],
        };
      case 'Group':
        return this.toAST(node.content);
      case 'BinaryOp':
        return {
          type: 'BINARY_OP',
          operator: node.op,
          children: [this.toAST(node.left), this.toAST(node.right)],
        };
      case 'Equation':
        return {
          type: 'EQUATION',
          operator: '=',
          children: [this.toAST(node.left), this.toAST(node.right)],
        };
      case 'Calculus':
        return {
          type: 'CALCULUS',
          value: node.kind,
          children: [this.toAST(node.expression)],
        };
    }
  }
}
