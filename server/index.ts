import express, { Express } from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { initDB, loadFishFromDB } from './db';
import { fishes, getNextFishId, setNextFishId } from './socket/state';
import { registerSocketHandlers } from './socket/handler';
import authRouter from './routes/auth';
import roomRouter from './routes/room';
import createAdminRouter from './routes/admin';

const app: Express = express();
const server: http.Server = http.createServer(app);
const io: Server = new Server(server);

// 프로덕션: Vite 빌드 결과물(dist) 서빙
app.use(express.static(path.join(__dirname, '..', 'dist')));

// 개발 환경: public 폴더 폴백
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '..', 'public')));
}

app.use(express.json());

// ── 라우터 연결 ──
app.use('/api', authRouter);
app.use('/api', roomRouter);
app.use('/admin', createAdminRouter(io));

// ── 소켓 핸들러 등록 ──
registerSocketHandlers(io);

// ── 서버 시작 ──
const PORT: number = parseInt(process.env.PORT || '3000', 10);

async function start(): Promise<void> {
  if (process.env.DATABASE_URL) {
    await initDB();
    await loadFishFromDB(fishes, getNextFishId, setNextFishId);
  } else {
    console.log('DATABASE_URL 없음 - DB 없이 메모리 모드로 실행');
  }
  server.listen(PORT, () => {
    console.log(`아쿠아리움 서버 실행 중: http://localhost:${PORT}`);
  });
}

start().catch((e: Error) => {
  console.error('서버 시작 실패:', e);
  process.exit(1);
});
