'use client';

import { useState } from 'react';

const PRESETS = [
  { name: 'Nebula', primary: '#4F46E5', secondary: '#9333EA', accent: '#EC4899' },
  { name: 'Emerald', primary: '#10B981', secondary: '#3B82F6', accent: '#F59E0B' },
  { name: 'Sunset',  primary: '#F97316', secondary: '#db2777', accent: '#7C3AED' },
];

export default function ThemePicker() {
  const [isOpen, setIsOpen] = useState(false);
  
  // State for custom colors (defaults to current theme)
  const [customPrimary, setCustomPrimary] = useState('#4F46E5');
  const [customSecondary, setCustomSecondary] = useState('#9333EA');

  // Helper to update CSS variables live
  const updateVariable = (variable: string, value: string) => {
    document.documentElement.style.setProperty(variable, value);
  };

  const handlePresetClick = (theme: typeof PRESETS[0]) => {
    setCustomPrimary(theme.primary);
    setCustomSecondary(theme.secondary);
    
    updateVariable('--color-brand-primary', theme.primary);
    updateVariable('--color-brand-secondary', theme.secondary);
    updateVariable('--color-brand-accent', theme.accent);
  };

  const handleCustomColorChange = (type: 'primary' | 'secondary', value: string) => {
    if (type === 'primary') {
      setCustomPrimary(value);
      updateVariable('--color-brand-primary', value);
    } else {
      setCustomSecondary(value);
      updateVariable('--color-brand-secondary', value);
      // For the demo, we make the accent a lighter version of secondary automatically
      // so the 3rd orb doesn't clash.
      updateVariable('--color-brand-accent', value); 
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 animate-fade-in">
      
      {/* The Menu */}
      {isOpen && (
        <div className="glass-panel p-5 flex flex-col gap-5 min-w-[240px] mb-2 backdrop-blur-xl border-white/20">
          
          {/* Section 1: Presets */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
              Quick Presets
            </p>
            <div className="space-y-2">
              {PRESETS.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handlePresetClick(theme)}
                  className="group flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: theme.primary }} />
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: theme.secondary }} />
                  </div>
                  <span className="text-sm font-medium text-white group-hover:text-white/90">
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Section 2: Custom Pickers */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
              Custom Brand
            </p>
            
            <div className="space-y-4">
              {/* Primary Input */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-white font-medium">Primary</label>
                <div className="relative overflow-hidden w-8 h-8 rounded-full border border-white/30 shadow-inner">
                  <input 
                    type="color" 
                    value={customPrimary}
                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
              </div>

              {/* Secondary Input */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-white font-medium">Secondary</label>
                <div className="relative overflow-hidden w-8 h-8 rounded-full border border-white/30 shadow-inner">
                  <input 
                    type="color" 
                    value={customSecondary}
                    onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full glass-panel flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-black/20 group bg-white/5 border-white/20"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}