import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 2: 네온테트라
const neontetra: SpeciesDef = {
  name: '네온테트라',
  bodyW: 0.5, bodyH: 0.2, sizeRange: [12, 22],
  defaultColors: { body: '#1A3A5C', fin: '#90E0EF', belly: '#B0D4E8', accent: '#00B4D8' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.45, 0); ctx.rotate(tw);
    ctx.fillStyle = p.fin + 'AA';
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(-sz * 0.3, -sz * 0.2); ctx.lineTo(-sz * 0.15, 0); ctx.lineTo(-sz * 0.3, sz * 0.2);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createLinearGradient(0, -sz * 0.2, 0, sz * 0.2);
    bg.addColorStop(0, p.body); bg.addColorStop(0.5, p.accent); bg.addColorStop(1, p.body);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.5, sz * 0.18, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = sz * 0.07; ctx.globalAlpha *= 0.8;
    ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(-sz * 0.4, -sz * 0.02); ctx.lineTo(sz * 0.15, -sz * 0.02); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FF1744'; ctx.globalAlpha *= 0.9;
    ctx.beginPath(); ctx.ellipse(-sz * 0.15, sz * 0.02, sz * 0.25, sz * 0.1, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.72;
  }
};

export default neontetra;
