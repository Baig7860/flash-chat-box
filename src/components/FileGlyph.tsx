import {
  FileAudio,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";

const MATCHERS: Array<[RegExp, LucideIcon]> = [
  [/^image\//, FileImage],
  [/^video\//, FileVideo],
  [/^audio\//, FileAudio],
  [/zip|compressed|tar|rar|x-7z/, FileArchive],
  [/sheet|csv|excel/, FileSpreadsheet],
];

/** A file-type glyph that stays in the same visual language as the rest of the UI. */
export default function FileGlyph({ mime, className }: { mime: string; className?: string }) {
  const Icon = MATCHERS.find(([re]) => re.test(mime))?.[1] ?? FileText;
  return <Icon className={className} aria-hidden />;
}
