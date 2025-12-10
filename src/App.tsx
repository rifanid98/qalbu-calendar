import React, { useState, useEffect, useMemo } from 'react';
import {
  type AppState,
  type UserProfile,
  FastType,
  type DayInfo,
  MONTH_NAMES_ID,
  DAYS_ID
} from './types';
import { generateMonthGrid, getFastTypesForDate } from './services/dateUtils';
import { loadState, saveState, resetData } from './services/storageService';
import {
  Moon, ChevronLeft, ChevronRight, UserCircle,
  CheckCircle2, Plus, Trash2, RefreshCcw, X, Star, Sun, Calendar
} from './components/Icons';

// --- Custom Icons ---

const Mosque = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Dome */}
    <path d="M7 10a5 5 0 0 1 10 0" />
    {/* Top Finial */}
    <path d="M12 2v3" />
    {/* Building Base */}
    <rect x="4" y="10" width="16" height="11" />
    {/* Door */}
    <path d="M10 21v-3a2 2 0 0 1 4 0v3" />
    {/* Decorative line/base */}
    <path d="M2 21h20" />
  </svg>
);

// --- Helper Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h3 className="font-bold text-lg dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>(loadState);
  const [currentDate, setCurrentDate] = useState(new Date()); // Tracks the visible month
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Derived State
  const activeProfile = useMemo(() =>
    appState.profiles.find(p => p.id === appState.activeProfileId) || appState.profiles[0],
    [appState]);

  const monthGrid = useMemo(() =>
    generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]);

  // Effects
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (appState.theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(appState.theme);
    }
  }, [appState.theme]);

  // Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleDateCompletion = (dateString: string, hasFast: boolean) => {
    if (!hasFast) return; // Cannot complete a day with no fast

    setAppState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === prev.activeProfileId) {
          const newCompleted = { ...p.completedDates };
          if (newCompleted[dateString]) {
            delete newCompleted[dateString];
          } else {
            newCompleted[dateString] = true;
          }
          return { ...p, completedDates: newCompleted };
        }
        return p;
      });
      return { ...prev, profiles: updatedProfiles };
    });
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;
    const newProfile: UserProfile = {
      id: Date.now().toString(),
      name: newProfileName,
      completedDates: {}
    };
    setAppState(prev => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
      activeProfileId: newProfile.id
    }));
    setNewProfileName('');
    setIsProfileModalOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
    if (appState.profiles.length <= 1) return;
    setAppState(prev => {
      const newProfiles = prev.profiles.filter(p => p.id !== id);
      return {
        ...prev,
        profiles: newProfiles,
        activeProfileId: prev.activeProfileId === id ? newProfiles[0].id : prev.activeProfileId
      };
    });
  };

  const switchProfile = (id: string) => {
    setAppState(prev => ({ ...prev, activeProfileId: id }));
    setIsProfileModalOpen(false);
  };

  const toggleTheme = () => {
    setAppState(prev => {
      const nextTheme = prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'system' : 'light';
      return { ...prev, theme: nextTheme };
    });
  };

  // UI Components inside App to access state easily

  const renderFastIndicator = (type: FastType) => {
    switch (type) {
      case FastType.RAMADAN:
        return <Mosque size={20} className="text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />;
      case FastType.AYYAMUL_BIDH:
        return <Moon size={20} className="text-blue-600 dark:text-blue-400 fill-blue-500/20" />;
      case FastType.SENIN_KAMIS:
        return <Star size={20} className="text-amber-500 fill-amber-500/20" />;
      case FastType.SABTU_MUTLAK:
        return <Star size={20} className="text-purple-500 fill-purple-500/20" />;
      default:
        return null;
    }
  };

  const getDayClasses = (day: DayInfo, isCompleted: boolean) => {
    const hasFast = day.fastTypes.length > 0;

    let baseClasses = "relative flex flex-col items-center justify-start pt-1 h-20 sm:h-24 border transition-all duration-200 select-none ";

    // Backgrounds & Border Logic
    if (isCompleted) {
      baseClasses += "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800 ";
    } else if (hasFast) {
      // Base styles for fasting days
      baseClasses += "cursor-pointer active:scale-95 ";

      const types = day.fastTypes;

      // Logic to assign specific colored backgrounds (Glass effect)
      if (types.includes(FastType.RAMADAN)) {
        baseClasses += "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/20 ";
      } else {
        const isAyyamul = types.includes(FastType.AYYAMUL_BIDH);
        const isSeninKamis = types.includes(FastType.SENIN_KAMIS);
        const isSabtu = types.includes(FastType.SABTU_MUTLAK);

        if (isAyyamul && isSeninKamis) {
          // Mix (Gradient)
          baseClasses += "bg-gradient-to-br from-blue-50/60 to-amber-50/60 dark:from-blue-900/10 dark:to-amber-900/10 border-slate-200 dark:border-slate-800/50 ";
        } else if (isAyyamul && isSabtu) {
          // Mix (Gradient)
          baseClasses += "bg-gradient-to-br from-blue-50/60 to-purple-50/60 dark:from-blue-900/10 dark:to-purple-900/10 border-slate-200 dark:border-slate-800/50 ";
        } else if (isAyyamul) {
          baseClasses += "bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/20 ";
        } else if (isSeninKamis) {
          baseClasses += "bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/20 ";
        } else if (isSabtu) {
          baseClasses += "bg-purple-50/60 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/20 ";
        } else {
          // Default Fallback
          baseClasses += "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ";
        }
      }

    } else {
      // No fast (Plain)
      // Visual distinction between Hijri months for normal days
      // Alternating Pink and Default
      if (day.hijri.month % 2 !== 0) {
        // Active/Odd Hijri Month - Pink
        baseClasses += "bg-pink-50/60 dark:bg-pink-900/10 text-slate-500 dark:text-slate-400 border-pink-100/50 dark:border-pink-900/20 ";
      } else {
        // Inactive/Even Hijri Month - Default (Semula)
        baseClasses += "bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800 ";
      }
    }

    // Opacity for non-current month
    if (!day.isCurrentMonth) {
      baseClasses += "opacity-40 ";
    }

    // Today highlight
    if (day.isToday) {
      baseClasses += "ring-2 ring-inset ring-blue-500 z-10 ";
    }

    return baseClasses;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto shadow-2xl bg-white dark:bg-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b dark:border-slate-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Qalbu Calendar
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToToday}
              title="Hari Ini"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Calendar size={20} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              {appState.theme === 'light' ? <Sun size={20} /> : appState.theme === 'dark' ? <Moon size={20} /> : <span className="text-xs font-bold px-1">AUTO</span>}
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <UserCircle size={18} />
              <span className="max-w-[80px] truncate">{activeProfile.name}</span>
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {MONTH_NAMES_ID[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            {/* Simple Hijri Month Estimation Display based on 15th of current month */}
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {getFastTypesForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth())[15]?.hijri || { monthName: '' } as any)[0] === FastType.RAMADAN ? '☪ RAMADAN' : generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth())[15]?.hijri.monthName}
            </p>
          </div>
          <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-2 overflow-y-auto no-scrollbar">

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_ID.map((day, i) => (
            <div key={i} className={`text-center text-xs font-semibold py-2 ${i === 5 || i === 0 ? 'text-red-500/70 dark:text-red-400' : 'text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 auto-rows-fr">
          {monthGrid.map((day, index) => {
            const isCompleted = !!activeProfile.completedDates[day.dateString];
            const hasFast = day.fastTypes.length > 0;

            return (
              <div
                key={day.dateString + index}
                onClick={() => toggleDateCompletion(day.dateString, hasFast)}
                className={`
                  ${getDayClasses(day, isCompleted)}
                  ${index === 0 ? 'rounded-tl-lg' : ''}
                  ${index === 6 ? 'rounded-tr-lg' : ''}
                  ${index === monthGrid.length - 7 ? 'rounded-bl-lg' : ''}
                  ${index === monthGrid.length - 1 ? 'rounded-br-lg' : ''}
                  rounded-md
                `}
              >
                {/* Gregorian Day */}
                <span className={`text-sm font-semibold mt-1 ${isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {day.date.getDate()}
                </span>

                {/* Hijri Day */}
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {day.hijri.day}
                </span>

                {/* Indicators Wrapper - MOVED & STYLED TO FILL REMAINING SPACE */}
                <div className="flex-1 w-full flex items-center justify-center gap-1 pb-1 px-1">
                  {hasFast && day.fastTypes.map(type => (
                    <React.Fragment key={type}>{renderFastIndicator(type)}</React.Fragment>
                  ))}
                </div>

                {/* Checkmark Overlay */}
                {isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-100/20 dark:bg-emerald-900/20 rounded-md backdrop-blur-[1px] z-20">
                    <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 drop-shadow-sm animate-in zoom-in duration-200" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Jenis Puasa</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Mosque size={16} className="text-emerald-500 fill-emerald-500/20" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Ramadhan</span>
            </div>
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-blue-500 fill-blue-500/20" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Ayyamul Bidh</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-500/20" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Senin & Kamis</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-purple-500 fill-purple-500/20" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Sabtu Mutlak</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Reset Area */}
      <footer className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin mereset semua data?')) {
                resetData();
              }
            }}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            <RefreshCcw size={14} />
            Reset Semua Data
          </button>
        </div>
      </footer>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Kelola Profil"
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {appState.profiles.map(profile => (
              <div
                key={profile.id}
                onClick={() => switchProfile(profile.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${profile.id === appState.activeProfileId
                  ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-700'
                  : 'bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600 hover:border-emerald-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${profile.id === appState.activeProfileId
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300'
                    }`}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium ${profile.id === appState.activeProfileId ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {profile.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {Object.keys(profile.completedDates).length} hari puasa
                    </p>
                  </div>
                </div>
                {profile.id !== appState.profiles[0].id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus profil ${profile.name}?`)) {
                        handleDeleteProfile(profile.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">TAMBAH PROFIL BARU</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Nama profil..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleAddProfile}
                disabled={!newProfileName.trim()}
                className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
