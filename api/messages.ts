import { Redis } from "@upstash/redis";
import { UTApi } from "uploadthing/server";

/**
 * Message store with automatic 24-hour expiration.
 *
 * Data model (Upstash Redis / Vercel KV compatible):
 *   msg:{room}:{id}   -> JSON message, TTL 86400s (Redis expires the key itself)
 *   room:{room}:ids   -> sorted set of message ids, score = createdAt
 *
 * When a message's TTL expires it vanishes from the chat automatically.
 * Uploadthing files attached to expired messages are deleted best-effort
 * lazily on reads (and by /api/cron/cleanup) so nothing lingers.
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const utapi = new UTApi(); // reads UPLOADTHING_TOKEN from env

const TTL_SECONDS = 60 * 60 * 24; // 24 hours
const TTL_MS = TTL_SECONDS * 1000;

export type MessageType = "text" | "image" | "video" | "file";

export interface StoredFile {
  key: string;
  url: string;
  name: string;
  size: number;
  mime: string;
}

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

function msgKey(room: string, id: string) {
  return `msg:${room}:${id}`;
}
function idsKey(room: string) {
  return `room:${room}:ids`;
}

function fileTypeOf(mime: string): MessageType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "file";
  return "file";
}

async function removeExpired(room: string, id: string, message: Message | null) {
  try {
    if (message?.file?.key) {
      await utapi.deleteFiles({ fileKeys: [message.file.key] }).catch(() => {
        /* best-effort; Uploadthing retention policy applies anyway */
      });
    }
  } catch {
    /* ignore */
  }
  await redis.del(msgKey(room, id)).catch(() => {});
  await redis.zrem(idsKey(room), id).catch(() => {});
}

function setCorsHeaders(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

export default async function messagesHandler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const room = (typeof req.query?.room === "string" ? req.query.room : "default") as string;

  if (req.method === "GET") {
    const now = Date.now();
    const ids = (await redis.zrange(idsKey(room), 0, -1)) as string[];

    const raw = await Promise.all(ids.map((id) => redis.get(msgKey(room, id))));
    const messages: Message[] = [];
    const cleanup: Promise<void>[] = [];

    for (let i = 0; i < ids.length; i++) {
      const message = raw[i] as Message | null;
      if (!message || message.expiresAt < now) {
        cleanup.push(removeExpired(room, ids[i], message));
        continue;
      }
      messages.push(message);
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);
    await Promise.all(cleanup);

    res.status(200).json({ ok: true, room, messages, ttlSeconds: TTL_SECONDS });
    return;
  }

  if (req.method === "POST") {
    let body: { room?: string; nickname?: string; text?: string; file?: StoredFile | null };
    try {
      body = await parseBody(req);
    } catch {
      res.status(400).json({ ok: false, error: "invalid json" });
      return;
    }

    const { nickname = "Friend", text = "", file } = body;
    const targetRoom = body.room || room;

    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const expiresAt = createdAt + TTL_MS;

    const message: Message = {
      id,
      room: targetRoom,
      nickname: String(nickname).slice(0, 32),
      text: String(text).slice(0, 4000),
      type: file ? fileTypeOf(file.mime) : "text",
      file: file ?? null,
      createdAt,
      expiresAt,
    };

    await redis.set(msgKey(targetRoom, id), message, { ex: TTL_SECONDS });
    await redis.zadd(idsKey(targetRoom), { score: createdAt, member: id });

    res.status(201).json({ ok: true, message });
    return;
  }

  if (req.method === "DELETE") {
    // No auth mock app: anyone can delete a message they posted.
    const { id } = typeof req.query?.id === "string" ? { id: req.query.id } : {};
    const targetRoom = typeof req.query?.room === "string" ? req.query.room : room;
    if (!id) {
      res.status(400).json({ ok: false, error: "missing id" });
      return;
    }
    const message = (await redis.get(msgKey(targetRoom, id))) as Message | null;
    if (message) {
      await removeExpired(targetRoom, id, message);
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, error: "method not allowed" });
}
