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
import { getW } from '@/state/store';
import { saveDecorations, updateRoom } from '@/network/api';
import { showToast } from './Toast';
import { rand, pick } from '@/utils/math';
import type { Decoration } from '@/engine/router';

// ── 색상 프리셋 ──
const SEAWEED_COLOR1_PRESETS = ['#1B5E20', '#2E7D32', '#388E3C', '#0D4A0D', '#145A32', '#004D40', '#01579B', '#4A148C'];
const SEAWEED_COLOR2_PRESETS = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#26C6DA', '#80DEEA', '#CE93D8', '#F48FB1'];
const CORAL_COLOR_PRESETS    = ['#FF6B6B', '#EE5A24', '#F8B500', '#6C5CE7', '#E056A0', '#00B894', '#FDA7DF', '#0984E3', '#00CEC9', '#FDCB6E'];

// 에디터 상태
let selectedDecoType: 'seaweed' | 'coral' | null = null;
let decorations: Decoration[] = [];
let editorTheme: number = 0;
let decorationsReady = false;

/** 외부(router)에서 방 장식물 데이터를 주입 */
export function setEditorDecorations(decs: Decoration[]): void {
  decorations = decs.map(d => ({ ...d }));
  decorationsReady = true;
}

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

  // 장식물 데이터가 없을 때만 환경에서 동기화 (폴백)
  if (!decorationsReady) {
    syncDecorationsFromEnvironment();
  }

  renderThemeSelector();
  renderDecoList();
  updateDecoButtons();

  const panel = document.getElementById('room-editor-panel');
  if (panel) panel.classList.add('open');
  const cv = getCanvas();
  if (cv) cv.classList.add('edit-mode');
}

