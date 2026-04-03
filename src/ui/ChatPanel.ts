// ── 채팅 패널 ──

import { getMyName } from '@/state/store';
import { emitChat, emitDeleteChat } from '@/network/socket';

let chatPanel: HTMLElement;
let chatHeader: HTMLElement;
let chatMessages: HTMLElement;
let chatInput: HTMLInputElement;
let chatFloatingBtn: HTMLElement;
let chatUnread = 0;
let pipWindow: Window | null = null;

// 마지막으로 읽은 메시지 시간 (localStorage 유지)
function getLastReadTime(): number {
  return parseInt(localStorage.getItem('chat-last-read') || '0', 10);
}
function setLastReadTime(t: number): void {
  localStorage.setItem('chat-last-read', String(t));
}

/** HTML 이스케이프 */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 채팅 뱃지 업데이트 */
function updateChatBadge(): void {
  let badge = chatFloatingBtn.querySelector('.chat-badge') as HTMLElement | null;
  if (chatUnread > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'chat-badge';
      chatFloatingBtn.appendChild(badge);
    }
    badge.textContent = chatUnread > 99 ? '99+' : String(chatUnread);
  } else if (badge) {
    badge.remove();
  }
}

/** 채팅 패널 토글 */
export function toggleChat(): void {
  chatPanel.classList.toggle('open');
  const isOpen = chatPanel.classList.contains('open');
  chatFloatingBtn.style.display = isOpen ? 'none' : 'flex';
  if (isOpen) {
    chatUnread = 0;
    setLastReadTime(Date.now());
    updateChatBadge();
    chatInput.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/** 채팅 메시지 엘리먼트 생성 */
function createChatMsgEl(data: { name: string; msg: string; time: number }): HTMLElement {
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.dataset.time = String(data.time);

  const nameEl = document.createElement('span');
  nameEl.className = 'chat-name';
  nameEl.textContent = data.name;

  const textEl = document.createElement('span');
  textEl.className = 'chat-text';
  textEl.textContent = data.msg;

  el.appendChild(nameEl);
  el.appendChild(textEl);

  // 내 메시지에만 삭제 버튼 추가
  if (data.name === getMyName()) {
    const delBtn = document.createElement('button');
    delBtn.className = 'chat-delete-btn';
    delBtn.textContent = '×';
    delBtn.title = '삭제';
    delBtn.addEventListener('click', () => {
      emitDeleteChat(data.name, data.time);
    });
    el.appendChild(delBtn);
  }

  return el;
}

/** 채팅 메시지 추가 */
export function addChatMessage(data: { name: string; msg: string; time: number }): void {
  const el = createChatMsgEl(data);
  chatMessages.appendChild(el);
  const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 60;
  if (isNearBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
  addMessageToPip(el);
  if (!chatPanel.classList.contains('open') && !pipWindow) {
    chatUnread++;
    updateChatBadge();
  }
}

/** 채팅 메시지 제거 (서버 삭제 브로드캐스트 수신 시) */
export function removeChatMessage(time: number): void {
  const el = chatMessages.querySelector(`[data-time="${time}"]`);
  if (el) el.remove();
  removeMessageFromPip(time);
}

/** 채팅 히스토리 수신 처리 (lastReadTime 기준 뱃지) */
export function handleChatHistory(msgs: { name: string; msg: string; time: number; type?: string }[]): void {
  chatMessages.innerHTML = '';
  const lastRead = getLastReadTime();
  chatUnread = 0;
  for (const m of msgs) {
    const el = m.type === 'invite'
      ? createInviteCardEl({ name: m.name, time: m.time })
      : createChatMsgEl(m);
    chatMessages.appendChild(el);
    if (m.time > lastRead && !chatPanel.classList.contains('open')) {
      chatUnread++;
    }
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
  updateChatBadge();
}

/** 초대 카드 엘리먼트 생성 */
function createInviteCardEl(data: { name: string; time: number }): HTMLElement {
  const el = document.createElement('div');
  el.className = 'invite-card';

  const fish = document.createElement('div');
  fish.className = 'invite-fish';
  fish.textContent = '🐠';

  const info = document.createElement('div');
  info.className = 'invite-info';
  info.innerHTML = `
    <div class="invite-title">${escapeHtml(data.name)}의 아쿠아리움</div>
    <div class="invite-sub">${escapeHtml(data.name)}님이 초대합니다</div>
  `;

  const btn = document.createElement('button');
  btn.className = 'invite-enter-btn';
  btn.textContent = '입장하기 →';
  btn.addEventListener('click', () => {
    location.hash = `#room/${encodeURIComponent(data.name)}`;
    chatPanel.classList.remove('open');
    chatFloatingBtn.style.display = 'flex';
  });

  el.appendChild(fish);
  el.appendChild(info);
  el.appendChild(btn);
  return el;
}

/** 초대 카드 추가 (실시간 수신) */
export function addInviteCard(data: { name: string; time: number }): void {
  const el = createInviteCardEl(data);
  chatMessages.appendChild(el);

  const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 60;
  if (isNearBottom) chatMessages.scrollTop = chatMessages.scrollHeight;

  addMessageToPip(el);
  if (!chatPanel.classList.contains('open') && !pipWindow) {
    chatUnread++;
    updateChatBadge();
  }
}

/** 채팅 전송 */
function sendChat(): void {
  const msg = chatInput.value.trim();
  if (!msg) return;
  emitChat(getMyName() || '익명', msg);
  chatInput.value = '';
}

/** PiP 창에 사용할 스타일 생성 */
function getPipStyles(): string {
  return `
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'Pretendard','Apple SD Gothic Neo',system-ui,sans-serif;
      background:#050f23;color:rgba(200,220,240,0.85);
      display:flex;flex-direction:column;height:100vh;overflow:hidden;
      position:relative;
    }
    #pip-bg-video{
      position:fixed;top:0;left:0;width:100%;height:100%;
      object-fit:cover;z-index:0;pointer-events:none;
    }
    #pip-overlay{
      position:relative;z-index:1;display:flex;flex-direction:column;
      height:100vh;overflow:hidden;
      background:rgba(5,15,35,0.55);
    }
    #pip-header{
      color:rgba(140,200,255,0.7);font-size:12px;letter-spacing:1px;font-weight:600;
      padding:10px 12px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(100,180,255,0.1);flex-shrink:0;
      background:rgba(10,25,50,0.5);
    }
    #pip-messages{
      flex:1;overflow-y:auto;padding:8px 10px;
      display:flex;flex-direction:column;gap:4px;
    }
    #pip-messages::-webkit-scrollbar{width:4px}
    #pip-messages::-webkit-scrollbar-thumb{background:rgba(100,180,255,0.15);border-radius:2px}
    .chat-msg{
      padding:4px 0;font-size:11px;line-height:1.4;word-break:break-word;
      display:flex;align-items:baseline;gap:0;position:relative;
    }
    .chat-msg:hover .chat-delete-btn{opacity:1}
    .chat-delete-btn{
      margin-left:auto;padding:0 4px;background:none;border:none;
      color:rgba(255,100,100,0.4);font-size:13px;cursor:pointer;
      opacity:0;transition:opacity 0.15s;line-height:1;flex-shrink:0;
    }
    .chat-delete-btn:hover{color:rgba(255,100,100,0.9)}
    .chat-msg .chat-name{color:rgba(100,220,180,0.8);font-weight:600;margin-right:6px}
    .chat-msg .chat-text{color:rgba(200,220,240,0.75)}
    .invite-card{
      display:flex;align-items:center;gap:8px;padding:8px;margin:4px 0;
      background:rgba(30,60,100,0.3);border:1px solid rgba(100,180,255,0.15);border-radius:8px;
    }
    .invite-fish{font-size:20px}
    .invite-info{flex:1}
    .invite-title{font-size:11px;font-weight:600;color:rgba(140,200,255,0.8)}
    .invite-sub{font-size:9px;color:rgba(140,200,255,0.4)}
    .invite-enter-btn{
      background:rgba(60,180,120,0.2);border:1px solid rgba(100,220,160,0.2);
      border-radius:6px;color:rgba(130,230,170,0.8);font-size:10px;
      padding:5px 10px;cursor:pointer;
    }
    #pip-input-area{
      display:flex;gap:6px;padding:8px 10px;
      border-top:1px solid rgba(100,180,255,0.08);flex-shrink:0;
    }
    #pip-input{
      flex:1;background:rgba(20,40,70,0.5);border:1px solid rgba(100,180,255,0.12);
      border-radius:8px;color:rgba(200,220,240,0.85);font-family:inherit;
      font-size:11px;padding:7px 10px;outline:none;
    }
    #pip-input:focus{border-color:rgba(100,180,255,0.3)}
    #pip-input::placeholder{color:rgba(140,200,255,0.25)}
    #pip-send{
      background:rgba(60,180,120,0.2);border:1px solid rgba(100,220,160,0.2);
      border-radius:8px;color:rgba(130,230,170,0.8);font-size:11px;
      padding:7px 12px;cursor:pointer;flex-shrink:0;
    }
    #pip-send:hover{background:rgba(60,180,120,0.35)}
    .pip-back-btn{
      background:none;border:none;color:rgba(140,200,255,0.5);font-size:11px;
      cursor:pointer;padding:2px 6px;border-radius:4px;
    }
    .pip-back-btn:hover{color:#fff;background:rgba(255,255,255,0.1)}
  `;
}

/** PiP 모드 진입 */
async function enterPip(): Promise<void> {
  if (!('documentPictureInPicture' in window)) {
    alert('이 브라우저는 Document PiP를 지원하지 않습니다. Chrome/Edge 116 이상에서 사용해주세요.');
    return;
  }

  try {
    const dpip = (window as any).documentPictureInPicture;
    pipWindow = await dpip.requestWindow({ width: 320, height: 420 });
    if (!pipWindow) return;

    const doc = pipWindow.document;

    // 스타일 삽입
    const style = doc.createElement('style');
    style.textContent = getPipStyles();
    doc.head.appendChild(style);

    // 배경 비디오 (아쿠아리움 캔버스 스트리밍)
    const mainCanvas = document.getElementById('c') as HTMLCanvasElement;
    if (mainCanvas) {
      const stream = (mainCanvas as any).captureStream(15); // 15fps
      const video = doc.createElement('video');
      video.id = 'pip-bg-video';
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      doc.body.appendChild(video);
    }

    // PiP 창 구조 생성
    const overlay = doc.createElement('div');
    overlay.id = 'pip-overlay';
    overlay.innerHTML = `
      <div id="pip-header">
        <span>채팅</span>
        <button class="pip-back-btn" id="pip-back">← 돌아가기</button>
      </div>
      <div id="pip-messages"></div>
      <div id="pip-input-area">
        <input type="text" id="pip-input" placeholder="메시지 입력..." maxlength="100" autocomplete="off">
        <button id="pip-send">전송</button>
      </div>
    `;
    doc.body.appendChild(overlay);

    // 기존 메시지 복사
    const pipMessages = doc.getElementById('pip-messages')!;
    for (const child of Array.from(chatMessages.children)) {
      pipMessages.appendChild(child.cloneNode(true));
    }
    // 삭제 버튼 이벤트 재바인딩
    rebindDeleteBtns(pipMessages);
    pipMessages.scrollTop = pipMessages.scrollHeight;

    // 입력/전송 이벤트
    const pipInput = doc.getElementById('pip-input') as HTMLInputElement;
    const pipSend = doc.getElementById('pip-send')!;

    const pipSendChat = () => {
      const msg = pipInput.value.trim();
      if (!msg) return;
      emitChat(getMyName() || '익명', msg);
      pipInput.value = '';
    };
    pipSend.addEventListener('click', pipSendChat);
    pipInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') pipSendChat();
    });

    // 돌아가기 버튼
    doc.getElementById('pip-back')!.addEventListener('click', () => {
      pipWindow?.close();
    });

    // 기존 채팅 패널 숨기기
    chatPanel.classList.remove('open');
    chatFloatingBtn.style.display = 'flex';

    // PiP 창 닫힐 때 복구
    pipWindow.addEventListener('pagehide', () => {
      pipWindow = null;
    });
  } catch (e) {
    console.error('PiP 진입 실패:', e);
  }
}

/** PiP 창의 삭제 버튼 이벤트 재바인딩 */
function rebindDeleteBtns(container: HTMLElement): void {
  container.querySelectorAll('.chat-delete-btn').forEach((btn) => {
    const msgEl = btn.closest('.chat-msg') as HTMLElement;
    if (!msgEl) return;
    const time = Number(msgEl.dataset.time);
    const nameEl = msgEl.querySelector('.chat-name');
    const name = nameEl?.textContent || '';
    const newBtn = btn.cloneNode(true) as HTMLElement;
    btn.replaceWith(newBtn);
    newBtn.addEventListener('click', () => emitDeleteChat(name, time));
  });
}

/** PiP 창에 메시지 추가 (실시간) */
function addMessageToPip(el: HTMLElement): void {
  if (!pipWindow) return;
  const pipMessages = pipWindow.document.getElementById('pip-messages');
  if (!pipMessages) return;
  const clone = el.cloneNode(true) as HTMLElement;
  pipMessages.appendChild(clone);
  rebindDeleteBtns(pipMessages);
  const isNearBottom = pipMessages.scrollHeight - pipMessages.scrollTop - pipMessages.clientHeight < 60;
  if (isNearBottom) pipMessages.scrollTop = pipMessages.scrollHeight;
}

/** PiP 창에서 메시지 제거 */
function removeMessageFromPip(time: number): void {
  if (!pipWindow) return;
  const el = pipWindow.document.querySelector(`[data-time="${time}"]`);
  if (el) el.remove();
}

/** 드래그 이동 초기화 */
function initDrag(): void {
  let isDragging = false;
  let startX = 0, startY = 0;
  let panelX = 0, panelY = 0;

  chatHeader.addEventListener('mousedown', (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-close')) return;
    isDragging = true;
    startX = e.clientX - panelX;
    startY = e.clientY - panelY;
    e.preventDefault();
  });

  chatHeader.addEventListener('touchstart', (e: TouchEvent) => {
    if ((e.target as HTMLElement).closest('.panel-close')) return;
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX - panelX;
    startY = touch.clientY - panelY;
  }, { passive: true });

  const onMove = (cx: number, cy: number) => {
    if (!isDragging) return;
    panelX = cx - startX;
    panelY = cy - startY;
    // 화면 밖으로 나가지 않도록 제한
    const rect = chatPanel.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    panelX = Math.max(-chatPanel.offsetLeft, Math.min(panelX, maxX - chatPanel.offsetLeft));
    panelY = Math.max(-chatPanel.offsetTop, Math.min(panelY, maxY - chatPanel.offsetTop));
    chatPanel.style.transform = `translate(${panelX}px, ${panelY}px)`;
  };

  document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    if (isDragging) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  const onEnd = () => { isDragging = false; };
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}

/** 채팅 패널 초기화 */
export function initChatPanel(): void {
  chatPanel = document.getElementById('chat-panel')!;
  chatHeader = document.getElementById('chat-header')!;
  chatMessages = document.getElementById('chat-messages')!;
  chatInput = document.getElementById('chat-input') as HTMLInputElement;
  chatFloatingBtn = document.getElementById('chat-floating-btn')!;

  chatFloatingBtn.addEventListener('click', toggleChat);

  document.getElementById('btn-close-chat')!.addEventListener('click', () => {
    chatPanel.classList.remove('open');
    chatFloatingBtn.style.display = 'flex';
  });

  document.getElementById('chat-send')!.addEventListener('click', sendChat);

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });

  // PiP 버튼 (지원하는 브라우저에서만 표시)
  const pipBtn = document.getElementById('btn-pip-chat')!;
  if ('documentPictureInPicture' in window) {
    pipBtn.addEventListener('click', enterPip);
  } else {
    pipBtn.style.display = 'none';
  }

  initDrag();
}
