import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast({ title: "Email sent", description: "Check your inbox for reset instructions." });
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto shadow-glow">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            {sent ? "Check your email for a reset link." : "Enter your email to receive reset instructions."}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 bg-secondary border-border" required />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link to="/login" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
