// ── 하단 버튼바 ──

import { rand, pick } from '@/utils/math';
import {
  getW, getH,
  getMx, getMy, setMouse,
  isNightMode, setNightMode,
  getCurrentTheme, setCurrentTheme,
  getMyUid, getMyName,
  getEditMode, getLoggedNickname, isLoggedIn,
  getIsRoomOwner,
} from '@/state/store';
import { THEMES } from '@/config/themes';
import { SPECIES } from '@/config/species';
import { Food } from '@/entities/Food';
import { foods, invalidateBgCache } from '@/engine/Renderer';
import { checkFishHover, fishes } from '@/engine/FishManager';
import { emitAddFish, emitFeed, sendCursor } from '@/network/socket';
import { toggleChat } from './ChatPanel';
import { navigateToRoom } from '@/engine/router';
import { showToast } from './Toast';
import { openFishInfo, closeFishInfo } from './FishInfoPanel';
import { getCurrentRoom, setMyName } from '@/state/store';
import { openDrawEditor, getDrawFishName, createCustomDraw } from './DrawEditor';
import type { PartName } from './DrawEditor';

/** 먹이 주기 */
function dropFood(x: number, y: number): void {
  foods.push(new Food(x, y));
  emitFeed(x, y);
}

/** 랜덤 물고기 추가 */
function spawnRandomFish(): void {
  const W = getW();
  const H = getH();
  // 해파리 제외한 종에서 랜덤 선택
  const fishSpecies = SPECIES.filter(s => !s.isJellyfish);
  const si = SPECIES.indexOf(pick(fishSpecies));
  const sp = SPECIES[si];
  const sr = sp.sizeRange;
  const lifespan = rand(15, 30);
  emitAddFish({
    uid: getMyUid(),
    ownerName: getMyName() || '익명',
    name: sp.name,
    speciesIdx: si,
    customColors: sp.defaultColors,
    size: rand(sr[0], sr[1]),
    z: rand(0.6, 1.2),
    x: rand(100, W - 100),
    y: rand(120, H - 200),
    dir: Math.random() > 0.5 ? 1 : -1,
    temporary: true,
    lifespan: lifespan,
  });
}

/** 랜덤 해파리 추가 */
function spawnRandomJellyfish(): void {
  const W = getW();
  const H = getH();
  const jellyIdx = SPECIES.findIndex(s => s.isJellyfish);
  const sp = SPECIES[jellyIdx];
  const sr = sp.sizeRange;
  const lifespan = rand(20, 40);
  // 랜덤 해파리 색상
  const palette = pick(sp.jellyPalettes || [sp.defaultColors]);
  emitAddFish({
    uid: getMyUid(),
    ownerName: getMyName() || '익명',
    name: '해파리',
    speciesIdx: jellyIdx,
    customColors: palette,
    size: rand(sr[0], sr[1]),
    z: rand(0.5, 1.2),
    x: rand(100, W - 100),
    y: rand(H * 0.3, H * 0.7),
    dir: 1,
    temporary: true,
    lifespan: lifespan,
  });
}

/** 테마 순환 */
function cycleTheme(): void {
  setCurrentTheme((getCurrentTheme() + 1) % THEMES.length);
  document.getElementById('btn-theme')!.textContent = `테마: ${THEMES[getCurrentTheme()].name} (T)`;
  invalidateBgCache();
}

