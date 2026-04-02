import { rand, pick, clamp, TAU } from '@/utils/math';
import { store } from '@/state/store';

interface Branch {
  angle: number;
  len: number;
}

interface TubeBranch {
  bx: number;
  h: number;
  w: number;
}

export class Coral {
  x: number;
  y: number;
  type: number;
  size: number;
  color: string;
  z: number;
  branches: Branch[];
  tubeBranches: TubeBranch[];

  constructor(x: number) {
    const { H } = store;
    this.x = x;
    this.y = H;
    this.type = Math.floor(rand(0, 3));
    this.size = rand(25, 55);
    this.color = pick(['#FF6B6B', '#EE5A24', '#F8B500', '#6C5CE7', '#E056A0', '#00B894', '#FDA7DF']);
    this.z = rand(0.7, 1.2);
    this.branches = [];
    this.tubeBranches = [];
    if (this.type === 0) {
      for (let i = 0; i < 7; i++) {
        this.branches.push({ angle: -Math.PI / 2 + (i - 3) * 0.22, len: this.size * rand(0.7, 1) });
      }
    } else if (this.type === 2) {
      for (let i = 0; i < 5; i++) {
        this.tubeBranches.push({ bx: (i - 2) * this.size * 0.25, h: this.size * rand(0.5, 1), w: this.size * 0.12 });
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = 0.6 * clamp(this.z, 0.5, 1);
    const sz = this.size;
    if (this.type === 0) {
      for (const b of this.branches) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const ex = this.x + Math.cos(b.angle) * b.len;
        const ey = this.y + Math.sin(b.angle) * b.len;
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.fillStyle = this.color + '88';
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, TAU);
        ctx.fill();
      }
    } else if (this.type === 1) {
      ctx.fillStyle = this.color + 'BB';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - sz * 0.3, sz * 0.4, sz * 0.3, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = this.color + '77';
      ctx.beginPath();
      ctx.ellipse(this.x - sz * 0.15, this.y - sz * 0.15, sz * 0.25, sz * 0.2, 0.3, Math.PI, 0);
      ctx.fill();
    } else {
      for (const b of this.tubeBranches) {
        ctx.fillStyle = this.color + 'AA';
        ctx.beginPath();
        ctx.roundRect(this.x + b.bx - b.w / 2, this.y - b.h, b.w, b.h, [b.w / 2, b.w / 2, 0, 0]);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
