/**
 * Premium empty-state illustrations.
 *
 * Original inline SVG art built from the app's design tokens so it themes
 * automatically. No external assets, no mock data.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyIllustration = "table" | "search" | "filter" | "chart" | "inbox";

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
      </linearGradient>
      <radialGradient id={`${id}-halo`} cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Art({ variant }: { variant: EmptyIllustration }) {
  const id = `es-${variant}`;
  const stroke = "currentColor";
  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-hidden="true"
      className="h-28 w-40 text-primary-glow"
    >
      <Defs id={id} />
      <circle cx="80" cy="58" r="56" fill={`url(#${id}-halo)`} />

      {variant === "table" && (
        <g>
          <rect x="30" y="28" width="100" height="64" rx="10" fill={`url(#${id}-a)`} opacity="0.35" />
          <rect x="30" y="28" width="100" height="64" rx="10" fill="none" stroke={stroke} strokeOpacity="0.45" />
          <rect x="30" y="28" width="100" height="16" rx="10" fill={stroke} fillOpacity="0.18" />
          {[52, 66, 80].map((y) => (
            <g key={y}>
              <rect x="40" y={y} width="30" height="5" rx="2.5" fill={stroke} fillOpacity="0.32" />
              <rect x="78" y={y} width="20" height="5" rx="2.5" fill={stroke} fillOpacity="0.2" />
              <rect x="104" y={y} width="16" height="5" rx="2.5" fill={stroke} fillOpacity="0.14" />
            </g>
          ))}
        </g>
      )}

      {variant === "search" && (
        <g>
          <circle cx="72" cy="52" r="26" fill={`url(#${id}-a)`} opacity="0.4" />
          <circle cx="72" cy="52" r="26" fill="none" stroke={stroke} strokeOpacity="0.55" strokeWidth="3" />
          <line x1="91" y1="71" x2="112" y2="92" stroke={stroke} strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
          <path d="M60 50a12 12 0 0 1 12-12" fill="none" stroke={stroke} strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {variant === "filter" && (
        <g>
          <path d="M42 32h76L88 66v22l-16 8V66L42 32Z" fill={`url(#${id}-a)`} opacity="0.5" />
          <path d="M42 32h76L88 66v22l-16 8V66L42 32Z" fill="none" stroke={stroke} strokeOpacity="0.5" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="120" cy="86" r="10" fill={stroke} fillOpacity="0.16" stroke={stroke} strokeOpacity="0.45" />
          <path d="M116 86h8M120 82v8" stroke={stroke} strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {variant === "chart" && (
        <g>
          <rect x="28" y="26" width="104" height="68" rx="10" fill="none" stroke={stroke} strokeOpacity="0.4" />
          {[
            [44, 22],
            [62, 36],
            [80, 16],
            [98, 44],
            [116, 28],
          ].map(([x, h]) => (
            <rect key={x} x={x} y={84 - (h as number)} width="12" height={h as number} rx="4" fill={`url(#${id}-a)`} />
          ))}
          <path d="M44 62 62 52 80 60 98 40 116 48" fill="none" stroke={stroke} strokeOpacity="0.65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {variant === "inbox" && (
        <g>
          <path d="M34 60 48 32h64l14 28v26a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V60Z" fill={`url(#${id}-a)`} opacity="0.45" />
          <path d="M34 60 48 32h64l14 28v26a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V60Z" fill="none" stroke={stroke} strokeOpacity="0.5" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M34 60h26l6 10h28l6-10h26" fill="none" stroke={stroke} strokeOpacity="0.6" strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      )}

      <circle cx="126" cy="30" r="3" fill={stroke} fillOpacity="0.5" />
      <circle cx="36" cy="96" r="2" fill={stroke} fillOpacity="0.35" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  illustration = "table",
  action,
  className,
  compact = false,
}: {
  title: string;
  description?: string;
  illustration?: EmptyIllustration;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center enter-soft",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 blur-2xl bg-primary/10 rounded-full" />
        <Art variant={illustration} />
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
