import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getCamera, searchSegments } from "@/lib/api";
import type { Camera, SegmentResult } from "@/lib/types";
import { Video, MapPin, Search, Wifi, WifiOff, Play, Clock, Activity, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CameraPage = () => {
  const { cameraId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetSegmentId = searchParams.get("segment");

  const [camera, setCamera] = useState<Camera | null>(null);
  const [segments, setSegments] = useState<SegmentResult[]>([]);
  const [selected, setSelected] = useState<SegmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for each segment card so we can scroll to a specific one
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!cameraId) return;
    setLoading(true);
    Promise.all([
      getCamera(cameraId),
      searchSegments({ cameraIds: [cameraId], sortBy: "time", sortOrder: "asc", limit: 500 }),
    ]).then(([cam, segs]) => {
      setCamera(cam || null);
      setSegments(segs);
      // If a target segment was passed in the URL, select it; otherwise pick the latest
      const target = targetSegmentId ? segs.find(s => s.id === targetSegmentId) : null;
      setSelected(target ?? segs[segs.length - 1] ?? null);
    }).finally(() => setLoading(false));
  }, [cameraId, targetSegmentId]);

  // Live simulation: auto-advance through segments newest → oldest → loop
  useEffect(() => {
    if (liveRef.current) clearInterval(liveRef.current);
    if (!isLive || segments.length === 0) return;
    liveRef.current = setInterval(() => {
      setSelected(prev => {
        const idx = segments.findIndex(s => s.id === prev?.id);
        // Walk backwards (newest first); wrap to end when hitting the start
        const next = idx <= 0 ? segments.length - 1 : idx - 1;
        return segments[next];
      });
    }, 4000);
    return () => { if (liveRef.current) clearInterval(liveRef.current); };
  }, [isLive, segments]);

  // Scroll to the target segment once cards are rendered
  useEffect(() => {
    if (!selected) return;
    const ref = cardRefs.current[selected.id];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selected, segments]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-secondary rounded w-48" />
          <div className="aspect-video bg-secondary rounded-lg max-w-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!camera) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Camera not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex gap-4 h-[calc(100vh-5rem)]">

        {/* Left: video player + info */}
        <div className="flex flex-col gap-4 flex-1 min-w-0 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-start justify-between shrink-0">
            <div>
              <h1
                className="text-lg tracking-[0.06em] uppercase text-foreground flex items-center gap-2"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                <Video className="w-4 h-4 text-primary" />
                {camera.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{camera.locationLabel}</span>
                <span className={cn(
                  "flex items-center gap-1 px-2 py-0.5 border text-[10px] uppercase tracking-wider",
                  camera.status === "online" ? "border-success/30 text-success bg-success/5"
                    : camera.status === "offline" ? "border-destructive/30 text-destructive bg-destructive/5"
                    : "border-warning/30 text-warning bg-warning/5"
                )}>
                  {camera.status === "online" ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {camera.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Live toggle */}
              <Button
                size="sm"
                variant={isLive ? "default" : "outline"}
                onClick={() => setIsLive(v => !v)}
                className={cn(
                  "h-8 rounded-none text-[10px] font-mono uppercase tracking-widest px-3 gap-1.5",
                  isLive && "bg-destructive hover:bg-destructive/90 border-destructive text-white"
                )}
              >
                <Radio className={cn("w-3 h-3", isLive && "animate-pulse")} />
                {isLive ? "Live" : "Simulate Live"}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/dashboard?q=&cameraId=${camera.id}`)}
                className="h-8 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-mono uppercase tracking-widest px-3"
              >
                <Search className="w-3 h-3 mr-1" /> Search
              </Button>
            </div>
          </div>

          {/* Video player */}
          <div className="aspect-video bg-black border border-border rounded-lg relative overflow-hidden shrink-0">
            {selected?.videoUrl ? (
              <video
                key={selected.id}
                src={`http://localhost:8000${selected.videoUrl}`}
                className="w-full h-full object-contain"
                controls
                autoPlay
                muted
              />
            ) : selected?.thumbnailUrl ? (
              <img
                src={`http://localhost:8000${selected.thumbnailUrl}`}
                alt="Segment preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-16 h-16 text-muted-foreground/20" />
              </div>
            )}
            {selected && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/70 text-white text-[10px] font-mono uppercase tracking-wider">
                  <span className={cn("w-1.5 h-1.5", isLive ? "bg-destructive animate-pulse" : camera.status === "online" ? "bg-success animate-pulse" : "bg-muted")} />
                  {isLive ? "Simulating Live" : camera.status === "online" ? "Live Feed" : camera.status}
                </div>
                <div className="absolute bottom-3 left-3 font-mono text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                  {new Date(selected.startTime).toLocaleString()}
                </div>
                <div className="absolute bottom-3 right-3 font-mono text-[10px] text-white/60 bg-black/50 px-2 py-0.5 rounded">
                  {selected.tags.join(" · ")}
                </div>
              </>
            )}
          </div>

          {/* Selected segment metadata */}
          {selected && (
            <div className="bg-card border border-border rounded-lg p-4 shrink-0 text-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{new Date(selected.startTime).toLocaleString()} → {new Date(selected.endTime).toLocaleTimeString()}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-secondary font-mono">{Math.round(selected.confidence * 100)}% conf</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {segments.length > 0 && (() => {
            const times = segments.map(s => new Date(s.startTime).getTime());
            const minT = Math.min(...times);
            const maxT = Math.max(...times);
            const range = maxT - minT || 1;
            return (
              <div className="bg-card border border-border rounded-lg p-4 shrink-0">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Activity Timeline
                </h3>
                <div
                  className="h-12 bg-secondary rounded relative cursor-pointer"
                  onClick={e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const targetT = minT + pct * range;
                    const closest = segments.reduce((best, s) =>
                      Math.abs(new Date(s.startTime).getTime() - targetT) <
                      Math.abs(new Date(best.startTime).getTime() - targetT) ? s : best
                    );
                    setSelected(closest);
                  }}
                >
                  {segments.map(seg => {
                    const pct = ((new Date(seg.startTime).getTime() - minT) / range) * 100;
                    const isSelected = selected?.id === seg.id;
                    return (
                      <div
                        key={seg.id}
                        className={cn(
                          "absolute top-1 w-1 h-10 rounded-full transition-colors",
                          isSelected ? "bg-primary w-1.5" : "bg-primary/40 hover:bg-primary/70"
                        )}
                        style={{ left: `${pct}%` }}
                        title={new Date(seg.startTime).toLocaleTimeString()}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
                  <span>{new Date(minT).toLocaleTimeString()}</span>
                  <span>{new Date((minT + maxT) / 2).toLocaleTimeString()}</span>
                  <span>{new Date(maxT).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })()}

          {/* Recent events list */}
          <div className="shrink-0 pb-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Events
            </h3>
            <div className="space-y-2">
              {segments.slice().reverse().slice(0, 8).map(evt => (
                <button
                  key={evt.id}
                  onClick={() => setSelected(evt)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 bg-card border rounded-lg transition-colors text-left",
                    selected?.id === evt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="w-16 h-10 rounded bg-secondary overflow-hidden shrink-0">
                    {evt.thumbnailUrl
                      ? <img src={`http://localhost:8000${evt.thumbnailUrl}`} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">{evt.objects[0]?.type === "person" ? "👤" : "🚗"}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{evt.tags.join(", ")}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{new Date(evt.startTime).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{Math.round(evt.confidence * 100)}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: scrollable clip feed */}
        <div className="w-72 shrink-0 flex flex-col border-l border-border">
          <div className="p-3 border-b border-border shrink-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              All Footage · {segments.length} clips
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {segments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No footage for this camera.</p>
            )}
            {segments.map(seg => {
              const isSelected = selected?.id === seg.id;
              const isTarget = seg.id === targetSegmentId;
              return (
                <button
                  key={seg.id}
                  ref={el => { cardRefs.current[seg.id] = el; }}
                  onClick={() => setSelected(seg)}
                  className={cn(
                    "w-full flex gap-2 p-2 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : isTarget
                      ? "border-warning bg-warning/5"
                      : "border-border hover:border-primary/30 hover:bg-secondary/50"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-12 rounded bg-secondary overflow-hidden shrink-0 relative">
                    {seg.thumbnailUrl ? (
                      <img src={`http://localhost:8000${seg.thumbnailUrl}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <Video className="w-4 h-4" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary fill-primary" />
                      </div>
                    )}
                    {isTarget && !isSelected && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-warning" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {new Date(seg.startTime).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-0.5">
                      {seg.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{Math.round(seg.confidence * 100)}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CameraPage;
