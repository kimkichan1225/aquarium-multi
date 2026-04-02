// ── REST API 호출 ──

interface LoginResponse {
  ok: boolean;
  nickname?: string;
  msg?: string;
}

interface RegisterResponse {
  ok: boolean;
  nickname?: string;
  msg?: string;
}

/** 로그인 (PIN 인증) */
export async function login(password: string): Promise<LoginResponse> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json();
}

/** 회원가입 */
export async function register(nickname: string, password: string): Promise<RegisterResponse> {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  return res.json();
}

// ── 방 관련 API ──

/** 방 목록 조회 */
export async function getRooms(): Promise<any[]> {
  const res = await fetch('/api/rooms');
  return res.json();
}

/** 특정 방 조회 */
export async function getRoom(nickname: string): Promise<any> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(nickname)}`);
  return res.json();
}

/** 방 생성 */
export async function createRoom(nickname: string): Promise<any> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  return res.json();
}

/** 방 정보 업데이트 (테마 등) */
export async function updateRoom(nickname: string, data: any): Promise<any> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(nickname)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

/** 장식물 저장 */
export async function saveDecorations(nickname: string, decorations: any[]): Promise<any> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(nickname)}/decorations`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decorations }),
  });
  return res.json();
}
