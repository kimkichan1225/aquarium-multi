// ── 엔트리 포인트 ──

import './style.css';
import { initRenderer } from './engine/Renderer';
import { initSocket } from './network/socket';
import { initLoginModal } from './ui/LoginModal';
import { initBottomBar } from './ui/BottomBar';
import { initChatPanel } from './ui/ChatPanel';
import { initCreatorPanel } from './ui/CreatorPanel';
import { initMyFishPanel } from './ui/MyFishPanel';

// 초기화 순서
initRenderer();    // Canvas, resize, animate 루프 시작
initSocket();      // 소켓 연결 및 이벤트 바인딩
initLoginModal();  // 로그인/회원가입 UI
initBottomBar();   // 하단 버튼 이벤트
initChatPanel();   // 채팅 패널
initCreatorPanel();// 물고기 만들기 패널
initMyFishPanel(); // 내 물고기 패널
