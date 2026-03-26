import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Search, Eye, Shield, Zap, Camera, Brain,
  Clock, Target, Activity, ChevronRight, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClairvoyantLogo } from "@/components/ClairvoyantLogo";

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const QUERIES = [
  "person in red jacket near loading dock",
  "white sedan exiting north gate after 22:00",
  "individual with backpack in lobby",
  "two subjects near server room B",
  "suspicious package left by entrance",
  "person running toward emergency exit",
];

const CAMERAS = [
  { id: "CAM-01", loc: "NORTH ENTRANCE", ping: 12, events: 3 },
  { id: "CAM-02", loc: "LOADING DOCK",   ping: 8,  events: 1 },
  { id: "CAM-03", loc: "LOBBY — A WING", ping: 14, events: 7 },
  { id: "CAM-04", loc: "SERVER ROOM",    ping: 9,  events: 0 },
  { id: "CAM-05", loc: "SOUTH EXIT",     ping: 11, events: 2 },
  { id: "CAM-06", loc: "PARKING LOT",    ping: 16, events: 4 },
];

const STATS = [
  { value: "0.3s", label: "Avg search latency",  sub: "across 238 segments" },
  { value: "99.1%", label: "Detection accuracy", sub: "on WILDTRACK benchmark" },
  { value: "7×",   label: "Faster than manual",  sub: "forensic review" },
  { value: "500",  label: "Max clips per query",  sub: "instant retrieval" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Describe what you're looking for",
    body: "Type a plain-English description — appearance, location, time window, behaviour. No query syntax required.",
    icon: Search,
  },
  {
    step: "02",
    title: "AI scans every camera feed",
    body: "CLIP embeddings turn your words into a vector. We rank every clip across all feeds by semantic similarity in milliseconds.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Review ranked results with confidence",
    body: "Results arrive sorted by match confidence. Click any clip to jump directly to the moment, export a clip, or set a live alert.",
    icon: Eye,
  },
];

const FEATURES = [
  { icon: Target,   title: "Natural Language Search",   desc: "Write queries the way you'd brief a colleague — not SQL." },
  { icon: Activity, title: "Cross-Camera Re-ID",        desc: "Follow a subject seamlessly across every camera on your network." },
  { icon: Clock,    title: "Temporal Filtering",        desc: "Narrow results to any date/time range with a single click." },
  { icon: Zap,      title: "Sub-Second Retrieval",      desc: "pgvector ANN search returns ranked results in under 300 ms." },
  { icon: Camera,   title: "Unlimited Camera Feeds",    desc: "Manage groups, locations, and live feeds from one dashboard." },
  { icon: Shield,   title: "Enterprise-Grade Security", desc: "RBAC, audit logs, and end-to-end encrypted footage at rest." },
];

const TICKER_ITEMS = [
  "CLIP EMBEDDINGS",  "NATURAL LANGUAGE SEARCH",  "PGVECTOR ANN",
  "REAL-TIME RE-ID",  "WILDTRACK DATASET",        "CROSS-CAMERA TRACKING",
  "SUB-300MS LATENCY","CONFIDENCE SCORING",       "TEMPORAL FILTERING",
  "MP4 CLIP EXPORT",  "SMART ALERTS",             "MULTI-FEED SEARCH",
];

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

