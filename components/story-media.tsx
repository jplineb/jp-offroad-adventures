"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Lightbox } from "@/components/media-gallery";
import type { GalleryItem } from "@/lib/types";

export function StoryMedia({ items, priority = false }: { items: GalleryItem[]; priority?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);

  const images = items.filter((item) => item.kind === "image");
  const videos = items.filter((item) => item.kind === "video");
  const [lead, ...rest] = images;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {lead ? (
        <StoryPhoto
          item={lead}
          onOpen={() => setOpenIndex(0)}
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 720px"
          className="max-h-[78vh] w-full object-cover"
        />
      ) : null}
      {videos.map((item) => (
        <figure key={item.src}>
          <video
            controls
            playsInline
            preload="metadata"
            src={item.src}
            className="max-h-[78vh] w-full bg-ink object-contain"
          />
        </figure>
      ))}
      {rest.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2.5">
          {rest.map((item, index) => {
            const wide = rest.length % 2 === 1 && index === rest.length - 1;
            return (
              <li key={item.src} className={wide ? "col-span-2" : undefined}>
                <StoryPhoto
                  item={item}
                  onOpen={() => setOpenIndex(index + 1)}
                  sizes={wide ? "(max-width: 1024px) 100vw, 720px" : "(max-width: 1024px) 50vw, 360px"}
                  className={`w-full object-cover ${wide ? "aspect-[16/9]" : "aspect-[4/5]"}`}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
      {openIndex !== null
        ? createPortal(
            <Lightbox images={images} index={openIndex} onChange={setOpenIndex} onClose={close} />,
            document.body,
          )
        : null}
    </div>
  );
}

function StoryPhoto({
  item,
  onOpen,
  sizes,
  className,
  priority = false,
}: {
  item: GalleryItem;
  onOpen: () => void;
  sizes: string;
  className: string;
  priority?: boolean;
}) {
  const credit = item.alt.includes("Photo by") ? item.alt : "";

  return (
    <figure>
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full cursor-zoom-in overflow-hidden bg-pine-2"
      >
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          priority={priority}
          sizes={sizes}
          className={`${className} transition duration-500 group-hover:scale-[1.015]`}
        />
      </button>
      {credit ? <figcaption className="mt-1.5 text-xs text-ink-soft">{credit}</figcaption> : null}
    </figure>
  );
}
