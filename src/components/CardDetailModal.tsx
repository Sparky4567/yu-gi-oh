import React from 'react';
import { YugiohCard, Position } from '../types/yugioh';
import { X, Shield, Swords, Sparkles, Star, RefreshCw } from 'lucide-react';

interface CardDetailModalProps {
  card: YugiohCard | null;
  onClose: () => void;
  onAction?: (action: 'summon-attack' | 'summon-defense' | 'activate' | 'set') => void;
  canPlay?: boolean;
  onSwitchPosition?: () => void;
  currentPosition?: Position;
  canSwitchPosition?: boolean;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  onClose,
  onAction,
  canPlay = false,
  onSwitchPosition,
  currentPosition,
  canSwitchPosition = false,
}) => {
  if (!card) return null;

  const isMonster = card.type.includes('Monster');
  const targetPosText = currentPosition === 'attack' ? 'DEFENSE' : 'ATTACK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-neutral-900 border-2 border-amber-500/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.2)] text-white flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Artwork Column */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="w-56 h-84 rounded-xl overflow-hidden shadow-2xl border-4 border-amber-500/40 relative group">
            <img
              src={card.imageUrl || card.imageUrlSmall || 'https://images.ygoprodeck.com/images/cards/89631139.jpg'}
              alt={card.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-yellow-200/20 pointer-events-none" />
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col flex-grow justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-700 pb-3 mb-3">
              <div>
                <h2 className="text-2xl font-bold text-amber-400 font-serif">{card.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-950 text-amber-300 border border-amber-700">
                    {card.type}
                  </span>
                  {card.attribute && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-950 text-purple-300 border border-purple-700">
                      {card.attribute}
                    </span>
                  )}
                  {card.race && (
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-gray-300">
                      [{card.race}]
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Level Stars */}
            {isMonster && card.level && (
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xs font-semibold text-gray-400 mr-1">Level/Rank:</span>
                {Array.from({ length: card.level }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                ))}
              </div>
            )}

            {/* ATK / DEF Badges */}
            {isMonster && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-neutral-800/80 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                  <Swords className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-xs text-gray-400 font-mono">ATK</div>
                    <div className="text-xl font-bold text-yellow-400 font-mono">{card.atk ?? 0}</div>
                  </div>
                </div>
                <div className="bg-neutral-800/80 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-xs text-gray-400 font-mono">DEF</div>
                    <div className="text-xl font-bold text-blue-400 font-mono">{card.def ?? 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Card Description */}
            <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 mb-4 max-h-48 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-400 mb-1">Card Effect / Lore:</h3>
              <p className="text-sm text-gray-200 leading-relaxed font-serif">{card.desc}</p>
            </div>
          </div>

          {/* Position Change Action for Monsters on Field */}
          {canSwitchPosition && onSwitchPosition && (
            <div className="pt-2 border-t border-neutral-800 mb-2">
              <button
                onClick={onSwitchPosition}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" /> Switch Position to {targetPosText}
              </button>
            </div>
          )}

          {/* Hand Play Actions */}
          {canPlay && onAction && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
              {isMonster ? (
                <>
                  <button
                    onClick={() => onAction('summon-attack')}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Swords className="w-4 h-4" /> Summon Attack
                  </button>
                  <button
                    onClick={() => onAction('summon-defense')}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Shield className="w-4 h-4" /> Set Defense
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onAction('activate')}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" /> Activate Spell/Trap
                  </button>
                  <button
                    onClick={() => onAction('set')}
                    className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-bold rounded-lg border border-neutral-600 flex items-center justify-center gap-2 transition"
                  >
                    Set Face-Down
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
