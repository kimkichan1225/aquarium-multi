const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 공유 수조 상태
const fishes = new Map();
let nextFishId = 1;
const socketUidMap = new Map(); // socket.id -> uid

io.on('connection', (socket) => {
  console.log(`접속: ${socket.id}`);

  // 접속자 수 브로드캐스트
  io.emit('onlineCount', io.engine.clientsCount);

  // 클라이언트 고유 ID 등록
  socket.on('register', (uid) => {
    socketUidMap.set(socket.id, uid);
  });

  // 기존 물고기 목록 전송
  socket.emit('init', Array.from(fishes.values()));

  // 물고기 추가
  socket.on('addFish', (data) => {
    const uid = data.uid || socketUidMap.get(socket.id) || socket.id;
    const fish = {
      id: nextFishId++,
      ownerId: uid,
      ownerName: data.ownerName || '익명',
      name: data.name || '이름없는 물고기',
      speciesIdx: data.speciesIdx,
      customColors: data.customColors,
      size: data.size,
      z: data.z,
      x: data.x,
      y: data.y,
      dir: data.dir || 1,
      temporary: data.temporary || false,
      lifespan: data.lifespan || null,
      createdAt: Date.now()
    };
    fishes.set(fish.id, fish);
    io.emit('fishAdded', fish);
    console.log(`물고기 추가: ${fish.name} by ${fish.ownerName}${fish.temporary ? ' (임시)' : ''}`);

    // 임시 물고기는 수명 후 서버에서도 제거
    if (fish.temporary && fish.lifespan) {
      setTimeout(() => {
        fishes.delete(fish.id);
        io.emit('fishRemoved', fish.id);
      }, fish.lifespan * 1000);
    }
  });

  // 물고기 제거 (자기 물고기만)
  socket.on('removeFish', (data) => {
    const fishId = typeof data === 'object' ? data.fishId : data;
    const uid = (typeof data === 'object' ? data.uid : null) || socketUidMap.get(socket.id) || socket.id;
    const fish = fishes.get(fishId);
    if (fish && fish.ownerId === uid) {
      fishes.delete(fishId);
      io.emit('fishRemoved', fishId);
    }
  });

  // 마우스 커서 공유
  socket.on('cursor', (data) => {
    socket.broadcast.emit('cursorMoved', {
      id: socket.id,
      x: data.x,
      y: data.y,
      name: data.name
    });
  });

  // 먹이주기
  socket.on('feed', (data) => {
    io.emit('foodDropped', { x: data.x, y: data.y, by: data.ownerName });
  });

  // 접속 해제 시 물고기 유지 (수조에 남겨둠), 커서 제거
  socket.on('disconnect', () => {
    console.log(`퇴장: ${socket.id}`);
    io.emit('onlineCount', io.engine.clientsCount);
    io.emit('cursorLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`아쿠아리움 서버 실행 중: http://localhost:${PORT}`);
});
