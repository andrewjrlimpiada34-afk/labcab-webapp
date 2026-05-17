"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { Transaction, User } from "@/lib/types";
import { getBorrowerStanding } from "@/lib/borrower-status";
import { getBorrowerTypeIcon, getBorrowerTypeLabel } from "@/lib/borrower-meta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldAlert, Users } from "lucide-react";

export default function AdminUsersPage() {
  const [borrowers, setBorrowers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { missingItemCount: string; restrictionNote: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const nextBorrowers = snapshot.docs
        .map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as User) }))
        .filter((user) => user.role === "borrower");

      setBorrowers(nextBorrowers);
      setDrafts((prev) => {
        const next = { ...prev };
        nextBorrowers.forEach((user) => {
          if (!next[user.uid]) {
            next[user.uid] = {
              missingItemCount: String(user.missingItemCount || 0),
              restrictionNote: user.restrictionNote || "",
            };
          }
        });
        return next;
      });
    });

    const unsubscribeTransactions = onSnapshot(collection(db, "transactions"), (snapshot) => {
      setTransactions(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Transaction) })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
    };
  }, []);

  const borrowersWithStanding = useMemo(
    () =>
      borrowers.map((borrower) => {
        const userTransactions = transactions.filter((tx) => tx.userId === borrower.uid);
        const standing = getBorrowerStanding(borrower, userTransactions);
        return { borrower, standing };
      }),
    [borrowers, transactions]
  );

  const restrictedCount = borrowersWithStanding.filter((entry) => entry.standing.isRestricted).length;

  const updateDraft = (uid: string, field: "missingItemCount" | "restrictionNote", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [uid]: {
        missingItemCount: prev[uid]?.missingItemCount ?? "0",
        restrictionNote: prev[uid]?.restrictionNote ?? "",
        [field]: value,
      },
    }));
  };

  const saveUserFlags = async (user: User) => {
    const draft = drafts[user.uid];
    const missingItemCount = Math.max(0, Number.parseInt(draft?.missingItemCount || "0", 10) || 0);
    const restrictionNote = (draft?.restrictionNote || "").trim();

    try {
      await updateDoc(doc(db, "users", user.uid), {
        missingItemCount,
        restrictionNote,
      });

      toast({
        title: "User Updated",
        description: `Restriction details for ${user.name} have been saved.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save the borrower restriction details.",
      });
    }
  };

  const clearFlags = async (user: User) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        missingItemCount: 0,
        restrictionNote: "",
      });

      setDrafts((prev) => ({
        ...prev,
        [user.uid]: {
          missingItemCount: "0",
          restrictionNote: "",
        },
      }));

      toast({
        title: "Flags Cleared",
        description: `${user.name} no longer has manual missing-item flags.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not clear the borrower flags.",
      });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-white tracking-tight">User Management</h1>
            <p className="text-muted-foreground text-lg font-light max-w-3xl">
              Review borrower standing, restriction status, and compliance progress in one place.
            </p>
          </div>
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 rounded-xl text-xs uppercase tracking-widest">
            {restrictedCount} restricted borrower{restrictedCount === 1 ? "" : "s"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/30 border-border/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">Borrowers</div>
              <div className="text-4xl font-headline font-bold text-white">{borrowers.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-destructive/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">Restricted</div>
              <div className="text-4xl font-headline font-bold text-destructive">{restrictedCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-green-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">Complied</div>
              <div className="text-4xl font-headline font-bold text-green-400">
                {borrowersWithStanding.filter((entry) => entry.standing.hasComplied).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/10 backdrop-blur-3xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-secondary/10 px-8 py-6">
            <div className="flex items-center gap-3">
              <Users className="text-primary" />
              <div>
                <CardTitle className="font-headline text-2xl">Borrower Standing</CardTitle>
                <CardDescription>Restricted accounts, compliance, and manual missing-item flags.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {borrowersWithStanding.map(({ borrower, standing }) => {
                const BorrowerTypeIcon = getBorrowerTypeIcon(borrower);
                const statusLabel = standing.isRestricted
                  ? "Restricted"
                  : standing.hasComplied
                    ? "Complied"
                    : standing.unresolvedCount > 0
                      ? "Monitoring"
                      : "Clear";

                return (
                  <div key={borrower.uid} className="p-6 md:p-8">
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-8">
                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="p-4 rounded-2xl bg-primary/10 shrink-0">
                            <BorrowerTypeIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-bold text-white">{borrower.name}</h3>
                              <Badge
                                className={cn(
                                  "rounded-xl px-3 py-1 border",
                                  standing.isRestricted
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : standing.hasComplied
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-primary/10 text-primary border-primary/20"
                                )}
                              >
                                {statusLabel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{borrower.email}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">
                              {getBorrowerTypeLabel(borrower)} Borrower
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Unreturned</p>
                            <p className="text-2xl font-bold text-white">{standing.outstandingItemCount}</p>
                          </div>
                          <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Overdue</p>
                            <p className={cn("text-2xl font-bold", standing.overdueItemCount > 0 ? "text-destructive" : "text-white")}>
                              {standing.overdueItemCount}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Missing Flags</p>
                            <p className="text-2xl font-bold text-white">{standing.missingItemCount}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(standing.isRestricted ? standing.nextSteps : standing.hasComplied ? [
                            "Borrower has already satisfied the current system obligations.",
                            "You may review this account and allow normal borrowing flow to continue.",
                          ] : [
                            "No active restriction has been detected for this borrower.",
                          ]).map((line) => (
                            <div key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                              {standing.isRestricted ? (
                                <ShieldAlert className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
                              )}
                              <span>{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Missing Apparatus Count</label>
                          <Input
                            type="number"
                            min="0"
                            value={drafts[borrower.uid]?.missingItemCount ?? "0"}
                            onChange={(e) => updateDraft(borrower.uid, "missingItemCount", e.target.value)}
                            className="bg-background/40 border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Admin Note</label>
                          <Textarea
                            value={drafts[borrower.uid]?.restrictionNote ?? ""}
                            onChange={(e) => updateDraft(borrower.uid, "restrictionNote", e.target.value)}
                            className="min-h-28 bg-background/40 border-border"
                            placeholder="Add the exact compliance requirement for this borrower..."
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => saveUserFlags(borrower)} className="bg-primary hover:bg-primary/90">
                            Save Flags
                          </Button>
                          <Button variant="outline" onClick={() => clearFlags(borrower)}>
                            Clear Flags
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
