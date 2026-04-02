// ── 수학 유틸리티 ──

/** a 이상 b 이하 범위의 랜덤 실수 */
export const rand = (a: number, b: number): number =>
  Math.random() * (b - a) + a;

/** 배열에서 랜덤 요소 하나 선택 */
export const pick = <T>(a: T[]): T =>
  a[Math.floor(Math.random() * a.length)];

/** 선형 보간 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** 값을 mn~mx 범위로 제한 */
export const clamp = (v: number, mn: number, mx: number): number =>
  Math.max(mn, Math.min(mx, v));

/** 두 점 사이의 거리 */
export const dist = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

/** 2π (원 한 바퀴) */
export const TAU: number = Math.PI * 2;

/** 먹이 탐색 주기 (프레임 단위) */
export const FOOD_SEARCH_INTERVAL: number = 8;
