# Flashbox

Flashbox is a lightweight, ephemeral chat app that keeps every message alive for just 24 hours before it disappears. It is designed as a shared room experience: users pick a nickname, enter a room, and send text or media messages that vanish automatically after a brief lifetime.

The app is built with React, TypeScript, Vite, Tailwind CSS, and serverless APIs hosted on Vercel. Message storage is handled by Upstash Redis, while file uploads are sent directly to UploadThing.

## Features

- Shared-room chat with a nickname-based identity
- Messages expire automatically after 24 hours
- Text messages and media uploads supported
- Image, video, and file attachments
- Own-message deletion
- Room link copying for easy sharing
- Responsive mobile-first interface
- Background cleanup of expired messages via Vercel cron

## How it works

1. A user joins the app by entering a nickname.
2. The frontend loads the current room state from `/api/messages`.
3. New messages are sent to the serverless API, which stores them in Upstash Redis with a TTL.
4. Media files are uploaded directly to UploadThing from the browser.
5. When a message expires, it is removed from Redis and the associated file is cleaned up best-effort.
6. A daily Vercel cron job runs a cleanup sweep for any messages that may have been missed.

## Tech stack

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- API: Vercel serverless functions
- Storage: Upstash Redis
- Uploads: UploadThing
- Cleanup: Vercel cron

## Project structure

```text
.
├── api/
│   ├── cron/
│   │   └── cleanup.ts
│   ├── messages.ts
│   └── uploadthing.ts
├── public/
├── src/
│   ├── components/
│   │   ├── Brand.tsx
│   │   ├── Chat.tsx
│   │   ├── Composer.tsx
│   │   ├── FileGlyph.tsx
│   │   ├── MediaViewer.tsx
│   │   ├── MessageBubble.tsx
│   │   └── Welcome.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── uploadthing-client.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- npm
- A Vercel account for deployment
- An Upstash Redis database
- An UploadThing account and token

### Installation

```bash
git clone https://github.com/Baig7860/flash-chat-box.git
cd flash-chat-box
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the required values:

```env
UPLOADTHING_TOKEN=ut_...
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
CRON_SECRET=some-random-string-you-pick
```

### Run locally

Start the frontend:

```bash
npm run dev
```

If you want the Vercel serverless API running locally as well:

```bash
npm run dev:api
```

Then open the frontend in your browser (usually at `http://localhost:5173`).

## Production deployment

This project is configured for Vercel. The `vercel.json` file defines the app framework and a daily cron job:

```json
{
  "crons": [
    { "path": "/api/cron/cleanup", "schedule": "0 0 * * *" }
  ]
}
```

Deploy to Vercel and add the same environment variables in the project settings.

## Notes

- The app is intentionally simple and does not include authentication.
- Messages are scoped to the default room unless room logic is extended.
- Expired files are removed with a best-effort cleanup strategy, while Redis TTL handles the main lifecycle management.

## License

No explicit license file is included in this repository, so usage and redistribution should follow the repository owner's terms unless otherwise stated.

## Summary

Flashbox is a compact demonstration of a disappearing-message chat application using modern frontend tooling and serverless infrastructure. It is well-suited for experimenting with ephemeral messaging, real-time room UX, file upload integration, and time-based data cleanup patterns.
