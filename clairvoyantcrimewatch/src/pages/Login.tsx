import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { ClairvoyantLogo } from "@/components/ClairvoyantLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("demo@videosearch.io");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("vs_token", res.token);
      localStorage.setItem("vs_user", JSON.stringify(res.user));
      navigate("/dashboard");
    } catch {
      toast({ title: "Login failed", description: "Please check your credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto shadow-glow">
            <ClairvoyantLogo className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Clairvoyant</h1>
          <p className="text-sm text-muted-foreground">Sign in to access surveillance analytics</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9 bg-secondary border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-9 bg-secondary border-border"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
            {loading ? "Signing in…" : "Sign In"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="text-center">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
        </div>

        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-center">
          <p className="text-xs text-warning">Demo Mode — Use any credentials to sign in</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
