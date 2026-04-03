import { rand, lerp, clamp, dist, TAU, FOOD_SEARCH_INTERVAL } from '@/utils/math';
import { store } from '@/state/store';
import { SPECIES } from '@/config/species';
import type { FishColors, SpeciesDef, FishData } from '@/types';
import type { Food } from './Food';

/** 사망 시 생성되는 거품 */
interface DeathBubble {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  opacity: number;
}

export class Fish {
  species: SpeciesDef;
  speciesIdx: number;
  isJellyfish: boolean;
  id: number;
  ownerId: string;
  ownerName: string;
  fishName: string;
  x: number;
  y: number;
  remoteX: number | null;
  remoteY: number | null;
  lastRemoteUpdate: number | null;
  palette: FishColors;
  size: number;
  speed: number;
  dir: number;
  vx: number;
  vy: number;
  pulsePhase: number;
  pulseSpeed: number;
  driftPhase: number;
  targetVx: number;
  targetVy: number;
  turnCooldown: number;
  tailPhase: number;
  tailSpeed: number;
  finPhase: number;
  chasingFood: Food | null;
  wanderAngle: number;
  z: number;
  actualSize: number;
  opacity: number;
  mouthOpen: number;
  blinkTimer: number;
  blinking: boolean;
  blinkDuration: number;
  showName: boolean;
  nameTimer: number;
  temporary: boolean;
  lifespan: number;
  age: number;
  dying: boolean;
  dyingProgress: number;
  dead: boolean;
  deathBubbles: DeathBubble[];

  constructor(data: FishData) {
    const { W, H } = store;
    const si = data.speciesIdx !== undefined ? data.speciesIdx : Math.floor(rand(0, SPECIES.length));
    this.species = SPECIES[si];
    this.speciesIdx = si;
    this.isJellyfish = this.species.isJellyfish || false;
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.ownerName = data.ownerName || '익명';
    this.fishName = data.name || '이름없음';
    this.x = (data.rx != null ? data.rx * W : null) ?? data.x ?? rand(100, W - 100);
    this.y = (data.ry != null ? data.ry * H : null) ?? data.y ?? rand(120, H - 200);
    this.remoteX = null;
    this.remoteY = null;
    this.lastRemoteUpdate = null;
    if (data.rx != null) { this.remoteX = data.rx * W; this.remoteY = data.ry! * H; this.lastRemoteUpdate = Date.now(); }
    this.palette = data.customColors || this.species.defaultColors;
    const sr = this.species.sizeRange;
    this.size = (data.size != null) ? data.size : rand(sr[0], sr[1]);
    this.speed = this.isJellyfish ? rand(0.15, 0.4) : rand(0.4, 1.2);
    this.dir = data.dir || (Math.random() > 0.5 ? 1 : -1);
    this.vx = this.isJellyfish ? 0 : this.speed * this.dir;
    this.vy = this.isJellyfish ? -this.speed : rand(-0.2, 0.2);
    // 해파리 전용
    this.pulsePhase = rand(0, TAU);
    this.pulseSpeed = rand(1.2, 2.5);
    this.driftPhase = rand(0, TAU);
    this.targetVx = this.vx;
    this.targetVy = this.vy;
    this.turnCooldown = rand(2, 8);
    this.tailPhase = rand(0, TAU);
    this.tailSpeed = rand(3, 6);
    this.finPhase = rand(0, TAU);
    this.chasingFood = null;
    this.wanderAngle = rand(0, TAU);
    this.z = (data.z != null) ? data.z : rand(0.6, 1.2);
    this.actualSize = this.size * this.z;
    this.opacity = this.isJellyfish ? (0.3 + this.z * 0.35) : (0.5 + this.z * 0.4);
    this.mouthOpen = 0;
    this.blinkTimer = rand(3, 8);
    this.blinking = false;
    this.blinkDuration = 0;
    this.showName = false;
    this.nameTimer = 0;
    // 임시 물고기 (A키로 생성) 수명
    this.temporary = data.temporary || false;
    this.lifespan = data.lifespan || (data.temporary ? rand(15, 30) : Infinity);
    this.age = 0;
    this.dying = false; // 거품 사라짐 중
    this.dyingProgress = 0;
    this.dead = false;
    this.deathBubbles = []; // 사라질 때 생성되는 거품들
  }

