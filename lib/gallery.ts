import type { Album, MediaAsset } from "./types";
import type { GalleryItem } from "@/components/content/Gallery";
import { formatFuzzy } from "./dates";

export function toGalleryItem(a: MediaAsset, album?: Album): GalleryItem {
  return {
    id: a.id,
    src: a.src,
    preview: a.preview,
    thumb: a.thumb,
    width: a.width,
    height: a.height,
    alt: a.alt,
    caption: a.caption,
    credit: a.photographer,
    date: a.takenAt ? formatFuzzy(a.takenAt) : album?.eventDate ? formatFuzzy(album.eventDate) : undefined,
    album: album?.title,
    tone: a.tone,
    demo: a.demo,
  };
}
