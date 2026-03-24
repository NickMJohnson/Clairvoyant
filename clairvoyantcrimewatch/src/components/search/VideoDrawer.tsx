import type { SegmentResult } from "@/lib/types";
import { X, Download, Bell, Search, Eye, User, Car, Camera, Clock, Tag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAlert } from "@/lib/api";
import { toast } from "sonner";

// WILDTRACK original frame dimensions
const ORIG_W = 1920;
const ORIG_H = 1080;

interface VideoDrawerProps {
  segment: SegmentResult | null;
  onClose: () => void;
  searchQuery?: string;
}

export function VideoDrawer({ segment, onClose, searchQuery = "" }: VideoDrawerProps) {
  const navigate = useNavigate();
  const [showBboxes, setShowBboxes] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [alertQuery, setAlertQuery] = useState("");
  const [alertTimeWindow, setAlertTimeWindow] = useState("24/7");
  const [alertChannel, setAlertChannel] = useState("email");
  const [alertSaving, setAlertSaving] = useState(false);

  const openAlertDialog = () => {
    setAlertName(searchQuery ? `Alert: ${searchQuery}` : `Alert: ${segment?.cameraName}`);
    setAlertQuery(searchQuery || segment?.tags.join(", ") || "");
    setAlertOpen(true);
  };

  const saveAlert = async () => {
    if (!alertName || !alertQuery) return;
    setAlertSaving(true);
    try {
      await createAlert({
        name: alertName,
        query: alertQuery,
        cameras: segment ? [segment.cameraId] : [],
        timeWindow: alertTimeWindow,
        notificationChannel: alertChannel,
      });
      toast.success("Alert created", { description: `"${alertName}" will notify you when triggered.` });
      setAlertOpen(false);
    } catch {
      toast.error("Failed to create alert");
    } finally {
      setAlertSaving(false);
    }
  };

  if (!segment) return null;

  const isPerson = segment.objects.some(o => o.type === "person");
  const startTime = new Date(segment.startTime);
  const confidenceColor = segment.confidence >= 0.85
    ? "text-confidence-high"
    : segment.confidence >= 0.7 ? "text-confidence-medium" : "text-confidence-low";

  const entityId = segment.entityCandidates?.[0]?.entityId;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-elevated z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Segment Detail</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Video player */}
        <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
          {segment.videoUrl ? (
            <video
              key={segment.id}
              src={`http://localhost:8000${segment.videoUrl}`}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : segment.thumbnailUrl ? (
            <img
              src={`http://localhost:8000${segment.thumbnailUrl}`}
              alt="Segment preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center space-y-2">
              {isPerson ? <User className="w-16 h-16 text-muted-foreground/20 mx-auto" /> : <Car className="w-16 h-16 text-muted-foreground/20 mx-auto" />}
              <p className="text-xs text-muted-foreground">No preview available</p>
            </div>
          )}

          {/* Bounding box overlay */}
          {showBboxes && segment.objects.length > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${ORIG_W} ${ORIG_H}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {(() => {
                const scores = segment.objects.map(o => o.relevanceScore ?? 0);
                const maxScore = Math.max(...scores);
                const avgScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
                // Only highlight if top score is at least 0.015 above average (meaningful gap)
                const hasScores = maxScore > 0;
                const topIsDistinct = maxScore - avgScore > 0.015;
                return segment.objects.map((obj, i) => {
                  const [x, y, w, h] = obj.bbox;
                  const score = scores[i];
                  const isTopMatch = hasScores && topIsDistinct && score === maxScore;
                  const color = obj.type === "person" ? "#3b82f6" : "#f59e0b";
                  const strokeColor = isTopMatch ? "#22c55e" : color;
                  const opacity = isTopMatch ? 1 : hasScores ? 0.35 : 0.7;
                  const label = obj.type === "person" ? "Person" : "Vehicle";
                  const scoreLabel = score > 0 ? ` ${Math.round(score * 100)}%` : "";
                  return (
                    <g key={i} opacity={opacity}>
                      <rect
                        x={x} y={y} width={w} height={h}
                        fill={isTopMatch ? "#22c55e18" : "none"}
                        stroke={strokeColor}
                        strokeWidth={isTopMatch ? 10 : 5}
                        strokeDasharray={isTopMatch ? "none" : "20,8"}
                      />
                      <rect x={x} y={y - 40} width={Math.max(160, w)} height={40} fill={strokeColor} opacity={0.9} />
                      <text x={x + 8} y={y - 12} fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace">
                        {isTopMatch ? "✓ " : ""}{label}{scoreLabel}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="text-xs">
              <Download className="w-3 h-3 mr-1" /> Save Clip
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => { onClose(); navigate(`/cameras/${segment.cameraId}?segment=${segment.id}`); }}
            >
              <ExternalLink className="w-3 h-3 mr-1" /> View in Camera
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={openAlertDialog}>
              <Bell className="w-3 h-3 mr-1" /> Create Alert
            </Button>
            {entityId && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => { onClose(); navigate(`/entities/${entityId}`); }}
              >
                <Search className="w-3 h-3 mr-1" /> Find More Like This
              </Button>
            )}
            <Button
              size="sm"
              variant={showBboxes ? "default" : "outline"}
              className="text-xs"
              onClick={() => setShowBboxes(v => !v)}
            >
              <Eye className="w-3 h-3 mr-1" /> Bounding Boxes
            </Button>
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Camera className="w-3 h-3" /> Camera</div>
                <p className="text-sm text-foreground">{segment.cameraName}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> Time</div>
                <p className="text-sm font-mono text-foreground">{startTime.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground">Confidence</div>
                <p className={cn("text-sm font-mono font-medium", confidenceColor)}>{Math.round(segment.confidence * 100)}%</p>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground">Duration</div>
                <p className="text-sm font-mono text-foreground">30s</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Tag className="w-3 h-3" /> Tags</div>
              <div className="flex flex-wrap gap-1">
                {segment.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">{tag}</span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">Detected Objects</div>
              {segment.objects.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-secondary text-sm">
                  {obj.type === "person" ? <User className="w-3.5 h-3.5 text-info" /> : <Car className="w-3.5 h-3.5 text-warning" />}
                  <span className="text-foreground capitalize">{obj.type}</span>
                  {obj.colorHints?.length ? (
                    <span className="text-muted-foreground text-xs">({obj.colorHints.join(", ")})</span>
                  ) : null}
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                    bbox: [{obj.bbox.join(",")}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="alert-name">Alert Name</Label>
              <Input id="alert-name" value={alertName} onChange={e => setAlertName(e.target.value)} placeholder="e.g. Yellow backpack alert" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-query">Query</Label>
              <Input id="alert-query" value={alertQuery} onChange={e => setAlertQuery(e.target.value)} placeholder="e.g. yellow backpack" />
            </div>
            <div className="space-y-1.5">
              <Label>Time Window</Label>
              <Select value={alertTimeWindow} onValueChange={setAlertTimeWindow}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24/7">24/7</SelectItem>
                  <SelectItem value="Business Hours">Business Hours</SelectItem>
                  <SelectItem value="After Hours">After Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notification Channel</Label>
              <Select value={alertChannel} onValueChange={setAlertChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertOpen(false)}>Cancel</Button>
            <Button onClick={saveAlert} disabled={alertSaving || !alertName || !alertQuery}>
              {alertSaving ? "Saving..." : "Create Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
