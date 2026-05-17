
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogIn, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo className="h-10" />
          <div className="flex gap-4">
            <Link href="/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                <LogIn className="w-4 h-4 mr-2" />
                System Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold mb-8 animate-pulse">
          <ShieldCheck className="w-4 h-4" />
          <span>System Online: LabCab 2.0</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl font-headline leading-tight">
          Modern Control for Your <span className="text-primary">Lab Ecosystem</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mb-12 font-light">
          A high-performance portal for scholars and facilitators to track equipment, monitor stock, and secure laboratory assets in real-time.
        </p>

        <div className="w-full max-w-md">
          <Link href="/login" className="group">
            <div className="h-full p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-md hover:border-accent/50 transition-all duration-300 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-24 h-24 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2 font-headline group-hover:text-accent transition-colors">Enter Secure Portal</h3>
              <p className="text-muted-foreground mb-6">Authenticate to access your dashboard and manage laboratory credentials.</p>
              <div className="flex items-center justify-center text-accent font-bold">
                Sign In Now <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm font-medium">
          &copy; {new Date().getFullYear()} LabCab. Precision Laboratory Systems.
        </div>
      </footer>
    </div>
  );
}
