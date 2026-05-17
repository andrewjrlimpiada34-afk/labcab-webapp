
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
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
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { normalizeUserProfile } from "@/lib/user-profile";

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
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        unsubscribeUser = onSnapshot(
          doc(db, "users", user.uid),
          (userDoc) => {
            if (!userDoc.exists()) {
              router.push("/login");
              return;
            }

            const data = normalizeUserProfile(userDoc.data(), user);
            if (data.role === role) {
              setAuthorized(true);
              setUserData(data);
            } else {
              router.push(data.role === "admin" ? "/admin/dashboard" : "/borrower/dashboard");
            }

            setLoading(false);
          },
          (err) => {
            console.error("Auth check failed:", err);
            router.push("/login");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUser) unsubscribeUser();
    };
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
      } else {
        throw new Error(data?.error?.message || "No image URL returned from Cloudinary.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error?.message || "Could not upload to Cloudinary.",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
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
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-muted-foreground font-headline animate-pulse tracking-widest text-xs uppercase">Connecting to LabCab Hub...</p>
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
        isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72 lg:translate-x-0",
        !isSidebarOpen ? "lg:w-20" : "lg:w-72"
      )}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-10 bg-accent text-white rounded-full p-1 border border-border hover:scale-110 transition-transform z-[80]"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div
          className={cn(
            "p-8 flex items-center shrink-0 transition-all duration-300",
            !isSidebarOpen && "lg:h-0 lg:px-0 lg:py-0 lg:opacity-0 lg:overflow-hidden"
          )}
        >
          <Logo className="h-10 transition-all duration-300" />
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        {/* Profile Identity Card */}
        <div
          className={cn(
            "px-6 mb-4 shrink-0",
            !isSidebarOpen && "lg:hidden"
          )}
        >
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border transition-all duration-300",
            !isSidebarOpen && "lg:justify-center lg:px-2"
          )}>
            <div className="relative group/avatar shrink-0">
              <Avatar className="w-12 h-12 border-2 border-accent shadow-inner">
                {userData?.profilePic && (
                  <AvatarImage key={userData.profilePic} src={userData.profilePic} className="object-cover" />
                )}
                <AvatarFallback className="bg-accent/20 text-accent text-xs font-bold">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (role === 'admin' ? 'AD' : 'BR')}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 cursor-pointer rounded-full transition-all duration-200 backdrop-blur-[2px]">
                <Camera size={14} className="text-white" />
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
                  {userData?.name || (role === 'admin' ? 'Lab Facilitator' : 'Scholar')}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-accent font-bold">
                  {role === 'admin' ? 'Facilitator' : 'Borrower'}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav
          className={cn(
            "flex-1 px-4 py-4 space-y-2 overflow-y-auto transition-all duration-300",
            !isSidebarOpen && "lg:flex lg:flex-col lg:justify-center lg:items-start lg:gap-3 lg:space-y-0 lg:overflow-hidden"
          )}
        >
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer border border-transparent",
                !isSidebarOpen && "lg:w-12 lg:h-12 lg:px-0 lg:py-0 lg:justify-center",
                pathname === item.href 
                  ? "bg-accent/10 text-accent border-accent/20 shadow-[0_0_15px_rgba(255,136,0,0.1)]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
              )}>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", pathname === item.href && "text-accent")} />
                <span className={cn(
                  "font-bold text-sm transition-all duration-300 whitespace-nowrap",
                  !isSidebarOpen && "lg:opacity-0 lg:hidden"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "p-6 border-t border-border mt-auto shrink-0 transition-all duration-300",
            !isSidebarOpen && "lg:px-4"
          )}
        >
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 justify-start gap-4 rounded-2xl transition-all h-12",
              !isSidebarOpen && "lg:justify-center px-0"
            )}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={cn(!isSidebarOpen && "lg:hidden", "font-bold text-sm")}>Sign Out</span>
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="lg:hidden h-20 border-b border-border bg-card/50 backdrop-blur-xl flex items-center px-4 shrink-0 z-50">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
            <Menu size={24} />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-background to-background">
          <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
