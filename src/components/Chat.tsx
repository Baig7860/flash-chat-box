import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  fetchMessages,
  deleteMessage,
  formatDate,
  isSameDay,
  type Message,
} from "../lib/api";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import MediaViewer from "./MediaViewer";

export default function Chat({ room, nickname }: { room: string; nickname: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<Message | null>(null);
  const containerRef = useRef<HTMLDivElement>(null!);
  const userAtBottomRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const load = async () => {
      try {
        const data = await fetchMessages(room);
        setMessages(data.messages);
        setLoading(false);
      } catch (err) {
        console.error("failed to load messages", err);
        setLoading(false);
      }
    };
    load();
    timer = setInterval(load, 3000);

    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      userAtBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    };
    const el = containerRef.current;
    el?.addEventListener("scroll", onScroll);
    return () => {
      clearInterval(timer);
      el?.removeEventListener("scroll", onScroll);
    };
  }, [room]);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (!loading && userAtBottomRef.current) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages, loading]);

  const handleMessage = (message: Message) => {
    setMessages((prev) => [...prev, message].sort((a, b) => a.createdAt - b.createdAt));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessage(room, id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Could not delete message");
    }
  };

  const isOwn = (m: Message) => m.nickname === nickname;

  return (
    <div className="flex flex-col h-[100dvh] max-w-[560px] mx-auto bg-white border-y border-slate-200 shadow-xl overflow-hidden">
      <header className="safe-top flex shrink-0 items-center justify-between px-4 py-3.5 bg-white border-b border-slate-200 z-10 backdrop-blur-md backdrop-saturate-150 bg-white/90">
        <button
          onClick={() => {
            localStorage.removeItem("24h:nickname");
            window.location.reload();
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-gray-100 transition"
          title="Change nickname"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-slate-900 text-sm">Flashbox</span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Messages vanish in 24h
          </span>
        </div>
        <div className="w-8 h-8" />
      </header>

      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 sm:px-4 safe-bottom"
        tabIndex={0}
      >
        {loading && (
          <div className="flex items-center justify-center py-10 text-sm text-slate-400">
            Connecting…
          </div>
        )}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <span className="text-4xl mb-2">💬</span>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((message, index) => {
          const showDate =
            index === 0 || !isSameDay(message.createdAt, messages[index - 1].createdAt);
          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex items-center text-center my-4">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 shadow-sm">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={isOwn(message)}
                showNickname={!isOwn(message)}
                onDelete={handleDelete}
                onOpenMedia={() => setViewer(message)}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <Composer room={room} nickname={nickname} onMessage={handleMessage} />

      {viewer && (
        <MediaViewer
          message={viewer}
          onClose={() => setViewer(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
