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
  Gift, 
  Sparkles,
  Server,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Compass
} from 'lucide-react';
import MinecraftButton from './MinecraftButton';
import SplashText from './SplashText';
import MinecraftPanorama, { PANORAMA_THEMES } from './MinecraftPanorama';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MainMenu() {
  const [activeModal, setActiveModal] = useState(null); // 'quests' | 'profile' | 'rewards' | 'settings' | null
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'online' | 'offline' | 'connecting'
  const [userData, setUserData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live Panorama Background States (Default: SAKURA BIOME)
  const [panoramaTheme, setPanoramaTheme] = useState(() => {
    const saved = localStorage.getItem('lifecraft_theme');
    if (saved && (saved === 'cherry' || saved === 'sakura')) return 'sakura';
    return saved || 'sakura';
  });
  const [panoramaSpeed, setPanoramaSpeed] = useState(1.0);
  const [panoramaPaused, setPanoramaPaused] = useState(false);

  const handleThemeChange = (newTheme) => {
    const actualTheme = newTheme === 'cherry' ? 'sakura' : newTheme;
    setPanoramaTheme(actualTheme);
    localStorage.setItem('lifecraft_theme', actualTheme);
  };

  // Cycle through available themes quickly
  const cycleTheme = () => {
    const themeKeys = Object.keys(PANORAMA_THEMES);
    const currentIndex = themeKeys.indexOf(panoramaTheme);
    const nextTheme = themeKeys[(currentIndex + 1) % themeKeys.length];
    handleThemeChange(nextTheme);
  };

  // Ping backend on mount
  useEffect(() => {
    async function checkBackend() {
      try {
        const healthRes = await fetch(`${API_BASE_URL}/api/health`);
        if (healthRes.ok) {
          setBackendStatus('online');
          // Fetch seeded player data
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
        // Provide fallback data matching seed if backend is still starting
        setUserData({
          username: "Anuvesh",
          level: 1,
          xp: 0,
          next_level_xp: 100,
          coins: 20,
          hearts: 10.0,
          streak: 1,
          attributes: { strength: 10, intelligence: 15, discipline: 12 },
          quests: [
            { id: 1, title: "Implement LightGBM Model", type: "todo", category: "Coding", attribute_target: "intelligence", xp_reward: 50, coin_reward: 20, is_completed: false },
            { id: 2, title: "Complete TCET IT-D Assignment", type: "todo", category: "College", attribute_target: "intelligence", xp_reward: 30, coin_reward: 10, is_completed: false },
            { id: 3, title: "Eat Paneer & Soya Chunks for 65kg goal", type: "daily", category: "Fitness", attribute_target: "strength", xp_reward: 20, coin_reward: 5, is_completed: false },
            { id: 4, title: "1.5 Hour Gym Split", type: "daily", category: "Fitness", attribute_target: "strength", xp_reward: 40, coin_reward: 15, is_completed: false }
          ],
          rewards: [
            { id: 1, title: "1 Hour PC Gaming", coin_cost: 30 },
            { id: 2, title: "Buy Coffee", coin_cost: 15 }
          ]
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

      {/* Top Banner / Navigation helper */}
      <div className="relative z-10 w-full px-6 py-3 flex justify-between items-center border-b-4 border-black/60 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={cycleTheme}
            className="font-pixel text-xs text-[#ffff55] hover:text-[#55ff55] tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
            title="Click to switch Minecraft Panorama Realm"
          >
            <Compass size={14} className="text-[#55ff55] animate-spin-slow" />
            <span>REALM: {PANORAMA_THEMES[panoramaTheme]?.name.toUpperCase() || 'CLASSIC'}</span>
          </button>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-pixel">
          {/* Pause / Resume Live Background Motion */}
          <button
            onClick={() => setPanoramaPaused(!panoramaPaused)}
            className="hover:text-[#ffff55] flex items-center gap-1.5 transition-colors cursor-pointer"
            title={panoramaPaused ? "Resume Background Rotation" : "Pause Background Rotation"}
          >
            {panoramaPaused ? <Play size={14} className="text-[#55ff55]" /> : <Pause size={14} className="text-[#fca800]" />}
            <span className="hidden sm:inline">{panoramaPaused ? 'MOTION PAUSED' : 'LIVE 3D'}</span>
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="hover:text-[#ffff55] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{soundEnabled ? 'SFX ON' : 'SFX OFF'}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Server size={14} className={backendStatus === 'online' ? 'text-[#55ff55]' : 'text-[#ff5555]'} />
            <span className={backendStatus === 'online' ? 'text-[#55ff55]' : 'text-[#ff5555]'}>
              {backendStatus === 'online' ? 'FASTAPI ONLINE' : 'STANDALONE MODE'}
            </span>
          </div>
        </div>
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
              onClick={() => setActiveModal('biomes')}
              icon={<Shield size={16} />}
            >
              BIOMES
            </MinecraftButton>
            <MinecraftButton 
              onClick={() => setActiveModal('settings')}
            >
              OPTIONS...
            </MinecraftButton>
          </div>
        </div>

        {/* Mini HUD Preview under button stack */}
        {userData && (
          <div className="mt-8 w-full max-w-md bg-black/60 border-4 border-[#373737] p-3 text-center">
            <div className="flex justify-between items-center text-xs font-pixel mb-2">
              <span className="text-[#ffff55]">LVL {userData.level} {userData.username}</span>
              <span className="text-[#fca800] flex items-center gap-1">
                <Coins size={12} /> {userData.coins} COINS
              </span>
            </div>
            {/* Hearts Row */}
            <div className="flex justify-center items-center gap-1.5 my-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Heart 
                  key={i} 
                  size={18} 
                  className={`drop-shadow ${i < Math.floor(userData.hearts) ? 'text-[#ff2222] fill-[#ff2222]' : 'text-gray-600'}`} 
                />
              ))}
            </div>
            {/* XP Bar */}
            <div className="mt-2 w-full mc-bar-container h-4 relative overflow-hidden">
              <div 
                className="h-full bg-[#55ff55] transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.round((userData.xp / userData.next_level_xp) * 100))}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-pixel text-[9px] text-white text-shadow-sm">
                XP: {userData.xp} / {userData.next_level_xp} (Level Math: 100 * Level^1.5)
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info Bar */}
      <footer className="relative z-10 w-full px-6 py-2.5 flex flex-col sm:flex-row justify-between items-center text-[10px] md:text-xs font-pixel text-gray-400 border-t-4 border-black/50 bg-black/40 backdrop-blur-sm gap-2">
        <div>
          <span>LifeCraft v1.0.0 (Phase 1 MVP)</span>
          <span className="mx-2">|</span>
          <span className="text-gray-300">FastAPI & Supabase Ready</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#ff5555]">
            <Flame size={12} /> Streak: {userData?.streak || 1} Day
          </span>
          <span>Player: <strong className="text-white">Anuvesh</strong></span>
        </div>
      </footer>

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
              className="relative w-full max-w-2xl mc-panel-dark-frame p-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 border-2 border-black bg-neutral-800"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="text-center pb-4 border-b-4 border-neutral-700 mb-6">
                <h2 className="font-pixel text-xl sm:text-2xl text-[#ffff55] text-shadow-sm">
                  {activeModal === 'quests' && 'ACTIVE QUESTS & BIOMES'}
                  {activeModal === 'profile' && 'CHARACTER STATS & ATTRIBUTES'}
                  {activeModal === 'rewards' && 'CUSTOM REWARD SHOP'}
                  {activeModal === 'biomes' && 'UNIFIED BIOMES MAP'}
                  {activeModal === 'settings' && 'GAMEPLAY & SETTINGS'}
                </h2>
                <p className="font-sans text-xs text-gray-400 mt-1">
                  Minecraft RPG Mechanics • Unified World Saves
                </p>
              </div>

              {/* Modal Body Content */}
              {activeModal === 'quests' && (
                <div className="space-y-4">
                  <div className="bg-black/50 p-3 border-2 border-neutral-700 text-xs font-sans text-gray-300">
                    <p className="font-pixel text-[#55ff55] text-xs mb-1">SURVIVAL LOGIC RULES:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Dailies:</strong> Reset at midnight. Missing a daily inflicts <span className="text-[#ff5555] font-bold">0.5 Hearts of damage</span>!</li>
                      <li><strong>Todos:</strong> Disappear upon completion. Reward instant XP and Coins.</li>
                      <li><strong>Formula:</strong> Leveling required XP is calculated as <code className="text-[#ffff55]">100 * (Level ^ 1.5)</code>.</li>
                    </ul>
                  </div>

                  <h3 className="font-pixel text-sm text-[#ffff55] pt-2">QUEST LOG (Seeded Data):</h3>
                  <div className="space-y-2.5">
                    {userData?.quests?.map((quest) => (
                      <div 
                        key={quest.id}
                        className="bg-neutral-800 border-2 border-black p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-neutral-750 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <Circle size={16} className="text-[#55ff55] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-pixel text-xs text-white leading-relaxed">{quest.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-sans text-gray-400">
                              <span className="uppercase px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-xs font-pixel text-[#55ffff]">
                                {quest.type}
                              </span>
                              <span>Biome: <strong className="text-gray-200">{quest.category}</strong></span>
                              {quest.attribute_target && (
                                <span className="text-[#ffff55]">({quest.attribute_target.toUpperCase()})</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-pixel text-xs shrink-0 self-end sm:self-center">
                          <span className="text-[#55ff55]">+{quest.xp_reward} XP</span>
                          <span className="text-[#fca800]">+{quest.coin_reward}G</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-neutral-800 border-2 border-black p-4 text-center">
                      <Sword size={24} className="mx-auto mb-2 text-[#ff5555]" />
                      <h4 className="font-pixel text-xs text-gray-400">STRENGTH</h4>
                      <p className="font-pixel text-2xl text-white mt-1">{userData?.attributes?.strength || 10}</p>
                      <span className="text-[10px] text-gray-400 font-sans">Fitness & Health</span>
                    </div>
                    <div className="bg-neutral-800 border-2 border-black p-4 text-center">
                      <Brain size={24} className="mx-auto mb-2 text-[#55ffff]" />
                      <h4 className="font-pixel text-xs text-gray-400">INTELLIGENCE</h4>
                      <p className="font-pixel text-2xl text-white mt-1">{userData?.attributes?.intelligence || 15}</p>
                      <span className="text-[10px] text-gray-400 font-sans">Coding & College</span>
                    </div>
                    <div className="bg-neutral-800 border-2 border-black p-4 text-center">
                      <Shield size={24} className="mx-auto mb-2 text-[#ffff55]" />
                      <h4 className="font-pixel text-xs text-gray-400">DISCIPLINE</h4>
                      <p className="font-pixel text-2xl text-white mt-1">{userData?.attributes?.discipline || 12}</p>
                      <span className="text-[10px] text-gray-400 font-sans">Consistency & Habits</span>
                    </div>
                  </div>

                  <div className="bg-black/40 border-2 border-neutral-700 p-4">
                    <h4 className="font-pixel text-xs text-[#55ff55] mb-2">SURVIVAL STATUS</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div>
                        <p className="text-gray-400">Hearts Remaining:</p>
                        <p className="font-pixel text-sm text-[#ff5555]">{userData?.hearts || 10} / 10 Hearts</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Daily Streak:</p>
                        <p className="font-pixel text-sm text-[#fca800]">{userData?.streak || 1} Days Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'rewards' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/40 border-2 border-neutral-700 p-3">
                    <span className="font-pixel text-xs text-gray-300">WALLET BALANCE:</span>
                    <span className="font-pixel text-sm text-[#fca800] flex items-center gap-1.5">
                      <Coins size={16} /> {userData?.coins || 20} GOLD COINS
                    </span>
                  </div>

                  <div className="space-y-3">
                    {userData?.rewards?.map((reward) => (
                      <div 
                        key={reward.id}
                        className="bg-neutral-800 border-2 border-black p-4 flex justify-between items-center hover:bg-neutral-750 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Gift size={20} className="text-[#fca800]" />
                          <div>
                            <p className="font-pixel text-xs text-white">{reward.title}</p>
                            <p className="font-sans text-[11px] text-gray-400">Real-life dopamine reward</p>
                          </div>
                        </div>
                        <button className="mc-button-base px-3 py-1.5 font-pixel text-xs text-[#fca800]">
                          {reward.coin_cost} COINS
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'biomes' && (
                <div className="space-y-4 text-xs font-sans">
                  <p className="text-gray-300">
                    In LifeCraft, there are no fragmented save files. All quests inhabit the <strong>Unified World</strong>, categorized into active life Biomes. Click a Biome to immerse yourself in its realm:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div 
                      onClick={() => handleThemeChange('dark')}
                      className={`cursor-pointer border-2 p-3 text-center transition-all ${
                        panoramaTheme === 'dark' ? 'border-[#55ffff] bg-neutral-850 shadow-md' : 'bg-neutral-800 border-black hover:border-neutral-600'
                      }`}
                    >
                      <span className="font-pixel text-xs text-[#55ffff] block mb-1">CODING BIOME</span>
                      <p className="text-[11px] text-gray-400 mb-2">Machine Learning, LightGBM, Fullstack development.</p>
                      <span className="font-pixel text-[9px] text-[#ffff55] bg-black/50 px-2 py-0.5 border border-neutral-700 inline-block">
                        {panoramaTheme === 'dark' ? 'ACTIVE REALM' : 'SET REALM VIEW'}
                      </span>
                    </div>
                    <div 
                      onClick={() => handleThemeChange('classic')}
                      className={`cursor-pointer border-2 p-3 text-center transition-all ${
                        panoramaTheme === 'classic' ? 'border-[#55ff55] bg-neutral-850 shadow-md' : 'bg-neutral-800 border-black hover:border-neutral-600'
                      }`}
                    >
                      <span className="font-pixel text-xs text-[#55ff55] block mb-1">FITNESS BIOME</span>
                      <p className="text-[11px] text-gray-400 mb-2">Gym splits, 65kg target, Protein buttermilk nutrition.</p>
                      <span className="font-pixel text-[9px] text-[#ffff55] bg-black/50 px-2 py-0.5 border border-neutral-700 inline-block">
                        {panoramaTheme === 'classic' ? 'ACTIVE REALM' : 'SET REALM VIEW'}
                      </span>
                    </div>
                    <div 
                      onClick={() => handleThemeChange('sakura')}
                      className={`cursor-pointer border-2 p-3 text-center transition-all ${
                        (panoramaTheme === 'sakura' || panoramaTheme === 'cherry') ? 'border-[#ff77aa] bg-neutral-850 shadow-md ring-2 ring-pink-500/50' : 'bg-neutral-800 border-black hover:border-neutral-600'
                      }`}
                    >
                      <span className="font-pixel text-xs text-[#ff77aa] block mb-1">🌸 SAKURA BIOME</span>
                      <p className="text-[11px] text-gray-400 mb-2">TCET IT-D assignments, Cherry Grove petals, calm focus.</p>
                      <span className="font-pixel text-[9px] text-[#ffff55] bg-black/50 px-2 py-0.5 border border-neutral-700 inline-block">
                        {(panoramaTheme === 'sakura' || panoramaTheme === 'cherry') ? 'ACTIVE REALM' : 'SET REALM VIEW'}
                      </span>
                    </div>
                  </div>
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
