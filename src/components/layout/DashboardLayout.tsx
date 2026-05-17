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
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth, db } from "@/firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'borrower' | 'admin';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
        <p className="text-muted-foreground font-headline animate-pulse tracking-widest text-xs uppercase">Verifying Laboratory Access...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-[70] h-screen transition-all duration-300 ease-in-out border-r border-border bg-card flex flex-col shrink-0",
        // Mobile behavior
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0",
        // Desktop behavior
        !isSidebarOpen ? "lg:w-20" : "lg:w-64"
      )}>
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 bg-primary text-primary-foreground rounded-full p-1 border border-border hover:scale-110 transition-transform z-[80]"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Beaker className="w-6 h-6 text-primary" />
          </div>
          <span className={cn(
            "font-headline font-bold text-lg whitespace-nowrap transition-all duration-300",
            !isSidebarOpen && "lg:opacity-0 lg:hidden"
          )}>
            LabKiosk <span className="text-primary">Pro</span>
          </span>
          {/* Close button for Mobile */}
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer border border-transparent",
                pathname === item.href 
                  ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(26,163,255,0.1)]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
              )}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={cn(
                  "font-medium transition-all duration-300 whitespace-nowrap",
                  !isSidebarOpen && "lg:opacity-0 lg:hidden"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border",
            !isSidebarOpen && "lg:justify-center lg:px-2"
          )}>
            <Avatar className="w-9 h-9 border border-border shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {role === 'admin' ? 'AD' : 'BR'}
              </AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate leading-none mb-1">
                  {auth.currentUser?.displayName || (role === 'admin' ? 'Lab Admin' : 'Scholar')}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {role === 'admin' ? 'Facilitator' : 'Borrower'}
                </p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full mt-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 justify-start gap-3 rounded-xl",
              !isSidebarOpen && "lg:justify-center px-0"
            )}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={cn(!isSidebarOpen && "lg:hidden", "font-medium")}>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Navbar Header */}
        <header className="lg:hidden h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center px-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="ml-3 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            <span className="font-headline font-bold">LabKiosk Pro</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
