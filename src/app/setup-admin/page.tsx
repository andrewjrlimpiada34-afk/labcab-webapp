
"use client";

import { useState } from "react";
import { auth, db } from "@/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function SetupAdmin() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "Please sign in first, then return to this URL to promote your account to Admin.",
      });
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "Admin User",
        role: "admin",
      }, { merge: true });

      setDone(true);
      toast({
        title: "Account Promoted",
        description: "You are now an administrator. Please log in again to refresh your session.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: "Firestore rules might be blocking this action. Ensure you have initial write access.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldAlert className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline">Admin Promotion Utility</CardTitle>
          <CardDescription>
            Use this tool to grant admin privileges to the currently signed-in account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!done ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Make sure you are logged in with the email you manually added in the Firebase Console.
              </p>
              <Button 
                onClick={handleSetup} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Promote Current User to Admin
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <p className="font-medium text-green-500">Success! Your account is now an Admin.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}
          <div className="text-center">
            <Link href="/login" className="text-xs text-muted-foreground hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
