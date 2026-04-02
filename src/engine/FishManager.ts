// ── 물고기 관리 ──

import { dist } from '@/utils/math';
import { getMyUid, getMx, getMy } from '@/state/store';
import type { Fish } from '@/entities/Fish';

/** 물고기 배열 */
export const fishes: Fish[] = [];

/** ID → Fish 빠른 조회 맵 */
export const fishById: Map<number, Fish> = new Map();

/** z 기반 정렬 필요 여부 플래그 */
export let fishSortDirty = true;
export function setFishSortDirty(v: boolean): void { fishSortDirty = v; }

/** 마지막 물고기 수 (UI 업데이트 최적화용) */
export let lastFishCount = 0;
export function setLastFishCount(v: number): void { lastFishCount = v; }

/** 물고기 추가 */
export function addFish(fish: Fish): void {
  fishes.push(fish);
  fishById.set(fish.id, fish);
  fishSortDirty = true;
}

/** 물고기 제거 */
export function removeFish(fish: Fish): void {
  const idx = fishes.indexOf(fish);
  if (idx >= 0) {
    fishById.delete(fish.id);
    fishes.splice(idx, 1);
    fishSortDirty = true;
  }
}

/** 맵 전체 재빌드 */
export function rebuildFishMap(): void {
  fishById.clear();
  for (let i = 0; i < fishes.length; i++) {
    fishById.set(fishes[i].id, fishes[i]);
  }
}

/** 특정 소유자의 물고기 목록 반환 */
export function getFishesByOwner(ownerId: string, excludeTemporary = false): Fish[] {
  return fishes.filter(f => f.ownerId === ownerId && (!excludeTemporary || !f.temporary));
}

/** 마우스 근처 물고기에 이름 표시 */
export function checkFishHover(): void {
  const mx = getMx();
  const my = getMy();
  for (const f of fishes) {
    const d = dist(f.x, f.y, mx, my);
    if (d < f.actualSize + 10) {
      f.showName = true;
      f.nameTimer = 2;
    }
  }
}
