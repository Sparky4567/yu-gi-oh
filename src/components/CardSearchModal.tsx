import React, { useState, useEffect } from 'react';
import { YugiohCard } from '../types/yugioh';
import { searchYugiohCards } from '../services/ygoproApi';
import { CardView } from './CardView';
import { CardDetailModal } from './CardDetailModal';
import { Search, Loader2, Plus, Globe } from 'lucide-react';

interface CardSearchModalProps {
  onAddCardToDeck: (card: YugiohCard) => void;
}

export const CardSearchModal: React.FC<CardSearchModalProps> = ({ onAddCardToDeck }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YugiohCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<YugiohCard | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const cards = await searchYugiohCards(query);
      setResults(cards);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 text-white flex flex-col gap-6">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-serif text-amber-400 flex items-center gap-2">
              <Globe className="w-6 h-6 text-teal-400" /> ONLINE YGOPRODECK CARD DATABASE
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Search over 12,000 official Yu-Gi-Oh! cards directly from the YGOPRODeck live API database.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Enter card name (e.g. Dark Magician, Dragon)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-black/80 border border-neutral-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-[650px] overflow-y-auto p-2">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-400" />
              <p className="text-xs">Fetching live cards from YGOPRODeck API...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500">
              No cards found matching "{query}".
            </div>
          ) : (
            results.map((card, i) => (
              <div key={i} className="relative group flex flex-col items-center">
                <CardView card={card} size="sm" onClick={() => setInspectedCard(card)} />
                <button
                  onClick={() => onAddCardToDeck(card)}
                  className="mt-2 text-[10px] bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-2.5 py-1 rounded-md shadow flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> Add to Deck
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {inspectedCard && (
        <CardDetailModal card={inspectedCard} onClose={() => setInspectedCard(null)} />
      )}
    </div>
  );
};
