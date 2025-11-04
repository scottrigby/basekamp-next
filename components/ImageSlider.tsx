"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Img = {
  src: string;
  alt?: string;
};

type Props = {
  images: Img[];
  className?: string;
};

function normalizeSrc(src: string): string {
  // Ensure a leading slash for /public assets; also collapse accidental double slashes
  const withSlash = src.startsWith("/") ? src : `/${src}`;
  return withSlash.replace(/\/{2,}/g, "/");
}

export default function ImageSlider({ images, className }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const swipeLocked = useRef(false);

  const total = images.length;

  const close = useCallback(() => {
    setOpen(false);
    document.documentElement.classList.remove("overflow-hidden");
    document.body.classList.remove("overflow-hidden");
  }, []);

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
    document.documentElement.classList.add("overflow-hidden");
    document.body.classList.add("overflow-hidden");
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, prev, next]);

  const current = useMemo(() => images[index], [images, index]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (swipeLocked.current) return;
    const t = e.changedTouches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (swipeLocked.current) return;
    const t = e.changedTouches[0];
    touchEndX.current = t.clientX;
    if (
      touchStartY.current !== null &&
      Math.abs(t.clientY - touchStartY.current) > 40
    ) {
      swipeLocked.current = true;
      setTimeout(() => (swipeLocked.current = false), 300);
    }
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const dx = touchEndX.current - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
  };

  return (
    <>
      <div className={className}>
        {images.map((img, i) => {
          const src = normalizeSrc(img.src);
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => openAt(i)}
              className="group relative aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label={`Open image ${i + 1}`}
            >
              <Image
                src={src}
                alt={img.alt ?? `Image ${i + 1}`}
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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        >
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-white/80 text-sm">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={close}
              className="rounded-md px-3 py-1.5 text-white bg-white/10 hover:bg-white/20 border border-white/20"
              aria-label="Close"
            >
              Close
            </button>
          </div>

          <button
            type="button"
            onClick={prev}
            className="hidden sm:block absolute left-0 top-0 bottom-0 w-1/5 z-10 cursor-pointer"
            aria-label="Previous image"
          />
          <button
            type="button"
            onClick={next}
            className="hidden sm:block absolute right-0 top-0 bottom-0 w-1/5 z-10 cursor-pointer"
            aria-label="Next image"
          />

          <div
            className="absolute inset-0 z-0 flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative w-full h-full">
              {/* Normalize again for the stage just in case */}
              <Image
                src={normalizeSrc(current.src)}
                alt={current.alt ?? `Image ${index + 1}`}
                fill
                sizes="100vw"
                className="object-contain select-none"
                priority
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:hidden">
            <button
              type="button"
              onClick={prev}
              className="rounded-md px-3 py-2 text-white bg-white/10 hover:bg-white/20 border border-white/20"
              aria-label="Previous"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-md px-3 py-2 text-white bg-white/10 hover:bg-white/20 border border-white/20"
              aria-label="Next"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
