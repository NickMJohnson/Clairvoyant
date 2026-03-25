import { useEffect, useState } from "react";
import type { SearchFilters } from "@/lib/types";
import type { Camera } from "@/lib/types";
import { listCameras } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FiltersPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

// Format ISO string to datetime-local input value (strips seconds + Z)
function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    listCameras().then(setCameras).catch(() => {});
  }, []);

  const hasDateRange = !!(filters.startDate || filters.endDate);

  return (
    <div className="bg-card border border-border p-4 space-y-5">
      <h3 className="section-label text-muted-foreground/60">// Filters</h3>

      {/* Object type */}
      <div className="space-y-1.5">
        <Label className="section-label text-muted-foreground/50">Object Type</Label>
        <Select
          value={filters.objectType || "all"}
          onValueChange={v => onChange({ ...filters, objectType: v as SearchFilters["objectType"] })}
        >
          <SelectTrigger className="bg-secondary border-border text-xs font-mono rounded-none h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Camera */}
      <div className="space-y-1.5">
        <Label className="section-label text-muted-foreground/50">Camera</Label>
        <Select
          value={filters.cameraIds?.[0] || "all"}
          onValueChange={v => onChange({ ...filters, cameraIds: v === "all" ? undefined : [v] })}
        >
          <SelectTrigger className="bg-secondary border-border text-xs font-mono rounded-none h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cameras</SelectItem>
            {cameras.map(cam => (
              <SelectItem key={cam.id} value={cam.id}>{cam.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time range */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="section-label text-muted-foreground/50">Time Range</Label>
          {hasDateRange && (
            <button
              onClick={() => onChange({ ...filters, startDate: undefined, endDate: undefined })}
              className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50 hover:text-primary flex items-center gap-0.5 transition-colors"
            >
              <X className="w-2.5 h-2.5" /> Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">From</div>
          <input
            type="datetime-local"
            value={toLocalInput(filters.startDate)}
            onChange={e => onChange({
              ...filters,
              startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })}
            className="w-full h-8 bg-secondary border border-border text-foreground text-[11px] font-mono px-2 focus:outline-none focus:border-primary transition-colors"
            style={{ colorScheme: "dark" }}
          />
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">To</div>
          <input
            type="datetime-local"
            value={toLocalInput(filters.endDate)}
            onChange={e => onChange({
              ...filters,
              endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })}
            className="w-full h-8 bg-secondary border border-border text-foreground text-[11px] font-mono px-2 focus:outline-none focus:border-primary transition-colors"
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>

      {/* Confidence */}
      <div className="space-y-1.5">
        <Label className="section-label text-muted-foreground/50">
          Min Confidence —{" "}
          <span className="font-mono text-foreground">{Math.round((filters.confidenceMin || 0) * 100)}%</span>
        </Label>
        <Slider
          value={[filters.confidenceMin || 0]}
          onValueChange={([v]) => onChange({ ...filters, confidenceMin: v })}
          min={0}
          max={1}
          step={0.05}
          className="py-2"
        />
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <Label className="section-label text-muted-foreground/50">Sort By</Label>
        <Select
          value={`${filters.sortBy || "time"}-${filters.sortOrder || "desc"}`}
          onValueChange={v => {
            const [sortBy, sortOrder] = v.split("-");
            onChange({ ...filters, sortBy: sortBy as "time" | "confidence", sortOrder: sortOrder as "asc" | "desc" });
          }}
        >
          <SelectTrigger className="bg-secondary border-border text-xs font-mono rounded-none h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time-desc">Newest First</SelectItem>
            <SelectItem value="time-asc">Oldest First</SelectItem>
            <SelectItem value="confidence-desc">Highest Confidence</SelectItem>
            <SelectItem value="confidence-asc">Lowest Confidence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset all */}
      {(hasDateRange || filters.objectType !== "all" || (filters.confidenceMin ?? 0) > 0 || filters.cameraIds?.length) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-none border border-border h-7"
          onClick={() => onChange({ objectType: "all", confidenceMin: 0, sortBy: "time", sortOrder: "desc" })}
        >
          Reset All Filters
        </Button>
      )}
    </div>
  );
}
