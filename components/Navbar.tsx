'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // Ensure this points to your client.ts

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);

  // Fetch real user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Not logged in

      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  
  const isActive = (path: string) => pathname === path 
    ? 'text-white bg-white/10 shadow-sm border border-white/10' 
    : 'text-slate-400 hover:text-white hover:bg-white/5';

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4">
      <div className="glass-panel w-full max-w-6xl px-4 py-3 rounded-2xl flex items-center justify-between border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-indigo-500/20 transition-all">
            C
          </div>
          <span className="font-bold text-lg tracking-tight text-white hidden md:block">CrystalGrid</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
          <Link href="/dashboard" className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
          <Link href="/directory" className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/directory')}`}>
            Directory
          </Link>
          <Link href="/events" className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/events')}`}>
            Events
          </Link>
        </div>

        {/* User Profile / Sign Out */}
        <div className="flex items-center gap-4">
          {profile ? (
            <>
              <div className="text-right hidden md:block">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {profile.role?.replace('_', ' ') || 'MEMBER'}
                </div>
                <div className="text-sm font-bold text-white leading-none">
                  {profile.full_name}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10 hover:border-white/30 transition-all flex items-center justify-center group relative overflow-hidden"
              >
                 <span className="font-bold text-sm text-white">
                   {getInitials(profile.full_name)}
                 </span>
                 <div className="absolute inset-0 bg-red-500/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold uppercase tracking-tighter">
                   Log Out
                 </div>
              </button>
            </>
          ) : (
            // Fallback while loading (Skeleton state)
            <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
          )}
        </div>

      </div>
    </nav>
  );
}