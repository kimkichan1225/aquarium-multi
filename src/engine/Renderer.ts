// ── 렌더러 (캔버스 초기화, 배경, 메인 루프) ──

import { TAU, lerp, rand } from '@/utils/math';
import {
  getW, getH, setSize,
  isNightMode, getTime, setTime,
  getFrameCount, incrementFrameCount,
  getCurrentTheme,
} from '@/state/store';
import { THEMES } from '@/config/themes';
import { seaweeds, corals, sandDots, initEnvironment } from './Environment';
import { fishes, fishById, fishSortDirty, setFishSortDirty, lastFishCount, setLastFishCount } from './FishManager';
import { Bubble } from '@/entities/Bubble';

// ── 캔버스 & 컨텍스트 ──
let cv: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

// ── 빛줄기 (갓레이) 개별 속성 ──
interface LightRay { x: number; width: number; opacity: number; speed: number; angle: number; phase: number; }
const lightRays: LightRay[] = [];

/** 메인 캔버스 컨텍스트 (외부 모듈에서 참조) */
export function getCtx(): CanvasRenderingContext2D { return ctx; }
export function getCanvas(): HTMLCanvasElement { return cv; }

// ── 기포 ──
export const bubbles: Bubble[] = [];

// ── 먹이 ──
import { Food } from '@/entities/Food';
export const foods: Food[] = [];

// ── 다른 유저 커서 ──
import type { RemoteCursor } from '@/types';
export const remoteCursors: Map<string, RemoteCursor> = new Map();

// ── 배경 그라데이션 캐시 ──
let _bgGradCache: CanvasGradient | null = null;
let _bgGradTheme: string = '-1';

function getBgGradient(colors: string[]): CanvasGradient {
  const H = getH();
  const key = getCurrentTheme() + '|' + isNightMode();
  if (_bgGradTheme === key && _bgGradCache) return _bgGradCache;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, colors[0]);
  bg.addColorStop(0.33, colors[1]);
  bg.addColorStop(0.66, colors[2]);
  bg.addColorStop(1, colors[3]);
  _bgGradCache = bg;
  _bgGradTheme = key;
  return bg;
}

/** 배경 그라데이션 캐시 초기화 */
export function invalidateBgCache(): void {
  _bgGradTheme = '-1';
  _drawBackground_sunGrad = null;
  _sandGradKey = '';
}

// 모래 그라데이션 캐시
let _sandGradCache: CanvasGradient | null = null;
let _sandGradKey = '';
function getSandGradient(H: number, nightMode: boolean, th: any): CanvasGradient {
  const key = getCurrentTheme() + '|' + nightMode + '|' + H;
  if (_sandGradCache && _sandGradKey === key) return _sandGradCache;
  const sandColors = nightMode ? th.sandNight : th.sand;
  const g = ctx.createLinearGradient(0, H - 80, 0, H);
  g.addColorStop(0, 'rgba(20,40,50,0)');
  g.addColorStop(0.3, sandColors[0]);
  g.addColorStop(1, sandColors[1]);
  _sandGradCache = g;
  _sandGradKey = key;
  return g;
}

// 석양 캐시
let _drawBackground_sunGrad: CanvasGradient | null = null;
let _drawBackground_sunNight: boolean | null = null;

