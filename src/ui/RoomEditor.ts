// ── 방 꾸미기 에디터 ──

import {
  getEditMode, setEditMode,
  getCurrentRoom, getIsRoomOwner,
  getCurrentTheme, setCurrentTheme,
} from '@/state/store';
import { THEMES } from '@/config/themes';
import { seaweeds, corals } from '@/engine/Environment';
import { getCtx, getCanvas, invalidateBgCache } from '@/engine/Renderer';
import { Seaweed } from '@/entities/Seaweed';
import { Coral } from '@/entities/Coral';
import { getW, getH } from '@/state/store';
import { saveDecorations, updateRoom } from '@/network/api';
import { showToast } from './Toast';
import type { Decoration } from '@/engine/router';

// 에디터 상태
let selectedDecoType: 'seaweed' | 'coral' | null = null;
let decorations: Decoration[] = [];
let editorTheme: number = 0;

/** 에디터 패널 닫기 */
export function closeEditor(): void {
  setEditMode(false);
  selectedDecoType = null;
  const panel = document.getElementById('room-editor-panel');
  if (panel) panel.classList.remove('open');
  const cv = getCanvas();
  if (cv) cv.classList.remove('edit-mode');
}

/** 에디터 패널 열기 */
export function openEditor(): void {
  if (!getIsRoomOwner()) {
    showToast('방 주인만 꾸밀 수 있습니다');
    return;
  }
  setEditMode(true);
  selectedDecoType = null;
  editorTheme = getCurrentTheme();

  // 현재 장식물 상태를 데코레이션 목록으로 변환
  syncDecorationsFromEnvironment();

  // 테마 선택기 렌더
  renderThemeSelector();
  // 장식물 목록 렌더
  renderDecoList();
  // 버튼 상태 초기화
  updateDecoButtons();

  const panel = document.getElementById('room-editor-panel');
  if (panel) panel.classList.add('open');
  const cv = getCanvas();
  if (cv) cv.classList.add('edit-mode');
}

/** 현재 환경에서 장식물 목록 동기화 */
function syncDecorationsFromEnvironment(): void {
  const W = getW();
  decorations = [];

  for (const sw of seaweeds) {
    decorations.push({
      type: 'seaweed',
      x: sw.x / W,
      size: 1,
      variant: 0,
      color1: sw.color1,
      color2: sw.color2,
    });
  }

  for (const co of corals) {
    decorations.push({
      type: 'coral',
      x: co.x / W,
      size: 1,
      variant: co.type,
    });
  }
}

/** 테마 선택기 렌더링 */
function renderThemeSelector(): void {
  const container = document.getElementById('theme-selector');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < THEMES.length; i++) {
    const card = document.createElement('div');
    card.className = 'theme-card' + (i === editorTheme ? ' active' : '');
    card.textContent = THEMES[i].name;
    card.addEventListener('click', () => {
      editorTheme = i;
      setCurrentTheme(i);
      invalidateBgCache();
      renderThemeSelector();
    });
    container.appendChild(card);
  }
}

/** 장식물 목록 렌더링 */
function renderDecoList(): void {
  const list = document.getElementById('deco-list');
  if (!list) return;
  list.innerHTML = '';

  if (decorations.length === 0) {
    list.innerHTML = '<div style="color:rgba(140,200,255,0.3);font-size:10px;text-align:center;padding:10px">장식물이 없습니다</div>';
    return;
  }

  for (let i = 0; i < decorations.length; i++) {
    const d = decorations[i];
    const item = document.createElement('div');
    item.className = 'deco-item';

    const label = document.createElement('span');
    label.textContent = d.type === 'seaweed' ? `수초 #${i + 1}` : `산호 #${i + 1}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'deco-remove';
    removeBtn.textContent = '삭제';
    removeBtn.addEventListener('click', () => {
      decorations.splice(i, 1);
      applyDecorationsToEnvironment();
      renderDecoList();
    });

    item.appendChild(label);
    item.appendChild(removeBtn);
    list.appendChild(item);
  }
}

/** 장식물 버튼 상태 업데이트 */
function updateDecoButtons(): void {
  const btnSeaweed = document.getElementById('btn-add-seaweed');
  const btnCoral = document.getElementById('btn-add-coral');
  if (btnSeaweed) {
    btnSeaweed.classList.toggle('selected', selectedDecoType === 'seaweed');
  }
  if (btnCoral) {
    btnCoral.classList.toggle('selected', selectedDecoType === 'coral');
  }
}

/** 장식물 데이터를 환경에 반영 */
function applyDecorationsToEnvironment(): void {
  const ctx = getCtx();
  const W = getW();

  seaweeds.length = 0;
  corals.length = 0;

  for (const d of decorations) {
    const px = d.x * W;
    if (d.type === 'seaweed') {
      const sw = new Seaweed(px, ctx);
      sw.segLen *= d.size;
      sw.width *= d.size;
      if (d.color1) sw.color1 = d.color1;
      if (d.color2) sw.color2 = d.color2;
      seaweeds.push(sw);
    } else if (d.type === 'coral') {
      const co = new Coral(px);
      co.size *= d.size;
      co.type = d.variant;
      corals.push(co);
    }
  }
}

/** 캔버스 클릭 시 장식물 배치 처리 */
function handleCanvasClick(e: MouseEvent): void {
  if (!getEditMode() || !selectedDecoType) return;

  const target = e.target as HTMLElement;
  // UI 요소 클릭은 무시
  if (target.closest('#top-bar,#bottom-bar,#room-editor-panel,#creator-overlay,#my-fish-panel,#chat-panel,#chat-floating-btn')) return;

  const W = getW();
  const x = e.clientX / W;

  const newDeco: Decoration = {
    type: selectedDecoType,
    x,
    size: 1,
    variant: selectedDecoType === 'coral' ? Math.floor(Math.random() * 3) : 0,
  };

  decorations.push(newDeco);
  applyDecorationsToEnvironment();
  renderDecoList();

  // 배치 후 선택 해제
  selectedDecoType = null;
  updateDecoButtons();
}

/** 저장 */
async function handleSave(): Promise<void> {
  const room = getCurrentRoom();
  if (!room) return;

  try {
    // 테마 저장
    await updateRoom(room, { theme: editorTheme });
    // 장식물 저장
    await saveDecorations(room, decorations);
    showToast('방이 저장되었습니다');
    closeEditor();
  } catch {
    showToast('저장에 실패했습니다');
  }
}

/** 에디터 초기화 */
export function initRoomEditor(): void {
  // 닫기 버튼
  document.getElementById('btn-close-editor')?.addEventListener('click', closeEditor);

  // 꾸미기 버튼 (상단바)
  document.getElementById('btn-edit-room')?.addEventListener('click', openEditor);

  // 수초 추가 버튼
  document.getElementById('btn-add-seaweed')?.addEventListener('click', () => {
    if (!getEditMode()) return;
    selectedDecoType = selectedDecoType === 'seaweed' ? null : 'seaweed';
    updateDecoButtons();
  });

  // 산호 추가 버튼
  document.getElementById('btn-add-coral')?.addEventListener('click', () => {
    if (!getEditMode()) return;
    selectedDecoType = selectedDecoType === 'coral' ? null : 'coral';
    updateDecoButtons();
  });

  // 저장 버튼
  document.getElementById('btn-save-room')?.addEventListener('click', handleSave);

  // 캔버스 클릭으로 장식물 배치 (캡처 단계에서 먹이주기보다 먼저 처리)
  addEventListener('click', handleCanvasClick, true);
}
