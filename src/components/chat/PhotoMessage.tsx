import { useEffect, useState } from "react";
import { getPhoto } from "../../services/chatApi";

export default function PhotoMessage({ token, photoid, localPreview }: {
  token: string;
  photoid?: string;
  localPreview?: string;
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

  if (failed) return <p className="text-xs opacity-60">Bild nicht verfügbar</p>;
  if (!src) return <div className="h-32 w-48 animate-pulse rounded-xl bg-black/10" />;
  return <img src={src} alt="Bild" className="max-w-[220px] rounded-xl object-cover shadow-sm" />;
}
