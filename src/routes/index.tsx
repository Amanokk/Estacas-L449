import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Camera, FileDown, Images, LocateFixed } from "lucide-react";
import { Splash } from "@/components/Splash";
import { CameraCapture } from "@/components/CameraCapture";
import { StakeMap } from "@/components/StakeMap";
import { exportPhotoLogCsv } from "@/lib/photoLog";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { findNearestStake, PROJECT_CENTER, quantize } from "@/lib/findStake";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const geo = useGeolocation(true);
  const online = useOnlineStatus();
  const [demo, setDemo] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);
  const [recenterNonce, setRecenterNonce] = useState(0);

  useEffect(() => {
    if (geo.position || geo.error) return;
    const t = setTimeout(() => setDemo(true), 8000);
    return () => clearTimeout(t);
  }, [geo.position, geo.error]);

  const usingDemo = demo && !geo.position;
  const position = geo.position ?? (demo ? PROJECT_CENTER : null);
  const accuracy = geo.position ? geo.accuracy : usingDemo ? 8 : null;
  const posKey = position ? quantize(position) : null;
  const match = useMemo(
    () => (position ? findNearestStake(position) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posKey],
  );

  const cameraMatch = match ?? (position ? findNearestStake(position, 800) : null);

  const recenter = () => {
    setFollow(true);
    setRecenterNonce((n) => n + 1);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Splash />
      <header className="px-3 pt-4 pb-3">
        <div className="rounded-3xl border border-border bg-surface/80 p-4 shadow-[0_18px_50px_-24px_rgba(245,197,24,0.45)]">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted">
              Retiro São Joaquim · Itaboraí/RJ
            </div>
            <div className="flex items-center gap-2">
              {!online && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent ring-1 ring-accent/30">
                  Offline
                </span>
              )}
              {usingDemo && (
                <span className="rounded-full bg-gps/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gps ring-1 ring-gps/30">
                  Demo
                </span>
              )}
              <div className="text-[10px] font-semibold uppercase tracking-wide text-accent/80">
                By Vitor Lucas
              </div>
            </div>
          </div>
          {match ? (
            <>
              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-fg">
                {match.street.name}
              </h1>
              <div className="mt-3 flex items-end gap-3">
                <div className="rounded-2xl bg-accent px-4 py-2 font-mono text-4xl font-bold tabular-nums leading-none text-accent-fg">
                  E-{match.estaca}
                </div>
                <div className="pb-1 text-sm tabular-nums text-muted">
                  {match.offset >= 0 ? "+" : ""}
                  {match.offset.toFixed(1)} m
                  <div className="text-xs text-muted/70">{match.distance.toFixed(1)} m do eixo</div>
                </div>
              </div>
            </>
          ) : geo.error && !usingDemo ? (
            <>
              <h1 className="mt-3 text-2xl font-semibold text-danger">Sem GPS</h1>
              <p className="text-sm text-muted">{geo.error}</p>
              <button
                type="button"
                onClick={() => setDemo(true)}
                className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
              >
                Simular no bairro
              </button>
            </>
          ) : !position ? (
            <>
              <h1 className="mt-3 text-2xl font-semibold text-muted">Obtendo GPS…</h1>
              <p className="text-sm text-muted/80">Permita o acesso à localização para começar.</p>
              <button
                type="button"
                onClick={() => setDemo(true)}
                className="mt-3 rounded-full bg-subtle px-4 py-2 text-sm font-semibold text-fg"
              >
                Simular no bairro
              </button>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-2xl font-semibold text-muted">Fora do projeto</h1>
              <p className="text-sm text-muted/80">
                Nenhuma rua do bairro a menos de 60 m da sua posição.
              </p>
              <button
                type="button"
                onClick={() => setDemo(true)}
                className="mt-3 rounded-full bg-subtle px-4 py-2 text-sm font-semibold text-fg"
              >
                Ir para o bairro
              </button>
            </>
          )}
        </div>
      </header>

      <div className="relative mx-3 mb-3 min-h-[380px] flex-1 overflow-hidden rounded-3xl border border-border shadow-2xl shadow-black/50">
        <StakeMap
          position={position}
          accuracy={accuracy}
          match={match}
          follow={follow}
          onUserDrag={() => setFollow(false)}
          recenterNonce={recenterNonce}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto rounded-full border border-border bg-bg/70 px-3 py-1.5 text-xs font-medium text-fg backdrop-blur">
            {exportMsg ? exportMsg : null}
            {exportMsg ? " · " : null}
            GPS ±{accuracy ? accuracy.toFixed(0) : "--"} m
          </div>

          <div className="pointer-events-auto mb-10 flex flex-col items-center gap-2 rounded-full border border-border bg-bg/70 p-1.5 backdrop-blur">
            <Link
              to="/fotos"
              aria-label="Ver fotos capturadas"
              className="grid h-11 w-11 place-items-center rounded-full bg-fg/5 text-accent transition active:scale-95"
            >
              <Images size={18} />
            </Link>
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              aria-label="Abrir câmera com carimbo de estaca"
              className="grid h-11 w-11 place-items-center rounded-full bg-fg/5 text-accent transition active:scale-95"
            >
              <Camera size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                const n = exportPhotoLogCsv();
                setExportMsg(n ? `${n} foto(s) exportadas` : "Nenhuma foto salva ainda");
                setTimeout(() => setExportMsg(null), 3000);
              }}
              aria-label="Exportar CSV das fotos salvas"
              className="grid h-11 w-11 place-items-center rounded-full bg-fg/5 text-accent transition active:scale-95"
            >
              <FileDown size={18} />
            </button>
            <button
              type="button"
              onClick={recenter}
              aria-label="Centralizar no GPS"
              className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/20 transition active:scale-95"
            >
              <LocateFixed size={18} />
            </button>
          </div>
        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          stamp={{
            estaca: cameraMatch ? `E-${cameraMatch.estaca}` : null,
            street: cameraMatch?.street.name ?? null,
            lat: position?.lat ?? null,
            lng: position?.lng ?? null,
          }}
        />
      )}
    </div>
  );
}
