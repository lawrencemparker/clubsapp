'use client';

import { useState } from 'react';

// --- TYPES ---
interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  role: 'org_admin' | 'member';
  avatar_url?: string | null;
  // Detailed fields for the Edit Form
  address: string;
  city: string;
  state: string;
  zip: string;
  duesPaid: boolean;
  permissions: {
    canCreateEvents: boolean;
    canAddMembers: boolean;
    canUploadDocuments: boolean;
    canCreateAnnouncements: boolean;
  };
}

export default function DirectoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- CURRENT USER STATE (For Demo/Testing) ---
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member'>('admin');
  const isAdmin = currentUserRole === 'admin';

  // --- MOCK DATA ---
  const [members, setMembers] = useState<Member[]>([
    { 
      id: 1, 
      role: 'org_admin', 
      firstName: 'Sarah', lastName: 'Connor', 
      email: 'sarah@example.com', phone: '555-0123',
      position: 'President', 
      address: '123 Tech Blvd', city: 'Los Angeles', state: 'CA', zip: '90001',
      duesPaid: true,
      permissions: { canCreateEvents: true, canAddMembers: true, canUploadDocuments: true, canCreateAnnouncements: true },
      avatar_url: null 
    },
    { 
      id: 2, 
      role: 'member', 
      firstName: 'John', lastName: 'Wick', 
      email: 'john@example.com', phone: '555-0999',
      position: 'Security Head',
      address: 'Continental Hotel', city: 'New York', state: 'NY', zip: '10001',
      duesPaid: false,
      permissions: { canCreateEvents: false, canAddMembers: false, canUploadDocuments: false, canCreateAnnouncements: false },
      avatar_url: null 
    },
    { 
      id: 3, 
      role: 'member', 
      firstName: 'Ellen', lastName: 'Ripley', 
      email: 'ripley@nostromo.com', phone: '555-2092',
      position: 'Warrant Officer',
      address: '42 Space Station', city: 'Orbit', state: 'TX', zip: '77058',
      duesPaid: true,
      permissions: { canCreateEvents: false, canAddMembers: false, canUploadDocuments: false, canCreateAnnouncements: false },
      avatar_url: null 
    },
    { 
      id: 4, 
      role: 'member', 
      firstName: 'Tony', lastName: 'Stark', 
      email: 'tony@stark.com', phone: '555-3000',
      position: 'Treasurer',
      address: '10880 Malibu Point', city: 'Malibu', state: 'CA', zip: '90265',
      duesPaid: true,
      permissions: { canCreateEvents: true, canAddMembers: true, canUploadDocuments: true, canCreateAnnouncements: true },
      avatar_url: null 
    },
    { 
      id: 5, 
      role: 'member', 
      firstName: 'Bruce', lastName: 'Wayne', 
      email: 'bruce@wayne.com', phone: '555-4000',
      position: 'Benefactor',
      address: '1007 Mountain Dr', city: 'Gotham', state: 'NJ', zip: '07001',
      duesPaid: true,
      permissions: { canCreateEvents: false, canAddMembers: false, canUploadDocuments: false, canCreateAnnouncements: false },
      avatar_url: null 
    },
  ]);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', position: '',
    address: '', city: '', state: '', zip: '', duesPaid: false,
    canCreateEvents: false, canAddMembers: false, canUploadDocuments: false, canCreateAnnouncements: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  // --- HANDLERS ---
  const handleCardClick = (member: Member) => {
    setEditingId(member.id);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      position: member.position,
      address: member.address,
      city: member.city,
      state: member.state,
      zip: member.zip,
      duesPaid: member.duesPaid,
      canCreateEvents: member.permissions.canCreateEvents,
      canAddMembers: member.permissions.canAddMembers,
      canUploadDocuments: member.permissions.canUploadDocuments,
      canCreateAnnouncements: member.permissions.canCreateAnnouncements
    });
    setIsModalOpen(true);
  };

  const handleDeleteMember = () => {
    if (!editingId || !isAdmin) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${formData.firstName} ${formData.lastName}? This action cannot be undone.`
    );

    if (confirmed) {
      setMembers(members.filter((m) => m.id !== editingId));
      setIsModalOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return; // Guard clause

    const updatedPermissions = {
      canCreateEvents: formData.canCreateEvents,
      canAddMembers: formData.canAddMembers,
      canUploadDocuments: formData.canUploadDocuments,
      canCreateAnnouncements: formData.canCreateAnnouncements
    };

    setMembers(members.map(m => 
      m.id === editingId ? { ...m, ...formData, permissions: updatedPermissions } : m
    ));

    setIsModalOpen(false);
  };

  const filteredMembers = members.filter((member) =>
    (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 pb-20 relative">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Header & Search */}
      <div className="w-full mb-12 animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Member Directory
          </h1>
          <p className="text-blue-100/60 mt-2">Manage your organization's roster.</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto items-end">
          {/* USER ROLE TOGGLE (For Demo) */}
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 w-fit">
            <span className="text-xs text-white/50 uppercase font-bold px-2">View As:</span>
            <button 
              onClick={() => setCurrentUserRole('admin')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${isAdmin ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Admin
            </button>
            <button 
              onClick={() => setCurrentUserRole('member')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${!isAdmin ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Member
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="glass-input pl-12"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
        
        {filteredMembers.map((member) => (
          <div 
            key={member.id} 
            onClick={() => handleCardClick(member)}
            className="glass-panel p-6 flex flex-col items-center text-center transition-all hover:scale-[1.02] hover:bg-white/10 group cursor-pointer relative"
          >
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full mb-4 bg-gradient-to-tr from-white/20 to-white/5 p-1 group-hover:from-indigo-500 group-hover:to-purple-500 transition-colors">
              <div className="w-full h-full rounded-full bg-slate-900/50 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white/50">
                {member.firstName.charAt(0)}
              </div>
            </div>

            {/* Info */}
            <h3 className="text-lg font-bold text-white mb-1 truncate w-full">
              {member.firstName} {member.lastName}
            </h3>
            
            <div className="flex gap-2 justify-center mb-4">
               <span className={`px-3 py-0.5 rounded-full text-xs font-medium border border-white/10 ${
                 member.role === 'org_admin' ? 'bg-purple-500/20 text-purple-200' : 'bg-white/5 text-blue-200'
               }`}>
                 {member.role === 'org_admin' ? 'Admin' : 'Member'}
               </span>
               {isAdmin && !member.duesPaid && (
                 <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                   UNPAID
                 </span>
               )}
            </div>

            {/* DYNAMIC BUTTON TEXT */}
            <button className="w-full py-2 rounded-lg text-sm font-semibold text-white/70 bg-white/5 group-hover:bg-white/20 group-hover:text-white transition-all">
              {isAdmin ? 'Edit Profile' : 'View Profile'}
            </button>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center text-gray-400 mt-20">
          <p>No members found matching "{searchTerm}"</p>
        </div>
      )}

      {/* --- MEMBER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="glass-panel w-full max-w-2xl p-8 relative animate-fade-in shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto z-50">
            {/* DYNAMIC TITLE */}
            <h2 className="text-2xl font-bold text-white mb-6">
              {isAdmin ? 'Edit Member Profile' : 'View Member Profile'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">First Name</label>
                  <input 
                    readOnly={!isAdmin} 
                    type="text" 
                    className={`glass-input ${!isAdmin ? 'bg-white/5 text-white/70 cursor-default border-transparent focus:ring-0' : ''}`}
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Last Name</label>
                  <input 
                    readOnly={!isAdmin} 
                    type="text" 
                    className={`glass-input ${!isAdmin ? 'bg-white/5 text-white/70 cursor-default border-transparent focus:ring-0' : ''}`}
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  />
                </div>
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    readOnly={!isAdmin} 
                    type="email" 
                    className={`glass-input ${!isAdmin ? 'bg-white/5 text-white/70 cursor-default border-transparent focus:ring-0' : ''}`}
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Phone Number</label>
                  <input 
                    readOnly={!isAdmin} 
                    type="tel" 
                    className={`glass-input ${!isAdmin ? 'bg-white/5 text-white/70 cursor-default border-transparent focus:ring-0' : ''}`}
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Position / Role</label>
                <input 
                  readOnly={!isAdmin} 
                  type="text" 
                  className={`glass-input ${!isAdmin ? 'bg-white/5 text-white/70 cursor-default border-transparent focus:ring-0' : ''}`}
                  value={formData.position} 
                  onChange={e => setFormData({...formData, position: e.target.value})} 
                />
              </div>

               {/* ADMIN PERMISSIONS (Purple Section) - Disabled/View Only for Non-Admins */}
               <div className={`p-4 rounded-xl border space-y-4 ${isAdmin ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                 <h4 className="font-bold text-white flex items-center gap-2">
                   <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   Admin Permissions
                 </h4>
                 
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-100">Allow Creating Events</span>
                    <Toggle 
                      disabled={!isAdmin}
                      checked={formData.canCreateEvents} 
                      onChange={e => setFormData({...formData, canCreateEvents: e.target.checked})} 
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-100">Allow Adding Members</span>
                    <Toggle 
                      disabled={!isAdmin}
                      checked={formData.canAddMembers} 
                      onChange={e => setFormData({...formData, canAddMembers: e.target.checked})} 
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-100">Allow Uploading Documents</span>
                    <Toggle 
                      disabled={!isAdmin}
                      checked={formData.canUploadDocuments} 
                      onChange={e => setFormData({...formData, canUploadDocuments: e.target.checked})} 
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-100">Allow Creating Announcements</span>
                    <Toggle 
                      disabled={!isAdmin}
                      checked={formData.canCreateAnnouncements} 
                      onChange={e => setFormData({...formData, canCreateAnnouncements: e.target.checked})} 
                    />
                 </div>
              </div>

              {/* FINANCIAL OBLIGATIONS (Green Section) - Disabled/View Only for Non-Admins */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${isAdmin ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                <div>
                  <h4 className="font-bold text-white">Financial Obligations</h4>
                  <p className="text-xs text-blue-200/60">Has this member paid their annual dues?</p>
                </div>
                <Toggle 
                  disabled={!isAdmin}
                  checked={formData.duesPaid} 
                  onChange={e => setFormData({...formData, duesPaid: e.target.checked})} 
                  labelOn="PAID" labelOff="PENDING" color="emerald"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-white/10">
                {/* DELETE: Admin Only */}
                {isAdmin && (
                  <button 
                    type="button" 
                    onClick={handleDeleteMember}
                    className="px-6 py-3 rounded-xl font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors mr-auto"
                  >
                    Delete Member
                  </button>
                )}

                <div className={`flex gap-3 w-full ${isAdmin ? 'md:w-auto ml-auto' : ''}`}>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 md:flex-none px-6 py-3 rounded-xl font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {isAdmin ? 'Cancel' : 'Close'}
                  </button>
                  
                  {/* SAVE: Admin Only */}
                  {isAdmin && (
                    <button 
                      type="submit"
                      className="flex-1 md:flex-none glass-button bg-white/10 hover:bg-white/20 text-white font-bold px-8"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </main>
  );
}

// Helper Toggle Component
function Toggle({ checked, onChange, labelOn, labelOff, color = 'purple', disabled = false }: { checked: boolean, onChange: (e: any) => void, labelOn?: string, labelOff?: string, color?: string, disabled?: boolean }) {
  const colorClass = color === 'emerald' ? 'peer-checked:bg-emerald-500' : 'peer-checked:bg-purple-500';
  
  return (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
      <div className={`w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${colorClass}`}></div>
      {labelOn && (
        <span className="ml-3 text-sm font-bold text-white">
          {checked ? labelOn : labelOff}
        </span>
      )}
    </label>
  );
}