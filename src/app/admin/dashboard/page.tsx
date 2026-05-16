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
  ShieldCheck
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
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-headline mb-2 text-accent">Command Hub</h1>
            <p className="text-muted-foreground">Real-time laboratory cabinet operations and security monitoring.</p>
          </div>
          <div className="flex gap-3">
            <Button size="sm" onClick={() => remoteUnlock("CAB-01")} className="bg-primary hover:bg-primary/90">
              <Unlock className="w-4 h-4 mr-2" />
              Master Unlock
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
              <AlertTriangle className={lowStock.length > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} />
            </CardHeader>
            <CardContent>
              <div className={lowStock.length > 0 ? "text-3xl font-bold text-destructive" : "text-3xl font-bold"}>
                {lowStock.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">System Integrity</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">100%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Feed */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Live Transaction Feed</CardTitle>
                <CardDescription>Real-time monitor of equipment activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/transactions" className="text-xs">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id} className="hover:bg-secondary/10">
                      <TableCell className="font-medium text-xs">{tx.userName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {tx.items.map(i => i.name).join(", ")}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {format(tx.borrowTime.toDate(), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'active' ? "default" : "secondary"} className="text-[10px] h-5">
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
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Inventory Pulse</CardTitle>
                <CardDescription>Current stock levels across categories</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/inventory" className="text-xs">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Pulse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.slice(0, 8).map(item => (
                    <TableRow key={item.id} className="hover:bg-secondary/10">
                      <TableCell className="font-medium text-xs">{item.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="font-mono text-xs">{item.stock}</TableCell>
                      <TableCell>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          item.stock < 5 ? "bg-destructive animate-pulse" : "bg-accent"
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