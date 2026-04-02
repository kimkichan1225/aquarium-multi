import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router: Router = Router();

// DB 에러 타입 (PostgreSQL 에러코드 포함)
interface PgError extends Error {
  code?: string;
}

// 요청 바디 타입
interface RegisterBody {
  nickname?: string;
  password?: string;
}

interface LoginBody {
  password?: string;
}

// ── 회원가입 ──
router.post('/register', async (req: Request<object, unknown, RegisterBody>, res: Response) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) {
    return res.json({ ok: false, msg: '닉네임과 PIN을 입력하세요' });
  }
  if (nickname.length > 20) {
    return res.json({ ok: false, msg: '닉네임은 20자 이하' });
  }
  if (!/^\d{4,8}$/.test(password)) {
    return res.json({ ok: false, msg: 'PIN은 4~8자리 숫자' });
  }
  try {
    // PIN 중복 체크
    const dup = await pool.query('SELECT id FROM users WHERE password = $1', [password]);
    if (dup.rows.length > 0) {
      return res.json({ ok: false, msg: '이미 사용 중인 PIN 번호입니다' });
    }
    await pool.query('INSERT INTO users (nickname, password) VALUES ($1, $2)', [
      nickname,
      password,
    ]);
    res.json({ ok: true, nickname });
  } catch (e: unknown) {
    const error = e as PgError;
    if (error.code === '23505') {
      return res.json({ ok: false, msg: '이미 사용 중인 닉네임입니다' });
    }
    res.json({ ok: false, msg: '서버 오류' });
  }
});

// ── 로그인 ──
router.post('/login', async (req: Request<object, unknown, LoginBody>, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.json({ ok: false, msg: 'PIN 번호를 입력하세요' });
  }
  const result = await pool.query('SELECT * FROM users WHERE password = $1', [password]);
  if (result.rows.length === 0) {
    return res.json({ ok: false, msg: '등록되지 않은 PIN 번호입니다' });
  }
  res.json({ ok: true, nickname: result.rows[0].nickname });
});

export default router;
