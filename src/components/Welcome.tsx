import { useState } from "react";
import { fetchMessages, DEFAULT_ROOM } from "../lib/api";

export type WelcomeProps = {
  onJoin: (nickname: string) => void;
};

const STORAGE_NICKNAME = "flashbox:nickname";

export default function Welcome({ onJoin }: WelcomeProps) {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetchMessages(DEFAULT_ROOM);
      localStorage.setItem(STORAGE_NICKNAME, nickname.trim());
      onJoin(nickname.trim());
    } catch (err) {
      setError("Couldn't reach the chat. Make sure the API is running (`vercel dev`).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-top min-h-[100dvh] w-full flex items-center justify-center bg-gray-100 px-4 py-6">
      <div className="max-w-md w-full space-y-4">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/icon.png"
            alt="Flashbox"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-blue-200"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Flashbox</h1>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Your nickname
            </label>
            <input
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={32}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading || !nickname.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:opacity-60 transition shadow shadow-blue-200/50"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span>Enter chat</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
