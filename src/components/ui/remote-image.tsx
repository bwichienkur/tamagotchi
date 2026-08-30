import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

export function RemoteImage({
  src,
  alt,
  className,
  style,
  fill,
  sizes,
  priority,
}: RemoteImageProps) {
  const resolvedSrc = src || "/placeholder-device.svg";
  const needsUnoptimized =
    resolvedSrc.startsWith("/api/uploads/") ||
    resolvedSrc.startsWith("/uploads/") ||
    (resolvedSrc.startsWith("http") &&
      !resolvedSrc.includes("blob.vercel-storage.com") &&
      !resolvedSrc.includes("squarespace-cdn.com"));

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={cn(fill && "object-cover", className)}
      style={style}
      unoptimized={needsUnoptimized}
    />
  );
}
