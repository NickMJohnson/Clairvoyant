import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, User, Bell, Search, Shield, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUser(): { name: string; email: string } {
  try {
    return JSON.parse(localStorage.getItem("vs_user") ?? "{}");
  } catch {
    return { name: "", email: "" };
  }
}

interface Prefs {
  defaultSort: string;
  defaultConfidence: string;
  defaultLimit: string;
  alertChannel: string;
  emailNotifications: boolean;
}

function getPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem("vs_prefs") ?? "{}");
  } catch {
    return {} as Prefs;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="section-label text-muted-foreground/70 tracking-widest">// {label}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="w-56">{children}</div>
    </div>
  );
}

function ReadOnlyField({ value }: { value: string }) {
  return (
    <div className="px-3 py-1.5 bg-secondary border border-border text-xs text-foreground font-mono" style={{ borderRadius: 2 }}>
      {value || <span className="text-muted-foreground">—</span>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const Settings = () => {
  const user = getUser();
  const saved = getPrefs();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<Prefs>({
    defaultSort: saved.defaultSort ?? "time",
    defaultConfidence: saved.defaultConfidence ?? "0",
    defaultLimit: saved.defaultLimit ?? "200",
    alertChannel: saved.alertChannel ?? "email",
    emailNotifications: saved.emailNotifications ?? true,
  });

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const setPref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs(p => ({ ...p, [key]: value }));
  };

  const savePrefs = () => {
    localStorage.setItem("vs_prefs", JSON.stringify(prefs));
    toast({ title: "Preferences saved" });
  };

  const handleSignOut = () => {
    localStorage.removeItem("vs_token");
    localStorage.removeItem("vs_user");
    navigate("/login");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-10">

        {/* Page heading */}
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={User} label="Profile" />
          <div className="bg-card border border-border p-5" style={{ borderRadius: 2 }}>
            <Row label="Name">
              <ReadOnlyField value={user.name} />
            </Row>
            <Row label="Email">
              <ReadOnlyField value={user.email} />
            </Row>
            <Row label="Role">
              <ReadOnlyField value="Analyst" />
            </Row>
            <div className="pt-3">
              <p className="text-[10px] text-muted-foreground font-mono">
                Profile changes require an administrator. Contact your org admin to update account details.
              </p>
            </div>
          </div>
        </section>

        {/* ── Search Defaults ──────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Search} label="Search Defaults" />
          <div className="bg-card border border-border p-5 space-y-1" style={{ borderRadius: 2 }}>
            <Row label="Default Sort">
              <Select value={prefs.defaultSort} onValueChange={v => setPref("defaultSort", v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary border-border" style={{ borderRadius: 2 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Most Recent</SelectItem>
                  <SelectItem value="confidence">Highest Confidence</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Min Confidence">
              <Select value={prefs.defaultConfidence} onValueChange={v => setPref("defaultConfidence", v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary border-border" style={{ borderRadius: 2 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any (0%+)</SelectItem>
                  <SelectItem value="0.5">Medium (50%+)</SelectItem>
                  <SelectItem value="0.75">High (75%+)</SelectItem>
                  <SelectItem value="0.9">Very High (90%+)</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Result Limit">
              <Select value={prefs.defaultLimit} onValueChange={v => setPref("defaultLimit", v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary border-border" style={{ borderRadius: 2 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 clips</SelectItem>
                  <SelectItem value="200">200 clips (default)</SelectItem>
                  <SelectItem value="500">500 clips (max)</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Bell} label="Notifications" />
          <div className="bg-card border border-border p-5 space-y-1" style={{ borderRadius: 2 }}>
            <Row label="Default Channel">
              <Select value={prefs.alertChannel} onValueChange={v => setPref("alertChannel", v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary border-border" style={{ borderRadius: 2 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Email Notifications">
              <button
                onClick={() => setPref("emailNotifications", !prefs.emailNotifications)}
                className={cn(
                  "w-10 h-5 relative transition-colors duration-200 cursor-pointer",
                  prefs.emailNotifications ? "bg-primary" : "bg-secondary border border-border"
                )}
                style={{ borderRadius: 2 }}
                aria-checked={prefs.emailNotifications}
                role="switch"
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-primary-foreground transition-transform duration-200",
                    prefs.emailNotifications ? "translate-x-5" : "translate-x-0.5",
                    !prefs.emailNotifications && "bg-muted-foreground"
                  )}
                  style={{ borderRadius: 1 }}
                />
              </button>
            </Row>
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={savePrefs}
            className="bg-primary text-primary-foreground hover:bg-primary/85 font-mono text-xs tracking-wider shadow-glow"
            style={{ borderRadius: 2 }}
          >
            SAVE PREFERENCES
          </Button>
        </div>

        {/* ── Security / Danger Zone ───────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Shield} label="Security" />
          <div className="bg-card border border-border p-5 space-y-3" style={{ borderRadius: 2 }}>

            {/* Change password */}
            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full flex items-center justify-between px-3 py-2.5 border border-border hover:border-primary/40 hover:bg-secondary transition-colors group cursor-pointer"
              style={{ borderRadius: 2 }}
            >
              <span className="font-mono text-xs text-foreground tracking-wider uppercase">Change Password</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {/* Sign out */}
            <div className="pt-2 border-t border-border">
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase mb-3">Danger Zone</p>
              {!showSignOutConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive font-mono text-xs tracking-wider"
                  style={{ borderRadius: 2 }}
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  SIGN OUT
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">Are you sure?</span>
                  <Button
                    size="sm"
                    onClick={handleSignOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/85 font-mono text-xs tracking-wider"
                    style={{ borderRadius: 2 }}
                  >
                    YES, SIGN OUT
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSignOutConfirm(false)}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* System info */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground/50 tracking-widest uppercase">
            Clairvoyant Intel Platform · v2.1
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50 tracking-widest uppercase">
            API: localhost:8000
          </span>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Settings;
