'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeftIcon,
  TrashIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

type FileObject = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
};

export default function DocumentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [files, setFiles] = useState<FileObject[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  
  // Storage limit in Bytes (1GB)
  const MAX_STORAGE = 1073741824; 

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    // List ALL files in the 'documents' bucket to get accurate storage count
    // This includes files attached via Announcements
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (data) {
      setFiles(data);
      // Calculate total size of ALL files
      const size = data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
      setTotalSize(size);
    }
    if (error) {
      console.error('Error fetching files:', error);
    }
  };

  const deleteFile = async (fileName: string) => {
    if(!confirm('Are you sure you want to delete this file?')) return;
    
    const { error } = await supabase
      .storage
      .from('documents')
      .remove([fileName]);

    if (!error) {
      fetchFiles();
    } else {
      alert('Error deleting file');
    }
  };

  const getFileUrl = (fileName: string) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Helper to format bytes to GB/MB
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / 1073741824;
    if (gb < 0.01) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${gb.toFixed(2)} GB`;
  };

  const percentageUsed = Math.min((totalSize / MAX_STORAGE) * 100, 100);

  return (
    <main className="min-h-screen p-6 pt-36 pb-24 relative overflow-hidden">
       {/* Background */}
       <div className="fixed inset-0 -z-10 bg-slate-950 pointer-events-none" />
       <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="orb orb-1 opacity-50 mix-blend-screen" />
          <div className="orb orb-2 opacity-50 mix-blend-screen" />
       </div>

       <div className="max-w-7xl mx-auto space-y-8 relative z-10">
         
         {/* Header */}
         <div>
           {/* BACK BUTTON FIX: 'relative z-50' ensures it is clickable over other layers */}
           <button 
             onClick={() => router.push('/dashboard')} 
             className="relative z-50 flex items-center gap-2 text-teal-400 text-sm font-bold mb-2 hover:text-teal-300 transition-colors cursor-pointer"
           >
             <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
           </button>
           <h1 className="text-4xl font-bold text-white mb-2">Document Repository</h1>
           <p className="text-slate-400">Centralized storage for organization assets.</p>
         </div>

         {/* Storage Usage - WIDTH FIX: Restricted to 45% width (approx 55% shorter) */}
         <div className="glass-panel p-6 w-full md:w-[45%] rounded-2xl bg-white/5 border border-white/10">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-lg font-bold text-white">Storage Usage</h3>
               <p className="text-sm text-slate-400">
                 You are using <span className="text-white font-bold">{formatSize(totalSize)}</span> of your <span className="text-white font-bold">1 GB</span> limit.
               </p>
             </div>
             <button className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors">
               Upgrade to Pro Plan (10 GB) →
             </button>
           </div>
           
           {/* Progress Bar */}
           <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative">
             <div 
               className="h-full bg-orange-500 transition-all duration-1000 ease-out"
               style={{ width: `${percentageUsed}%` }}
             />
           </div>
           <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">
             <span>0 GB</span>
             <span>0.5 GB</span>
             <span>1 GB Limit</span>
           </div>
         </div>

         {/* Photos & Media - GRID FIX: Increased columns to reduce card size by ~25% */}
         <div>
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <span className="text-purple-400">🖼️</span> Photos & Media
             </h3>
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{files.length} FILES</span>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             {files.map((file) => {
               // Check if the file is an image for preview
               const isImage = file.metadata?.mimetype?.startsWith('image/');
               const url = getFileUrl(file.name);
               const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

               return (
                 <div key={file.id} className="glass-panel group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                   
                   {/* PREVIEW AREA FIX: Shows Image if available, otherwise shows Extension text */}
                   <div className="h-32 bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                     {isImage ? (
                       // Visual Preview
                       <img 
                         src={url} 
                         alt={file.name} 
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                       />
                     ) : (
                       // Extension Text Preview
                       <div className="text-3xl font-bold text-white/10 group-hover:text-white/20 transition-colors">
                         {ext}
                       </div>
                     )}
                     
                     {/* Overlay Actions (Download / Delete) */}
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white">
                          <DocumentIcon className="w-5 h-5" />
                        </a>
                        <button 
                          onClick={() => deleteFile(file.name)}
                          className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/40 text-red-200"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                     </div>
                   </div>

                   {/* Footer Info */}
                   <div className="p-3">
                     <div className="text-sm font-medium text-white truncate mb-1" title={file.name}>
                       {file.name.replace(/^\d+-/, '')} {/* Strip timestamp prefix for cleaner display */}
                     </div>
                     <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                       <span>{formatSize(file.metadata?.size || 0)}</span>
                       <span>{new Date(file.created_at).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </div>

       </div>
    </main>
  );
}