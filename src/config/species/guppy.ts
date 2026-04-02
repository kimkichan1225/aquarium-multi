import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 6: 구피
const guppy: SpeciesDef = {
  name: '구피',
  bodyW: 0.35, bodyH: 0.2, sizeRange: [14, 26],
  defaultColors: { body: '#A0A0A0', fin: '#FF6B6B', belly: '#D0D0D0', accent: '#FF8E8E' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.3, 0);
    for (let i = 0; i < 7; i++) {
      const angle = tw + (i - 3) * 0.18 + Math.sin(t * 3 + i) * 0.08;
      ctx.save(); ctx.rotate(angle);
      const a = 1 - Math.abs(i - 3) / 4;
      const tg = ctx.createLinearGradient(0, 0, -sz * 0.65, 0);
      tg.addColorStop(0, p.fin); tg.addColorStop(0.5, p.accent + 'CC'); tg.addColorStop(1, p.fin + '20');
      ctx.fillStyle = tg; ctx.globalAlpha *= a * 0.7;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-sz * 0.2, -sz * 0.08, -sz * 0.4, -sz * 0.12, -sz * 0.6, (i - 3) * sz * 0.06);
      ctx.bezierCurveTo(-sz * 0.4, sz * 0.12, -sz * 0.2, sz * 0.08, 0, sz * 0.02);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha /= (a * 0.7 || 1); ctx.restore();
    }
    ctx.restore();
    const bg = ctx.createRadialGradient(0, 0, sz * 0.03, 0, 0, sz * 0.3);
    bg.addColorStop(0, p.belly); bg.addColorStop(1, p.body);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.32, sz * 0.18, 0, 0, TAU); ctx.fill();
  }
};

export default guppy;
