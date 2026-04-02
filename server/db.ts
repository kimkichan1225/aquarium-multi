import { Pool, QueryResult } from 'pg';

// ── DB 연결 ──
const pool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// ── DB 초기화 ──
async function initDB(): Promise<void> {
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      owner_nickname VARCHAR(20) UNIQUE REFERENCES users(nickname),
      theme INT DEFAULT 1,
      night_mode BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_decorations (
      id SERIAL PRIMARY KEY,
      room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      x FLOAT NOT NULL,
      size FLOAT DEFAULT 1.0,
      variant INT DEFAULT 0,
      color1 VARCHAR(20),
      color2 VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE fish ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id)`);
  console.log('DB 테이블 준비 완료');
}

// 방 타입
export interface Room {
  id: number;
  ownerNickname: string;
  theme: number;
  nightMode: boolean;
}

// 방 장식물 타입
export interface RoomDecoration {
  id: number;
  roomId: number;
  type: string;   // 'seaweed' | 'coral'
  x: number;      // 0~1 비율
  size: number;
  variant: number;
  color1: string | null;
  color2: string | null;
}

// DB 물고기 행 타입
export interface FishRow {
  id: number;
  owner_nickname: string;
  name: string;
  species_idx: number;
  custom_colors: Record<string, string> | null;
  size: number;
  z: number;
  x: number;
  y: number;
  dir: number;
  room_id: number | null;
  created_at: Date;
}

// 메모리 물고기 타입
export interface Fish {
  id: number;
  dbId?: number;
  ownerId: string;
  ownerName: string;
  name: string;
  speciesIdx: number;
  customColors: Record<string, string> | null;
  size: number;
  z: number;
  x: number;
  y: number;
  dir: number;
  roomId?: number | null;
  roomOwner?: string | null;
  temporary: boolean;
  lifespan?: number | null;
  createdAt: number | Date;
  rx?: number;
  ry?: number;
}

// DB에서 영구 물고기 로드
async function loadFishFromDB(
  fishes: Map<number, Fish>,
  getNextFishId: () => number,
  setNextFishId: (id: number) => void
): Promise<void> {
  const result: QueryResult<FishRow & { room_owner?: string }> = await pool.query(
    `SELECT f.*, r.owner_nickname as room_owner FROM fish f LEFT JOIN rooms r ON f.room_id = r.id ORDER BY f.id`
  );
  for (const row of result.rows) {
    const fish: Fish = {
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
      roomId: row.room_id,
      roomOwner: row.room_owner || null,
      temporary: false,
      createdAt: row.created_at,
    };
    fishes.set(fish.id, fish);
    if (fish.id >= getNextFishId()) {
      setNextFishId(fish.id + 1);
    }
  }
  console.log(`DB에서 물고기 ${fishes.size}마리 로드`);
}

export { pool, initDB, loadFishFromDB };
