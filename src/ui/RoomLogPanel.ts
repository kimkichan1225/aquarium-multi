// ── 아이템 도감 + 물고기 일기 패널 ──

import { getCollection, getDiary } from '@/engine/RoomLog';
import type { DiaryEntry } from '@/engine/RoomLog';

let panel: HTMLElement | null = null;
let activeTab: 'collection' | 'diary' = 'collection';

const ITEM_ICON: Record<string, string> = {
  shell: '🐚', gem: '💎', starfish: '⭐',
};
const ITEM_NAME: Record<string, string> = {
  shell: '조개', gem: '보석', starfish: '불가사리',
};

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '오늘';
  return `${m}월 ${d}일`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 도감 탭 렌더링 */
function renderCollection(): string {
  const items = getCollection();
  if (items.length === 0) {
    return '<div class="rlog-empty">아직 수집한 아이템이 없어요.<br>물고기들이 바닥에서 찾아올 거예요! 🐠</div>';
  }

  // 종류별 집계
  const counts: Record<string, { count: number; fish: Set<string> }> = {};
  for (const it of items) {
    if (!counts[it.type]) counts[it.type] = { count: 0, fish: new Set() };
    counts[it.type].count++;
    counts[it.type].fish.add(it.fishName);
  }

  const cards = Object.entries(counts).map(([type, data]) => `
    <div class="rlog-item-card">
      <div class="rlog-item-icon">${ITEM_ICON[type]}</div>
      <div class="rlog-item-info">
        <div class="rlog-item-name">${ITEM_NAME[type]}</div>
        <div class="rlog-item-count">×${data.count}</div>
        <div class="rlog-item-fish">수집: ${[...data.fish].map(esc).join(', ')}</div>
      </div>
    </div>
  `).join('');

  // 최근 수집 5개
  const recent = [...items].reverse().slice(0, 5).map(it => `
    <div class="rlog-recent-row">
      <span>${ITEM_ICON[it.type]}</span>
      <span>${esc(it.fishName)}</span>
      <span class="rlog-time">${formatTime(it.collectedAt)}</span>
    </div>
  `).join('');

  return `
    <div class="rlog-section-title">보유 아이템</div>
    <div class="rlog-item-grid">${cards}</div>
    <div class="rlog-section-title">최근 수집</div>
    <div class="rlog-recent">${recent}</div>
  `;
}

/** 일기 탭 렌더링 */
function renderDiary(): string {
  const entries = getDiary();
  if (entries.length === 0) {
    return '<div class="rlog-empty">아직 기록이 없어요.<br>물고기에게 먹이를 주거나 아이템을 수집해 보세요! 🐡</div>';
  }

  return entries.map((entry: DiaryEntry) => {
    const itemSummary = (() => {
      if (entry.collected.length === 0) return '없음';
      const c: Record<string, number> = {};
      for (const it of entry.collected) c[it.type] = (c[it.type] || 0) + 1;
      return Object.entries(c).map(([t, n]) => `${ITEM_ICON[t]}×${n}`).join(' ');
    })();

    const note = entry.feedCount === 0
      ? '먹이를 주지 못했어요 😢'
      : entry.feedCount < 3
        ? `${entry.feedCount}번 먹이를 줬어요 😊`
        : `${entry.feedCount}번이나 먹이를 줬어요! 🐟✨`;

    return `
      <div class="rlog-diary-entry">
        <div class="rlog-diary-date">${formatDate(entry.date)}</div>
        <div class="rlog-diary-note">${note}</div>
        <div class="rlog-diary-row">
          <span class="rlog-diary-label">먹이</span>
          <span>${entry.feedCount}회</span>
        </div>
        <div class="rlog-diary-row">
          <span class="rlog-diary-label">수집</span>
          <span>${itemSummary}</span>
        </div>
      </div>
    `;
  }).join('');
}

function render(): void {
  if (!panel) return;
  const isCollection = activeTab === 'collection';
  panel.innerHTML = `
    <div class="rlog-header">
      <div class="rlog-tabs">
        <button class="rlog-tab ${isCollection ? 'active' : ''}" data-tab="collection">🐚 도감</button>
        <button class="rlog-tab ${!isCollection ? 'active' : ''}" data-tab="diary">📔 일기</button>
      </div>
      <button class="rlog-close" id="rlog-close">×</button>
    </div>
    <div class="rlog-body">
      ${isCollection ? renderCollection() : renderDiary()}
    </div>
  `;

  panel.querySelectorAll('.rlog-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = (btn as HTMLElement).dataset.tab as any;
      render();
    });
  });
  document.getElementById('rlog-close')?.addEventListener('click', closeRoomLog);
}

export function openRoomLog(): void {
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'room-log-panel';
    document.body.appendChild(panel);
    document.addEventListener('mousedown', (e) => {
      if (panel && !panel.contains(e.target as Node)) {
        const btn = (e.target as HTMLElement).closest('#btn-room-log');
        if (!btn) closeRoomLog();
      }
    });
  }
  panel.classList.add('open');
  render();
}

export function closeRoomLog(): void {
  panel?.classList.remove('open');
}

export function toggleRoomLog(): void {
  if (panel?.classList.contains('open')) closeRoomLog();
  else openRoomLog();
}
