
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
  TrendingUp
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
    const qTx = query(collection(db, "transactions"), orderBy("borrowTime", "desc"), limit(10));
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8">
          <div>
            <h1 className="text-5xl font-bold font-headline mb-3 text-white tracking-tight">
              Welcome, <span className="text-primary">Admin!</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl font-light">
              Laboratory Command Center: Monitoring real-time inventory and security protocols.
            </p>
          </div>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => remoteUnlock("CAB-01")} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Unlock className="w-5 h-5 mr-2" />
              Master Override
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/30 border-primary/10 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Borrows</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-destructive/10 hover:border-destructive/30 transition-all duration-300 backdrop-blur-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stock Alerts</CardTitle>
              <AlertTriangle className={lowStock.length > 0 ? "h-5 w-5 text-destructive animate-pulse" : "h-5 w-5 text-muted-foreground"} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-4xl font-bold font-headline", lowStock.length > 0 ? "text-destructive" : "")}>
                {lowStock.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-accent/10 hover:border-accent/30 transition-all duration-300 backdrop-blur-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Assets</CardTitle>
              <Package className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline">{inventory.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-green-500/10 hover:border-green-500/30 transition-all duration-300 backdrop-blur-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Health</CardTitle>
              <ShieldCheck className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline text-green-400">100%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Container */}
        <div className="grid grid-cols-1 xl:grid-cols-7 gap-8">
          {/* Live Feed */}
          <Card className="xl:col-span-4 border-border/50 bg-card/20 overflow-hidden backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/10 px-6 py-5">
              <div>
                <CardTitle className="font-headline text-xl">Real-Time Activity</CardTitle>
                <CardDescription>Live equipment transaction stream</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="border-primary/20 hover:bg-primary/5">
                <Link href="/admin/transactions">View Archive</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-bold py-4">Borrower</TableHead>
                    <TableHead className="font-bold">Equipments</TableHead>
                    <TableHead className="font-bold">Time</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-semibold">{tx.userName}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]">
                        {tx.items.map(i => i.name).join(", ")}
                      </TableCell>
                      <TableCell className="text-sm font-mono opacity-80">
                        {format(tx.borrowTime.toDate(), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tx.status === 'active' ? "default" : "secondary"} 
                          className={cn(
                            "px-3 py-1",
                            tx.status === 'active' ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {tx.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <Card className="xl:col-span-3 border-border/50 bg-card/20 overflow-hidden backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/10 px-6 py-5">
              <div>
                <CardTitle className="font-headline text-xl">Inventory Status</CardTitle>
                <CardDescription>Critical asset levels</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/inventory" className="text-accent hover:text-accent hover:bg-accent/10">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-bold py-4">Asset</TableHead>
                    <TableHead className="font-bold">Stock</TableHead>
                    <TableHead className="font-bold text-right">Indicator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.slice(0, 8).map(item => (
                    <TableRow key={item.id} className="border-border/50 hover:bg-accent/5 transition-colors">
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell className="font-mono">{item.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "inline-block w-3 h-3 rounded-full shadow-lg shadow-black/50",
                          item.stock < 5 ? "bg-destructive animate-pulse shadow-destructive/50" : "bg-accent shadow-accent/50"
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
