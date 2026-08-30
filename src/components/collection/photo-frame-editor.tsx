"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FramedImage } from "@/components/ui/framed-image";
import {
  DEFAULT_PHOTO_FRAME,
  normalizePhotoFrame,
  type PhotoFrame,
} from "@/lib/photo-frame";
import { cn } from "@/lib/utils";

interface PhotoFrameEditorProps {
  src: string;
  alt: string;
  frame: PhotoFrame;
  onChange: (frame: PhotoFrame) => void;
  className?: string;
}

export function PhotoFrameEditor({
  src,
  alt,
  frame,
  onChange,
  className,
}: PhotoFrameEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    frameX: number;
    frameY: number;
    frameZoom: number;
    pointerId: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const normalized = normalizePhotoFrame(frame);

  const updateFrame = useCallback(
    (partial: Partial<PhotoFrame>) => {
      onChange(normalizePhotoFrame({ ...normalized, ...partial }));
    },
    [normalized, onChange]
  );

  const applyDragDelta = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((clientX - dragRef.current.startX) / rect.width) * 100;
      const deltaY = ((clientY - dragRef.current.startY) / rect.height) * 100;
      updateFrame({
        x: dragRef.current.frameX - deltaX,
        y: dragRef.current.frameY - deltaY,
        zoom: dragRef.current.frameZoom,
      });
    },
    [updateFrame]
  );

  const endDrag = useCallback((pointerId?: number) => {
    if (pointerId !== undefined && containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(pointerId);
      } catch {
        // Pointer may already be released.
      }
    }
    dragRef.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const preventTouchScroll = (event: TouchEvent) => {
      if (dragRef.current) event.preventDefault();
    };

    document.addEventListener("touchmove", preventTouchScroll, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      document.removeEventListener("touchmove", preventTouchScroll);
    };
  }, [dragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      frameX: normalized.x,
      frameY: normalized.y,
      frameZoom: normalized.zoom,
      pointerId: event.pointerId,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return;
    event.preventDefault();
    applyDragDelta(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return;
    endDrag(event.pointerId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto aspect-square w-full max-w-xs touch-none select-none overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner overscroll-none",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <FramedImage src={src} alt={alt} frame={normalized} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2 text-xs text-white">
          Drag to reposition, then click Save Changes below
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="photo-zoom" className="text-sm text-stone-600">
            Zoom
          </Label>
          <span className="text-xs text-stone-500">{normalized.zoom.toFixed(1)}x</span>
        </div>
        <input
          id="photo-zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={normalized.zoom}
          onChange={(e) => updateFrame({ zoom: Number(e.target.value) })}
          className="w-full accent-tama-cyan"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="photo-pan-x" className="text-sm text-stone-600">
              Horizontal
            </Label>
            <span className="text-xs text-stone-500">{Math.round(normalized.x)}%</span>
          </div>
          <input
            id="photo-pan-x"
            type="range"
            min={0}
            max={100}
            step={1}
            value={normalized.x}
            onChange={(e) => updateFrame({ x: Number(e.target.value) })}
            className="w-full accent-tama-cyan"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="photo-pan-y" className="text-sm text-stone-600">
              Vertical
            </Label>
            <span className="text-xs text-stone-500">{Math.round(normalized.y)}%</span>
          </div>
          <input
            id="photo-pan-y"
            type="range"
            min={0}
            max={100}
            step={1}
            value={normalized.y}
            onChange={(e) => updateFrame({ y: Number(e.target.value) })}
            className="w-full accent-tama-cyan"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...DEFAULT_PHOTO_FRAME })}
        className="w-full"
      >
        <RotateCcw className="h-4 w-4" />
        Reset placement
      </Button>
    </div>
  );
}
