import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Eye, Shield, Zap, Camera, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClairvoyantLogo } from "@/components/ClairvoyantLogo";

const features = [
  { icon: Search, title: "Natural Language Search", description: "Search footage with plain English — 'man in red hat near entrance' — and get instant results." },
  { icon: Eye, title: "Real-Time Tracking", description: "Follow persons or vehicles across multiple cameras with AI-powered re-identification." },
  { icon: Brain, title: "Smart Alerts", description: "Set up intelligent alerts that notify you when specific events or entities are detected." },
  { icon: Zap, title: "Instant Results", description: "Sub-second search across thousands of hours of footage with confidence scoring." },
  { icon: Camera, title: "Multi-Camera Support", description: "Manage and search across unlimited camera feeds organized by groups and locations." },
  { icon: Shield, title: "Enterprise Security", description: "Role-based access control, audit logs, and encrypted data at rest and in transit." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <ClairvoyantLogo className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Clairvoyant</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow"
          >
            <ClairvoyantLogo className="w-12 h-12 text-primary-foreground" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            See everything.
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">Find anything.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            AI-powered video intelligence that lets you search surveillance footage 
            with natural language. Find people, vehicles, and events in seconds — not hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            <Link to="/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-base px-8">
                Try the Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Fake search bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="relative rounded-xl border border-border bg-card p-1 shadow-elevated">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary">
                <Search className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  "person wearing red jacket near loading dock, last 24 hours"
                </span>
                <kbd className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  ⌘K
                </kbd>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for security teams</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to monitor, search, and respond — powered by state-of-the-art AI.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-glow transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to see the unseen?</h2>
            <p className="text-muted-foreground mb-8">
              Start searching your footage with AI today. No complex setup required.
            </p>
            <Link to="/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-base px-8">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClairvoyantLogo className="w-4 h-4" />
            <span>Clairvoyant © 2026</span>
          </div>
          <div className="text-xs text-muted-foreground">AI Video Intelligence Platform</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
