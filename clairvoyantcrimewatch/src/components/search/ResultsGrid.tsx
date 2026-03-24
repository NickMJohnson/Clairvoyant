import type { SegmentResult } from "@/lib/types";
import { SegmentCard } from "./SegmentCard";

interface ResultsGridProps {
  results: SegmentResult[];
  loading: boolean;
  onSelect: (segment: SegmentResult) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-secondary" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-4 bg-secondary rounded w-12" />
          <div className="h-4 bg-secondary rounded w-10" />
        </div>
      </div>
    </div>
  );
}

export function ResultsGrid({ results, loading, onSelect }: ResultsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No matches found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try different search terms, broaden the time range, or adjust confidence filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {results.map(seg => (
        <SegmentCard key={seg.id} segment={seg} onClick={() => onSelect(seg)} />
      ))}
    </div>
  );
}
