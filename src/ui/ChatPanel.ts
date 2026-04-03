// ── 채팅 패널 ──

import { getMyName } from '@/state/store';
import { emitChat, emitDeleteChat } from '@/network/socket';

let chatPanel: HTMLElement;
let chatHeader: HTMLElement;
let chatMessages: HTMLElement;
let chatInput: HTMLInputElement;
let chatFloatingBtn: HTMLElement;
let chatUnread = 0;

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
  if (!chatPanel.classList.contains('open')) {
    chatUnread++;
    updateChatBadge();
  }
}

/** 채팅 메시지 제거 (서버 삭제 브로드캐스트 수신 시) */
export function removeChatMessage(time: number): void {
  const el = chatMessages.querySelector(`[data-time="${time}"]`);
  if (el) el.remove();
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

  if (!chatPanel.classList.contains('open')) {
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

  initDrag();
}
