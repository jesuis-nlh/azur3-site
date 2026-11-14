import type { MediaAsset } from "@/lib/types";

/**
 * Responsive image with honest metadata. Uses the thumb/preview variants via
 * srcset so originals are never sent to visitors unnecessarily.
 */
export default function Plate({
  asset, sizes = "(min-width: 900px) 50vw, 100vw", ratio, index, caption = true, priority = false, className = "",
}: {
  asset: MediaAsset;
  sizes?: string;
  /** force an aspect ratio, e.g. "4 / 5"; defaults to the image's own */
  ratio?: string;
  index?: string;
  caption?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const srcSet = [asset.thumb && `${asset.thumb} 640w`, asset.preview && `${asset.preview} ${Math.min(asset.width, 1800)}w`].filter(Boolean).join(", ");
  return (
    <figure className={`plate ${className}`}>
      <div className="plate__frame" style={{ aspectRatio: ratio ?? `${asset.width} / ${asset.height}`, background: asset.tone }}>
        <img
          src={asset.preview ?? asset.src}
          srcSet={srcSet || undefined}
          sizes={srcSet ? sizes : undefined}
          width={asset.width}
          height={asset.height}
          alt={asset.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      </div>
      {caption && (asset.caption || index) ? (
        <figcaption>
          {index ? <span className="coord">{index}</span> : null}
          <span>
            {asset.caption}
            {asset.photographer && !asset.demo ? <> — Ảnh: {asset.photographer}</> : null}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
