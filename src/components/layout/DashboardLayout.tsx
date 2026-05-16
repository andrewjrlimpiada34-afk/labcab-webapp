"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Beaker, 
  LayoutDashboard, 
  History, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Package,
  ClipboardList,
  BarChart3,
  Unlock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth, db } from "@/firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'borrower' | 'admin';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === role) {
            setAuthorized(true);
          } else {
            // Mismatch: redirect to appropriate dashboard
            router.push(userData.role === 'admin' ? "/admin/dashboard" : "/borrower/dashboard");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [role, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const menuItems = role === 'borrower' 
    ? [
        { icon: LayoutDashboard, label: "Overview", href: "/borrower/dashboard" },
        { icon: History, label: "History", href: "/borrower/history" },
        { icon: Bell, label: "Notifications", href: "/borrower/notifications" },
      ]
    : [
        { icon: LayoutDashboard, label: "Command Hub", href: "/admin/dashboard" },
        { icon: Package, label: "Inventory", href: "/admin/inventory" },
        { icon: ClipboardList, label: "Transactions", href: "/admin/transactions" },
        { icon: BarChart3, label: "Reports", href: "/admin/reports" },
        { icon: Unlock, label: "Remote Control", href: "/admin/unlock" },
      ];

  if (!mounted || loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-headline animate-pulse">Verifying Credentials...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button size="icon" variant="outline" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-card">
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-50 h-screen transition-all duration-300 ease-in-out border-r border-border bg-card flex flex-col shrink-0",
        isSidebarOpen ? "w-64 translate-x-0" : "w-0 lg:w-20 -translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Beaker className="w-6 h-6 text-primary" />
          </div>
          <span className={cn(
            "font-headline font-bold text-lg whitespace-nowrap transition-opacity",
            !isSidebarOpen && "lg:opacity-0"
          )}>
            LabKiosk <span className="text-primary">Pro</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group cursor-pointer",
                pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={cn(
                  "font-medium transition-opacity",
                  !isSidebarOpen && "lg:opacity-0"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-secondary/30",
            !isSidebarOpen && "lg:justify-center"
          )}>
            <Avatar className="w-9 h-9 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {role === 'admin' ? 'AD' : 'BR'}
              </AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{auth.currentUser?.displayName || (role === 'admin' ? 'Lab Admin' : 'Scholar')}</p>
                <p className="text-xs text-muted-foreground truncate">{role === 'admin' ? 'Facilitator' : 'Borrower'}</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full mt-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 justify-start gap-3",
              !isSidebarOpen && "lg:justify-center px-0"
            )}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={cn(!isSidebarOpen && "lg:hidden")}>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
