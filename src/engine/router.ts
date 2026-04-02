// ── 해시 기반 라우터 (로비 / 개인 방 전환) ──

import {
  getCurrentRoom, setCurrentRoom,
  setIsRoomOwner, setEditMode,
  getLoggedNickname, isLoggedIn,
  setCurrentTheme, setNightMode,
} from '@/state/store';
import { emitJoinRoom } from '@/network/socket';
import { getRoom, createRoom } from '@/network/api';
import { seaweeds, corals, initEnvironment } from './Environment';
import { getCtx } from './Renderer';
import { invalidateBgCache } from './Renderer';
import { showToast } from '@/ui/Toast';
import { closeEditor } from '@/ui/RoomEditor';
import { Seaweed } from '@/entities/Seaweed';
import { Coral } from '@/entities/Coral';
import { getW, getH } from '@/state/store';

/** 라우터 초기화 */
export function initRouter(): void {
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // 초기 라우트
}

/** 해시 변경 처리 */
function handleRoute(): void {
  const hash = location.hash;
  if (hash.startsWith('#room/')) {
    const nickname = decodeURIComponent(hash.slice(6));
    enterRoom(nickname);
  } else {
    enterLobby();
  }
}

/** 개인 방으로 이동 */
export function navigateToRoom(nickname: string): void {
  location.hash = `#room/${encodeURIComponent(nickname)}`;
}

/** 로비로 이동 */
export function navigateToLobby(): void {
  location.hash = '';
}

/** 개인 방 입장 */
async function enterRoom(nickname: string): Promise<void> {
  setCurrentRoom(nickname);

  // 방 주인 여부 판단
  const myNick = getLoggedNickname();
  const owner = isLoggedIn() && myNick === nickname;
  setIsRoomOwner(owner);
  setEditMode(false);

  // 에디터 닫기
  closeEditor();

  // 방 주인이면 방이 없을 때 자동 생성
  if (owner) {
    try {
      const roomCheck = await getRoom(nickname);
      if (!roomCheck || roomCheck.ok === false) {
        await createRoom(nickname);
      }
    } catch { /* 무시 */ }
  }

  // 소켓으로 방 참가
  emitJoinRoom(nickname);

  // 개인 방은 기본 수초/산호 없이 시작 (장식물 데이터로 대체)
  seaweeds.length = 0;
  corals.length = 0;

  // 상단바 방 정보 표시
  const roomInfo = document.getElementById('room-info');
  const roomName = document.getElementById('room-name');
  const btnEditRoom = document.getElementById('btn-edit-room');
  const titleEl = document.querySelector('#top-bar h1') as HTMLElement;

  if (roomInfo) roomInfo.style.display = 'flex';
  if (roomName) roomName.textContent = `${nickname}의 방`;
  if (btnEditRoom) btnEditRoom.style.display = owner ? 'inline-block' : 'none';
  if (titleEl) titleEl.textContent = `${nickname}의 아쿠아리움`;
  document.getElementById('top-bar')?.classList.add('in-room');

  // 하단바 "로비로" 버튼 표시
  const btnToLobby = document.getElementById('btn-to-lobby');
  if (btnToLobby) btnToLobby.style.display = 'inline-block';

  // 방 정보 API 호출 (테마, 야간모드, 장식물)
  try {
    const roomData = await getRoom(nickname);
    if (roomData && roomData.ok !== false) {
      // 테마 적용
      if (typeof roomData.theme === 'number') {
        setCurrentTheme(roomData.theme);
        invalidateBgCache();
      }
      // 야간모드 적용
      if (typeof roomData.nightMode === 'boolean') {
        setNightMode(roomData.nightMode);
        invalidateBgCache();
      }
      // 장식물 적용
      if (Array.isArray(roomData.decorations)) {
        applyDecorations(roomData.decorations);
      }
    }
  } catch {
    // API 실패 시 기본 환경 유지
  }
}

/** 로비 입장 */
function enterLobby(): void {
  setCurrentRoom(null);
  setIsRoomOwner(false);
  setEditMode(false);

  // 에디터 닫기
  closeEditor();

  // 소켓으로 로비 참가
  emitJoinRoom(null);

  // 상단바 복원
  const roomInfo = document.getElementById('room-info');
  const titleEl = document.querySelector('#top-bar h1') as HTMLElement;

  if (roomInfo) roomInfo.style.display = 'none';
  if (titleEl) titleEl.textContent = 'MULTI AQUARIUM';
  document.getElementById('top-bar')?.classList.remove('in-room');

  // 하단바 "로비로" 버튼 숨김
  const btnToLobby = document.getElementById('btn-to-lobby');
  if (btnToLobby) btnToLobby.style.display = 'none';

  // 기본 환경 복원
  const ctx = getCtx();
  if (ctx) initEnvironment(ctx);
  invalidateBgCache();
}

/** 장식물 데이터를 환경에 적용 */
export interface Decoration {
  id?: number;
  type: 'seaweed' | 'coral';
  x: number;        // 0~1 비율
  size: number;      // 크기 배율
  variant: number;   // 종류 변형 (0~2)
  color1?: string;
  color2?: string;
}

export function applyDecorations(decorations: Decoration[]): void {
  const ctx = getCtx();
  const W = getW();
  const H = getH();

  seaweeds.length = 0;
  corals.length = 0;

  for (const d of decorations) {
    const px = d.x * W;
    if (d.type === 'seaweed') {
      const sw = new Seaweed(px, ctx);
      // 크기 배율 적용
      sw.segLen *= d.size;
      sw.width *= d.size;
      if (d.color1) sw.color1 = d.color1;
      if (d.color2) sw.color2 = d.color2;
      seaweeds.push(sw);
    } else if (d.type === 'coral') {
      const co = new Coral(px);
      co.size *= d.size;
      co.type = d.variant;
      seaweeds; // 산호 타입 재설정 시 branches 재생성은 생략 (기본 렌더)
      corals.push(co);
    }
  }
}
