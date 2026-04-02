import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 9: 무어리시아이돌
const moorishidol: SpeciesDef = {
  name: '무어리시아이돌',
  bodyW: 0.4, bodyH: 0.45, sizeRange: [26, 42],
  defaultColors: { body: '#FFD700', fin: '#FFFFFF', belly: '#FFF8DC', accent: '#1A1A2E' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    ctx.save(); ctx.translate(-sz * 0.35, 0); ctx.rotate(tw * 0.5);
    ctx.fillStyle = p.accent;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-sz * 0.15, -sz * 0.15, -sz * 0.25, -sz * 0.08);
    ctx.quadraticCurveTo(-sz * 0.2, 0, -sz * 0.25, sz * 0.08);
    ctx.quadraticCurveTo(-sz * 0.15, sz * 0.15, 0, 0);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const bg = ctx.createLinearGradient(-sz * 0.3, 0, sz * 0.3, 0);
    bg.addColorStop(0, p.accent); bg.addColorStop(0.2, p.body); bg.addColorStop(0.5, p.fin);
    bg.addColorStop(0.7, p.body); bg.addColorStop(1, p.accent);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.38, sz * 0.42, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = p.body;
    ctx.beginPath(); ctx.moveTo(sz * 0.35, 0);
    ctx.quadraticCurveTo(sz * 0.55, -sz * 0.04, sz * 0.6, 0);
    ctx.quadraticCurveTo(sz * 0.55, sz * 0.04, sz * 0.35, 0); ctx.fill();
    ctx.save();
    const ribbonWag = Math.sin(t * 1.5) * 0.15;
    ctx.strokeStyle = p.fin; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -sz * 0.4);
    ctx.bezierCurveTo(sz * 0.1, -sz * 0.8 + ribbonWag * sz, sz * 0.3 + Math.sin(t * 2) * sz * 0.1, -sz * 1.1, sz * 0.5 + Math.sin(t * 1.8) * sz * 0.15, -sz * 1.0 + ribbonWag * sz * 0.5);
    ctx.stroke(); ctx.restore();
    ctx.fillStyle = p.accent;
    ctx.fillRect(-sz * 0.02, -sz * 0.42, sz * 0.04, sz * 0.84);
    ctx.fillRect(sz * 0.18, -sz * 0.38, sz * 0.04, sz * 0.76);
  }
};

export default moorishidol;
