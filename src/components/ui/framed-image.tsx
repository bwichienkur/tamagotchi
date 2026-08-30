import { RemoteImage } from "@/components/ui/remote-image";
import {
  normalizePhotoFrame,
  photoFrameStyle,
  photoFrameTransformStyle,
  type PhotoFrame,
} from "@/lib/photo-frame";
import { cn } from "@/lib/utils";

interface FramedImageProps {
  src: string;
  alt: string;
  frame?: PhotoFrame | null;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

export function FramedImage({
  src,
  alt,
  frame,
  className,
  fill = true,
  sizes,
  priority,
}: FramedImageProps) {
  const normalized = normalizePhotoFrame(frame);

  return (
    <div className={cn(fill ? "absolute inset-0" : "relative h-full w-full", "overflow-hidden")}>
      <div className="relative h-full w-full" style={photoFrameTransformStyle(normalized)}>
        <RemoteImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          draggable={false}
          className={cn("object-cover", className)}
          style={photoFrameStyle(normalized)}
        />
      </div>
    </div>
  );
}
