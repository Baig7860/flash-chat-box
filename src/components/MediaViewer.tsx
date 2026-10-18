import { useEffect } from "react";
import { Download, ExternalLink, Trash2, X } from "lucide-react";
import { formatCountdown, readableSize, type Message } from "../lib/api";
import FileGlyph from "./FileGlyph";

export default function MediaViewer({
  message,
  now,
  onClose,
  onDelete,
}: {
  message: Message;
  now: number;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { file } = message;
  const isImage = message.type === "image";
  const isVideo = message.type === "video";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file?.name ?? "Attachment"}
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0918]/95 backdrop-blur-lg animate-pop motion-reduce:animate-none"
    >
      <header
        className="flex items-start gap-3 px-4 py-3 text-white"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file?.name ?? "Attachment"}</p>
          {file && (
            <p className="mt-0.5 text-[11px] text-white/50">
              {readableSize(file.size)}
              <span className="mx-1.5 text-white/25">/</span>
              vanishes in {formatCountdown(message.expiresAt - now)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div
        className="flex flex-1 items-center justify-center overflow-hidden p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-full max-w-full items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isImage && file && (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
          )}
          {isVideo && file && (
            <video
              src={file.url}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              controls
              playsInline
              autoPlay
            />
          )}
          {!isImage && !isVideo && file && (
            <div className="w-full max-w-xs rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-md">
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white">
                <FileGlyph mime={file.mime} className="h-6 w-6" />
              </span>
              <h3 className="truncate text-sm font-semibold text-white">{file.name}</h3>
              <p className="mt-1 text-xs text-white/50">{readableSize(file.size)}</p>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                download
                className="brand-surface mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          )}
        </div>
      </div>

      <footer
        className="flex items-center justify-center gap-3 px-4 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {file && (
          <button
            type="button"
            onClick={() => window.open(file.url, "_blank")}
            className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:brightness-105"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(message.id)}
          className="flex items-center gap-2 rounded-full bg-danger px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </footer>
    </div>
  );
}
