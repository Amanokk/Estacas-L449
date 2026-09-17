export const GALLERY_FOLDER = "EstacaGPS";

function sanitize(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return (clean || "foto").slice(0, 60);
}

export type SaveResult = { ok: boolean; message: string };

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const name = fileName.toLowerCase().endsWith(".jpg") ? fileName : `${sanitize(fileName)}.jpg`;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: "image/jpeg" });
}

export async function savePhoto(dataUrl: string, fileName: string): Promise<SaveResult> {
  downloadDataUrl(dataUrl, fileName);
  return { ok: true, message: `Baixado como ${sanitize(fileName)}.jpg` };
}

export async function sharePhoto(
  dataUrl: string,
  fileName: string,
  text?: string,
): Promise<SaveResult> {
  const name = `${sanitize(fileName)}.jpg`;
  try {
    const file = await dataUrlToFile(dataUrl, name);
    const nav = navigator as Navigator & {
      canShare?: (data: { files?: File[] }) => boolean;
      share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: name, text });
      return { ok: true, message: "Compartilhado." };
    }
    downloadDataUrl(dataUrl, fileName);
    return { ok: true, message: `Baixado como ${name}` };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, message: "Compartilhamento cancelado." };
    }
    return { ok: false, message: e instanceof Error ? e.message : "Falha ao compartilhar." };
  }
}
