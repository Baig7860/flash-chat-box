import { Redis } from "@upstash/redis";
import { UTApi } from "uploadthing/server";

/**
 * Vercel Cron job (see vercel.json, runs every hour).
 *
 * Sweeps msg:* keys, deletes Uploadthing attachments and removes expired
 * message keys + sorted-set members. Lazy cleanup in /api/messages GET handles
 * the common path; this cron catches rooms nobody is reading right now.
 *
 * Protect with CRON_SECRET so random requests can't trigger it.
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const utapi = new UTApi();
const NOW = Date.now();

export default async function cleanupHandler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  let scanned = 0;
  let deleted = 0;

  for await (const key of redis.scanIterator({ match: "msg:*", count: 100 })) {
    scanned++;
    const message = (await redis.get(key)) as any | null;
    if (!message || message.expiresAt >= NOW) continue;

    // msg:{room}:{id} — room may contain colons, so split from the right.
    const rest = key.slice("msg:".length);
    const sep = rest.lastIndexOf(":");
    const room = rest.slice(0, sep);
    const id = rest.slice(sep + 1);

    if (message.file?.key) {
      try {
        await utapi.deleteFile(message.file.key);
      } catch {
        /* best-effort */
      }
    }
    await redis.del(key);
    await redis.zrem(`room:${room}:ids`, id);
    deleted++;
  }

  res.status(200).json({ ok: true, scanned, deleted, ttlSeconds: 60 * 60 * 24 });
}
