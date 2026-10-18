import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, X } from "lucide-react";
import { useUploadThing } from "../lib/uploadthing-client";
import { readableSize, sendMessage, type Message, type StoredFile } from "../lib/api";
import FileGlyph from "./FileGlyph";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        } catch {
          setUploadError("That file uploaded but couldn't be added to the room.");
        }
      }
      setSelected([]);
      textareaRef.current?.focus();
    },
    onUploadError: (err) => {
      setUploadError(err.message || "Upload failed.");
    },
  });

  // Grow the input with its content, up to a comfortable ceiling.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text]);

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
    } catch {
      setText(body);
      setUploadError("Couldn't send that message. Try again.");
    }
  };

  const sendFiles = async () => {
    if (selected.length === 0) return;
    try {
      await startUpload(selected);
    } catch {
      setUploadError("Upload didn't start.");
    }
  };

  // One button that sends everything you've staged: text first, then files.
  const handleSend = async () => {
    if (isUploading) return;
    if (text.trim()) await sendText();
    if (selected.length) await sendFiles();
  };

  const canSend = !isUploading && (!!text.trim() || selected.length > 0);

  return (
    <footer
      className="glass relative z-20 shrink-0 border-t border-line px-3 pt-2.5 sm:px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
    >
      {uploadError && (
        <p
          role="alert"
          className="mb-2 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2 text-[12px] font-medium text-danger"
        >
          {uploadError}
        </p>
      )}

      {isUploading && (
        <div className="mb-2 flex items-center gap-2">
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
            <span
              className="brand-surface absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-ink-soft">
            {Math.round(progress)}%
          </span>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {selected.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs shadow-sm"
            >
              <FileGlyph mime={file.type} className="h-3.5 w-3.5 text-brand-600" />
              <span className="max-w-[140px] truncate font-medium text-ink">{file.name}</span>
              <span className="text-ink-faint">{readableSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="grid h-5 w-5 place-items-center rounded-full text-ink-faint transition hover:bg-danger-soft hover:text-danger"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={onFilesChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          aria-label="Attach a photo, video or document"
          title="Attach a photo, video or document"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-brand-50 hover:text-brand-600 disabled:opacity-40"
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          rows={1}
          maxLength={4000}
          disabled={isUploading}
          aria-label="Message"
          className="max-h-[132px] flex-1 resize-none overflow-y-auto rounded-2xl border border-line bg-paper px-4 py-2.5 text-[15px] leading-6 text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100 disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send"
          title="Send"
          className="brand-surface grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-[0_10px_20px_-10px_rgba(78,49,214,0.85)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-ink/10 disabled:text-ink-faint disabled:shadow-none"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </footer>
  );
}
