import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemePicker from "@/components/ThemePicker";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CrystalGrid",
  description: "Organization Management Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Check User Role for Theme Picker Access
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let showThemePicker = false;
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    // ONLY Super Admins and Org Admins can see the picker
    if (profile?.role === 'super_admin' || profile?.role === 'org_admin') {
      showThemePicker = true;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen selection:bg-indigo-500/30`}>
        <Navbar />
        {children}
        {/* Only renders for Admins */}
        {showThemePicker && <ThemePicker />}
      </body>
    </html>
  );
}