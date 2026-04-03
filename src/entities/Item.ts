import { TAU } from '@/utils/math';

export type ItemType = 'shell' | 'gem' | 'starfish';

export interface CollectedItem {
  type: ItemType;
  collectedAt: number;
  fishName: string;
}

export class Item {
  x: number;
  y: number;
  type: ItemType;
  size: number;
  collected: boolean;
  collectedBy: string | null; // fish name
  bobPhase: number;
  glowPhase: number;

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = type === 'gem' ? 8 : type === 'starfish' ? 10 : 9;
    this.collected = false;
    this.collectedBy = null;
    this.bobPhase = Math.random() * TAU;
    this.glowPhase = Math.random() * TAU;
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    if (this.collected) return;
    const bob = Math.sin(t * 1.5 + this.bobPhase) * 2;
    const glow = 0.6 + Math.sin(t * 2 + this.glowPhase) * 0.4;

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    if (this.type === 'shell') {
      this.drawShell(ctx, glow);
    } else if (this.type === 'gem') {
      this.drawGem(ctx, glow);
    } else {
      this.drawStarfish(ctx, t, glow);
    }

    ctx.restore();
  }

  private drawShell(ctx: CanvasRenderingContext2D, glow: number): void {
    const s = this.size;
    // 글로우
    ctx.shadowColor = 'rgba(255,220,150,0.6)';
    ctx.shadowBlur = 6 * glow;
    // 껍데기 본체
    const g = ctx.createRadialGradient(-s * 0.2, -s * 0.3, 0, 0, 0, s);
    g.addColorStop(0, '#FFE0A0');
    g.addColorStop(0.5, '#F0B860');
    g.addColorStop(1, '#C07830');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.7, 0.3, 0, TAU);
    ctx.fill();
    // 줄무늬
    ctx.strokeStyle = 'rgba(160,80,20,0.3)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      const a = -0.8 + i * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s * 0.7);
      ctx.stroke();
    }
    // 입구
    ctx.fillStyle = 'rgba(100,50,10,0.4)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, s * 0.1, s * 0.3, s * 0.2, 0.5, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawGem(ctx: CanvasRenderingContext2D, glow: number): void {
    const s = this.size;
    ctx.shadowColor = 'rgba(100,200,255,0.8)';
    ctx.shadowBlur = 8 * glow;
    // 다이아몬드 형태
    ctx.fillStyle = `rgba(120,210,255,${0.7 + glow * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, -s * 0.1);
    ctx.lineTo(s * 0.5, s * 0.8);
    ctx.lineTo(-s * 0.5, s * 0.8);
    ctx.lineTo(-s * 0.7, -s * 0.1);
    ctx.closePath();
    ctx.fill();
    // 상단 면
    ctx.fillStyle = 'rgba(200,240,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, -s * 0.1);
    ctx.lineTo(0, s * 0.1);
    ctx.lineTo(-s * 0.7, -s * 0.1);
    ctx.closePath();
    ctx.fill();
    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.15, -s * 0.4, s * 0.15, s * 0.08, -0.5, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawStarfish(ctx: CanvasRenderingContext2D, t: number, glow: number): void {
    const s = this.size;
    ctx.shadowColor = 'rgba(255,120,80,0.6)';
    ctx.shadowBlur = 6 * glow;
    ctx.fillStyle = '#FF7050';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerA = (i / 5) * TAU - Math.PI / 2;
      const innerA = outerA + Math.PI / 5;
      if (i === 0) ctx.moveTo(Math.cos(outerA) * s, Math.sin(outerA) * s);
      else ctx.lineTo(Math.cos(outerA) * s, Math.sin(outerA) * s);
      ctx.lineTo(Math.cos(innerA) * s * 0.4, Math.sin(innerA) * s * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    // 질감 점
    ctx.fillStyle = 'rgba(255,180,150,0.6)';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.12, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
