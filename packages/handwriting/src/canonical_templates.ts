import { PointCloud, type Point2D } from './point_cloud';

export interface CanonicalTemplate {
  symbol: string;
  latex: string;
  variant: string;
  strokeCount: number;
  points: Point2D[];
  hasLoop: boolean;
  aspectRatio: number; // width / height
}

// Helper to build canonical template from raw stroke coordinates
function makeTemplate(
  symbol: string,
  latex: string,
  variant: string,
  rawStrokes: Array<Array<{ x: number; y: number }>>,
  hasLoop: boolean = false
): CanonicalTemplate {
  // calculate original aspect ratio
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of rawStrokes) {
    for (const p of s) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const aspectRatio = w / h;

  const points = PointCloud.normalizeStrokes(rawStrokes, 32);

  return {
    symbol,
    latex,
    variant,
    strokeCount: rawStrokes.length,
    points,
    hasLoop,
    aspectRatio,
  };
}

export const CANONICAL_TEMPLATES: CanonicalTemplate[] = [
  // Digits
  // 0: Oval / Circle loop
  makeTemplate('0', '0', 'standard', [
    [
      { x: 50, y: 10 }, { x: 80, y: 30 }, { x: 80, y: 70 },
      { x: 50, y: 90 }, { x: 20, y: 70 }, { x: 20, y: 30 }, { x: 50, y: 10 },
    ],
  ], true),

  // 1: Straight vertical stroke
  makeTemplate('1', '1', 'straight', [
    [{ x: 50, y: 10 }, { x: 50, y: 90 }],
  ]),

  // 1: With serif hook
  makeTemplate('1', '1', 'serif', [
    [{ x: 35, y: 25 }, { x: 50, y: 10 }, { x: 50, y: 90 }],
  ]),

  // 2: Hook + diagonal + flat base
  makeTemplate('2', '2', 'standard', [
    [
      { x: 25, y: 30 }, { x: 50, y: 10 }, { x: 75, y: 30 },
      { x: 50, y: 60 }, { x: 25, y: 90 }, { x: 75, y: 90 },
    ],
  ]),

  // 2: Smooth curved arch + flat base
  makeTemplate('2', '2', 'smooth', [
    [
      { x: 30, y: 35 }, { x: 50, y: 15 }, { x: 70, y: 35 },
      { x: 50, y: 60 }, { x: 30, y: 85 }, { x: 75, y: 85 },
    ],
  ]),

  // 2: Rounded hook with sloping base
  makeTemplate('2', '2', 'hook', [
    [
      { x: 28, y: 32 }, { x: 48, y: 12 }, { x: 72, y: 28 },
      { x: 52, y: 55 }, { x: 28, y: 88 }, { x: 45, y: 88 }, { x: 75, y: 88 },
    ],
  ]),

  // 3: Two curved arcs
  makeTemplate('3', '3', 'standard', [
    [
      { x: 25, y: 20 }, { x: 65, y: 15 }, { x: 70, y: 40 },
      { x: 45, y: 50 }, { x: 75, y: 65 }, { x: 65, y: 90 }, { x: 25, y: 85 },
    ],
  ]),

  // 4: Down-right and vertical cross
  makeTemplate('4', '4', 'standard', [
    [{ x: 30, y: 15 }, { x: 20, y: 60 }, { x: 75, y: 60 }],
    [{ x: 60, y: 20 }, { x: 60, y: 90 }],
  ]),

  // 5: Top bar, down, round belly
  makeTemplate('5', '5', 'standard', [
    [
      { x: 70, y: 15 }, { x: 30, y: 15 }, { x: 25, y: 45 },
      { x: 65, y: 50 }, { x: 70, y: 75 }, { x: 50, y: 90 }, { x: 25, y: 80 },
    ],
  ]),

  // 6: Curve down and loop at bottom
  makeTemplate('6', '6', 'standard', [
    [
      { x: 65, y: 15 }, { x: 30, y: 50 }, { x: 30, y: 80 },
      { x: 65, y: 80 }, { x: 65, y: 60 }, { x: 30, y: 60 },
    ],
  ], true),

  // 7: Top bar and diagonal down
  makeTemplate('7', '7', 'standard', [
    [{ x: 25, y: 15 }, { x: 75, y: 15 }, { x: 40, y: 90 }],
  ]),

  // 7: With horizontal crossbar
  makeTemplate('7', '7', 'with-bar', [
    [{ x: 25, y: 15 }, { x: 75, y: 15 }, { x: 40, y: 90 }],
    [{ x: 35, y: 50 }, { x: 65, y: 50 }],
  ]),

  // 8: Figure 8 loop
  makeTemplate('8', '8', 'standard', [
    [
      { x: 50, y: 15 }, { x: 30, y: 30 }, { x: 70, y: 70 },
      { x: 50, y: 90 }, { x: 30, y: 70 }, { x: 70, y: 30 }, { x: 50, y: 15 },
    ],
  ], true),

  // 9: Top loop and stem down
  makeTemplate('9', '9', 'standard', [
    [
      { x: 65, y: 50 }, { x: 35, y: 50 }, { x: 35, y: 20 },
      { x: 65, y: 20 }, { x: 65, y: 90 },
    ],
  ], true),

  // Variables
  // x: Crossed strokes (stroke 1: top-left to bottom-right, stroke 2: top-right to bottom-left)
  makeTemplate('x', 'x', 'crossed', [
    [{ x: 25, y: 25 }, { x: 75, y: 75 }],
    [{ x: 75, y: 25 }, { x: 25, y: 75 }],
  ]),

  // x: Cursive / single stroke
  makeTemplate('x', 'x', 'cursive', [
    [
      { x: 25, y: 30 }, { x: 40, y: 50 }, { x: 25, y: 70 },
      { x: 50, y: 50 }, { x: 75, y: 30 }, { x: 60, y: 50 }, { x: 75, y: 70 },
    ],
  ]),

  // y: V-cup and descending tail
  makeTemplate('y', 'y', 'standard', [
    [{ x: 25, y: 25 }, { x: 50, y: 55 }],
    [{ x: 75, y: 25 }, { x: 35, y: 95 }],
  ]),

  // z: Top horizontal, diagonal, bottom horizontal
  makeTemplate('z', 'z', 'standard', [
    [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  ]),

  // a: Circle + vertical tail
  makeTemplate('a', 'a', 'standard', [
    [
      { x: 65, y: 45 }, { x: 40, y: 40 }, { x: 25, y: 60 },
      { x: 40, y: 80 }, { x: 65, y: 75 }, { x: 65, y: 35 }, { x: 65, y: 85 },
    ],
  ], true),

  // b: Vertical stem + loop
  makeTemplate('b', 'b', 'standard', [
    [
      { x: 30, y: 15 }, { x: 30, y: 85 }, { x: 55, y: 85 },
      { x: 70, y: 70 }, { x: 70, y: 55 }, { x: 55, y: 45 }, { x: 30, y: 45 },
    ],
  ], true),

  // c: Open circle
  makeTemplate('c', 'c', 'standard', [
    [{ x: 70, y: 30 }, { x: 45, y: 25 }, { x: 30, y: 50 }, { x: 45, y: 75 }, { x: 70, y: 70 }],
  ]),

  // Operators
  // +: Plus sign (horizontal and vertical)
  makeTemplate('+', '+', 'standard', [
    [{ x: 50, y: 20 }, { x: 50, y: 80 }],
    [{ x: 20, y: 50 }, { x: 80, y: 50 }],
  ]),

  // -: Minus sign (horizontal)
  makeTemplate('-', '-', 'standard', [
    [{ x: 15, y: 50 }, { x: 85, y: 50 }],
  ]),

  // *: Asterisk / Cross
  makeTemplate('*', '\\cdot', 'cross', [
    [{ x: 30, y: 30 }, { x: 70, y: 70 }],
    [{ x: 70, y: 30 }, { x: 30, y: 70 }],
    [{ x: 50, y: 20 }, { x: 50, y: 80 }],
  ]),

  // /: Slash (forward diagonal)
  makeTemplate('/', '/', 'standard', [
    [{ x: 25, y: 85 }, { x: 75, y: 15 }],
  ]),

  // =: Equal sign (2 parallel horizontal lines)
  makeTemplate('=', '=', 'standard', [
    [{ x: 20, y: 40 }, { x: 80, y: 40 }],
    [{ x: 20, y: 60 }, { x: 80, y: 60 }],
  ]),

  // (: Left parenthesis
  makeTemplate('(', '(', 'standard', [
    [{ x: 65, y: 15 }, { x: 40, y: 50 }, { x: 65, y: 85 }],
  ]),

  // ): Right parenthesis
  makeTemplate(')', ')', 'standard', [
    [{ x: 35, y: 15 }, { x: 60, y: 50 }, { x: 35, y: 85 }],
  ]),

  // Special / Calculus
  // \sqrt: Square root
  makeTemplate('√', '\\sqrt{}', 'standard', [
    [
      { x: 15, y: 50 }, { x: 25, y: 45 }, { x: 40, y: 85 },
      { x: 55, y: 20 }, { x: 90, y: 20 },
    ],
  ]),

  // \int: Integral symbol
  makeTemplate('∫', '\\int', 'standard', [
    [
      { x: 65, y: 15 }, { x: 50, y: 15 }, { x: 50, y: 85 }, { x: 35, y: 85 },
    ],
  ]),
];
