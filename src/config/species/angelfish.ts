import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 1: 엔젤피시
const angelfish: SpeciesDef = {
  name: '엔젤피시',
  bodyW: 0.4, bodyH: 0.55, sizeRange: [30, 50],
  defaultColors: { body: '#E8D5B7', fin: '#C9A96E', belly: '#F5ECD7', accent: '#2C2C54' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.35, 0); ctx.rotate(tw * 0.7);
    ctx.fillStyle = p.fin + 'AA';
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.15, -sz * 0.2, -sz * 0.4, -sz * 0.4, -sz * 0.5, -sz * 0.15);
    ctx.bezierCurveTo(-sz * 0.35, 0, -sz * 0.4, sz * 0.4, -sz * 0.15, sz * 0.2);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(0, 0, sz * 0.05, 0, 0, sz * 0.45);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.5, p.body); bg.addColorStop(1, p.body + 'CC');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(sz * 0.38, 0);
    ctx.bezierCurveTo(sz * 0.3, -sz * 0.25, sz * 0.1, -sz * 0.45, -sz * 0.05, -sz * 0.48);
    ctx.bezierCurveTo(-sz * 0.2, -sz * 0.35, -sz * 0.35, -sz * 0.15, -sz * 0.38, 0);
    ctx.bezierCurveTo(-sz * 0.35, sz * 0.15, -sz * 0.2, sz * 0.35, -sz * 0.05, sz * 0.48);
    ctx.bezierCurveTo(sz * 0.1, sz * 0.45, sz * 0.3, sz * 0.25, sz * 0.38, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5; ctx.globalAlpha *= 0.4;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath(); ctx.moveTo(i * sz * 0.12, -sz * 0.4); ctx.lineTo(i * sz * 0.12, sz * 0.4); ctx.stroke();
    }
    ctx.globalAlpha /= 0.4;
    ctx.fillStyle = p.fin + '88';
    ctx.beginPath(); ctx.moveTo(-sz * 0.1, -sz * 0.45);
    ctx.bezierCurveTo(sz * 0.05, -sz * 0.85, sz * 0.2, -sz * 0.7, sz * 0.15, -sz * 0.35);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz * 0.1, sz * 0.45);
    ctx.bezierCurveTo(sz * 0.05, sz * 0.85, sz * 0.2, sz * 0.7, sz * 0.15, sz * 0.35);
    ctx.closePath(); ctx.fill();
  }
};

export default angelfish;
