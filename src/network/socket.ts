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
  fishes, fishById, addFish, removeFish, clearAllFish,
  setFishSortDirty,
} from '@/engine/FishManager';
import { foods, remoteCursors } from '@/engine/Renderer';
import { addChatMessage, handleChatHistory } from '@/ui/ChatPanel';
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

// ── 내 물고기 위치 주기적 전송 ──
const lastSentPos: Map<number, { x: number; y: number; dir: number }> = new Map();

function startPositionSync(): void {
  setInterval(() => {
    const W = getW();
    const H = getH();
    const myUid = getMyUid();
    const myFish = fishes.filter(f => f.ownerId === myUid && !f.dying && !f.dead);
    if (myFish.length === 0) return;
    const updates: { id: number; x: number; y: number; dir: number }[] = [];
    for (const f of myFish) {
      const rx = Math.round(f.x / W * 1000) / 1000;
      const ry = Math.round(f.y / H * 1000) / 1000;
      const key = f.id;
      const prev = lastSentPos.get(key);
      if (!prev || Math.abs(prev.x - rx) > 0.002 || Math.abs(prev.y - ry) > 0.002 || prev.dir !== f.dir) {
        updates.push({ id: f.id, x: rx, y: ry, dir: f.dir });
        lastSentPos.set(key, { x: rx, y: ry, dir: f.dir });
      }
    }
    if (updates.length > 0) socket.emit('fishPositions', updates);
  }, 200);
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

/** 소켓 초기화 */
export function initSocket(): void {
  socket = io();

  socket.on('connect', () => {
    document.getElementById('online-count')!.textContent = '1';
    socket.emit('register', getMyUid());
    // 현재 방에 재입장 (초기 접속 또는 재연결 시)
    socket.emit('joinRoom', getCurrentRoom());
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

  // 다른 클라이언트에서 보낸 물고기 위치 수신
  socket.on('fishPositions', (updates: { id: number; x: number; y: number; dir: number }[]) => {
    const W = getW();
    const H = getH();
    const myUid = getMyUid();
    const now = Date.now();
    for (const u of updates) {
      const fish = fishById.get(u.id);
      if (fish && fish.ownerId !== myUid) {
        fish.remoteX = u.x * W;
        fish.remoteY = u.y * H;
        fish.dir = u.dir;
        fish.lastRemoteUpdate = now;
      }
    }
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

  // 위치 동기화 시작
  startPositionSync();
}
