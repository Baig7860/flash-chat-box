import { createRouteHandler } from "uploadthing/express";
import { createUploadthing, type FileRouter } from "uploadthing/server";

/**
 * Uploadthing file router.
 *
 * Files are uploaded DIRECTLY from the browser to Uploadthing storage
 * (never through this function), so the Vercel 4.5 MB body limit never applies.
 * This function only mints presigned URLs and receives the upload-complete
 * webhook. Message metadata is stored separately in /api/messages.
 */
const f = createUploadthing();

export const uploadRouter = {
  // One route for everything friends share: images, videos, documents, any blob.
  media: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    video: { maxFileSize: "16MB", maxFileCount: 5 },
    blob: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    // No auth in this mock app — anyone may upload to any room.
    .onUploadComplete(async ({ file }) => {
      console.log("[uploadthing] upload complete", file.key, file.name, file.size);
      // We intentionally do NOT persist the message here. The client posts
      // metadata to /api/messages after onClientUploadComplete, which keeps
      // dev (localhost) and production behaviour identical.
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    // callbackUrl is auto-detected from the request; Uploadthing POSTs the
    // upload-complete webhook to this same /api/uploadthing path.
  },
});

/**
 * Vercel Node functions receive plain Node req/res. The Express router from
 * uploadthing/express handles both, but we add CORS so the Vite dev server
 * (localhost:5173) can call it while `vercel dev` runs on :3000.
 */
export default function uploadThingHandler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  return (uploadthingHandler as any)(req, res);
}
