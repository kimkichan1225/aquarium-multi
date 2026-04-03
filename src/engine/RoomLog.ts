// ── 개인 방 기록 (아이템 도감 + 물고기 일기) ──

import type { ItemType } from '@/entities/Item';

export interface CollectedItemRecord {
  type: ItemType;
  collectedAt: number;  // timestamp
  fishName: string;
}

export interface DiaryEntry {
  date: string;          // 'YYYY-MM-DD'
  feedCount: number;
  collected: CollectedItemRecord[];
}

let currentRoom: string | null = null;
let collection: CollectedItemRecord[] = [];
let diary: DiaryEntry[] = [];

function collectionKey(room: string) { return `aq-collection-${room}`; }
function diaryKey(room: string)      { return `aq-diary-${room}`; }

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function todayEntry(): DiaryEntry {
  const today = todayStr();
  let entry = diary.find(e => e.date === today);
  if (!entry) {
    entry = { date: today, feedCount: 0, collected: [] };
    diary.push(entry);
    if (diary.length > 30) diary.splice(0, diary.length - 30); // 최근 30일만 보존
  }
  return entry;
}

function saveDiary() {
  if (!currentRoom) return;
  try { localStorage.setItem(diaryKey(currentRoom), JSON.stringify(diary)); } catch {}
}

function saveCollection() {
  if (!currentRoom) return;
  try { localStorage.setItem(collectionKey(currentRoom), JSON.stringify(collection)); } catch {}
}

/** 방 입장 시 데이터 로드 */
export function loadRoomLog(room: string): void {
  currentRoom = room;
  try {
    const c = localStorage.getItem(collectionKey(room));
    collection = c ? JSON.parse(c) : [];
  } catch { collection = []; }
  try {
    const d = localStorage.getItem(diaryKey(room));
    diary = d ? JSON.parse(d) : [];
  } catch { diary = []; }
}

/** 방 퇴장 시 초기화 */
export function clearRoomLog(): void {
  currentRoom = null;
  collection = [];
  diary = [];
}

/** 아이템 수집 기록 */
export function recordItemCollected(type: ItemType, fishName: string): void {
  const record: CollectedItemRecord = { type, collectedAt: Date.now(), fishName };
  collection.push(record);
  todayEntry().collected.push(record);
  saveCollection();
  saveDiary();
}

/** 먹이 준 기록 */
export function recordFeed(): void {
  todayEntry().feedCount++;
  saveDiary();
}

/** 전체 수집 기록 반환 */
export function getCollection(): CollectedItemRecord[] { return collection; }

/** 일기 반환 (최신순) */
export function getDiary(): DiaryEntry[] { return [...diary].reverse(); }
