'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

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
  id: string;
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
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false); 
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [newAdminData, setNewAdminData] = useState({ firstName: '', lastName: '', email: '' });
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [formData, setFormData] = useState<Partial<Organization> & { firstName?: string, lastName?: string }>({});

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

  const handleCreateClick = () => {
    setEditingOrgId(null); 
    setFormData({
      status: 'pending',   
      storageLimitGB: 1,   
      monthlyFee: 250,     
      storageUsedGB: 0,
      firstName: '',
      lastName: '',
      contactPhone: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditClick = (org: Organization) => {
    setEditingOrgId(org.id);
    setFormData({ ...org });
    setIsEditModalOpen(true);
  };

const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const finalContactName = editingOrgId 
      ? (formData.contactName || '') 
      : `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          contactName: finalContactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          monthlyFee: Number(formData.monthlyFee),
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // --- 1. CLOSE MODAL IMMEDIATELY ---
      setIsEditModalOpen(false);

      // --- 2. UPDATE TABLE DATA IMMEDIATELY ---
      const newOrg: Organization = { 
        id: result.orgId, 
        name: formData.name || 'New Organization', 
        contactName: finalContactName, 
        status: 'pending', 
        monthlyFee: Number(formData.monthlyFee), 
        paymentStatus: 'past_due',
        storageUsedGB: 0,
        storageLimitGB: formData.storageLimitGB || 1,
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        zip: formData.zip || '',
        fileCount: 0,
        lastLogin: 'Never'
      };
      
      // Prepend to the top of the list
      setOrgs(prev => [newOrg, ...prev]);

      // --- 3. TRIGGER NOTIFICATION ---
      // Force notification to show after modal closes
      setTimeout(() => {
        toast.success("Organization Created!", {
          description: "Payment link has been copied to your clipboard.",
          duration: 6000,
        });
      }, 100);

      if (result.paymentUrl) {
        await navigator.clipboard.writeText(result.paymentUrl);
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Creation Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const totalStorage = orgs.reduce((acc, org) => acc + org.storageUsedGB, 0).toFixed(1);
  const payingOrgs = orgs.filter(o => o.monthlyFee > 0 && o.status === 'active').length;
  const actionNeeded = orgs.filter(o => o.status === 'suspended' || o.paymentStatus === 'past_due').length;

  if (isLoading) return null;

  return (
    <main className="min-h-screen bg-slate-950 pt-80 p-4 md:p-8 lg:p-12 pb-20 relative font-sans text-white overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
      
      <div className="transform scale-[0.75] origin-top-left w-[133.33%] max-w-none">
        {/* Header */}
        <div className="flex flex-col mb-12 animate-fade-in pr-[11%]">
          <div>
            <h1 className="text-5xl font-bold text-white tracking-tight">Super Admin</h1>
            <p className="text-slate-400 mt-2 text-xl">Global Command Center</p>
          </div>
          <div className="flex gap-4 mt-24">
            <button onClick={handleCreateClick} className="glass-button bg-white/5 hover:bg-white/10 px-8 py-4 rounded-xl border border-white/10 font-bold text-lg flex items-center gap-3 transition-transform hover:scale-105">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              New Organization
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 pr-[11%]">
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase mb-2">Daily Active Users</div><div className="text-4xl font-bold">142</div></div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase mb-2">Total Storage Used</div><div className="text-4xl font-bold">{totalStorage} GB</div></div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase mb-2">Paying Organizations</div><div className="text-4xl font-bold">{payingOrgs}</div></div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase mb-2">Suspended / Pending</div><div className="text-4xl font-bold">{actionNeeded}</div></div>
        </div>

        {/* Main Database Table & Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pr-[11%]">
          <div className="xl:col-span-8 glass-panel border border-white/10 bg-slate-900/40 overflow-hidden h-fit">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5"><h3 className="font-bold text-xl">Organization Database</h3><span className="text-sm font-mono text-slate-500">TOTAL RECORDS: {orgs.length}</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm font-bold text-slate-500 uppercase border-b border-white/5 bg-slate-950/30">
                    <th className="p-6">Organization</th>
                    <th className="p-6">Plan</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-white/5 transition-colors group text-base">
                      <td className="p-6 font-bold text-white">{org.name}</td>
                      <td className="p-6 font-mono text-emerald-300 font-bold">${org.monthlyFee}/mo</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {org.status}
                        </span>
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

          <div className="xl:col-span-4 space-y-6">
            <div className="glass-panel p-8 bg-gradient-to-b from-slate-900 to-indigo-950/20 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Revenue Analytics</h3>
              <div className="text-5xl font-bold text-white">$143,850</div>
              <div className="h-48 flex items-end justify-between gap-2 mt-8">
                {REVENUE_DATA.map((data, index) => (<div key={index} className="flex-1 flex flex-col items-center group"><div className={`w-full rounded-t-sm ${index === REVENUE_DATA.length - 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} style={{ height: data.height, minHeight: '4px' }}></div></div>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Organization Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pb-10 px-4"> 
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          <div className="glass-panel w-full max-w-2xl p-6 relative z-50 animate-fade-in border border-white/10 shadow-2xl bg-slate-900">
            <h2 className="text-xl font-bold text-white mb-4">{editingOrgId ? 'Edit Organization' : 'New Organization'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Organization Name</label><input type="text" required className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2 rounded-lg" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white">Primary Contact</h4>
                  {editingOrgId ? (
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label><input type="text" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactName || ''} onChange={e => setFormData({...formData, contactName: e.target.value})} /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="First Name" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                      <input type="text" placeholder="Last Name" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                  )}
                  <input type="email" placeholder="Email" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                  <input type="tel" placeholder="Phone" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white">Subscription</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Storage (GB)</label><input type="number" className="glass-input w-full bg-slate-950 border-indigo-500/30 text-sm p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={formData.storageLimitGB || 0} onChange={e => setFormData({...formData, storageLimitGB: Number(e.target.value)})} /></div>
                    <div><label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">Fee ($)</label><input type="number" className="glass-input w-full bg-slate-950 border-emerald-500/30 text-sm p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={formData.monthlyFee || 0} onChange={e => setFormData({...formData, monthlyFee: Number(e.target.value)})} /></div>
                  </div>
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2 text-white" value={formData.status || 'pending'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      <option value="active" className="bg-slate-900 text-white">Active</option>
                      <option value="pending" className="bg-slate-900 text-white">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-sm font-bold text-white">Location</h4>
                <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-4"><input type="text" placeholder="Address" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                    <div className="col-span-2"><input type="text" placeholder="City" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                    <input type="text" placeholder="State" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} />
                    <input type="text" placeholder="Zip" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.zip || ''} onChange={e => setFormData({...formData, zip: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm">Create Organization</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toaster position="top-right" theme="dark" richColors />
    </main>
  );
}