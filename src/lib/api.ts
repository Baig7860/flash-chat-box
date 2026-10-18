export const DEFAULT_ROOM = "default";
export const STORAGE_NICKNAME = "flashbox:nickname";

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

export function readableSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function initials(nickname: string) {
  return nickname
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function hexToRgb(hex: string) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

/** Blend two hex colours. t=0 -> a, t=1 -> b. Used to fade a message as it ages. */
export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(x.r + (y.r - x.r) * k);
  const g = Math.round(x.g + (y.g - x.g) * k);
  const bl = Math.round(x.b + (y.b - x.b) * k);
  return `rgb(${r} ${g} ${bl})`;
}

/** How much life a message has left: 1 = just posted, 0 = about to vanish. */
export function remainingLife(createdAt: number, expiresAt: number, now: number) {
  const span = expiresAt - createdAt;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (expiresAt - now) / span));
}

/** Human countdown, e.g. "23h 4m", "12m", "under a minute". */
export function formatCountdown(ms: number) {
  if (ms <= 0) return "any moment";
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return "under a minute";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