/** 하단 버튼바 초기화 */
export function initBottomBar(): void {
  let lastHoverCheck = 0;

  // 마우스 이동
  addEventListener('mousemove', (e) => {
    setMouse(e.clientX, e.clientY);
    const now = Date.now();
    if (now - lastHoverCheck > 150) {
      checkFishHover();
      lastHoverCheck = now;
    }
    sendCursor(e.clientX, e.clientY);
  });

  addEventListener('touchmove', (e) => {
    setMouse(e.touches[0].clientX, e.touches[0].clientY);
    sendCursor(e.touches[0].clientX, e.touches[0].clientY);
  });

  // 캔버스 클릭 = 물고기 클릭 확인 → 없으면 먹이 주기
  addEventListener('click', (e) => {
    if (getEditMode()) return;
    const target = e.target as HTMLElement;
    if (target.closest('#top-bar,#bottom-bar,#creator-overlay,#my-fish-panel,#chat-panel,#chat-floating-btn,#room-editor-panel,#fish-info-panel')) return;

    // 개인 방에서 물고기 클릭 감지
    if (getCurrentRoom()) {
      const cx = e.clientX, cy = e.clientY;
      let clicked = null, minD = Infinity;
      for (const f of fishes) {
        if (f.temporary || !f.dbId) continue;
        const d = Math.hypot(f.x - cx, f.y - cy);
        if (d < f.actualSize * 1.2 && d < minD) { clicked = f; minD = d; }
      }
      if (clicked) { openFishInfo(clicked); return; }
      else closeFishInfo();
    }

    dropFood(e.clientX, e.clientY);
  });

  // 키보드 단축키
  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const key = e.key.toLowerCase();
    if (key === 'f') dropFood(getMx(), getMy());
    if (key === 'a') spawnRandomFish();
    if (key === 'j') spawnRandomJellyfish();
    if (key === 't') cycleTheme();
    if (key === 'n') {
      setNightMode(!isNightMode());
      invalidateBgCache();
    }
    if (key === 'c') toggleChat();
  });

  // 직접 그리기 버튼
  document.getElementById('btn-draw-fish')!.addEventListener('click', () => {
    // 다른 사람 방에서는 생성 불가
    if (getCurrentRoom() && !getIsRoomOwner()) {
      showToast('다른 사람의 방에서는 물고기를 만들 수 없습니다');
      return;
    }
    openDrawEditor((partDataURLs: Record<PartName, string>) => {
      const W = getW(), H = getH();
      const fishName = getDrawFishName();
      const ownerName = getMyName() || getLoggedNickname() || '익명';
      setMyName(ownerName);

      // 커스텀 draw 함수 생성 후 SPECIES에 동적 추가
      const custom = createCustomDraw(partDataURLs);
      const customIdx = SPECIES.length;
      SPECIES.push({
        name: fishName,
        bodyW: 0.5, bodyH: 0.35, sizeRange: [25, 45],
        customDraw: true,
        defaultColors: { body: '#88BBFF', fin: '#6699DD', belly: '#AADDFF', accent: '#FFFFFF' },
        draw: custom.draw,
      });

      emitAddFish({
        uid: getMyUid(),
        ownerName,
        name: fishName,
        speciesIdx: customIdx,
        customColors: { body: '#88BBFF', fin: '#6699DD', belly: '#AADDFF', accent: '#FFFFFF' },
        size: 35,
        z: 1.0,
        x: rand(100, W - 100),
        y: rand(120, H - 200),
        dir: Math.random() > 0.5 ? 1 : -1,
        loggedIn: isLoggedIn(),
        customParts: partDataURLs, // 서버에 전송해서 다른 유저에게도 전달
      });

      showToast(`"${fishName}" 을(를) 직접 그려서 수조에 넣었습니다! 🎨`);
    });
  });

  // 버튼 이벤트
  document.getElementById('btn-feed')!.addEventListener('click', () => {
    const W = getW();
    dropFood(W / 2 + rand(-100, 100), 80);
  });

  document.getElementById('btn-random')!.addEventListener('click', () => spawnRandomFish());
  document.getElementById('btn-jelly')!.addEventListener('click', () => spawnRandomJellyfish());
  document.getElementById('btn-theme')!.addEventListener('click', cycleTheme);

  document.getElementById('btn-night')!.addEventListener('click', () => {
    setNightMode(!isNightMode());
    invalidateBgCache();
    document.getElementById('btn-night')!.classList.toggle('active', isNightMode());
  });

  // 내 방 버튼
  document.getElementById('btn-my-room')?.addEventListener('click', () => {
    const name = getLoggedNickname();
    if (!isLoggedIn() || !name) {
      showToast('로그인이 필요합니다');
      return;
    }
    navigateToRoom(name);
  });

  // 로비로 돌아가기 버튼 (상단바)
  document.getElementById('btn-back-lobby')?.addEventListener('click', () => {
    location.hash = '';
  });

  // 로비로 돌아가기 버튼 (하단바)
  document.getElementById('btn-to-lobby')?.addEventListener('click', () => {
    location.hash = '';
  });
}
