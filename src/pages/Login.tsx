import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (currentUser) {
    navigate("/chat", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(id, code);
    setLoading(false);
    if (err) setError(err);
    else navigate("/chat", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-primary">LIVE</span>
            <span className="text-foreground">-P</span>
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">ID</label>
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter your ID"
              className="bg-card border-border"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Code</label>
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className="bg-card border-border"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            <Lock className="h-4 w-4 mr-2" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
