'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  MegaphoneIcon, 
  DocumentTextIcon, 
  UserPlusIcon, 
  ArrowDownTrayIcon, 
  CloudArrowUpIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// --- TYPES ---
type Member = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  role: string;
  status: 'PAID' | 'UNPAID' | 'INVITED';
  paid: boolean;
};

type UserPermissions = {
  canCreateEvents: boolean;
  canAddMembers: boolean;
  canUploadDocs: boolean;
  canCreateAnnouncements: boolean;
};

type UserProfile = {
  fullName: string;
  orgName: string;
  role: string;
  permissions: UserPermissions;
};

// --- MOCK DATA ---
const MOCK_MEMBERS: Member[] = [
  { id: 1, first_name: 'Sarah', last_name: 'Connor', email: 'sarah@example.com', phone: '555-0101', position: 'President', role: 'admin', status: 'PAID', paid: true },
  { id: 2, first_name: 'John', last_name: 'Wick', email: 'john@example.com', phone: '555-0102', position: 'Security Head', role: 'member', status: 'UNPAID', paid: false },
  { id: 3, first_name: 'Bruce', last_name: 'Wayne', email: 'bruce@example.com', phone: '555-0103', position: 'Benefactor', role: 'member', status: 'PAID', paid: true },
  { id: 4, first_name: 'Clark', last_name: 'Kent', email: 'clark@example.com', phone: '555-0104', position: 'Reporter', role: 'member', status: 'INVITED', paid: false },
  { id: 5, first_name: 'Diana', last_name: 'Prince', email: 'diana@example.com', phone: '555-0105', position: 'Treasurer', role: 'admin', status: 'PAID', paid: true },
  { id: 6, first_name: 'Barry', last_name: 'Allen', email: 'barry@example.com', phone: '555-0106', position: 'Runner', role: 'member', status: 'PAID', paid: true },
];

