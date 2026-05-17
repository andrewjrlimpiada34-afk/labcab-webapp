
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, onSnapshot, doc, runTransaction, updateDoc } from "firebase/firestore";
import { Apparatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Minus, Package, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminInventory() {
  const [inventory, setInventory] = useState<Apparatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "apparatus"), (snapshot) => {
      setInventory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Apparatus)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStock = async (id: string, amount: number) => {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "apparatus", id);
        const snap = await tx.get(ref);
        const data = snap.data() as Partial<Apparatus> | undefined;
        const currentStock = typeof data?.stock === "number" ? data.stock : 0;
        const total = typeof data?.total === "number" ? data.total : undefined;

        const nextStock = currentStock + amount;
        if (nextStock < 0) throw new Error("Stock cannot be negative.");
        if (typeof total === "number" && nextStock > total) {
          throw new Error("Stock cannot exceed total.");
        }

        tx.update(ref, { stock: nextStock });
      });

      toast({ title: "Stock Updated", description: "The inventory has been synchronized successfully." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Could not update stock levels." });
    }
  };


  const filteredItems = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-accent">Inventory Pulse</h1>
            <p className="text-muted-foreground">Manage and track laboratory equipment availability.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by name or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              Equipment Registry
            </CardTitle>
            <CardDescription>Live stock levels across laboratory compartments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="hidden">Stock</TableHead>

                    <TableHead className="text-right">Actions</TableHead>


                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-secondary/10 group">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal tracking-wide bg-accent/5">
                          {item.category.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.total ?? 0}
                            onChange={(e) => {
                              const nextTotal = Number(e.target.value);
                              if (!Number.isFinite(nextTotal)) return;

                              const clampedTotal = nextTotal < 0 ? 0 : nextTotal;
                              if (clampedTotal < item.stock) {
                                toast({
                                  variant: "destructive",
                                  title: "Invalid total",
                                  description: "Total cannot be less than current stock.",
                                });
                                return;
                              }

                              updateDoc(doc(db, "apparatus", item.id), { total: clampedTotal }).catch(() => {
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: "Could not update total.",
                                });
                              });
                            }}
                            className="w-16 bg-card border-border"
                          />
                          <span className="text-muted-foreground font-bold">{"-"}</span>
                          <span className={item.stock < 5 ? "text-destructive font-bold animate-pulse" : "font-mono font-bold"}>
                            {item.stock}
                          </span>
                          {item.stock < 5 && <span className="text-[10px] text-destructive uppercase font-bold tracking-tighter">Low</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden" />


                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            onClick={() => updateStock(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full border-border hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                            onClick={() => updateStock(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
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
