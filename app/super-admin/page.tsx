'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// --- TYPES ---
interface Organization {
  id: number;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  fileCount: number;
  lastLogin: string;
  status: 'active' | 'suspended' | 'pending';
  storageLimitGB: number;
  storageUsedGB: number;
  monthlyFee: number;
  paymentStatus: 'good_standing' | 'past_due';
}

interface SuperAdmin {
  id: string; // UUID from Supabase
  name: string;
  email: string;
  role: 'owner' | 'super admin' | 'admin' | 'member';
  lastActive: string;
}

// --- MOCK ANALYTICS DATA ---
const REVENUE_DATA = [
  { month: 'Aug', value: 18500, height: '60%' },
  { month: 'Sep', value: 21000, height: '75%' },
  { month: 'Oct', value: 20500, height: '72%' },
  { month: 'Nov', value: 24200, height: '85%' },
  { month: 'Dec', value: 28500, height: '95%' },
  { month: 'Jan', value: 31250, height: '100%' },
];

const RECENT_TRANSACTIONS = [
  { id: 'tx_1', org: 'Miami Chess Club', amount: 250, date: 'Today, 2:30 PM', status: 'succeeded' },
  { id: 'tx_2', org: 'Austin Pickleball', amount: 250, date: 'Yesterday', status: 'succeeded' },
  { id: 'tx_3', org: 'Denver Hiking', amount: 150, date: 'Feb 12', status: 'failed' },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // --- AUTH & LOADING STATE ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false); 
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);

  // Data States
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [adminError, setAdminError] = useState('');

  // New Admin Form State
  const [newAdminData, setNewAdminData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '' 
  });

  // --- MOCK ORGS (Static) ---
  const [orgs, setOrgs] = useState<Organization[]>([
    {
      id: 1,
      name: "Miami Chess Club",
      contactName: "Sarah Connor",
      contactEmail: "sarah@chessmiami.com",
      contactPhone: "305-555-0123",
      address: "123 Biscayne Blvd",
      city: "Miami",
      state: "FL",
      zip: "33132",
      fileCount: 1240,
      lastLogin: "Today, 9:00 AM",
      status: 'active',
      storageLimitGB: 50,
      storageUsedGB: 12.4,
      monthlyFee: 250,
      paymentStatus: 'good_standing'
    },
    {
      id: 2,
      name: "Denver Hiking Group",
      contactName: "John Wick",
      contactEmail: "john@hike.com",
      contactPhone: "720-555-0999",
      address: "44 Mountain View",
      city: "Denver",
      state: "CO",
      zip: "80202",
      fileCount: 45,
      lastLogin: "2 weeks ago",
      status: 'suspended',
      storageLimitGB: 10,
      storageUsedGB: 8.5,
      monthlyFee: 150,
      paymentStatus: 'past_due'
    },
    {
      id: 3,
      name: "Austin Pickleball",
      contactName: "Ted Lasso",
      contactEmail: "ted@believe.com",
      contactPhone: "512-555-0199",
      address: "100 Speedway Ln",
      city: "Austin",
      state: "TX",
      zip: "78701",
      fileCount: 0,
      lastLogin: "Never",
      status: 'pending',
      storageLimitGB: 5,
      storageUsedGB: 0,
      monthlyFee: 250,
      paymentStatus: 'good_standing'
    }
  ]);

  // Form States (Orgs)
  const [formData, setFormData] = useState<Partial<Organization>>({});

  // --- AUTH CHECK ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, supabase]);

  // --- LIVE DATA FETCHING ---
  useEffect(() => {
    if (isManageTeamOpen) {
      fetchSuperAdmins();
    }
  }, [isManageTeamOpen]);

  const fetchSuperAdmins = async () => {
    setIsLoadingAdmins(true);
    
    // Fetch users who are either 'super admin' or 'owner'
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['super admin', 'owner']);

    if (error) {
      console.error("Error fetching admins:", JSON.stringify(error, null, 2));
    } else if (data) {
      const mapped: SuperAdmin[] = data.map(p => ({
        id: p.id,
        name: p.full_name || 'Unknown',
        email: p.email || 'No Email',
        role: p.role as any,
        lastActive: 'Active User' 
      }));
      setSuperAdmins(mapped);
    }
    
    setIsLoadingAdmins(false);
  };

  // --- HANDLERS: ORGS ---
  const handleCreateClick = () => {
    setEditingOrgId(null); 
    setFormData({
      status: 'active',
      storageLimitGB: 10,
      monthlyFee: 0,
      storageUsedGB: 0
    });
    setIsEditModalOpen(true);
  };

  const handleEditClick = (org: Organization) => {
    setEditingOrgId(org.id);
    setFormData({ ...org });
    setIsEditModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrgId) {
      setOrgs(orgs.map(org => org.id === editingOrgId ? { ...org, ...formData } as Organization : org));
    } else {
      const newOrg: Organization = {
        id: Date.now(),
        name: formData.name || 'New Organization',
        contactName: formData.contactName || '',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        zip: formData.zip || '',
        fileCount: 0,
        lastLogin: 'Never',
        status: formData.status || 'pending',
        storageLimitGB: formData.storageLimitGB || 10,
        storageUsedGB: 0,
        monthlyFee: formData.monthlyFee || 0,
        paymentStatus: 'good_standing'
      };
      setOrgs([...orgs, newOrg]);
    }
    setIsEditModalOpen(false);
  };

  // --- HANDLERS: SUPER ADMINS (LIVE) ---
  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    
    if (!newAdminData.email || !newAdminData.firstName || !newAdminData.lastName) {
      setAdminError("Please fill in all fields.");
      return;
    }

    // 1. Search for user by email to get their ID
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newAdminData.email)
      .single();

    if (searchError || !users) {
      setAdminError("User not found. This user must sign up for an account before you can promote them.");
      return;
    }

    // 2. Update their role AND their name in the database
    const fullName = `${newAdminData.firstName} ${newAdminData.lastName}`;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'super admin',
        full_name: fullName
      })
      .eq('id', users.id);

    if (updateError) {
      setAdminError("Failed to promote user. Please check permissions.");
      console.error(updateError);
    } else {
      // Clear form and refresh list
      setNewAdminData({ firstName: '', lastName: '', email: '' });
      fetchSuperAdmins(); 
    }
  };

  const handleDeleteSuperAdmin = async (id: string) => {
    if (confirm("Revoke Super Admin access? They will become a regular member.")) {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'member' })
        .eq('id', id);

      if (!error) {
        fetchSuperAdmins();
      } else {
        alert("Failed to revoke access.");
      }
    }
  };

  // Stats Calculation
  const totalStorage = orgs.reduce((acc, org) => acc + org.storageUsedGB, 0).toFixed(1);
  const payingOrgs = orgs.filter(o => o.monthlyFee > 0 && o.status === 'active').length;
  const actionNeeded = orgs.filter(o => o.status === 'suspended' || o.paymentStatus === 'past_due').length;

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Authenticating...</p>
        </div>
      </main>
    );
  }

  if (!isAuthorized) return null;

  return (
    <main className="min-h-screen bg-slate-950 pt-80 p-4 md:p-8 lg:p-12 pb-20 relative font-sans text-white overflow-x-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      {/* --- SCALING WRAPPER (75% Size, Left Aligned) --- */}
      <div className="transform scale-[0.75] origin-top-left w-[133.33%] max-w-none">
        
        {/* Header - UPDATED LAYOUT */}
        <div className="flex flex-col mb-12 animate-fade-in pr-[11%]">
          <div>
            <h1 className="text-5xl font-bold text-white tracking-tight">Super Admin</h1>
            <p className="text-slate-400 mt-2 text-xl">Global Command Center</p>
          </div>
          
          <div className="flex gap-4 mt-24">
            {/* MANAGE TEAM BUTTON HIDDEN */}
            {/* <button 
              onClick={() => setIsManageTeamOpen(true)}
              className="glass-button bg-slate-800/50 hover:bg-slate-700/50 px-6 py-4 rounded-xl border border-white/10 font-bold text-lg flex items-center gap-3 transition-all"
            >
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Manage Team
            </button> 
            */}
            
            <button 
              onClick={handleCreateClick}
              className="glass-button bg-white/5 hover:bg-white/10 px-8 py-4 rounded-xl border border-white/10 font-bold text-lg flex items-center gap-3 transition-transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              New Organization
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 pr-[11%]">
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Active Users</div>
            <div className="text-4xl font-bold">142 <span className="text-sm align-middle bg-white/10 px-2 py-1 rounded-lg text-white/70 ml-2">+8%</span></div>
          </div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Storage Used</div>
            <div className="text-4xl font-bold flex items-baseline gap-2">
              {totalStorage} <span className="text-lg font-normal text-slate-400">GB</span>
            </div>
          </div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Paying Organizations</div>
            <div className="flex justify-between items-end">
              <div className="text-4xl font-bold">{payingOrgs}</div>
              <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">Good Standing</div>
            </div>
          </div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Suspended / Pending</div>
            <div className="flex justify-between items-end">
              <div className="text-4xl font-bold">{actionNeeded}</div>
              <div className="text-sm font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded border border-red-500/20">Action Req.</div>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pr-[11%]">
          
          {/* LEFT SIDE: Organization Database */}
          <div className="xl:col-span-8 glass-panel border border-white/10 bg-slate-900/40 overflow-hidden h-fit">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-xl">Organization Database</h3>
              <span className="text-sm font-mono text-slate-500">TOTAL RECORDS: {orgs.length}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-slate-950/30">
                    <th className="p-6">Organization</th>
                    <th className="p-6">Plan</th>
                    <th className="p-6">Storage</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-base">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-white">{org.name}</div>
                            <div className="text-sm text-slate-500">{org.city}, {org.state}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="font-mono text-emerald-300 font-bold text-lg">${org.monthlyFee}/mo</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {org.paymentStatus === 'past_due' ? <span className="text-red-400 font-bold">Past Due</span> : 'Auto-Pay'}
                        </div>
                      </td>
                      <td className="p-6 min-w-[150px]">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-slate-300">{org.storageUsedGB} GB</span>
                          <span className="text-slate-500">/ {org.storageLimitGB}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${org.storageUsedGB / org.storageLimitGB > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(org.storageUsedGB / org.storageLimitGB) * 100}%` }} />
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border tracking-wide ${
                          org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          org.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>{org.status}</span>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleEditClick(org)} className="p-3 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT SIDE: Revenue Analytics */}
          <div className="xl:col-span-4 space-y-6">
            <div className="glass-panel p-8 bg-gradient-to-b from-slate-900 to-indigo-950/20 border border-white/10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">Revenue Analytics</h3>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live from Stripe
                  </p>
                </div>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
              </div>
              <div className="mb-8">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Revenue (YTD)</span>
                <div className="text-5xl font-bold text-white mt-2">$143,850</div>
                <div className="text-emerald-400 text-sm font-bold mt-1">+12.5% vs last year</div>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 mb-4">
                {REVENUE_DATA.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div 
                      className={`w-full rounded-t-sm ${index === REVENUE_DATA.length - 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} 
                      style={{ height: data.height, minHeight: '4px' }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 border border-white/10 bg-slate-900/40">
              <h4 className="text-base font-bold text-white mb-4">Recent Transactions</h4>
              <div className="space-y-4">
                {RECENT_TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{tx.org}</div>
                        <div className="text-xs text-slate-500">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-sm font-mono font-bold text-white">${tx.amount}</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold border border-dashed border-white/10 hover:border-indigo-500/30 rounded-lg transition-colors">
                View All Transactions &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: EDIT ORGANIZATION --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pb-10 px-4"> 
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          
          <div className="glass-panel w-full max-w-2xl p-6 relative z-50 animate-fade-in border border-white/10 shadow-2xl bg-slate-900">
            <h2 className="text-xl font-bold text-white mb-4">{editingOrgId ? 'Edit Organization' : 'New Organization'}</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Organization Name</label>
                <input type="text" className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2 rounded-lg" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              {/* Grid: Contact & Subscription */}
              <div className="grid grid-cols-2 gap-4">
                  {/* Contact */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">Primary Contact</h4>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                        <input type="text" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactName || ''} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                        <input type="email" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                        <input type="tel" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="space-y-3">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 h-full">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">Subscription</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Storage (GB)</label>
                                <input type="number" className="glass-input w-full bg-slate-950 border-indigo-500/30 text-sm p-2" value={formData.storageLimitGB || 0} onChange={e => setFormData({...formData, storageLimitGB: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">Fee ($)</label>
                                <input type="number" className="glass-input w-full bg-slate-950 border-emerald-500/30 text-sm p-2" value={formData.monthlyFee || 0} onChange={e => setFormData({...formData, monthlyFee: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="pt-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                            <select className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2" value={formData.status || 'active'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                      </div>
                  </div>
              </div>

              {/* Location */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">Location</h4>
                <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-4">
                        <input type="text" placeholder="Address" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <input type="text" placeholder="City" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                    <div>
                        <input type="text" placeholder="State" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} />
                    </div>
                    <div>
                        <input type="text" placeholder="Zip" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.zip || ''} onChange={e => setFormData({...formData, zip: e.target.value})} />
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm">{editingOrgId ? 'Save Changes' : 'Create Organization'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: MANAGE SUPER ADMINS (LIVE DB & CENTERED) --- */}
      {isManageTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsManageTeamOpen(false)} />
          
          <div className="glass-panel w-full max-w-2xl p-6 relative z-50 animate-fade-in border border-white/10 shadow-2xl bg-slate-900 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Manage Super Admins</h2>
              <button onClick={() => setIsManageTeamOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 pr-2">
              {isLoadingAdmins ? (
                <div className="text-center text-slate-500 py-8">Loading admins...</div>
              ) : (
                <div className="space-y-2">
                  {superAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            {admin.name}
                            {admin.role === 'owner' && <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">OWNER</span>}
                          </div>
                          <div className="text-xs text-slate-400">{admin.email}</div>
                        </div>
                      </div>
                      {admin.role !== 'owner' && (
                        <button 
                          onClick={() => handleDeleteSuperAdmin(admin.id)}
                          title="Revoke Admin Access"
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Admin Form */}
            <form onSubmit={handleAddSuperAdmin} className="bg-slate-950/50 p-4 rounded-xl border border-white/10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Promote Existing User</h3>
              {adminError && <div className="text-red-400 text-xs mb-2 font-bold">{adminError}</div>}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-1">
                  <input 
                    type="text" 
                    placeholder="First Name" 
                    className="glass-input w-full bg-slate-900 border-white/10 text-sm p-2"
                    value={newAdminData.firstName}
                    onChange={(e) => setNewAdminData({ ...newAdminData, firstName: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <input 
                    type="text" 
                    placeholder="Last Name" 
                    className="glass-input w-full bg-slate-900 border-white/10 text-sm p-2"
                    value={newAdminData.lastName}
                    onChange={(e) => setNewAdminData({ ...newAdminData, lastName: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="email" 
                    placeholder="User Email Address" 
                    className="glass-input w-full bg-slate-900 border-white/10 text-sm p-2"
                    value={newAdminData.email}
                    onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="w-full glass-button bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50 text-sm" disabled={!newAdminData.email}>
                Grant Access
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}