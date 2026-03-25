import { useEffect, useState } from "react";
import type { SearchFilters } from "@/lib/types";
import type { Camera } from "@/lib/types";
import { listCameras } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FiltersPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    listCameras({ hasSegments: true }).then(setCameras).catch(() => {});
  }, []);

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
      {(filters.objectType !== "all" || (filters.confidenceMin ?? 0) > 0 || filters.cameraIds?.length) && (
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
