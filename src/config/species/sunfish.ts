import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 18: 개복치 (Mola mola)
const sunfish: SpeciesDef = {
  name: '개복치',
  bodyW: 0.42, bodyH: 0.65, sizeRange: [40, 68],
  customDraw: true,
  defaultColors: { body: '#627D8B', fin: '#4F6878', belly: '#B8D4E0', accent: '#1E2E3A' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    // 꼬리 대신 clavus (뒤쪽 둥근 가장자리 - 물결 모양)
    ctx.save(); ctx.translate(-sz * 0.32, 0); ctx.rotate(tw * 0.3);
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.22);
    ctx.bezierCurveTo(-sz * 0.06, -sz * 0.15, -sz * 0.1, -sz * 0.08, -sz * 0.1, 0);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.08, -sz * 0.06, sz * 0.15, 0, sz * 0.22);
    ctx.bezierCurveTo(sz * 0.02, sz * 0.14, sz * 0.02, sz * 0.07, sz * 0.01, 0);
    ctx.bezierCurveTo(sz * 0.02, -sz * 0.07, sz * 0.02, -sz * 0.14, 0, -sz * 0.22);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 등지느러미 (위로 길게 뻗음)
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.06, -sz * 0.36);
    ctx.bezierCurveTo(-sz * 0.1, -sz * 0.48, -sz * 0.07, -sz * 0.62, 0, -sz * 0.66);
    ctx.bezierCurveTo(sz * 0.07, -sz * 0.62, sz * 0.1, -sz * 0.48, sz * 0.06, -sz * 0.36);
    ctx.closePath(); ctx.fill();

    // 배지느러미 (아래로 길게 뻗음)
    ctx.beginPath();
    ctx.moveTo(-sz * 0.06, sz * 0.36);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.48, -sz * 0.07, sz * 0.62, 0, sz * 0.66);
    ctx.bezierCurveTo(sz * 0.07, sz * 0.62, sz * 0.1, sz * 0.48, sz * 0.06, sz * 0.36);
    ctx.closePath(); ctx.fill();

    // 몸통 (거의 원형)
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.ellipse(sz * 0.07, 0, sz * 0.4, sz * 0.36, 0, 0, TAU);
    ctx.fill();

    // 밝은 배 (오른쪽 아래)
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.ellipse(sz * 0.12, sz * 0.06, sz * 0.24, sz * 0.26, 0.18, 0, TAU);
    ctx.fill();

    // 아가미 어두운 부분
    ctx.fillStyle = p.fin + '99';
    ctx.beginPath();
    ctx.ellipse(sz * 0.28, -sz * 0.02, sz * 0.09, sz * 0.14, 0, 0, TAU);
    ctx.fill();

    // 눈 (크고 선명하게)
    ctx.fillStyle = '#1A2A35';
    ctx.beginPath();
    ctx.arc(sz * 0.3, -sz * 0.1, sz * 0.042, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sz * 0.31, -sz * 0.115, sz * 0.02, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1A2A35';
    ctx.beginPath();
    ctx.arc(sz * 0.315, -sz * 0.118, sz * 0.013, 0, TAU);
    ctx.fill();

    // 입 (작고 둥글게, 앞쪽)
    ctx.fillStyle = p.accent + 'BB';
    ctx.beginPath();
    ctx.arc(sz * 0.46, sz * 0.06, sz * 0.022, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.belly + 'AA';
    ctx.beginPath();
    ctx.arc(sz * 0.46, sz * 0.06, sz * 0.013, 0, TAU);
    ctx.fill();

    // 가슴지느러미 (작게)
    ctx.save(); ctx.translate(sz * 0.32, sz * 0.1);
    ctx.rotate(0.4 + fw * 0.18);
    ctx.fillStyle = p.fin + 'CC';
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.09, sz * 0.045, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 피부 질감 (거친 점들)
    ctx.fillStyle = p.accent + '22';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * TAU;
      const r = sz * 0.22;
      ctx.beginPath();
      ctx.arc(sz * 0.07 + Math.cos(angle) * r, Math.sin(angle) * r * 0.88, sz * 0.012, 0, TAU);
      ctx.fill();
    }
  }
};

export default sunfish;
