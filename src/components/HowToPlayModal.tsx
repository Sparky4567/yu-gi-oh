import React from 'react';
import { Sparkles, Shield, Swords, Layers, Zap, Flame, Award, BookOpen } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-neutral-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(234,179,8,0.3)]">
        <div className="flex items-center justify-between border-b border-amber-500/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-yellow-400" />
            <h2 className="text-2xl font-extrabold font-serif text-yellow-400 tracking-wide">
              YU-GI-OH! POWER OF CHAOS: YUGI THE DESTINY RULEBOOK
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-6 text-sm text-gray-200 pr-2">
          {/* Section 1: Overview */}
          <section className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-amber-300 font-serif mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> 1. Power of Chaos: Yugi the Destiny Mechanics
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This digital duel simulator faithfully recreates the classic PC game mechanics of <strong>Yu-Gi-Oh! Power of Chaos: Yugi the Destiny (2003)</strong>. Turn structure, Phase advancement, card auto-drawing, tribute summoning, face-down Trap activation prompts, and combat recoil follow classic Yugi the Destiny logic!
            </p>
          </section>

          {/* Section 2: Turn Structure */}
          <section className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-amber-300 font-serif mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" /> 2. Turn Phases & Automated Card Draw
            </h3>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-gray-300">
              <li><strong>Draw Phase</strong>: Automatically draws 1 card from your deck with 3D draw animation and SFX at turn start!</li>
              <li><strong>Main Phase 1</strong>: Summon monsters, set Spells/Traps, change battle positions.</li>
              <li><strong>Battle Phase</strong>: Select your Attack-position monsters to attack opponent monsters or direct attack!</li>
              <li><strong>Main Phase 2</strong>: Set defensive cards after combat before ending turn.</li>
              <li><strong>End Turn Fast-Forward</strong>: Click <em>End Turn ⌛</em> to skip directly to the next round!</li>
            </ul>
          </section>

          {/* Section 3: Tribute Summons */}
          <section className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-amber-300 font-serif mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> 3. Tribute Summon Rules
            </h3>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-gray-300">
              <li><strong>Level 1 - 4 Monsters</strong>: 0 Tributes required (Direct Normal Summon or Set).</li>
              <li><strong>Level 5 - 6 Monsters</strong>: 1 Tribute required (e.g. <em>Summoned Skull</em>). Select 1 monster on field to send to GY.</li>
              <li><strong>Level 7+ Monsters</strong>: 2 Tributes required (e.g. <em>Dark Magician</em>, <em>Blue-Eyes White Dragon</em>). Select 2 monsters on field to send to GY.</li>
            </ul>
          </section>

          {/* Section 4: Trap Activations */}
          <section className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-amber-300 font-serif mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> 4. Trap Card Activation & Prompts
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              When set face-down in your S/T zones:
            </p>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-gray-300">
              <li><strong>Manual Activation</strong>: Click any set Trap/Spell on your turn to open the floating menu and click <em>🔮 Activate Card</em>!</li>
              <li><strong>Battle Trap Triggering</strong>: When opponent declares an attack, face-down Traps like <em>Mirror Force</em> or <em>Magic Cylinder</em> trigger automatically with full overlay banners and sound effects!</li>
            </ul>
          </section>

          {/* Section 5: Exodia Victory */}
          <section className="bg-gradient-to-r from-amber-950/80 to-yellow-950/80 p-4 rounded-xl border border-amber-500/50">
            <h3 className="text-base font-bold text-yellow-400 font-serif mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" /> 5. Exodia Instant Win & Victory Conditions
            </h3>
            <p className="text-xs text-yellow-200 leading-relaxed">
              Assemble all 5 pieces of <em>Exodia the Forbidden One</em> in your hand at any moment to trigger instant victory! Reduce opponent LP to 0 or win by Deck OutLP calculation.
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition transform hover:scale-105"
          >
            Got It! Start Duel
          </button>
        </div>
      </div>
    </div>
  );
};
