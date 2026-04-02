import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 13: 만타가오리
const mantaray: SpeciesDef = {
  name: '만타가오리',
  bodyW: 0.3, bodyH: 0.15, sizeRange: [38, 65],
  customDraw: true,
  defaultColors: { body: '#7A2E2B', fin: '#8B3A36', belly: '#E8C4BC', accent: '#5C1F1D' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    const wingPulse = Math.sin(t * 1.5) * 0.04;

    // 꼬리 (가늘고 길게 뒤로)
    ctx.save(); ctx.translate(-sz * 0.6, sz * 0.02);
    const tailWv = Math.sin(t * 2) * sz * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.2, tailWv * 0.5, -sz * 0.45, tailWv, -sz * 0.7, tailWv * 1.2);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = sz * 0.018;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // 등(위쪽) - 어두운 색, 부드러운 아치형으로 가로로 넓게
    ctx.fillStyle = p.body;
    ctx.beginPath();
    // 머리 앞쪽
    ctx.moveTo(sz * 0.45, -sz * 0.02);
    // 머리에서 등 라인을 따라 부드럽게 올라감
    ctx.bezierCurveTo(sz * 0.35, -sz * 0.1, sz * 0.1, -sz * 0.22, -sz * 0.15, -sz * 0.28);
    // 등 꼭대기에서 뒤로 길게 내려감
    ctx.bezierCurveTo(-sz * 0.3, -sz * 0.3, -sz * 0.5, -sz * 0.22, -sz * 0.65, -sz * 0.08);
    // 뒤쪽 꼬리 연결
    ctx.bezierCurveTo(-sz * 0.68, -sz * 0.04, -sz * 0.65, -sz * 0.01, -sz * 0.6, sz * 0.02);
    // 몸 중심선을 따라 앞으로
    ctx.lineTo(sz * 0.45, sz * 0.02);
    ctx.closePath(); ctx.fill();

    // 배(아래쪽) - 밝은 색, 크고 유연하게 흘러내림
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.moveTo(sz * 0.45, sz * 0.02);
    // 머리 아래에서 배 쪽으로 부드럽게
    ctx.bezierCurveTo(sz * 0.4, sz * 0.1, sz * 0.2, sz * 0.22, -sz * 0.05, sz * 0.32);
    // 배 아래 가장 넓은 부분
    ctx.bezierCurveTo(-sz * 0.2, sz * 0.38, -sz * 0.4, sz * 0.35, -sz * 0.55, sz * 0.22);
    // 뒤쪽으로 좁아지며 꼬리 연결
    ctx.bezierCurveTo(-sz * 0.62, sz * 0.12, -sz * 0.63, sz * 0.06, -sz * 0.6, sz * 0.02);
    ctx.lineTo(sz * 0.45, sz * 0.02);
    ctx.closePath(); ctx.fill();

    // 점무늬 (등 쪽에만)
    ctx.fillStyle = p.belly + 'CC';
    const dots: [number, number][] = [
      [0.3, -0.06], [0.2, -0.12], [0.08, -0.18], [-0.02, -0.22], [-0.15, -0.25],
      [0.25, -0.1], [0.12, -0.16], [-0.08, -0.24], [-0.22, -0.26], [-0.35, -0.22],
      [-0.42, -0.16], [-0.5, -0.1], [-0.55, -0.06], [-0.3, -0.15], [-0.18, -0.12],
      [0.0, -0.14], [-0.45, -0.2], [-0.12, -0.2], [0.15, -0.08], [-0.28, -0.28],
      [-0.38, -0.08], [-0.58, -0.04], [0.35, -0.04], [-0.05, -0.1], [-0.48, -0.14]
    ];
    for (const [dx, dy] of dots) {
      ctx.beginPath();
      ctx.arc(sz * dx, sz * dy, sz * 0.012 + Math.random() * sz * 0.004, 0, TAU);
      ctx.fill();
    }

    // 아가미 슬릿 (배 쪽)
    ctx.strokeStyle = p.accent + '55';
    ctx.lineWidth = sz * 0.007;
    for (let i = 0; i < 3; i++) {
      const gx = sz * (0.05 - i * 0.06);
      ctx.beginPath();
      ctx.moveTo(gx, sz * 0.1);
      ctx.lineTo(gx, sz * 0.16);
      ctx.stroke();
    }

    // 머리 뿔 (위로 솟은 두 귀처럼, 귀여운 느낌)
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(sz * 0.4, -sz * 0.04);
    ctx.bezierCurveTo(sz * 0.44, -sz * 0.1, sz * 0.48, -sz * 0.16, sz * 0.5, -sz * 0.14);
    ctx.bezierCurveTo(sz * 0.49, -sz * 0.1, sz * 0.45, -sz * 0.04, sz * 0.42, -sz * 0.02);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sz * 0.36, -sz * 0.05);
    ctx.bezierCurveTo(sz * 0.38, -sz * 0.12, sz * 0.42, -sz * 0.18, sz * 0.44, -sz * 0.16);
    ctx.bezierCurveTo(sz * 0.43, -sz * 0.1, sz * 0.4, -sz * 0.05, sz * 0.37, -sz * 0.03);
    ctx.closePath(); ctx.fill();

    // 눈 (등 쪽에)
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(sz * 0.32, -sz * 0.08, sz * 0.025, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(sz * 0.315, -sz * 0.085, sz * 0.008, 0, TAU);
    ctx.fill();
  }
};

export default mantaray;
