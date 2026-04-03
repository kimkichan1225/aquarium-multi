// ── 물고기 정보 패널 (클릭 시 표시) ──

import type { Fish } from '@/entities/Fish';
import type { Mood } from '@/entities/Fish';
import { collectedItems } from '@/engine/Renderer';

let panel: HTMLElement | null = null;
let currentFish: Fish | null = null;
let rafId = 0;

const MOOD_LABEL: Record<Mood, string> = {
  happy: '😊 신남', neutral: '😐 보통', hungry: '😋 배고픔', sad: '😢 슬픔',
};
const MOOD_COLOR: Record<Mood, string> = {
  happy: '#7DE0A0', neutral: '#A0C8F0', hungry: '#F0C870', sad: '#A090C0',
};

/** 패널 생성 (최초 1회) */
function ensurePanel(): HTMLElement {
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'fish-info-panel';
  panel.innerHTML = '';
  document.body.appendChild(panel);

  // 외부 클릭 시 닫기
  document.addEventListener('mousedown', (e) => {
    if (panel && !panel.contains(e.target as Node)) closeFishInfo();
  });
  return panel;
}

/** 패널 내용 렌더링 */
function renderPanel(fish: Fish): void {
  if (!panel) return;
  const mood = fish.mood;
  const hungerPct = Math.round(fish.hunger);
  const affinityPct = Math.round(fish.affinity);
  const hearts = Math.floor(affinityPct / 20); // 0~5 하트

  const ageMin = Math.floor(fish.age / 60);
  const ageSec = Math.floor(fish.age % 60);
  const ageStr = ageMin > 0 ? `${ageMin}분 ${ageSec}초` : `${ageSec}초`;

  // 수집 아이템
  const collected = collectedItems.filter(it => it.fishName === fish.fishName);
  const itemCounts: Record<string, number> = {};
  for (const it of collected) itemCounts[it.type] = (itemCounts[it.type] || 0) + 1;
  const itemStr = Object.entries(itemCounts)
    .map(([t, c]) => `${t === 'shell' ? '🐚' : t === 'gem' ? '💎' : '⭐'} ×${c}`)
    .join('  ') || '없음';

  panel.innerHTML = `
    <div class="fip-header">
      <span class="fip-name">${esc(fish.fishName)}</span>
      <span class="fip-species">${esc(fish.species.name)}</span>
      <button class="fip-close" id="fip-close-btn">×</button>
    </div>
    <div class="fip-mood" style="color:${MOOD_COLOR[mood]}">${MOOD_LABEL[mood]}</div>
    <div class="fip-row">
      <span class="fip-label">배고픔</span>
      <div class="fip-bar"><div class="fip-bar-fill hunger" style="width:${hungerPct}%"></div></div>
      <span class="fip-val">${hungerPct}</span>
    </div>
    <div class="fip-row">
      <span class="fip-label">친밀도</span>
      <div class="fip-hearts">${'❤️'.repeat(hearts)}${'🤍'.repeat(5 - hearts)}</div>
      <span class="fip-val">${affinityPct}</span>
    </div>
    <div class="fip-row">
      <span class="fip-label">나이</span>
      <span class="fip-val-full">${ageStr}</span>
    </div>
    <div class="fip-row">
      <span class="fip-label">수집품</span>
      <span class="fip-val-full">${itemStr}</span>
    </div>
    <button class="fip-pet-btn" id="fip-pet-btn" ${fish.petCooldown > 0 ? 'disabled' : ''}>
      ${fish.petCooldown > 0 ? `쓰다듬기 (${Math.ceil(fish.petCooldown)}s)` : '🤚 쓰다듬기'}
    </button>
  `;

  document.getElementById('fip-close-btn')?.addEventListener('click', closeFishInfo);
  document.getElementById('fip-pet-btn')?.addEventListener('click', () => {
    if (!currentFish) return;
    currentFish.onPet();
    renderPanel(currentFish);
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 물고기 정보 패널 열기 */
export function openFishInfo(fish: Fish): void {
  ensurePanel();
  currentFish = fish;
  panel!.classList.add('open');
  renderPanel(fish);

  // 실시간 업데이트 (1초마다)
  cancelAnimationFrame(rafId);
  let lastUpdate = 0;
  const tick = (ts: number) => {
    if (ts - lastUpdate > 1000) {
      if (currentFish) renderPanel(currentFish);
      lastUpdate = ts;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

/** 패널 닫기 */
export function closeFishInfo(): void {
  panel?.classList.remove('open');
  currentFish = null;
  cancelAnimationFrame(rafId);
}

/** 현재 열린 물고기 */
export function getCurrentFish(): Fish | null { return currentFish; }
