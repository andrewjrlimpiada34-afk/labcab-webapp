
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Mail, BookOpen, Save, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { normalizeUserProfile } from "@/lib/user-profile";

export default function BorrowerProfile() {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "",
  });

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        unsubscribeUser = onSnapshot(
          doc(db, "users", user.uid),
          (userDoc) => {
            if (!userDoc.exists()) {
              setLoading(false);
              return;
            }

            const data = normalizeUserProfile(userDoc.data(), user);
            setUserData(data);
            setFormData({
              name: data.name || "",
              email: data.email || "",
              course: data.course || "",
            });
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching profile:", err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error fetching profile:", err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: formData.name,
        email: formData.email,
        course: formData.course,
      });

      toast({
        title: "Profile Updated",
        description: "Your information has been successfully saved to the system.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not synchronize profile data.",
      });
    } finally {
      setSaving(false);
    }
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
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();

      if (data.secure_url) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          profilePic: data.secure_url
        });
        setUserData(prev => prev ? { ...prev, profilePic: data.secure_url } : null);
        toast({
          title: "Picture Uploaded",
          description: "Your profile image has been updated.",
        });
      } else {
        throw new Error(data?.error?.message || "No image URL returned from Cloudinary.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error?.message || "Cloudinary error occurred.",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="borrower">
        <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="borrower">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold font-headline mb-3 text-white">Profile Settings</h1>
          <p className="text-muted-foreground text-lg font-light">
            Manage your personal laboratory credentials and academic information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Avatar Section */}
          <Card className="lg:col-span-1 border-border/50 bg-card/10 backdrop-blur-xl rounded-3xl overflow-hidden h-fit">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Identity Card</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pt-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-2xl">
                  {userData?.profilePic && <AvatarImage key={userData.profilePic} src={userData.profilePic} className="object-cover" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {userData?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-all duration-300 backdrop-blur-sm">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="text-white w-6 h-6" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} disabled={isUploading} />
                </label>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-white">{userData?.name}</h3>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">{userData?.role}</p>
              </div>
              <div className="w-full pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="truncate">{userData?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{userData?.course || "Course not set"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="lg:col-span-2 border-border/50 bg-card/10 backdrop-blur-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Personal Information</CardTitle>
              <CardDescription>Update your contact details and academic department.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest opacity-60">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-background/40 border-border pl-10 focus:ring-primary"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest opacity-60">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-background/40 border-border pl-10 focus:ring-primary"
                        placeholder="email@university.edu"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course" className="text-xs font-bold uppercase tracking-widest opacity-60">Course / Department</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="course" 
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      className="bg-background/40 border-border pl-10 focus:ring-primary"
                      placeholder="e.g. BS in Chemistry"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="w-full md:w-auto px-10 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Synchronizing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
