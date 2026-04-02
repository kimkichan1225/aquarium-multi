// ── 물고기 만들기 패널 ──

import { rand, TAU } from '@/utils/math';
import {
  getW, getH, getTime,
  getMyUid, getMyName, setMyName,
  isLoggedIn, getLoggedNickname,
} from '@/state/store';
import { SPECIES } from '@/config/species';
import { emitAddFish } from '@/network/socket';
import { showToast } from './Toast';
import type { FishColors } from '@/types';

let creatorOverlay: HTMLElement;
let selectedSpecies = 0;
let previewCtx: CanvasRenderingContext2D;
let previewIntervalId: number;

/** 현재 색상 피커 값 가져오기 */
function getCustomColors(): FishColors {
  return {
    body: (document.getElementById('color-body') as HTMLInputElement).value,
    fin: (document.getElementById('color-fin') as HTMLInputElement).value,
    belly: (document.getElementById('color-belly') as HTMLInputElement).value,
    accent: (document.getElementById('color-accent') as HTMLInputElement).value,
  };
}

/** 미리보기 업데이트 */
function updatePreview(): void {
  const pCtx = previewCtx;
  const pw = 220, ph = 180;
  pCtx.clearRect(0, 0, pw, ph);
  // 배경
  const bg = pCtx.createLinearGradient(0, 0, 0, ph);
  bg.addColorStop(0, '#041828'); bg.addColorStop(1, '#0A3050');
  pCtx.fillStyle = bg; pCtx.fillRect(0, 0, pw, ph);

  pCtx.save();
  pCtx.translate(pw / 2, ph / 2);
  pCtx.globalAlpha = 0.95;
  const sp = SPECIES[selectedSpecies];
  const sizeVal = parseInt((document.getElementById('input-size') as HTMLInputElement).value);
  const sz = 20 + (sizeVal / 100) * 35;
  const colors = getCustomColors();
  const t = getTime();
  const tw = Math.sin(t * 4) * 0.3;
  const fw = Math.sin(t * 3) * 0.2;
  sp.draw(pCtx, sz, colors, tw, fw, t);
  // 눈 (일반 물고기만)
  if (!sp.isJellyfish && !sp.customDraw) {
    const bw = sp.bodyW || 0.5;
    const eyeX = sz * (bw - 0.1), eyeY = -sz * 0.06, eyeR = sz * 0.07;
    pCtx.fillStyle = '#FAFAFA';
    pCtx.beginPath(); pCtx.ellipse(eyeX, eyeY, eyeR, eyeR * 0.95, 0, 0, TAU); pCtx.fill();
    pCtx.fillStyle = '#1A1A2E';
    pCtx.beginPath(); pCtx.arc(eyeX + 1, eyeY, eyeR * 0.55, 0, TAU); pCtx.fill();
    pCtx.fillStyle = 'rgba(255,255,255,0.8)';
    pCtx.beginPath(); pCtx.arc(eyeX + eyeR * 0.2, eyeY - eyeR * 0.25, eyeR * 0.25, 0, TAU); pCtx.fill();
  }
  pCtx.restore();

  // 종 이름 업데이트
  document.getElementById('preview-species-name')!.textContent = sp.name;
}

