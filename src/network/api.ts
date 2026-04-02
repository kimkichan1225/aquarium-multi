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
