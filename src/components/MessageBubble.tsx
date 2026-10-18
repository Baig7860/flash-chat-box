import { useState } from "react";
import { X } from "lucide-react";
import {
  formatCountdown,
  formatTime,
  initials,
  mix,
  readableSize,
  remainingLife,
  type Message,
} from "../lib/api";
import FileGlyph from "./FileGlyph";

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  /** True when the previous message is by the same person, moments earlier. */
  grouped?: boolean;
  now: number;
  onDelete?: (id: string) => void;
  onOpenMedia?: () => void;
}

// A message holds its colour while it's fresh and bleaches toward paper as its
// 24 hours run out. These are the endpoints the age interpolates between.
const OWN_TOP_FRESH = "#2456e8";
const OWN_TOP_AGED = "#5e5c78";
const OWN_BOTTOM_FRESH = "#6d28d9";
const OWN_BOTTOM_AGED = "#6f6d8a";
const IN_BG_FRESH = "#e9e8f8";
const IN_BG_AGED = "#f1f1f5";
const IN_TEXT_FRESH = "#1b1936";
const IN_TEXT_AGED = "#5a5871";

/** Remaining-life meter. The one device that is unique to a box that empties itself. */
export function LifeMeter({ life }: { life: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-[3px] w-6 overflow-hidden rounded-full bg-ink/10"
    >
      <span
        className="brand-surface absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 motion-reduce:transition-none"
        style={{ width: `${Math.max(life * 100, 3)}%` }}
      />
    </span>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  grouped = false,
  now,
  onDelete,
  onOpenMedia,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { type, file } = message;
  const isMedia = type === "image" || type === "video";
  const isFile = type === "file";
  const canDelete = isOwn && !!onDelete;

  const life = remainingLife(message.createdAt, message.expiresAt, now);
  const age = 1 - life;

  const bubbleStyle: React.CSSProperties = isOwn
    ? {
        backgroundImage: `linear-gradient(135deg, ${mix(OWN_TOP_FRESH, OWN_TOP_AGED, age)} 0%, ${mix(
          OWN_BOTTOM_FRESH,
          OWN_BOTTOM_AGED,
          age,
        )} 100%)`,
        color: "rgba(255,255,255,0.97)",
        boxShadow:
          life > 0.55
            ? "0 12px 26px -14px rgba(62,44,190,0.6)"
            : "0 8px 18px -14px rgba(60,56,110,0.4)",
      }
    : {
        backgroundColor: mix(IN_BG_FRESH, IN_BG_AGED, age),
        color: mix(IN_TEXT_FRESH, IN_TEXT_AGED, age),
        boxShadow: "0 1px 2px rgba(25,23,52,0.05)",
      };

  return (
    <div
      className={`group flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""} ${
        grouped ? "mt-1" : "mt-3"
      } animate-pop motion-reduce:animate-none`}
    >
      {!isOwn && (
        <div
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-white text-[11px] font-bold text-brand-700 ${
            grouped ? "opacity-0" : ""
          }`}
          aria-hidden
        >
          {grouped ? "" : initials(message.nickname)}
        </div>
      )}

      <div className={`flex max-w-[80%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && !grouped && (
          <span className="mb-1 ml-1 text-[11px] font-semibold text-ink-soft">
            {message.nickname}
          </span>
        )}

        <div className="relative">
          <div
            className={`relative min-w-[48px] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
              isOwn ? "rounded-br-md" : "rounded-bl-md"
            } ${canDelete && !isMedia && !isFile ? "cursor-pointer" : ""}`}
            style={bubbleStyle}
            onClick={
              canDelete && !isMedia && !isFile ? () => setMenuOpen((v) => !v) : undefined
            }
          >
            {type === "text" && <p className="whitespace-pre-line break-words">{message.text}</p>}

            {isMedia && file && (
              <button
                type="button"
                onClick={onOpenMedia}
                className="block cursor-zoom-in"
                aria-label={`Open ${file.name}`}
              >
                {type === "image" ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    loading="lazy"
                    decoding="async"
                    className="max-h-[46vh] w-auto max-w-[240px] rounded-xl object-cover"
                  />
                ) : (
                  <video
                    src={file.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-[46vh] w-auto max-w-[240px] rounded-xl object-cover"
                  />
                )}
              </button>
            )}

            {isFile && file && (
              <button
                type="button"
                onClick={onOpenMedia}
                className="flex items-center gap-2.5 text-left"
                aria-label={`Open ${file.name}`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    isOwn ? "bg-white/15 text-white" : "bg-white text-brand-600 shadow-sm"
                  }`}
                >
                  <FileGlyph mime={file.mime} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block max-w-[150px] truncate text-[13px] font-semibold">
                    {file.name}
                  </span>
                  <span className={`text-[11px] ${isOwn ? "text-white/70" : "text-ink-soft"}`}>
                    {readableSize(file.size)}
                  </span>
                </span>
              </button>
            )}
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(message.id);
              }}
              aria-label="Delete message"
              title="Delete message"
              className={`absolute -top-2.5 z-10 grid h-6 w-6 place-items-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition hover:text-danger focus-visible:opacity-100 ${
                isOwn ? "-left-2.5" : "-right-2.5"
              } ${
                menuOpen
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              }`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className={`mt-1 flex items-center gap-1.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <time
            dateTime={new Date(message.createdAt).toISOString()}
            className="text-[11px] font-medium tabular-nums text-ink-soft"
          >
            {formatTime(message.createdAt)}
          </time>
          <LifeMeter life={life} />
          <span className="sr-only">
            Vanishes in {formatCountdown(message.expiresAt - now)}
          </span>
        </div>
      </div>
    </div>
  );
}
