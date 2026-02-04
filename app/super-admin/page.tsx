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

export default function SuperAdminPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
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

      // 1. UPDATE: Close the form immediately
      setIsEditModalOpen(false);

      // 2. UPDATE: Add to local database section immediately
      const newOrg: Organization = { 
        id: result.orgId, 
        name: formData.name || 'New Org', 
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
      setOrgs(prev => [newOrg, ...prev]);

      // 3. UPDATE: Trigger the green notification
      toast.success("Organization Created!", {
        description: "Payment link copied to clipboard.",
        duration: 5000,
      });

      // Copy link to clipboard
      if (result.paymentUrl) {
        navigator.clipboard.writeText(result.paymentUrl);
      }

    } catch (error: any) {
      toast.error("Creation Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <main className="min-h-screen bg-slate-950 pt-80 p-4 md:p-8 relative font-sans text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
      
      <div className="transform scale-[0.75] origin-top-left w-[133.33%]">
        <button onClick={handleCreateClick} className="glass-button bg-white/5 hover:bg-white/10 px-8 py-4 rounded-xl border border-white/10 font-bold text-lg mb-12">
          New Organization
        </button>

        {/* Organization Database Section */}
        <div className="glass-panel border border-white/10 bg-slate-900/40 overflow-hidden max-w-5xl">
          <div className="p-8 border-b border-white/5 bg-white/5 font-bold text-xl">Organization Database</div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm font-bold text-slate-500 uppercase border-b border-white/5 bg-slate-950/30">
                <th className="p-6">Organization</th>
                <th className="p-6">Fee</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 font-bold">{org.name}</td>
                  <td className="p-6 text-emerald-400">${org.monthlyFee}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {org.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pb-10 px-4"> 
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="glass-panel w-full max-w-2xl p-6 relative z-50 animate-fade-in border border-white/10 shadow-2xl bg-slate-900">
            <h2 className="text-xl font-bold text-white mb-4">New Organization</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Organization Name</label><input type="text" required className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2 rounded-lg" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white">Primary Contact</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="First Name" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                    <input type="text" placeholder="Last Name" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                  <input type="email" placeholder="Email" required className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                  <input type="tel" placeholder="Phone" className="glass-input w-full bg-slate-950 text-sm p-2" value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white">Subscription</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Storage (GB)</label><input type="number" className="glass-input w-full bg-slate-950 border-indigo-500/30 text-sm p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={formData.storageLimitGB || 1} onChange={e => setFormData({...formData, storageLimitGB: Number(e.target.value)})} /></div>
                    <div><label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">Fee ($)</label><input type="number" className="glass-input w-full bg-slate-950 border-emerald-500/30 text-sm p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={formData.monthlyFee || 250} onChange={e => setFormData({...formData, monthlyFee: Number(e.target.value)})} /></div>
                  </div>
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select className="glass-input w-full bg-slate-950 border-white/10 text-sm p-2 text-white" value={formData.status || 'pending'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      <option value="active" className="bg-slate-900">Active</option>
                      <option value="pending" className="bg-slate-900">Pending</option>
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
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm">Create Organization</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Important: Ensure Toaster is present for notifications */}
      <Toaster position="top-right" theme="dark" richColors />
    </main>
  );
}