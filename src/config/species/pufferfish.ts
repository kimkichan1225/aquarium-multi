import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 10: 복어
const pufferfish: SpeciesDef = {
  name: '복어',
  bodyW: 0.4, bodyH: 0.4, sizeRange: [18, 32],
  defaultColors: { body: '#B8D4A3', fin: '#8FBC8F', belly: '#FFFDE7', accent: '#5D4037' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.35, 0); ctx.rotate(tw * 0.5);
    ctx.fillStyle = p.fin;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(-sz * 0.2, -sz * 0.1); ctx.lineTo(-sz * 0.18, 0); ctx.lineTo(-sz * 0.2, sz * 0.1);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(0, -sz * 0.05, sz * 0.05, 0, 0, sz * 0.38);
    bg.addColorStop(0, p.belly); bg.addColorStop(0.5, p.body); bg.addColorStop(1, p.body + 'CC');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, 0, sz * 0.38, 0, TAU); ctx.fill();
    ctx.fillStyle = p.belly + 'CC';
    ctx.beginPath(); ctx.ellipse(0, sz * 0.1, sz * 0.25, sz * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = p.accent + '44';
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8, r = sz * 0.22;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r - sz * 0.03, sz * 0.03, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.translate(sz * 0.15, sz * 0.15); ctx.rotate(fw);
    ctx.fillStyle = p.fin + 'AA';
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.1, sz * 0.05, 0.5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = p.fin + 'BB';
    ctx.beginPath(); ctx.moveTo(-sz * 0.08, -sz * 0.35);
    ctx.quadraticCurveTo(0, -sz * 0.5, sz * 0.08, -sz * 0.35);
    ctx.closePath(); ctx.fill();
  }
};

export default pufferfish;
