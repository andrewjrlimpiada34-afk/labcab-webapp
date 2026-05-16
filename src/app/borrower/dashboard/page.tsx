
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth, db } from "@/firebase/config";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle, CheckCircle2, Package, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function BorrowerDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

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

  const activeTransactions = transactions.filter(t => t.status === 'active');
  const overdueCount = activeTransactions.filter(t => new Date(t.deadline) < new Date()).length;

  if (loading) {
    return (
      <DashboardLayout role="borrower">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="borrower">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2">Welcome back, {user?.displayName || 'Scholar'}</h1>
          <p className="text-muted-foreground">Monitoring your active equipment borrowings and deadlines.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeTransactions.length}</div>
              <p className="text-xs text-muted-foreground">Items currently with you</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-accent/50 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <AlertTriangle className={activeTransactions.some(t => new Date(t.deadline) < new Date()) ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} />
            </CardHeader>
            <CardContent>
              <div className={overdueCount > 0 ? "text-3xl font-bold text-destructive" : "text-3xl font-bold"}>
                {overdueCount}
              </div>
              <p className="text-xs text-muted-foreground">Past their return deadline</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-green-500/50 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Completed Returns</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{transactions.filter(t => t.status === 'returned').length}</div>
              <p className="text-xs text-muted-foreground">Total items successfully returned</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Items Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Active Borrows
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No active borrowings found. Visit a kiosk to borrow equipment.</p>
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/50">
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Borrowed On</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTransactions.map((tx) => {
                      const isOverdue = new Date(tx.deadline) < new Date();
                      return (
                        <TableRow key={tx.id} className="hover:bg-secondary/20">
                          <TableCell className="font-medium">
                            {tx.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(tx.borrowTime.toDate(), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className={isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}>
                            {format(new Date(tx.deadline), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive" className="animate-pulse">OVERDUE</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">Active</Badge>
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

        {/* Recent History Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-headline">Recent History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Action Date</TableHead>
                  <TableHead>Return Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-secondary/20">
                    <TableCell className="font-medium text-sm">
                      {tx.items.map(i => `${i.name}`).join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tx.status === 'returned' && tx.returnTime 
                        ? format(tx.returnTime.toDate(), "MMM dd, yyyy")
                        : format(tx.borrowTime.toDate(), "MMM dd, yyyy")
                      }
                    </TableCell>
                    <TableCell>
                      {tx.status === 'returned' ? (
                        <div className="flex items-center gap-1 text-green-500 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Returned
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-accent text-xs font-semibold">
                          <Clock className="w-3 h-3" /> In Use
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
    </DashboardLayout>
  );
}
