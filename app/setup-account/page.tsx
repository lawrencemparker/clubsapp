'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgName = searchParams.get('org') || 'Your Organization';
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    // Simulate API call to Supabase to set the user's password
    setTimeout(() => {
      // In production: await supabase.auth.updateUser({ password: password })
      alert("Account activated successfully!");
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="glass-panel w-full max-w-md p-8 animate-fade-in relative z-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to CrystalGrid</h1>
        <p className="text-blue-100/60 text-sm">
          You have been invited to manage <br/>
          <span className="text-white font-bold text-lg">{orgName}</span>
        </p>
      </div>

      <form onSubmit={handleSetup} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 ml-1">Create Password</label>
          <input 
            type="password" 
            className="glass-input" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
          <input 
            type="password" 
            className="glass-input" 
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required 
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button bg-emerald-500/20 hover:bg-emerald-500/30 text-white font-bold py-3 mt-2"
        >
          {loading ? 'Activating Account...' : 'Activate Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-blue-100/40">
          By activating, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}

export default function SetupAccountPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="orb orb-1 !bg-emerald-600/20" />
        <div className="orb orb-3 !bg-teal-600/20" />
      </div>
      
      {/* Suspense is required for using useSearchParams in Next.js Client Components */}
      <Suspense fallback={<div className="text-white">Loading invite...</div>}>
        <SetupForm />
      </Suspense>
    </main>
  );
}