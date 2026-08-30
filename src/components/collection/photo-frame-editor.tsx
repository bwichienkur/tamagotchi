"use client";

import { useCallback, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RemoteImage } from "@/components/ui/remote-image";
import {
  DEFAULT_PHOTO_FRAME,
  normalizePhotoFrame,
  photoFrameStyle,
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
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const normalized = normalizePhotoFrame(frame);

  const updateFrame = useCallback(
    (partial: Partial<PhotoFrame>) => {
      onChange(normalizePhotoFrame({ ...normalized, ...partial }));
    },
    [normalized, onChange]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      frameX: normalized.x,
      frameY: normalized.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((event.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - dragRef.current.startY) / rect.height) * 100;
    updateFrame({
      x: dragRef.current.frameX - deltaX,
      y: dragRef.current.frameY - deltaY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <RemoteImage
          src={src}
          alt={alt}
          fill
          className="pointer-events-none select-none"
          style={photoFrameStyle(normalized)}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2 text-xs text-white">
          Drag to reposition
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
