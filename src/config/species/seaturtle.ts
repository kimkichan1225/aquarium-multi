import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 15: 바다거북
const seaturtle: SpeciesDef = {
  name: '바다거북',
  bodyW: 0.4, bodyH: 0.35, sizeRange: [30, 55],
  customDraw: true,
  defaultColors: { body: '#8BC34A', fin: '#5D8A1E', belly: '#F5F0D0', accent: '#33491E' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    const flapAngle = Math.sin(t * 1.6) * 0.2;
    const outC = p.accent;

    // === 반대쪽 앞지느러미 (몸 뒤로 살짝 보임, 등딱지 위로) ===
    ctx.save(); ctx.translate(sz * 0.05, -sz * 0.22);
    ctx.rotate(-0.8 + flapAngle * 0.6);
    ctx.fillStyle = p.fin + 'CC';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(sz * 0.06, -sz * 0.05, sz * 0.15, -sz * 0.15, sz * 0.12, -sz * 0.22);
    ctx.bezierCurveTo(sz * 0.08, -sz * 0.22, sz * 0.02, -sz * 0.15, -sz * 0.02, -sz * 0.05);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // === 뒷지느러미 (뒤쪽에 작게, 몸 뒤에) ===
    ctx.save(); ctx.translate(-sz * 0.22, sz * 0.08);
    ctx.rotate(0.5 + flapAngle * 0.3);
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.05, sz * 0.03, -sz * 0.18, sz * 0.1, -sz * 0.24, sz * 0.06);
    ctx.bezierCurveTo(-sz * 0.2, sz * 0.01, -sz * 0.08, -sz * 0.02, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // === 꼬리 (짧은 삼각) ===
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.3, sz * 0.02);
    ctx.bezierCurveTo(-sz * 0.36, -sz * 0.02, -sz * 0.42, -sz * 0.01, -sz * 0.4, sz * 0.02);
    ctx.bezierCurveTo(-sz * 0.42, sz * 0.05, -sz * 0.36, sz * 0.06, -sz * 0.3, sz * 0.02);
    ctx.closePath(); ctx.fill();

    // === 몸통 (옆에서 본 타원형, 약간 납작) ===
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.35, sz * 0.2, 0, 0, TAU);
    ctx.fill();

    // === 배 (크림색, 아래쪽) ===
    ctx.save();
    ctx.beginPath();
    ctx.rect(-sz * 0.4, sz * 0.02, sz * 0.8, sz * 0.3);
    ctx.clip();
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.33, sz * 0.18, 0, 0, TAU);
    ctx.fill();
    // 배 가로줄
    ctx.strokeStyle = outC + '33';
    ctx.lineWidth = sz * 0.008;
    ctx.beginPath(); ctx.moveTo(sz * 0.22, sz * 0.08); ctx.lineTo(-sz * 0.18, sz * 0.08); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sz * 0.16, sz * 0.13); ctx.lineTo(-sz * 0.12, sz * 0.13); ctx.stroke();
    ctx.restore();

    // === 등딱지 (위쪽 볼록, 진한 올리브) ===
    ctx.save();
    ctx.beginPath();
    ctx.rect(-sz * 0.4, -sz * 0.35, sz * 0.75, sz * 0.37);
    ctx.clip();
    const shellGrad = ctx.createRadialGradient(sz * 0.0, -sz * 0.06, sz * 0.02, 0, -sz * 0.05, sz * 0.35);
    shellGrad.addColorStop(0, p.fin); shellGrad.addColorStop(0.6, p.fin);
    shellGrad.addColorStop(1, p.accent + 'CC');
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.moveTo(sz * 0.28, -sz * 0.01);
    ctx.bezierCurveTo(sz * 0.26, -sz * 0.14, sz * 0.14, -sz * 0.3, -sz * 0.02, -sz * 0.32);
    ctx.bezierCurveTo(-sz * 0.18, -sz * 0.3, -sz * 0.28, -sz * 0.16, -sz * 0.3, -sz * 0.01);
    ctx.lineTo(sz * 0.28, -sz * 0.01);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 등딱지 무늬
    ctx.strokeStyle = outC + '55';
    ctx.lineWidth = sz * 0.01;
    ctx.beginPath(); ctx.moveTo(sz * 0.0, -sz * 0.28); ctx.lineTo(-sz * 0.02, -sz * 0.02); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-sz * 0.08, -sz * 0.26);
    ctx.quadraticCurveTo(-sz * 0.2, -sz * 0.14, -sz * 0.26, -sz * 0.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sz * 0.08, -sz * 0.26);
    ctx.quadraticCurveTo(sz * 0.18, -sz * 0.14, sz * 0.24, -sz * 0.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-sz * 0.14, -sz * 0.22);
    ctx.quadraticCurveTo(-sz * 0.02, -sz * 0.17, sz * 0.1, -sz * 0.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-sz * 0.22, -sz * 0.1);
    ctx.quadraticCurveTo(-sz * 0.02, -sz * 0.06, sz * 0.2, -sz * 0.1); ctx.stroke();

    // === 머리 (둥글고 귀여운) ===
    const headGrad = ctx.createRadialGradient(sz * 0.42, 0, sz * 0.02, sz * 0.4, 0, sz * 0.18);
    headGrad.addColorStop(0, p.body); headGrad.addColorStop(1, p.fin + 'DD');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(sz * 0.32, -sz * 0.1);
    ctx.bezierCurveTo(sz * 0.38, -sz * 0.14, sz * 0.5, -sz * 0.12, sz * 0.55, -sz * 0.05);
    ctx.bezierCurveTo(sz * 0.58, 0, sz * 0.58, sz * 0.02, sz * 0.55, sz * 0.06);
    ctx.bezierCurveTo(sz * 0.5, sz * 0.12, sz * 0.38, sz * 0.14, sz * 0.32, sz * 0.1);
    ctx.closePath(); ctx.fill();

    // 눈
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sz * 0.46, -sz * 0.02, sz * 0.04, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(sz * 0.45, -sz * 0.035, sz * 0.015, 0, TAU);
    ctx.fill();

    // 볼터치
    ctx.fillStyle = '#FF9999';
    ctx.globalAlpha *= 0.3;
    ctx.beginPath();
    ctx.ellipse(sz * 0.48, sz * 0.04, sz * 0.03, sz * 0.018, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha /= 0.3;

    // 입 (미소 선만 유지)
    ctx.strokeStyle = outC + '88';
    ctx.lineWidth = sz * 0.012;
    ctx.beginPath();
    ctx.arc(sz * 0.52, sz * 0.01, sz * 0.025, 0.2, 1.0);
    ctx.stroke();

    // === 이쪽 앞지느러미 (몸 앞에, 뒤-아래로 뻗음) ===
    ctx.save(); ctx.translate(sz * 0.05, sz * 0.04);
    ctx.rotate(0.3 - flapAngle);
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.08, sz * 0.06, -sz * 0.22, sz * 0.2, -sz * 0.32, sz * 0.32);
    ctx.bezierCurveTo(-sz * 0.34, sz * 0.35, -sz * 0.28, sz * 0.34, -sz * 0.2, sz * 0.28);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.18, -sz * 0.02, sz * 0.06, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.belly + '99';
    ctx.beginPath(); ctx.arc(-sz * 0.14, sz * 0.16, sz * 0.012, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-sz * 0.22, sz * 0.24, sz * 0.01, 0, TAU); ctx.fill();
    ctx.restore();

    // === 이쪽 뒷다리 (몸 앞에, 작게 뒤로 뻗음) ===
    ctx.save(); ctx.translate(-sz * 0.18, sz * 0.12);
    ctx.rotate(0.4 + flapAngle * 0.3);
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.04, sz * 0.03, -sz * 0.14, sz * 0.08, -sz * 0.18, sz * 0.05);
    ctx.bezierCurveTo(-sz * 0.15, sz * 0.01, -sz * 0.06, -sz * 0.01, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
};

export default seaturtle;
