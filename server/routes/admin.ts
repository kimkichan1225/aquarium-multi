import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';

// ── 관리자 라우터 팩토리 (io 인스턴스 필요) ──
function createAdminRouter(io: Server): Router {
  const router: Router = Router();

  // ── 전체 새로고침 ──
  router.post('/reload', (req: Request, res: Response) => {
    const secret: string | undefined = req.headers['x-admin-secret'] as string | undefined;
    if (secret !== (process.env.ADMIN_SECRET || 'aquarium-admin')) {
      return res.status(403).json({ ok: false, msg: '권한 없음' });
    }
    io.emit('forceReload');
    console.log('전체 클라이언트 새로고침 브로드캐스트');
    res.json({ ok: true, msg: `${io.engine.clientsCount}명에게 새로고침 전송` });
  });

  return router;
}

export default createAdminRouter;
