import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { listSavedSearches } from "@/lib/api";
import type { SavedSearch } from "@/lib/types";
import { Bookmark, Search, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SavedSearches = () => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listSavedSearches().then(s => { setSearches(s); setLoading(false); });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" /> Saved Searches
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No saved searches yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {searches.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                <Search className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">"{s.query}"</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(s.createdAt).toLocaleDateString()}</span>
                    <span>{s.resultCount} results</span>
                    {s.filters.objectType && s.filters.objectType !== "all" && <span className="capitalize">{s.filters.objectType}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/dashboard?q=${encodeURIComponent(s.query)}`)}>
                  Run Again
                </Button>
                <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedSearches;
