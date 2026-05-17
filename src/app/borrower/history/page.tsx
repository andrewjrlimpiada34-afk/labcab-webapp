"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function BorrowerHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid)
      );

      const unsubscribeSnap = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        
        // Safe sorting client-side
        const sortedDocs = docs.sort((a, b) => {
          const timeA = a.borrowTime?.toMillis?.() || 0;
          const timeB = b.borrowTime?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setTransactions(sortedDocs);
        setLoading(false);
      }, (error) => {
        console.error("History Snapshot Error:", error);
        setLoading(false);
      });

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="borrower">
        <div className="h-full flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="borrower">
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold font-headline mb-4 text-white">Apparatus History</h1>
          <p className="text-muted-foreground text-lg font-light">
            Review all your past and current laboratory equipment transactions.
          </p>
        </div>

        <Card className="border-border/50 bg-card/10 backdrop-blur-3xl overflow-hidden rounded-3xl shadow-2xl">
          <CardHeader className="bg-secondary/10 border-b border-border/50 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent/10 rounded-xl">
                <History className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="font-headline text-2xl">Activity Log</CardTitle>
                <CardDescription>Comprehensive record of your laboratory usage.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No transaction history found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="py-5 pl-8 font-bold uppercase tracking-widest text-[10px]">Apparatus</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-[10px]">Borrowed Date</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-[10px]">Return Date</TableHead>
                      <TableHead className="font-bold pr-8 text-right uppercase tracking-widest text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-border/50 hover:bg-accent/5 transition-colors group">
                        <TableCell className="py-7 pl-8">
                          <div className="font-bold text-base">
                            {tx.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-wider">
                            Transaction ID: {tx.id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 opacity-40" />
                            {tx.borrowTime ? format(tx.borrowTime.toDate(), "MMM dd, yyyy") : "Pending..."}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2 text-sm">
                            {tx.returnTime ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                                {format(tx.returnTime.toDate(), "MMM dd, yyyy")}
                              </>
                            ) : (
                              <span className="text-primary/50 font-bold italic">Active Session</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge 
                            variant={tx.status === 'active' ? "default" : "outline"}
                            className={cn(
                              "rounded-md font-bold px-3 py-1",
                              tx.status === 'active' 
                                ? "bg-primary/20 text-primary border-primary/30" 
                                : "border-muted text-muted-foreground"
                            )}
                          >
                            {tx.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
