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
    const g = ctx.createRadialGradient(
      this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
      this.x, this.y, this.size
    );
    g.addColorStop(0, 'rgba(180,230,255,0.15)');
    g.addColorStop(0.7, 'rgba(120,200,255,0.08)');
    g.addColorStop(1, 'rgba(100,180,255,0.2)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,220,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(this.x - this.size * 0.25, this.y - this.size * 0.25, this.size * 0.2, this.size * 0.15, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
