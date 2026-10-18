import { Check, Download, Maximize, X } from "lucide-react";
import {
  formatTime,
  fileIcon,
  readableSize,
  initials,
  type Message,
} from "../lib/api";

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showNickname?: boolean;
  onDelete?: (id: string) => void;
  onOpenMedia?: () => void;
}

export default function MessageBubble({
  message,
  isOwn,
  showNickname = true,
  onDelete,
  onOpenMedia,
}: MessageBubbleProps) {
  const { type, file } = message;
  const isMedia = type === "image" || type === "video";
  const isFile = type === "file";

  return (
    <div
      className={`flex ${isOwn ? "flex-row-reverse" : ""} mb-2 ${
        isOwn ? "ml-auto" : ""
      }`}
    >
      {!isOwn && showNickname && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-600 border border-white shadow-xs">
          {initials(message.nickname)}
        </div>
      )}
      <div className={`relative flex flex-col max-w-[82%] ${
        isOwn ? "items-end" : "items-start"
      } ml-2 mr-2`}>
        {!isOwn && showNickname && (
          <span className="text-[10px] font-medium text-slate-500 mb-0.5 ml-1">
            {message.nickname}
          </span>
        )}
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm min-w-[44px] ${
            isOwn
              ? "bg-blue-600 text-white rounded-tl-sm"
              : "bg-gray-200 text-slate-900 rounded-tr-sm"
          }`}
        >
          {type === "text" && (
            <p className="whitespace-pre-line break-words">{message.text}</p>
          )}
          {isMedia && file && (
            <div className="cursor-pointer group relative" onClick={onOpenMedia}>
              {type === "image" ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="media max-w-[200px] max-h-[48vh] object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={file.url}
                  className="media max-w-[200px] max-h-[48vh] object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                <Maximize className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          {isFile && file && (
            <div className="flex items-start gap-2 mt-1 cursor-pointer" onClick={onOpenMedia}>
              <span className="text-2xl mt-0.5 shrink-0">{fileIcon(file.mime)}</span>
              <div className="leading-snug">
                <div className="font-medium truncate max-w-[160px]">{file.name}</div>
                <div className="text-[10px] text-slate-500">
                  {readableSize(file.size)} · tap to download
                </div>
              </div>
              <Download className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={`text-[10px] ${isOwn ? "text-blue-200" : "text-slate-400"}`}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <>
              <Check className="h-3.5 w-3.5 text-blue-300" strokeWidth="1.5" />
              <Check className="h-3.5 w-3.5 text-blue-300" strokeWidth="1.5" />
            </>
          )}
        </div>
        {isOwn && (
          <div className="absolute top-0 right-0 -mt-6 -mr-1 opacity-0 group-hover:opacity-100 transition group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(message.id);
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-red-500 bg-white/90 backdrop-blur"
              title="Delete"
            >
              <X className="h-3 w-3" strokeWidth="2" />
            </button>
          </div>
        )}
        {!isOwn && onDelete && (
          <div className="absolute top-0 left-0 -mt-6 -ml-1 opacity-0 group-hover:opacity-100 transition group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(message.id);
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-red-500 bg-white/90 backdrop-blur"
              title="Delete"
            >
              <X className="h-3 w-3" strokeWidth="2" />
            </button>
          </div>
        )}
      </div>
      {isOwn && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-500 text-white border border-white shadow-xs">
          {initials(message.nickname)}
        </div>
      )}
    </div>
  );
}
