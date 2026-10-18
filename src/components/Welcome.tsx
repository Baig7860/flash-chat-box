import { useState } from "react";
import { DEFAULT_ROOM, fetchMessages } from "../lib/api";
import BoltMark from "./Brand";

export type WelcomeProps = {
  onJoin: (nickname: string) => void;
};

export default function Welcome({ onJoin }: WelcomeProps) {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nickname.trim();
    if (!name || loading) return;
    setError("");
    setLoading(true);
    try {
      // Confirm the room is reachable before dropping someone into it.
      await fetchMessages(DEFAULT_ROOM);
      onJoin(name);
    } catch {
      setError("Can't reach the room. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-[100dvh] w-full items-center justify-center bg-paper px-5"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 40px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 40px)",
      }}
    >
      <div className="w-full max-w-[380px] animate-rise motion-reduce:animate-none">
        <div className="flex flex-col items-center text-center">
          <BoltMark className="h-16 w-16" iconClassName="h-7 w-7" />
          <h1 className="brand-text mt-5 text-[34px] font-extrabold leading-none tracking-tight">
            Flashbox
          </h1>
          <p className="mt-3 max-w-[290px] text-[14px] leading-relaxed text-ink-soft">
            A shared room where every message disappears after 24 hours.
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          className="mt-8 rounded-3xl border border-line bg-surface p-5 shadow-[0_24px_60px_-40px_rgba(40,32,120,0.5)]"
        >
          <label htmlFor="nickname" className="text-[12px] font-semibold text-ink">
            Your name
          </label>
          <input
            id="nickname"
            autoFocus
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Alex"
            maxLength={32}
            className="mt-2 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2 text-[12px] font-medium text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="brand-surface mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(78,49,214,0.85)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-ink/10 disabled:text-ink-faint disabled:shadow-none"
          >
            {loading ? "Opening…" : "Enter room"}
          </button>
        </form>
      </div>
    </div>
  );
}
