
"use client";

import { useState } from "react";
import { auth, db } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

export default function UnifiedLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        // Robust extraction of first name
        const fullName = userData.name || "";
        const firstName = fullName.trim() ? fullName.split(/\s+/)[0] : "Scholar";

        const toastDescription = role === 'admin' 
          ? "Welcome back, Facilitator!" 
          : `Welcome back, ${firstName}!`;

        toast({
          title: "Authentication Successful",
          description: toastDescription,
        });

        if (role === 'admin') {
          router.push("/admin/dashboard");
        } else {
          router.push("/borrower/dashboard");
        }
      } else {
        setError("User profile not found in system. Please contact an administrator.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl rounded-3xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo className="h-12" />
          </div>
          <div>
            <CardTitle className="text-3xl font-headline font-bold">Secure Access</CardTitle>
            <CardDescription className="text-muted-foreground mt-2 font-medium">
              LabCab Authentication Gateway
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest opacity-70">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@university.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/50 border-border focus:ring-accent rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Password" className="font-bold text-xs uppercase tracking-widest opacity-70">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-background/50 border-border focus:ring-accent rounded-xl h-12"
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white h-12 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Session"}
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors font-medium">
                &larr; Return to Home
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
