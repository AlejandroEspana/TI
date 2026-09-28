import { Stroke, type StrokePoint, type BoundingBox } from './stroke';

export interface TargetBounds {
  id: string;
  bbox: BoundingBox;
}

export interface StrikethroughMatch {
  isStrikethrough: boolean;
  targetId?: string;
  confidence: number;
  reason?: 'horizontal_line' | 'zigzag_scribble';
}

export class StrikethroughDetector {
  /**
   * Evaluates if a given stroke is a strikethrough gesture targeting any existing object on the board.
   */
  static detectStrikethrough(
    rawStrokePoints: StrokePoint[],
    existingTargets: TargetBounds[]
  ): StrikethroughMatch {
    if (rawStrokePoints.length < 2 || existingTargets.length === 0) {
      return { isStrikethrough: false, confidence: 0 };
    }

    const stroke = new Stroke(rawStrokePoints);
    let bestMatch: StrikethroughMatch = { isStrikethrough: false, confidence: 0 };

    for (const target of existingTargets) {
      const b = target.bbox;
      if (b.width <= 0 || b.height <= 0) continue;

      // 1. Calculate horizontal and vertical overlap
      const overlapMinX = Math.max(stroke.bbox.minX, b.minX);
      const overlapMaxX = Math.min(stroke.bbox.maxX, b.maxX);
      const overlapWidth = Math.max(0, overlapMaxX - overlapMinX);
      const widthRatio = overlapWidth / b.width;

      // Vertical alignment check: stroke must pass near the target's vertical band
      const targetPadY = Math.max(20, b.height * 0.4);
      const inVerticalBand =
        stroke.bbox.centerY >= b.minY - targetPadY &&
        stroke.bbox.centerY <= b.maxY + targetPadY;

      if (!inVerticalBand || widthRatio < 0.35) {
        continue;
      }

      // 2. Check for Horizontal Slash (predominantly horizontal line across target)
      const isHorizontalSlash =
        stroke.bbox.width > 1.6 * stroke.bbox.height &&
        stroke.bbox.width > 20 &&
        widthRatio >= 0.45;

      if (isHorizontalSlash) {
        const confidence = Math.min(0.98, 0.7 + widthRatio * 0.28);
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            isStrikethrough: true,
            targetId: target.id,
            confidence: Number(confidence.toFixed(2)),
            reason: 'horizontal_line',
          };
        }
        continue;
      }

      // 3. Check for Zigzag / Scribble Scratch (back and forth motion across target)
      let directionReversals = 0;
      let lastSign = 0;
      for (let i = 1; i < rawStrokePoints.length; i++) {
        const dx = rawStrokePoints[i].x - rawStrokePoints[i - 1].x;
        if (Math.abs(dx) > 3) {
          const currentSign = Math.sign(dx);
          if (lastSign !== 0 && currentSign !== lastSign) {
            directionReversals++;
          }
          lastSign = currentSign;
        }
      }

      const isScribble = directionReversals >= 2 && widthRatio >= 0.35;
      if (isScribble) {
        const confidence = Math.min(0.96, 0.75 + Math.min(reversalsBonus(directionReversals), 0.2));
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            isStrikethrough: true,
            targetId: target.id,
            confidence: Number(confidence.toFixed(2)),
            reason: 'zigzag_scribble',
          };
        }
      }
    }

    return bestMatch;
  }
}

function reversalsBonus(reversals: number): number {
  return (reversals - 2) * 0.05;
}
