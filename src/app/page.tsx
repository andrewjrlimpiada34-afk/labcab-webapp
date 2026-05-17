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
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
                <LogIn className="w-4 h-4 mr-2" />
                System Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold mb-8 animate-pulse">
          <ShieldCheck className="w-4 h-4" />
          <span>System Online: LabCab 2.5</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-bold mb-6 max-w-5xl font-headline leading-tight tracking-tighter">
          Modern Control for Your <span className="text-accent">LabCab</span> Ecosystem
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mb-12 font-light">
          A precision-engineered portal for scholars and facilitators to track equipment, monitor real-time stock, and secure laboratory assets.
        </p>

        <div className="w-full max-w-md">
          <Link href="/login" className="group">
            <div className="h-full p-10 rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-md hover:border-accent/50 transition-all duration-500 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-48 h-48 text-accent" />
              </div>
              <h3 className="text-3xl font-bold mb-3 font-headline group-hover:text-accent transition-colors">Enter Secure Portal</h3>
              <p className="text-muted-foreground mb-8 text-lg font-light leading-relaxed">Authenticate to access your dashboard and manage laboratory credentials.</p>
              <div className="flex items-center justify-center text-accent font-bold text-lg">
                Sign In Now <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm font-medium">
          &copy; {new Date().getFullYear()} LabCab. Precision Laboratory Systems.
        </div>
      </footer>
    </div>
  );
}