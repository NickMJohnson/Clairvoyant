import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getEntity, getEntitySegments } from "@/lib/api";
import { VideoDrawer } from "@/components/search/VideoDrawer";
import type { Entity, SegmentResult } from "@/lib/types";
import { User, Car, Camera, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const EntityPage = () => {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [segments, setSegments] = useState<SegmentResult[]>([]);
  const [selected, setSelected] = useState<SegmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    Promise.all([
      getEntity(entityId),
      getEntitySegments(entityId),
    ]).then(([e, segs]) => {
      setEntity(e || null);
      setSegments(segs);
    }).finally(() => setLoading(false));
  }, [entityId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4 max-w-5xl">
          <div className="h-36 bg-secondary border border-border" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-secondary border border-border" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!entity) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Entity not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const isPerson = entity.type === "person";
  const cameras = [...new Set(segments.map(s => s.cameraName))];
  const firstSeen = segments.length > 0 ? new Date(segments[0].startTime) : null;
  const lastSeen = segments.length > 0 ? new Date(segments[segments.length - 1].startTime) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Profile card */}
        <div className="bg-card border border-border flex gap-6 p-5">

          {/* Photo with targeting brackets */}
          <div className="w-36 h-36 shrink-0 relative bg-secondary border border-border overflow-hidden">
            {entity.primaryThumbnailUrl ? (
              <img
                src={`http://localhost:8000${entity.primaryThumbnailUrl}`}
                alt="Subject"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isPerson
                  ? <User className="w-14 h-14 text-muted-foreground/15" />
                  : <Car className="w-14 h-14 text-muted-foreground/15" />}
              </div>
            )}
            {/* Targeting corner brackets */}
            <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary/80" />
            <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-primary/80" />
            <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-primary/80" />
            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-primary/80" />
          </div>

          {/* Identity info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="section-label text-muted-foreground/50 mb-1">Subject ID</div>
                <h1
                  className="text-2xl tracking-[0.1em] uppercase text-foreground leading-none"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                >
                  {entity.id.slice(0, 8).toUpperCase()}
                </h1>
              </div>
              <span className={cn(
                "shrink-0 text-[9px] font-mono uppercase tracking-widest px-2 py-1 border mt-1",
                isPerson
                  ? "border-info/40 text-info bg-info/5"
                  : "border-warning/40 text-warning bg-warning/5"
              )}>
                {entity.type}
              </span>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-3">
              <div>
                <div className="section-label text-muted-foreground/50">Sightings</div>
                <div className="text-xl font-mono text-primary mt-0.5">{segments.length}</div>
              </div>
              <div>
                <div className="section-label text-muted-foreground/50">Cameras</div>
                <div className="text-xl font-mono text-foreground mt-0.5">{cameras.length}</div>
              </div>
              <div>
                <div className="section-label text-muted-foreground/50">Last Seen</div>
                <div className="text-[10px] font-mono text-foreground mt-1 leading-tight">
                  {lastSeen ? lastSeen.toLocaleString() : "—"}
                </div>
              </div>
            </div>

            {/* Attributes */}
            {Object.keys(entity.attributes).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(entity.attributes).map(([key, val]) => (
                  <span
                    key={key}
                    className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 bg-secondary border border-border text-muted-foreground"
                  >
                    {key}: {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Camera appearances strip */}
        {cameras.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-label text-muted-foreground/50 mr-1">Seen on</span>
            {cameras.map(cam => (
              <span
                key={cam}
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider px-2 py-1 border border-border bg-secondary text-muted-foreground"
              >
                <Camera className="w-2.5 h-2.5" />
                {cam}
              </span>
            ))}
            {firstSeen && lastSeen && firstSeen.toDateString() !== lastSeen.toDateString() && (
              <span className="text-[9px] font-mono text-muted-foreground/50 ml-2">
                {firstSeen.toLocaleDateString()} — {lastSeen.toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Clip grid */}
        <div>
          <div className="mb-3">
            <span className="section-label text-muted-foreground/60">// Footage · {segments.length} clips</span>
          </div>

          {segments.length === 0 ? (
            <div className="text-center py-16 border border-border bg-card">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">No footage indexed for this subject</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {segments.map(seg => {
                const time = new Date(seg.startTime);
                const isSelected = selected?.id === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setSelected(seg)}
                    className={cn(
                      "group bg-card border text-left transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-primary/40",
                      isSelected ? "border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-secondary relative overflow-hidden">
                      {seg.thumbnailUrl ? (
                        <img
                          src={`http://localhost:8000${seg.thumbnailUrl}`}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground/15" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/10" />
                      )}
                      <div className="absolute inset-0 bg-black/8 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Metadata */}
                    <div className="p-2 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-primary/75 uppercase tracking-wider truncate">
                        <Camera className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{seg.cameraName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{time.toLocaleDateString()} · {time.toLocaleTimeString()}</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/cameras/${seg.cameraId}?segment=${seg.id}`);
                        }}
                        className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        View in camera
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <VideoDrawer segment={selected} onClose={() => setSelected(null)} />
    </DashboardLayout>
  );
};

export default EntityPage;
