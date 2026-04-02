import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 0: 클라운피시
const clownfish: SpeciesDef = {
  name: '클라운피시',
  bodyW: 0.55, bodyH: 0.35, sizeRange: [22, 38],
  defaultColors: { body: '#FF6B35', fin: '#FF9F1C', belly: '#FFE0B2', accent: '#FFF' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.5, 0); ctx.rotate(tw);
    const tg = ctx.createRadialGradient(0, 0, 0, -sz * 0.2, 0, sz * 0.4);
    tg.addColorStop(0, p.fin); tg.addColorStop(1, p.body + '40');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.2, -sz * 0.35, -sz * 0.5, -sz * 0.3, -sz * 0.45, -sz * 0.1);
    ctx.bezierCurveTo(-sz * 0.55, 0, -sz * 0.5, sz * 0.3, -sz * 0.2, sz * 0.35);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(sz * 0.08, -sz * 0.05, sz * 0.05, 0, 0, sz * 0.55);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.35, p.body); bg.addColorStop(1, p.body + 'BB');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.55, sz * 0.35, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#FFF'; ctx.lineWidth = sz * 0.045; ctx.globalAlpha *= 0.85;
    for (let i = -1; i <= 1; i++) {
      const sx = i * sz * 0.24;
      ctx.beginPath(); ctx.moveTo(sx, -sz * 0.34); ctx.lineTo(sx, sz * 0.34); ctx.stroke();
    }
    ctx.globalAlpha /= 0.85;
    ctx.fillStyle = p.fin + 'CC';
    ctx.beginPath(); ctx.moveTo(-sz * 0.2, -sz * 0.3);
    ctx.quadraticCurveTo(0, -sz * 0.55, sz * 0.15, -sz * 0.3);
    ctx.closePath(); ctx.fill();
  }
};

export default clownfish;
