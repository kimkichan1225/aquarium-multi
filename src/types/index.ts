// ── 공유 타입 정의 ──

/** 물고기 색상 팔레트 */
export interface FishColors {
  body: string;
  fin: string;
  belly: string;
  accent: string;
}

/** 물고기 종 정의 */
export interface SpeciesDef {
  name: string;
  bodyW: number;
  bodyH: number;
  sizeRange: [number, number];
  defaultColors: FishColors;
  isJellyfish?: boolean;
  customDraw?: boolean;
  jellyPalettes?: FishColors[];
  draw: (
    ctx: CanvasRenderingContext2D,
    sz: number,
    p: FishColors,
    tw: number,
    fw: number,
    t: number,
  ) => void;
}

/** 물고기 데이터 (네트워크 전송용 포함) */
export interface FishData {
  id: number;
  ownerId: string;
  ownerName: string;
  name: string;
  speciesIdx: number;
  customColors: FishColors;
  size: number;
  z: number;
  x: number;
  y: number;
  dir: number;
  temporary?: boolean;
  lifespan?: number;
  dbId?: number;
  customParts?: Record<string, string> | null;
  rx?: number;
  ry?: number;
  createdAt?: number;
}

/** 채팅 메시지 */
export interface ChatMessage {
  name: string;
  msg: string;
  time: number;
}

/** 테마 정의 */
export interface ThemeDef {
  name: string;
  sky: string[];
  night: string[];
  light: string;
  sand: string[];
  sandNight: string[];
  sandTex: string;
  sandTexNight: string;
}

/** 커서 데이터 (네트워크 수신용) */
export interface CursorData {
  id: string;
  x: number;
  y: number;
  name: string;
  targetX: number;
  targetY: number;
  lastSeen: number;
}

/** 원격 커서 (CursorData와 동일 구조) */
export type RemoteCursor = CursorData;
