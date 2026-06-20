import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function Navbar({ onSearchOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: '/',      label: 'Home' },
    { path: '/faq',   label: 'FAQs' },      // was: 'Sections'
    { path: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1e2d3d] flex items-center px-5 lg:px-8">
      {/* Left: branding */}
      <div className="flex items-center gap-3 min-w-[200px]">
        {/* Element 1: IIT Ropar Logo */}
        <img
          src="/iit-ropar-logo.png"
          alt="IIT Ropar"
          className="h-8 w-8 object-contain flex-shrink-0"
        />
        {/* Element 2: Meditation Icon */}
        <img
          src="/meditation-logo.png"
          alt="Vicharanashala"
          className="h-8 w-auto object-contain flex-shrink-0"
        />
        {/* Element 3: Text Block */}
        <div className="flex flex-col gap-0">
          <span className="text-white font-bold text-base tracking-widest uppercase leading-tight">
            VICHARANASHALA
          </span>
          <span className="text-slate-400 text-[11px] leading-tight">
            Lab for Education Design
          </span>
        </div>
      </div>

      {/* Center: tagline + nav tabs */}
      <div className="flex-1 flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-bold tracking-[0.18em] text-amber-400 uppercase">
          The FAQ That Fixes Itself
        </span>
        <div className="flex items-center gap-0">
          {links.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-4 py-1 text-sm transition-colors relative ${
                  isActive
                    ? 'text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: view toggle */}
      <div className="flex items-center gap-2 min-w-[200px] justify-end">
        <button
          onClick={onSearchOpen}
          className="text-slate-400 hover:text-white p-1.5 rounded transition-colors mr-1"
          title="Search (⌘K)"
        >
          <Search size={15} />
        </button>
        <button
          onClick={() => navigate('/')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            location.pathname !== '/admin'
              ? 'bg-amber-500 hover:bg-amber-400 text-white'
              : 'bg-transparent border border-slate-500 hover:border-slate-300 text-slate-300 hover:text-white'
          }`}
        >
          Student view
        </button>
        <button
          onClick={() => navigate('/admin')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            location.pathname === '/admin'
              ? 'bg-amber-500 hover:bg-amber-400 text-white font-semibold'
              : 'bg-transparent border border-slate-500 hover:border-slate-300 text-slate-300 hover:text-white'
          }`}
        >
          Admin view
        </button>
      </div>
    </nav>
  );
}