/** 물고기 만들기 패널 초기화 */
export function initCreatorPanel(): void {
  creatorOverlay = document.getElementById('creator-overlay')!;
  const speciesGrid = document.getElementById('species-grid')!;
  const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
  previewCtx = previewCanvas.getContext('2d')!;

  // 종 선택 카드 생성
  SPECIES.forEach((sp, idx) => {
    const card = document.createElement('div');
    card.className = 'species-card' + (idx === 0 ? ' selected' : '');
    const miniCv = document.createElement('canvas');
    miniCv.width = 64; miniCv.height = 48;
    card.appendChild(miniCv);
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = sp.name;
    card.appendChild(nameEl);
    card.addEventListener('click', () => {
      document.querySelectorAll('.species-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedSpecies = idx;
      // 기본 색상 세팅
      const dc = sp.defaultColors;
      (document.getElementById('color-body') as HTMLInputElement).value = dc.body.slice(0, 7);
      (document.getElementById('color-fin') as HTMLInputElement).value = dc.fin.slice(0, 7);
      (document.getElementById('color-belly') as HTMLInputElement).value = dc.belly.slice(0, 7);
      (document.getElementById('color-accent') as HTMLInputElement).value = (dc.accent || '#FFFFFF').slice(0, 7);
      updatePreview();
    });
    speciesGrid.appendChild(card);

    // 미니 캔버스에 물고기 그리기
    const mCtx = miniCv.getContext('2d')!;
    mCtx.save();
    mCtx.translate(36, 24);
    mCtx.scale(1, 1);
    mCtx.globalAlpha = 0.9;
    const sz = 20;
    sp.draw(mCtx, sz, sp.defaultColors, 0, 0, 0);
    // 눈 (일반 물고기만)
    if (!sp.isJellyfish && !sp.customDraw) {
      const bw = sp.bodyW || 0.5;
      const eyeX = sz * (bw - 0.1), eyeY = -sz * 0.06, eyeR = sz * 0.07;
      mCtx.fillStyle = '#FAFAFA';
      mCtx.beginPath(); mCtx.ellipse(eyeX, eyeY, eyeR, eyeR * 0.95, 0, 0, TAU); mCtx.fill();
      mCtx.fillStyle = '#1A1A2E';
      mCtx.beginPath(); mCtx.arc(eyeX + 1, eyeY, eyeR * 0.55, 0, TAU); mCtx.fill();
    }
    mCtx.restore();
  });

  // 프리뷰 애니메이션
  previewIntervalId = window.setInterval(updatePreview, 100);

  // 색상 변경 시 프리뷰 업데이트
  document.querySelectorAll('.color-pick input').forEach(el => {
    el.addEventListener('input', updatePreview);
  });

  document.getElementById('input-size')!.addEventListener('input', (e) => {
    document.getElementById('size-value')!.textContent = (e.target as HTMLInputElement).value;
    updatePreview();
  });

  // 열기
  document.getElementById('btn-create')!.addEventListener('click', () => {
    creatorOverlay.classList.add('open');
    const ownerInput = document.getElementById('input-owner') as HTMLInputElement;
    if (isLoggedIn()) {
      ownerInput.value = getLoggedNickname();
      ownerInput.readOnly = true;
      ownerInput.style.opacity = '0.5';
    } else {
      const name = getMyName();
      if (name) ownerInput.value = name;
      ownerInput.readOnly = false;
      ownerInput.style.opacity = '1';
    }
    // 기본 색상 세팅
    const dc = SPECIES[selectedSpecies].defaultColors;
    (document.getElementById('color-body') as HTMLInputElement).value = dc.body.slice(0, 7);
    (document.getElementById('color-fin') as HTMLInputElement).value = dc.fin.slice(0, 7);
    (document.getElementById('color-belly') as HTMLInputElement).value = dc.belly.slice(0, 7);
    (document.getElementById('color-accent') as HTMLInputElement).value = (dc.accent || '#FFFFFF').slice(0, 7);
  });

  // 취소
  document.getElementById('btn-cancel')!.addEventListener('click', () => {
    creatorOverlay.classList.remove('open');
  });

  // 오버레이 클릭으로 닫기
  creatorOverlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === creatorOverlay || (target === document.getElementById('creator-wrapper') && !target.closest('#creator,#preview-side'))) {
      creatorOverlay.classList.remove('open');
    }
  });

  // 제출
  document.getElementById('btn-submit')!.addEventListener('click', () => {
    const W = getW();
    const H = getH();
    const ownerName = (document.getElementById('input-owner') as HTMLInputElement).value.trim() || '익명';
    const fishName = (document.getElementById('input-fishname') as HTMLInputElement).value.trim() || SPECIES[selectedSpecies].name;
    setMyName(ownerName);

    // 슬라이더 값(0~100)을 종의 sizeRange에 매핑
    const sp = SPECIES[selectedSpecies];
    const sr = sp.sizeRange;
    const sizeVal = parseInt((document.getElementById('input-size') as HTMLInputElement).value);
    const fishSize = sr[0] + (sr[1] - sr[0]) * (sizeVal / 100);

    emitAddFish({
      uid: getMyUid(),
      ownerName,
      name: fishName,
      speciesIdx: selectedSpecies,
      customColors: getCustomColors(),
      size: fishSize,
      z: 1.0,
      x: rand(100, W - 100),
      y: rand(120, H - 200),
      dir: Math.random() > 0.5 ? 1 : -1,
      loggedIn: isLoggedIn(),
    });

    creatorOverlay.classList.remove('open');
    (document.getElementById('input-fishname') as HTMLInputElement).value = '';
    showToast(`"${fishName}" 을(를) 수조에 넣었습니다!`);
  });
}
