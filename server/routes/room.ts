import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router: Router = Router();

// DB 에러 타입
interface PgError extends Error {
  code?: string;
}

// ── 방 목록 ──
router.get('/rooms', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, owner_nickname, theme FROM rooms ORDER BY created_at DESC'
    );
    const rooms = result.rows.map((r: { id: number; owner_nickname: string; theme: number }) => ({
      id: r.id,
      ownerNickname: r.owner_nickname,
      theme: r.theme,
    }));
    res.json({ ok: true, rooms });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('방 목록 조회 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 특정 방 정보 + 장식물 + 물고기 ──
router.get('/rooms/:nickname', async (req: Request, res: Response) => {
  const { nickname } = req.params;
  try {
    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE owner_nickname = $1',
      [nickname]
    );
    if (roomResult.rows.length === 0) {
      return res.json({ ok: false, msg: '방을 찾을 수 없습니다' });
    }
    const row = roomResult.rows[0];
    const room = {
      id: row.id,
      ownerNickname: row.owner_nickname,
      theme: row.theme,
      nightMode: row.night_mode,
    };

    // 장식물 조회
    const decoResult = await pool.query(
      'SELECT * FROM room_decorations WHERE room_id = $1 ORDER BY id',
      [room.id]
    );
    const decorations = decoResult.rows.map((d: Record<string, unknown>) => ({
      id: d.id,
      roomId: d.room_id,
      type: d.type,
      x: d.x,
      size: d.size,
      variant: d.variant,
      color1: d.color1,
      color2: d.color2,
      coralColor: d.coral_color,
      baseSegments: d.base_segments,
      baseSegLen: d.base_seg_len,
      baseWidth: d.base_width,
      baseSize: d.base_size,
    }));

    // 물고기 조회
    const fishResult = await pool.query(
      'SELECT * FROM fish WHERE room_id = $1 ORDER BY id',
      [room.id]
    );
    const fishes = fishResult.rows.map((f: Record<string, unknown>) => ({
      id: f.id,
      ownerNickname: f.owner_nickname,
      name: f.name,
      speciesIdx: f.species_idx,
      customColors: f.custom_colors,
      size: f.size,
      z: f.z,
      x: f.x,
      y: f.y,
      dir: f.dir,
      roomId: f.room_id,
    }));

    res.json({ ok: true, room, decorations, fishes });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('방 조회 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 방 생성 ──
router.post('/rooms', async (req: Request, res: Response) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.json({ ok: false, msg: '로그인이 필요합니다' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO rooms (owner_nickname) VALUES ($1) RETURNING *',
      [nickname]
    );
    const row = result.rows[0];
    res.json({
      ok: true,
      room: {
        id: row.id,
        ownerNickname: row.owner_nickname,
        theme: row.theme,
        nightMode: row.night_mode,
      },
    });
  } catch (e: unknown) {
    const error = e as PgError;
    if (error.code === '23505') {
      return res.json({ ok: false, msg: '이미 방이 존재합니다' });
    }
    console.error('방 생성 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 방 설정 업데이트 (theme, night_mode) ──
router.put('/rooms/:nickname', async (req: Request, res: Response) => {
  const { nickname: paramNickname } = req.params;
  const { nickname, theme, nightMode } = req.body;

  // 방 주인 검증
  if (!nickname || nickname !== paramNickname) {
    return res.json({ ok: false, msg: '권한이 없습니다' });
  }

  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (theme !== undefined) {
      updates.push(`theme = $${idx++}`);
      values.push(theme);
    }
    if (nightMode !== undefined) {
      updates.push(`night_mode = $${idx++}`);
      values.push(nightMode);
    }

    if (updates.length === 0) {
      return res.json({ ok: false, msg: '변경할 내용이 없습니다' });
    }

    values.push(paramNickname);
    await pool.query(
      `UPDATE rooms SET ${updates.join(', ')} WHERE owner_nickname = $${idx}`,
      values
    );
    res.json({ ok: true });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('방 설정 업데이트 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 장식물 추가 ──
router.post('/rooms/:nickname/decorations', async (req: Request, res: Response) => {
  const { nickname: paramNickname } = req.params;
  const { nickname, type, x, size, variant, color1, color2 } = req.body;

  if (!nickname || nickname !== paramNickname) {
    return res.json({ ok: false, msg: '권한이 없습니다' });
  }

  try {
    // 방 ID 조회
    const roomResult = await pool.query(
      'SELECT id FROM rooms WHERE owner_nickname = $1',
      [paramNickname]
    );
    if (roomResult.rows.length === 0) {
      return res.json({ ok: false, msg: '방을 찾을 수 없습니다' });
    }
    const roomId = roomResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO room_decorations (room_id, type, x, size, variant, color1, color2)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [roomId, type, x, size || 1.0, variant || 0, color1 || null, color2 || null]
    );
    const d = result.rows[0];
    res.json({
      ok: true,
      decoration: {
        id: d.id,
        roomId: d.room_id,
        type: d.type,
        x: d.x,
        size: d.size,
        variant: d.variant,
        color1: d.color1,
        color2: d.color2,
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('장식물 추가 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 장식물 삭제 ──
router.delete('/rooms/:nickname/decorations/:id', async (req: Request, res: Response) => {
  const { nickname: paramNickname, id } = req.params;
  const { nickname } = req.body;

  if (!nickname || nickname !== paramNickname) {
    return res.json({ ok: false, msg: '권한이 없습니다' });
  }

  try {
    // 방 ID 조회 + 소유자 검증
    const roomResult = await pool.query(
      'SELECT id FROM rooms WHERE owner_nickname = $1',
      [paramNickname]
    );
    if (roomResult.rows.length === 0) {
      return res.json({ ok: false, msg: '방을 찾을 수 없습니다' });
    }
    const roomId = roomResult.rows[0].id;

    await pool.query(
      'DELETE FROM room_decorations WHERE id = $1 AND room_id = $2',
      [id, roomId]
    );
    res.json({ ok: true });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('장식물 삭제 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 장식물 일괄 저장 ──
router.put('/rooms/:nickname/decorations', async (req: Request, res: Response) => {
  const { nickname: paramNickname } = req.params;
  const { nickname, decorations } = req.body;

  if (!nickname || nickname !== paramNickname) {
    return res.json({ ok: false, msg: '권한이 없습니다' });
  }

  if (!Array.isArray(decorations)) {
    return res.json({ ok: false, msg: '장식물 데이터가 올바르지 않습니다' });
  }

  try {
    // 방 ID 조회
    const roomResult = await pool.query(
      'SELECT id FROM rooms WHERE owner_nickname = $1',
      [paramNickname]
    );
    if (roomResult.rows.length === 0) {
      return res.json({ ok: false, msg: '방을 찾을 수 없습니다' });
    }
    const roomId = roomResult.rows[0].id;

    // 기존 장식물 삭제 후 새로 삽입 (트랜잭션)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM room_decorations WHERE room_id = $1', [roomId]);

      const savedDecorations = [];
      for (const deco of decorations) {
        const result = await client.query(
          `INSERT INTO room_decorations (room_id, type, x, size, variant, color1, color2, coral_color, base_segments, base_seg_len, base_width, base_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [
            roomId, deco.type, deco.x, deco.size || 1.0, deco.variant || 0,
            deco.color1 || null, deco.color2 || null, deco.coralColor || null,
            deco.baseSegments || null, deco.baseSegLen || null,
            deco.baseWidth || null, deco.baseSize || null,
          ]
        );
        const d = result.rows[0];
        savedDecorations.push({
          id: d.id,
          roomId: d.room_id,
          type: d.type,
          x: d.x,
          size: d.size,
          variant: d.variant,
          color1: d.color1,
          color2: d.color2,
        });
      }

      await client.query('COMMIT');
      res.json({ ok: true, decorations: savedDecorations });
    } catch (txError: unknown) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.error('장식물 일괄 저장 실패:', error.message);
    res.json({ ok: false, msg: '서버 오류' });
  }
});

export default router;
