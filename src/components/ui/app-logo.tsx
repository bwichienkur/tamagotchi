import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function AppLogo({ size = "sm", className }: AppLogoProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        sizes[size],
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 rounded-[45%_45%_48%_48%] bg-gradient-to-br from-tama-cyan via-tama-mint to-tama-pink shadow-md",
          size === "lg" && "shadow-lg"
        )}
      />
      <div className="absolute inset-[18%] rounded-full bg-white/25 blur-[1px]" />
      <div className="absolute left-[28%] top-[22%] h-[18%] w-[22%] rotate-[-25deg] rounded-full bg-white/50" />
      <span
        className={cn(
          "relative z-10 font-display font-extrabold text-white drop-shadow-sm",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-3xl"
        )}
      >
        t
      </span>
    </div>
  );
}
