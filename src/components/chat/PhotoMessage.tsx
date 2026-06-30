import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE } from "../../services/apiClient";
import { getPhoto } from "../../services/chatApi";

function buildFileUrl(token: string, fileid: string): string {
  return `${API_BASE}?request=getfile&token=${encodeURIComponent(token)}&fileid=${encodeURIComponent(fileid)}`;
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt="Bild"
        className="max-h-screen max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

function FileAttachment({ href, filename, mimetype }: { href: string; filename: string; mimetype: string }) {
  const ext = mimetype.split("/").pop()?.toUpperCase() ?? "DATEI";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-slate-200"
    >
      <svg className="h-8 w-8 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="min-w-0">
        <p className="font-medium truncate">{filename}</p>
        <p className="text-xs text-slate-400">{ext}</p>
      </div>
    </a>
  );
}

export default function PhotoMessage({ token, photoid, fileid, filename, localPreview, mimetype }: {
  token: string;
  photoid?: string;
  fileid?: string;
  filename?: string;
  localPreview?: string;
  mimetype?: string;
}) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Only fetch via getBinaryApi for photoid (images from getphoto — no CORS issue)
  useEffect(() => {
    if (!photoid) return;
    getPhoto(token, photoid).then((result) => {
      if (result.ok && result.data) setPhotoSrc(result.data);
      else setFailed(true);
    });
  }, [token, photoid]);

  // ── fileid path: use direct URL, no fetch (avoids CORS block on getfile) ──
  if (fileid) {
    const directUrl = buildFileUrl(token, fileid);
    const isImg = mimetype?.startsWith("image/");
    if (isImg) {
      return (
        <>
          <button type="button" onClick={() => setLightboxOpen(true)} className="block">
            <img src={directUrl} alt="Bild" className="max-w-[220px] rounded-xl object-cover shadow-sm" />
          </button>
          {lightboxOpen && <Lightbox src={directUrl} onClose={() => setLightboxOpen(false)} />}
        </>
      );
    }
    return (
      <FileAttachment
        href={directUrl}
        filename={filename ?? fileid}
        mimetype={mimetype ?? "application/octet-stream"}
      />
    );
  }

  // ── optimistic preview (before server confirms) ──
  if (localPreview && !photoid) {
    const isImg = mimetype?.startsWith("image/") || localPreview.startsWith("data:image/");
    if (isImg) {
      return (
        <>
          <button type="button" onClick={() => setLightboxOpen(true)} className="block">
            <img src={localPreview} alt="Bild" className="max-w-[220px] rounded-xl object-cover shadow-sm opacity-70" />
          </button>
          {lightboxOpen && <Lightbox src={localPreview} onClose={() => setLightboxOpen(false)} />}
        </>
      );
    }
    return (
      <FileAttachment
        href={localPreview}
        filename={filename ?? "Datei"}
        mimetype={mimetype ?? "application/octet-stream"}
      />
    );
  }

  // ── photoid path: fetched data URL ──
  if (failed) return <p className="text-xs opacity-60">Bild nicht verfügbar</p>;
  if (!photoSrc) return <div className="h-32 w-48 animate-pulse rounded-xl bg-black/10" />;

  return (
    <>
      <button type="button" onClick={() => setLightboxOpen(true)} className="block">
        <img src={photoSrc} alt="Bild" className="max-w-[220px] rounded-xl object-cover shadow-sm" />
      </button>
      {lightboxOpen && <Lightbox src={photoSrc} onClose={() => setLightboxOpen(false)} />}
    </>
  );
}
