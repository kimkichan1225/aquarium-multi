import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 4: 금붕어
const goldfish: SpeciesDef = {
  name: '금붕어',
  bodyW: 0.5, bodyH: 0.4, sizeRange: [25, 45],
  defaultColors: { body: '#FF8C42', fin: '#FFB347', belly: '#FFEAA7', accent: '#FFD700' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.45, 0);
    for (let s = -1; s <= 1; s += 2) {
      ctx.save(); ctx.rotate(tw * 0.8 + s * 0.25);
      const tg = ctx.createLinearGradient(0, 0, -sz * 0.5, 0);
      tg.addColorStop(0, p.fin); tg.addColorStop(1, p.fin + '30');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.moveTo(0, s * sz * 0.03);
      ctx.bezierCurveTo(-sz * 0.2, s * sz * 0.05, -sz * 0.4, s * sz * 0.3, -sz * 0.5, s * sz * 0.35);
      ctx.bezierCurveTo(-sz * 0.35, s * sz * 0.15, -sz * 0.2, s * sz * 0.02, 0, 0);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = p.fin + 'BB';
    ctx.beginPath(); ctx.moveTo(-sz * 0.15, -sz * 0.35);
    ctx.bezierCurveTo(0, -sz * 0.6, sz * 0.15, -sz * 0.55, sz * 0.2, -sz * 0.3);
    ctx.closePath(); ctx.fill();
    const bg = ctx.createRadialGradient(sz * 0.05, -sz * 0.08, sz * 0.05, 0, 0, sz * 0.48);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.4, p.body); bg.addColorStop(1, p.body + 'CC');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.48, sz * 0.38, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha *= 0.2;
    ctx.fillStyle = p.accent;
    ctx.beginPath(); ctx.ellipse(sz * 0.1, -sz * 0.12, sz * 0.2, sz * 0.12, -0.3, 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.2;
    ctx.save(); ctx.translate(sz * 0.05, sz * 0.3); ctx.rotate(fw);
    ctx.fillStyle = p.fin + '88';
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.12, sz * 0.08, 0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
};

export default goldfish;
