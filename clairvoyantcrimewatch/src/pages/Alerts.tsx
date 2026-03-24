import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { listAlerts, createAlert } from "@/lib/api";
import type { Alert } from "@/lib/types";
import { Bell, Plus, Trash2, Clock, Camera, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState({ name: "", query: "", timeWindow: "24/7", notificationChannel: "email" });
  const { toast } = useToast();

  useEffect(() => {
    listAlerts().then(a => { setAlerts(a); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    const alert = await createAlert({ ...newAlert, cameras: [], active: true });
    setAlerts(prev => [...prev, alert]);
    setShowCreate(false);
    setNewAlert({ name: "", query: "", timeWindow: "24/7", notificationChannel: "email" });
    toast({ title: "Alert created", description: `"${alert.name}" is now active.` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Alerts
          </h1>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Alert
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="p-4 bg-card border border-primary/20 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-foreground">Create Alert</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={newAlert.name} onChange={e => setNewAlert(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-sm" placeholder="My Alert" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Search Query</Label>
                <Input value={newAlert.query} onChange={e => setNewAlert(p => ({ ...p, query: e.target.value }))} className="bg-secondary border-border text-sm" placeholder="person with backpack" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Time Window</Label>
                <Select value={newAlert.timeWindow} onValueChange={v => setNewAlert(p => ({ ...p, timeWindow: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24/7">24/7</SelectItem>
                    <SelectItem value="06:00-18:00">Business Hours</SelectItem>
                    <SelectItem value="22:00-06:00">After Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Notification</Label>
                <Select value={newAlert.notificationChannel} onValueChange={v => setNewAlert(p => ({ ...p, notificationChannel: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!newAlert.name || !newAlert.query} className="text-xs bg-primary text-primary-foreground">Create</Button>
            </div>
          </div>
        )}

        {/* Alert list */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alerts configured.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                <div className={cn("w-2 h-2 rounded-full", a.active ? "bg-success" : "bg-muted-foreground")} />
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span>"{a.query}"</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.timeWindow}</span>
                    <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{a.cameras.length} cameras</span>
                    <span className="capitalize">{a.notificationChannel}</span>
                  </div>
                  {a.lastTriggered && (
                    <p className="text-[10px] text-warning mt-0.5">Last triggered: {new Date(a.lastTriggered).toLocaleString()}</p>
                  )}
                </div>
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

export default Alerts;
