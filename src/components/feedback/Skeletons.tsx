/**
 * Premium shimmer skeleton primitives.
 *
 * All skeletons share the `skeleton-shimmer` utility (defined in
 * src/styles.css) which paints a soft gradient sweep across a muted
 * surface. Motion is disabled automatically under prefers-reduced-motion.
 */
import { cn } from "@/lib/utils";

export function SkeletonBlock({
  className,
  rounded = "md",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  const radius = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];
  return <div aria-hidden className={cn("skeleton-shimmer", radius, className)} />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Generic premium card placeholder. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn("bento-card premium-halo", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-8 w-8" rounded="lg" />
      </div>
      <SkeletonBlock className="mt-4 h-8 w-40" />
      <SkeletonText className="mt-5" lines={3} />
    </div>
  );
}

/** KPI widget placeholder — matches KpiCard geometry. */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading metric"
      className={cn("bento-card premium-halo !p-4", className)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-2.5 w-16" />
          <SkeletonBlock className="mt-2.5 h-6 w-24" />
        </div>
        <SkeletonBlock className="h-7 w-7" rounded="lg" />
      </div>
      <SkeletonBlock className="mt-4 h-9 w-full" rounded="lg" />
      <SkeletonBlock className="mt-3 h-2.5 w-20" />
    </div>
  );
}

export function KpiGridSkeleton({
  count = 7,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Toolbar / filter-bar placeholder. */
export function FiltersSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading filters"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <SkeletonBlock className="h-9 w-full max-w-[260px]" rounded="lg" />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-9 w-[124px]" rounded="lg" />
      ))}
      <SkeletonBlock className="ms-auto h-9 w-24" rounded="lg" />
    </div>
  );
}

/** Pagination bar placeholder. */
export function PaginationSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading pagination"
      className={cn("flex flex-wrap items-center gap-3", className)}
    >
      <SkeletonBlock className="h-3 w-28" />
      <div className="ms-auto flex items-center gap-2">
        <SkeletonBlock className="h-8 w-[72px]" rounded="lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-8" rounded="lg" />
        ))}
      </div>
    </div>
  );
}

/** Table body placeholder — cell widths vary for a natural rhythm. */
export function TableRowsSkeleton({
  rows = 6,
  columns = 5,
  withCheckbox = false,
}: {
  rows?: number;
  columns?: number;
  withCheckbox?: boolean;
}) {
  const widths = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-36"];
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border/60">
          {withCheckbox && (
            <td className="pl-4 py-3.5">
              <SkeletonBlock className="h-4 w-4" rounded="sm" />
            </td>
          )}
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <SkeletonBlock
                className={cn("h-3.5", widths[(r + c) % widths.length])}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Full standalone table placeholder (header + rows + pagination). */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading table"
      className={cn("rounded-2xl border border-border overflow-hidden", className)}
    >
      <div className="p-3 sm:p-4 border-b border-border">
        <FiltersSkeleton />
      </div>
      <div className="flex items-center gap-4 bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} className="h-2.5 w-20" />
        ))}
      </div>
      <table className="w-full">
        <tbody>
          <TableRowsSkeleton rows={rows} columns={columns} />
        </tbody>
      </table>
      <div className="p-3 sm:p-4 border-t border-border">
        <PaginationSkeleton />
      </div>
    </div>
  );
}
