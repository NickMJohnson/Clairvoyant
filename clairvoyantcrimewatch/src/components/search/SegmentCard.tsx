import type { SegmentResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Camera, Clock, User, Car } from "lucide-react";

interface SegmentCardProps {
  segment: SegmentResult;
  onClick: () => void;
}

export function SegmentCard({ segment, onClick }: SegmentCardProps) {
  const conf = segment.confidence;
  const isPerson = segment.objects.some(o => o.type === "person");
  const time = new Date(segment.startTime);

  const accentClass =
    conf >= 0.85 ? "accent-bar-high" :
    conf >= 0.70 ? "accent-bar-mid" :
    "accent-bar-low";

  const confColor =
    conf >= 0.85 ? "text-confidence-high" :
    conf >= 0.70 ? "text-confidence-medium" :
    "text-confidence-low";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative bg-card border border-border overflow-hidden text-left transition-all duration-150",
        "hover:border-primary/45 focus:outline-none focus:ring-1 focus:ring-primary/40",
        accentClass
      )}
    >
      {/* Case file header strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <span className="section-label text-muted-foreground/60">File</span>
          <span className="text-[9px] font-mono text-muted-foreground tracking-widest">
            #{segment.id.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
            {isPerson ? "PSN" : "VEH"}
          </span>
          <span className={cn("text-[10px] font-mono font-medium tabular-nums", confColor)}>
            {Math.round(conf * 100)}%
          </span>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="aspect-video bg-secondary relative overflow-hidden">
        {segment.thumbnailUrl ? (
          <img
            src={`http://localhost:8000${segment.thumbnailUrl}`}
            alt="Segment thumbnail"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isPerson
              ? <User className="w-10 h-10 text-muted-foreground/15" />
              : <Car className="w-10 h-10 text-muted-foreground/15" />}
          </div>
        )}

        {/* Scan line animation on hover */}
        <div className="absolute inset-x-0 h-px bg-primary/50 opacity-0 group-hover:opacity-100 animate-scan-down pointer-events-none" />

        {/* Corner crosshair overlays */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M2 8 L2 2 L8 2" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M98 8 L98 2 L92 2" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M2 92 L2 98 L8 98" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M98 92 L98 98 L92 98" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" opacity="0.7" />
        </svg>

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Metadata */}
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary/75 uppercase tracking-wider">
          <Camera className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{segment.cameraName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{time.toLocaleDateString()} · {time.toLocaleTimeString()}</span>
        </div>
        {segment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {segment.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider bg-secondary text-muted-foreground/70 border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
