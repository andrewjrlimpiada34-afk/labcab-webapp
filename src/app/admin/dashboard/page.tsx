"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Transaction, Apparatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, 
  AlertTriangle, 
  Package, 
  Unlock, 
  ShieldCheck,
  TrendingUp,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<Apparatus[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Remove complex orderBy to avoid index requirement during dev
    const qTx = query(collection(db, "transactions"), limit(20));
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      // Safe sorting client-side
      const sorted = docs.sort((a, b) => {
        const tA = a.borrowTime?.toMillis?.() || 0;
        const tB = b.borrowTime?.toMillis?.() || 0;
        return tB - tA;
      });
      setTransactions(sorted.slice(0, 10));
    });

    const qInv = query(collection(db, "apparatus"));
    const unsubscribeInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Apparatus)));
    });

    return () => {
      unsubscribeTx();
      unsubscribeInv();
    };
  }, []);

  const remoteUnlock = async (cabinetId: string) => {
    try {
      await addDoc(collection(db, "system_logs"), {
        type: "remote_unlock",
        cabinetId,
        adminEmail: "admin@labkiosk.pro",
        timestamp: serverTimestamp(),
      });
      toast({
        title: "Remote Unlock Activated",
        description: `Signal sent to Cabinet #${cabinetId}. Access granted.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const lowStock = inventory.filter(i => i.stock < 5);
  const activeCount = transactions.filter(t => t.status === 'active').length;

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-3 text-white tracking-tight leading-none">
              Welcome, <span className="text-primary italic">Admin!</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl font-light">
              Laboratory Command Center: Monitoring real-time inventory and security protocols.
            </p>
          </div>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => remoteUnlock("CAB-01")} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl h-14 px-8 font-bold text-base transition-all hover:scale-105 active:scale-95">
              <Unlock className="w-5 h-5 mr-3" />
              Master Override
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/40 border-primary/10 hover:border-primary/30 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Active Borrows</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold font-headline mb-1">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Concurrent check-outs</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-destructive/10 hover:border-destructive/30 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Stock Alerts</CardTitle>
              <div className={cn("p-2 rounded-lg", lowStock.length > 0 ? "bg-destructive/10 animate-pulse" : "bg-muted/10")}>
                <AlertTriangle className={lowStock.length > 0 ? "h-5 w-5 text-destructive" : "h-5 w-5 text-muted-foreground"} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={cn("text-5xl font-bold font-headline mb-1", lowStock.length > 0 ? "text-destructive" : "")}>
                {lowStock.length}
              </div>
              <p className="text-xs text-muted-foreground">Critical replenishment required</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-accent/10 hover:border-accent/30 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Total Assets</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Package className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold font-headline mb-1">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">Registered apparatus</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-green-500/10 hover:border-green-500/30 transition-all duration-500 backdrop-blur-xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">System Health</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold font-headline text-green-400 mb-1">100%</div>
              <p className="text-xs text-muted-foreground">Encrypted & Operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables Container */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Live Feed */}
          <Card className="xl:col-span-8 border-border/50 bg-card/10 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/10 px-8 py-6">
              <div>
                <CardTitle className="font-headline text-2xl">Real-Time Activity</CardTitle>
                <CardDescription className="text-sm">Live equipment transaction stream</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="border-primary/20 hover:bg-primary/5 rounded-xl px-5">
                <Link href="/admin/transactions" className="flex items-center gap-2">
                  <TrendingUp size={14} /> Full Log
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-bold py-5 pl-8 uppercase tracking-widest text-[10px]">Borrower</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-[10px]">Apparatus</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-[10px]">Time</TableHead>
                      <TableHead className="font-bold pr-8 text-right uppercase tracking-widest text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id} className="border-border/50 hover:bg-primary/5 transition-colors group">
                        <TableCell className="font-bold py-5 pl-8 group-hover:text-primary transition-colors">{tx.userName}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[250px] text-sm">
                          {tx.items.map(i => i.name).join(", ")}
                        </TableCell>
                        <TableCell className="text-sm font-mono opacity-60">
                          {tx.borrowTime ? format(tx.borrowTime.toDate(), "HH:mm:ss") : "..."}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge 
                            className={cn(
                              "px-3 py-1 font-bold tracking-tighter rounded-md",
                              tx.status === 'active' 
                                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(26,163,255,0.2)]" 
                                : "bg-muted text-muted-foreground border border-border"
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
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <Card className="xl:col-span-4 border-border/50 bg-card/10 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/10 px-8 py-6">
              <div>
                <CardTitle className="font-headline text-2xl">Inventory</CardTitle>
                <CardDescription className="text-sm">Critical asset levels</CardDescription>
              </div>
              <Button variant="ghost" size="icon" asChild className="hover:bg-accent/10 hover:text-accent rounded-full">
                <Link href="/admin/inventory"><Package size={18} /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-bold py-5 pl-8 uppercase tracking-widest text-[10px]">Asset</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px]">Stock</TableHead>
                    <TableHead className="font-bold pr-8 text-right uppercase tracking-widest text-[10px]">Pulse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.slice(0, 8).map(item => (
                    <TableRow key={item.id} className="border-border/50 hover:bg-accent/5 transition-colors">
                      <TableCell className="font-bold py-5 pl-8 text-sm">{item.name}</TableCell>
                      <TableCell className="font-mono font-bold">{item.stock}</TableCell>
                      <TableCell className="text-right pr-8">
                        <div className={cn(
                          "inline-block w-2.5 h-2.5 rounded-full shadow-lg",
                          item.stock < 5 ? "bg-destructive animate-ping shadow-destructive/50" : "bg-accent shadow-accent/50"
                        )} />
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
