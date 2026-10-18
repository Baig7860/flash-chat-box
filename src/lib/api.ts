export const DEFAULT_ROOM = "default";

export interface StoredFile {
  key: string;
  url: string;
  name: string;
  size: number;
  mime: string;
}

export type MessageType = "text" | "image" | "video" | "file";

export interface Message {
  id: string;
  room: string;
  nickname: string;
  text: string;
  type: MessageType;
  file: StoredFile | null;
  createdAt: number;
  expiresAt: number;
}

export interface FetchMessagesResponse {
  ok: boolean;
  room: string;
  messages: Message[];
  ttlSeconds: number;
}

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `request failed ${res.status}`);
  }
  return res.json();
}

export function fetchMessages(room: string = DEFAULT_ROOM) {
  return request(`/api/messages?room=${encodeURIComponent(room)}`) as Promise<
    FetchMessagesResponse
  >;
}

export function sendMessage(
  room: string,
  nickname: string,
  text: string,
  file: StoredFile | null,
) {
  return request("/api/messages", {
    method: "POST",
    body: JSON.stringify({ room, nickname, text, file }),
  }) as Promise<{ ok: boolean; message: Message }>;
}

export function deleteMessage(room: string, id: string) {
  return request(`/api/messages?id=${encodeURIComponent(id)}&room=${encodeURIComponent(room)}`, {
    method: "DELETE",
  }) as Promise<{ ok: boolean }>;
}

export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isSameDay(a: number, b: number) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("word") || mime.includes("document")) return "📘";
  if (mime.includes("zip") || mime.includes("compressed")) return "🗜️";
  return "📄";
}

export function readableSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function avatarColor(nickname: string) {
  const colors = [
    "bg-amber-500", "bg-blue-500", "bg-cyan-500", "bg-emerald-500",
    "bg-fuchsia-500", "bg-indigo-500", "bg-orange-500", "bg-pink-500",
    "bg-purple-500", "bg-red-500", "bg-rose-500", "bg-teal-500",
    "bg-violet-500", "bg-yellow-500",
  ];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function initials(nickname: string) {
  return nickname
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}
