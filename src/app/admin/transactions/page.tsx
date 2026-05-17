"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList, CheckCircle2, Clock, Filter, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("borrowTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => unsubscribe();
  }, []);

  const handleReturn = async (txId: string) => {
    try {
      await updateDoc(doc(db, "transactions", txId), {
        status: "returned",
        returnTime: serverTimestamp(),
      });
      toast({
        title: "Item Returned",
        description: "Transaction has been updated to returned status.",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update transaction." });
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-primary">Transaction Logs</h1>
            <p className="text-muted-foreground">Complete history of all laboratory equipment movements.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              placeholder="Search by user or equipment..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <Card className="border-border/50 bg-card/10 backdrop-blur-3xl overflow-hidden rounded-3xl">
          <CardHeader className="border-b border-border/50 bg-secondary/10 px-8 py-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-primary" />
              <CardTitle className="font-headline">Master Activity Log</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="border-border/50">
                    <TableHead className="py-5 pl-8 font-bold uppercase tracking-widest text-[10px]">Borrower</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px]">Equipment</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px]">Borrowed</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px]">Deadline</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="pr-8 text-right font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 opacity-50" />
                          <span className="font-bold">{tx.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                      </TableCell>
                      <TableCell className="text-xs font-mono opacity-60">
                        {format(tx.borrowTime.toDate(), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {format(new Date(tx.deadline), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tx.status === 'active' ? "default" : "secondary"}
                          className={cn(
                            "rounded-md font-bold px-3 py-1",
                            tx.status === 'active' ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {tx.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        {tx.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReturn(tx.id)}
                            className="border-primary/20 hover:bg-primary/10 hover:text-primary rounded-lg text-[10px] h-8"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Returned
                          </Button>
                        )}
                        {tx.status === 'returned' && tx.returnTime && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Ret: {format(tx.returnTime.toDate(), "HH:mm")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
