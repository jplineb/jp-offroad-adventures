"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryItem } from "@/lib/types";

const videoType: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  m4v: "video/mp4",
};

export function MediaGallery({
  items,
  priority = false,
}: {
  items: GalleryItem[];
  priority?: boolean;
}) {
  const images = items.filter((item) => item.kind === "image");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);

  if (items.length === 0) {
    return null;
  }

  let imageCursor = 0;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {items.map((item) => {
          const span = item.kind === "video" || items.length === 1;
          if (item.kind === "video") {
            return (
              <li key={item.src} className="col-span-2">
                <VideoFrame item={item} />
              </li>
            );
          }

          const index = imageCursor;
          imageCursor += 1;
          return (
            <li key={item.src} className={span ? "col-span-2" : undefined}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="group relative block w-full cursor-zoom-in bg-pine-2 text-left"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  priority={priority && index === 0}
                  sizes={span ? "(max-width: 768px) 100vw, 760px" : "(max-width: 768px) 50vw, 380px"}
                  className="h-auto w-full"
                />
                <span className="pointer-events-none absolute right-2 bottom-2 bg-ink/80 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-paper opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  Enlarge
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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

function VideoFrame({ item }: { item: GalleryItem }) {
  const extension = item.src.split(".").pop()?.toLowerCase() ?? "mp4";
  return (
    <figure className="bg-ink">
      <video controls playsInline preload="metadata" className="mx-auto max-h-[70vh] w-auto max-w-full bg-black">
        <source src={item.src} type={videoType[extension] ?? "video/mp4"} />
      </video>
      <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-paper/80">
        <span>{item.alt}</span>
        <a href={item.src} className="uppercase tracking-[0.14em] text-paper underline-offset-2 hover:underline">
          Open file
        </a>
      </figcaption>
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
