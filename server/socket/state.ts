import { Fish } from '../db';

// ── 메모리 상태 ──
const fishes: Map<number, Fish> = new Map();
let nextFishId: number = 1;
const socketUidMap: Map<string, string> = new Map();

// 채팅 히스토리 (최근 50개)
export interface ChatMessage {
  name: string;
  msg: string;
  time: number;
}

const chatHistory: ChatMessage[] = [];
const MAX_CHAT_HISTORY: number = 50;
const chatRateLimit: Map<string, number> = new Map(); // socketId → 마지막 전송 시간

// nextFishId 접근자
function getNextFishId(): number {
  return nextFishId;
}

function setNextFishId(id: number): void {
  nextFishId = id;
}

function incrementAndGetFishId(): number {
  return nextFishId++;
}

export {
  fishes,
  socketUidMap,
  chatHistory,
  MAX_CHAT_HISTORY,
  chatRateLimit,
  getNextFishId,
  setNextFishId,
  incrementAndGetFishId,
};
