import { cn } from "@/lib/utils";

interface ClairvoyantLogoProps {
  className?: string;
}

export function ClairvoyantLogo({ className }: ClairvoyantLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* Dashed outer ring */}
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.35" />
      {/* Middle ring */}
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      {/* Inner ring */}
      <circle cx="32" cy="32" r="10" stroke="currentColor" strokeWidth="2" />
      {/* Center fill */}
      <circle cx="32" cy="32" r="3.5" fill="currentColor" />
      {/* Crosshair lines — with gap in center */}
      <line x1="32" y1="3" x2="32" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="32" y1="44" x2="32" y2="61" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="3" y1="32" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="44" y1="32" x2="61" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      {/* Corner brackets */}
      <path d="M6 14 L6 6 L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" opacity="0.55" />
      <path d="M58 14 L58 6 L50 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" opacity="0.55" />
      <path d="M6 50 L6 58 L14 58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" opacity="0.55" />
      <path d="M58 50 L58 58 L50 58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" opacity="0.55" />
    </svg>
  );
}
