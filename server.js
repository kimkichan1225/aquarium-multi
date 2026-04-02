const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

// ── DB 연결 ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ── DB 초기화 ──
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nickname VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fish (
      id SERIAL PRIMARY KEY,
      owner_nickname VARCHAR(20) REFERENCES users(nickname),
      name VARCHAR(20) NOT NULL,
      species_idx INT NOT NULL,
      custom_colors JSONB,
      size FLOAT,
      z FLOAT,
      x FLOAT,
      y FLOAT,
      dir INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('DB 테이블 준비 완료');
}

// ── REST API: 회원가입/로그인 ──
app.post('/api/register', async (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.json({ ok: false, msg: '닉네임과 PIN을 입력하세요' });
  if (nickname.length > 20) return res.json({ ok: false, msg: '닉네임은 20자 이하' });
  if (!/^\d{4,8}$/.test(password)) return res.json({ ok: false, msg: 'PIN은 4~8자리 숫자' });
  try {
    // PIN 중복 체크
    const dup = await pool.query('SELECT id FROM users WHERE password = $1', [password]);
    if (dup.rows.length > 0) return res.json({ ok: false, msg: '이미 사용 중인 PIN 번호입니다' });
    await pool.query('INSERT INTO users (nickname, password) VALUES ($1, $2)', [nickname, password]);
    res.json({ ok: true, nickname });
  } catch (e) {
    if (e.code === '23505') return res.json({ ok: false, msg: '이미 사용 중인 닉네임입니다' });
    res.json({ ok: false, msg: '서버 오류' });
  }
});

app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.json({ ok: false, msg: 'PIN 번호를 입력하세요' });
  const result = await pool.query('SELECT * FROM users WHERE password = $1', [password]);
  if (result.rows.length === 0) return res.json({ ok: false, msg: '등록되지 않은 PIN 번호입니다' });
  res.json({ ok: true, nickname: result.rows[0].nickname });
});

// ── 메모리 상태 ──
const fishes = new Map();
let nextFishId = 1;
const socketUidMap = new Map();

// DB에서 영구 물고기 로드
async function loadFishFromDB() {
  const result = await pool.query('SELECT * FROM fish ORDER BY id');
  for (const row of result.rows) {
    const fish = {
      id: row.id,
      dbId: row.id,
      ownerId: row.owner_nickname,
      ownerName: row.owner_nickname,
      name: row.name,
      speciesIdx: row.species_idx,
      customColors: row.custom_colors,
      size: row.size,
      z: row.z,
      x: row.x,
      y: row.y,
      dir: row.dir,
      temporary: false,
      createdAt: row.created_at
    };
    fishes.set(fish.id, fish);
    if (fish.id >= nextFishId) nextFishId = fish.id + 1;
  }
  console.log(`DB에서 물고기 ${fishes.size}마리 로드`);
}

// ── 소켓 ──
io.on('connection', (socket) => {
  console.log(`접속: ${socket.id}`);
  io.emit('onlineCount', io.engine.clientsCount);

  socket.on('register', (uid) => {
    socketUidMap.set(socket.id, uid);
  });

  // 기존 물고기 목록 전송 (최신 위치 포함)
  const fishList = Array.from(fishes.values()).map(f => ({
    ...f,
    ...(f.rx != null ? { rx: f.rx, ry: f.ry } : {})
  }));
  socket.emit('init', fishList);

  // 물고기 추가
  socket.on('addFish', async (data) => {
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

    // 영구 물고기 (로그인 유저가 만든 비임시)는 DB 저장
    if (!fish.temporary && data.loggedIn) {
      try {
        const result = await pool.query(
          `INSERT INTO fish (owner_nickname, name, species_idx, custom_colors, size, z, x, y, dir)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [data.ownerName, fish.name, fish.speciesIdx, JSON.stringify(fish.customColors),
           fish.size, fish.z, fish.x, fish.y, fish.dir]
        );
        fish.id = result.rows[0].id;
        fish.dbId = result.rows[0].id;
        if (fish.id >= nextFishId) nextFishId = fish.id + 1;
      } catch (e) {
        console.error('물고기 DB 저장 실패:', e.message);
      }
    }

    fishes.set(fish.id, fish);
    io.emit('fishAdded', fish);
    console.log(`물고기 추가: ${fish.name} by ${fish.ownerName}${fish.temporary ? ' (임시)' : ''}${fish.dbId ? ' [DB]' : ''}`);

    if (fish.temporary && fish.lifespan) {
      setTimeout(() => {
        fishes.delete(fish.id);
        io.emit('fishRemoved', fish.id);
      }, fish.lifespan * 1000);
    }
  });

  // 물고기 제거
  socket.on('removeFish', async (data) => {
    const fishId = typeof data === 'object' ? data.fishId : data;
    const uid = (typeof data === 'object' ? data.uid : null) || socketUidMap.get(socket.id) || socket.id;
    const fish = fishes.get(fishId);
    if (fish && fish.ownerId === uid) {
      // DB에서도 삭제
      if (fish.dbId) {
        try {
          await pool.query('DELETE FROM fish WHERE id = $1', [fish.dbId]);
        } catch (e) {
          console.error('물고기 DB 삭제 실패:', e.message);
        }
      }
      fishes.delete(fishId);
      io.emit('fishRemoved', fishId);
    }
  });

  // 물고기 위치 동기화
  socket.on('fishPositions', (updates) => {
    for(const u of updates) {
      const fish = fishes.get(u.id);
      if(fish) { fish.rx = u.x; fish.ry = u.y; fish.dir = u.dir; }
    }
    socket.broadcast.emit('fishPositions', updates);
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

  socket.on('disconnect', () => {
    console.log(`퇴장: ${socket.id}`);
    io.emit('onlineCount', io.engine.clientsCount);
    io.emit('cursorLeft', socket.id);
  });
});

// ── 관리자: 전체 새로고침 ──
app.post('/admin/reload', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if(secret !== (process.env.ADMIN_SECRET || 'aquarium-admin')) {
    return res.status(403).json({ ok: false, msg: '권한 없음' });
  }
  io.emit('forceReload');
  console.log('전체 클라이언트 새로고침 브로드캐스트');
  res.json({ ok: true, msg: `${io.engine.clientsCount}명에게 새로고침 전송` });
});

// ── 서버 시작 ──
const PORT = process.env.PORT || 3000;

async function start() {
  if (process.env.DATABASE_URL) {
    await initDB();
    await loadFishFromDB();
  } else {
    console.log('DATABASE_URL 없음 - DB 없이 메모리 모드로 실행');
  }
  server.listen(PORT, () => {
    console.log(`아쿠아리움 서버 실행 중: http://localhost:${PORT}`);
  });
}

start().catch(e => {
  console.error('서버 시작 실패:', e);
  process.exit(1);
});
