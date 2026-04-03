// ── 물고기 직접 그리기 에디터 ──

import { TAU } from '@/utils/math';
import { getTime } from '@/state/store';

export type PartName = 'body' | 'tail' | 'dorsal' | 'pectoral';

interface DrawState {
  activePart: PartName;
  brushSize: number;
  brushColor: string;
  isEraser: boolean;
}

const PART_LABELS: Record<PartName, string> = {
  body: '🫧 몸통', tail: '🔱 꼬리', dorsal: '📐 등지느러미', pectoral: '🪶 배지느러미',
};
const PART_OVERLAY_COLORS: Record<PartName, string> = {
  body: 'rgba(100,180,255,0.15)',
  tail: 'rgba(255,100,100,0.15)',
  dorsal: 'rgba(100,255,150,0.15)',
  pectoral: 'rgba(255,200,80,0.15)',
};
const PART_BORDER_COLORS: Record<PartName, string> = {
  body: '#64B4FF',
  tail: '#FF6464',
  dorsal: '#64FF96',
  pectoral: '#FFC850',
};

const PALETTE = ['#FF4444','#FF8844','#FFCC44','#44CC44','#4488FF','#8844FF','#222222','#FFFFFF',
                 '#FF88AA','#FFAA66','#FFEE88','#88DDAA','#88BBFF','#BB88FF','#666666','#CCDDEE'];

const CW = 200, CH = 140; // 그리기 캔버스 크기
const PW = 160, PH = 120; // 미리보기 크기

// 파트별 오프스크린 캔버스
const partCanvases: Record<PartName, HTMLCanvasElement> = {} as any;
const partCtxs: Record<PartName, CanvasRenderingContext2D> = {} as any;
// 되돌리기용 히스토리 (파트별)
const partHistory: Record<PartName, ImageData[]> = { body: [], tail: [], dorsal: [], pectoral: [] };
const MAX_HISTORY = 20;

// 메인 그리기 캔버스
let drawCanvas: HTMLCanvasElement;
let drawCtx: CanvasRenderingContext2D;
// 미리보기 캔버스
let previewCanvas: HTMLCanvasElement;
let previewCtx: CanvasRenderingContext2D;
let previewRAF = 0;

const state: DrawState = {
  activePart: 'body',
  brushSize: 6,
  brushColor: '#4488FF',
  isEraser: false,
};

let isDrawing = false;
let lastX = 0, lastY = 0;
let editorEl: HTMLElement | null = null;
let onSubmitCallback: ((partDataURLs: Record<PartName, string>) => void) | null = null;

function initPartCanvases(): void {
  for (const part of ['body','tail','dorsal','pectoral'] as PartName[]) {
    const cv = document.createElement('canvas');
    cv.width = CW; cv.height = CH;
    partCanvases[part] = cv;
    partCtxs[part] = cv.getContext('2d')!;
    partHistory[part] = [];
  }
}

function saveHistory(): void {
  const part = state.activePart;
  const data = partCtxs[part].getImageData(0, 0, CW, CH);
  partHistory[part].push(data);
  if (partHistory[part].length > MAX_HISTORY) partHistory[part].shift();
}

function undo(): void {
  const part = state.activePart;
  const hist = partHistory[part];
  if (hist.length > 0) {
    hist.pop();
    const ctx = partCtxs[part];
    ctx.clearRect(0, 0, CW, CH);
    if (hist.length > 0) ctx.putImageData(hist[hist.length - 1], 0, 0);
  }
  compositeToMain();
}

function clearPart(): void {
  saveHistory();
  partCtxs[state.activePart].clearRect(0, 0, CW, CH);
  compositeToMain();
}

function clearAll(): void {
  for (const part of ['body','tail','dorsal','pectoral'] as PartName[]) {
    partCtxs[part].clearRect(0, 0, CW, CH);
    partHistory[part] = [];
  }
  compositeToMain();
}

