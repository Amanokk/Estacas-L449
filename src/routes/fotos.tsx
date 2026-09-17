import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, Pencil, Share2, Trash2 } from "lucide-react";
import { deletePhoto, listPhotos, putPhoto, retouchEstaca, type StoredPhoto } from "@/lib/photoStore";
import { savePhoto, sharePhoto } from "@/lib/savePhoto";
import { addExif } from "@/lib/exif";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { MiniMapThumb } from "@/components/MiniMapThumb";

export const Route = createFileRoute("/fotos")({
  component: FotosPage,
});

function fmt(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function FotosPage() {
  const [photos, setPhotos] = useState<StoredPhoto[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const online = useOnlineStatus();

  useEffect(() => {
    void listPhotos().then(setPhotos);
  }, []);

  const refresh = () => void listPhotos().then(setPhotos);

  const applyRetouch = async (photo: StoredPhoto) => {
    const value = draft.trim();
    try {
      const stamped = await retouchEstaca(photo, value);
      await putPhoto({
        ...photo,
        estaca: value || null,
        stamped: addExif(stamped, {
          lat: photo.lat,
          lng: photo.lng,
          estaca: value || null,
          street: photo.street,
          date: new Date(photo.stampDate),
        }),
      });
      setEditing(null);
      setStatus("Estaca atualizada na foto.");
      refresh();
    } catch {
      setStatus("Não foi possível retocar a estaca.");
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-bg/95 px-4 py-4 backdrop-blur">
        <Link
          to="/"
          aria-label="Voltar ao mapa"
          className="grid h-11 w-11 place-items-center rounded-full bg-surface text-accent"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold leading-tight">Fotos</h1>
          <p className="text-[11px] text-muted">
            {photos ? `${photos.length} foto(s) salvas no aparelho` : "Carregando…"}
          </p>
        </div>
        {!online && (
          <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent ring-1 ring-accent/30">
            Offline
          </span>
        )}
      </header>

      {status && <p className="px-4 pb-2 text-[12px] text-accent">{status}</p>}

      <div className="space-y-4 px-4 pb-16">
        {photos && photos.length === 0 && (
          <p className="rounded-2xl bg-surface p-6 text-center text-sm text-muted">
            Nenhuma foto ainda. Tire uma foto pela câmera do mapa.
          </p>
        )}

        {photos?.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl bg-surface">
            <img
              src={p.stamped}
              alt={`Foto ${p.file} com carimbo da estaca ${p.estaca ?? "sem estaca"}`}
              className="w-full"
              loading="lazy"
            />
            <div className="flex gap-3 p-3">
              {p.lat !== null && p.lng !== null && (
                <MiniMapThumb
                  center={{ lat: p.lat, lng: p.lng }}
                  className="h-24 w-24 shrink-0 rounded-xl bg-subtle object-cover"
                />
              )}

              <dl className="min-w-0 flex-1 space-y-0.5 text-[12px] text-muted">
                <div className="text-base font-black text-accent">{p.estaca ?? "Sem estaca"}</div>
                <div className="truncate font-semibold text-fg">{p.street ?? "Rua não identificada"}</div>
                <div>Carimbo: {fmt(p.stampDate)}</div>
                <div>Capturada: {fmt(p.timestamp)}</div>
                <div className="tabular-nums">
                  GPS: {p.lat !== null ? p.lat.toFixed(6) : "--"}, {p.lng !== null ? p.lng.toFixed(6) : "--"}
                </div>
                <div className="truncate text-muted/70">{p.file}</div>
              </dl>
            </div>

            {editing === p.id ? (
              <div className="flex items-center gap-2 px-3 pb-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="E-1127"
                  className="min-w-0 flex-1 rounded-xl bg-subtle px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => void applyRetouch(p)}
                  aria-label="Salvar estaca retocada"
                  className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg"
                >
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 px-3 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(p.id);
                    setDraft(p.estaca ?? "");
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-subtle px-3 py-2 text-[12px] font-semibold"
                >
                  <Pencil size={14} /> Retocar estaca
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const r = await savePhoto(p.stamped, p.file.replace(/\.jpg$/, ""));
                    setStatus(r.message);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-subtle px-3 py-2 text-[12px] font-semibold"
                >
                  <Download size={14} /> Salvar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const r = await sharePhoto(
                      p.stamped,
                      p.file.replace(/\.jpg$/, ""),
                      [p.estaca, p.street, fmt(p.stampDate)].filter(Boolean).join(" · "),
                    );
                    setStatus(r.message);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-2 text-[12px] font-bold text-fg"
                >
                  <Share2 size={14} /> Enviar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deletePhoto(p.id);
                    refresh();
                  }}
                  aria-label="Apagar foto"
                  className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-subtle text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
