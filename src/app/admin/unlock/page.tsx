"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Unlock, ShieldAlert, ShieldCheck, Loader2, Info, Beaker, FlaskConical, TestTube, UtilityPole, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const compartments = [
  { id: "BEAKER", name: "Beaker Compartment", icon: Beaker },
  { id: "TEST_TUBE", name: "Test Tube Compartment", icon: TestTube },
  { id: "ERLENMEYER", name: "Erlenmeyer Flask Compartment", icon: FlaskConical },
  { id: "FUNNEL", name: "Funnel Compartment", icon: Filter },
  { id: "STIRRING_ROD", name: "Stirring Rod Compartment", icon: UtilityPole },
];

export default function AdminUnlock() {
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemoteUnlock = async (comp: typeof compartments[0]) => {
    setUnlocking(comp.id);
    try {
      await addDoc(collection(db, "system_logs"), {
        type: "remote_unlock",
        cabinetId: comp.id,
        compartmentName: comp.name,
        timestamp: serverTimestamp(),
        triggeredBy: "admin_hub"
      });
      
      // Simulate real-time hardware response delay
      setTimeout(() => {
        toast({
          title: "Access Granted",
          description: `Magnetic lock released for ${comp.name}.`,
        });
        setUnlocking(null);
      }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Access Denied", description: "System hardware communication failure." });
      setUnlocking(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            Security Override Console
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-white tracking-tight">Compartment Access Control</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
            Facilitators can manually release laboratory magnetic locks for specific equipment compartments in case of emergency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compartments.map((comp) => (
            <Card key={comp.id} className="border-border/50 bg-card/20 backdrop-blur-xl group hover:border-primary/40 transition-all duration-300 rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <comp.icon className="w-24 h-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="z-10">
                  <CardTitle className="font-headline text-xl">{comp.name}</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Secure Segment</CardDescription>
                </div>
                <div className="p-2 bg-green-500/10 rounded-xl z-10">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 bg-secondary/20 rounded-xl border border-border/30 z-10 relative">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[11px] leading-tight">Magnet active. Status: <span className="text-green-500 font-bold uppercase">Healthy</span></p>
                </div>
                <Button 
                  disabled={unlocking !== null}
                  onClick={() => handleRemoteUnlock(comp)}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-xl relative z-10",
                    unlocking === comp.id ? "bg-muted" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  {unlocking === comp.id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Releasing...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-3" />
                      Unlock Magnet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-8 border border-primary/20 bg-primary/5 rounded-3xl flex items-start gap-6 backdrop-blur-sm">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-primary shrink-0" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-primary text-xl font-headline">Facilitator Protocol</h4>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Every remote unlock action is logged with an administrative timestamp and associated with your account. Ensure you have visually verified the Borrower requiring access before triggering the remote override.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
