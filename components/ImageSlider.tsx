"use client";

import * as React from "react";
import Image from "next/image";
import Lightbox, { Slide } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export type Img = {
  src: string; // e.g. "image01.jpg" or "/image01.jpg"
  alt?: string;
};

/**
 * Normalize provided paths to public URLs:
 * - ensure leading slash
 */
function normalizeSrc(src: string): string {
  const normalized = src.startsWith("/") ? src : `/${src}`;
  return normalized;
}

/**
 * Convert Img[] into Lightbox slides.
 * For basic slides, only src and alt are needed.
 * If we later add width/height/srcSet, map them here.
 */
function toSlides(images: Img[]): Slide[] {
  return images.map((img) => ({
    src: normalizeSrc(img.src),
    alt: img.alt,
  }));
}

type Props = {
  images: Img[];
  className?: string; // grid styles from our caller
};

export default function ImageSlider({ images, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const slides = React.useMemo(() => toSlides(images), [images]);

  const openAt = React.useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
    // Optional: lock scrolling while lightbox is open
    document.documentElement.classList.add("overflow-hidden");
    document.body.classList.add("overflow-hidden");
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    document.documentElement.classList.remove("overflow-hidden");
    document.body.classList.remove("overflow-hidden");
  }, []);

  return (
    <>
      <div className={className}>
        {images.map((img, i) => {
          const src = normalizeSrc(img.src);
          const desc=img.alt ?? `${i + 1}`
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => openAt(i)}
              className="group relative aspect-square overflow-hidden rounded-md focus:outline-2 focus:outline-blue-500 flex-shrink-0 snap-start"
              aria-label={`View image: ${desc}`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={i < 4}
              />
            </button>
          );
        })}
      </div>

      {open && (
        <Lightbox
          open={open}
          close={close}
          index={index}
          slides={slides}
          // We can add plugins here later (Zoom, Thumbnails, etc.)
        />
      )}
    </>
  );
}
