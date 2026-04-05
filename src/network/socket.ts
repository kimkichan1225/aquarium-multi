// ── Socket.IO 연결 및 이벤트 핸들러 ──

import { io, Socket } from 'socket.io-client';
import {
  getW, getH,
  getMyUid, getMyName,
  getCurrentRoom,
} from '@/state/store';
import { Fish } from '@/entities/Fish';
import { Food } from '@/entities/Food';
import {
  fishById, addFish, removeFish, clearAllFish,
} from '@/engine/FishManager';
import { foods, remoteCursors } from '@/engine/Renderer';
import { addChatMessage, handleChatHistory, addInviteCard, removeChatMessage } from '@/ui/ChatPanel';
import { updateMyFishList } from '@/ui/MyFishPanel';
import { rand } from '@/utils/math';
import type { FishColors } from '@/types';

let socket: Socket;

/** 소켓 인스턴스 (외부 접근용) */
export function getSocket(): Socket { return socket; }

// ── 커서 전송 쓰로틀 (100ms) ──
let lastCursorSend = 0;

export function sendCursor(x: number, y: number): void {
  const now = Date.now();
  const W = getW();
  const H = getH();
  if (now - lastCursorSend > 100) {
    socket.emit('cursor', { x: x / W, y: y / H, name: getMyName() || '익명' });
    lastCursorSend = now;
  }
}

// ── emit 헬퍼 함수들 ──

export function emitAddFish(data: {
  uid: string;
  ownerName: string;
  name: string;
  speciesIdx: number;
  customColors: FishColors;
  size: number;
  z: number;
  x: number;
  y: number;
  dir: number;
  temporary?: boolean;
  lifespan?: number;
  loggedIn?: boolean;
}): void {
  socket.emit('addFish', data);
}

export function emitRemoveFish(fishId: number, uid: string): void {
  socket.emit('removeFish', { fishId, uid });
}

export function emitFeed(x: number, y: number): void {
  socket.emit('feed', { x, y, ownerName: getMyName() });
}

export function emitChat(name: string, msg: string): void {
  socket.emit('chat', { name, msg });
}

export function emitRegister(uid: string): void {
  socket.emit('register', uid);
}

export function emitJoinRoom(roomName: string | null): void {
  socket.emit('joinRoom', roomName);
}

export function emitSendInvite(name: string): void {
  socket.emit('sendInvite', { name });
}

export function emitDeleteChat(name: string, time: number): void {
  socket.emit('deleteChat', { name, time });
}

/** 소켓 초기화 */
export function initSocket(): void {
  socket = io();

  let firstConnect = true;
  socket.on('connect', () => {
    document.getElementById('online-count')!.textContent = '1';
    socket.emit('register', getMyUid());
    // 첫 접속은 라우터(initRouter)가 joinRoom 처리
    // 재연결 시에만 현재 방에 다시 입장
    if (!firstConnect) {
      socket.emit('joinRoom', getCurrentRoom());
    }
    firstConnect = false;
  });

  socket.on('forceReload', () => {
    location.reload();
  });

  socket.on('onlineCount', (count: number) => {
    document.getElementById('online-count')!.textContent = String(count);
  });

  // 다른 유저 커서
  socket.on('cursorMoved', (data: { id: string; x: number; y: number; name: string }) => {
    const W = getW();
    const H = getH();
    let cursor = remoteCursors.get(data.id);
    if (!cursor) {
      cursor = {
        id: data.id,
        x: data.x * W, y: data.y * H,
        targetX: data.x * W, targetY: data.y * H,
        name: data.name,
        lastSeen: Date.now(),
      };
      remoteCursors.set(data.id, cursor);
    }
    cursor.targetX = data.x * W;
    cursor.targetY = data.y * H;
    cursor.name = data.name;
    cursor.lastSeen = Date.now();
  });

  socket.on('cursorLeft', (id: string) => {
    remoteCursors.delete(id);
  });

  socket.on('init', (fishList: any[]) => {
    // 기존 물고기 전부 제거 후 새 목록으로 교체
    clearAllFish();
    for (const data of fishList) {
      const fish = new Fish(data);
      fish.nameTimer = 3;
      fish.showName = true;
      addFish(fish);
    }
    updateMyFishList();
  });

  socket.on('fishAdded', (data: any) => {
    // 이미 있는지 확인
    if (fishById.has(data.id)) return;
    const fish = new Fish(data);
    fish.nameTimer = 4;
    fish.showName = true;
    addFish(fish);
    updateMyFishList();
  });

  socket.on('fishRemoved', (fishId: number) => {
    const fish = fishById.get(fishId);
    if (!fish) return;
    if (fish.temporary && !fish.dying) {
      // 거품 사라짐 애니메이션 시작
      fish.dying = true;
      fish.dyingProgress = 0;
      for (let i = 0; i < 12; i++) {
        fish.deathBubbles.push({
          x: fish.x + rand(-fish.actualSize, fish.actualSize) * 0.5,
          y: fish.y + rand(-fish.actualSize, fish.actualSize) * 0.5,
          size: rand(2, 6),
          vy: rand(-0.5, -1.5),
          vx: rand(-0.3, 0.3),
          opacity: rand(0.5, 0.9),
        });
      }
    } else {
      removeFish(fish);
    }
    updateMyFishList();
  });

  socket.on('foodDropped', (data: { x: number; y: number }) => {
    // 다른 사람이 준 먹이 (중복 방지)
    if (!foods.find(f => f.x === data.x && f.y === data.y)) {
      foods.push(new Food(data.x, data.y));
    }
  });

  socket.on('chatMessage', (data: { name: string; msg: string; time: number }) => {
    addChatMessage(data);
  });

  socket.on('inviteCard', (data: { name: string; time: number }) => {
    addInviteCard(data);
  });

  socket.on('chatDeleted', (data: { time: number }) => {
    removeChatMessage(data.time);
  });

  socket.on('chatHistory', (msgs: { name: string; msg: string; time: number }[]) => {
    handleChatHistory(msgs);
  });

  // 방 입장 시 물고기 목록 수신
  socket.on('roomFishList', (fishList: any[]) => {
    clearAllFish();
    for (const data of fishList) {
      const fish = new Fish(data);
      addFish(fish);
    }
    updateMyFishList();
  });

}
