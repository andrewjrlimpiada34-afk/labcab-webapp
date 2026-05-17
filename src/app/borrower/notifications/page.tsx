"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Info, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BorrowerNotifications() {
  const mockNotifications = [
    {
      id: 1,
      type: "alert",
      title: "Approaching Deadline",
      message: "Your borrowing of 'Graduated Cylinder' is due tomorrow at 16:00.",
      time: "2 hours ago",
      icon: AlertTriangle,
      color: "text-destructive bg-destructive/10"
    },
    {
      id: 2,
      type: "info",
      title: "System Update",
      message: "LabKiosk Pro has been updated to v2.1. New remote override features added.",
      time: "Yesterday",
      icon: Info,
      color: "text-primary bg-primary/10"
    },
    {
      id: 3,
      type: "success",
      title: "Return Verified",
      message: "The Facilitator has confirmed the return of 'Compound Microscope'.",
      time: "2 days ago",
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500/10"
    }
  ];

  return (
    <DashboardLayout role="borrower">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-white">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your equipment status and system alerts.</p>
        </div>

        <div className="space-y-4">
          {mockNotifications.map((notif) => (
            <Card key={notif.id} className="border-border/50 bg-card/10 backdrop-blur-xl hover:bg-secondary/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className={cn("p-4 rounded-2xl shrink-0 h-fit", notif.color)}>
                    <notif.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">{notif.title}</h3>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{notif.time}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{notif.message}</p>
                    <div className="pt-4 flex items-center gap-6">
                      <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                        Mark as Read
                      </button>
                      <button className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-white transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed border-border/50 bg-transparent">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-light">No further notifications pending.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}