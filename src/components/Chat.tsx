import { useEffect, useRef, useState } from "react";
import { Check, Link2, MessageSquare, MoreHorizontal, Pencil } from "lucide-react";
import {
  deleteMessage,
  fetchMessages,
  formatCountdown,
  formatDate,
  isSameDay,
  type Message,
} from "../lib/api";
import BoltMark from "./Brand";
import Composer from "./Composer";
import MediaViewer from "./MediaViewer";
import MessageBubble from "./MessageBubble";

/** Messages by the same person within this window are visually grouped. */
const GROUP_WINDOW = 5 * 60 * 1000;

export default function Chat({
  room,
  nickname,
  onLeave,
}: {
  room: string;
  nickname: string;
  onLeave: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<Message | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const userAtBottomRef = useRef(true);
  const prevLastIdRef = useRef<string | null>(null);
  const initialScrollDoneRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMessages(room);
        if (cancelled) return;
        setMessages(data.messages);
      } catch (err) {
        console.error("failed to load messages", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setNow(Date.now());
        }
      }
    };
    load();
    const poll = setInterval(load, 3000);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [room]);

  // Keep the newest message in view, unless the reader has scrolled up.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || loading) return;
    const lastId = messages.length ? messages[messages.length - 1].id : null;

    if (!initialScrollDoneRef.current) {
      el.scrollTop = el.scrollHeight;
      initialScrollDoneRef.current = true;
      prevLastIdRef.current = lastId;
      return;
    }

    if (lastId !== prevLastIdRef.current) {
      prevLastIdRef.current = lastId;
      if (userAtBottomRef.current) {
        requestAnimationFrame(() =>
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
        );
      }
    }
  }, [messages, loading]);

  // Click-away and Escape for the header menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    userAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const handleMessage = (message: Message) => {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id)
        ? prev
        : [...prev, message].sort((a, b) => a.createdAt - b.createdAt),
    );
  };

  const handleDelete = async (id: string) => {
    const previous = messages;
    setViewer((v) => (v && v.id === id ? null : v));
    setMessages((prev) => prev.filter((m) => m.id !== id)); // optimistic
    try {
      await deleteMessage(room, id);
    } catch {
      setMessages(previous);
      window.alert("Couldn't delete that message. Try again.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const nextExpiry = messages.length ? Math.max(0, messages[0].expiresAt - now) : null;

  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-paper sm:p-6">
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface animate-rise motion-reduce:animate-none sm:h-[min(900px,calc(100dvh_-_3rem))] sm:max-w-[560px] sm:rounded-[28px] sm:border sm:border-line sm:shadow-[0_30px_80px_-40px_rgba(40,32,120,0.45)]">
        <header
          className="relative z-20 flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 pb-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <BoltMark className="h-10 w-10" iconClassName="h-[19px] w-[19px]" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-extrabold leading-tight tracking-tight text-ink">
              Flashbox
            </h1>
            <p className="truncate text-[11px] font-medium text-ink-soft">
              {loading
                ? "Connecting…"
                : nextExpiry === null
                  ? "Nothing here yet"
                  : `Next to vanish in ${formatCountdown(nextExpiry)}`}
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="More options"
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-[0_20px_45px_-20px_rgba(30,24,90,0.5)] animate-pop motion-reduce:animate-none"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={copyLink}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition hover:bg-paper"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-brand-600" />
                  ) : (
                    <Link2 className="h-4 w-4 text-ink-soft" />
                  )}
                  {copied ? "Link copied" : "Copy room link"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onLeave}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition hover:bg-paper"
                >
                  <Pencil className="h-4 w-4 text-ink-soft" />
                  Change your name
                </button>
              </div>
            )}
          </div>
        </header>

        <main
          ref={containerRef}
          onScroll={handleScroll}
          tabIndex={0}
          className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 sm:px-4"
        >
          {loading ? (
            <Skeleton />
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const showDate =
                index === 0 || !isSameDay(message.createdAt, prev.createdAt);
              const grouped =
                !showDate &&
                !!prev &&
                prev.nickname === message.nickname &&
                message.createdAt - prev.createdAt < GROUP_WINDOW;
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="my-4 flex justify-center">
                      <span className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold text-ink-soft shadow-sm">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={message.nickname === nickname}
                    grouped={grouped}
                    now={now}
                    onDelete={handleDelete}
                    onOpenMedia={() => setViewer(message)}
                  />
                </div>
              );
            })
          )}
          <div className="h-1" />
        </main>

        <Composer room={room} nickname={nickname} onMessage={handleMessage} />

        {viewer && (
          <MediaViewer
            message={viewer}
            now={now}
            onClose={() => setViewer(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 pt-2" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"} gap-2`}>
          {i % 2 === 0 && (
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-brand-50" />
          )}
          <span
            className="h-11 animate-pulse rounded-2xl bg-paper"
            style={{ width: `${44 + ((i * 17) % 34)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-line bg-white text-brand-500 shadow-[0_12px_30px_-18px_rgba(60,40,190,0.6)]">
        <MessageSquare className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <p className="text-[15px] font-bold text-ink">Nothing here yet</p>
      <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-ink-soft">
        Send the first message. It will be gone in 24 hours.
      </p>
    </div>
  );
}
