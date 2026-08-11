import React, { useState } from 'react';
import { YugiohCard } from '../types/yugioh';
import { CLASSIC_CARDS } from '../data/defaultCards';
import { KAIBA_DECK, YUGI_DECK, JOEY_DECK } from '../data/starterDecks';
import { CardView } from './CardView';
import { CardDetailModal } from './CardDetailModal';
import { Plus, Trash2, Save, Download, Upload, Layers, Shield, Swords, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface DeckBuilderProps {
  currentDeck: YugiohCard[];
  onSaveDeck: (newDeck: YugiohCard[]) => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  currentDeck,
  onSaveDeck,
}) => {
  const { showToast } = useToast();
  const [activeDeck, setActiveDeck] = useState<YugiohCard[]>(currentDeck);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [inspectedCard, setInspectedCard] = useState<YugiohCard | null>(null);

  // Filter available card pool
  const filteredCards = CLASSIC_CARDS.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || card.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'monster' && card.type.includes('Monster')) ||
      (selectedType === 'spell' && card.type.includes('Spell')) ||
      (selectedType === 'trap' && card.type.includes('Trap'));
    return matchesSearch && matchesType;
  });

  const handleAddCard = (card: YugiohCard) => {
    if (activeDeck.length >= 60) {
      showToast("Maximum deck size is 60 cards!", 'warning');
      return;
    }
    setActiveDeck([...activeDeck, card]);
    showToast(`Added "${card.name}" to deck`, 'success');
  };

  const handleRemoveCard = (index: number) => {
    const removed = activeDeck[index];
    setActiveDeck(activeDeck.filter((_, i) => i !== index));
    if (removed) {
      showToast(`Removed "${removed.name}" from deck`, 'info');
    }
  };

  const handleLoadStarterDeck = (starterDeckCards: YugiohCard[], name: string) => {
    setActiveDeck([...starterDeckCards]);
    showToast(`Loaded ${name}'s starter deck!`, 'success');
  };

  const handleExportDeck = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeDeck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "my_yugioh_deck.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Deck exported to JSON!", 'success');
  };

  const handleImportDeck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setActiveDeck(parsed);
            showToast(`Imported ${parsed.length} cards into deck!`, 'success');
          }
        } catch (err) {
          showToast("Invalid deck JSON file!", 'error');
        }
      };
    }
  };

  // Stats calculation
  const monsterCount = activeDeck.filter(c => c.type.includes('Monster')).length;
  const spellCount = activeDeck.filter(c => c.type.includes('Spell')).length;
  const trapCount = activeDeck.filter(c => c.type.includes('Trap')).length;
  const avgAtk = Math.round(
    activeDeck.reduce((acc, c) => acc + (c.atk || 0), 0) / (monsterCount || 1)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 animate-fade-in text-white">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-900/90 border border-amber-500/40 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold font-serif text-amber-400 flex items-center gap-2">
            <Layers className="w-6 h-6" /> DECK BUILDER & ANALYTICS
          </h2>
          <p className="text-xs text-amber-500/80 font-mono">
            Deck Count: <span className="text-white font-extrabold">{activeDeck.length}</span> / 60 Cards (Min: 40)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleLoadStarterDeck(YUGI_DECK, 'Yugi')}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-amber-300 border border-neutral-700"
          >
            Yugi Deck
          </button>
          <button
            onClick={() => handleLoadStarterDeck(KAIBA_DECK, 'Kaiba')}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-amber-300 border border-neutral-700"
          >
            Kaiba Deck
          </button>
          <button
            onClick={() => handleLoadStarterDeck(JOEY_DECK, 'Joey')}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-amber-300 border border-neutral-700"
          >
            Joey Deck
          </button>

          <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-gray-300 border border-neutral-700 cursor-pointer flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Import JSON
            <input type="file" accept=".json" onChange={handleImportDeck} className="hidden" />
          </label>

          <button
            onClick={handleExportDeck}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-gray-300 border border-neutral-700 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            onClick={() => onSaveDeck(activeDeck)}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg flex items-center gap-1 transition"
          >
            <Save className="w-3.5 h-3.5" /> Save Deck
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-mono">MONSTERS</div>
            <div className="text-lg font-bold text-amber-300">{monsterCount}</div>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-950/60 border border-teal-800 text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-mono">SPELLS</div>
            <div className="text-lg font-bold text-teal-300">{spellCount}</div>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-fuchsia-950/60 border border-fuchsia-800 text-fuchsia-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-mono">TRAPS</div>
            <div className="text-lg font-bold text-fuchsia-300">{trapCount}</div>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-yellow-950/60 border border-yellow-800 text-yellow-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-mono">AVG ATK</div>
            <div className="text-lg font-bold text-yellow-300">{avgAtk} ATK</div>
          </div>
        </div>
      </div>

      {/* Deck Grid & Available Cards Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Deck Section */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col max-h-[600px]">
          <h3 className="text-sm font-bold text-amber-400 font-serif mb-3 flex items-center justify-between border-b border-neutral-800 pb-2">
            <span>ACTIVE DECK LIST ({activeDeck.length})</span>
            {activeDeck.length < 40 && (
              <span className="text-[10px] text-red-400 font-mono">Requires min 40 cards!</span>
            )}
          </h3>

          <div className="flex-grow overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 pr-1">
            {activeDeck.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 italic py-12">Your deck is empty. Add cards below.</p>
            ) : (
              activeDeck.map((card, i) => (
                <div key={i} className="relative group">
                  <CardView card={card} size="sm" onClick={() => setInspectedCard(card)} />
                  <button
                    onClick={() => handleRemoveCard(i)}
                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                    title="Remove from Deck"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card Pool Library */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col max-h-[600px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-neutral-800 pb-3 mb-3">
            <h3 className="text-sm font-bold text-amber-400 font-serif">CARD LIBRARY</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/60 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-500 w-full sm:w-36"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-black/60 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="monster">Monsters</option>
                <option value="spell">Spells</option>
                <option value="trap">Traps</option>
              </select>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 pr-1">
            {filteredCards.map((card) => (
              <div key={card.id} className="relative group">
                <CardView card={card} size="sm" onClick={() => setInspectedCard(card)} />
                <button
                  onClick={() => handleAddCard(card)}
                  className="absolute bottom-1 right-1 bg-amber-500 hover:bg-yellow-400 text-black p-1 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition shadow-lg z-10 flex items-center gap-1 text-[10px]"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </div>
  );
};
