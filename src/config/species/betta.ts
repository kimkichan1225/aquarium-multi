import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 3: 베타피시
const betta: SpeciesDef = {
  name: '베타피시',
  bodyW: 0.4, bodyH: 0.3, sizeRange: [28, 48],
  defaultColors: { body: '#7B2D8E', fin: '#C77DFF', belly: '#E0AAFF', accent: '#F3D5FF' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.35, 0);
    for (let i = 0; i < 5; i++) {
      const angle = tw + Math.sin(t * 2 + i * 0.8) * 0.25;
      ctx.save(); ctx.rotate(angle + (i - 2) * 0.15);
      const tg = ctx.createLinearGradient(0, 0, -sz * 0.8, 0);
      tg.addColorStop(0, p.fin); tg.addColorStop(1, p.fin + '10');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.moveTo(0, (i - 2) * sz * 0.06);
      ctx.bezierCurveTo(-sz * 0.3, -sz * 0.15 + i * sz * 0.04, -sz * 0.6, -sz * 0.2 + i * sz * 0.08, -sz * 0.8, (i - 2) * sz * 0.12);
      ctx.bezierCurveTo(-sz * 0.6, i * sz * 0.06, -sz * 0.3, (i - 1) * sz * 0.06, 0, (i - 2) * sz * 0.06 + sz * 0.04);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.save(); ctx.rotate(fw * 0.4);
    const dg = ctx.createLinearGradient(0, -sz * 0.3, 0, -sz * 0.75);
    dg.addColorStop(0, p.fin); dg.addColorStop(1, p.fin + '20');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.moveTo(-sz * 0.25, -sz * 0.25);
    ctx.bezierCurveTo(-sz * 0.1, -sz * 0.7, sz * 0.2, -sz * 0.75, sz * 0.3, -sz * 0.2);
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(0, sz * 0.2); ctx.rotate(fw * 0.5);
    ctx.fillStyle = p.fin + '88';
    ctx.beginPath(); ctx.moveTo(-sz * 0.15, 0);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.45, sz * 0.15, sz * 0.4, sz * 0.1, 0);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(sz * 0.05, -sz * 0.05, sz * 0.03, 0, 0, sz * 0.4);
    bg.addColorStop(0, p.accent); bg.addColorStop(0.4, p.body); bg.addColorStop(1, p.body + 'DD');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.4, sz * 0.28, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha *= 0.15;
    for (let i = 0; i < 8; i++) {
      const sx = -sz * 0.2 + i * sz * 0.07, sy = -sz * 0.1 + (i % 3) * sz * 0.08;
      ctx.fillStyle = p.accent;
      ctx.beginPath(); ctx.arc(sx, sy, sz * 0.035, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha /= 0.15;
  }
};

export default betta;
