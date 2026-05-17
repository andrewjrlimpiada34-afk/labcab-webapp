"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Unlock, ShieldAlert, ShieldCheck, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminUnlock() {
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemoteUnlock = async (cabinetId: string) => {
    setUnlocking(cabinetId);
    try {
      await addDoc(collection(db, "system_logs"), {
        type: "remote_unlock",
        cabinetId,
        timestamp: serverTimestamp(),
        triggeredBy: "admin_hub"
      });
      
      // Simulate real-time hardware response delay
      setTimeout(() => {
        toast({
          title: "Cabinet Overridden",
          description: `Magnetic lock released for Cabinet ${cabinetId}.`,
        });
        setUnlocking(null);
      }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Access Denied", description: "System hardware communication failure." });
      setUnlocking(null);
    }
  };

  const cabinets = ["CAB-01", "CAB-02", "CAB-03", "CAB-04"];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            Security Override Console
          </div>
          <h1 className="text-4xl font-bold font-headline text-white">Remote Cabinet Control</h1>
          <p className="text-muted-foreground text-lg">
            Facilitators can manually release laboratory magnetic locks in case of emergency or kiosk malfunction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cabinets.map((id) => (
            <Card key={id} className="border-border/50 bg-card/20 backdrop-blur-xl group hover:border-primary/40 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl">{id}</CardTitle>
                  <CardDescription className="text-xs uppercase tracking-tighter">Main Lab Segment</CardDescription>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 bg-secondary/20 rounded-xl border border-border/30">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p>Magnet lock active. System status: <span className="text-green-500 font-bold uppercase text-[10px]">Healthy</span></p>
                </div>
                <Button 
                  disabled={unlocking !== null}
                  onClick={() => handleRemoteUnlock(id)}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-xl",
                    unlocking === id ? "bg-muted" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  {unlocking === id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Releasing Lock...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-3" />
                      Release Magnetic Lock
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-6 border border-primary/20 bg-primary/5 rounded-3xl flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="font-bold text-primary">Operational Notice</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every remote unlock action is logged with an administrative timestamp. Ensure you have visually verified the person requiring access before triggering the remote override.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}