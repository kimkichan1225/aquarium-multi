// ── 내 물고기 패널 ──

import { TAU } from '@/utils/math';
import { getMyUid, getMyName } from '@/state/store';
import { fishes } from '@/engine/FishManager';
import { emitRemoveFish } from '@/network/socket';

/** 내 물고기 목록 업데이트 */
export function updateMyFishList(): void {
  const list = document.getElementById('my-fish-list');
  if (!list) return;
  const myUid = getMyUid();
  const myName = getMyName();
  // ownerId 또는 ownerName으로 매칭 (닉네임 변경 등 대응)
  const myFish = fishes.filter(f => (f.ownerId === myUid || f.ownerName === myUid || f.ownerName === myName) && !f.temporary);
  list.innerHTML = '';
  if (myFish.length === 0) {
    list.innerHTML = '<div style="color:rgba(140,200,255,0.3);font-size:11px;text-align:center;padding:20px">아직 물고기가 없습니다</div>';
    return;
  }
  for (const f of myFish) {
    const sizePercent = Math.round(
      ((f.size - f.species.sizeRange[0]) / (f.species.sizeRange[1] - f.species.sizeRange[0])) * 100
    );
    const item = document.createElement('div');
    item.className = 'my-fish-item';

    // 썸네일 canvas
    const thumb = document.createElement('canvas');
    thumb.className = 'fish-thumb';
    thumb.width = 120;
    thumb.height = 88;

    const info = document.createElement('div');
    info.className = 'fish-info';
    info.innerHTML = `
      <div class="fname">${f.fishName}</div>
      <div style="color:rgba(140,200,255,0.35);font-size:9px;margin-top:2px">
        ${f.species.name} &middot; 크기 ${sizePercent}%
      </div>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '회수';
    removeBtn.addEventListener('click', () => {
      emitRemoveFish(f.id, myUid);
    });

    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(removeBtn);
    list.appendChild(item);

    // 썸네일 그리기
    const tc = thumb.getContext('2d')!;
    const tw = thumb.width, th = thumb.height;
    const sz = Math.min(tw, th) * 0.32;
    tc.save();
    tc.translate(tw / 2, th / 2);
    if (!f.species.isJellyfish) tc.scale(1, 1);
    f.species.draw(tc, sz, f.palette, 0, 0, 0);
    if (!f.species.isJellyfish && !f.species.customDraw) {
      // 광택
      const shG = tc.createRadialGradient(sz * 0.1, -sz * 0.1, 0, sz * 0.1, -sz * 0.1, sz * 0.25);
      shG.addColorStop(0, 'rgba(255,255,255,0.25)');
      shG.addColorStop(1, 'rgba(255,255,255,0)');
      tc.fillStyle = shG;
      tc.beginPath();
      tc.ellipse(sz * 0.1, -sz * 0.08, sz * 0.2, sz * 0.12, -0.2, 0, Math.PI * 2);
      tc.fill();
      // 눈
      const bw = f.species.bodyW || 0.5;
      const eyeX = sz * (bw - 0.1), eyeY = -sz * 0.06, eyeR = sz * 0.07;
      tc.fillStyle = '#FAFAFA';
      tc.beginPath(); tc.ellipse(eyeX, eyeY, eyeR, eyeR * 0.95, 0, 0, Math.PI * 2); tc.fill();
      tc.fillStyle = '#1A1A2E';
      tc.beginPath(); tc.arc(eyeX + 1, eyeY, eyeR * 0.55, 0, Math.PI * 2); tc.fill();
      tc.fillStyle = 'rgba(255,255,255,0.8)';
      tc.beginPath(); tc.arc(eyeX + eyeR * 0.2, eyeY - eyeR * 0.25, eyeR * 0.25, 0, Math.PI * 2); tc.fill();
    }
    tc.restore();
  }
}

/** 내 물고기 패널 초기화 */
export function initMyFishPanel(): void {
  const myFishPanel = document.getElementById('my-fish-panel')!;

  document.getElementById('btn-my-fish')!.addEventListener('click', () => {
    myFishPanel.classList.toggle('open');
    if (myFishPanel.classList.contains('open')) updateMyFishList();
  });

  document.getElementById('btn-close-fish-panel')!.addEventListener('click', () => {
    myFishPanel.classList.remove('open');
  });
}
