import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 해마
const seahorse: SpeciesDef = {
  name: '해마',
  bodyW: 0.35, bodyH: 0.5, sizeRange: [24, 44],
  customDraw: true,
  defaultColors: { body: '#7EC8E3', fin: '#3B82C4', belly: '#B5E0F0', accent: '#5BA3D9' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    const sway = Math.sin(t * 1.5) * 0.04;

    ctx.save();
    ctx.rotate(sway);

    // ── 말린 꼬리 (짧고 통통하게) ──
    const tailCurl = Math.sin(t * 1.2) * 0.12;
    ctx.strokeStyle = p.body;
    ctx.lineWidth = sz * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, sz * 0.35);
    ctx.bezierCurveTo(
      -sz * 0.04, sz * 0.5,
      -sz * 0.18 + tailCurl * sz, sz * 0.6,
      -sz * 0.22 + tailCurl * sz, sz * 0.68
    );
    ctx.bezierCurveTo(
      -sz * 0.24 + tailCurl * sz, sz * 0.74,
      -sz * 0.18 + tailCurl * sz, sz * 0.77,
      -sz * 0.1 + tailCurl * sz, sz * 0.74
    );
    ctx.stroke();

    // 꼬리 그라데이션 덮기
    ctx.strokeStyle = p.accent + '88';
    ctx.lineWidth = sz * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, sz * 0.35);
    ctx.bezierCurveTo(
      -sz * 0.04, sz * 0.5,
      -sz * 0.18 + tailCurl * sz, sz * 0.6,
      -sz * 0.22 + tailCurl * sz, sz * 0.68
    );
    ctx.stroke();

    // ── 등 지느러미 (날개형) ──
    const finWave = Math.sin(t * 6) * 0.12;
    ctx.save();
    ctx.translate(-sz * 0.15, sz * 0.0);
    ctx.rotate(finWave);
    const fg = ctx.createLinearGradient(0, 0, -sz * 0.4, sz * 0.1);
    fg.addColorStop(0, p.fin);
    fg.addColorStop(1, p.fin + '20');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.12);
    ctx.bezierCurveTo(-sz * 0.25, -sz * 0.22, -sz * 0.4, -sz * 0.04, -sz * 0.35, sz * 0.1);
    ctx.bezierCurveTo(-sz * 0.25, sz * 0.15, -sz * 0.1, sz * 0.12, 0, sz * 0.12);
    ctx.closePath();
    ctx.fill();
    // 지느러미 줄무늬
    ctx.strokeStyle = p.fin + '66';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) {
      const frac = (i + 1) / 6;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.05 * frac, -sz * 0.12 + frac * sz * 0.04);
      ctx.lineTo(-sz * 0.35 * frac, -sz * 0.04 + frac * sz * 0.1);
      ctx.stroke();
    }
    ctx.restore();

    // ── 몸통 (통통한 S자) ──
    const bodyGrad = ctx.createLinearGradient(sz * 0.18, -sz * 0.25, -sz * 0.18, sz * 0.35);
    bodyGrad.addColorStop(0, p.body);
    bodyGrad.addColorStop(0.5, p.belly);
    bodyGrad.addColorStop(1, p.body);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    // 오른쪽 윤곽 (앞면) — 넓게
    ctx.moveTo(sz * 0.1, -sz * 0.28);
    ctx.bezierCurveTo(sz * 0.28, -sz * 0.2, sz * 0.32, -sz * 0.05, sz * 0.28, sz * 0.08);
    ctx.bezierCurveTo(sz * 0.24, sz * 0.2, sz * 0.18, sz * 0.3, sz * 0.08, sz * 0.38);
    // 왼쪽 윤곽 (등) — 넓게
    ctx.bezierCurveTo(-sz * 0.04, sz * 0.3, -sz * 0.16, sz * 0.18, -sz * 0.2, sz * 0.05);
    ctx.bezierCurveTo(-sz * 0.22, -sz * 0.08, -sz * 0.18, -sz * 0.2, -sz * 0.1, -sz * 0.28);
    ctx.closePath();
    ctx.fill();

    // ── 배 마디 (수평선) ──
    ctx.strokeStyle = p.accent + '55';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const yy = -sz * 0.18 + i * sz * 0.09;
      const widthFrac = Math.sin(((i + 0.5) / 6) * Math.PI);
      const xLeft = -sz * 0.12 - widthFrac * sz * 0.05;
      const xRight = sz * 0.2 + widthFrac * sz * 0.06;
      ctx.beginPath();
      ctx.moveTo(xLeft, yy);
      ctx.lineTo(xRight, yy);
      ctx.stroke();
    }

    // ── 머리 (둥글고 큼직하게) ──
    const headGrad = ctx.createRadialGradient(sz * 0.05, -sz * 0.35, 0, sz * 0.05, -sz * 0.35, sz * 0.22);
    headGrad.addColorStop(0, p.belly);
    headGrad.addColorStop(1, p.body);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(sz * 0.1, -sz * 0.28);
    ctx.bezierCurveTo(sz * 0.22, -sz * 0.32, sz * 0.25, -sz * 0.42, sz * 0.15, -sz * 0.5);
    ctx.bezierCurveTo(sz * 0.02, -sz * 0.55, -sz * 0.14, -sz * 0.5, -sz * 0.12, -sz * 0.38);
    ctx.bezierCurveTo(-sz * 0.11, -sz * 0.3, -sz * 0.1, -sz * 0.28, sz * 0.1, -sz * 0.28);
    ctx.closePath();
    ctx.fill();

    // ── 주둥이 (짧고 귀엽게) ──
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(sz * 0.18, -sz * 0.38);
    ctx.bezierCurveTo(sz * 0.3, -sz * 0.41, sz * 0.35, -sz * 0.38, sz * 0.34, -sz * 0.36);
    ctx.bezierCurveTo(sz * 0.33, -sz * 0.33, sz * 0.28, -sz * 0.32, sz * 0.18, -sz * 0.34);
    ctx.closePath();
    ctx.fill();

    // 주둥이 끝 (입)
    ctx.fillStyle = p.fin + 'AA';
    ctx.beginPath();
    ctx.arc(sz * 0.35, -sz * 0.37, sz * 0.02, 0, TAU);
    ctx.fill();

    // ── 왕관 (머리 위 돌기) ──
    ctx.fillStyle = p.fin;
    const spikes = 5;
    for (let i = 0; i < spikes; i++) {
      const frac = i / (spikes - 1);
      const bx = -sz * 0.1 + frac * sz * 0.22;
      const by = -sz * 0.5 - Math.sin(frac * Math.PI) * sz * 0.06;
      const spikeH = sz * (0.05 + Math.sin(frac * Math.PI) * 0.05);
      const wobble = Math.sin(t * 3 + i * 1.2) * sz * 0.01;
      ctx.beginPath();
      ctx.moveTo(bx - sz * 0.02, by);
      ctx.lineTo(bx + wobble, by - spikeH);
      ctx.lineTo(bx + sz * 0.02, by);
      ctx.closePath();
      ctx.fill();
    }

    // ── 눈 (큼직하게) ──
    const eyeX = sz * 0.1;
    const eyeY = -sz * 0.41;
    const eyeR = sz * 0.06;
    // 흰자
    ctx.fillStyle = '#FAFAFA';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, eyeR, eyeR * 0.95, 0, 0, TAU);
    ctx.fill();
    // 동공
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.15, eyeY, eyeR * 0.55, 0, TAU);
    ctx.fill();
    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.25, 0, TAU);
    ctx.fill();

    // ── 몸통 광택 ──
    ctx.globalAlpha *= 0.3;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(sz * 0.08, -sz * 0.08, sz * 0.08, sz * 0.14, 0.1, 0, TAU);
    ctx.fill();
    ctx.globalAlpha /= 0.3;

    // ── 몸 점 장식 ──
    ctx.globalAlpha *= 0.2;
    ctx.fillStyle = p.accent;
    for (let i = 0; i < 4; i++) {
      const dx = sz * 0.04 + (i % 2) * sz * 0.08;
      const dy = -sz * 0.2 + i * sz * 0.1;
      ctx.beginPath();
      ctx.arc(dx, dy, sz * 0.015, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha /= 0.2;

    ctx.restore();
  }
};

export default seahorse;
