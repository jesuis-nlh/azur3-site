/** Resolves a public video URL to a privacy-friendly embed. */
export type VideoEmbed =
  | { kind: "youtube"; id: string; embed: string; thumb: string }
  | { kind: "vimeo"; id: string; embed: string }
  | { kind: "file"; src: string }
  | { kind: "invalid" };

export function resolveVideo(url?: string): VideoEmbed {
  if (!url) return { kind: "invalid" };
  let u: URL;
  try { u = new URL(url); } catch { return { kind: "invalid" }; }
  if (u.protocol !== "https:") return { kind: "invalid" };
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let yt: string | null = null;
  if (host === "youtu.be") yt = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    yt = u.searchParams.get("v") ?? (u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1] ?? null);
  }
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    return { kind: "youtube", id: yt, embed: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { kind: "vimeo", id, embed: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` };
  }
  if (/\.(mp4|webm|m4v)$/i.test(u.pathname)) return { kind: "file", src: url };
  return { kind: "invalid" };
}
