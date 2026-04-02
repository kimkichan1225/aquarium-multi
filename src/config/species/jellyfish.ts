import type { SpeciesDef } from '@/types';
import { TAU, clamp } from '@/utils/math';
import { hexToRgb } from '@/utils/dom';

// 12: 해파리
const jellyfish: SpeciesDef = {
  name: '해파리',
  bodyW: 0.4, bodyH: 0.5, sizeRange: [20, 50],
  isJellyfish: true,
  defaultColors: { body: '#B48CFF', fin: '#C8A0FF', belly: '#D4B0FF', accent: '#E8D0FF' },
  jellyPalettes: [
    { body: '#B48CFF', fin: '#C8A0FF', belly: '#D4B0FF', accent: '#E8D0FF' },
    { body: '#FF8CB4', fin: '#FFA0C8', belly: '#FFB0D4', accent: '#FFD0E8' },
    { body: '#8CDCFF', fin: '#A0E6FF', belly: '#B0ECFF', accent: '#D0F4FF' },
    { body: '#8CFFC8', fin: '#A0FFDC', belly: '#B0FFE4', accent: '#D0FFF0' },
    { body: '#FFDC8C', fin: '#FFE6A0', belly: '#FFECB0', accent: '#FFF4D0' },
  ],
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    // 해파리 고유 색상 (반투명 rgba 변환)
    const bodyRgb = hexToRgb(p.body);
    const finRgb = hexToRgb(p.fin);
    const bellyRgb = hexToRgb(p.belly);

    const pulse = Math.sin(t * 2);
    const squeeze = 1 + pulse * 0.15;
    const stretch = 1 - pulse * 0.1;
    const bellBottom = sz * 0.15 * stretch;

    // 글로우
    const glowR = sz * 1.5;
    const gg = ctx.createRadialGradient(0, -sz * 0.15, 0, 0, -sz * 0.1, glowR);
    gg.addColorStop(0, `rgba(${bodyRgb},0.15)`);
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(0, -sz * 0.1, glowR, 0, TAU); ctx.fill();

    // 촉수들
    const tentacles = 10;
    for (let i = 0; i < tentacles; i++) {
      const spread = sz * 0.38 * squeeze;
      const tx = (i - (tentacles - 1) / 2) / ((tentacles - 1) / 2) * spread * 0.8;
      const len = sz * 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, bellBottom);
      for (let j = 1; j <= 8; j++) {
        const frac = j / 8;
        const wave = Math.sin(t * (1 + i * 0.2) + i * 0.8 + frac * 4) * sz * 0.12 * frac * (0.5 + i * 0.1);
        ctx.lineTo(tx + wave, bellBottom + frac * len);
      }
      ctx.strokeStyle = `rgba(${bodyRgb},0.2)`;
      ctx.lineWidth = clamp(sz * 0.025, 0.5, 2.5);
      ctx.stroke();
    }

    // 메인 촉수 4개
    for (let i = 0; i < 4; i++) {
      const spread = sz * 0.3 * squeeze;
      const tx = (i - 1.5) / 1.5 * spread * 0.6;
      const len = sz * 2.5 * 1.4;
      ctx.beginPath();
      ctx.moveTo(tx, bellBottom);
      for (let j = 1; j <= 12; j++) {
        const frac = j / 12;
        const wave = Math.sin(t * 1.2 + i * 2 + frac * 5) * sz * 0.2 * frac;
        ctx.lineTo(tx + wave, bellBottom + frac * len);
      }
      ctx.strokeStyle = `rgba(${bodyRgb},0.2)`;
      ctx.lineWidth = clamp(sz * 0.04, 0.8, 3.5);
      ctx.stroke();
    }

    // 벨 (우산)
    ctx.save();
    ctx.scale(squeeze, stretch);
    const bellGrad = ctx.createRadialGradient(0, -sz * 0.15, 0, 0, -sz * 0.05, sz * 0.5);
    bellGrad.addColorStop(0, `rgba(${bellyRgb},0.5)`);
    bellGrad.addColorStop(0.6, `rgba(${bodyRgb},0.3)`);
    bellGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.4, sz * 0.15);
    ctx.bezierCurveTo(-sz * 0.45, -sz * 0.15, -sz * 0.3, -sz * 0.5, 0, -sz * 0.55);
    ctx.bezierCurveTo(sz * 0.3, -sz * 0.5, sz * 0.45, -sz * 0.15, sz * 0.4, sz * 0.15);
    for (let i = 0; i < 8; i++) {
      const frac = 1 - i / 8;
      const fx = sz * 0.4 * (2 * frac - 1);
      const fy = sz * 0.15 + Math.sin(t * 3 + i * 1.2) * sz * 0.025;
      ctx.quadraticCurveTo(fx + sz * 0.05, fy + sz * 0.04, fx, fy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 내부 기관
    ctx.fillStyle = `rgba(${bellyRgb},0.5)`;
    ctx.globalAlpha *= 0.6;
    ctx.beginPath();
    ctx.ellipse(0, -sz * 0.18, sz * 0.15, sz * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(${bellyRgb},0.5)`;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4 + t * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.18);
      ctx.quadraticCurveTo(Math.cos(a) * sz * 0.12, -sz * 0.05, Math.cos(a + 0.5) * sz * 0.08, sz * 0.05);
      ctx.stroke();
    }
    ctx.restore();

    // 하이라이트
    ctx.globalAlpha *= 0.6;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-sz * 0.1, -sz * 0.35, sz * 0.08, sz * 0.06, -0.4, 0, TAU);
    ctx.fill();
  }
};

export default jellyfish;
