"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryItem } from "@/lib/types";

export function MediaGallery({
  items,
  priority = false,
  layout = "stack",
}: {
  items: GalleryItem[];
  priority?: boolean;
  layout?: "stack" | "stage";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);

  if (items.length === 0) {
    return null;
  }

  const images = items.filter((item) => item.kind === "image");
  const videos = items.filter((item) => item.kind === "video");
  const [lead, ...rest] = images;

  return (
    <>
      <div className="space-y-4">
        {lead ? (
          <PhotoButton
            item={lead}
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 720px"
            onOpen={() => setOpenIndex(0)}
          />
        ) : null}
        {rest.length > 0 ? (
          <ul
            className={
              layout === "stage"
                ? "flex gap-2 overflow-x-auto pb-1"
                : "grid grid-cols-2 gap-2.5 sm:gap-3"
            }
          >
            {rest.map((item, index) => (
              <li key={item.src} className={layout === "stage" ? "w-36 shrink-0 sm:w-44" : undefined}>
                <PhotoButton
                  item={item}
                  sizes={layout === "stage" ? "176px" : "(max-width: 1024px) 50vw, 360px"}
                  frameClassName="aspect-[4/3]"
                  onOpen={() => setOpenIndex(index + 1)}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {videos.map((item) => (
          <VideoFrame key={item.src} item={item} />
        ))}
      </div>
      {openIndex !== null
        ? createPortal(
            <Lightbox
              images={images}
              index={openIndex}
              onChange={setOpenIndex}
              onClose={close}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function PhotoButton({
  item,
  onOpen,
  sizes,
  priority = false,
  frameClassName,
}: {
  item: GalleryItem;
  onOpen: () => void;
  sizes: string;
  priority?: boolean;
  frameClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full cursor-zoom-in bg-pine-2 text-left"
    >
      <Image
        src={item.src}
        alt={item.alt}
        width={item.width}
        height={item.height}
        priority={priority}
        sizes={sizes}
        className={
          frameClassName
            ? `${frameClassName} w-full object-cover`
            : "h-auto w-full"
        }
      />
      <span className="pointer-events-none absolute right-2 bottom-2 bg-ink/80 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-paper opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        Enlarge
      </span>
    </button>
  );
}

function VideoFrame({ item }: { item: GalleryItem }) {
  return (
    <figure>
      <video
        controls
        playsInline
        preload="metadata"
        src={item.src}
        className="aspect-video w-full bg-ink object-contain"
      />
      {item.alt ? <figcaption className="mt-2 text-sm text-ink-soft">{item.alt}</figcaption> : null}
    </figure>
  );
}

function Lightbox({
  images,
  index,
  onChange,
  onClose,
}: {
  images: GalleryItem[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const image = images[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    dialog.showModal();
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && index < images.length - 1) {
        onChange(index + 1);
      }
      if (event.key === "ArrowLeft" && index > 0) {
        onChange(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, index, onChange]);

  if (!image) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={image.alt}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-card p-3 shadow-2xl sm:p-4" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
            {index + 1} / {images.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="bg-pine px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-paper"
          >
            Close
          </button>
        </div>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="100vw"
          className="mx-auto max-h-[72vh] w-auto max-w-full"
          priority
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">{image.alt}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange(index - 1)}
              disabled={index === 0}
              className="border border-line px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onChange(index + 1)}
              disabled={index === images.length - 1}
              className="border border-line px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
