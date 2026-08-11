import React from 'react';
import { GameMode, AIPersonality, RuleMode } from '../types/yugioh';
import { Swords, Layers, Search, PlusCircle, Volume2, VolumeX, Music, HelpCircle, Bot, BookOpen, Sparkles } from 'lucide-react';
import { toggleMute, getMuteState, toggleBgm } from '../utils/soundEffects';

interface NavbarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  aiPersonality: AIPersonality;
  onSelectAiPersonality: (ai: AIPersonality) => void;
  ruleMode: RuleMode;
  onSelectRuleMode: (ruleMode: RuleMode) => void;
  onOpenHowToPlay: () => void;
  onResetDuel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  aiPersonality,
  onSelectAiPersonality,
  ruleMode,
  onSelectRuleMode,
  onOpenHowToPlay,
  onResetDuel,
}) => {
  const [muted, setMuted] = React.useState(getMuteState());
  const [bgmActive, setBgmActive] = React.useState(false);

  const handleToggleMute = () => {
    const isM = toggleMute();
    setMuted(isM);
  };

  const handleToggleBgm = () => {
    const active = toggleBgm();
    setBgmActive(active);
  };

  return (
    <header className="w-full bg-neutral-950/90 border-b border-amber-500/40 backdrop-blur-lg sticky top-0 z-40 px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectMode('vs-ai')}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-0.5 shadow-[0_0_15px_rgba(234,179,8,0.6)] flex items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[6px] flex items-center justify-center font-bold text-amber-400 font-serif text-lg">
              遊
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif tracking-wider bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
              YU-GI-OH! <span className="text-xs text-amber-400 font-sans tracking-normal font-normal">POWER OF CHAOS</span>
            </h1>
            <p className="text-[10px] text-amber-500/70 font-mono tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              {ruleMode === 'poc-yugi' ? 'YUGI THE DESTINY PC LOGIC' : ruleMode === 'og-1999' ? '1999 OG OCG Rulebook' : 'Standard Master Rules'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => onSelectMode('vs-ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentMode === 'vs-ai'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> Vs AI Duel
          </button>
          <button
            onClick={() => onSelectMode('local-2p')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentMode === 'local-2p'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Pass & Play (2P)
          </button>
          <button
            onClick={() => onSelectMode('deck-builder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentMode === 'deck-builder'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Deck Builder
          </button>
          <button
            onClick={() => onSelectMode('card-search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentMode === 'card-search'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Card Database
          </button>
          <button
            onClick={() => onSelectMode('card-creator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentMode === 'card-creator'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Create Card
          </button>
        </nav>

        {/* RULEMODE & AI SELECTORS */}
        <div className="flex items-center gap-2">
          {/* Rulebook Mode Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2.5 py-1 rounded-lg border border-amber-500/40 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={ruleMode}
              onChange={(e) => onSelectRuleMode(e.target.value as RuleMode)}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="poc-yugi">Yugi the Destiny (PC Logic)</option>
              <option value="og-1999">1999 OG OCG (Starter Box)</option>
              <option value="standard">Standard Master Rules</option>
            </select>
          </div>

          {currentMode === 'vs-ai' && (
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800 text-xs">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={aiPersonality}
                onChange={(e) => onSelectAiPersonality(e.target.value as AIPersonality)}
                className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="yugi">Yugi Muto (Yugi the Destiny)</option>
                <option value="kaiba">Seto Kaiba (Blue-Eyes)</option>
                <option value="joey">Joey Wheeler (Red-Eyes)</option>
              </select>
            </div>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition ${
              muted ? 'bg-red-950/60 border-red-800 text-red-400' : 'bg-neutral-900 border-neutral-800 text-gray-300 hover:text-white'
            }`}
            title="Toggle Sound Effects"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* BGM Music Toggle */}
          <button
            onClick={handleToggleBgm}
            className={`p-2 rounded-lg border transition ${
              bgmActive ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse' : 'bg-neutral-900 border-neutral-800 text-gray-300 hover:text-white'
            }`}
            title="Toggle Duel Background Music"
          >
            <Music className="w-4 h-4" />
          </button>

          {/* How to play guide */}
          <button
            onClick={onOpenHowToPlay}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-gray-300 hover:text-white transition"
            title="Rulebook Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset Duel */}
          {(currentMode === 'vs-ai' || currentMode === 'local-2p') && (
            <button
              onClick={onResetDuel}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-bold transition shadow-sm"
            >
              New Duel
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
