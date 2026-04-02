import { Server, Socket } from 'socket.io';
import { pool, Fish, saveChatToDB, deleteChatFromDB } from '../db';
import {
  fishes,
  socketUidMap,
  chatHistory,
  MAX_CHAT_HISTORY,
  chatRateLimit,
  getNextFishId,
  setNextFishId,
  incrementAndGetFishId,
  ChatMessage,
} from './state';

// addFish 이벤트 데이터 타입
interface AddFishData {
  uid?: string;
  ownerName?: string;
  name?: string;
  speciesIdx: number;
  customColors?: Record<string, string> | null;
  size: number;
  z: number;
  x: number;
  y: number;
  dir?: number;
  temporary?: boolean;
  lifespan?: number | null;
  loggedIn?: boolean;
  roomId?: number | null;
  roomOwner?: string | null;
}

// removeFish 이벤트 데이터 타입
interface RemoveFishData {
  fishId: number;
  uid?: string;
}

// fishPositions 업데이트 타입
interface FishPositionUpdate {
  id: number;
  x: number;
  y: number;
  dir: number;
}

// chat 이벤트 데이터 타입
interface ChatData {
  name?: string;
  msg: string;
}

// cursor 이벤트 데이터 타입
interface CursorData {
  x: number;
  y: number;
  name: string;
}

// feed 이벤트 데이터 타입
interface FeedData {
  x: number;
  y: number;
  ownerName: string;
}

// 소켓별 현재 방 이름 저장
const socketRoomMap: Map<string, string> = new Map();

// 소켓이 속한 방 이름 가져오기
function getSocketRoom(socketId: string): string {
  return socketRoomMap.get(socketId) || 'lobby';
}

// 방 이름으로 물고기 필터링
function getFishesForRoom(roomName: string): Array<Fish & { rx?: number; ry?: number }> {
  return Array.from(fishes.values())
    .filter((f: Fish) => {
      if (roomName === 'lobby') {
        // 로비: roomId와 roomOwner 둘 다 없는 물고기만
        return f.roomId == null && f.roomOwner == null;
      }
      // room:닉네임 → roomOwner 또는 roomId로 매칭
      const roomOwner = roomName.replace('room:', '');
      return f.roomOwner === roomOwner;
    })
    .map((f: Fish) => ({
      ...f,
      ...(f.rx != null ? { rx: f.rx, ry: f.ry } : {}),
    }));
}

