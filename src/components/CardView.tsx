import React from 'react';
import { YugiohCard, Position } from '../types/yugioh';

interface CardViewProps {
  card: YugiohCard;
  position?: Position;
  isFacedown?: boolean;
  isSelected?: boolean;
  isTargetable?: boolean;
  isAttacking?: boolean;
  isDefending?: boolean;
  isDestroyed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  position = 'attack',
  isFacedown = false,
  isSelected = false,
  isTargetable = false,
  isAttacking = false,
  isDefending = false,
  isDestroyed = false,
  size = 'md',
  onClick,
  onContextMenu,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-24 text-[9px]',
    md: 'w-24 h-36 text-xs',
    lg: 'w-36 h-54 text-sm',
  };

  const getFrameBg = (type: YugiohCard['type']) => {
    switch (type) {
      case 'Normal Monster':
        return 'from-amber-600 via-yellow-700 to-amber-800 border-amber-400';
      case 'Effect Monster':
        return 'from-orange-600 via-amber-700 to-orange-800 border-amber-500';
      case 'Fusion Monster':
        return 'from-purple-800 via-purple-900 to-indigo-950 border-purple-400';
      case 'Synchro Monster':
        return 'from-slate-200 via-slate-300 to-slate-400 text-gray-900 border-slate-100';
      case 'Xyz Monster':
        return 'from-gray-900 via-black to-slate-900 border-gray-600';
      case 'Spell Card':
        return 'from-teal-600 via-emerald-700 to-teal-900 border-teal-300';
      case 'Trap Card':
        return 'from-fuchsia-700 via-pink-800 to-purple-900 border-pink-400';
      default:
        return 'from-amber-700 to-amber-900 border-amber-500';
    }
  };

  const getAttributeBadge = (attr?: string) => {
    switch (attr) {
      case 'LIGHT': return 'bg-yellow-300 text-yellow-950';
      case 'DARK': return 'bg-purple-900 text-purple-200 border border-purple-500';
      case 'FIRE': return 'bg-red-600 text-white';
      case 'WATER': return 'bg-blue-600 text-white';
      case 'EARTH': return 'bg-amber-800 text-amber-100';
      case 'WIND': return 'bg-emerald-600 text-white';
      case 'DIVINE': return 'bg-yellow-500 text-black font-bold';
      case 'SPELL': return 'bg-teal-700 text-white';
      case 'TRAP': return 'bg-pink-700 text-white';
      default: return 'bg-slate-700 text-white';
    }
  };

  // Face-down card rendering
  if (isFacedown || position === 'facedown') {
    return (
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`relative ${sizeClasses[size]} rounded-md border-2 border-amber-900 bg-gradient-to-br from-red-950 via-amber-950 to-neutral-900 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 select-none ${
          position === 'defense' || position === 'facedown' ? 'rotate-90' : ''
        } ${isSelected ? 'ring-4 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : ''} ${
          isDestroyed ? 'scale-0 opacity-0 transition-all duration-500' : ''
        }`}
      >
        <div className="absolute inset-1 rounded border border-amber-700/50 flex flex-col items-center justify-center overflow-hidden bg-radial from-amber-900/40 to-black">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/70 flex items-center justify-center bg-black/60 shadow-inner">
            <div className="w-4 h-4 rotate-45 border border-yellow-400 bg-amber-600/60" />
          </div>
          <span className="text-[8px] font-mono text-amber-500/80 mt-1 uppercase tracking-widest font-bold">Yu-Gi-Oh!</span>
        </div>
      </div>
    );
  }

  const isMonster = card.type.includes('Monster');

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`relative ${sizeClasses[size]} rounded-md border-2 bg-gradient-to-b ${getFrameBg(
        card.type
      )} p-1 shadow-md cursor-pointer select-none transform transition-all duration-200 hover:scale-105 hover:z-20 ${
        position === 'defense' ? 'rotate-90' : ''
      } ${isSelected ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.9)] scale-110' : ''} ${
        isTargetable ? 'ring-4 ring-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)]' : ''
      } ${
        isAttacking
          ? 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(250,204,21,1)] scale-115 -translate-y-2 z-30 animate-pulse'
          : ''
      } ${
        isDefending
          ? 'ring-4 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,1)] z-30'
          : ''
      } ${
        isDestroyed
          ? 'scale-0 opacity-0 rotate-180 transition-all duration-500 filter contrast-200 brightness-150'
          : ''
      }`}
    >
      {/* Holographic foil overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-sm" />

      {/* Header: Name & Attribute */}
      <div className="flex items-center justify-between bg-black/70 px-1 py-0.5 rounded text-white text-[10px] font-bold leading-tight mb-0.5 border border-amber-500/30">
        <span className="truncate max-w-[70%] font-serif tracking-tight" title={card.name}>{card.name}</span>
        {card.attribute && (
          <span className={`text-[8px] px-1 py-0.2 rounded font-mono uppercase ${getAttributeBadge(card.attribute)}`}>
            {card.attribute.slice(0, 4)}
          </span>
        )}
      </div>

      {/* Level Stars */}
      {isMonster && card.level && (
        <div className="flex justify-end gap-0.5 px-0.5 my-0.5">
          {Array.from({ length: Math.min(card.level, 12) }).map((_, i) => (
            <span key={i} className="text-[9px] text-yellow-400 drop-shadow-[0_0_2px_rgba(234,179,8,0.8)]">★</span>
          ))}
        </div>
      )}

      {/* Card Artwork Image */}
      <div className="relative w-full h-[52%] rounded overflow-hidden bg-black border border-black/40 my-0.5 shadow-inner">
        <img
          src={card.imageUrl || card.imageUrlSmall || 'https://images.ygoprodeck.com/images/cards/89631139.jpg'}
          alt={card.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.ygoprodeck.com/images/cards/89631139.jpg';
          }}
        />
      </div>

      {/* Description Box */}
      <div className="bg-amber-100/90 text-amber-950 p-1 rounded text-[8px] leading-none line-clamp-2 h-[22%] font-serif overflow-hidden border border-amber-300">
        {card.race && <span className="font-bold block mb-0.5 text-[8px] text-amber-900">[{card.race}]</span>}
        {card.desc}
      </div>

      {/* ATK / DEF Footer */}
      {isMonster && (
        <div className="flex justify-between items-center bg-black/90 text-white font-mono px-1 py-0.5 mt-0.5 rounded text-[9px] border border-amber-500/40">
          <span className="text-yellow-400 font-bold">ATK/{card.atk ?? 0}</span>
          <span className="text-blue-300 font-bold">DEF/{card.def ?? 0}</span>
        </div>
      )}
    </div>
  );
};
