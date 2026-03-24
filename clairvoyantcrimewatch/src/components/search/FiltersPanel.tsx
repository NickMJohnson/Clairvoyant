import type { SearchFilters } from "@/lib/types";
import { mockCameras } from "@/lib/mockData";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltersPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-medium text-foreground">Filters</h3>

      {/* Object type */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Object Type</Label>
        <Select
          value={filters.objectType || "all"}
          onValueChange={v => onChange({ ...filters, objectType: v as SearchFilters["objectType"] })}
        >
          <SelectTrigger className="bg-secondary border-border text-sm">
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
        <Label className="text-xs text-muted-foreground">Camera</Label>
        <Select
          value={filters.cameraIds?.[0] || "all"}
          onValueChange={v => onChange({ ...filters, cameraIds: v === "all" ? undefined : [v] })}
        >
          <SelectTrigger className="bg-secondary border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cameras</SelectItem>
            {mockCameras.map(cam => (
              <SelectItem key={cam.id} value={cam.id}>{cam.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Confidence */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Min Confidence: <span className="font-mono text-foreground">{Math.round((filters.confidenceMin || 0) * 100)}%</span>
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
        <Label className="text-xs text-muted-foreground">Sort By</Label>
        <Select
          value={filters.sortBy || "time"}
          onValueChange={v => onChange({ ...filters, sortBy: v as "time" | "confidence" })}
        >
          <SelectTrigger className="bg-secondary border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Time</SelectItem>
            <SelectItem value="confidence">Confidence</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
