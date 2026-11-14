import { parseMarkdown, type Inline } from "@/lib/markdown";
import VideoPlayer from "./VideoPlayer";

function renderInline(nodes: Inline[], key = ""): React.ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}${i}`;
    switch (n.t) {
      case "text": return n.v;
      case "b": return <strong key={k}>{renderInline(n.c, k)}</strong>;
      case "i": return <em key={k}>{renderInline(n.c, k)}</em>;
      case "code": return <code key={k}>{n.v}</code>;
      case "a": {
        const external = /^https?:/.test(n.href);
        return <a key={k} href={n.href} {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{renderInline(n.c, k)}</a>;
      }
    }
  });
}

/** Renders archive Markdown to React elements — no raw HTML is ever injected. */
export default function Prose({ body, className = "" }: { body: string; className?: string }) {
  const blocks = parseMarkdown(body);
  return (
    <div className={`prose ${className}`}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2": return <h2 key={i} id={b.id}>{renderInline(b.c)}</h2>;
          case "h3": return <h3 key={i} id={b.id}>{renderInline(b.c)}</h3>;
          case "p": return <p key={i}>{renderInline(b.c)}</p>;
          case "quote": return <blockquote key={i}><p>{renderInline(b.c)}</p></blockquote>;
          case "ul": return <ul key={i}>{b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ul>;
          case "ol": return <ol key={i}>{b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ol>;
          case "img":
            return (
              <figure key={i} className="prose__figure plate">
                <div className="plate__frame"><img src={b.src} alt={b.alt} loading="lazy" decoding="async" /></div>
                {b.caption ? <figcaption>{b.caption}</figcaption> : null}
              </figure>
            );
          case "video":
            return <div key={i} className="prose__video"><VideoPlayer url={b.url} title="Video trong bài viết" /></div>;
        }
      })}
    </div>
  );
}

export function tableOfContents(body: string) {
  const out: { id: string; text: string }[] = [];
  for (const b of parseMarkdown(body)) {
    if (b.t === "h2") out.push({ id: b.id, text: b.c.map((c) => ("v" in c ? c.v : "")).join("") });
  }
  return out;
}
