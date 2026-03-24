import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResultsGrid } from "@/components/search/ResultsGrid";
import { FiltersPanel } from "@/components/search/FiltersPanel";
import { VideoDrawer } from "@/components/search/VideoDrawer";
import { searchSegments } from "@/lib/api";
import type { SegmentResult, SearchFilters } from "@/lib/types";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SegmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SegmentResult | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    objectType: "all",
    confidenceMin: 0,
    sortBy: "time",
    sortOrder: "desc",
  });

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchSegments({ ...filters, query });
      setResults(res);
    } finally {
      setLoading(false);
    }
  }, [filters, query]);

  useEffect(() => { doSearch(); }, [doSearch]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg tracking-[0.06em] uppercase text-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              {query
                ? <><span className="text-muted-foreground font-normal">Query · </span><span className="text-primary">{query}</span></>
                : "All Footage"}
            </h1>
            {!loading && (
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5 tracking-wider">
                {results.length} segment{results.length !== 1 && "s"} indexed
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-[10px] rounded-none border-border font-mono uppercase tracking-widest h-8 px-3"
          >
            {showFilters ? <X className="w-3 h-3 mr-1.5" /> : <SlidersHorizontal className="w-3 h-3 mr-1.5" />}
            Filters
          </Button>
        </div>

        {/* Content */}
        <div className="flex gap-4">
          {showFilters && (
            <div className="w-60 shrink-0">
              <FiltersPanel filters={filters} onChange={setFilters} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <ResultsGrid results={results} loading={loading} onSelect={setSelected} />
          </div>
        </div>
      </div>

      <VideoDrawer segment={selected} onClose={() => setSelected(null)} searchQuery={query} />
    </DashboardLayout>
  );
};

export default Dashboard;
