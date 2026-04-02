import { rand, TAU } from '@/utils/math';
import { store } from '@/state/store';

export class Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  opacity: number;
  popped: boolean;

  constructor() {
    const { W, H } = store;
    this.x = rand(30, W - 30);
    this.y = H + rand(10, 60);
    this.size = rand(2, 8);
    this.speed = rand(0.3, 1.2);
    this.wobblePhase = rand(0, TAU);
    this.wobbleSpeed = rand(1, 3);
    this.wobbleAmp = rand(0.2, 1);
    this.opacity = rand(0.1, 0.35);
    this.popped = false;
  }

  update(dt: number): void {
    const s = dt * 60;
    this.y -= this.speed * s;
    this.wobblePhase += this.wobbleSpeed * dt;
    this.x += Math.sin(this.wobblePhase) * this.wobbleAmp;
    if (this.y < -20) this.popped = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    // 단순 원 + 스트로크 (RadialGradient 제거, 60개×60fps 절약)
    ctx.fillStyle = 'rgba(140,210,255,0.12)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,220,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.25, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