/** 모든 파트를 합성해서 메인 캔버스에 표시 */
function compositeToMain(): void {
  drawCtx.clearRect(0, 0, CW, CH);
  // 가이드 격자
  drawCtx.strokeStyle = 'rgba(100,180,255,0.08)';
  drawCtx.lineWidth = 0.5;
  for (let x = 0; x <= CW; x += 20) { drawCtx.beginPath(); drawCtx.moveTo(x, 0); drawCtx.lineTo(x, CH); drawCtx.stroke(); }
  for (let y = 0; y <= CH; y += 20) { drawCtx.beginPath(); drawCtx.moveTo(0, y); drawCtx.lineTo(CW, y); drawCtx.stroke(); }
  // 중심선
  drawCtx.strokeStyle = 'rgba(100,180,255,0.15)';
  drawCtx.lineWidth = 1;
  drawCtx.beginPath(); drawCtx.moveTo(CW/2, 0); drawCtx.lineTo(CW/2, CH); drawCtx.stroke();
  drawCtx.beginPath(); drawCtx.moveTo(0, CH/2); drawCtx.lineTo(CW, CH/2); drawCtx.stroke();

  // 파트 순서대로 그리기
  for (const part of ['tail','dorsal','pectoral','body'] as PartName[]) {
    drawCtx.drawImage(partCanvases[part], 0, 0);
    // 비활성 파트는 오버레이
    if (part !== state.activePart) {
      drawCtx.fillStyle = PART_OVERLAY_COLORS[part];
      drawCtx.fillRect(0, 0, CW, CH);
    }
  }

  // 활성 파트 테두리 표시
  drawCtx.strokeStyle = PART_BORDER_COLORS[state.activePart];
  drawCtx.lineWidth = 2;
  drawCtx.setLineDash([4, 4]);
  drawCtx.strokeRect(1, 1, CW - 2, CH - 2);
  drawCtx.setLineDash([]);
}

/** 미리보기 애니메이션 */
function renderPreview(): void {
  const t = getTime();
  previewCtx.clearRect(0, 0, PW, PH);
  // 배경
  const bg = previewCtx.createLinearGradient(0, 0, 0, PH);
  bg.addColorStop(0, '#041828'); bg.addColorStop(1, '#0A3050');
  previewCtx.fillStyle = bg;
  previewCtx.fillRect(0, 0, PW, PH);

  const cx = PW / 2, cy = PH / 2;
  const scale = 0.55;
  const tw = Math.sin(t * 4) * 0.3;
  const fw = Math.sin(t * 3) * 2;
  const pw = Math.sin(t * 5) * 0.15;

  previewCtx.save();
  previewCtx.translate(cx, cy);
  previewCtx.scale(scale, scale);

  // 꼬리: 왼쪽 끝 기준 회전
  previewCtx.save();
  previewCtx.translate(-CW/2, 0);
  previewCtx.rotate(tw);
  previewCtx.drawImage(partCanvases.tail, -CW/2, -CH/2);
  previewCtx.restore();

  // 등지느러미: 위아래 파동
  previewCtx.save();
  previewCtx.translate(0, fw);
  previewCtx.drawImage(partCanvases.dorsal, -CW/2, -CH/2);
  previewCtx.restore();

  // 배지느러미: 펄럭임
  previewCtx.save();
  previewCtx.translate(0, CH * 0.15);
  previewCtx.rotate(pw);
  previewCtx.drawImage(partCanvases.pectoral, -CW/2, -CH/2);
  previewCtx.restore();

  // 몸통: 고정
  previewCtx.drawImage(partCanvases.body, -CW/2, -CH/2);

  previewCtx.restore();
  previewRAF = requestAnimationFrame(renderPreview);
}

