import { X, Download, Maximize } from "lucide-react";
import { readableSize, type Message } from "../lib/api";

export default function MediaViewer({
  message,
  onClose,
  onDelete,
}: {
  message: Message;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { file } = message;
  const isImage = message.type === "image";
  const isVideo = message.type === "video";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-[90vw] max-h-[85vh] flex items-center justify-center bg-black rounded-xl overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        {isImage && file && (
          <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain" />
        )}
        {isVideo && file && (
          <video
            src={file.url}
            className="max-w-full max-h-full object-contain"
            controls
            playsInline
            autoPlay
          />
        )}
        {!isImage && !isVideo && file && (
          <div className="text-center p-8">
            <span className="text-6xl mb-4 block">{fileIcon(file.mime)}</span>
            <h3 className="text-white text-lg font-medium mb-1">{file.name}</h3>
            <p className="text-slate-400 text-sm mb-6">{readableSize(file.size)}</p>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition"
              download
            >
              <Download className="h-4 w-4" /> Download file
            </a>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(message.id);
          }}
          className="absolute -top-8 -right-8 w-9 h-9 rounded-full flex items-center justify-center text-white bg-red-500/90 hover:bg-red-600 transition"
          title="Delete"
        >
          <X className="h-5 w-5" />
        </button>
        {file && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(file.url, "_blank");
            }}
            className="absolute -top-8 -left-8 w-9 h-9 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 backdrop-blur transition"
            title="Open in new tab"
          >
            <Maximize className="h-5 w-5" />
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="mt-6 text-slate-400 hover:text-white transition"
      >
        Close
      </button>
    </div>
  );
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  return "📄";
}
