"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { Transaction, User } from "@/lib/types";
import { normalizeUserProfile } from "@/lib/user-profile";
import { getBorrowerStanding } from "@/lib/borrower-status";
import { cn } from "@/lib/utils";

export default function BorrowerNotifications() {
  const [userData, setUserData] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let unsubscribeTx: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(normalizeUserProfile(userDoc.data(), user));
      }

      unsubscribeTx = onSnapshot(
        query(collection(db, "transactions"), where("userId", "==", user.uid)),
        (snapshot) => {
          setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTx) unsubscribeTx();
    };
  }, []);

  const standing = getBorrowerStanding(userData, transactions);
  const notifications = [
    standing.isRestricted
      ? {
          id: "restriction",
          title: "Borrowing Restricted",
          message: standing.nextSteps.join(" "),
          icon: AlertTriangle,
          color: "text-destructive bg-destructive/10",
        }
      : null,
    standing.hasComplied
      ? {
          id: "complied",
          title: "Obligations Cleared",
          message: "Your account is currently clear. The admin side can now review and confirm your restored borrowing access.",
          icon: CheckCircle2,
          color: "text-green-500 bg-green-500/10",
        }
      : null,
    !standing.isRestricted && !standing.hasComplied
      ? {
          id: "info",
          title: "Account Standing Normal",
          message: "You currently have no restriction notice on your borrowing account.",
          icon: Info,
          color: "text-primary bg-primary/10",
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    title: string;
    message: string;
    icon: LucideIcon;
    color: string;
  }>;

  return (
    <DashboardLayout role="borrower">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-white">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your equipment status and system alerts.</p>
        </div>

        {notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <Card key={notif.id} className="border-border/50 bg-card/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex gap-5">
                    <div className={cn("p-4 rounded-2xl shrink-0 h-fit", notif.color)}>
                      <notif.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{notif.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-dashed border-border/50 bg-transparent">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-light">
              {notifications.length === 0 ? "No notifications yet." : "Notifications shown above are based on your current account standing."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
