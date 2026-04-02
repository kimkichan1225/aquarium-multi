import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 11: 라이언피시
const lionfish: SpeciesDef = {
  name: '라이언피시',
  bodyW: 0.45, bodyH: 0.3, sizeRange: [28, 45],
  defaultColors: { body: '#8B0000', fin: '#CD5C5C', belly: '#FFDAB9', accent: '#FFFFFF' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.42, 0); ctx.rotate(tw);
    ctx.fillStyle = p.fin + 'BB';
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(-sz * 0.25, -sz * 0.2); ctx.lineTo(-sz * 0.2, 0); ctx.lineTo(-sz * 0.25, sz * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = p.accent + '88'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * sz * 0.03); ctx.lineTo(-sz * 0.22, i * sz * 0.06); ctx.stroke();
    }
    ctx.restore();
    const bg = ctx.createRadialGradient(0, 0, sz * 0.05, 0, 0, sz * 0.4);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.5, p.body); bg.addColorStop(1, p.body + 'DD');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.42, sz * 0.28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.accent + '88'; ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * sz * 0.1, -sz * 0.26); ctx.lineTo(i * sz * 0.1, sz * 0.26); ctx.stroke();
    }
    ctx.save(); ctx.translate(sz * 0.05, sz * 0.1);
    for (let i = 0; i < 7; i++) {
      const angle = fw * 0.6 + 0.3 + i * 0.18;
      ctx.save(); ctx.rotate(angle);
      ctx.strokeStyle = p.body; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, sz * 0.55); ctx.stroke();
      if (i < 6) {
        ctx.fillStyle = p.fin + '44';
        ctx.beginPath(); ctx.moveTo(0, sz * 0.1); ctx.lineTo(0, sz * 0.5); ctx.lineTo(sz * 0.05, sz * 0.48);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const sx = -sz * 0.3 + i * sz * 0.08;
      ctx.strokeStyle = p.body + 'CC'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, -sz * 0.25);
      ctx.lineTo(sx + Math.sin(t + i) * sz * 0.02, -sz * 0.25 - sz * 0.3 - Math.sin(t * 1.5 + i) * sz * 0.03);
      ctx.stroke();
    }
  }
};

export default lionfish;
