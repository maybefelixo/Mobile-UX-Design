import { useEffect, useState } from "react";
import { getPhoto } from "../../services/chatApi";

function FileAttachment({ src, mimetype }: { src: string; mimetype: string }) {
  const ext = mimetype.split("/")[1]?.toUpperCase() ?? "DATEI";
  return (
    <a
      href={src}
      download
      className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-slate-200"
    >
      <svg className="h-8 w-8 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="font-medium">{ext}-Datei</span>
    </a>
  );
}

export default function PhotoMessage({ token, photoid, localPreview, mimetype }: {
  token: string;
  photoid?: string;
  localPreview?: string;
  mimetype?: string;
}) {
  const [src, setSrc] = useState<string | null>(localPreview ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!photoid) return;
    getPhoto(token, photoid).then((result) => {
      if (result.ok && result.data) setSrc(result.data);
      else if (!localPreview) setFailed(true);
    });
  }, [token, photoid, localPreview]);

  if (failed) return <p className="text-xs opacity-60">Datei nicht verfügbar</p>;
  if (!src) return <div className="h-32 w-48 animate-pulse rounded-xl bg-black/10" />;

  const isImage = mimetype ? mimetype.startsWith("image/") : src.startsWith("data:image/");
  if (!isImage) {
    const detectedType = mimetype ?? src.split(";")[0].split(":")[1] ?? "application/octet-stream";
    return <FileAttachment src={src} mimetype={detectedType} />;
  }

  return <img src={src} alt="Bild" className="max-w-[220px] rounded-xl object-cover shadow-sm" />;
}
