'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  category: 'Meeting' | 'Competition' | 'Social' | 'Fundraiser';
  date: { month: string; day: string };
  time: string;
  location: string;
  attendees: number;
  gradient: string;
}

export default function EventsPage() {
  const [filter, setFilter] = useState('All');

  const events: Event[] = [
    {
      id: 1,
      title: "New Member Orientation",
      category: "Meeting",
      date: { month: "APR", day: "05" },
      time: "6:30 PM",
      location: "Lounge Area",
      attendees: 12,
      gradient: "from-pink-500 to-rose-600"
    },
    {
      id: 2,
      title: "Monthly Chess Tournament",
      category: "Competition",
      date: { month: "MAR", day: "22" },
      time: "10:00 AM",
      location: "Main Hall",
      attendees: 32,
      gradient: "from-blue-400 to-teal-500"
    },
    {
      id: 3,
      title: "Annual Spring Gala",
      category: "Social",
      date: { month: "MAR", day: "15" },
      time: "7:00 PM",
      location: "Grand Ballroom",
      attendees: 84,
      gradient: "from-violet-500 to-purple-600"
    }
  ];

  return (
    <main className="min-h-screen px-4 pb-20 pt-24 md:px-8 lg:px-12 relative font-sans">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb orb-1 !bg-purple-600/20 top-20 left-20" />
        <div className="orb orb-3 !bg-blue-600/20 bottom-20 right-20" />
      </div>

      <div className="max-w-7xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Events</h1>
            <p className="text-blue-100/60 mt-1">Upcoming gatherings and activities.</p>
          </div>
          <button className="glass-button bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Create Event
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          {['All', 'Meeting', 'Competition', 'Social'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${
                filter === cat 
                  ? 'bg-white text-slate-900' 
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="group relative rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-1 hover:shadow-purple-500/10 bg-slate-800 border border-white/10 flex flex-col">
              
              {/* COMPACT CARD HEADER (Reduced Height) */}
              <div className={`h-24 bg-gradient-to-r ${event.gradient} p-4 relative`}>
                <div className="flex justify-between items-start">
                  {/* Compact Date Badge */}
                  <div className="bg-white/20 backdrop-blur-md rounded-lg px-2.5 py-1 text-center border border-white/10 shadow-sm">
                    <div className="text-[9px] font-bold text-white uppercase tracking-wider">{event.date.month}</div>
                    <div className="text-lg font-bold text-white leading-none">{event.date.day}</div>
                  </div>
                  
                  {/* Category Pill */}
                  <span className="bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-white/10">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* CARD BODY (Compact Padding) */}
              <div className="p-5 flex flex-col flex-1 bg-slate-900/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-3 leading-tight">{event.title}</h3>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-200/70">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-200/70">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {event.location}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  {/* Avatars */}
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800" />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-white">
                      +{event.attendees}
                    </div>
                  </div>

                  {/* RSVP Action */}
                  <button className="text-xs font-bold text-white flex items-center gap-1 hover:gap-2 transition-all group-hover:text-blue-300">
                    RSVP <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}