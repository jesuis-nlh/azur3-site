/** Small, consistent line icons (1.4px stroke). */
type Name = "photo" | "video" | "article" | "search" | "arrow" | "arrow-left" | "close" | "play" | "pause" | "info" | "menu" | "expand" | "star" | "upload" | "check" | "lock";

const PATHS: Record<Name, string> = {
  photo: "M4 7h3l1.5-2h7L17 7h3v12H4zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  video: "M4 6h12v12H4zM16 10l5-3v10l-5-3",
  article: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  close: "M6 6l12 12M18 6L6 18",
  play: "M8 5l11 7-11 7z",
  pause: "M8 5v14M16 5v14",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5",
  menu: "M4 8h16M4 16h16",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  star: "M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  check: "M5 12.5l4.5 4.5L19 7",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 016 0v3",
};

export default function Glyph({ name, size = 18, className, title }: { name: Name; size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} fill={name === "play" || name === "star" ? "currentColor" : "none"} />
    </svg>
  );
}
