import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 17: 상어
const shark: SpeciesDef = {
  name: '상어',
  bodyW: 0.65, bodyH: 0.22, sizeRange: [50, 80],
  customDraw: true,
  defaultColors: { body: '#8A9BA8', fin: '#6E8490', belly: '#E8EEF2', accent: '#2A3040' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    // 꼬리지느러미 (이형꼬리 - 위 갈래 더 큼)
    ctx.save(); ctx.translate(-sz * 0.72, 0); ctx.rotate(tw);
    ctx.fillStyle = p.fin;
    // 위 갈래
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.02);
    ctx.bezierCurveTo(-sz * 0.04, -sz * 0.08, -sz * 0.15, -sz * 0.22, -sz * 0.2, -sz * 0.28);
    ctx.bezierCurveTo(-sz * 0.18, -sz * 0.25, -sz * 0.12, -sz * 0.13, -sz * 0.04, -sz * 0.05);
    ctx.closePath(); ctx.fill();
    // 아래 갈래 (작음)
    ctx.beginPath();
    ctx.moveTo(0, sz * 0.02);
    ctx.bezierCurveTo(-sz * 0.03, sz * 0.06, -sz * 0.1, sz * 0.14, -sz * 0.12, sz * 0.17);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.15, -sz * 0.06, sz * 0.07, -sz * 0.02, sz * 0.03);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 두 번째 등지느러미 (뒤쪽 작은 삼각형)
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.38, -sz * 0.18);
    ctx.bezierCurveTo(-sz * 0.36, -sz * 0.26, -sz * 0.32, -sz * 0.27, -sz * 0.3, -sz * 0.24);
    ctx.bezierCurveTo(-sz * 0.28, -sz * 0.2, -sz * 0.3, -sz * 0.18, -sz * 0.33, -sz * 0.18);
    ctx.closePath(); ctx.fill();

    // 배지느러미 (작게)
    ctx.fillStyle = p.fin + 'BB';
    ctx.beginPath();
    ctx.moveTo(-sz * 0.08, sz * 0.18);
    ctx.lineTo(-sz * 0.18, sz * 0.3);
    ctx.lineTo(-sz * 0.25, sz * 0.18);
    ctx.closePath(); ctx.fill();

    // 가슴지느러미
    ctx.save(); ctx.translate(sz * 0.28, sz * 0.13);
    ctx.rotate(0.32 + fw * 0.1);
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.04, sz * 0.07, -sz * 0.18, sz * 0.2, -sz * 0.27, sz * 0.16);
    ctx.bezierCurveTo(-sz * 0.2, sz * 0.07, -sz * 0.07, sz * 0.02, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 몸통
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(sz * 0.66, sz * 0.03);
    ctx.bezierCurveTo(sz * 0.69, 0, sz * 0.69, -sz * 0.07, sz * 0.63, -sz * 0.13);
    ctx.bezierCurveTo(sz * 0.5, -sz * 0.2, sz * 0.28, -sz * 0.22, sz * 0.04, -sz * 0.2);
    ctx.bezierCurveTo(-sz * 0.22, -sz * 0.18, -sz * 0.52, -sz * 0.13, -sz * 0.7, -sz * 0.05);
    ctx.bezierCurveTo(-sz * 0.74, -sz * 0.02, -sz * 0.74, sz * 0.02, -sz * 0.7, sz * 0.04);
    ctx.bezierCurveTo(-sz * 0.52, sz * 0.1, -sz * 0.22, sz * 0.14, sz * 0.04, sz * 0.15);
    ctx.bezierCurveTo(sz * 0.28, sz * 0.17, sz * 0.5, sz * 0.15, sz * 0.63, sz * 0.1);
    ctx.bezierCurveTo(sz * 0.69, sz * 0.07, sz * 0.69, sz * 0.05, sz * 0.66, sz * 0.03);
    ctx.closePath(); ctx.fill();

    // 흰 배
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.moveTo(sz * 0.63, sz * 0.06);
    ctx.bezierCurveTo(sz * 0.5, sz * 0.13, sz * 0.28, sz * 0.16, sz * 0.04, sz * 0.15);
    ctx.bezierCurveTo(-sz * 0.22, sz * 0.13, -sz * 0.5, sz * 0.08, -sz * 0.66, sz * 0.03);
    ctx.bezierCurveTo(-sz * 0.5, -sz * 0.0, -sz * 0.22, -sz * 0.02, sz * 0.04, -sz * 0.0);
    ctx.bezierCurveTo(sz * 0.28, sz * 0.02, sz * 0.5, sz * 0.04, sz * 0.63, sz * 0.06);
    ctx.closePath(); ctx.fill();

    // 등지느러미 (크고 삼각형 - 몸통 위에 그려야 함)
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(sz * 0.06, -sz * 0.19);
    ctx.bezierCurveTo(sz * 0.1, -sz * 0.35, sz * 0.18, -sz * 0.42, sz * 0.22, -sz * 0.39);
    ctx.bezierCurveTo(sz * 0.27, -sz * 0.3, sz * 0.28, -sz * 0.2, sz * 0.27, -sz * 0.19);
    ctx.closePath(); ctx.fill();

    // 아가미선 (3줄)
    ctx.strokeStyle = p.accent + '55';
    ctx.lineWidth = sz * 0.013;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const gx = sz * (0.43 - i * 0.055);
      ctx.beginPath();
      ctx.moveTo(gx, -sz * 0.1);
      ctx.quadraticCurveTo(gx - sz * 0.015, sz * 0.01, gx, sz * 0.09);
      ctx.stroke();
    }

    // 눈
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(sz * 0.52, -sz * 0.06, sz * 0.026, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(sz * 0.514, -sz * 0.068, sz * 0.01, 0, TAU);
    ctx.fill();

    // 볼 홍조
    ctx.fillStyle = 'rgba(255,140,140,0.28)';
    ctx.beginPath();
    ctx.ellipse(sz * 0.46, sz * 0.04, sz * 0.045, sz * 0.028, 0, 0, TAU);
    ctx.fill();

    // 입 (아래로 처진 상어 입)
    ctx.strokeStyle = p.accent + '77';
    ctx.lineWidth = sz * 0.013;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sz * 0.67, sz * 0.01);
    ctx.quadraticCurveTo(sz * 0.66, sz * 0.05, sz * 0.62, sz * 0.055);
    ctx.stroke();
  }
};

export default shark;
