"use client";

import { useState } from "react";
import { resolveVideo } from "@/lib/video";
import type { MediaAsset } from "@/lib/types";
import Glyph from "@/components/ui/Glyph";

/**
 * Click-to-load player. Nothing from YouTube/Vimeo is requested until the
 * visitor presses play (privacy + performance). Files use native controls.
 */
export default function VideoPlayer({ url, title, poster, captionsUrl }: { url?: string; title: string; poster?: MediaAsset; captionsUrl?: string }) {
  const [active, setActive] = useState(false);
  const v = resolveVideo(url);
  const posterSrc = poster?.preview ?? poster?.src;

  if (v.kind === "invalid") {
    return (
      <div className="player player--empty" style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}>
        <div className="player__empty-msg">
          <Glyph name="video" size={28} />
          <p className="h3">Thước phim đang chờ tư liệu</p>
          <p className="small muted">Chưa có liên kết video được phép. Nếu bạn giữ bản gốc, hãy gửi qua mục Đóng góp.</p>
        </div>
      </div>
    );
  }

  if (v.kind === "file") {
    return (
      <div className="player">
        <video controls preload="none" poster={posterSrc} playsInline>
          <source src={v.src} />
          {captionsUrl ? <track kind="captions" src={captionsUrl} srcLang="vi" label="Tiếng Việt" default /> : null}
          Trình duyệt không hỗ trợ phát video.
        </video>
      </div>
    );
  }

  if (active) {
    return (
      <div className="player">
        <iframe
          src={v.embed}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  const thumb = posterSrc ?? (v.kind === "youtube" ? v.thumb : undefined);
  return (
    <div className="player">
      <button type="button" className="player__poster" onClick={() => setActive(true)} data-cursor="view">
        {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
        <span className="player__play"><Glyph name="play" size={26} /></span>
        <span className="sr-only">Phát video: {title}</span>
      </button>
      <p className="player__note small faint">Video được tải từ {v.kind === "youtube" ? "YouTube (chế độ hạn chế cookie)" : "Vimeo"} khi bạn bấm phát.</p>
    </div>
  );
}
