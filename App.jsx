import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchModal from './components/SearchModal';
import HomePage from './components/HomePage';
import FAQPage from './components/FAQPage';
import AdminPage from './components/AdminPage';
import { useFAQState } from './hooks/useFAQState';
import YakshaMini from './components/YakshaMini';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    enrichedData,
    vote,
    markSectionRead,
    trackClick,
    readSections,
    readCount,
    totalSections,
  } = useFAQState();

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    // Root surface + text color flipped from dark-neon (bg-slate-925/text-white)
    // to the cream/ink academic theme. bg-slate-925 still resolves correctly
    // since its hex value was updated in tailwind.config.js — no class
    // rename needed here, but text-white must change since white-on-cream
    // would be unreadable.
    <div className="min-h-screen bg-slate-925 text-ink font-sans">
      <Navbar onSearchOpen={() => setSearchOpen(true)} />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/faq"
          element={
            <FAQPage
              data={enrichedData}
              vote={vote}
              markSectionRead={markSectionRead}
              trackClick={trackClick}
              readSections={readSections}
              readCount={readCount}
              totalSections={totalSections}
            />
          }
        />
        <Route
          path="/admin"
          element={<AdminPage enrichedData={enrichedData} />}
        />
      </Routes>

      <YakshaMini />
    </div>
  );
}
