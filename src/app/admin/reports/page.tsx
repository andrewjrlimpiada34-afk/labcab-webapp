
"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/firebase/config";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Filter, Loader2, BarChart3, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/lib/types";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function AdminReports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReport = async (type: 'csv' | 'json', range: 'day' | 'week' | 'month') => {
    setIsGenerating(true);
    try {
      const days = range === 'day' ? 1 : range === 'week' ? 7 : 30;
      const startDate = startOfDay(subDays(new Date(), days));
      
      const q = query(
        collection(db, "transactions"),
        where("borrowTime", ">=", Timestamp.fromDate(startDate)),
        orderBy("borrowTime", "desc")
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (type === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_report_${range}_${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
      } else {
        const headers = ["ID", "User", "Items", "Status", "BorrowTime", "Deadline"];
        const rows = data.map((t: any) => [
          t.id,
          t.userName,
          t.items.map((i: any) => i.name).join("; "),
          t.status,
          t.borrowTime.toDate().toISOString(),
          t.deadline
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_report_${range}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      }

      toast({
        title: "Report Exported",
        description: `Successfully generated ${type.toUpperCase()} report for the past ${range}.`,
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Report Error", description: "Could not generate system report." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2">Automated Reports</h1>
          <p className="text-muted-foreground">Export laboratory activity data for audit and analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-2">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Operational Summary</span>
              </div>
              <CardTitle className="text-2xl font-headline">Daily Pulse</CardTitle>
              <CardDescription>Summary of the last 24 hours of laboratory activity.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => generateReport('csv', 'day')} disabled={isGenerating} variant="outline" className="justify-between">
                Export as CSV <Download className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => generateReport('json', 'day')} disabled={isGenerating} variant="ghost" className="justify-between text-muted-foreground hover:text-foreground">
                Download JSON <FileText className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-l-4 border-l-accent">
            <CardHeader>
              <div className="flex items-center gap-2 text-accent mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Trend Analysis</span>
              </div>
              <CardTitle className="text-2xl font-headline">Weekly Review</CardTitle>
              <CardDescription>Comprehensive transaction history for the past week.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => generateReport('csv', 'week')} disabled={isGenerating} variant="outline" className="justify-between">
                Export as CSV <Download className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => generateReport('json', 'week')} disabled={isGenerating} variant="ghost" className="justify-between text-muted-foreground hover:text-foreground">
                Download JSON <FileText className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-l-4 border-l-muted-foreground">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CalendarIcon className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Strategic Audit</span>
              </div>
              <CardTitle className="text-2xl font-headline">Monthly Archive</CardTitle>
              <CardDescription>Detailed long-term record for laboratory inventory audits.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => generateReport('csv', 'month')} disabled={isGenerating} variant="outline" className="justify-between">
                Export as CSV <Download className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => generateReport('json', 'month')} disabled={isGenerating} variant="ghost" className="justify-between text-muted-foreground hover:text-foreground">
                Download JSON <FileText className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {isGenerating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h3 className="text-xl font-headline font-bold">Compiling System Data...</h3>
              <p className="text-muted-foreground">Generating your secure laboratory report.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
