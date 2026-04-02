// ── 전역 상태 관리 ──

// 캔버스 크기
let W = 0;
let H = 0;

export function getW(): number { return W; }
export function getH(): number { return H; }
export function setSize(w: number, h: number): void { W = w; H = h; }

// 고유 사용자 ID (재접속해도 유지)
let myUid: string = localStorage.getItem('aquarium-uid') || '';
if (!myUid) {
  myUid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('aquarium-uid', myUid);
}

export function getMyUid(): string { return myUid; }
export function setMyUid(uid: string): void { myUid = uid; }

// 사용자 이름
let myName: string = localStorage.getItem('aquarium-name') || '';

export function getMyName(): string { return myName; }
export function setMyName(name: string): void {
  myName = name;
  localStorage.setItem('aquarium-name', name);
}

// 로그인 상태
let loggedIn = false;
let loggedNickname: string = localStorage.getItem('aquarium-login') || '';

export function isLoggedIn(): boolean { return loggedIn; }
export function setLoggedIn(v: boolean): void { loggedIn = v; }

export function getLoggedNickname(): string { return loggedNickname; }
export function setLoggedNickname(name: string): void {
  loggedNickname = name;
  localStorage.setItem('aquarium-login', name);
}

// 마우스 좌표
let mx = 0;
let my = 0;

export function getMx(): number { return mx; }
export function getMy(): number { return my; }
export function setMouse(x: number, y: number): void { mx = x; my = y; }

// 렌더링 상태
let nightMode = false;

export function isNightMode(): boolean { return nightMode; }
export function setNightMode(v: boolean): void { nightMode = v; }

let time = 0;

export function getTime(): number { return time; }
export function setTime(t: number): void { time = t; }

let frameCount = 0;

export function getFrameCount(): number { return frameCount; }
export function setFrameCount(f: number): void { frameCount = f; }
export function incrementFrameCount(): number { return ++frameCount; }

// 현재 테마 인덱스
let currentTheme = 1;

export function getCurrentTheme(): number { return currentTheme; }
export function setCurrentTheme(idx: number): void { currentTheme = idx; }

// 현재 방 (null = 로비/공유 수조, 'nickname' = 개인 방)
let currentRoom: string | null = null;

export function getCurrentRoom(): string | null { return currentRoom; }
export function setCurrentRoom(room: string | null): void { currentRoom = room; }

// 현재 방의 주인인지 여부
let isRoomOwner = false;

export function getIsRoomOwner(): boolean { return isRoomOwner; }
export function setIsRoomOwner(v: boolean): void { isRoomOwner = v; }

// 방 꾸미기 편집 모드
let editMode = false;

export function getEditMode(): boolean { return editMode; }
export function setEditMode(v: boolean): void { editMode = v; }

// 프록시 객체 (엔티티 클래스에서 store.W 형태로 접근 가능)
export const store = {
  get W() { return W; },
  get H() { return H; },
  get mx() { return mx; },
  get my() { return my; },
  get myUid() { return myUid; },
  get myName() { return myName; },
  get loggedIn() { return loggedIn; },
  get loggedNickname() { return loggedNickname; },
  get nightMode() { return nightMode; },
  get time() { return time; },
  get frameCount() { return frameCount; },
  get currentTheme() { return currentTheme; },
  get currentRoom() { return currentRoom; },
  get isRoomOwner() { return isRoomOwner; },
  get editMode() { return editMode; },
};
