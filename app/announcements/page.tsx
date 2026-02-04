'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeftIcon, 
  PencilSquareIcon,
  ArchiveBoxIcon,
  PaperClipIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

// --- TYPES ---
type Announcement = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  author_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  attachment_url?: string;
};

type Comment = {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    role: string;
  } | null;
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  
  // View States
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DRAFT' | 'HISTORY'>('ACTIVE');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Data States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Refs
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    file: null as File | null
  });

  // ------------------------------------------------------------------
  // 1. Stable Fetch Functions
  // ------------------------------------------------------------------
  
  const fetchAnnouncements = useCallback(async (userId: string) => {
    const statusMap = { 'ACTIVE': 'ACTIVE', 'DRAFT': 'DRAFT', 'HISTORY': 'ARCHIVED' };
    
    const { data: announcementsData, error: annError } = await supabase
      .from('announcements')
      .select('*, announcement_likes(count), announcement_comments(count)')
      .eq('status', statusMap[activeTab])
      .order('created_at', { ascending: false });

    if (annError) {
      console.error('Error fetching announcements:', JSON.stringify(annError, null, 2));
      return;
    }

    const { data: myLikes } = await supabase
      .from('announcement_likes')
      .select('announcement_id')
      .eq('user_id', userId);

    const myLikedIds = new Set(myLikes?.map(l => l.announcement_id));

    if (announcementsData) {
      const processed = announcementsData.map(a => ({
        ...a,
        likes_count: a.announcement_likes?.[0]?.count || 0,
        comments_count: a.announcement_comments?.[0]?.count || 0,
        user_has_liked: myLikedIds.has(a.id)
      }));
      setAnnouncements(processed);
    }
  }, [activeTab, supabase]);

  const fetchComments = useCallback(async (announcementId: number) => {
    const { data, error } = await supabase
      .from('announcement_comments')
      .select(`
        id, content, created_at, user_id,
        profiles ( full_name, role )
      `)
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching comments detail:", JSON.stringify(error, null, 2));
      return;
    }

    if (data) {
      setComments(data as unknown as Comment[]);
    }
  }, [supabase]);

  // ------------------------------------------------------------------
  // 2. Effects
  // ------------------------------------------------------------------

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchAnnouncements(user.id);
      }
    };
    init();
  }, [fetchAnnouncements, supabase]);

  useEffect(() => {
    if (selectedAnnouncement) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, selectedAnnouncement]);

  // ------------------------------------------------------------------
  // 3. Helpers
  // ------------------------------------------------------------------

  const getFileName = (url: string) => {
    if (!url) return 'Download Attachment';
    try {
      const decodedUrl = decodeURIComponent(url);
      const fullFileName = decodedUrl.split('/').pop() || '';
      const parts = fullFileName.split('-');
      if (parts.length > 1) {
        return parts.slice(1).join('-'); 
      }
      return fullFileName;
    } catch (e) {
      return 'Download Attachment';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ------------------------------------------------------------------
  // 4. Handlers
  // ------------------------------------------------------------------

  const handleSave = async (status: 'ACTIVE' | 'DRAFT') => {
    if (!formData.title || !user) return;
    
    setIsUploading(true);
    let attachmentUrl = null;

    if (formData.file) {
        const sanitizedName = formData.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileName = `${Date.now()}-${sanitizedName}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, formData.file);

        if (uploadError) {
            alert('Error uploading file: ' + uploadError.message);
            setIsUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
        
        attachmentUrl = publicUrl;
    }

    const { error } = await supabase.from('announcements').insert({
      title: formData.title,
      description: formData.description,
      event_date: formData.date,
      status: status,
      author_id: user.id,
      attachment_url: attachmentUrl
    });

    setIsUploading(false);

    if (!error) {
      setIsCreating(false);
      setFormData({ title: '', date: '', description: '', file: null });
      fetchAnnouncements(user.id);
    } else {
        alert('Error creating announcement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      await supabase.from('announcements').delete().eq('id', id);
      if (selectedAnnouncement?.id === id) setSelectedAnnouncement(null);
      if (user) fetchAnnouncements(user.id);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await supabase.from('announcements').update({ status: 'ARCHIVED' }).eq('id', id);
    if (user) fetchAnnouncements(user.id);
  };

  const handleLike = async (e: React.MouseEvent, announcement: Announcement) => {
    e.stopPropagation();
    if (!user) return;

    const isLiking = !announcement.user_has_liked;
    
    setAnnouncements(prev => prev.map(a => 
      a.id === announcement.id 
        ? { ...a, user_has_liked: isLiking, likes_count: a.likes_count + (isLiking ? 1 : -1) } 
        : a
    ));

    if (isLiking) {
       await supabase.from('announcement_likes').insert({ announcement_id: announcement.id, user_id: user.id });
    } else {
       await supabase.from('announcement_likes').delete().eq('announcement_id', announcement.id).eq('user_id', user.id);
    }
    fetchAnnouncements(user.id);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedAnnouncement || !user) return;

    const { error } = await supabase.from('announcement_comments').insert({
      announcement_id: selectedAnnouncement.id,
      user_id: user.id,
      content: newComment
    });

    if (!error) {
      setNewComment('');
      fetchComments(selectedAnnouncement.id);
      fetchAnnouncements(user.id);
    } else {
      alert("Failed to post comment.");
    }
  };

  return (
    <main className="min-h-screen p-6 pt-36 pb-24 relative overflow-hidden">
       <style jsx global>{`
         .scrollbar-hide::-webkit-scrollbar {
             display: none;
         }
         .scrollbar-hide {
             -ms-overflow-style: none;
             scrollbar-width: none;
         }
       `}</style>

       {/* Background */}
       <div className="fixed inset-0 -z-10 bg-slate-950 pointer-events-none" />
       <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="orb orb-1 opacity-50 mix-blend-screen" />
          <div className="orb orb-2 opacity-50 mix-blend-screen" />
       </div>

       {/* SCALE WRAPPER */}
       <div className="transform scale-[0.9] origin-top max-w-5xl mx-auto">
         
         {/* Header */}
         <div className="flex items-center justify-between mb-8">
           <div>
             <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-orange-400 text-sm font-bold mb-2 hover:text-orange-300 transition-colors">
               <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
             </button>
             <h1 className="text-4xl font-bold text-white mb-2">Announcements</h1>
             <p className="text-slate-400">Organization news, updates, and alerts.</p>
           </div>
           
           <button 
             onClick={() => setIsCreating(true)}
             className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
           >
             <PencilSquareIcon className="w-5 h-5" /> New Announcement
           </button>
         </div>

         {/* Tabs */}
         <div className="flex items-center gap-6 border-b border-white/10 mb-8">
           <button onClick={() => setActiveTab('ACTIVE')} className={`pb-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'ACTIVE' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>ACTIVE FEED</button>
           <button onClick={() => setActiveTab('DRAFT')} className={`pb-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'DRAFT' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>DRAFTS</button>
           <button onClick={() => setActiveTab('HISTORY')} className={`pb-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'HISTORY' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>HISTORY</button>
         </div>

         {/* List View */}
         <div className="space-y-6">
           {announcements.length === 0 && (
             <div className="text-center py-20 text-slate-500">No announcements found in this tab.</div>
           )}

           {announcements.map((ann) => (
             <div 
                key={ann.id} 
                className="glass-panel p-6 bg-slate-900/80 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
             >
               <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
                     {ann.title[0]}
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                       <h3 className="font-bold text-white text-lg">{ann.title}</h3>
                       {ann.status === 'DRAFT' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300 uppercase">DRAFT</span>}
                     </div>
                     <div className="text-xs text-slate-400">
                       Event Date: {ann.event_date ? new Date(ann.event_date).toLocaleDateString() : 'N/A'}
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   {activeTab === 'ACTIVE' && (
                     <button 
                       onClick={(e) => handleArchive(e, ann.id)}
                       title="Archive to History"
                       className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                     >
                       <ArchiveBoxIcon className="w-5 h-5" />
                     </button>
                   )}
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }}
                     title="Delete"
                     className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                   >
                     <TrashIcon className="w-5 h-5" />
                   </button>
                 </div>
               </div>
               
               <p className="text-slate-300 text-sm leading-relaxed mb-4 pl-14 line-clamp-2">
                 {ann.description}
               </p>
               
               {/* ATTACHMENT SECTION */}
               {ann.attachment_url && (
                 <div className="pl-14 flex items-center gap-4 mb-4">
                   <a 
                     href={ann.attachment_url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     onClick={(e) => e.stopPropagation()} 
                     className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center gap-2 text-xs text-blue-300 font-bold hover:bg-blue-500/30 transition-colors"
                   >
                     <ArrowDownTrayIcon className="w-4 h-4" /> 
                     {getFileName(ann.attachment_url)}
                   </a>
                 </div>
               )}

               <div className="pl-14 flex items-center justify-between border-t border-white/5 pt-4">
                 <div className="flex gap-4">
                   <button 
                     onClick={(e) => handleLike(e, ann)}
                     className={`flex items-center gap-1 text-xs font-bold transition-colors ${ann.user_has_liked ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                   >
                     {ann.user_has_liked ? <HandThumbUpIconSolid className="w-4 h-4" /> : <HandThumbUpIcon className="w-4 h-4" />}
                     {ann.likes_count}
                   </button>

                   <button 
                     onClick={() => { setSelectedAnnouncement(ann); fetchComments(ann.id); }}
                     className="flex items-center gap-1 text-slate-400 text-xs font-bold hover:text-white transition-colors"
                   >
                     <ChatBubbleLeftIcon className="w-4 h-4" /> {ann.comments_count} Comments
                   </button>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>

       {/* --- CREATE MODAL --- */}
       {isCreating && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isUploading && setIsCreating(false)} />
           <div className="glass-panel w-full max-w-2xl p-8 relative animate-fade-in bg-[#1e2330] border border-white/10 shadow-2xl rounded-2xl">
             <h2 className="text-xl font-bold text-white mb-6">New Announcement</h2>
             
             <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attachment</label>
                    <input type="file" onChange={e => setFormData({...formData, file: e.target.files?.[0] || null})} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm file:mr-4 file:bg-white/10 file:text-white file:border-0 file:px-2 file:rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none" />
                </div>
             </div>

             <div className="flex justify-between items-center pt-4 border-t border-white/5">
               <button onClick={() => setIsCreating(false)} disabled={isUploading} className="px-6 py-3 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 font-bold text-sm hover:bg-red-500/20">Cancel</button>
               <div className="flex gap-4">
                 <button onClick={() => handleSave('DRAFT')} disabled={isUploading} className="px-6 py-3 rounded-lg border border-white/20 text-slate-300 font-bold text-sm hover:bg-white/5">
                    {isUploading ? 'Uploading...' : 'Save Draft'}
                 </button>
                 <button onClick={() => handleSave('ACTIVE')} disabled={isUploading} className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg">
                    {isUploading ? 'Uploading...' : 'Post Announcement'}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* --- CHAT MODAL --- */}
       {selectedAnnouncement && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedAnnouncement(null)} />
           <div className="glass-panel w-full max-w-4xl h-[80vh] flex flex-col relative animate-fade-in bg-slate-900 border border-white/20 rounded-2xl overflow-hidden">
             
             <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
               <div>
                  <h2 className="text-2xl font-bold text-white">{selectedAnnouncement.title}</h2>
               </div>
               <button onClick={() => setSelectedAnnouncement(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <XMarkIcon className="w-6 h-6 text-slate-400 hover:text-white" />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20 scrollbar-hide">
               {comments.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                   <ChatBubbleLeftIcon className="w-12 h-12 mb-2" />
                   <p>No messages yet. Start the conversation!</p>
                 </div>
               ) : (
                 comments.map((comment) => {
                   const isMe = comment.user_id === user?.id;
                   const senderName = comment.profiles?.full_name || 'Member';
                   const role = comment.profiles?.role || '';
                   const senderInitials = getInitials(senderName);

                   return (
                     <div key={comment.id} className={`flex gap-3 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                       {!isMe && (
                         <div className="flex flex-col items-center gap-1">
                           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                             {senderInitials}
                           </div>
                         </div>
                       )}
                       <div className={`max-w-[75%]`}>
                         <div className={`px-4 py-3 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#1e293b] text-slate-200 rounded-tl-none border border-white/5'}`}>
                           <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                         </div>
                         {/* NAME & TIMESTAMP DISPLAYED AFTER EVERY MESSAGE */}
                         <div className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-right text-indigo-200 mr-1' : 'text-slate-500 ml-1'}`}>
                           <span className="font-bold uppercase tracking-wide mr-1">{senderName}</span> • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
               <div ref={commentsEndRef} />
             </div>

             <div className="p-4 border-t border-white/10 bg-slate-900/50 flex gap-4 items-center">
               <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} placeholder="Type a message..." className="flex-1 bg-black/30 border border-white/10 rounded-full px-6 py-3 text-white focus:outline-none focus:border-white/30" />
               <button onClick={handleSendComment} disabled={!newComment.trim()} className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500">
                 <PaperAirplaneIcon className="w-6 h-6 -ml-0.5" />
               </button>
             </div>
           </div>
         </div>
       )}
    </main>
  );
}