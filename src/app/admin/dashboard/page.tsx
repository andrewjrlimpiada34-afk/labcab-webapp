
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { Transaction, Apparatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Package, 
  Activity, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Unlock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { detectTransactionAnomalies, AnomalyDetectionOutput } from "@/ai/flows/detect-transaction-anomalies";

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<Apparatus[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetectionOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await detectTransactionAnomalies({ transactions: transactions as any });
      setAnomalies(result);
      toast({
        title: "AI Analysis Complete",
        description: `Found ${result.anomalies.length} potential anomalies in recent logs.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not complete GenAI transaction analysis.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            <Button variant="outline" size="sm" onClick={runAiAnalysis} disabled={isAnalyzing} className="bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-accent-foreground transition-all">
              {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              AI Scan Anomalies
            </Button>
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

        {/* AI Insight Bar */}
        {anomalies && anomalies.anomalies.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-headline font-bold text-destructive">AI Anomaly Alerts</h4>
              <ul className="mt-2 space-y-1">
                {anomalies.anomalies.map((a, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-destructive/20 px-1 rounded mr-2">ID: {a.transactionId.slice(-6)}</span>
                    {a.reason}
                  </li>
                ))}
              </ul>
            </div>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setAnomalies(null)}>Dismiss</Button>
          </div>
        )}

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
