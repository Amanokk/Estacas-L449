import { STREETS } from "@/data/streets";
import { toXY, type LatLng } from "@/lib/geo";

const BG = "#0b1220";
const AXIS = "#5ec8f0";
const HIGHLIGHT = "#f5c518";
const USER = "#22d3ee";
const GRID = "rgba(248,250,252,0.08)";

export function renderMiniMap(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  center: LatLng,
  opts?: { highlight?: LatLng[]; user?: LatLng | null; meters?: number },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const meters = opts?.meters ?? 180;
  const origin = center;
  const scale = Math.min(w, h) / (meters * 2);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    const px = w / 2 + i * (w / 4);
    const py = h / 2 + i * (h / 4);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
  }

  const toPx = (p: LatLng) => {
    const { x, y } = toXY(p, origin);
    return { x: w / 2 + x * scale, y: h / 2 - y * scale };
  };

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = AXIS;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(1.5, w / 80);
  for (const s of STREETS) {
    if (s.path.length < 2) continue;
    ctx.beginPath();
    s.path.forEach((p, i) => {
      const q = toPx(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (opts?.highlight && opts.highlight.length > 1) {
    ctx.strokeStyle = HIGHLIGHT;
    ctx.lineWidth = Math.max(2.5, w / 50);
    ctx.beginPath();
    opts.highlight.forEach((p, i) => {
      const q = toPx(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
  }

  const user = opts?.user ?? center;
  const u = toPx(user);
  ctx.fillStyle = USER;
  ctx.beginPath();
  ctx.arc(u.x, u.y, Math.max(4, w / 28), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = HIGHLIGHT;
  ctx.beginPath();
  ctx.arc(u.x, u.y - Math.max(10, w / 14), Math.max(3, w / 40), 0, Math.PI * 2);
  ctx.fill();
}

export function miniMapDataUrl(
  center: LatLng,
  size = 256,
  opts?: { highlight?: LatLng[]; user?: LatLng | null },
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  renderMiniMap(canvas, center, opts);
  return canvas.toDataURL("image/png");
}

export function loadMiniMapImage(
  center: LatLng,
  size = 320,
  opts?: { highlight?: LatLng[]; user?: LatLng | null },
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("mini map"));
    img.src = miniMapDataUrl(center, size, opts);
  });
}
