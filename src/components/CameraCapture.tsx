import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings2, X, ZoomIn, ZoomOut } from "lucide-react";
import { downloadDataUrl } from "@/lib/savePhoto";
import { addExif } from "@/lib/exif";
import { addPhotoLog } from "@/lib/photoLog";
import { putPhoto } from "@/lib/photoStore";
import { loadGoogleStaticMap } from "@/lib/googleMaps";
import { MiniMapThumb } from "@/components/MiniMapThumb";
import {
  type CameraSettings,
  DEFAULT_CAMERA_SETTINGS,
  SIZE_FACTOR,
  type StampSize,
  formatStamp,
  loadCameraSettings,
  saveCameraSettings,
  stampNow,
} from "@/lib/cameraSettings";

export type CameraStamp = {
  estaca: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.05;

const StampClock = memo(function StampClock({ settings }: { settings: CameraSettings }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), settings.showSeconds ? 1000 : 30000);
    return () => clearInterval(t);
  }, [settings.showSeconds]);
  return <>{formatStamp(stampNow(settings, now), settings)}</>;
});

function mockCameraStream(): MediaStream {
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;
  let frame = 0;
  let raf = 0;
  const draw = () => {
    frame += 1;
    const w = canvas.width;
    const h = canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    sky.addColorStop(0, "#7eb6d9");
    sky.addColorStop(1, "#c5d8e8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.45);
    ctx.fillStyle = "#3a4a38";
    ctx.fillRect(0, h * 0.42, w, h * 0.18);
    ctx.fillStyle = "#2a2a2c";
    ctx.fillRect(0, h * 0.58, w, h * 0.42);
    ctx.fillStyle = "#f5c518";
    const dash = 48;
    const offset = (frame * 3) % (dash * 2);
    for (let x = -dash + offset; x < w; x += dash * 2) {
      ctx.fillRect(x, h * 0.78, dash, 8);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();
  const stream = canvas.captureStream(24);
  const stop = stream.getTracks()[0]?.stop.bind(stream.getTracks()[0]);
  stream.getTracks()[0].stop = () => {
    cancelAnimationFrame(raf);
    stop?.();
  };
  return stream;
}

async function openWideCamera(): Promise<{ stream: MediaStream; mock: boolean }> {
  if (!navigator.mediaDevices?.getUserMedia) return { stream: mockCameraStream(), mock: true };
  const tryGet = (video: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({ audio: false, video });
  try {
    const stream = await tryGet({
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 30 },
    });
    const track = stream.getVideoTracks()[0];
    if (track) {
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
        zoom?: { min: number; max: number };
      };
      if (caps.zoom && caps.zoom.min < caps.zoom.max) {
        await track
          .applyConstraints({ advanced: [{ zoom: caps.zoom.min } as MediaTrackConstraintSet] })
          .catch(() => undefined);
      }
    }
    return { stream, mock: false };
  } catch {
    try {
      const stream = await tryGet({ facingMode: { ideal: "environment" } });
      return { stream, mock: false };
    } catch {
      return { stream: mockCameraStream(), mock: true };
    }
  }
}

export function CameraCapture({ stamp, onClose }: { stamp: CameraStamp; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const busyRef = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const boxRef = useRef<{ x: number; y: number; w: number; h: number; fontSize: number } | null>(
    null,
  );
  const stampDateRef = useRef<Date>(new Date());
  const [usingMock, setUsingMock] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const zoomRef = useRef(ZOOM_MIN);
  zoomRef.current = zoom;

  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => setSettings(loadCameraSettings()), []);
  const update = (patch: Partial<CameraSettings>) =>
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveCameraSettings(next);
      return next;
    });

  const [angle, setAngle] = useState(0);
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const read = () => {
      const so = window.screen?.orientation;
      const a =
        typeof so?.angle === "number"
          ? so.angle
          : ((window as unknown as { orientation?: number }).orientation ?? 0);
      setAngle(((a % 360) + 360) % 360);
      setLandscape(window.innerWidth > window.innerHeight);
    };
    read();
    window.addEventListener("resize", read);
    window.screen?.orientation?.addEventListener?.("change", read);
    return () => {
      window.removeEventListener("resize", read);
      window.screen?.orientation?.removeEventListener?.("change", read);
    };
  }, []);

  const layoutRotation = landscape ? (angle === 180 ? 180 : 0) : angle === 180 ? -90 : 90;

  useEffect(() => {
    if (stamp.lat === null || stamp.lng === null) {
      mapImgRef.current = null;
      return;
    }
    void loadGoogleStaticMap(stamp.lat, stamp.lng, 320)
      .then((img) => {
        mapImgRef.current = img;
      })
      .catch(() => {
        mapImgRef.current = null;
      });
  }, [stamp.lat, stamp.lng]);

  const attachingRef = useRef(false);
  const attachStream = useCallback(async () => {
    const v = videoRef.current;
    if (!v || attachingRef.current) return;
    attachingRef.current = true;
    try {
      let s = streamRef.current;
      const alive = !!s && s.getVideoTracks().some((t) => t.readyState === "live");
      if (!alive) {
        try {
          const opened = await openWideCamera();
          s = opened.stream;
          streamRef.current = s;
          setUsingMock(opened.mock);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Não foi possível abrir a câmera.");
          return;
        }
      }
      if (v.srcObject !== s) {
        v.srcObject = s;
        v.muted = true;
        v.playsInline = true;
      }
      if (v.paused) {
        try {
          await v.play();
        } catch {
          setTimeout(() => void v.play().catch(() => undefined), 150);
        }
      }
    } finally {
      attachingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void attachStream();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [attachStream]);

  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom: zoomRef.current };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const next = pinchRef.current.zoom * (dist / pinchRef.current.dist);
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    setZoom(Math.round(clamped / ZOOM_STEP) * ZOOM_STEP);
  };
  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  const lines = useMemo(
    () =>
      settings.showAddress
        ? [stamp.street ?? "Retiro São Joaquim", "Retiro São Joaquim", "Itaboraí", "Rio de Janeiro"]
        : [],
    [settings.showAddress, stamp.street],
  );
  const coords = useMemo(
    () =>
      settings.showCoords && stamp.lat !== null && stamp.lng !== null
        ? `${stamp.lat.toFixed(6)}, ${stamp.lng.toFixed(6)}`
        : null,
    [settings.showCoords, stamp.lat, stamp.lng],
  );
  const alpha = Math.min(1, Math.max(0, settings.opacity ?? 0.75));

  const capture = useCallback(async () => {
    if (busyRef.current) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    busyRef.current = true;

    const source: CanvasImageSource = video;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const z = zoomRef.current;

    const cropW = vw / z;
    const cropH = vh / z;
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    const portrait = cropH > cropW;
    const clockwise = angle === 180;
    const fullW = portrait ? cropH : cropW;
    const fullH = portrait ? cropW : cropH;
    const target = 16 / 9;
    let w = fullW;
    let h = fullH;
    if (fullW / fullH > target) w = Math.round(fullH * target);
    else h = Math.round(fullW / target);
    const dx = Math.round((fullW - w) / 2);
    const dy = Math.round((fullH - h) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      busyRef.current = false;
      return;
    }

    ctx.save();
    ctx.translate(-dx, -dy);
    if (portrait) {
      if (clockwise) {
        ctx.translate(fullW, 0);
        ctx.rotate(Math.PI / 2);
      } else {
        ctx.translate(0, fullH);
        ctx.rotate(-Math.PI / 2);
      }
    } else if (angle === 180) {
      ctx.translate(fullW, fullH);
      ctx.rotate(Math.PI);
    }
    ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
    ctx.restore();

    const date = stampNow(settings);
    const rawUrl = addExif(canvas.toDataURL("image/jpeg", 0.95), {
      lat: stamp.lat,
      lng: stamp.lng,
      estaca: stamp.estaca,
      street: stamp.street,
      date,
    });

    const s = (w / 1600) * SIZE_FACTOR[settings.size];

    {
      const text = stamp.estaca ?? "Sem estaca";
      ctx.font = `800 ${Math.round(56 * s)}px "IBM Plex Sans", system-ui, sans-serif`;
      const tw = ctx.measureText(text).width;
      const padX = 24 * s;
      const padY = 16 * s;
      const boxH = Math.round(76 * s);
      ctx.fillStyle = `rgba(15,23,42,${alpha})`;
      ctx.fillRect(24 * s, 24 * s, tw + padX * 2, boxH);
      ctx.fillStyle = "#f5c518";
      ctx.textBaseline = "top";
      ctx.fillText(text, 24 * s + padX, 24 * s + padY);
      boxRef.current = {
        x: Math.round(24 * s),
        y: Math.round(24 * s),
        w: Math.round(tw + padX * 2),
        h: boxH,
        fontSize: Math.round(56 * s),
      };
    }
    stampDateRef.current = date;

    const stampLines = [formatStamp(date, settings), ...lines, ...(coords ? [coords] : [])];
    const fs = Math.round(40 * s);
    ctx.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`;
    const maxW = Math.max(...stampLines.map((l) => ctx.measureText(l).width), 1);
    const lineH = fs * 1.25;
    const padX2 = 24 * s;
    const padY2 = 18 * s;
    const boxW = maxW + padX2 * 2;
    const boxH2 = stampLines.length * lineH + padY2 * 2;
    const bx = w - boxW;
    const by = h - boxH2;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(bx, by, boxW, boxH2);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    ctx.textAlign = "right";
    stampLines.forEach((l, i) => {
      ctx.fillText(l, bx + boxW - padX2, by + padY2 + i * lineH);
    });
    ctx.textAlign = "left";

    const mapImg = mapImgRef.current;
    if (mapImg && settings.showMap) {
      const mapS = boxH2;
      const mx = settings.mapSide === "direita" ? w - mapS : 0;
      const my = h - mapS;
      ctx.drawImage(mapImg, mx, my, mapS, mapS);
    }

    const stampedUrl = addExif(canvas.toDataURL("image/jpeg", 0.95), {
      lat: stamp.lat,
      lng: stamp.lng,
      estaca: stamp.estaca,
      street: stamp.street,
      date,
    });

    const p = (n: number) => String(n).padStart(2, "0");
    const real = new Date();
    const fileName = `${stamp.estaca ?? "foto"}-${p(date.getDate())}${p(date.getMonth() + 1)}${date.getFullYear()}-${p(real.getHours())}${p(real.getMinutes())}${p(real.getSeconds())}-${String(real.getMilliseconds()).padStart(3, "0")}`;

    downloadDataUrl(stampedUrl, fileName);
    downloadDataUrl(rawUrl, `${fileName}-original`);

    setFlash(true);
    window.setTimeout(() => setFlash(false), 120);
    setToast("2 fotos salvas · com layout e original");
    window.setTimeout(() => setToast(null), 1800);

    addPhotoLog({
      file: `${fileName}.jpg`,
      timestamp: new Date().toISOString(),
      lat: stamp.lat,
      lng: stamp.lng,
      street: stamp.street,
      estaca: stamp.estaca,
    });
    void putPhoto({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: `${fileName}.jpg`,
      timestamp: new Date().toISOString(),
      stampDate: stampDateRef.current.toISOString(),
      lat: stamp.lat,
      lng: stamp.lng,
      street: stamp.street,
      estaca: stamp.estaca,
      stamped: stampedUrl,
      raw: rawUrl,
      box: boxRef.current,
    });

    busyRef.current = false;
  }, [alpha, angle, coords, lines, settings, stamp.estaca, stamp.lat, stamp.lng, stamp.street]);

  const bumpZoom = (delta: number) => {
    setZoom((z) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) / ZOOM_STEP) * ZOOM_STEP)),
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      <div
        className="absolute inset-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full object-cover"
          style={{
            transform: `scale(${zoom}) translateZ(0)`,
            transformOrigin: "center center",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 origin-center"
        style={{
          width: landscape ? "100dvw" : "100dvh",
          height: landscape ? "100dvh" : "100dvw",
          transform: `translate(-50%, -50%) rotate(${layoutRotation}deg) translateZ(0)`,
          willChange: "transform",
          contain: "layout paint",
        }}
      >
        <div
          className="absolute left-3 top-3 rounded-xl px-3 py-1.5 font-black text-accent shadow-lg ring-1 ring-accent/30"
          style={{
            fontSize: `${1.25 * SIZE_FACTOR[settings.size]}rem`,
            backgroundColor: `rgba(15,23,42,${alpha})`,
          }}
        >
          {stamp.estaca ?? "Sem estaca"}
        </div>
        {stamp.lat !== null && stamp.lng !== null && settings.showMap && (
          <MiniMapThumb
            center={{ lat: stamp.lat, lng: stamp.lng }}
            className={`absolute bottom-3 rounded-xl object-cover ring-1 ring-fg/25 ${
              settings.mapSide === "direita" ? "right-3" : "left-3"
            }`}
            style={{
              height: `${6 * SIZE_FACTOR[settings.size]}rem`,
              width: `${6 * SIZE_FACTOR[settings.size]}rem`,
            }}
          />
        )}
        <div
          className="absolute bottom-3 right-3 rounded-xl px-3 py-2 text-right font-semibold leading-snug text-fg ring-1 ring-fg/15"
          style={{
            fontSize: `${0.75 * SIZE_FACTOR[settings.size]}rem`,
            backgroundColor: `rgba(0,0,0,${alpha})`,
          }}
        >
          <div className="text-accent">
            <StampClock settings={settings} />
          </div>
          {lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
          {coords && <div className="text-fg/80">{coords}</div>}
        </div>
        {!landscape && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[11px] font-semibold text-fg/60">
            Vire o celular de lado
          </div>
        )}
      </div>

      {flash && <div className="pointer-events-none absolute inset-0 bg-fg/80" />}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-bg/80 px-4 py-2 shadow-lg">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Estaca na foto
          </span>
          <span className={`text-base font-black ${stamp.estaca ? "text-accent" : "text-danger"}`}>
            {stamp.estaca ?? "Sem estaca"}
          </span>
          {usingMock && (
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Prévia
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label="Configurações da câmera"
        onClick={() => setShowSettings((v) => !v)}
        className="absolute right-3 top-3 rounded-full bg-surface/90 p-2.5 text-fg"
      >
        <Settings2 className="h-5 w-5" />
      </button>

      {showSettings && (
        <div className="absolute inset-x-3 top-16 max-h-[70dvh] space-y-4 overflow-y-auto rounded-2xl bg-surface/95 p-4 text-sm text-fg">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Configurações do carimbo</h2>
            <button
              type="button"
              aria-label="Fechar configurações"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Hora</p>
            <div className="flex gap-2">
              {[
                { l: "24h", v: true },
                { l: "12h (AM/PM)", v: false },
              ].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => update({ clock24h: o.v })}
                  className={`flex-1 rounded-lg px-3 py-2 font-semibold ${
                    settings.clock24h === o.v ? "bg-accent text-accent-fg" : "bg-subtle"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
              <span>Mostrar segundos</span>
              <input
                type="checkbox"
                checked={settings.showSeconds}
                onChange={(e) => update({ showSeconds: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
              <span>Mostrar data</span>
              <input
                type="checkbox"
                checked={settings.showDate}
                onChange={(e) => update({ showDate: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2">
              <span>Data do carimbo</span>
              <input
                type="date"
                value={settings.customDate ?? ""}
                onChange={(e) => update({ customDate: e.target.value || null })}
                className="rounded bg-bg px-2 py-1"
              />
            </label>
            {settings.customDate && (
              <button
                type="button"
                onClick={() => update({ customDate: null })}
                className="w-full rounded-lg bg-subtle px-3 py-2 text-[12px] font-semibold text-accent"
              >
                Usar a data de hoje
              </button>
            )}
            <label className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2">
              <span>Ajuste de minutos</span>
              <input
                type="number"
                value={settings.timeOffsetMin}
                onChange={(e) => update({ timeOffsetMin: Number(e.target.value) || 0 })}
                className="w-20 rounded bg-bg px-2 py-1 text-right"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2">
              <span>Ajuste de segundos</span>
              <input
                type="number"
                value={settings.timeOffsetSec ?? 0}
                onChange={(e) => update({ timeOffsetSec: Number(e.target.value) || 0 })}
                className="w-20 rounded bg-bg px-2 py-1 text-right"
              />
            </label>
            <p className="text-[11px] text-muted">
              Prévia: <StampClock settings={settings} />
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Transparência do layout
            </p>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(alpha * 100)}
              onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
              className="w-full accent-accent"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tamanho</p>
            <div className="flex gap-2">
              {(["pequeno", "medio", "grande"] as StampSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => update({ size: sz })}
                  className={`flex-1 rounded-lg px-3 py-2 font-semibold capitalize ${
                    settings.size === sz ? "bg-accent text-accent-fg" : "bg-subtle"
                  }`}
                >
                  {sz === "medio" ? "médio" : sz}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Layout</p>
            <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
              <span>Mostrar mini mapa Google</span>
              <input
                type="checkbox"
                checked={settings.showMap}
                onChange={(e) => update({ showMap: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
            </label>
            <div className="flex gap-2">
              {(["esquerda", "direita"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => update({ mapSide: side })}
                  className={`flex-1 rounded-lg px-3 py-2 font-semibold capitalize ${
                    settings.mapSide === side ? "bg-accent text-accent-fg" : "bg-subtle"
                  }`}
                >
                  Mapa à {side}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
              <span>Mostrar endereço</span>
              <input
                type="checkbox"
                checked={settings.showAddress}
                onChange={(e) => update({ showAddress: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
              <span>Mostrar coordenadas</span>
              <input
                type="checkbox"
                checked={settings.showCoords}
                onChange={(e) => update({ showCoords: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-xl bg-surface p-4 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {toast && (
        <div className="absolute inset-x-8 bottom-28 rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-fg">
          {toast}
        </div>
      )}

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-border bg-bg/80 p-2">
        <button
          type="button"
          aria-label="Aumentar zoom"
          onClick={() => bumpZoom(0.25)}
          className="grid h-11 w-11 place-items-center rounded-full bg-fg/10 text-accent active:scale-95"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <input
          type="range"
          aria-label="Zoom digital da câmera"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-28 w-6 accent-accent [writing-mode:vertical-lr] [direction:rtl]"
        />
        <button
          type="button"
          aria-label="Diminuir zoom"
          onClick={() => bumpZoom(-0.25)}
          className="grid h-11 w-11 place-items-center rounded-full bg-fg/10 text-accent active:scale-95"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-[10px] font-bold tabular-nums text-fg/80">{zoom.toFixed(1)}×</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-subtle/90 px-4 py-2 text-sm font-semibold text-fg"
        >
          Fechar
        </button>
        <button
          type="button"
          aria-label="Tirar foto"
          onClick={() => void capture()}
          className="h-16 w-16 rounded-full border-4 border-fg bg-fg/30"
        />
        <div className="w-16" />
      </div>
    </div>
  );
}
