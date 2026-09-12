import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Flame, 
  Coins, 
  Sword,
  Brain, 
  Shield, 
  Circle,
  CheckCircle2,
  Check,
  Scroll,
  Gift, 
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Pause,
  Trophy,
  Crown,
  User as UserIcon,
  Lock,
  LogOut,
  LogIn
} from 'lucide-react';
import MinecraftButton from './MinecraftButton';
import SplashText from './SplashText';
import MinecraftPanorama, { PANORAMA_THEMES } from './MinecraftPanorama';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MainMenu() {
  const [activeModal, setActiveModal] = useState(null); // 'quests' | 'profile' | 'rewards' | 'leaderboard' | 'auth' | 'settings' | null
  const [questFilter, setQuestFilter] = useState('all'); // 'all' | 'study' | 'physique' | 'daily' | 'todo'
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'online' | 'offline' | 'connecting'
  const [userData, setUserData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Leaderboard states
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Auth states
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('lifecraft_token'));
  const isLoggedIn = Boolean(authToken);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Live Panorama Background States (Default: SAKURA BIOME)
  const [panoramaTheme, setPanoramaTheme] = useState(() => {
    const saved = localStorage.getItem('lifecraft_theme');
    if (saved && (saved === 'cherry' || saved === 'sakura')) return 'sakura';
    if (saved === 'dark') return 'sakura';
    return saved || 'sakura';
  });
  const [panoramaSpeed, setPanoramaSpeed] = useState(1.0);
  const [panoramaPaused, setPanoramaPaused] = useState(false);
  const shadersEnabled = true;

  const handleToggleQuest = async (questId) => {
    try {
      const token = localStorage.getItem('lifecraft_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/quests/${questId}/toggle`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        if (token) {
          const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
          if (meRes.ok) {
            const updated = await meRes.json();
            setUserData(updated);
            return;
          }
        }
        const userRes = await fetch(`${API_BASE_URL}/api/users/${userData?.username || 'Anuvesh'}/summary`);
        if (userRes.ok) {
          const updated = await userRes.json();
          setUserData(updated);
          return;
        }
      }
    } catch (err) {
      console.warn('API toggle failed, falling back to local state:', err);
    }
    // Optimistic local state update
    setUserData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        quests: prev.quests.map((q) => q.id === questId ? { ...q, is_completed: !q.is_completed } : q)
      };
    });
  };

  const handleThemeChange = (newTheme) => {
    const actualTheme = newTheme === 'cherry' ? 'sakura' : newTheme;
    setPanoramaTheme(actualTheme);
    localStorage.setItem('lifecraft_theme', actualTheme);
  };

  // Cycle through available themes quickly
  const cycleTheme = () => {
    const themeKeys = Object.keys(PANORAMA_THEMES).filter((t, i, arr) => arr.indexOf(t) === i);
    const currentIndex = themeKeys.indexOf(panoramaTheme);
    const nextTheme = themeKeys[(currentIndex + 1) % themeKeys.length];
    handleThemeChange(nextTheme);
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
        setLeaderboardLoading(false);
        return;
      }
    } catch (err) {
      console.warn('API leaderboard fetch failed, falling back to Supabase direct:', err);
    }

    // Direct Supabase PostgREST client fallback
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('score', { ascending: false });
        if (!error && data) {
          const mapped = data.map((row, idx) => ({
            rank: idx + 1,
            username: row.username,
            score: row.score,
            level: row.level || 1,
            streak: row.streak || 1,
            strength: 10,
            intelligence: 10,
            discipline: 10,
          }));
          setLeaderboardData(mapped);
        }
      } catch (sbErr) {
        console.warn('Direct Supabase fetch error:', sbErr);
      }
    }
    setLeaderboardLoading(false);
  };

  useEffect(() => {
    if (activeModal === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeModal]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || 'Authentication failed. Please check credentials.');
        setAuthLoading(false);
        return;
      }

      localStorage.setItem('lifecraft_token', data.access_token);
      setAuthToken(data.access_token);
      setUserData(data.user);

      if (supabase && data.access_token) {
        supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token || '' }).catch(() => {});
      }

      setAuthSuccess(authMode === 'login' ? `Welcome back, ${data.user.username}!` : `Character forged! Welcome, ${data.user.username}!`);
      setTimeout(() => {
        setActiveModal(null);
        setAuthSuccess('');
        setAuthUsername('');
        setAuthPassword('');
      }, 900);
    } catch (err) {
      setAuthError('Server unreachable. Please verify backend connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('lifecraft_token');
    setAuthToken(null);
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    fetch(`${API_BASE_URL}/api/users/Anuvesh/summary`)
      .then(r => r.json())
      .then(d => setUserData(d))
      .catch(() => {});
    setActiveModal(null);
  };
  const handleLogout = handleSignOut;

  // Ping backend and authenticate on mount
  useEffect(() => {
    async function checkBackend() {
      try {
        const healthRes = await fetch(`${API_BASE_URL}/api/health`);
        if (healthRes.ok) {
          setBackendStatus('online');

          const token = localStorage.getItem('lifecraft_token');
          if (token) {
            const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (meRes.ok) {
              const data = await meRes.json();
              setUserData(data);
              return;
            }
          }

          // Fallback to seeded user
          const userRes = await fetch(`${API_BASE_URL}/api/users/Anuvesh/summary`);
          if (userRes.ok) {
            const data = await userRes.json();
            setUserData(data);
          }
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        console.warn('Backend unavailable, running in standalone mode:', err);
        setBackendStatus('offline');
        setUserData({
          username: "Anuvesh",
          level: 2,
          xp: 85,
          next_level_xp: 282.84,
          coins: 45,
          hearts: 10.0,
          streak: 1,
          attributes: { strength: 12, intelligence: 18, discipline: 15 },
          quests: [],
          rewards: []
        });
      }
    }
    checkBackend();
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black flex flex-col justify-between items-center text-white select-none overflow-hidden">
      {/* Live Moving Minecraft 3D Panorama Background */}
      <MinecraftPanorama 
        theme={panoramaTheme}
        speed={panoramaSpeed}
        isPaused={panoramaPaused}
        onThemeChange={handleThemeChange}
      />

      {/* Top-Left Coins & XP Display */}
      {userData && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 select-none">
          {/* Coins Pill */}
          <div 
            onClick={() => setActiveModal('rewards')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/80 backdrop-blur-md border-2 border-black shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_1px_1px_0px_rgba(255,255,255,0.12)] cursor-pointer hover:border-[#fcd34d] transition-all group"
            title="Gold Coins (Click to open Rewards Shop)"
          >
            <Coins size={14} className="text-[#fca800] group-hover:scale-110 transition-transform" />
            <span className="font-mc text-xs font-bold text-[#fcd34d] tracking-wide">
              {(userData.coins ?? 0).toLocaleString()}G
            </span>
          </div>

          {/* XP & Level Pill */}
          <div 
            onClick={() => setActiveModal('profile')}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-black/80 backdrop-blur-md border-2 border-black shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_1px_1px_0px_rgba(255,255,255,0.12)] cursor-pointer hover:border-[#55ff55] transition-all group"
            title="Experience & Level (Click to open Character Profile)"
          >
            <span className="px-1.5 py-0.2 bg-[#55ff55]/20 border border-[#55ff55]/50 font-pixel text-[9px] text-[#55ff55] font-bold">
              LVL {userData.level ?? 1}
            </span>

            <div className="flex flex-col gap-0.5">
              <div className="w-16 sm:w-20 h-2 bg-black border border-[#373737] overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#44cc22] to-[#80ff20] shadow-[0_0_6px_rgba(85,255,85,0.6)] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Math.round(((userData.xp ?? 0) / (userData.next_level_xp ?? 100)) * 100)))}%` }}
                />
              </div>
              <span className="font-pixel text-[8px] text-gray-300 leading-none">
                {Math.round(userData.xp ?? 0)}/{Math.round(userData.next_level_xp ?? 100)} XP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top-Right Dedicated Sign In / Sign Out Bar */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
        {isLoggedIn ? (
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border-2 border-black p-1 sm:p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_1px_1px_0px_rgba(255,255,255,0.1)]">
            <button
              onClick={() => setActiveModal('profile')}
              className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/10 cursor-pointer transition-colors"
              title="View Character Profile"
            >
              <div className="w-4 h-4 bg-[#55ff55]/20 border border-[#55ff55]/60 flex items-center justify-center font-pixel text-[8px] text-[#55ff55]">
                {userData?.username?.[0] || 'A'}
              </div>
              <span className="font-mc text-xs font-bold text-gray-200">
                {userData?.username}
              </span>
            </button>
            <button
              onClick={handleSignOut}
              className="mc-button-danger px-2.5 py-1 font-mc text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
              title="Sign Out of LifeCraft"
            >
              <LogOut size={12} />
              <span>SIGN OUT</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setAuthMode('login'); setActiveModal('auth'); }}
              className="mc-button-primary px-3 py-1.5 font-mc text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform"
              title="Sign in to your player account"
            >
              <LogIn size={13} />
              <span>SIGN IN</span>
            </button>
            <button
              onClick={() => { setAuthMode('register'); setActiveModal('auth'); }}
              className="mc-button-base px-2.5 py-1.5 font-mc text-xs font-bold text-[#fcd34d] flex items-center gap-1 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform"
              title="Sign up / Create new player"
            >
              <span>SIGN UP</span>
            </button>
          </div>
        )}
      </div>

      {/* Center Section: Logo & Menu Buttons */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-xl px-4 py-8">
        {/* Minecraft Title Header */}
        <div className="relative mb-10 text-center select-none">
          <h1 className="font-pixel text-4xl sm:text-6xl md:text-7xl font-bold tracking-wider text-[#c6c6c6] text-shadow-mc drop-shadow-2xl">
            LIFE<span className="text-[#55ff55]">CRAFT</span>
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs text-[#a0a0a0] tracking-[0.25em] mt-1 text-shadow-sm uppercase">
            A Real-Life Productivity RPG
          </p>

          {/* Oscillating Yellow Splash Text */}
          <SplashText />
        </div>

        {/* Daily Streak Highlight */}
        {userData && (
          <div className="mb-5 flex items-center justify-center gap-2.5 px-5 py-2 bg-black/70 border-2 border-[#ff6600] shadow-[0_0_16px_rgba(255,100,0,0.35)] backdrop-blur-md">
            <Flame size={18} className="text-[#ff7722] fill-[#ff7722]" />
            <span className="font-pixel text-sm text-[#ffaa33] tracking-wider text-shadow-sm">
              {userData.streak || 1} DAY STREAK
            </span>
          </div>
        )}

        {/* Action Button Stack */}
        <div className="w-full flex flex-col gap-3.5 max-w-md">
          <MinecraftButton 
            variant="primary"
            onClick={() => setActiveModal('quests')}
            icon={<Sparkles size={16} className="text-[#ffff55]" />}
          >
            ENTER WORLD / QUESTS
          </MinecraftButton>

          <div className="grid grid-cols-2 gap-3">
            <MinecraftButton 
              onClick={() => setActiveModal('profile')}
              icon={<Brain size={16} className="text-[#55ffff]" />}
            >
              PROFILE
            </MinecraftButton>
            <MinecraftButton 
              onClick={() => setActiveModal('rewards')}
              icon={<Gift size={16} className="text-[#fca800]" />}
            >
              REWARDS
            </MinecraftButton>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MinecraftButton 
              onClick={() => setActiveModal('leaderboard')}
              icon={<Trophy size={16} className="text-[#fcd34d]" />}
            >
              LEADERBOARD
            </MinecraftButton>
            <MinecraftButton 
              onClick={() => setActiveModal('settings')}
            >
              OPTIONS...
            </MinecraftButton>
          </div>
        </div>

      </main>



      {/* Interactive In-Game Modals (Minecraft Style Frame) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl mc-codex-frame p-5 sm:p-7 max-h-[88vh] flex flex-col"
            >
              {/* Golden Corner Rivets */}
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-[#fcd34d] border border-black shadow-[inset_1px_1px_0px_#fff]" />
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#fcd34d] border border-black shadow-[inset_1px_1px_0px_#fff]" />
              <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-[#fcd34d] border border-black shadow-[inset_1px_1px_0px_#fff]" />
              <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 bg-[#fcd34d] border border-black shadow-[inset_1px_1px_0px_#fff]" />

              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 bg-[#2d2e37] hover:bg-[#8c2e2e] border-2 border-black shadow-[inset_2px_2px_0px_#595b6c,inset_-2px_-2px_0px_#121316] text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer group z-20"
                title="Close"
              >
                <X size={16} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Modal Header */}
              <div className="text-center pb-3 sm:pb-4 border-b-2 border-neutral-800 mb-4 shrink-0">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Scroll size={22} className="text-[#fcd34d]" />
                  <h2 className="font-mc text-2xl sm:text-3xl font-bold text-[#fcd34d] tracking-wide text-shadow-mc uppercase">
                    {activeModal === 'quests' && 'Quest Codex'}
                    {activeModal === 'profile' && 'Character Attributes'}
                    {activeModal === 'rewards' && 'Reward Shop'}
                    {activeModal === 'leaderboard' && 'Hall of Fame'}
                    {activeModal === 'auth' && 'Sign In / Register'}
                    {activeModal === 'settings' && 'Gameplay & Settings'}
                  </h2>
                  <Scroll size={22} className="text-[#fcd34d] -scale-x-100" />
                </div>
                <p className="font-sans text-xs text-gray-400 font-medium">
                  {activeModal === 'quests' && 'Complete daily routines & bounties to level up and earn gold'}
                  {activeModal === 'profile' && 'RPG Stats • Strength, Intelligence & Discipline Attributes'}
                  {activeModal === 'rewards' && 'Redeem hard-earned gold coins for real-life dopamine rewards'}
                  {activeModal === 'leaderboard' && 'Realm Rankings • Ranked by Level, Habit Streaks & RPG Attributes'}
                  {activeModal === 'auth' && 'Sign in to your LifeCraft account or create a new player character'}
                  {activeModal === 'settings' && 'Audio, visuals, and persistence preferences'}
                </p>
              </div>

              {/* Modal Body Content */}
              {activeModal === 'quests' && (
                <div className="flex flex-col space-y-3.5 overflow-hidden flex-1">
                  {/* Sleek Minecraft HUD Status Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0e0f14]/90 border-2 border-black p-2 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.8),inset_-1px_-1px_0px_rgba(255,255,255,0.06)] shrink-0">
                    <div className="flex items-center justify-center gap-2 py-1 px-2">
                      <span className="text-base">❤️</span>
                      <div className="text-left">
                        <p className="font-mc text-[10px] text-gray-400 leading-tight">MISSED DAILY</p>
                        <p className="font-mc text-xs font-bold text-[#ff5555]">-0.5 HEARTS</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-1 px-2 border-y sm:border-y-0 sm:border-x border-neutral-800">
                      <span className="text-base">⚡</span>
                      <div className="text-left">
                        <p className="font-mc text-[10px] text-gray-400 leading-tight">QUEST REWARD</p>
                        <p className="font-mc text-xs font-bold text-[#55ff55]">INSTANT XP + GOLD</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-1 px-2">
                      <span className="text-base">📈</span>
                      <div className="text-left">
                        <p className="font-mc text-[10px] text-gray-400 leading-tight">LEVEL CURVE</p>
                        <p className="font-mc text-xs font-bold text-[#fcd34d]">100 × (LVL^1.5)</p>
                      </div>
                    </div>
                  </div>

                  {/* Minecraft Inventory Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 shrink-0">
                    {[
                      { id: 'all', label: 'ALL QUESTS', count: userData?.quests?.length || 0, icon: Sparkles },
                      { id: 'study', label: 'STUDY & CODE', count: (userData?.quests || []).filter(q => q.category === 'Study' || q.category === 'Coding' || q.category === 'College').length, icon: Brain },
                      { id: 'physique', label: 'PHYSIQUE', count: (userData?.quests || []).filter(q => q.category === 'Fitness').length, icon: Sword },
                      { id: 'daily', label: 'DAILIES', count: (userData?.quests || []).filter(q => q.type === 'daily').length, icon: Flame },
                      { id: 'todo', label: 'TODOS', count: (userData?.quests || []).filter(q => q.type === 'todo').length, icon: Scroll }
                    ].map((tab) => {
                      const TabIcon = tab.icon;
                      const isActive = questFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setQuestFilter(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 font-mc text-xs font-bold border-2 border-black transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#2b2c37] text-[#fcd34d] shadow-[inset_2px_2px_0px_#585a6b,inset_-1px_-1px_0px_#121316]'
                              : 'bg-[#181920] text-gray-400 hover:text-white hover:bg-[#20212b] shadow-[inset_1px_1px_0px_rgba(255,255,255,0.05),inset_-2px_-2px_0px_#0e0f14]'
                          }`}
                        >
                          <TabIcon size={12} className={isActive ? 'text-[#fcd34d]' : 'text-gray-500'} />
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 border border-black ${
                            isActive ? 'bg-black/60 text-[#55ff55]' : 'bg-black/40 text-gray-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Subhead count & helper note */}
                  <div className="flex justify-between items-center px-1 text-xs shrink-0">
                    <span className="font-mc text-xs text-gray-300">
                      BOUNTY LOG (<span className="text-[#fcd34d] font-bold">
                        {(userData?.quests || []).filter((q) => {
                          if (questFilter === 'all') return true;
                          if (questFilter === 'study') return q.category === 'Study' || q.category === 'Coding' || q.category === 'College';
                          if (questFilter === 'physique') return q.category === 'Fitness';
                          if (questFilter === 'daily') return q.type === 'daily';
                          if (questFilter === 'todo') return q.type === 'todo';
                          return true;
                        }).length}
                      </span> ACTIVE)
                    </span>
                    <span className="font-sans text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#55ff55] rounded-full inline-block animate-pulse" />
                      Click slot to toggle completion
                    </span>
                  </div>

                  {/* Scrollable Quest Cards Container */}
                  <div className="max-h-[44vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {(userData?.quests || [])
                      .filter((quest) => {
                        if (questFilter === 'all') return true;
                        if (questFilter === 'study') return quest.category === 'Study' || quest.category === 'Coding' || quest.category === 'College';
                        if (questFilter === 'physique') return quest.category === 'Fitness';
                        if (questFilter === 'daily') return quest.type === 'daily';
                        if (questFilter === 'todo') return quest.type === 'todo';
                        return true;
                      })
                      .map((quest) => {
                        const isPhysique = quest.category === 'Fitness';
                        const isDone = quest.is_completed;
                        return (
                          <div 
                            key={quest.id}
                            onClick={() => handleToggleQuest(quest.id)}
                            className={`border-2 border-black p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all cursor-pointer select-none group ${
                              isDone
                                ? 'bg-[#101115]/75 opacity-60'
                                : 'bg-[#1b1c24] hover:bg-[#22242f] shadow-[inset_2px_2px_0px_rgba(255,255,255,0.07),inset_-2px_-2px_0px_rgba(0,0,0,0.7)]'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              {/* Minecraft Slot Checkbox */}
                              <div className={`w-7 h-7 shrink-0 border-2 border-black flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-[#0f2415] shadow-[inset_2px_2px_0px_#06130a,inset_-1px_-1px_0px_#1e4629]'
                                  : 'bg-[#101116] shadow-[inset_2px_2px_0px_#000,inset_-1px_-1px_0px_#272832] group-hover:border-[#fcd34d]'
                              }`}>
                                {isDone ? (
                                  <Check size={16} className="text-[#55ff55] stroke-[3]" />
                                ) : (
                                  <div className="w-1.5 h-1.5 bg-neutral-700 group-hover:bg-[#fcd34d]/70 transition-colors" />
                                )}
                              </div>

                              {/* Quest Title & Meta */}
                              <div className="min-w-0">
                                <p className={`font-sans font-semibold text-[13.5px] sm:text-[14.5px] leading-snug tracking-normal transition-colors ${
                                  isDone ? 'line-through text-gray-500' : 'text-gray-100 group-hover:text-white'
                                }`}>
                                  {quest.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`font-mc text-[10px] font-bold px-1.5 py-0.5 border border-black ${
                                    quest.type === 'daily'
                                      ? 'bg-amber-950/80 text-[#fcd34d]'
                                      : 'bg-sky-950/80 text-[#7dd3fc]'
                                  }`}>
                                    {quest.type === 'daily' ? '☀️ DAILY' : '📜 TODO'}
                                  </span>

                                  <span className={`font-mc text-[10px] font-bold px-1.5 py-0.5 border border-black ${
                                    isPhysique
                                      ? 'bg-red-950/70 text-red-300'
                                      : 'bg-indigo-950/70 text-indigo-300'
                                  }`}>
                                    {isPhysique ? '⚔️ PHYSIQUE' : '🧠 ' + (quest.category ? quest.category.toUpperCase() : 'STUDY')}
                                  </span>

                                  {quest.attribute_target && (
                                    <span className={`flex items-center gap-1 font-mc text-[10px] font-bold px-1.5 py-0.5 border border-black bg-neutral-900 ${
                                      quest.attribute_target === 'strength'
                                        ? 'text-[#ff7777]'
                                        : quest.attribute_target === 'intelligence'
                                          ? 'text-[#55ffff]'
                                          : 'text-[#ffff55]'
                                    }`}>
                                      {quest.attribute_target === 'strength' && <Sword size={10} />}
                                      {quest.attribute_target === 'intelligence' && <Brain size={10} />}
                                      {quest.attribute_target === 'discipline' && <Shield size={10} />}
                                      +{quest.attribute_target.slice(0, 3).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Rewards */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span className="font-mc text-xs font-bold px-2 py-1 bg-[#0e2113] border border-black text-[#55ff55] shadow-[inset_1px_1px_0px_rgba(255,255,255,0.12)]">
                                +{quest.xp_reward} XP
                              </span>
                              <span className="font-mc text-xs font-bold px-2 py-1 bg-[#261c07] border border-black text-[#fca800] shadow-[inset_1px_1px_0px_rgba(255,255,255,0.12)]">
                                +{quest.coin_reward}G
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {activeModal === 'profile' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#1b1c24] border-2 border-black p-4 text-center shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]">
                      <Sword size={24} className="mx-auto mb-2 text-[#ff5555]" />
                      <h4 className="font-mc text-xs font-bold text-gray-400">STRENGTH</h4>
                      <p className="font-mc text-2xl font-bold text-white mt-1">{userData?.attributes?.strength || 10}</p>
                      <span className="text-[11px] text-gray-400 font-sans">Fitness & Physique</span>
                    </div>
                    <div className="bg-[#1b1c24] border-2 border-black p-4 text-center shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]">
                      <Brain size={24} className="mx-auto mb-2 text-[#55ffff]" />
                      <h4 className="font-mc text-xs font-bold text-gray-400">INTELLIGENCE</h4>
                      <p className="font-mc text-2xl font-bold text-white mt-1">{userData?.attributes?.intelligence || 15}</p>
                      <span className="text-[11px] text-gray-400 font-sans">Coding & Study</span>
                    </div>
                    <div className="bg-[#1b1c24] border-2 border-black p-4 text-center shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]">
                      <Shield size={24} className="mx-auto mb-2 text-[#ffff55]" />
                      <h4 className="font-mc text-xs font-bold text-gray-400">DISCIPLINE</h4>
                      <p className="font-mc text-2xl font-bold text-white mt-1">{userData?.attributes?.discipline || 12}</p>
                      <span className="text-[11px] text-gray-400 font-sans">Habits & Consistency</span>
                    </div>
                  </div>

                  <div className="bg-[#0e0f14]/90 border-2 border-black p-4 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.8),inset_-1px_-1px_0px_rgba(255,255,255,0.06)]">
                    <h4 className="font-mc text-xs font-bold text-[#55ff55] mb-2">SURVIVAL STATUS</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div>
                        <p className="text-gray-400">Hearts Remaining:</p>
                        <p className="font-mc text-base font-bold text-[#ff5555]">{userData?.hearts || 10} / 10 Hearts</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Daily Streak:</p>
                        <p className="font-mc text-base font-bold text-[#fca800]">{userData?.streak || 1} Day Streak</p>
                      </div>
                    </div>
                  </div>

                  {/* Account & Authentication Status */}
                  <div className="bg-[#181920] border-2 border-black p-4 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-mc text-xs font-bold text-[#fcd34d] mb-1 flex items-center gap-1.5">
                        <UserIcon size={14} className="text-[#fcd34d]" />
                        ACCOUNT AUTHENTICATION
                      </h4>
                      <p className="text-xs font-sans text-gray-300">
                        {isLoggedIn ? (
                          <>Signed in as <strong className="text-[#55ff55] font-mc text-sm ml-1">{userData?.username}</strong></>
                        ) : (
                          <>Playing as Guest (<span className="text-yellow-400 font-bold">Unauthenticated</span>)</>
                        )}
                      </p>
                    </div>
                    <div>
                      {isLoggedIn ? (
                        <button
                          onClick={handleSignOut}
                          className="mc-button-danger px-3 py-1.5 font-mc text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                          title="Sign Out of your player account"
                        >
                          <LogOut size={13} />
                          <span>SIGN OUT</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setAuthMode('login'); setActiveModal('auth'); }}
                            className="mc-button-primary px-3 py-1.5 font-mc text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                            title="Sign in with your account"
                          >
                            <LogIn size={13} />
                            <span>SIGN IN</span>
                          </button>
                          <button
                            onClick={() => { setAuthMode('register'); setActiveModal('auth'); }}
                            className="mc-button-base px-2.5 py-1.5 font-mc text-xs font-bold text-[#fcd34d] cursor-pointer hover:scale-105 transition-transform"
                            title="Create a new player account"
                          >
                            <span>SIGN UP</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'rewards' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#0e0f14]/90 border-2 border-black p-3 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.8)]">
                    <span className="font-mc text-xs font-bold text-gray-300">TREASURY BALANCE:</span>
                    <span className="font-mc text-sm font-bold text-[#fca800] flex items-center gap-1.5">
                      <Coins size={16} /> {userData?.coins || 20} GOLD COINS
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[46vh] overflow-y-auto custom-scrollbar pr-1">
                    {userData?.rewards?.map((reward) => (
                      <div 
                        key={reward.id}
                        className="bg-[#1b1c24] border-2 border-black p-3.5 flex justify-between items-center hover:bg-[#22242f] transition-colors shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]"
                      >
                        <div className="flex items-center gap-3">
                          <Gift size={20} className="text-[#fca800]" />
                          <div>
                            <p className="font-sans font-semibold text-sm text-white">{reward.title}</p>
                            <p className="font-sans text-[11px] text-gray-400">Real-life dopamine reward</p>
                          </div>
                        </div>
                        <button className="mc-button-base px-3 py-1.5 font-mc text-xs font-bold text-[#fca800]">
                          {reward.coin_cost} COINS
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'leaderboard' && (
                <div className="flex flex-col space-y-3.5 overflow-hidden flex-1">
                  {/* Top Realm Stats Banner */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0e0f14]/90 border-2 border-black p-2.5 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.8),inset_-1px_-1px_0px_rgba(255,255,255,0.06)] shrink-0 text-center">
                    <div className="py-1 px-1.5">
                      <p className="font-mc text-[10px] text-gray-400 leading-tight">REALM CHAMPION</p>
                      <p className="font-mc text-xs font-bold text-[#fcd34d] truncate mt-0.5">
                        👑 {leaderboardData[0]?.username || 'TechnoBlade'}
                      </p>
                      <p className="font-mc text-[10px] text-[#55ff55]">
                        {(leaderboardData[0]?.score ?? 6780).toLocaleString()} PTS
                      </p>
                    </div>
                    <div className="py-1 px-1.5 border-x border-neutral-800">
                      <p className="font-mc text-[10px] text-gray-400 leading-tight">TOP REALM SCORE</p>
                      <p className="font-mc text-sm font-bold text-[#fcd34d] mt-0.5">
                        ⭐ {Math.max(...(leaderboardData.map(p => p.score ?? 0) || [6780])).toLocaleString()} PTS
                      </p>
                      <p className="font-mc text-[10px] text-gray-400">
                        Supabase Cloud
                      </p>
                    </div>
                    <div className="py-1 px-1.5">
                      <p className="font-mc text-[10px] text-gray-400 leading-tight">YOUR SCORE & RANK</p>
                      <p className="font-mc text-xs font-bold text-[#55ff55] mt-0.5">
                        #{leaderboardData.findIndex(p => p.username === userData?.username) + 1 || 4} • {(leaderboardData.find(p => p.username === userData?.username)?.score ?? 1850).toLocaleString()} PTS
                      </p>
                      <p className="font-mc text-[10px] text-gray-400">
                        Live Cloud Sync
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Header / Table Source */}
                  <div className="flex justify-between items-center px-1 text-xs shrink-0">
                    <span className="font-mc text-xs text-gray-300 flex items-center gap-1.5">
                      <span>RANKED ADVENTURERS BY SCORE</span>
                      <span className="text-[10px] text-gray-400">({leaderboardData.length} Players)</span>
                    </span>
                    <span className="font-mc text-[11px] text-[#55ff55] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#55ff55] rounded-full inline-block animate-pulse" />
                      Supabase: public.leaderboard
                    </span>
                  </div>

                  <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
                    {leaderboardLoading ? (
                      <div className="p-8 text-center text-gray-400 font-mc text-xs">
                        Loading Supabase Realm Rankings...
                      </div>
                    ) : (
                      leaderboardData.map((player) => {
                        const isCurrent = player.username === userData?.username;
                        const isFirst = player.rank === 1;
                        const isSecond = player.rank === 2;
                        const isThird = player.rank === 3;

                        return (
                          <div
                            key={player.username}
                            className={`border-2 border-black p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                              isCurrent
                                ? 'bg-[#18261e] border-[#55ff55] shadow-[inset_2px_2px_0px_rgba(85,255,85,0.15)] ring-1 ring-[#55ff55]'
                                : isFirst
                                  ? 'bg-[#251f12] border-[#fcd34d] shadow-[inset_2px_2px_0px_rgba(252,211,77,0.15)]'
                                  : 'bg-[#181920] shadow-[inset_1px_1px_0px_rgba(255,255,255,0.05),inset_-2px_-2px_0px_#0e0f14]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Rank Slot */}
                              <div className={`w-8 h-8 shrink-0 border-2 border-black flex items-center justify-center font-mc text-xs font-bold ${
                                isFirst 
                                  ? 'bg-[#fcd34d] text-black shadow-[inset_1px_1px_0px_#fff]' 
                                  : isSecond 
                                    ? 'bg-[#38bdf8] text-black' 
                                    : isThird 
                                      ? 'bg-[#fb923c] text-black' 
                                      : 'bg-[#101115] text-gray-300'
                              }`}>
                                {isFirst ? '👑 1' : `#${player.rank}`}
                              </div>

                              {/* Player Name and Attributes */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-sans font-bold text-sm ${isCurrent ? 'text-[#55ff55]' : 'text-white'}`}>
                                    {player.username}
                                  </span>
                                  {isCurrent && (
                                    <span className="font-mc text-[9px] px-1 bg-[#55ff55]/20 text-[#55ff55] border border-[#55ff55]/60">
                                      YOU
                                    </span>
                                  )}
                                  <span className="font-mc text-[10px] font-bold px-1.5 py-0.2 bg-[#fcd34d]/15 text-[#fcd34d] border border-[#fcd34d]/40">
                                    LVL {player.level}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mc">
                                  <span className="text-[#ff7777] flex items-center gap-1">
                                    <Sword size={11} /> {player.strength ?? 10}
                                  </span>
                                  <span className="text-[#55ffff] flex items-center gap-1">
                                    <Brain size={11} /> {player.intelligence ?? 10}
                                  </span>
                                  <span className="text-[#ffff55] flex items-center gap-1">
                                    <Shield size={11} /> {player.discipline ?? 10}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right side: Score & Streak */}
                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                              {/* Prominent Score Highlight */}
                              <div className="flex flex-col items-end">
                                <span className="font-mc text-xs sm:text-sm font-bold text-[#fcd34d] px-2.5 py-1 bg-[#261c07] border-2 border-[#fcd34d]/60 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.15)] flex items-center gap-1 tracking-wider">
                                  <Sparkles size={11} className="text-[#fcd34d]" />
                                  {(player.score ?? 0).toLocaleString()} <span className="text-[10px] text-[#fcd34d]/80">PTS</span>
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 items-end">
                                <span className="flex items-center gap-1 font-mc text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-red-950 to-orange-950 border border-orange-500/50 text-[#ffaa44]">
                                  <Flame size={10} className="fill-orange-400 text-orange-400" />
                                  {player.streak}D
                                </span>
                                <span className="font-mc text-[10px] px-1.5 py-0.5 bg-[#1b1c24] border border-black text-gray-300">
                                  {player.coins ?? 0}G
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'auth' && (
                <div className="space-y-4 max-w-md mx-auto w-full">
                  {/* Supabase Cloud Auth Live Indicator */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1612] border-2 border-[#55ff55]/40 shadow-[inset_1px_1px_0px_rgba(85,255,85,0.2)]">
                    <span className="flex items-center gap-1.5 font-mc text-[11px] text-[#55ff55] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#55ff55] animate-pulse" />
                      SUPABASE AUTH CONNECTED
                    </span>
                    <span className="font-mc text-[10px] text-gray-400">
                      Project: <span className="text-gray-200">llqradcrafoflbgtsiqr</span>
                    </span>
                  </div>

                  {/* Auth Mode Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                      className={`py-2 font-mc text-xs font-bold border-2 border-black transition-all cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-[#2b2c37] text-[#55ff55] shadow-[inset_2px_2px_0px_#585a6b] border-[#55ff55]'
                          : 'bg-[#181920] text-gray-400 hover:text-white'
                      }`}
                    >
                      🔑 SIGN IN
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                      className={`py-2 font-mc text-xs font-bold border-2 border-black transition-all cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-[#2b2c37] text-[#fcd34d] shadow-[inset_2px_2px_0px_#585a6b] border-[#fcd34d]'
                          : 'bg-[#181920] text-gray-400 hover:text-white'
                      }`}
                    >
                      ⚔️ SIGN UP
                    </button>
                  </div>

                  {/* Auth Form */}
                  <form onSubmit={handleAuthSubmit} className="bg-[#181920] border-2 border-black p-4 space-y-3.5 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]">
                    <div>
                      <label className="block font-mc text-xs text-gray-300 mb-1 flex items-center gap-1.5">
                        <UserIcon size={12} className="text-[#fcd34d]" />
                        PLAYER USERNAME
                      </label>
                      <input
                        type="text"
                        required
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        placeholder="e.g. Anuvesh"
                        className="w-full bg-[#0e0f14] border-2 border-black p-2.5 font-mc text-sm text-white shadow-[inset_2px_2px_0px_#000] focus:border-[#fcd34d] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mc text-xs text-gray-300 mb-1 flex items-center gap-1.5">
                        <Lock size={12} className="text-[#fcd34d]" />
                        PASSWORD
                      </label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-[#0e0f14] border-2 border-black p-2.5 font-mc text-sm text-white shadow-[inset_2px_2px_0px_#000] focus:border-[#fcd34d] outline-none"
                      />
                    </div>

                    {authError && (
                      <div className="bg-red-950/80 border-2 border-red-500 text-red-200 p-2.5 font-mc text-xs">
                        ⚠️ {authError}
                      </div>
                    )}

                    {authSuccess && (
                      <div className="bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 p-2.5 font-mc text-xs">
                        ✨ {authSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="mc-button-primary w-full py-2.5 font-mc text-xs font-bold uppercase tracking-wider cursor-pointer mt-2"
                    >
                      {authLoading ? 'CONNECTING TO REALM...' : authMode === 'login' ? 'SIGN IN TO REALM' : 'SIGN UP & CREATE CHARACTER'}
                    </button>

                    <div className="text-center pt-1">
                      {authMode === 'login' ? (
                        <p className="text-xs text-gray-400 font-sans">
                          Need a new adventurer account?{' '}
                          <button
                            type="button"
                            onClick={() => { setAuthMode('register'); setAuthError(''); }}
                            className="text-[#fcd34d] hover:underline font-mc font-bold cursor-pointer ml-1"
                          >
                            SIGN UP HERE
                          </button>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 font-sans">
                          Already have an adventurer account?{' '}
                          <button
                            type="button"
                            onClick={() => { setAuthMode('login'); setAuthError(''); }}
                            className="text-[#55ff55] hover:underline font-mc font-bold cursor-pointer ml-1"
                          >
                            SIGN IN HERE
                          </button>
                        </p>
                      )}
                    </div>
                  </form>

                  {/* Active session info & sign out */}
                  {localStorage.getItem('lifecraft_token') && (
                    <div className="bg-[#0e0f14] border-2 border-black p-3 flex justify-between items-center shadow-[inset_1px_1px_0px_rgba(0,0,0,0.8)]">
                      <div className="font-mc text-xs text-gray-300">
                        <span>SIGNED IN: </span>
                        <strong className="text-[#55ff55] ml-1">{userData?.username}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mc-button-danger px-3 py-1 font-mc text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <LogOut size={12} /> SIGN OUT
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeModal === 'settings' && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="bg-neutral-800 border-2 border-black p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-pixel text-xs text-white">SOUND EFFECTS (SFX)</span>
                      <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="mc-button-base px-3 py-1 font-pixel text-xs"
                      >
                        {soundEnabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-pixel text-xs text-white">DATABASE SYNC</span>
                      <span className="text-[#55ff55] font-pixel text-xs">SUPABASE / SQLALCHEMY</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-pixel text-xs text-white">HEALTH MECHANIC</span>
                      <span className="text-[#ff5555] font-pixel text-xs">10 HEARTS SURVIVAL</span>
                    </div>

                    {/* Panorama Theme Section */}
                    <div className="pt-3 border-t-2 border-neutral-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-pixel text-xs text-[#ffff55]">LIVE MINECRAFT BACKGROUND</span>
                        <span className="font-sans text-[10px] text-gray-400">Drag background to explore</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.values(PANORAMA_THEMES).map((thm) => (
                          <button
                            key={thm.id}
                            onClick={() => handleThemeChange(thm.id)}
                            className={`p-2 border-2 font-pixel text-[10px] text-center transition-colors ${
                              panoramaTheme === thm.id
                                ? 'bg-[#55ff55]/20 border-[#55ff55] text-[#55ff55]'
                                : 'bg-neutral-850 border-black text-gray-300 hover:text-white hover:bg-neutral-750'
                            }`}
                          >
                            <span className="block">{thm.name}</span>
                            <span className="font-sans text-[9px] text-gray-400 block mt-0.5">{thm.subtitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Panorama Motion Controls */}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-neutral-700">
                      <div>
                        <span className="font-pixel text-xs text-white block">PANORAMA MOTION</span>
                        <span className="font-sans text-[10px] text-gray-400">Continuous 360 camera rotation</span>
                      </div>
                      <button 
                        onClick={() => setPanoramaPaused(!panoramaPaused)}
                        className={`mc-button-base px-3 py-1 font-pixel text-xs ${panoramaPaused ? 'text-[#ff5555]' : 'text-[#55ff55]'}`}
                      >
                        {panoramaPaused ? 'PAUSED' : 'ROTATING'}
                      </button>
                    </div>

                    {/* Shaders Status */}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-neutral-700">
                      <div>
                        <span className="font-pixel text-xs text-white block">MINECRAFT SHADERS (BSL / COMPLEMENTARY)</span>
                        <span className="font-sans text-[10px] text-gray-400">Volumetric God Rays, Sunlight Bloom & Ambient Occlusion</span>
                      </div>
                      <span className="text-[#ffff55] font-pixel text-xs">
                        ✨ ALWAYS ON
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t-2 border-neutral-700">
                      <span className="font-pixel text-xs text-white">ROTATION SPEED</span>
                      <div className="flex gap-2">
                        {[0.5, 1.0, 2.0].map((s) => (
                          <button
                            key={s}
                            onClick={() => setPanoramaSpeed(s)}
                            className={`px-2.5 py-0.5 font-pixel text-xs border ${
                              panoramaSpeed === s
                                ? 'border-[#55ff55] text-[#55ff55] bg-[#55ff55]/10'
                                : 'border-neutral-700 text-gray-400 hover:text-white'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Button */}
              <div className="mt-6 pt-4 border-t-2 border-neutral-700 flex justify-center">
                <MinecraftButton 
                  onClick={() => setActiveModal(null)}
                  className="max-w-xs"
                >
                  BACK TO TITLE SCREEN
                </MinecraftButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
