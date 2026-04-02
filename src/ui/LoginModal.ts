// ── 로그인/회원가입 모달 ──

import { login, register } from '@/network/api';
import {
  getMyUid, setMyUid, setMyName, setLoggedIn, setLoggedNickname,
  getLoggedNickname, isLoggedIn,
} from '@/state/store';
import { emitRegister } from '@/network/socket';

/** 로그인 모달 초기화 */
export function initLoginModal(): void {
  const loginOverlay = document.getElementById('login-overlay')!;
  const loginBox = document.getElementById('login-box')!;
  const registerBox = document.getElementById('register-box')!;
  const loginMsg = document.getElementById('login-msg')!;
  const regMsg = document.getElementById('reg-msg')!;

  const loggedNickname = getLoggedNickname();

  // 이미 로그인 세션이 있으면 바로 진입
  if (loggedNickname) {
    setLoggedIn(true);
    setMyName(loggedNickname);
    setMyUid(loggedNickname); // 로그인 유저는 닉네임이 uid 역할
    loginOverlay.classList.add('hidden');
    document.getElementById('user-info')!.style.display = 'flex';
    document.getElementById('user-nickname')!.textContent = loggedNickname;
  }

  // 화면 전환: 로그인 ↔ 회원가입
  document.getElementById('login-to-register')!.addEventListener('click', () => {
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
    loginMsg.textContent = '';
  });

  document.getElementById('reg-to-login')!.addEventListener('click', () => {
    registerBox.style.display = 'none';
    loginBox.style.display = 'block';
    regMsg.textContent = '';
  });

  // 로그인 (PIN만)
  document.getElementById('btn-login')!.addEventListener('click', async () => {
    const pw = (document.getElementById('login-pw') as HTMLInputElement).value.trim();
    loginMsg.className = '';
    loginMsg.textContent = '';
    if (!pw) { loginMsg.textContent = 'PIN 번호를 입력하세요'; return; }
    const data = await login(pw);
    if (data.ok && data.nickname) {
      setLoggedIn(true);
      setLoggedNickname(data.nickname);
      setMyName(data.nickname);
      setMyUid(data.nickname); // 로그인 유저는 닉네임이 uid
      loginOverlay.classList.add('hidden');
      document.getElementById('user-info')!.style.display = 'flex';
      document.getElementById('user-nickname')!.textContent = data.nickname;
      emitRegister(data.nickname);
    } else {
      loginMsg.textContent = data.msg || '로그인 실패';
    }
  });

  // 회원가입
  document.getElementById('btn-register')!.addEventListener('click', async () => {
    const nick = (document.getElementById('reg-nick') as HTMLInputElement).value.trim();
    const pw = (document.getElementById('reg-pw') as HTMLInputElement).value.trim();
    const pw2 = (document.getElementById('reg-pw2') as HTMLInputElement).value.trim();
    regMsg.className = '';
    regMsg.textContent = '';
    if (!nick || !pw) { regMsg.textContent = '닉네임과 비밀번호를 입력하세요'; return; }
    if (pw !== pw2) { regMsg.textContent = '비밀번호가 일치하지 않습니다'; return; }
    if (!/^\d{4,8}$/.test(pw)) { regMsg.textContent = '비밀번호는 4~8자리 숫자입니다'; return; }
    const data = await register(nick, pw);
    if (data.ok) {
      regMsg.className = 'success';
      regMsg.textContent = '가입 완료! 로그인 화면으로 이동합니다';
      setTimeout(() => {
        registerBox.style.display = 'none';
        loginBox.style.display = 'block';
        (document.getElementById('login-pw') as HTMLInputElement).value = '';
        regMsg.textContent = '';
      }, 1200);
    } else {
      regMsg.textContent = data.msg || '가입 실패';
    }
  });

  // 비회원 구경
  document.getElementById('login-skip')!.addEventListener('click', () => {
    loginOverlay.classList.add('hidden');
  });

  // 엔터키
  document.getElementById('login-pw')!.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') document.getElementById('btn-login')!.click();
  });
  document.getElementById('reg-pw2')!.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') document.getElementById('btn-register')!.click();
  });

  // 로그아웃
  document.getElementById('btn-logout')!.addEventListener('click', () => {
    setLoggedIn(false);
    setLoggedNickname('');
    localStorage.removeItem('aquarium-login');
    document.getElementById('user-info')!.style.display = 'none';
    setMyName('');
    // 원래 uid로 복원
    setMyUid(localStorage.getItem('aquarium-uid') || '');
  });
}
