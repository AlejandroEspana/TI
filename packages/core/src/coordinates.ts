import type { Position } from '@mathboard/shared';
import type { Viewport } from './index';

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class CoordinateManager {
  /**
   * Transforms screen/pointer coordinates (clientX, clientY) to Board (World) coordinates.
   * Takes into account the canvas DOM element's bounding rect, viewport pan offset, and zoom factor.
   */
  static screenToBoard(
    screen: { clientX: number; clientY: number },
    viewport: Viewport,
    rect?: CanvasRect
  ): Position {
    const offsetX = rect ? screen.clientX - rect.left : screen.clientX;
    const offsetY = rect ? screen.clientY - rect.top : screen.clientY;

    return {
      x: (offsetX - viewport.x) / viewport.zoom,
      y: (offsetY - viewport.y) / viewport.zoom,
    };
  }

  /**
   * Transforms Board (World) coordinates to screen/pixel coordinates.
   */
  static boardToScreen(
    board: Position,
    viewport: Viewport,
    rect?: CanvasRect
  ): Position {
    const screenX = board.x * viewport.zoom + viewport.x;
    const screenY = board.y * viewport.zoom + viewport.y;

    return {
      x: rect ? screenX + rect.left : screenX,
      y: rect ? screenY + rect.top : screenY,
    };
  }

  /**
   * Configures an HTML5 Canvas element for high-DPI (Retina / 4K / scaled Windows) displays,
   * keeping the backing pixel buffer perfectly synchronized with CSS layout pixels.
   */
  static setupHiDPICanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    dpr: number = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
  ): CanvasRenderingContext2D | null {
    const safeDpr = Math.max(1, dpr);
    canvas.width = Math.round(width * safeDpr);
    canvas.height = Math.round(height * safeDpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (typeof ctx.setTransform === 'function') {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      }
      if (typeof ctx.scale === 'function') {
        ctx.scale(safeDpr, safeDpr);
      }
    }
    return ctx;
  }
}