/** 환경에서 장식물 목록 동기화 (폴백용) */
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
      baseSegments: sw.segments,
      baseSegLen: sw.segLen,
      baseWidth: sw.width,
    });
  }

  for (const co of corals) {
    decorations.push({
      type: 'coral',
      x: co.x / W,
      size: 1,
      variant: co.type,
      coralColor: co.color,
      baseSize: co.size,
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
    list.appendChild(createDecoItem(i));
  }
}

/** 장식물 항목 생성 (편집 패널 포함) */
function createDecoItem(i: number): HTMLElement {
  const d = decorations[i];
  const item = document.createElement('div');
  item.className = 'deco-item-wrap';

  // 헤더 행
  const header = document.createElement('div');
  header.className = 'deco-item';

  const label = document.createElement('span');
  label.textContent = d.type === 'seaweed' ? `수초 #${i + 1}` : `산호 #${i + 1}`;

  const btnGroup = document.createElement('div');
  btnGroup.style.cssText = 'display:flex;gap:4px';

  const editBtn = document.createElement('button');
  editBtn.className = 'deco-edit';
  editBtn.textContent = '편집';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'deco-remove';
  removeBtn.textContent = '삭제';
  removeBtn.addEventListener('click', () => {
    decorations.splice(i, 1);
    applyDecorationsToEnvironment();
    renderDecoList();
  });

  btnGroup.appendChild(editBtn);
  btnGroup.appendChild(removeBtn);
  header.appendChild(label);
  header.appendChild(btnGroup);

  // 속성 패널
  const propsPanel = document.createElement('div');
  propsPanel.className = 'deco-props';

  renderDecoProps(i, propsPanel);

  editBtn.addEventListener('click', () => {
    const isOpen = propsPanel.classList.contains('open');
    // 다른 패널 닫기
    document.querySelectorAll('.deco-props.open').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.deco-edit.active').forEach(el => el.classList.remove('active'));
    if (!isOpen) {
      propsPanel.classList.add('open');
      editBtn.classList.add('active');
    }
  });

  item.appendChild(header);
  item.appendChild(propsPanel);
  return item;
}

/** 장식물 속성 패널 렌더링 */
function renderDecoProps(i: number, container: HTMLElement): void {
  const d = decorations[i];
  container.innerHTML = '';

  // 크기 슬라이더
  const sizeRow = document.createElement('div');
  sizeRow.className = 'prop-row';

  const sizeLabel = document.createElement('span');
  sizeLabel.className = 'prop-label';
  sizeLabel.textContent = '크기';

  const sizeInput = document.createElement('input');
  sizeInput.type = 'range';
  sizeInput.className = 'prop-slider';
  sizeInput.min = '0.3';
  sizeInput.max = '2.5';
  sizeInput.step = '0.1';
  sizeInput.value = String(d.size);

  const sizeValue = document.createElement('span');
  sizeValue.className = 'prop-value';
  sizeValue.textContent = `${d.size.toFixed(1)}×`;

  sizeInput.addEventListener('input', () => {
    d.size = parseFloat(sizeInput.value);
    sizeValue.textContent = `${d.size.toFixed(1)}×`;
    applyDecorationsToEnvironment();
  });

  sizeRow.appendChild(sizeLabel);
  sizeRow.appendChild(sizeInput);
  sizeRow.appendChild(sizeValue);
  container.appendChild(sizeRow);

  if (d.type === 'seaweed') {
    renderColorRow(container, '색상1', SEAWEED_COLOR1_PRESETS, d.color1 ?? '#2E7D32', (c) => {
      d.color1 = c;
      applyDecorationsToEnvironment();
    });
    renderColorRow(container, '색상2', SEAWEED_COLOR2_PRESETS, d.color2 ?? '#4CAF50', (c) => {
      d.color2 = c;
      applyDecorationsToEnvironment();
    });
  } else {
    // 산호 종류 선택
    const variantRow = document.createElement('div');
    variantRow.className = 'prop-row';

    const variantLabel = document.createElement('span');
    variantLabel.className = 'prop-label';
    variantLabel.textContent = '종류';

    const variantBtns = document.createElement('div');
    variantBtns.style.cssText = 'display:flex;gap:4px;flex:1';

    const variantNames = ['가지형', '버섯형', '튜브형'];
    for (let v = 0; v < 3; v++) {
      const vBtn = document.createElement('button');
      vBtn.className = 'variant-btn' + (d.variant === v ? ' active' : '');
      vBtn.textContent = variantNames[v];
      const vIdx = v;
      vBtn.addEventListener('click', () => {
        d.variant = vIdx;
        variantBtns.querySelectorAll('.variant-btn').forEach((b, bi) => {
          b.classList.toggle('active', bi === vIdx);
        });
        applyDecorationsToEnvironment();
      });
      variantBtns.appendChild(vBtn);
    }

    variantRow.appendChild(variantLabel);
    variantRow.appendChild(variantBtns);
    container.appendChild(variantRow);

    renderColorRow(container, '색상', CORAL_COLOR_PRESETS, d.coralColor ?? '#FF6B6B', (c) => {
      d.coralColor = c;
      applyDecorationsToEnvironment();
    });
  }
}

/** 색상 선택 행 렌더링 */
function renderColorRow(
  container: HTMLElement,
  label: string,
  presets: string[],
  current: string,
  onChange: (color: string) => void
): void {
  const row = document.createElement('div');
  row.className = 'prop-row';

  const lbl = document.createElement('span');
  lbl.className = 'prop-label';
  lbl.textContent = label;

  const swatchGroup = document.createElement('div');
  swatchGroup.style.cssText = 'display:flex;gap:3px;flex-wrap:wrap;flex:1;align-items:center';

  for (const color of presets) {
    const swatch = document.createElement('button');
    swatch.className = 'color-swatch' + (color.toLowerCase() === current.toLowerCase() ? ' active' : '');
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener('click', () => {
      swatchGroup.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      onChange(color);
    });
    swatchGroup.appendChild(swatch);
  }

  // 커스텀 컬러 피커
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.className = 'custom-color-picker';
  picker.value = current;
  picker.title = '직접 선택';
  picker.addEventListener('input', () => {
    swatchGroup.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    onChange(picker.value);
  });
  swatchGroup.appendChild(picker);

  row.appendChild(lbl);
  row.appendChild(swatchGroup);
  container.appendChild(row);
}

/** 장식물 버튼 상태 업데이트 */
function updateDecoButtons(): void {
  const btnSeaweed = document.getElementById('btn-add-seaweed');
  const btnCoral = document.getElementById('btn-add-coral');
  if (btnSeaweed) btnSeaweed.classList.toggle('selected', selectedDecoType === 'seaweed');
  if (btnCoral)   btnCoral.classList.toggle('selected', selectedDecoType === 'coral');
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
      const sw = new Seaweed(px, ctx, {
        segments: d.baseSegments,
        segLen: d.baseSegLen != null ? d.baseSegLen * d.size : undefined,
        width:   d.baseWidth  != null ? d.baseWidth  * d.size : undefined,
        color1: d.color1,
        color2: d.color2,
      });
      seaweeds.push(sw);
    } else if (d.type === 'coral') {
      const co = new Coral(px, {
        type:  d.variant,
        size:  d.baseSize != null ? d.baseSize * d.size : undefined,
        color: d.coralColor,
      });
      corals.push(co);
    }
  }
}