/** 그리기 이벤트 */
function getCanvasPos(e: MouseEvent | TouchEvent): [number, number] {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = CW / rect.width, scaleY = CH / rect.height;
  if ('touches' in e) {
    const touch = e.touches[0] || e.changedTouches[0];
    return [(touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY];
  }
  return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
}

function drawLine(x0: number, y0: number, x1: number, y1: number): void {
  const ctx = partCtxs[state.activePart];
  ctx.lineWidth = state.brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (state.isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = state.brushColor;
  }
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  compositeToMain();
}

function onDrawStart(e: MouseEvent | TouchEvent): void {
  e.preventDefault();
  isDrawing = true;
  saveHistory();
  [lastX, lastY] = getCanvasPos(e);
  drawLine(lastX, lastY, lastX, lastY);
}

function onDrawMove(e: MouseEvent | TouchEvent): void {
  if (!isDrawing) return;
  e.preventDefault();
  const [x, y] = getCanvasPos(e);
  drawLine(lastX, lastY, x, y);
  lastX = x; lastY = y;
}

function onDrawEnd(): void {
  isDrawing = false;
}

/** 에디터 UI 생성 */
export function openDrawEditor(onSubmit: (partDataURLs: Record<PartName, string>) => void): void {
  onSubmitCallback = onSubmit;
  if (!editorEl) createEditorDOM();
  initPartCanvases();
  clearAll();
  editorEl!.classList.add('open');
  previewRAF = requestAnimationFrame(renderPreview);
}

export function closeDrawEditor(): void {
  editorEl?.classList.remove('open');
  cancelAnimationFrame(previewRAF);
}

function createEditorDOM(): void {
  editorEl = document.createElement('div');
  editorEl.id = 'draw-editor-overlay';
  editorEl.innerHTML = `
    <div class="draw-editor">
      <div class="de-header">
        <h2>🎨 물고기 직접 그리기</h2>
        <button class="de-close" id="de-close">×</button>
      </div>
      <div class="de-content">
        <div class="de-left">
          <div class="de-parts" id="de-parts"></div>
          <div class="de-canvas-wrap">
            <canvas id="de-canvas" width="${CW}" height="${CH}"></canvas>
          </div>
          <div class="de-tools" id="de-tools"></div>
          <div class="de-palette" id="de-palette"></div>
        </div>
        <div class="de-right">
          <div class="de-preview-label">미리보기</div>
          <canvas id="de-preview" width="${PW}" height="${PH}"></canvas>
          <div class="de-name-row">
            <input type="text" id="de-fish-name" placeholder="물고기 이름" maxlength="20">
          </div>
          <div class="de-actions">
            <button class="btn" id="de-cancel">취소</button>
            <button class="btn primary" id="de-submit">🐠 생성!</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(editorEl);

  // 캔버스 초기화
  drawCanvas = document.getElementById('de-canvas') as HTMLCanvasElement;
  drawCtx = drawCanvas.getContext('2d')!;
  previewCanvas = document.getElementById('de-preview') as HTMLCanvasElement;
  previewCtx = previewCanvas.getContext('2d')!;

  // 파트 탭
  const partsEl = document.getElementById('de-parts')!;
  for (const part of ['body','tail','dorsal','pectoral'] as PartName[]) {
    const btn = document.createElement('button');
    btn.className = 'de-part-btn' + (part === 'body' ? ' active' : '');
    btn.textContent = PART_LABELS[part];
    btn.dataset.part = part;
    btn.addEventListener('click', () => {
      state.activePart = part;
      partsEl.querySelectorAll('.de-part-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      compositeToMain();
    });
    partsEl.appendChild(btn);
  }

  // 도구 바
  const toolsEl = document.getElementById('de-tools')!;
  const tools = [
    { label: '✏️3', action: () => { state.brushSize = 3; state.isEraser = false; } },
    { label: '✏️6', action: () => { state.brushSize = 6; state.isEraser = false; } },
    { label: '✏️12', action: () => { state.brushSize = 12; state.isEraser = false; } },
    { label: '🧹', action: () => { state.isEraser = true; state.brushSize = 16; } },
    { label: '↩', action: undo },
    { label: '🗑️파트', action: clearPart },
    { label: '🗑️전체', action: clearAll },
  ];
  for (const tool of tools) {
    const btn = document.createElement('button');
    btn.className = 'de-tool-btn';
    btn.textContent = tool.label;
    btn.addEventListener('click', tool.action);
    toolsEl.appendChild(btn);
  }

  // 팔레트
  const paletteEl = document.getElementById('de-palette')!;
  for (const color of PALETTE) {
    const swatch = document.createElement('div');
    swatch.className = 'de-swatch';
    swatch.style.background = color;
    swatch.addEventListener('click', () => {
      state.brushColor = color;
      state.isEraser = false;
      paletteEl.querySelectorAll('.de-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
    paletteEl.appendChild(swatch);
  }

  // 그리기 이벤트
  drawCanvas.addEventListener('mousedown', onDrawStart);
  drawCanvas.addEventListener('mousemove', onDrawMove);
  drawCanvas.addEventListener('mouseup', onDrawEnd);
  drawCanvas.addEventListener('mouseleave', onDrawEnd);
  drawCanvas.addEventListener('touchstart', onDrawStart, { passive: false });
  drawCanvas.addEventListener('touchmove', onDrawMove, { passive: false });
  drawCanvas.addEventListener('touchend', onDrawEnd);

  // 버튼 이벤트
  document.getElementById('de-close')!.addEventListener('click', closeDrawEditor);
  document.getElementById('de-cancel')!.addEventListener('click', closeDrawEditor);
  document.getElementById('de-submit')!.addEventListener('click', () => {
    if (onSubmitCallback) {
      const urls: Record<PartName, string> = {
        body: partCanvases.body.toDataURL(),
        tail: partCanvases.tail.toDataURL(),
        dorsal: partCanvases.dorsal.toDataURL(),
        pectoral: partCanvases.pectoral.toDataURL(),
      };
      onSubmitCallback(urls);
    }
    closeDrawEditor();
  });

  // 오버레이 클릭 닫기
  editorEl.addEventListener('click', (e) => {
    if (e.target === editorEl) closeDrawEditor();
  });
}

/** 파트 dataURL로 물고기 그리기 함수 생성 (Fish에서 사용) */
export function createCustomDraw(partDataURLs: Record<PartName, string>): {
  draw: (ctx: CanvasRenderingContext2D, sz: number, p: any, tw: number, fw: number, t: number) => void;
  images: Record<PartName, HTMLImageElement>;
} {
  const images: Record<PartName, HTMLImageElement> = {} as any;
  for (const part of ['body','tail','dorsal','pectoral'] as PartName[]) {
    const img = new Image();
    img.src = partDataURLs[part];
    images[part] = img;
  }

  return {
    images,
    draw(ctx, sz, _p, tw, fw, t) {
      const scale = sz / 40; // 기준 크기 대비 스케일
      const pw = Math.sin(t * 5) * 0.15;
      const finWave = Math.sin(t * 3) * 2 * scale;

      ctx.save();
      ctx.scale(scale, scale);

      // 꼬리: 왼쪽 기준 회전
      ctx.save();
      ctx.translate(-CW / 2, 0);
      ctx.rotate(tw);
      ctx.drawImage(images.tail, -CW / 2, -CH / 2);
      ctx.restore();

      // 등지느러미: 위아래 파동
      ctx.save();
      ctx.translate(0, finWave);
      ctx.drawImage(images.dorsal, -CW / 2, -CH / 2);
      ctx.restore();

      // 배지느러미: 펄럭임
      ctx.save();
      ctx.translate(0, CH * 0.15);
      ctx.rotate(pw);
      ctx.drawImage(images.pectoral, -CW / 2, -CH / 2);
      ctx.restore();

      // 몸통: 고정
      ctx.drawImage(images.body, -CW / 2, -CH / 2);

      ctx.restore();
    },
  };
}

/** 에디터에서 입력된 이름 가져오기 */
export function getDrawFishName(): string {
  return (document.getElementById('de-fish-name') as HTMLInputElement)?.value.trim() || '커스텀 물고기';
}
