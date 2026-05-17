
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth, db } from "@/firebase/config";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Transaction, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle, CheckCircle2, Package, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function BorrowerDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Fetch User Profile for first name
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      }
    };
    fetchUser();

    // Fetch Transactions
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("borrowTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const firstName = userData?.name?.split(' ')[0] || 'Scholar';
  const activeTransactions = transactions.filter(t => t.status === 'active');
  const overdueCount = activeTransactions.filter(t => new Date(t.deadline) < new Date()).length;

  if (loading) {
    return (
      <DashboardLayout role="borrower">
        <div className="h-full flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-headline animate-pulse">Loading Workspace...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="borrower">
      <div className="flex flex-col gap-10">
        <div className="border-b border-border/50 pb-8">
          <h1 className="text-5xl font-bold font-headline mb-3 text-white tracking-tight">
            Welcome back, <span className="text-primary">{firstName}!</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            You have <span className="text-primary font-semibold">{activeTransactions.length} items</span> currently checked out.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/20 border-primary/20 hover:border-primary/50 transition-all backdrop-blur-sm group">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">In Possession</CardTitle>
              <Package className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline">{activeTransactions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active lab apparatus</p>
            </CardContent>
          </Card>
          <Card className={cn(
            "bg-card/20 border-destructive/20 transition-all backdrop-blur-sm group",
            overdueCount > 0 ? "border-destructive/50" : ""
          )}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Action Required</CardTitle>
              <AlertTriangle className={cn(
                "h-5 w-5 transition-transform group-hover:scale-110",
                overdueCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-4xl font-bold font-headline", overdueCount > 0 ? "text-destructive" : "")}>
                {overdueCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overdue equipment</p>
            </CardContent>
          </Card>
          <Card className="bg-card/20 border-green-500/20 hover:border-green-500/50 transition-all backdrop-blur-sm group">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reliability Score</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline">98%</div>
              <p className="text-xs text-muted-foreground mt-1">Consistent return rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Items Table */}
        <Card className="border-border/50 bg-card/10 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-secondary/10 border-b border-border/50 px-6 py-5">
            <CardTitle className="font-headline text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              Current Borrowings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeTransactions.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-card/5">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="text-lg font-light">No equipment currently borrowed.</p>
                <p className="text-sm">Visit the laboratory kiosk to check out apparatus.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="py-4 font-bold">Apparatus</TableHead>
                    <TableHead className="font-bold">Borrowed On</TableHead>
                    <TableHead className="font-bold">Due Date</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTransactions.map((tx) => {
                    const isOverdue = new Date(tx.deadline) < new Date();
                    return (
                      <TableRow key={tx.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                        <TableCell className="font-bold py-5">
                          {tx.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(tx.borrowTime.toDate(), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className={cn("font-semibold", isOverdue ? "text-destructive" : "text-primary")}>
                          {format(new Date(tx.deadline), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <Badge variant="destructive" className="animate-pulse shadow-lg shadow-destructive/20">OVERDUE</Badge>
                          ) : (
                            <Badge variant="outline" className="border-primary/50 text-primary">In Use</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* History Preview */}
        <div className="space-y-4">
          <h3 className="text-xl font-headline font-semibold px-1">Recent Activity History</h3>
          <Card className="border-border/50 bg-card/5">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {transactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-muted/20">
                      <TableCell className="py-4 font-medium text-sm">
                        {tx.items.map(i => i.name).join(", ")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {tx.status === 'returned' && tx.returnTime 
                          ? `Returned ${format(tx.returnTime.toDate(), "MMM dd")}`
                          : `Borrowed ${format(tx.borrowTime.toDate(), "MMM dd")}`
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.status === 'returned' ? (
                          <div className="inline-flex items-center gap-1.5 text-green-500 text-xs font-bold uppercase tracking-tighter">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-tighter">
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
