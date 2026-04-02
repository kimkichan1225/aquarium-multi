import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 5: 블루탕
const bluetang: SpeciesDef = {
  name: '블루탕',
  bodyW: 0.5, bodyH: 0.35, sizeRange: [24, 42],
  defaultColors: { body: '#0077B6', fin: '#023E8A', belly: '#90E0EF', accent: '#FFD700' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.48, 0); ctx.rotate(tw);
    ctx.fillStyle = p.accent;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.15, -sz * 0.22, -sz * 0.35, -sz * 0.25, -sz * 0.4, -sz * 0.15);
    ctx.bezierCurveTo(-sz * 0.3, 0, -sz * 0.35, sz * 0.25, -sz * 0.15, sz * 0.22);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(sz * 0.08, -sz * 0.05, sz * 0.05, 0, 0, sz * 0.5);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.35, '#00B4D8'); bg.addColorStop(0.7, p.body); bg.addColorStop(1, p.fin);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.5, sz * 0.35, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0A1628'; ctx.lineWidth = sz * 0.04; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sz * 0.15, -sz * 0.25);
    ctx.bezierCurveTo(0, -sz * 0.1, -sz * 0.15, sz * 0.05, -sz * 0.25, sz * 0.15);
    ctx.bezierCurveTo(-sz * 0.3, sz * 0.25, -sz * 0.15, sz * 0.3, 0, sz * 0.2);
    ctx.stroke();
    ctx.fillStyle = p.body + 'CC';
    ctx.beginPath(); ctx.moveTo(-sz * 0.25, -sz * 0.32);
    ctx.quadraticCurveTo(0, -sz * 0.5, sz * 0.2, -sz * 0.32);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz * 0.2, sz * 0.32);
    ctx.quadraticCurveTo(0, sz * 0.48, sz * 0.15, sz * 0.32);
    ctx.closePath(); ctx.fill();
  }
};

export default bluetang;
