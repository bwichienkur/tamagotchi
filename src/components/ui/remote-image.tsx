import Image from "next/image";
import { cn } from "@/lib/utils";

interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

export function RemoteImage({
  src,
  alt,
  className,
  fill,
  sizes,
  priority,
}: RemoteImageProps) {
  const resolvedSrc = src || "/placeholder-device.svg";
  const needsUnoptimized =
    resolvedSrc.startsWith("http") ||
    resolvedSrc.startsWith("/api/uploads/") ||
    resolvedSrc.startsWith("/uploads/");

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={cn(fill && "object-cover", className)}
      unoptimized={needsUnoptimized}
    />
  );
}
