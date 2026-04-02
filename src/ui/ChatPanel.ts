// ── 채팅 패널 ──

import { getMyName } from '@/state/store';
import { emitChat } from '@/network/socket';

let chatPanel: HTMLElement;
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

/** 채팅 메시지 추가 */
export function addChatMessage(data: { name: string; msg: string; time: number }): void {
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.innerHTML = `<span class="chat-name">${data.name}</span><span class="chat-text">${escapeHtml(data.msg)}</span>`;
  chatMessages.appendChild(el);
  // 자동 스크롤 (하단 근처에 있을 때만)
  const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 60;
  if (isNearBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
  // 패널 닫혀있으면 뱃지 증가
  if (!chatPanel.classList.contains('open')) {
    chatUnread++;
    updateChatBadge();
  }
}

/** 채팅 히스토리 수신 처리 (lastReadTime 기준 뱃지) */
export function handleChatHistory(msgs: { name: string; msg: string; time: number }[]): void {
  chatMessages.innerHTML = '';
  const lastRead = getLastReadTime();
  chatUnread = 0;
  for (const m of msgs) {
    const el = document.createElement('div');
    el.className = 'chat-msg';
    el.innerHTML = `<span class="chat-name">${m.name}</span><span class="chat-text">${escapeHtml(m.msg)}</span>`;
    chatMessages.appendChild(el);
    if (m.time > lastRead && !chatPanel.classList.contains('open')) {
      chatUnread++;
    }
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
  updateChatBadge();
}

/** 채팅 전송 */
function sendChat(): void {
  const msg = chatInput.value.trim();
  if (!msg) return;
  emitChat(getMyName() || '익명', msg);
  chatInput.value = '';
}

/** 채팅 패널 초기화 */
export function initChatPanel(): void {
  chatPanel = document.getElementById('chat-panel')!;
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
}
