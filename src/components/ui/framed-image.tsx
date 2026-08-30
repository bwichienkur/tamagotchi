import { RemoteImage } from "@/components/ui/remote-image";
import { photoFrameStyle, type PhotoFrame } from "@/lib/photo-frame";
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
  return (
    <RemoteImage
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      style={photoFrameStyle(frame)}
    />
  );
}
