import type { SpeciesDef } from '@/types';
import { TAU } from '@/utils/math';

// 14: 범고래
const orca: SpeciesDef = {
  name: '범고래',
  bodyW: 0.6, bodyH: 0.35, sizeRange: [40, 68],
  customDraw: true,
  defaultColors: { body: '#1A1A2E', fin: '#252538', belly: '#FFFFFF', accent: '#0D0D18' },
  draw(ctx: CanvasRenderingContext2D, sz: number, p, tw: number, fw: number, t: number): void {
    // 꼬리지느러미 (수평 두 갈래, 넓게)
    ctx.save(); ctx.translate(-sz * 0.7, 0); ctx.rotate(tw);
    ctx.fillStyle = p.body;
    // 위 갈래
    ctx.beginPath();
    ctx.moveTo(sz * 0.04, 0);
    ctx.bezierCurveTo(0, -sz * 0.06, -sz * 0.12, -sz * 0.2, -sz * 0.28, -sz * 0.26);
    ctx.bezierCurveTo(-sz * 0.32, -sz * 0.24, -sz * 0.3, -sz * 0.14, -sz * 0.2, -sz * 0.06);
    ctx.bezierCurveTo(-sz * 0.1, -sz * 0.01, 0, 0, sz * 0.04, 0);
    ctx.closePath(); ctx.fill();
    // 아래 갈래
    ctx.beginPath();
    ctx.moveTo(sz * 0.04, 0);
    ctx.bezierCurveTo(0, sz * 0.06, -sz * 0.12, sz * 0.2, -sz * 0.28, sz * 0.26);
    ctx.bezierCurveTo(-sz * 0.32, sz * 0.24, -sz * 0.3, sz * 0.14, -sz * 0.2, sz * 0.06);
    ctx.bezierCurveTo(-sz * 0.1, sz * 0.01, 0, 0, sz * 0.04, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 반대쪽 가슴지느러미 (몸 뒤에 살짝 보임)
    ctx.save(); ctx.translate(sz * 0.05, -sz * 0.18);
    ctx.rotate(-0.6 + fw * 0.1);
    ctx.fillStyle = p.fin;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.04, -sz * 0.04, -sz * 0.12, -sz * 0.12, -sz * 0.18, -sz * 0.1);
    ctx.bezierCurveTo(-sz * 0.14, -sz * 0.05, -sz * 0.06, -sz * 0.01, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 등지느러미 (높고 삼각형)
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.08, -sz * 0.32);
    ctx.bezierCurveTo(-sz * 0.04, -sz * 0.48, sz * 0.02, -sz * 0.65, sz * 0.08, -sz * 0.7);
    ctx.bezierCurveTo(sz * 0.12, -sz * 0.67, sz * 0.14, -sz * 0.55, sz * 0.16, -sz * 0.42);
    ctx.bezierCurveTo(sz * 0.17, -sz * 0.36, sz * 0.16, -sz * 0.32, sz * 0.14, -sz * 0.3);
    ctx.closePath(); ctx.fill();

    // 몸통 전체 (길고 통통한 유선형, 머리 둥글고 뭉툭)
    ctx.fillStyle = p.body;
    ctx.beginPath();
    // 코 앞 (둥글고 뭉툭한 멜론형)
    ctx.moveTo(sz * 0.65, sz * 0.02);
    ctx.bezierCurveTo(sz * 0.68, -sz * 0.02, sz * 0.68, -sz * 0.1, sz * 0.62, -sz * 0.18);
    // 이마
    ctx.bezierCurveTo(sz * 0.55, -sz * 0.26, sz * 0.4, -sz * 0.34, sz * 0.2, -sz * 0.35);
    // 등
    ctx.bezierCurveTo(0, -sz * 0.34, -sz * 0.2, -sz * 0.3, -sz * 0.4, -sz * 0.22);
    // 등~꼬리 좁아짐
    ctx.bezierCurveTo(-sz * 0.55, -sz * 0.15, -sz * 0.65, -sz * 0.08, -sz * 0.72, -sz * 0.02);
    // 꼬리 연결
    ctx.bezierCurveTo(-sz * 0.74, 0, -sz * 0.74, 0, -sz * 0.72, sz * 0.02);
    // 배~꼬리
    ctx.bezierCurveTo(-sz * 0.65, sz * 0.08, -sz * 0.55, sz * 0.15, -sz * 0.4, sz * 0.22);
    // 배 중앙
    ctx.bezierCurveTo(-sz * 0.2, sz * 0.28, 0, sz * 0.3, sz * 0.2, sz * 0.3);
    // 배~턱
    ctx.bezierCurveTo(sz * 0.4, sz * 0.28, sz * 0.55, sz * 0.2, sz * 0.62, sz * 0.12);
    // 턱
    ctx.bezierCurveTo(sz * 0.66, sz * 0.08, sz * 0.68, sz * 0.05, sz * 0.65, sz * 0.02);
    ctx.closePath(); ctx.fill();

    // 흰 배 (큰 영역 - 턱부터 배 전체)
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    // 턱 앞
    ctx.moveTo(sz * 0.63, sz * 0.06);
    // 턱 아래
    ctx.bezierCurveTo(sz * 0.58, sz * 0.16, sz * 0.45, sz * 0.25, sz * 0.25, sz * 0.28);
    // 배 중앙
    ctx.bezierCurveTo(sz * 0.05, sz * 0.28, -sz * 0.15, sz * 0.25, -sz * 0.3, sz * 0.18);
    // 배 뒤쪽
    ctx.bezierCurveTo(-sz * 0.42, sz * 0.12, -sz * 0.48, sz * 0.06, -sz * 0.45, sz * 0.0);
    // 검-흰 경계선 (중앙을 따라 앞으로)
    ctx.bezierCurveTo(-sz * 0.3, -sz * 0.04, -sz * 0.1, -sz * 0.02, sz * 0.1, -sz * 0.02);
    ctx.bezierCurveTo(sz * 0.3, -sz * 0.01, sz * 0.5, sz * 0.0, sz * 0.6, sz * 0.03);
    ctx.closePath(); ctx.fill();

    // 이쪽 가슴지느러미 (크고 선명, 아래쪽으로 뻗음)
    ctx.save(); ctx.translate(sz * 0.15, sz * 0.2);
    ctx.rotate(0.5 + fw * 0.15);
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sz * 0.02, sz * 0.06, -sz * 0.1, sz * 0.2, -sz * 0.22, sz * 0.22);
    ctx.bezierCurveTo(-sz * 0.24, sz * 0.18, -sz * 0.18, sz * 0.08, -sz * 0.08, sz * 0.02);
    ctx.bezierCurveTo(-sz * 0.03, 0, 0, 0, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 눈 뒤 흰 아이패치 (범고래 상징, 크게)
    ctx.fillStyle = p.belly;
    ctx.save();
    ctx.translate(sz * 0.48, -sz * 0.14);
    ctx.rotate(0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.1, sz * 0.055, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 눈
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sz * 0.56, -sz * 0.1, sz * 0.022, 0, TAU);
    ctx.fill();
  }
};

export default orca;
