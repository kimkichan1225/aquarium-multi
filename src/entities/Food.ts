import { rand, pick, TAU } from '@/utils/math';
import { store } from '@/state/store';

export class Food {
  x: number;
  y: number;
  vy: number;
  size: number;
  wobblePhase: number;
  eaten: boolean;
  opacity: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vy = 0.3;
    this.size = rand(2, 4);
    this.wobblePhase = rand(0, TAU);
    this.eaten = false;
    this.opacity = 1;
    this.color = pick(['#FFD700', '#FFA500', '#FF8C42', '#E8A87C']);
  }

  update(dt: number): void {
    const s = dt * 60;
    const { H } = store;
    this.y += this.vy * s;
    this.wobblePhase += 2 * dt;
    this.x += Math.sin(this.wobblePhase) * 0.3;
    if (this.y > H - 80) {
      this.opacity -= 0.005 * s;
      if (this.opacity <= 0) this.eaten = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = this.opacity * 0.3;
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.3, this.size * 0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
