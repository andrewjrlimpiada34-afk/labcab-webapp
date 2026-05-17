"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Transaction, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle, CheckCircle2, Package, Loader2, Calendar, History } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function BorrowerDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user profile details
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as User);
          }
        } catch (e) {
          console.error("Error fetching user:", e);
        }
      };
      fetchUser();

      // Setup real-time transactions listener
      // We remove orderBy from query to avoid index requirements and sort client-side
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid)
      );

      const unsubscribeSnap = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        
        // Safe sorting: Handle cases where borrowTime might be null/missing
        const sortedDocs = docs.sort((a, b) => {
          const timeA = a.borrowTime?.toMillis?.() || 0;
          const timeB = b.borrowTime?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setTransactions(sortedDocs);
        setLoading(false);
      }, (error) => {
        console.error("Dashboard Snapshot Error:", error);
        setLoading(false);
      });

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, []);

  const firstName = userData?.name?.split(' ')[0] || 'Scholar';
  const activeTransactions = transactions.filter(t => t.status === 'active');
  const overdueCount = activeTransactions.filter(t => {
    try {
      return t.deadline && new Date(t.deadline) < new Date();
    } catch {
      return false;
    }
  }).length;

  if (loading) {
    return (
      <DashboardLayout role="borrower">
        <div className="h-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-headline animate-pulse uppercase tracking-[0.2em] text-xs">Accessing Workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="borrower">
      <div className="flex flex-col gap-10">
        <div className="pb-6">
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-white tracking-tight leading-tight">
            Welcome back, <span className="text-primary">{firstName}!</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-2xl">
            Dashboard initialized. You currently have <span className="text-primary font-bold">{activeTransactions.length} apparatus</span> in your possession.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/30 border-primary/20 hover:border-primary/50 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">In Possession</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold font-headline mb-1">{activeTransactions.length}</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Active lab apparatus</p>
            </CardContent>
          </Card>

          <Card className={cn(
            "bg-card/30 border-destructive/20 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative rounded-2xl",
            overdueCount > 0 ? "border-destructive/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : ""
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Action Required</CardTitle>
              <div className={cn(
                "p-2 rounded-xl transition-transform group-hover:scale-110",
                overdueCount > 0 ? "bg-destructive/10 animate-pulse" : "bg-muted/10"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  overdueCount > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={cn("text-5xl font-bold font-headline mb-1", overdueCount > 0 ? "text-destructive" : "")}>
                {overdueCount}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Overdue equipment</p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-green-500/20 hover:border-green-500/50 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Reliability Score</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold font-headline mb-1">98%</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Consistent return rate</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/10 backdrop-blur-3xl overflow-hidden rounded-3xl shadow-2xl">
          <CardHeader className="bg-secondary/10 border-b border-border/50 px-8 py-6">
            <CardTitle className="font-headline text-2xl flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              Current Borrowings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeTransactions.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground bg-card/5">
                <Package className="w-20 h-20 mx-auto mb-6 opacity-5 animate-pulse" />
                <p className="text-xl font-light">Inventory clear. No active borrowings detected.</p>
                <p className="text-sm mt-2 font-mono uppercase tracking-widest opacity-50">Visit lab kiosk to initiate transfer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="py-5 pl-8 font-bold uppercase tracking-widest text-[10px]">Apparatus</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-[10px]">Borrowed On</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-[10px]">Due Date</TableHead>
                      <TableHead className="font-bold pr-8 text-right uppercase tracking-widest text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTransactions.map((tx) => {
                      const isOverdue = tx.deadline && new Date(tx.deadline) < new Date();
                      return (
                        <TableRow key={tx.id} className="border-border/50 hover:bg-primary/5 transition-colors group">
                          <TableCell className="font-bold py-7 pl-8 text-base">
                            {tx.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 opacity-40" />
                              {tx.borrowTime ? format(tx.borrowTime.toDate(), "MMM dd, yyyy") : "Pending..."}
                            </div>
                          </TableCell>
                          <TableCell className={cn("font-bold text-sm", isOverdue ? "text-destructive" : "text-primary")}>
                            {tx.deadline ? format(new Date(tx.deadline), "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            {isOverdue ? (
                              <Badge variant="destructive" className="animate-pulse shadow-lg shadow-destructive/20 rounded-md font-bold px-3 py-1">OVERDUE</Badge>
                            ) : (
                              <Badge variant="outline" className="border-primary/50 text-primary rounded-md font-bold px-3 py-1 shadow-[0_0_15px_rgba(26,163,255,0.1)]">IN USE</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h3 className="text-2xl font-headline font-bold px-2 flex items-center gap-3">
            <History className="text-muted-foreground w-6 h-6" />
            Recent Log History
          </h3>
          <Card className="border-border/50 bg-card/5 rounded-3xl overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {transactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-muted/10">
                      <TableCell className="py-6 pl-8 font-bold text-sm">
                        {tx.items.map(i => i.name).join(", ")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono uppercase tracking-widest">
                        {tx.status === 'returned' && tx.returnTime 
                          ? `Returned ${format(tx.returnTime.toDate(), "MMM dd, HH:mm")}`
                          : `Borrowed ${tx.borrowTime ? format(tx.borrowTime.toDate(), "MMM dd, HH:mm") : 'Pending'}`
                        }
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        {tx.status === 'returned' ? (
                          <div className="inline-flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 bg-green-500/5 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest border border-accent/20 bg-accent/5 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Active
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
