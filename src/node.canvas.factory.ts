import { Canvas } from '@napi-rs/canvas';

export interface CanvasContext {
  canvas: Canvas;
  context: CanvasRenderingContext2D;
}

export interface CanvasFactory {
  create: (width: number, height: number) => CanvasContext;
}

interface CanvasRenderingContext2D {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  // ...
}
