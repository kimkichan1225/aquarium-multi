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
  console.log('DB 테이블 준비 완료');
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
  const result: QueryResult<FishRow> = await pool.query('SELECT * FROM fish ORDER BY id');
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