/** Animated camera feed card */
function CameraCard({ cam, index }: { cam: typeof CAMERAS[0]; index: number }) {
  const [scanY, setScanY] = useState(0);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanY((y) => (y + 1) % 100);
    }, 30 + index * 5);
    return () => clearInterval(interval);
  }, [index]);

  useEffect(() => {
    if (cam.events === 0) return;
    const timeout = setTimeout(() => setDetected(true), 2000 + index * 800);
    return () => clearTimeout(timeout);
  }, [cam.events, index]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      className="relative bg-[hsl(22_10%_4%)] border border-[hsl(22_8%_14%)] overflow-hidden"
      style={{ borderRadius: 2 }}
    >
      {/* Noise / static texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none transition-none"
        style={{ top: `${scanY}%` }}
      />

      {/* Detection box */}
      <AnimatePresence>
        {detected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/3 left-1/4 w-1/3 h-1/3 border border-primary/70 pointer-events-none"
            style={{ borderRadius: 0 }}
          >
            <span className="absolute -top-4 left-0 text-[8px] font-mono text-primary/80 whitespace-nowrap">
              MATCH {Math.floor(78 + Math.random() * 20)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD overlay */}
      <div className="relative z-10 p-2.5 flex flex-col justify-between h-full min-h-[90px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-primary/70">{cam.id}</span>
          <span className="flex items-center gap-1 font-mono text-[8px] text-[hsl(143_55%_50%)]">
            <span className="w-1 h-1 rounded-full bg-[hsl(143_55%_50%)] animate-pulse" />
            LIVE
          </span>
        </div>

        <div>
          <div className="font-mono text-[8px] text-muted-foreground truncate mb-1">
            {cam.loc}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] text-muted-foreground/60">{cam.ping}ms</span>
            {cam.events > 0 && (
              <span className="font-mono text-[8px] text-primary">
                {cam.events} EVENT{cam.events > 1 ? "S" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Corner brackets */}
      {[
        "top-0 left-0 border-t border-l",
        "top-0 right-0 border-t border-r",
        "bottom-0 left-0 border-b border-l",
        "bottom-0 right-0 border-b border-r",
      ].map((cls) => (
        <div
          key={cls}
          className={`absolute w-2 h-2 border-primary/30 pointer-events-none ${cls}`}
        />
      ))}
    </motion.div>
  );
}

/** Animated typewriter query */
function TypewriterQuery() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold" | "erasing">("typing");

  useEffect(() => {
    const target = QUERIES[queryIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < target.length) {
        timeout = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          38
        );
      } else {
        timeout = setTimeout(() => setPhase("hold"), 1800);
      }
    } else if (phase === "hold") {
      timeout = setTimeout(() => setPhase("erasing"), 600);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18);
      } else {
        setQueryIndex((i) => (i + 1) % QUERIES.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, queryIndex]);

  return (
    <span className="text-foreground/90">
      {displayed}
      <span className="animate-pulse text-primary">▌</span>
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

const LandingPage = () => {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-7 h-7 bg-gradient-primary flex items-center justify-center shadow-glow" style={{ borderRadius: 2 }}>
              <ClairvoyantLogo className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base tracking-tight">CLAIRVOYANT</span>
            <span className="hidden sm:block font-mono text-[9px] text-muted-foreground border border-border px-1.5 py-0.5 ml-1" style={{ borderRadius: 2 }}>
              v2.1 DEMO
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground hover:text-foreground">
                SIGN IN
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/85 shadow-glow font-mono text-xs tracking-wider"
                style={{ borderRadius: 2 }}
              >
                LAUNCH DEMO <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-14">

        {/* Background: dot-grid + central amber glow */}
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.35]" style={{
            backgroundImage: "radial-gradient(circle, hsl(38 90% 52% / 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[140px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 font-mono text-[10px] text-primary border border-primary/30 bg-primary/5 px-3 py-1 mb-8"
              style={{ borderRadius: 2 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              AI VIDEO INTELLIGENCE · LIVE DEMO AVAILABLE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65 }}
              className="font-display text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-7"
            >
              Surveillance
              <br />
              intelligence
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                at the speed
              </span>
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                of thought.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-base md:text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed"
            >
              Describe what you're looking for in plain English. Clairvoyant searches
              every camera feed — returning ranked, timestamped results in under a second.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.6 }}
              className="flex flex-wrap items-center gap-3 mb-14"
            >
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/85 shadow-glow font-mono text-sm tracking-wider h-12 px-7"
                  style={{ borderRadius: 2 }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  TRY THE DEMO
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-muted-foreground hover:text-foreground font-mono text-sm tracking-wider h-12 px-5 border border-border hover:border-border/80"
                  style={{ borderRadius: 2 }}
                >
                  VIEW CAMERAS <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>

            {/* Inline stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 border-t border-border pt-8"
            >
              {[
                { v: "0.3s",  l: "Search latency" },
                { v: "99.1%", l: "Detection accuracy" },
                { v: "7×",    l: "Faster than manual" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <div className="font-display text-2xl font-bold text-primary">{v}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: camera grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative"
          >
            {/* Outer border frame */}
            <div className="relative border border-border/60 p-4 bg-[hsl(22_10%_4%)]" style={{ borderRadius: 2 }}>

              {/* HUD top bar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">
                  SURVEILLANCE NETWORK — 6 FEEDS
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] text-[hsl(143_55%_50%)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(143_55%_50%)] animate-pulse" />
                  ALL SYSTEMS NOMINAL
                </span>
              </div>

              {/* Camera grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {CAMERAS.map((cam, i) => (
                  <CameraCard key={cam.id} cam={cam} index={i} />
                ))}
              </div>

              {/* Query preview bar */}
              <div className="mt-3 border border-border/50 bg-secondary p-3 flex items-start gap-3" style={{ borderRadius: 2 }}>
                <Search className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div className="font-mono text-[11px] min-h-[16px] flex-1">
                  <TypewriterQuery />
                </div>
              </div>

              {/* Corner frame accents */}
              {[
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "bottom-0 right-0 border-b-2 border-r-2",
              ].map((cls) => (
                <div
                  key={cls}
                  className={`absolute w-4 h-4 border-primary/50 ${cls}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <div className="border-y border-border/50 bg-secondary/40 py-2.5 overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase flex items-center gap-8">
              {item}
              <span className="text-primary/40">◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="font-mono text-[10px] text-primary tracking-widest uppercase mb-4">
              HOW IT WORKS
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              From query to clip
              <br />
              <span className="text-muted-foreground font-normal">in three steps.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`relative p-8 border-b border-border ${
                  i < HOW_IT_WORKS.length - 1 ? "md:border-r" : ""
                } md:border-b-0`}
              >
                <div className="font-mono text-[10px] text-primary/50 mb-6 tracking-widest">
                  STEP {step.step}
                </div>
                <div className="w-10 h-10 border border-border flex items-center justify-center mb-6 bg-secondary group-hover:border-primary/40 transition-colors" style={{ borderRadius: 2 }}>
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>

                {/* Connecting arrow */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-10">
                    <div className="w-7 h-7 bg-background border border-border flex items-center justify-center" style={{ borderRadius: 2 }}>
                      <ChevronRight className="w-3.5 h-3.5 text-primary/60" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-[hsl(22_10%_4%)] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center md:text-left"
            >
              <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="font-mono text-xs text-foreground/70 uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="font-mono text-[10px] text-primary tracking-widest uppercase mb-4">
              CAPABILITIES
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Built for teams
              <br />
              <span className="text-muted-foreground font-normal">that can't afford to miss anything.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative bg-background p-8 hover:bg-[hsl(22_10%_6%)] transition-colors duration-200 cursor-default"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/30 transition-all duration-300" />
                <div
                  className="w-9 h-9 border border-border bg-secondary flex items-center justify-center mb-5 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-200"
                  style={{ borderRadius: 2 }}
                >
                  <feat.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm tracking-tight mb-2">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo CTA ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative border border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-12 md:p-16 overflow-hidden"
            style={{ borderRadius: 2 }}
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/8 blur-[80px] pointer-events-none" />

            {/* Corner accents */}
            {[
              "top-0 left-0 border-t-2 border-l-2",
              "top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2",
              "bottom-0 right-0 border-b-2 border-r-2",
            ].map((cls) => (
              <div key={cls} className={`absolute w-5 h-5 border-primary/50 ${cls}`} />
            ))}

            <div className="relative text-center">
              <div className="font-mono text-[10px] text-primary tracking-widest uppercase mb-6 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                DEMO INSTANCE READY
              </div>

              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-5">
                See the unseen.
                <br />
                <span className="text-muted-foreground font-normal">Start searching in 30 seconds.</span>
              </h2>

              <p className="text-muted-foreground text-base mb-10 max-w-lg mx-auto">
                Live demo with 238 real surveillance segments from the WILDTRACK dataset.
                No sign-up required — just log in and search.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/85 shadow-glow font-mono text-sm tracking-wider h-13 px-8"
                    style={{ borderRadius: 2 }}
                  >
                    OPEN DEMO <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Demo credentials */}
              <div
                className="inline-flex items-center gap-3 bg-secondary/60 border border-border px-5 py-2.5"
                style={{ borderRadius: 2 }}
              >
                <span className="font-mono text-[10px] text-muted-foreground tracking-wider">LOGIN</span>
                <span className="w-px h-3 bg-border" />
                <span className="font-mono text-[11px] text-foreground/80">demo@videosearch.io</span>
                <span className="w-px h-3 bg-border" />
                <span className="font-mono text-[11px] text-foreground/80">demo123</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-gradient-primary flex items-center justify-center" style={{ borderRadius: 2 }}>
              <ClairvoyantLogo className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              CLAIRVOYANT © 2026
            </span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            AI VIDEO INTELLIGENCE PLATFORM
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
