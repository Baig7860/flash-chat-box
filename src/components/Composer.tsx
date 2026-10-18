import { useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { useUploadThing } from "../lib/uploadthing-client";
import { sendMessage, readableSize, type Message, type StoredFile } from "../lib/api";

export interface ComposerProps {
  room: string;
  nickname: string;
  onMessage: (message: Message) => void;
}

const ACCEPT =
  "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.csv,.mp3,.wav,.ogg,.mov,.avi,.mkv,.webm";

export default function Composer({ room, nickname, onMessage }: ComposerProps) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null!);

  const { startUpload, isUploading } = useUploadThing("media", {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: async (results) => {
      setUploadError("");
      setProgress(0);
      for (const r of results) {
        try {
          const { message } = await sendMessage(room, nickname, "", {
            key: r.key!,
            url: r.url,
            name: r.name,
            size: r.size,
            mime: r.type,
          } as StoredFile);
          onMessage(message);
        } catch (err) {
          setUploadError("Failed to save a file to the chat.");
        }
      }
      setSelected([]);
      inputRef.current?.focus();
    },
    onUploadError: (err) => {
      setUploadError(err.message || "Upload failed.");
    },
  });

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setSelected((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const sendText = async () => {
    if (!text.trim()) return;
    const body = text;
    setText("");
    try {
      const { message } = await sendMessage(room, nickname, body, null);
      onMessage(message);
    } catch (err) {
      setUploadError("Could not send message.");
    }
  };

  const sendFiles = async () => {
    if (selected.length === 0) return;
    try {
      await startUpload(selected);
    } catch (err) {
      setUploadError("Upload did not start.");
    }
  };

  const disabled = isUploading || (!text.trim() && selected.length === 0);

  return (
    <footer
      className="shrink-0 flex flex-col gap-2 bg-white border-t border-slate-200 p-3 sm:p-4 safe-bottom z-20 backdrop-blur-md backdrop-saturate-150 bg-white/95"
    >
      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {uploadError}
        </div>
      )}
      {isUploading && (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-blue-500 animate-pulse-fast"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Uploading…</span>
        </div>
      )}
      <div className="flex items-end gap-2">
        <label className="shrink-0">
          <input
            id="file-input"
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={onFilesChange}
          />
          <button
            type="button"
            onClick={() => document.getElementById("file-input")?.click()}
            disabled={isUploading}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition"
            title="Attach photo, video or document"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </label>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          rows={1}
          maxLength={4000}
          disabled={isUploading}
          className="flex-1 min-h-[26px] sm:min-h-[44px] md:min-h-[52px] px-3.5 py-2 rounded-2xl border border-slate-200 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendText();
            }
          }}
        />

        <button
          onClick={sendFiles}
          disabled={disabled}
          className="ml-2 shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:opacity-60 transition shadow shadow-blue-200/40"
          title="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {selected.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-gray-50 text-xs"
            >
              <span className="shrink-0">{fileIcon(file.type)}</span>
              <span className="truncate text-slate-700">{file.name}</span>
              <span className="shrink-0 text-slate-400">{readableSize(file.size)}</span>
              <button
                onClick={() => removeFile(index)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
              >
                <X className="h-3 w-3" strokeWidth="1.5" />
              </button>
            </div>
          ))}
          <button
            onClick={sendFiles}
            disabled={isUploading}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
          >
            Upload {selected.length}
          </button>
        </div>
      )}
    </footer>
  );
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  return "📄";
}
