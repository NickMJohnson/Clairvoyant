import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [focused, setFocused] = useState(false);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
      {/* Command-terminal search bar */}
      <div className="flex-1 flex items-center max-w-2xl">
        {/* Prefix tab */}
        <div
          className="flex items-center gap-1.5 px-3 h-9 border border-r-0 border-border bg-secondary text-primary text-[10px] tracking-widest uppercase shrink-0 select-none transition-colors"
          style={{ borderColor: focused ? "hsl(var(--primary) / 0.6)" : undefined }}
        >
          <Search className="w-3 h-3 opacity-70" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Query</span>
        </div>

        {/* Input */}
        <div className="relative flex-1">
          <Input
            id="global-search"
            placeholder='"man with red backpack near entrance"'
            className="h-9 rounded-none border-border bg-secondary text-foreground placeholder:text-muted-foreground/45 focus-visible:ring-0 focus-visible:border-primary text-xs transition-colors font-mono pr-14"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 border border-border pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Execute button */}
        <Button
          onClick={handleSearch}
          size="sm"
          className="h-9 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] tracking-widest uppercase px-5 border-0 font-mono shadow-none"
        >
          Execute
        </Button>
      </div>

      {/* Status indicators */}
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-success animate-pulse" />
          Live
        </div>
        <div className="px-2 py-1 border border-warning/25 bg-warning/5 text-warning text-[10px] uppercase tracking-widest">
          Demo
        </div>
      </div>
    </header>
  );
}
