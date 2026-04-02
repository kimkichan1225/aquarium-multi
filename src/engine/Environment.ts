// ── 환경 (수초, 산호, 모래) 관리 ──

import { rand } from '@/utils/math';
import { getW, getH } from '@/state/store';
import { Seaweed } from '@/entities/Seaweed';
import { Coral } from '@/entities/Coral';

/** 수초 배열 */
export const seaweeds: Seaweed[] = [];

/** 산호 배열 */
export const corals: Coral[] = [];

/** 모래 텍스처 점 (매 프레임 rand() 호출 방지 - 한번만 생성) */
export interface SandDot {
  x: number;
  y: number;
  r: number;
}
export let sandDots: SandDot[] = [];

/** 모래 점 생성 */
export function generateSandDots(): void {
  const W = getW();
  const H = getH();
  sandDots = [];
  for (let i = 0; i < W; i += rand(5, 12)) {
    sandDots.push({ x: i, y: H - rand(5, 65), r: rand(0.5, 1.5) });
  }
}

/** 환경 초기화 (수초, 산호, 모래 점 생성) */
export function initEnvironment(ctx: CanvasRenderingContext2D): void {
  const W = getW();
  seaweeds.length = 0;
  corals.length = 0;
  for (let i = 0; i < Math.floor(W / 80); i++) {
    seaweeds.push(new Seaweed(rand(30, W - 30), ctx));
  }
  for (let i = 0; i < Math.floor(W / 150); i++) {
    corals.push(new Coral(rand(60, W - 60)));
  }
  generateSandDots();
}
