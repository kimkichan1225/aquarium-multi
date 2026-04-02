import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 7: 디스커스
const discus: SpeciesDef = {
  name: '디스커스',
  bodyW: 0.45, bodyH: 0.45, sizeRange: [30, 50],
  defaultColors: { body: '#E63946', fin: '#F4845F', belly: '#FFB4A2', accent: '#F7B267' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.4, 0); ctx.rotate(tw * 0.6);
    ctx.fillStyle = p.fin + 'AA';
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-sz * 0.15, -sz * 0.15, -sz * 0.25, -sz * 0.08);
    ctx.quadraticCurveTo(-sz * 0.2, 0, -sz * 0.25, sz * 0.08);
    ctx.quadraticCurveTo(-sz * 0.15, sz * 0.15, 0, 0);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(0, 0, sz * 0.05, 0, 0, sz * 0.45);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.4, p.body); bg.addColorStop(1, p.fin + 'CC');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, 0, sz * 0.43, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.accent + '60'; ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      const ox = i * sz * 0.1;
      ctx.moveTo(ox, -sz * 0.35);
      for (let y = -sz * 0.35; y < sz * 0.35; y += sz * 0.05) {
        ctx.lineTo(ox + Math.sin(y * 0.15 + t) * sz * 0.02, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = p.fin + '99';
    ctx.beginPath(); ctx.moveTo(-sz * 0.3, -sz * 0.38);
    ctx.bezierCurveTo(-sz * 0.1, -sz * 0.55, sz * 0.15, -sz * 0.55, sz * 0.25, -sz * 0.38);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz * 0.3, sz * 0.38);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.55, sz * 0.15, sz * 0.55, sz * 0.25, sz * 0.38);
    ctx.closePath(); ctx.fill();
  }
};

export default discus;
