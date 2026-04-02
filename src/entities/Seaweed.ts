import { rand, pick, clamp, TAU } from '@/utils/math';
import { store } from '@/state/store';

interface SeaweedOpts {
  segments?: number;
  segLen?: number;
  width?: number;
  color1?: string;
  color2?: string;
}

export class Seaweed {
  x: number;
  baseY: number;
  segments: number;
  segLen: number;
  phase: number;
  speed: number;
  width: number;
  color1: string;
  color2: string;
  z: number;
  private _grad: CanvasGradient | null = null;

  constructor(x: number, ctx: CanvasRenderingContext2D, opts?: SeaweedOpts) {
    const { H } = store;
    this.x = x;
    this.baseY = H;
    this.segments = opts?.segments ?? Math.floor(rand(6, 14));
    this.segLen = opts?.segLen ?? rand(14, 25);
    this.phase = rand(0, TAU);
    this.speed = rand(0.5, 1.2);
    this.width = opts?.width ?? rand(4, 10);
    this.color1 = opts?.color1 ?? pick(['#1B5E20', '#2E7D32', '#388E3C', '#0D4A0D', '#145A32']);
    this.color2 = opts?.color2 ?? pick(['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7']);
    this.z = rand(0.7, 1.3);
    // 그라데이션 캐시
    const g = ctx.createLinearGradient(this.x, this.baseY, this.x, this.baseY - this.segments * this.segLen);
    g.addColorStop(0, this.color1);
    g.addColorStop(1, this.color2);
    this._grad = g;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { time } = store;
    ctx.save();
    ctx.globalAlpha = 0.7 * clamp(this.z, 0.5, 1);
    const pts = [{ x: this.x, y: this.baseY }];
    for (let i = 1; i <= this.segments; i++) {
      const t = i / this.segments;
      const sway = Math.sin(this.phase + time * this.speed + i * 0.5) * (15 * t);
      pts.push({ x: this.x + sway, y: this.baseY - i * this.segLen });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x - this.width / 2, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const t = i / (pts.length - 1);
      const w = this.width * (1 - t * 0.6);
      ctx.lineTo(pts[i].x - w / 2, pts[i].y);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const t = i / (pts.length - 1);
      const w = this.width * (1 - t * 0.6);
      ctx.lineTo(pts[i].x + w / 2, pts[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = this._grad!;
    ctx.fill();
    ctx.restore();
  }
}
