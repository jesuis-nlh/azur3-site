/**
 * Archive Markdown: a deliberately small, safe subset.
 *   ## Heading / ### Subheading
 *   > quote
 *   - list / 1. list
 *   ![alt](src "caption")   (own line)
 *   @video(https://...)      (own line)
 *   inline: **bold**, *italic*, [link](https://… or /path), `code`
 * Raw HTML is never interpreted.
 */
export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; c: Inline[] }
  | { t: "i"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "a"; href: string; c: Inline[] };

export type Block =
  | { t: "h2" | "h3"; c: Inline[]; id: string }
  | { t: "p"; c: Inline[] }
  | { t: "quote"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "img"; src: string; alt: string; caption?: string }
  | { t: "video"; url: string };

export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\//i.test(h) || (h.startsWith("/") && !h.startsWith("//")) || h.startsWith("#")) return h;
  return null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[2] !== undefined) out.push({ t: "b", c: parseInline(m[2]) });
    else if (m[4] !== undefined) out.push({ t: "i", c: parseInline(m[4]) });
    else if (m[6] !== undefined) out.push({ t: "code", v: m[6] });
    else if (m[8] !== undefined) {
      const href = safeHref(m[9]);
      out.push(href ? { t: "a", href, c: parseInline(m[8]) } : { t: "text", v: m[8] });
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

export function headingId(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join(" ")) });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { flush(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = trimmed.match(/^(#{2,3})\s+(.+)$/))) {
      flush();
      blocks.push({ t: m[1].length === 2 ? "h2" : "h3", c: parseInline(m[2]), id: headingId(m[2]) });
    } else if ((m = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/))) {
      flush();
      const src = safeHref(m[2]);
      if (src) blocks.push({ t: "img", alt: m[1], src, caption: m[3] });
    } else if ((m = trimmed.match(/^@video\(([^)\s]+)\)$/))) {
      flush();
      const url = safeHref(m[1]);
      if (url) blocks.push({ t: "video", url });
    } else if (trimmed.startsWith(">")) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) q.push(lines[i++].trim().replace(/^>\s?/, ""));
      i--;
      blocks.push({ t: "quote", c: parseInline(q.join(" ")) });
    } else if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      flush();
      const ordered = /^\d+\./.test(trimmed);
      const items: Inline[][] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push(parseInline(lines[i].trim().replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, "")));
        i++;
      }
      i--;
      blocks.push({ t: ordered ? "ol" : "ul", items });
    } else {
      para.push(trimmed);
    }
  }
  flush();
  return blocks;
}
