import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 8: 만다린피시
const mandarinfish: SpeciesDef = {
  name: '만다린피시',
  bodyW: 0.45, bodyH: 0.35, sizeRange: [16, 28],
  defaultColors: { body: '#FF6700', fin: '#2EC4B6', belly: '#FFE66D', accent: '#3A86FF' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.4, 0); ctx.rotate(tw);
    ctx.fillStyle = p.fin;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.15, -sz * 0.2, -sz * 0.35, -sz * 0.25, -sz * 0.3, -sz * 0.05);
    ctx.bezierCurveTo(-sz * 0.35, sz * 0.25, -sz * 0.15, sz * 0.2, 0, 0);
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(fw * 0.3);
    ctx.fillStyle = p.accent + 'BB';
    ctx.beginPath(); ctx.moveTo(-sz * 0.15, -sz * 0.3);
    ctx.bezierCurveTo(-sz * 0.05, -sz * 0.65, sz * 0.2, -sz * 0.6, sz * 0.15, -sz * 0.28);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.body + '88';
    ctx.beginPath(); ctx.arc(0, -sz * 0.45, sz * 0.04, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(sz * 0.08, -sz * 0.42, sz * 0.03, 0, TAU); ctx.fill();
    ctx.restore();
    const bg = ctx.createRadialGradient(0, 0, sz * 0.05, 0, 0, sz * 0.42);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.4, p.body); bg.addColorStop(1, p.body + 'BB');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.42, sz * 0.32, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha *= 0.4;
    ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2 + t * 0.5;
      ctx.beginPath(); ctx.arc(Math.cos(a) * sz * 0.15, Math.sin(a) * sz * 0.1, sz * 0.08 + i * sz * 0.02, 0, Math.PI); ctx.stroke();
    }
    ctx.fillStyle = p.fin; ctx.lineWidth = 0;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(Math.sin(t * 0.7 + i * 1.8) * sz * 0.12, Math.cos(t * 0.5 + i * 2.1) * sz * 0.08, sz * 0.025, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha /= 0.4;
  }
};

export default mandarinfish;