  update(dt: number, foods: Food[]): void {
    const { W, H, mx, my, myUid, frameCount } = store;
    const s = dt * 60;
    this.tailPhase += this.tailSpeed * dt;
    this.finPhase += 4 * dt;
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && !this.blinking) { this.blinking = true; this.blinkDuration = 0.15; }
    if (this.blinking) { this.blinkDuration -= dt; if (this.blinkDuration <= 0) { this.blinking = false; this.blinkTimer = rand(3, 10); } }
    if (this.nameTimer > 0) this.nameTimer -= dt;
    else this.showName = false;

    // 거품 사라짐 진행 (dying은 서버 fishRemoved에서 시작됨)
    if (this.dying) {
      this.dyingProgress += dt * 0.5; // ~2초에 걸쳐 사라짐
      if (this.dyingProgress >= 1) this.dead = true;
    }

    // 다른 유저 소유 물고기: 수신 위치로 lerp (AI 비활성)
    // 3초 이상 업데이트 없으면 자체 AI로 전환
    if (this.ownerId !== myUid && this.remoteX != null) {
      if (this.lastRemoteUpdate && (Date.now() - this.lastRemoteUpdate > 3000)) {
        this.remoteX = null; this.remoteY = null;
      } else {
        this.x = lerp(this.x, this.remoteX, 0.18 * s);
        this.y = lerp(this.y, this.remoteY!, 0.18 * s);
        return;
      }
    }

