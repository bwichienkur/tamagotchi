import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  centered = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8",
        centered ? "text-center" : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={centered ? undefined : "min-w-0"}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-stone-500 sm:text-lg">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className={cn("flex shrink-0 flex-wrap gap-2", centered && "mt-4 justify-center")}>
          {actions}
        </div>
      )}
    </div>
  );
}

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "font-display text-xl font-bold text-stone-800 sm:text-2xl",
        className
      )}
    >
      {children}
    </h2>
  );
}
