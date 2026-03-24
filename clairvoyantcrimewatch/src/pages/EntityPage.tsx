import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getEntity } from "@/lib/api";
import type { Entity } from "@/lib/types";
import { User, Car, Search, Camera, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const EntityPage = () => {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    getEntity(entityId).then(e => { setEntity(e || null); setLoading(false); });
  }, [entityId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48" />
          <div className="flex gap-6"><div className="w-32 h-32 bg-secondary rounded-lg" /><div className="flex-1 space-y-2"><div className="h-4 bg-secondary rounded w-32" /><div className="h-4 bg-secondary rounded w-48" /></div></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!entity) {
    return <DashboardLayout><div className="text-center py-20"><p className="text-muted-foreground">Entity not found.</p></div></DashboardLayout>;
  }

  const isPerson = entity.type === "person";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="w-28 h-28 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
            {isPerson ? <User className="w-12 h-12 text-muted-foreground/30" /> : <Car className="w-12 h-12 text-muted-foreground/30" />}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground capitalize">{entity.type} — {entity.id}</h1>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(entity.attributes).map(([key, val]) => (
                <div key={key}>
                  <span className="text-[10px] text-muted-foreground uppercase">{key}</span>
                  <p className="text-sm text-foreground">{val}</p>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate(`/dashboard?q=entity:${entity.id}`)}
            >
              <Search className="w-3.5 h-3.5 mr-1" /> Search for Similar
            </Button>
          </div>
        </div>

        {/* Sightings */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">
            Sightings ({entity.sightings.length})
          </h3>
          <div className="space-y-2">
            {entity.sightings.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                    {s.cameraName}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(s.time).toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/cameras/${s.cameraId}`)}>
                  View Camera
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Map view placeholder</p>
          <p className="text-[10px] text-muted-foreground/50">TODO: Integrate mapping library</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EntityPage;
