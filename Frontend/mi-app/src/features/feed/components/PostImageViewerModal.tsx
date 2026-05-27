import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";

type ViewerImage = {
  url: string;
  objectPosition?: string;
  scale?: number;
};

type PostImageViewerModalProps = {
  images: ViewerImage[];
  initialIndex?: number;
  onClose: () => void;
};

type Point = { x: number; y: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PostImageViewerModal({ images, initialIndex = 0, onClose }: PostImageViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Point | null>(null);
  const startOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const currentImage = images[index];
  const totalScale = zoom;
  const imageTransform = `translate(${offset.x}px, ${offset.y}px) scale(${totalScale})`;

  const maxOffset = useMemo(() => {
    const el = containerRef.current;
    if (!el || totalScale <= 1) return { x: 0, y: 0 };
    const halfW = el.clientWidth / 2;
    const halfH = el.clientHeight / 2;
    return {
      x: (totalScale - 1) * halfW,
      y: (totalScale - 1) * halfH,
    };
  }, [totalScale]);

  const clampOffset = (next: Point): Point => ({
    x: clamp(next.x, -maxOffset.x, maxOffset.x),
    y: clamp(next.y, -maxOffset.y, maxOffset.y),
  });

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goPrev = () => {
    setIndex((prev) => Math.max(0, prev - 1));
    resetView();
  };

  const goNext = () => {
    setIndex((prev) => Math.min(images.length - 1, prev + 1));
    resetView();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    setIndex(clamp(initialIndex, 0, Math.max(0, images.length - 1)));
    resetView();
  }, [initialIndex, images.length, resetView]);

  const handleMouseDown = (event: React.MouseEvent<HTMLImageElement>) => {
    if (zoom <= 1) return;
    event.preventDefault();
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    startOffsetRef.current = offset;
    setIsDragging(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    setOffset(clampOffset({ x: startOffsetRef.current.x + dx, y: startOffsetRef.current.y + dy }));
  };

  const stopDrag = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const setZoomSafe = (nextZoom: number) => {
    const safe = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(safe);
    if (safe === 1) setOffset({ x: 0, y: 0 });
    else setOffset((prev) => clampOffset(prev));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      pinchDistanceRef.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartZoomRef.current = zoom;
      return;
    }
    if (event.touches.length === 1 && zoom > 1) {
      dragStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      startOffsetRef.current = offset;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchDistanceRef.current) {
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = distance / pinchDistanceRef.current;
      setZoomSafe(pinchStartZoomRef.current * ratio);
      return;
    }
    if (event.touches.length === 1 && isDragging && dragStartRef.current) {
      const dx = event.touches[0].clientX - dragStartRef.current.x;
      const dy = event.touches[0].clientY - dragStartRef.current.y;
      setOffset(clampOffset({ x: startOffsetRef.current.x + dx, y: startOffsetRef.current.y + dy }));
    }
  };

  const handleTouchEnd = () => {
    if (pinchDistanceRef.current && zoom <= 1) setOffset({ x: 0, y: 0 });
    pinchDistanceRef.current = null;
    setIsDragging(false);
    dragStartRef.current = null;
  };

  if (!currentImage) return null;

  const content = (
    <div
      className="fixed inset-0 z-[180] bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setZoomSafe(zoom - 0.25);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Alejar"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setZoomSafe(zoom + 0.25);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Acercar"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            resetView();
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Restablecer zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Cerrar visor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            disabled={index === 0}
            className="absolute left-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            disabled={index === images.length - 1}
            className="absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden p-8 md:p-12"
        onClick={(event) => event.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImage.url}
          alt={`Imagen ${index + 1}`}
          className={`max-h-full max-w-full select-none object-contain ${zoom > 1 ? "cursor-grab" : "cursor-zoom-in"} ${isDragging ? "cursor-grabbing" : ""}`}
          style={{
            objectPosition: currentImage.objectPosition ?? "center center",
            transform: imageTransform,
            transformOrigin: currentImage.objectPosition ?? "center center",
            transition: isDragging ? "none" : "transform 120ms ease-out",
          }}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