/** 캔버스 클릭 시 장식물 배치 처리 */
function handleCanvasClick(e: MouseEvent): void {
  if (!getEditMode() || !selectedDecoType) return;

  const target = e.target as HTMLElement;
  if (target.closest('#top-bar,#bottom-bar,#room-editor-panel,#creator-overlay,#my-fish-panel,#chat-panel,#chat-floating-btn')) return;

  const W = getW();
  const x = e.clientX / W;

  let newDeco: Decoration;

  if (selectedDecoType === 'seaweed') {
    const baseSegments = Math.floor(rand(6, 14));
    const baseSegLen   = rand(14, 25);
    const baseWidth    = rand(4, 10);
    newDeco = {
      type: 'seaweed',
      x,
      size: 1,
      variant: 0,
      color1: pick(SEAWEED_COLOR1_PRESETS),
      color2: pick(SEAWEED_COLOR2_PRESETS),
      baseSegments,
      baseSegLen,
      baseWidth,
    };
  } else {
    const baseSize = rand(25, 55);
    newDeco = {
      type: 'coral',
      x,
      size: 1,
      variant: Math.floor(rand(0, 3)),
      coralColor: pick(CORAL_COLOR_PRESETS),
      baseSize,
    };
  }

  decorations.push(newDeco);
  applyDecorationsToEnvironment();
  renderDecoList();

  // 새로 추가된 항목의 편집 패널 자동 열기
  const items = document.querySelectorAll('.deco-item-wrap');
  const lastItem = items[items.length - 1];
  if (lastItem) {
    const propsPanel = lastItem.querySelector('.deco-props') as HTMLElement;
    const editBtn    = lastItem.querySelector('.deco-edit') as HTMLElement;
    if (propsPanel && editBtn) {
      propsPanel.classList.add('open');
      editBtn.classList.add('active');
    }
  }

  selectedDecoType = null;
  updateDecoButtons();
}

/** 저장 */
async function handleSave(): Promise<void> {
  const room = getCurrentRoom();
  if (!room) return;

  try {
    await updateRoom(room, { theme: editorTheme });
    await saveDecorations(room, decorations);
    showToast('방이 저장되었습니다');
    closeEditor();
  } catch {
    showToast('저장에 실패했습니다');
  }
}

/** 에디터 초기화 */
export function initRoomEditor(): void {
  document.getElementById('btn-close-editor')?.addEventListener('click', closeEditor);
  document.getElementById('btn-edit-room')?.addEventListener('click', openEditor);

  document.getElementById('btn-add-seaweed')?.addEventListener('click', () => {
    if (!getEditMode()) return;
    selectedDecoType = selectedDecoType === 'seaweed' ? null : 'seaweed';
    updateDecoButtons();
  });

  document.getElementById('btn-add-coral')?.addEventListener('click', () => {
    if (!getEditMode()) return;
    selectedDecoType = selectedDecoType === 'coral' ? null : 'coral';
    updateDecoButtons();
  });

  document.getElementById('btn-save-room')?.addEventListener('click', handleSave);

  addEventListener('click', handleCanvasClick, true);
}