function drawBackground(): void {
  const W = getW();
  const H = getH();
  const time = getTime();
  const nightMode = isNightMode();
  const th = THEMES[getCurrentTheme()];
  const nightMul = nightMode ? 0.4 : 1;
  const colors = nightMode ? th.night : th.sky;

  // 바다 그라데이션 (캐시 활용)
  ctx.fillStyle = getBgGradient(colors);
  ctx.fillRect(0, 0, W, H);

  // 빛줄기 (갓레이)
  ctx.save();
  for (const ray of lightRays) {
    const flicker = 0.5 + 0.5 * Math.sin(time * ray.speed + ray.phase);
    ctx.globalAlpha = ray.opacity * flicker * (nightMode ? 0.3 : 1);
    ctx.save();
    ctx.translate(ray.x + Math.sin(time * 0.2 + ray.phase) * 20, 0);
    ctx.rotate(ray.angle);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,   th.light + '0.4)');
    g.addColorStop(0.3, th.light + '0.15)');
    g.addColorStop(1,   th.light + '0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-ray.width / 2, -50);
    ctx.lineTo( ray.width / 2, -50);
    ctx.lineTo( ray.width * 1.5, H);
    ctx.lineTo(-ray.width, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 심해 테마: 생물발광 파티클
  if (getCurrentTheme() === 2) {
    ctx.save();
    const colors2 = ['80,140,255', '100,255,200', '200,100,255', '255,180,80'];
    for (let i = 0; i < 15; i++) {
      const px = (Math.sin(time * 0.2 + i * 2.3) * 0.5 + 0.5) * W;
      const py = (Math.cos(time * 0.15 + i * 1.7) * 0.5 + 0.5) * H * 0.8;
      const pr = 1.5 + Math.sin(time * 2 + i) * 0.8;
      const alpha = 0.15 + Math.sin(time * 1.5 + i * 0.9) * 0.1;
      const c = colors2[i % 4];
      ctx.fillStyle = `rgba(${c},${alpha * 0.12 * nightMul})`;
      ctx.beginPath(); ctx.arc(px, py, pr * 7, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${c},${alpha * nightMul})`;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // 석양 테마: 상단에 따뜻한 빛 (캐시)
  if (getCurrentTheme() === 4) {
    ctx.save();
    if (!_drawBackground_sunGrad || _drawBackground_sunNight !== nightMode) {
      const sunG = ctx.createRadialGradient(W * 0.7, 0, 0, W * 0.7, 0, H * 0.5);
      sunG.addColorStop(0, `rgba(255,120,60,${0.08 * nightMul})`);
      sunG.addColorStop(0.5, `rgba(255,80,40,${0.03 * nightMul})`);
      sunG.addColorStop(1, 'rgba(0,0,0,0)');
      _drawBackground_sunGrad = sunG;
      _drawBackground_sunNight = nightMode;
    }
    ctx.fillStyle = _drawBackground_sunGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 바닥 모래 (그라데이션 캐시)
  ctx.fillStyle = getSandGradient(H, nightMode, th);
  ctx.fillRect(0, H - 80, W, 80);

  // 모래 질감 (사전 생성된 점 배열 사용)
  ctx.fillStyle = nightMode ? th.sandTexNight : th.sandTex;
  ctx.beginPath();
  for (const d of sandDots) {
    ctx.moveTo(d.x + d.r, d.y);
    ctx.arc(d.x, d.y, d.r, 0, TAU);
  }
  ctx.fill();
}

// ── 메인 루프 ──
let lastTime = 0;

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  setTime(getTime() + dt);
  incrementFrameCount();
  const time = getTime();
  const W = getW();
  const H = getH();
  const nightMode = isNightMode();

  drawBackground();

  // 수초 & 산호
  for (const sw of seaweeds) sw.draw(ctx);
  for (const co of corals) co.draw(ctx);

  // 먹이
  for (let i = foods.length - 1; i >= 0; i--) {
    foods[i].update(dt);
    if (foods[i].eaten) foods.splice(i, 1);
    else foods[i].draw(ctx);
  }

  // 물고기 업데이트
  for (const f of fishes) f.update(dt, foods);

  // 죽은 임시 물고기 제거
  for (let i = fishes.length - 1; i >= 0; i--) {
    if (fishes[i].dead && fishes[i].deathBubbles.length === 0) {
      fishById.delete(fishes[i].id);
      fishes.splice(i, 1);
      setFishSortDirty(true);
    }
  }

  // z 기반 정렬 (물고기 추가/제거 시에만)
  if (fishSortDirty) {
    fishes.sort((a, b) => a.z - b.z);
    setFishSortDirty(false);
  }
  for (const f of fishes) f.draw(ctx);

  // 기포
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update(dt);
    if (bubbles[i].popped) bubbles.splice(i, 1);
    else bubbles[i].draw(ctx);
  }

  // 다른 유저 커서 그리기 (RadialGradient 제거 → 단순 원)
  for (const [id, c] of remoteCursors) {
    // 부드럽게 보간
    c.x = lerp(c.x, c.targetX, 0.15);
    c.y = lerp(c.y, c.targetY, 0.15);

    ctx.save();
    ctx.globalAlpha = 0.7;
    const pulse = 1 + Math.sin(time * 3 + id.charCodeAt(0)) * 0.15;
    const r = 8 * pulse;
    // 글로우 (단순 알파 원)
    ctx.fillStyle = 'rgba(80,180,255,0.15)';
    ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.5, 0, TAU); ctx.fill();
    // 커서 점
    ctx.fillStyle = 'rgba(100,220,255,0.5)';
    ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.6, 0, TAU); ctx.fill();
    // 중심 점
    ctx.fillStyle = 'rgba(150,230,255,0.8)';
    ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, TAU); ctx.fill();
    // 닉네임
    ctx.font = '10px system-ui';
    ctx.fillStyle = 'rgba(140,210,255,0.7)';
    ctx.fillText(c.name, c.x + 12, c.y + 4);
    ctx.restore();
  }

  // 수면 효과
  ctx.save();
  ctx.globalAlpha = nightMode ? 0.02 : 0.05;
  for (let i = 0; i < 3; i++) {
    const y = 48 + i * 3 + Math.sin(time * 0.8 + i) * 2;
    ctx.strokeStyle = 'rgba(120,200,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + time * 1.5 + i) * 3);
    }
    ctx.stroke();
  }
  ctx.restore();

  // UI 업데이트 (변경 시에만)
  if (lastFishCount !== fishes.length) {
    document.getElementById('fish-total')!.textContent = String(fishes.length);
    setLastFishCount(fishes.length);
  }
}

/** 리사이즈 핸들러 */
function resize(): void {
  const W = innerWidth;
  const H = innerHeight;
  cv.width = W;
  cv.height = H;
  setSize(W, H);
}

/** 빛줄기 데이터 초기화 */
function initLightRays(): void {
  const W = getW();
  lightRays.length = 0;
  for (let i = 0; i < 8; i++) {
    lightRays.push({
      x: rand(0, W),
      width: rand(30, 120),
      opacity: rand(0.02, 0.06),
      speed: rand(0.1, 0.3),
      angle: rand(-0.15, 0.15),
      phase: rand(0, TAU),
    });
  }
}

/** 렌더러 초기화 */
export function initRenderer(): void {
  cv = document.getElementById('c') as HTMLCanvasElement;
  ctx = cv.getContext('2d')!;
  resize();
  initEnvironment(ctx);
  initLightRays();

  addEventListener('resize', () => {
    resize();
    initEnvironment(ctx);
    invalidateBgCache();
  });

  // 기포 자동 생성
  setInterval(() => {
    if (bubbles.length < 60) bubbles.push(new Bubble());
  }, 300);

  // 오래된 커서 정리 (매 프레임 대신 1초마다)
  setInterval(() => {
    const now = Date.now();
    for (const [id, c] of remoteCursors) {
      if (now - c.lastSeen > 5000) remoteCursors.delete(id);
    }
  }, 1000);

  // 애니메이션 시작
  lastTime = performance.now();
  requestAnimationFrame(animate);
}