// ── 소켓 핸들러 등록 ──
function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`접속: ${socket.id}`);
    io.emit('onlineCount', io.engine.clientsCount);

    socket.on('register', (uid: string) => {
      socketUidMap.set(socket.id, uid);
    });

    // 방 참가
    socket.on('joinRoom', (roomName: string | null) => {
      // 이전 방 떠나기
      const prevRoom = socketRoomMap.get(socket.id);
      if (prevRoom) {
        socket.leave(prevRoom);
      }

      // 새 방 참가
      const newRoom = roomName ? `room:${roomName}` : 'lobby';
      socket.join(newRoom);
      socketRoomMap.set(socket.id, newRoom);

      // 해당 방의 물고기 목록 전송
      const fishList = getFishesForRoom(newRoom);
      socket.emit('init', fishList);

      console.log(`${socket.id} → ${newRoom} 입장`);
    });

    // 방 떠나기
    socket.on('leaveRoom', () => {
      const currentRoom = socketRoomMap.get(socket.id);
      if (currentRoom) {
        socket.leave(currentRoom);
        socketRoomMap.delete(socket.id);
      }
    });

    // 기본적으로 lobby에 참가 (물고기 목록은 joinRoom에서 전송)
    socket.join('lobby');
    socketRoomMap.set(socket.id, 'lobby');

    // 물고기 추가
    socket.on('addFish', async (data: AddFishData) => {
      const uid: string = data.uid || socketUidMap.get(socket.id) || socket.id;
      // 현재 소켓이 속한 방 확인
      const currentRoom = getSocketRoom(socket.id);
      const isInRoom = currentRoom !== 'lobby';
      const roomOwnerName = isInRoom ? currentRoom.replace('room:', '') : null;

      const fish: Fish = {
        id: incrementAndGetFishId(),
        ownerId: uid,
        ownerName: data.ownerName || '익명',
        name: data.name || '이름없는 물고기',
        speciesIdx: data.speciesIdx,
        customColors: data.customColors || null,
        size: data.size,
        z: data.z,
        x: data.x,
        y: data.y,
        dir: data.dir || 1,
        roomId: data.roomId || null,
        roomOwner: roomOwnerName,
        temporary: data.temporary || false,
        lifespan: data.lifespan || null,
        createdAt: Date.now(),
      };

      // 방에서 만든 영구 물고기는 room_id 조회
      let dbRoomId: number | null = null;
      if (isInRoom && roomOwnerName) {
        try {
          const roomResult = await pool.query('SELECT id FROM rooms WHERE owner_nickname = $1', [roomOwnerName]);
          if (roomResult.rows.length > 0) dbRoomId = roomResult.rows[0].id;
        } catch { /* 무시 */ }
      }
      fish.roomId = dbRoomId;

      // 영구 물고기 (로그인 유저가 만든 비임시)는 DB 저장
      if (!fish.temporary && data.loggedIn) {
        try {
          const result = await pool.query(
            `INSERT INTO fish (owner_nickname, name, species_idx, custom_colors, size, z, x, y, dir, room_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
              data.ownerName,
              fish.name,
              fish.speciesIdx,
              JSON.stringify(fish.customColors),
              fish.size,
              fish.z,
              fish.x,
              fish.y,
              fish.dir,
              dbRoomId,
            ]
          );
          fish.id = result.rows[0].id as number;
          fish.dbId = result.rows[0].id as number;
          if (fish.id >= getNextFishId()) setNextFishId(fish.id + 1);
        } catch (e: unknown) {
          const error = e as Error;
          console.error('물고기 DB 저장 실패:', error.message);
        }
      }

      fishes.set(fish.id, fish);
      const room = getSocketRoom(socket.id);
      io.to(room).emit('fishAdded', fish);
      console.log(
        `물고기 추가: ${fish.name} by ${fish.ownerName}${fish.temporary ? ' (임시)' : ''}${fish.dbId ? ' [DB]' : ''}`
      );

      if (fish.temporary && fish.lifespan) {
        setTimeout(() => {
          fishes.delete(fish.id);
          io.to(room).emit('fishRemoved', fish.id);
        }, fish.lifespan * 1000);
      }
    });

    // 물고기 제거
    socket.on('removeFish', async (data: RemoveFishData | number) => {
      const fishId: number = typeof data === 'object' ? data.fishId : data;
      const uid: string =
        (typeof data === 'object' ? data.uid : null) ||
        socketUidMap.get(socket.id) ||
        socket.id;
      const fish: Fish | undefined = fishes.get(fishId);
      if (fish && fish.ownerId === uid) {
        // DB에서도 삭제
        if (fish.dbId) {
          try {
            await pool.query('DELETE FROM fish WHERE id = $1', [fish.dbId]);
          } catch (e: unknown) {
            const error = e as Error;
            console.error('물고기 DB 삭제 실패:', error.message);
          }
        }
        fishes.delete(fishId);
        const room = getSocketRoom(socket.id);
        io.to(room).emit('fishRemoved', fishId);
      }
    });

    // 물고기 위치 동기화
    socket.on('fishPositions', (updates: FishPositionUpdate[]) => {
      for (const u of updates) {
        const fish: Fish | undefined = fishes.get(u.id);
        if (fish) {
          fish.rx = u.x;
          fish.ry = u.y;
          fish.dir = u.dir;
        }
      }
      const room = getSocketRoom(socket.id);
      socket.to(room).emit('fishPositions', updates);
    });

    // 채팅 히스토리 전송
    socket.emit('chatHistory', chatHistory);

    // 채팅
    socket.on('chat', (data: ChatData) => {
      if (!data || !data.msg || typeof data.msg !== 'string') return;
      const msg: string = data.msg.trim().slice(0, 100);
      if (!msg) return;
      // 도배 방지 (1초에 1개)
      const now: number = Date.now();
      const last: number = chatRateLimit.get(socket.id) || 0;
      if (now - last < 1000) return;
      chatRateLimit.set(socket.id, now);

      const chatMsg: ChatMessage = {
        name: (data.name || '익명').slice(0, 20),
        msg,
        time: now,
      };
      chatHistory.push(chatMsg);
      if (chatHistory.length > MAX_CHAT_HISTORY) chatHistory.shift();
      const room = getSocketRoom(socket.id);
      // DB에 저장 (비동기, 실패해도 무시)
      saveChatToDB(chatMsg.name, chatMsg.msg, room);
      io.to(room).emit('chatMessage', chatMsg);
    });

    // 채팅 삭제
    socket.on('deleteChat', (data: { name: string; time: number }) => {
      if (!data?.name || !data?.time) return;
      const name = data.name.slice(0, 20);
      // chatHistory에서 제거
      const idx = chatHistory.findIndex(m => m.name === name && m.time === data.time);
      if (idx !== -1) chatHistory.splice(idx, 1);
      // DB에서 제거
      deleteChatFromDB(name, data.time);
      // 같은 방 전체에 삭제 알림
      const room = getSocketRoom(socket.id);
      io.to(room).emit('chatDeleted', { time: data.time });
    });

    // 초대장 전송 (로비 전체에 브로드캐스트)
    socket.on('sendInvite', (data: { name?: string }) => {
      const name = (data?.name || '익명').slice(0, 20);
      // 도배 방지 (10초에 1회)
      const now = Date.now();
      const lastInvite = chatRateLimit.get(`invite:${socket.id}`) || 0;
      if (now - lastInvite < 10000) return;
      chatRateLimit.set(`invite:${socket.id}`, now);
      io.to('lobby').emit('inviteCard', { name, time: now });
      console.log(`초대장: ${name}`);
    });

    // 마우스 커서 공유
    socket.on('cursor', (data: CursorData) => {
      const room = getSocketRoom(socket.id);
      socket.to(room).emit('cursorMoved', {
        id: socket.id,
        x: data.x,
        y: data.y,
        name: data.name,
      });
    });

    // 먹이주기
    socket.on('feed', (data: FeedData) => {
      const room = getSocketRoom(socket.id);
      io.to(room).emit('foodDropped', { x: data.x, y: data.y, by: data.ownerName });
    });

    socket.on('disconnect', () => {
      console.log(`퇴장: ${socket.id}`);
      const room = getSocketRoom(socket.id);
      chatRateLimit.delete(socket.id);
      socketRoomMap.delete(socket.id);
      io.emit('onlineCount', io.engine.clientsCount);
      io.to(room).emit('cursorLeft', socket.id);
    });
  });
}

export { registerSocketHandlers };