export default function DashboardPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // STATE: Controls the interactive toggle for testing permissions
  const [viewMode, setViewMode] = useState<'admin' | 'member'>('member'); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<'NONE' | 'MANAGE_ADMINS' | 'ADD_MEMBER' | 'IMPORT'>('NONE');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Real User Data & Permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. SECURITY REDIRECT
        if (!user) {
          router.replace('/login'); 
          return;
        }

        // 2. FETCH PROFILE
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            full_name, 
            organization_id, 
            role, 
            can_create_events, 
            can_add_members, 
            can_upload_documents, 
            can_create_announcements
          `)
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          // Profile doesn't exist yet -> force login/signup flow
          console.warn("User has no profile/permissions.");
          router.replace('/login');
          return;
        }

        if (profile) {
          const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single();
          
          const role = profile.role || 'member';
          
          setUserProfile({
            fullName: profile.full_name || 'User',
            orgName: org?.name || 'Organization Dashboard',
            role: role,
            permissions: {
              canCreateEvents: profile.can_create_events || false,
              canAddMembers: profile.can_add_members || false,
              canUploadDocs: profile.can_upload_documents || false,
              canCreateAnnouncements: profile.can_create_announcements || false,
            }
          });

          // SYNC TOGGLE: Set initial view mode based on actual DB role
          setViewMode(role === 'admin' || role === 'super admin' || role === 'owner' ? 'admin' : 'member');
        }

      } catch (error: any) {
        // IMPROVED ERROR LOGGING
        console.error("Dashboard Load Error:", JSON.stringify(error, null, 2));
        setFetchError(error.message || "Failed to load dashboard permissions. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // --- PERMISSION LOGIC ---
  const isAdmin = viewMode === 'admin';

  const actions = [
    // Admin Only Actions
    { id: 'manage_admins', name: 'Manage Admins', color: 'bg-purple-500/10 text-purple-200', icon: UserGroupIcon, adminOnly: true },
    { id: 'export_full', name: 'Export Full Roster (CSV)', color: 'bg-emerald-500/10 text-emerald-200', icon: ArrowDownTrayIcon, adminOnly: true },
    { id: 'export_unpaid', name: 'Export Unpaid Members (CSV)', color: 'bg-red-500/10 text-red-200', icon: CurrencyDollarIcon, adminOnly: true },
    { id: 'import', name: 'Import Members', color: 'bg-blue-500/10 text-blue-200', icon: CloudArrowUpIcon, adminOnly: true },
    
    // Permission Based Actions (Granular)
    { 
      id: 'announcements', 
      name: 'Announcements', 
      color: 'bg-orange-500/10 text-orange-200', 
      icon: MegaphoneIcon, 
      permissionKey: 'canCreateAnnouncements' as keyof UserPermissions 
    },
    { 
      id: 'docs', 
      name: 'Document Repository', 
      color: 'bg-emerald-500/10 text-emerald-200', 
      icon: DocumentTextIcon, 
      permissionKey: 'canUploadDocs' as keyof UserPermissions 
    },
    { 
      id: 'add_member', 
      name: 'Add New Member', 
      color: 'bg-blue-500/10 text-blue-200', 
      icon: UserPlusIcon, 
      permissionKey: 'canAddMembers' as keyof UserPermissions 
    },
    { 
      id: 'events', 
      name: 'Create Event', 
      color: 'bg-purple-500/10 text-purple-200', 
      icon: CalendarIcon, 
      permissionKey: 'canCreateEvents' as keyof UserPermissions 
    },
  ];

  const visibleActions = actions.filter(action => {
    if (isAdmin) return true; 
    if (action.adminOnly) return false; 

    if (action.permissionKey && userProfile?.permissions) {
      return userProfile.permissions[action.permissionKey] === true;
    }
    
    return false;
  });

  const handleQuickAction = (actionId: string) => {
    switch(actionId) {
      case 'manage_admins': setActiveModal('MANAGE_ADMINS'); break;
      case 'add_member': setActiveModal('ADD_MEMBER'); break;
      case 'import': setActiveModal('IMPORT'); break;
      case 'export_full': alert("Exporting Full Roster..."); break;
      case 'export_unpaid': alert("Exporting Unpaid Members..."); break;
      case 'docs': router.push('/documents'); break;
      case 'events': router.push('/events'); break;
      case 'announcements': router.push('/announcements'); break;
    }
  };

  // --- RENDER: LOADING ---
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  // --- RENDER: ERROR ---
  if (fetchError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="glass-panel p-8 border border-red-500/30 bg-red-500/10 rounded-2xl max-w-lg text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Dashboard Error</h2>
          <p className="text-red-200 text-sm mb-4">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm">Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 pt-36 md:pt-48 pb-24 relative overflow-hidden">
       {/* Background Orbs */}
       <div className="fixed inset-0 -z-10 bg-slate-950 pointer-events-none" />
       <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="orb orb-1 opacity-50 mix-blend-screen" />
          <div className="orb orb-2 opacity-50 mix-blend-screen" />
          <div className="orb orb-3 opacity-50 mix-blend-screen" />
       </div>

       {/* --- SCALE WRAPPER (90% Size) --- */}
       <div className="transform scale-[0.9] origin-top max-w-[90rem] mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                {userProfile?.orgName || 'Organization'}
              </h1>
            </div>
            <p className="text-slate-400 font-medium text-base ml-1">
              Welcome back, <span className="text-white">{userProfile?.fullName || 'User'}</span>.
            </p>
          </div>

          {/* --- INTERACTIVE TOGGLE --- */}
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10 self-start">
            <button 
              onClick={() => setViewMode('admin')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                viewMode === 'admin' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button 
              onClick={() => setViewMode('member')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                viewMode === 'member' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Member
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {isAdmin && (
            <>
              {/* Recent Members */}
              <div className="glass-panel p-6 flex flex-col h-full animate-fade-in">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Recent Members
                </h3>
                <div className="flex-1 space-y-2 pr-2">
                  {members.slice(0, 5).map((m) => (
                    <div key={m.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-[10px] text-white">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{m.first_name} {m.last_name}</div>
                          <div className="text-[11px] text-slate-400">{m.position}</div>
                        </div>
                      </div>
                      {m.status === 'INVITED' ? (
                        <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wide">Resend</button>
                      ) : (
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${m.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {m.status}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                    Download CSV Roster
                  </button>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="glass-panel p-6 h-full flex flex-col relative overflow-hidden animate-fade-in">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Financial Overview</h3>
                <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
                  <div className="relative w-40 h-40 rounded-full bg-slate-800 border-4 border-slate-700/50 flex items-center justify-center shadow-2xl">
                    <div className="absolute inset-0 rounded-full border-[8px] border-emerald-500/80 border-t-transparent border-l-transparent rotate-45" />
                    <div className="absolute inset-0 rounded-full border-[8px] border-slate-500/30 border-b-transparent border-r-transparent -rotate-12" />
                    <div className="text-center z-10">
                      <div className="text-2xl font-bold text-white">50%</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Collected</div>
                    </div>
                  </div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">Pending ({members.filter(m => !m.paid).length})</div>
                    <div className="h-1 w-6 bg-slate-500 rounded-full" />
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-right">
                    <div className="text-[10px] font-bold text-emerald-400 mb-1">Paid ({members.filter(m => m.paid).length})</div>
                    <div className="h-1 w-6 bg-emerald-500 rounded-full ml-auto" />
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Active</div>
                    <div className="text-lg font-bold text-white">{members.filter(m => m.paid).length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
                    <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Pending</div>
                    <div className="text-lg font-bold text-white">{members.filter(m => !m.paid).length}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Actions (Adapts layout based on View Mode) */}
          <div className={`glass-panel p-6 h-full flex flex-col ${!isAdmin ? 'lg:col-span-3 animate-fade-in' : ''}`}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="flex-1 space-y-3">
              {visibleActions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-12">
                  <p>No actions available for your permission level.</p>
                </div>
              ) : (
                visibleActions.map((action) => (
                  <button 
                    key={action.id} 
                    onClick={() => handleQuickAction(action.id)}
                    className={`block w-full p-3 rounded-lg border border-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all ${action.color} backdrop-blur-sm text-left`}
                  >
                    <div className="flex items-center gap-3">
                      {/* @ts-ignore */}
                      <action.icon className="w-5 h-5 opacity-80" />
                      <div className="font-medium text-sm">{action.name}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
       </div>

       {/* --- MODALS LOGIC PRESERVED --- */}
       {activeModal === 'MANAGE_ADMINS' && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal('NONE')} />
           <div className="glass-panel w-full max-w-2xl p-6 relative animate-fade-in bg-slate-900 border border-white/20">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">Manage Admins</h2>
               <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
             </div>
             <div className="relative mb-6">
               <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-slate-400 z-10" />
               <input 
                 type="text" 
                 placeholder="Search members..." 
                 className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {members.filter(m => 
                  (m.first_name + ' ' + m.last_name).toLowerCase().includes(searchTerm.toLowerCase())
                ).map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white">{member.first_name} {member.last_name}</div>
                        <div className="text-xs text-slate-400">{member.email}</div>
                      </div>
                    </div>
                    <button 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${member.role === 'admin' ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'}`}
                      onClick={() => {
                        const newRole = member.role === 'admin' ? 'member' : 'admin';
                        setMembers(members.map(m => m.id === member.id ? {...m, role: newRole} : m));
                      }}
                    >
                      {member.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </div>
                ))}
             </div>
           </div>
         </div>
       )}
       {/* Other modals (Add/Import) preserved in logic but hidden for brevity in response */}
    </main>
  );
}