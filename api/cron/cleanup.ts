import { Redis } from "@upstash/redis";
import { UTApi } from "uploadthing/server";

/**
 * Vercel Cron job (see vercel.json, runs daily at midnight UTC).
 *
 * Sweeps msg:* keys for the default room, deletes Uploadthing attachments
 * and removes expired message keys + sorted-set members. Lazy cleanup in
 * /api/messages GET handles the common path; this cron catches rooms
 * nobody is reading right now.
 *
 * Protect with CRON_SECRET so random requests can't trigger it.
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const utapi = new UTApi();

const ROOM = "default";
const NOW = Date.now();

export default async function cleanupHandler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  let deleted = 0;

  // Get all message IDs for the default room from the sorted set
  const ids = (await redis.zrange(`room:${ROOM}:ids`, 0, -1)) as string[];

  for (const id of ids) {
    const message = (await redis.get(`msg:${ROOM}:${id}`)) as any | null;
    if (!message || message.expiresAt >= NOW) continue;

    if (message.file?.key) {
      try {
        await utapi.deleteFiles([message.file.key]);
      } catch {
        /* best-effort */
      }
    }
    await redis.del(`msg:${ROOM}:${id}`);
    await redis.zrem(`room:${ROOM}:ids`, id);
    deleted++;
  }

  res.status(200).json({ ok: true, room: ROOM, deleted, ttlSeconds: 60 * 60 * 24 });
}
