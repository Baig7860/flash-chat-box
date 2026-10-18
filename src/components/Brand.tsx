import { Zap } from "lucide-react";

/**
 * The brand mark: the app icon's lightning bolt, set on the blue -> violet
 * gradient. Used wherever "Flashbox" needs a face.
 */
export default function BoltMark({
  className = "h-9 w-9",
  iconClassName = "h-[18px] w-[18px]",
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`brand-surface grid shrink-0 place-items-center rounded-[32%] text-white shadow-[0_10px_22px_-10px_rgba(78,49,214,0.75)] ${className}`}
      aria-hidden
    >
      <Zap className={iconClassName} strokeWidth={1.5} fill="currentColor" />
    </span>
  );
}