    if (this.isJellyfish) {
      // 해파리 전용 움직임
      this.pulsePhase += this.pulseSpeed * dt;
      this.driftPhase += 0.3 * dt;
      const pulse = Math.sin(this.pulsePhase);
      this.vy = -this.speed * (0.5 + 0.5 * Math.max(0, -pulse));
      this.vx = Math.sin(this.driftPhase) * 0.2;
      // 커서 회피
      const curDist = dist(this.x, this.y, mx, my);
      if (curDist < 60) {
        const angle = Math.atan2(this.y - my, this.x - mx);
        const flee = (60 - curDist) / 60;
        this.vx += Math.cos(angle) * flee * 0.3;
        this.vy += Math.sin(angle) * flee * 0.1;
      }
      this.x += this.vx * s;
      this.y += this.vy * s;
      // 화면 밖으로 나가면 아래에서 다시 등장
      if (this.y < -this.actualSize * 3) this.y = H + this.actualSize;
      if (this.y > H + this.actualSize * 2) this.y = -this.actualSize * 2;
      this.x = clamp(this.x, 20, W - 20);
    } else {
      // 물고기 움직임
      if (this.chasingFood && this.chasingFood.eaten) this.chasingFood = null;
      if (this.chasingFood) {
        const f = this.chasingFood, dx = f.x - this.x, dy = f.y - this.y, d = Math.hypot(dx, dy);
        if (d < this.actualSize * 0.5) { f.eaten = true; this.chasingFood = null; this.mouthOpen = 0.3; setTimeout(() => this.mouthOpen = 0, 300); }
        else { this.targetVx = (dx / d) * this.speed * 2.5; this.targetVy = (dy / d) * this.speed * 2.5; this.dir = this.targetVx > 0 ? 1 : -1; }
      } else {
        this.turnCooldown -= dt;
        if (this.turnCooldown <= 0) {
          this.wanderAngle += rand(-0.8, 0.8);
          this.targetVx = Math.cos(this.wanderAngle) * this.speed;
          this.targetVy = Math.sin(this.wanderAngle) * this.speed * 0.4;
          if (Math.abs(this.targetVx) > 0.1) this.dir = this.targetVx > 0 ? 1 : -1;
          this.turnCooldown = rand(2, 6);
        }
        if (foods.length > 0 && (frameCount + this.id) % FOOD_SEARCH_INTERVAL === 0) {
          let closest: Food | null = null, closestDist2 = 90000; // 300^2
          for (let fi = 0; fi < foods.length; fi++) { const f = foods[fi]; if (f.eaten) continue; const dx = f.x - this.x, dy = f.y - this.y, d2 = dx * dx + dy * dy; if (d2 < closestDist2) { closest = f; closestDist2 = d2; } }
          if (closest) this.chasingFood = closest;
        }
      }
      // 경계 회피: wanderAngle을 안쪽으로 꺾어서 자연스러운 방향 전환
      const marginX = 100, marginY = 100, marginBottom = 140;
      let steer = false;
      if (this.x < marginX) {
        this.wanderAngle = lerp(this.wanderAngle, 0, 0.1); // 오른쪽으로
        steer = true;
      } else if (this.x > W - marginX) {
        this.wanderAngle = lerp(this.wanderAngle, Math.PI, 0.1); // 왼쪽으로
        steer = true;
      }
      if (this.y < marginY) {
        this.wanderAngle = lerp(this.wanderAngle, Math.PI * 0.3, 0.1); // 아래쪽으로
        steer = true;
      } else if (this.y > H - marginBottom) {
        this.wanderAngle = lerp(this.wanderAngle, -Math.PI * 0.3, 0.1); // 위쪽으로
        steer = true;
      }
      if (steer) {
        this.targetVx = Math.cos(this.wanderAngle) * this.speed;
        this.targetVy = Math.sin(this.wanderAngle) * this.speed * 0.4;
        if (Math.abs(this.targetVx) > 0.1) this.dir = this.targetVx > 0 ? 1 : -1;
      }

      // 마우스 회피
      const curDist = dist(this.x, this.y, mx, my);
      if (curDist < 70 && !this.chasingFood) {
        const angle = Math.atan2(this.y - my, this.x - mx);
        const flee = (70 - curDist) / 70;
        this.targetVx += Math.cos(angle) * flee * 1.2;
        this.targetVy += Math.sin(angle) * flee * 0.3;
        this.tailSpeed = 8;
      } else { this.tailSpeed = lerp(this.tailSpeed, rand(3, 6), 0.02); }
      const lerpRate = steer ? 0.06 : 0.03;
      this.vx = lerp(this.vx, this.targetVx, lerpRate * s);
      this.vy = lerp(this.vy, this.targetVy, lerpRate * s);
      this.x += this.vx * s; this.y += this.vy * s;
      this.x = clamp(this.x, 20, W - 20); this.y = clamp(this.y, 20, H - 80);
      if (Math.abs(this.vx) > 0.05) this.dir = this.vx > 0 ? 1 : -1;
    }
  }

  drawDeathBubbles(ctx: CanvasRenderingContext2D): void {
    const { time } = store;
    for (let i = this.deathBubbles.length - 1; i >= 0; i--) {
      const b = this.deathBubbles[i];
      b.y += b.vy;
      b.x += b.vx + Math.sin(time * 3 + i) * 0.3;
      b.opacity -= 0.008;
      if (b.opacity <= 0) { this.deathBubbles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = b.opacity;
      const g = ctx.createRadialGradient(b.x - b.size * 0.3, b.y - b.size * 0.3, 0, b.x, b.y, b.size);
      g.addColorStop(0, 'rgba(180,230,255,0.2)');
      g.addColorStop(0.7, 'rgba(120,200,255,0.1)');
      g.addColorStop(1, 'rgba(100,180,255,0.25)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(160,220,255,0.35)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(b.x - b.size * 0.25, b.y - b.size * 0.25, b.size * 0.2, b.size * 0.15, -0.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 거품 사라짐 중이면 거품만 그리기
    if (this.dying) {
      // 사라지는 동안 물고기를 축소+투명하게
      const fadeOut = 1 - this.dyingProgress;
      if (fadeOut > 0) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.opacity * fadeOut * fadeOut;
        ctx.scale(fadeOut, fadeOut);
        // 떨림 효과
        ctx.translate(rand(-2, 2), rand(-2, 2));
        this._drawBody(ctx);
        ctx.restore();
      }
      this.drawDeathBubbles(ctx);
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    this._drawBody(ctx);
    ctx.restore();
  }

  _drawBody(ctx: CanvasRenderingContext2D): void {
    const { time } = store;
    // 이름 표시 (호버 또는 생성 직후)
    if (this.showName || this.nameTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.nameTimer > 0 ? this.nameTimer : 0.8);
      ctx.fillStyle = 'rgba(10,25,50,0.7)';
      ctx.font = '10px system-ui';
      const nameText = `${this.fishName} (${this.ownerName})`;
      const tw = ctx.measureText(nameText).width;
      const px = -tw / 2, py = -this.actualSize - 18;
      ctx.beginPath();
      (ctx as any).roundRect(px - 6, py - 10, tw + 12, 16, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(180,220,255,0.85)';
      ctx.fillText(nameText, px, py);
      ctx.restore();
    }

    if (!this.isJellyfish) ctx.scale(this.dir, 1);
    ctx.globalAlpha = this.opacity;
    const sz = this.actualSize;
    const tw2 = Math.sin(this.tailPhase) * 0.3;
    const fw = Math.sin(this.finPhase) * 0.2;

    if (this.isJellyfish || this.species.customDraw) {
      // 해파리/특수 종은 종 draw만 호출 (눈/입/광택 자체 처리)
      this.species.draw(ctx, sz, this.palette, tw2, fw, time);
    } else {
      const bodyStretch = 1 + Math.abs(this.vx) * 0.02;
      ctx.scale(bodyStretch, 1 / bodyStretch);

      this.species.draw(ctx, sz, this.palette, tw2, fw, time);

      // 광택
      const shG = ctx.createRadialGradient(sz * 0.1, -sz * 0.1, 0, sz * 0.1, -sz * 0.1, sz * 0.25);
      shG.addColorStop(0, 'rgba(255,255,255,0.25)');
      shG.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shG;
      ctx.beginPath(); ctx.ellipse(sz * 0.1, -sz * 0.08, sz * 0.2, sz * 0.12, -0.2, 0, TAU); ctx.fill();

      // 눈
      const bw = this.species.bodyW || 0.5;
      const eyeX = sz * (bw - 0.1);
      const eyeY = -sz * 0.06;
      const eyeR = sz * 0.07;
      ctx.fillStyle = '#FAFAFA';
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, eyeR, eyeR * 0.95, 0, 0, TAU); ctx.fill();
      if (!this.blinking) {
        ctx.fillStyle = '#1A1A2E';
        ctx.beginPath(); ctx.arc(eyeX + 1, eyeY, eyeR * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(eyeX + eyeR * 0.2, eyeY - eyeR * 0.25, eyeR * 0.25, 0, TAU); ctx.fill();
      } else {
        ctx.strokeStyle = '#1A1A2E'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(eyeX - eyeR, eyeY); ctx.lineTo(eyeX + eyeR, eyeY); ctx.stroke();
      }

      // 입
      const mx2 = sz * (bw + 0.05);
      const my2 = sz * 0.04;
      if (this.mouthOpen > 0) {
        ctx.fillStyle = '#2A1A3A';
        ctx.beginPath(); ctx.arc(mx2, my2, sz * 0.035, 0, TAU); ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(mx2 - sz * 0.02, my2);
        ctx.quadraticCurveTo(mx2, my2 + sz * 0.02, mx2 + sz * 0.015, my2);
        ctx.stroke();
      }
    } // if(!isJellyfish) 끝
  }
}
