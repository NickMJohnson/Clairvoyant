import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown, Bell, Settings, Bookmark,
  LayoutDashboard, LogOut
} from "lucide-react";
import { ClairvoyantLogo } from "@/components/ClairvoyantLogo";
import { listCameraGroups } from "@/lib/api";
import type { CameraGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [cameraGroups, setCameraGroups] = useState<CameraGroup[]>([]);

  useEffect(() => {
    listCameraGroups().then(groups => {
      setCameraGroups(groups);
      if (groups.length > 0) setExpandedGroups([groups[0].id]);
    }).catch(() => {});
  }, []);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Saved Searches", icon: Bookmark, path: "/saved-searches" },
    { label: "Alerts", icon: Bell, path: "/alerts" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside
      className="w-60 h-screen flex flex-col border-r border-sidebar-border shrink-0 overflow-hidden"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Brand */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 flex items-center justify-center border border-primary/35 relative shrink-0 group-hover:border-primary/70 transition-colors">
            <ClairvoyantLogo className="w-6 h-6" />
            <div className="absolute inset-0 bg-primary/4" />
          </div>
          <div>
            <div
              className="text-foreground text-xs tracking-[0.16em] uppercase"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Clairvoyant
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground mt-0.5">
              Intel Platform
            </div>
          </div>
        </Link>
      </div>

      {/* Org selector */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <div className="w-4 h-4 bg-primary/20 flex items-center justify-center text-primary text-[9px] shrink-0"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
            A
          </div>
          <span className="flex-1 text-left truncate tracking-wider">ACME SECURITY</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {/* Nav section */}
        <div className="px-4 pt-3 pb-1.5">
          <span className="section-label text-muted-foreground/60">// Nav</span>
        </div>

        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 text-[11px] transition-colors relative",
              isActive(item.path)
                ? "text-primary bg-primary/8 border-l-2 border-primary"
                : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent border-l-2 border-transparent"
            )}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="tracking-wider uppercase">{item.label}</span>
          </Link>
        ))}

        {/* Cameras section */}
        <div className="px-4 pt-5 pb-1.5">
          <span className="section-label text-muted-foreground/60">// Cameras</span>
        </div>

        {cameraGroups.map(group => {
          const expanded = expandedGroups.includes(group.id);
          const cameras = group.cameras ?? [];
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-[11px] text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <span className="text-muted-foreground/60 w-3 text-center text-[10px]">
                  {expanded ? "▾" : "▸"}
                </span>
                <span className="truncate tracking-wider uppercase flex-1 text-left">{group.name}</span>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">{cameras.length}</span>
              </button>
              {expanded && (
                <div className="ml-4 border-l border-sidebar-border">
                  {cameras.map(cam => (
                    <Link
                      key={cam.id}
                      to={`/cameras/${cam.id}`}
                      className={cn(
                        "flex items-center gap-2 pl-3 pr-3 py-1.5 text-[10px] transition-colors",
                        isActive(`/cameras/${cam.id}`)
                          ? "text-primary bg-primary/8"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 shrink-0",
                        cam.status === "online" ? "bg-success" :
                        cam.status === "offline" ? "bg-destructive" : "bg-warning"
                      )} />
                      <span className="truncate tracking-wide">{cam.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* System status */}
      <div className="border-t border-sidebar-border">
        <div className="px-4 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-success animate-pulse" />
          <span className="section-label text-muted-foreground/50">System Online</span>
        </div>
        <button
          onClick={() => { localStorage.removeItem("vs_token"); navigate("/login"); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors border-t border-sidebar-border"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="tracking-wider uppercase">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
