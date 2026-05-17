
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
  ChevronRight,
  Camera,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth, db } from "@/firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";

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
  const [userData, setUserData] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

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
          const data = userDoc.data() as User;
          if (data.role === role) {
            setAuthorized(true);
            setUserData(data);
          } else {
            router.push(data.role === 'admin' ? "/admin/dashboard" : "/borrower/dashboard");
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

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name') {
      toast({
        variant: "destructive",
        title: "Configuration Required",
        description: "Please set your Cloudinary environment variables.",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.secure_url) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          profilePic: data.secure_url
        });
        setUserData(prev => prev ? { ...prev, profilePic: data.secure_url } : null);
        toast({
          title: "Profile Updated",
          description: "Your picture has been synchronized.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload to Cloudinary.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const menuItems = role === 'borrower' 
    ? [
        { icon: LayoutDashboard, label: "Overview", href: "/borrower/dashboard" },
        { icon: History, label: "History", href: "/borrower/history" },
        { icon: Bell, label: "Notifications", href: "/borrower/notifications" },
        { icon: UserIcon, label: "Profile Settings", href: "/borrower/profile" },
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
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:relative z-[70] h-full transition-all duration-300 ease-in-out border-r border-border bg-card flex flex-col shrink-0",
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0",
        !isSidebarOpen ? "lg:w-20" : "lg:w-64"
      )}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 bg-primary text-primary-foreground rounded-full p-1 border border-border hover:scale-110 transition-transform z-[80]"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Beaker className="w-6 h-6 text-primary" />
          </div>
          <span className={cn(
            "font-headline font-bold text-lg whitespace-nowrap transition-all duration-300",
            !isSidebarOpen && "lg:opacity-0 lg:hidden"
          )}>
            LabKiosk <span className="text-primary">Pro</span>
          </span>
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        {/* Fixed Profile at top */}
        <div className="px-4 mb-2 shrink-0">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border transition-all duration-300",
            !isSidebarOpen && "lg:justify-center lg:px-2"
          )}>
            <div className="relative group/avatar shrink-0">
              <Avatar className="w-9 h-9 border border-border shadow-inner">
                {userData?.profilePic && (
                  <AvatarImage src={userData.profilePic} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : (role === 'admin' ? 'AD' : 'BR')}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 cursor-pointer rounded-full transition-all duration-200 backdrop-blur-[2px]">
                <Camera size={12} className="text-white" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleProfilePicUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate leading-none mb-1 text-white">
                  {userData?.name || (role === 'admin' ? 'Lab Admin' : 'Scholar')}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                  {role === 'admin' ? 'Facilitator' : 'Borrower'}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
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

        <div className="p-4 border-t border-border mt-auto shrink-0">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 justify-start gap-3 rounded-xl transition-all",
              !isSidebarOpen && "lg:justify-center px-0"
            )}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={cn(!isSidebarOpen && "lg:hidden", "font-medium")}>Sign Out</span>
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="lg:hidden h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center px-4 shrink-0 z-50">
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
