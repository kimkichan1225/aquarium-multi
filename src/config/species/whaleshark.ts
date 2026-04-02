import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 16: 고래상어
const whaleshark: SpeciesDef = {
  name: '고래상어',
  bodyW: 0.6, bodyH: 0.25, sizeRange: [65, 100],
  customDraw: true,
  defaultColors: { body: '#4A90C4', fin: '#3A7AB0', belly: '#D8EAF5', accent: '#2A5A80' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    // 꼬리지느러미 (세로 초승달형, 위 갈래가 더 큼)
    ctx.save(); ctx.translate(-sz * 0.8, 0); ctx.rotate(tw);
    ctx.fillStyle = p.fin;
    // 위 갈래 (더 큼)
    ctx.beginPath();
    ctx.moveTo(sz * 0.03, 0);
    ctx.bezierCurveTo(0, -sz * 0.04, -sz * 0.1, -sz * 0.18, -sz * 0.22, -sz * 0.25);
    ctx.bezierCurveTo(-sz * 0.25, -sz * 0.22, -sz * 0.22, -sz * 0.1, -sz * 0.14, -sz * 0.04);
    ctx.bezierCurveTo(-sz * 0.06, 0, 0, 0, sz * 0.03, 0);
    ctx.closePath(); ctx.fill();
    // 아래 갈래 (작음)
    ctx.beginPath();
    ctx.moveTo(sz * 0.03, 0);
    ctx.bezierCurveTo(0, sz * 0.03, -sz * 0.08, sz * 0.12, -sz * 0.16, sz * 0.16);
    ctx.bezierCurveTo(-sz * 0.18, sz * 0.14, -sz * 0.16, sz * 0.08, -sz * 0.1, sz * 0.03);
    ctx.bezierCurveTo(-sz * 0.05, 0, 0, 0, sz * 0.03, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 두번째 등지느러미 (작게, 뒤쪽에)
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.4, -sz * 0.2);
    ctx.bezierCurveTo(-sz * 0.38, -sz * 0.26, -sz * 0.35, -sz * 0.28, -sz * 0.33, -sz * 0.27);
    ctx.bezierCurveTo(-sz * 0.32, -sz * 0.24, -sz * 0.33, -sz * 0.2, -sz * 0.34, -sz * 0.18);
    ctx.closePath(); ctx.fill();

    // 가슴지느러미 (크고 넓게, 뒤로 뻗음)
    ctx.save(); ctx.translate(sz * 0.25, sz * 0.18);
    ctx.rotate(0.4 + fw * 0.12);
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.04, sz * 0.05, -sz * 0.18, sz * 0.22, -sz * 0.3, sz * 0.2);
    ctx.bezierCurveTo(-sz * 0.28, sz * 0.12, -sz * 0.14, sz * 0.03, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 첫번째 등지느러미 (삼각형, 몸 중앙 뒤쪽에)
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.12, -sz * 0.22);
    ctx.bezierCurveTo(-sz * 0.08, -sz * 0.32, -sz * 0.02, -sz * 0.38, sz * 0.02, -sz * 0.36);
    ctx.bezierCurveTo(sz * 0.04, -sz * 0.32, sz * 0.04, -sz * 0.26, sz * 0.03, -sz * 0.22);
    ctx.closePath(); ctx.fill();

    // 몸통 (매우 길고, 머리 넓고 납작, 뒤로 갈수록 좁아짐)
    ctx.fillStyle = p.body;
    ctx.beginPath();
    // 머리 앞 (납작하고 사각형에 가까운 넓은 머리)
    ctx.moveTo(sz * 0.7, sz * 0.06);
    // 머리 위 (거의 수평으로 납작)
    ctx.bezierCurveTo(sz * 0.72, 0, sz * 0.72, -sz * 0.08, sz * 0.68, -sz * 0.14);
    // 이마 (완만하게)
    ctx.bezierCurveTo(sz * 0.6, -sz * 0.2, sz * 0.4, -sz * 0.24, sz * 0.15, -sz * 0.24);
    // 등 라인 (길게)
    ctx.bezierCurveTo(-sz * 0.1, -sz * 0.24, -sz * 0.35, -sz * 0.22, -sz * 0.55, -sz * 0.18);
    // 등~꼬리 (점점 좁아짐)
    ctx.bezierCurveTo(-sz * 0.7, -sz * 0.12, -sz * 0.78, -sz * 0.06, -sz * 0.82, -sz * 0.02);
    // 꼬리 연결
    ctx.bezierCurveTo(-sz * 0.83, 0, -sz * 0.83, 0, -sz * 0.82, sz * 0.02);
    // 배~꼬리
    ctx.bezierCurveTo(-sz * 0.78, sz * 0.06, -sz * 0.7, sz * 0.1, -sz * 0.55, sz * 0.14);
    // 배 라인
    ctx.bezierCurveTo(-sz * 0.35, sz * 0.18, -sz * 0.1, sz * 0.2, sz * 0.15, sz * 0.2);
    // 배~턱
    ctx.bezierCurveTo(sz * 0.4, sz * 0.2, sz * 0.6, sz * 0.16, sz * 0.68, sz * 0.1);
    // 턱 (넓은 입)
    ctx.bezierCurveTo(sz * 0.72, sz * 0.08, sz * 0.72, sz * 0.07, sz * 0.7, sz * 0.06);
    ctx.closePath(); ctx.fill();

    // 흰 배 (아래쪽 넓게)
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.moveTo(sz * 0.7, sz * 0.08);
    ctx.bezierCurveTo(sz * 0.65, sz * 0.14, sz * 0.45, sz * 0.19, sz * 0.2, sz * 0.2);
    ctx.bezierCurveTo(-sz * 0.05, sz * 0.2, -sz * 0.3, sz * 0.17, -sz * 0.5, sz * 0.12);
    ctx.bezierCurveTo(-sz * 0.62, sz * 0.08, -sz * 0.65, sz * 0.04, -sz * 0.6, sz * 0.0);
    // 경계선
    ctx.bezierCurveTo(-sz * 0.4, -sz * 0.02, -sz * 0.1, -sz * 0.01, sz * 0.15, 0);
    ctx.bezierCurveTo(sz * 0.4, sz * 0.01, sz * 0.6, sz * 0.04, sz * 0.7, sz * 0.08);
    ctx.closePath(); ctx.fill();

    // 흰 점무늬 (온 몸에 촘촘히, 고래상어 핵심)
    ctx.fillStyle = p.belly + 'CC';
    const spots: [number, number][] = [
      // 머리 쪽
      [0.55, -0.08], [0.5, -0.14], [0.58, -0.04], [0.48, -0.18], [0.6, -0.1],
      // 등 앞쪽
      [0.38, -0.1], [0.3, -0.16], [0.22, -0.2], [0.35, -0.2], [0.42, -0.16],
      [0.28, -0.08], [0.18, -0.14], [0.1, -0.18], [0.25, -0.22], [0.4, -0.06],
      // 등 중앙
      [0.05, -0.22], [-0.05, -0.22], [-0.12, -0.2], [-0.02, -0.16], [0.08, -0.12],
      [-0.08, -0.14], [-0.18, -0.18], [-0.15, -0.1], [-0.22, -0.16], [0.0, -0.08],
      // 등 뒤쪽
      [-0.28, -0.18], [-0.35, -0.16], [-0.42, -0.14], [-0.48, -0.12], [-0.55, -0.1],
      [-0.3, -0.1], [-0.38, -0.08], [-0.45, -0.06], [-0.52, -0.04], [-0.6, -0.02],
      [-0.32, -0.2], [-0.4, -0.18], [-0.5, -0.14], [-0.58, -0.08], [-0.65, -0.04],
      // 옆구리
      [0.45, -0.02], [0.35, 0.02], [0.25, -0.04], [0.15, -0.02], [0.05, -0.04],
      [-0.05, -0.06], [-0.15, -0.04], [-0.25, -0.06], [-0.35, -0.04], [-0.45, -0.02]
    ];
    for (const [dx, dy] of spots) {
      ctx.beginPath();
      ctx.arc(sz * dx, sz * dy, sz * 0.008 + Math.random() * sz * 0.004, 0, TAU);
      ctx.fill();
    }

    // 세로 줄무늬 (점선, 등에서 옆구리까지)
    ctx.strokeStyle = p.belly + '44';
    ctx.lineWidth = sz * 0.005;
    ctx.setLineDash([sz * 0.012, sz * 0.015]);
    for (let i = 0; i < 7; i++) {
      const lx = sz * (0.5 - i * 0.16);
      ctx.beginPath();
      ctx.moveTo(lx, -sz * 0.22 + Math.abs(i - 3) * sz * 0.02);
      ctx.lineTo(lx, -sz * 0.02);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 입 (맨 앞에 가로로 넓게 - 고래상어 핵심)
    ctx.fillStyle = p.accent + '88';
    ctx.beginPath();
    ctx.moveTo(sz * 0.7, sz * 0.04);
    ctx.bezierCurveTo(sz * 0.72, sz * 0.05, sz * 0.72, sz * 0.07, sz * 0.7, sz * 0.08);
    ctx.lineTo(sz * 0.68, sz * 0.08);
    ctx.bezierCurveTo(sz * 0.7, sz * 0.06, sz * 0.7, sz * 0.05, sz * 0.68, sz * 0.04);
    ctx.closePath(); ctx.fill();

    // 눈 (머리 옆쪽에, 작게)
    ctx.fillStyle = '#1A2A3A';
    ctx.beginPath();
    ctx.arc(sz * 0.6, -sz * 0.1, sz * 0.02, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(sz * 0.595, -sz * 0.105, sz * 0.007, 0, TAU);
    ctx.fill();
  }
};

export default whaleshark;
