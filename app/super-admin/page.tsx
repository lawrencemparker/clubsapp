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

  useEffect(() => {
    if (isManageTeamOpen) {
      fetchSuperAdmins();
    }
  }, [isManageTeamOpen]);

  const fetchSuperAdmins = async () => {
    setIsLoadingAdmins(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['super admin', 'owner']);

    if (data) {
      setSuperAdmins(data.map(p => ({
        id: p.id,
        name: p.full_name || 'Unknown',
        email: p.email || 'No Email',
        role: p.role as any,
        lastActive: 'Active User' 
      })));
    }
    setIsLoadingAdmins(false);
  };

  const handleCreateClick = () => {
    setEditingOrgId(null); 
    setFormData({
      status: 'pending',   // Default Status
      storageLimitGB: 1,   // Default Storage
      monthlyFee: 250,     // Default Fee
      storageUsedGB: 0,
      firstName: '',
      lastName: ''
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

    if (editingOrgId) {
      const { error } = await supabase
        .from('organizations')
        .update({ ...formData, contactName: finalContactName })
        .eq('id', editingOrgId);
      
      if (error) {
        toast.error("Failed to update organization");
      } else {
        toast.success("Organization updated successfully");
        setOrgs(orgs.map(org => org.id === editingOrgId ? { ...org, ...formData, contactName: finalContactName } as Organization : org));
        setIsEditModalOpen(false);
      }
      setIsLoading(false);
      return;
    }

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

      toast.success("Organization Created!", {
        description: `Welcome email sent to ${formData.firstName}.`,
        duration: 8000,
        action: {
          label: 'Copy Payment Link',
          onClick: () => navigator.clipboard.writeText(result.paymentUrl)
        }
      });

      setOrgs([...orgs, { 
        id: result.orgId, 
        name: formData.name!, 
        contactName: finalContactName, 
        status: 'pending', 
        monthlyFee: Number(formData.monthlyFee), 
        paymentStatus: 'past_due',
        storageUsedGB: 0,
        storageLimitGB: formData.storageLimitGB || 1,
        contactEmail: formData.contactEmail!,
        contactPhone: formData.contactPhone!,
        address: formData.address!,
        city: formData.city!,
        state: formData.state!,
        zip: formData.zip!,
        fileCount: 0,
        lastLogin: 'Never'
      }]);

      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error("Creation Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!newAdminData.email || !newAdminData.firstName || !newAdminData.lastName) {
      setAdminError("Please fill in all fields.");
      return;
    }
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newAdminData.email)
      .single();

    if (searchError || !users) {
      setAdminError("User not found.");
      return;
    }
    const fullName = `${newAdminData.firstName} ${newAdminData.lastName}`;
    const { error } = await supabase.from('profiles').update({ role: 'super admin', full_name: fullName }).eq('id', users.id);
    if (!error) {
      setNewAdminData({ firstName: '', lastName: '', email: '' });
      fetchSuperAdmins();
    }
  };

  const handleDeleteSuperAdmin = async (id: string) => {
    if (confirm("Revoke access?")) {
      const { error } = await supabase.from('profiles').update({ role: 'member' }).eq('id', id);
      if (!error) fetchSuperAdmins();
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 pr-[11%]">
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Active Users</div><div className="text-4xl font-bold">142</div></div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Storage Used</div><div className="text-4xl font-bold">{totalStorage} GB</div></div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Paying Organizations</div><div className="text-4xl font-bold">{payingOrgs}</div></div>
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/5"><div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Suspended / Pending</div><div className="text-4xl font-bold">{actionNeeded}</div></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pr-[11%]">
          <div className="xl:col-span-8 glass-panel border border-white/10 bg-slate-900/40 overflow-hidden h-fit">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5"><h3 className="font-bold text-xl">Organization Database</h3><span className="text-sm font-mono text-slate-500">TOTAL RECORDS: {orgs.length}</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-slate-950/30"><th className="p-6">Organization</th><th className="p-6">Plan</th><th className="p-6 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-white/5 text-base">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6"><div className="font-bold text-lg text-white">{org.name}</div></td>
                      <td className="p-6"><div className="font-mono text-emerald-300 font-bold text-lg">${org.monthlyFee}/mo</div></td>
                      <td className="p-6 text-right"><button onClick={() => handleEditClick(org)} className="p-3 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="xl:col-span-4 space-y-6">
            <div className="glass-panel p-8 bg-gradient-to-b from-slate-900 to-indigo-950/20 border border-white/10">
              <h3 className="text-xl font-bold text-white">Revenue Analytics</h3>
              <div className="text-5xl font-bold text-white mt-8">$143,850</div>
              <div className="h-48 flex items-end justify-between gap-2 mt-8">
                {REVENUE_DATA.map((data, index) => (<div key={index} className="flex-1 flex flex-col items-center group"><div className={`w-full rounded-t-sm ${index === REVENUE_DATA.length - 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} style={{ height: data.height, minHeight: '4px' }}></div></div>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pb-10 px-4"> 
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          <div className="glass-panel w-full max-w-2xl p-6 relative z-50 animate-fade-in border border-white/10 shadow-2xl bg-slate-900">
            <h2 className="text-xl font-bold text-white mb-4">{editingOrgId ? 'Edit Organization' : 'New Organization'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Organization Name</label><input type="text" className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2 rounded-lg" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white">Primary Contact</h4>
                  {editingOrgId ? (
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label><input type="text" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactName || ''} onChange={e => setFormData({...formData, contactName: e.target.value})} /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">First Name</label><input type="text" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Last Name</label><input type="text" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                    </div>
                  )}
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label><input type="email" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} /></div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white">Subscription</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Spinners Removed */}
                    <div><label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Storage (GB)</label><input type="number" className="glass-input w-full bg-slate-950 border-indigo-500/30 text-sm p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={formData.storageLimitGB || 0} onChange={e => setFormData({...formData, storageLimitGB: Number(e.target.value)})} /></div>
                    <div><label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">Fee ($)</label><input type="number" className="glass-input w-full bg-slate-950 border-emerald-500/30 text-sm p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={formData.monthlyFee || 0} onChange={e => setFormData({...formData, monthlyFee: Number(e.target.value)})} /></div>
                  </div>
                  <div className="pt-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label><select className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2" value={formData.status || 'pending'} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="active">Active</option><option value="pending">Pending</option></select></div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button><button type="submit" className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm">{editingOrgId ? 'Save Changes' : 'Create Organization'}</button></div>
            </form>
          </div>
        </div>
      )}

      {isManageTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsManageTeamOpen(false)} />
          <div className="glass-panel w-full max-w-2xl p-6 relative z-50 animate-fade-in border border-white/10 shadow-2xl bg-slate-900 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4"><h2 className="text-xl font-bold text-white">Manage Team</h2></div>
            <form onSubmit={handleAddSuperAdmin} className="bg-slate-950/50 p-4 rounded-xl border border-white/10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Promote Existing User</h3>
              {adminError && <div className="text-red-400 text-xs mb-2 font-bold">{adminError}</div>}
              {/* String Syntax Corrected */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-1"><input type="text" placeholder="First Name" className="glass-input w-full bg-slate-900 border-white/10 text-sm p-2" value={newAdminData.firstName} onChange={(e) => setNewAdminData({ ...newAdminData, firstName: e.target.value })} /></div>
                <div className="col-span-1"><input type="text" placeholder="Last Name" className="glass-input w-full bg-slate-900 border-white/10 text-sm p-2" value={newAdminData.lastName} onChange={(e) => setNewAdminData({ ...newAdminData, lastName: e.target.value })} /></div>
                <div className="col-span-2"><input type="email" placeholder="Email" className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2" value={newAdminData.email} onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })} /></div>
              </div>
              <button type="submit" className="w-full glass-button bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-sm">Grant Access</button>
            </form>
          </div>
        </div>
      )}
      <Toaster position="top-right" theme="dark" richColors />
    </main>
  );
}