"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Transaction, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Loader2, 
  Calendar, 
  History,
  Bell,
  ArrowRight
} from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      if (!deadline) return;
      const target = new Date(deadline);
      const now = new Date();
      
      if (isAfter(now, target)) {
        setIsOverdue(true);
        setTimeLeft(formatDistanceToNow(target) + " ago");
      } else {
        setIsOverdue(false);
        setTimeLeft(formatDistanceToNow(target, { addSuffix: false }));
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return <span className="text-[10px] opacity-40">Calculating...</span>;

  return (
    <div className={cn(
      "flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider",
      isOverdue ? "text-destructive animate-pulse" : "text-primary"
    )}>
      <Clock className="w-3 h-3" />
      {isOverdue ? "OVERDUE: " : "DUE IN: "}
      {timeLeft}
    </div>
  );
}

export default function BorrowerDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const getGreeting = () => {
    if (!currentTime) return "Welcome";
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Night";
  };

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }

        // Transactions listener
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", user.uid)
        );

        unsubscribeSnap = onSnapshot(
          q,
          (snapshot) => {
            const docs = snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              } as Transaction)
            );

            const sortedDocs = docs.sort((a, b) => {
              const timeA = a.borrowTime?.toMillis?.() || 0;
              const timeB = b.borrowTime?.toMillis?.() || 0;
              return timeB - timeA;
            });

            setTransactions(sortedDocs);
            setLoading(false);
          },
          (error) => {
            console.error("Dashboard Error:", error);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeSnap) {
        unsubscribeSnap();
      }

      clearInterval(clockTimer);
    };
  }, []);

  const firstName = userData?.name?.split(' ')[0] || 'Scholar';
  const activeTransactions = transactions.filter(t => t.status === 'active');
  const overdueCount = currentTime ? activeTransactions.filter(t => t.deadline && new Date(t.deadline) < currentTime).length : 0;

  return (
    <DashboardLayout role="borrower">
      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-headline animate-pulse uppercase tracking-[0.2em] text-xs">Accessing Workspace...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="pb-2">
              <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-white tracking-tight leading-tight">
                {getGreeting()}, <span className="text-primary italic">{firstName}!</span>
              </h1>
              <p className="text-muted-foreground text-lg font-light max-w-2xl">
                System active. You have <span className="text-primary font-bold">{activeTransactions.length} items</span> in your possession.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-secondary/20 border border-border/50 p-4 rounded-2xl backdrop-blur-md h-fit">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Current Session</p>
                <p className="text-sm font-mono font-bold text-white">
                  {currentTime ? format(currentTime, "MMM dd, yyyy | HH:mm") : "..."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/40 border-primary/20 hover:border-primary/50 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Active Assets</CardTitle>
                <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-5xl font-bold font-headline mb-1">{activeTransactions.length}</div>
                <p className="text-xs text-muted-foreground font-medium">Items currently checked out</p>
              </CardContent>
            </Card>

            <Card className={cn(
              "bg-card/40 border-destructive/20 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative rounded-3xl",
              overdueCount > 0 ? "border-destructive/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : ""
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Action Needed</CardTitle>
                <div className={cn(
                  "p-3 rounded-2xl transition-transform group-hover:scale-110",
                  overdueCount > 0 ? "bg-destructive/20 animate-pulse" : "bg-muted/10"
                )}>
                  <AlertTriangle className={cn(
                    "h-6 w-6",
                    overdueCount > 0 ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={cn("text-5xl font-bold font-headline mb-1", overdueCount > 0 ? "text-destructive" : "")}>
                  {overdueCount}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Overdue apparatus alerts</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-accent/20 hover:border-accent/50 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">System Alerts</CardTitle>
                <div className="p-3 bg-accent/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-5xl font-bold font-headline mb-1">2</div>
                <p className="text-xs text-muted-foreground font-medium">Unread notifications</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <Card className="xl:col-span-8 border-border/50 bg-card/10 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] shadow-2xl border-l-4 border-l-primary/30">
              <CardHeader className="bg-secondary/10 border-b border-border/50 px-8 py-7 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl flex items-center gap-4">Items Borrowed</CardTitle>
                  <CardDescription>Live tracking of assets in your possession</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 font-bold rounded-xl">
                  LIVE STATUS
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {activeTransactions.length === 0 ? (
                  <div className="text-center py-24 text-muted-foreground bg-card/5">
                    <Package className="w-16 h-16 mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-light">Laboratory inventory clear.</p>
                    <Button variant="link" className="text-primary mt-2" asChild>
                      <Link href="/borrower/history">View past usage &rarr;</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="py-5 pl-10 font-bold uppercase tracking-widest text-[10px]">Apparatus</TableHead>
                          <TableHead className="font-bold uppercase tracking-widest text-[10px]">Timeline</TableHead>
                          <TableHead className="font-bold pr-10 text-right uppercase tracking-widest text-[10px]">Remaining Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTransactions.map((tx) => (
                          <TableRow key={tx.id} className="border-border/30 hover:bg-primary/5 transition-colors group">
                            <TableCell className="font-bold py-8 pl-10">
                              <div className="text-lg text-white group-hover:text-primary transition-colors">
                                {tx.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-1 opacity-50">
                                ID: {tx.id.toUpperCase().slice(0, 10)}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-medium">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="w-12 text-[10px] uppercase opacity-40">Start</span>
                                  <span className="font-mono">
                                    {tx.borrowTime ? format(tx.borrowTime.toDate(), "MMM dd, HH:mm") : "..."}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="w-12 text-[10px] uppercase opacity-40">End</span>
                                  <span className="font-mono text-primary/80">
                                    {tx.deadline ? format(new Date(tx.deadline), "MMM dd, HH:mm") : "..."}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-10">
                              {tx.deadline && <CountdownTimer deadline={tx.deadline} />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="xl:col-span-4 space-y-8">
              <Card className="border-border/50 bg-card/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl">
                <CardHeader className="bg-secondary/5 border-b border-border/50 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-headline text-xl">Recent Alerts</CardTitle>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary" asChild>
                      <Link href="/borrower/notifications"><Bell size={18} /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    <div className="p-6 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex gap-4">
                        <div className="w-1 bg-primary rounded-full group-hover:w-1.5 transition-all" />
                        <div>
                          <p className="text-sm font-bold text-white mb-1">Approaching Deadline</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">Your check-out is due soon. Please verify your equipment status.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl border-l-4 border-l-accent/30">
                <CardHeader className="bg-secondary/5 border-b border-border/50 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-headline text-xl">Past Sessions</CardTitle>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent" asChild>
                      <Link href="/borrower/history"><History size={18} /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {transactions.filter(t => t.status === 'returned').slice(0, 3).map((tx) => (
                      <div key={tx.id} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono opacity-40 uppercase tracking-widest">
                            {tx.borrowTime ? format(tx.borrowTime.toDate(), "MMM dd") : "..."}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50" />
                        </div>
                        <p className="text-sm font-bold text-white truncate">{tx.items.map(i => i.name).join(", ")}</p>
                      </div>
                    ))}
                    <Link href="/borrower/history" className="flex items-center justify-center p-4 text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:bg-primary/5 transition-colors group">
                      View Full History <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
