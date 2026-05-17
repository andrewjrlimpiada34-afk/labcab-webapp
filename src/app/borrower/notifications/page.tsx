"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function BorrowerNotifications() {
  return (
    <DashboardLayout role="borrower">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-white">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your equipment status and system alerts.</p>
        </div>

        <Card className="border-dashed border-border/50 bg-transparent">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-light">No notifications yet.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
