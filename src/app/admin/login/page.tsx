
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@labkiosk.pro";
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "123456";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate server-side delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === ADMIN_EMAIL && pin === ADMIN_PIN) {
      localStorage.setItem("admin_session", JSON.stringify({ email, isAdmin: true, ts: Date.now() }));
      toast({
        title: "Welcome, Administrator",
        description: "Access granted to lab facilitator dashboard.",
      });
      router.push("/admin/dashboard");
    } else {
      setError("Unauthorized access. These credentials do not match our facilitator records.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/10 via-background to-background">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-accent/10 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-accent" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-headline font-bold">Facilitator Access</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Administrative control hub for laboratory cabinet management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@labkiosk.pro" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/50 border-border focus:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">Access PIN</Label>
              <Input 
                id="pin" 
                type="password" 
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required 
                className="bg-background/50 border-border focus:ring-accent tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-11" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate as Facilitator"}
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                &larr; Back to Public Site
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
