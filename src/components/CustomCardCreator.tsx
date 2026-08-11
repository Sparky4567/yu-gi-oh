import React, { useState } from 'react';
import { YugiohCard, CardType, Attribute } from '../types/yugioh';
import { CardView } from './CardView';
import { Sparkles, Plus, Check } from 'lucide-react';

interface CustomCardCreatorProps {
  onCardCreated: (card: YugiohCard) => void;
}

export const CustomCardCreator: React.FC<CustomCardCreatorProps> = ({ onCardCreated }) => {
  const [name, setName] = useState('Celestial Chaos Dragon');
  const [type, setType] = useState<CardType>('Effect Monster');
  const [attribute, setAttribute] = useState<Attribute>('LIGHT');
  const [level, setLevel] = useState<number>(8);
  const [atk, setAtk] = useState<number>(3200);
  const [def, setDef] = useState<number>(2800);
  const [race, setRace] = useState<string>('Dragon');
  const [desc, setDesc] = useState('Cannot be Normal Summoned/Set. Must be Special Summoned by banishing 1 LIGHT and 1 DARK monster from your Graveyard. Once per turn: You can banish 1 card on the field.');
  const [imageUrl, setImageUrl] = useState('https://images.ygoprodeck.com/images/cards/89631139.jpg');
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const previewCard: YugiohCard = {
    id: `custom-${Date.now()}`,
    name: name || 'Custom Card',
    type,
    attribute,
    level,
    atk,
    def,
    race,
    desc,
    imageUrl: imageUrl || 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
    imageUrlSmall: imageUrl || 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
    isCustom: true,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCardCreated(previewCard);
    setCreatedSuccess(true);
    setTimeout(() => setCreatedSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 text-white">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FORM COLUMN */}
        <div>
          <h2 className="text-2xl font-bold font-serif text-amber-400 mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" /> CUSTOM CARD GENERATOR
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Design your own custom Yu-Gi-Oh! card stats, artwork, and effect to play in duels!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Card Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Card Frame Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CardType)}
                  className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Normal Monster">Normal Monster</option>
                  <option value="Effect Monster">Effect Monster</option>
                  <option value="Fusion Monster">Fusion Monster</option>
                  <option value="Synchro Monster">Synchro Monster</option>
                  <option value="Xyz Monster">Xyz Monster</option>
                  <option value="Spell Card">Spell Card</option>
                  <option value="Trap Card">Trap Card</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Attribute</label>
                <select
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value as Attribute)}
                  className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="LIGHT">LIGHT</option>
                  <option value="DARK">DARK</option>
                  <option value="FIRE">FIRE</option>
                  <option value="WATER">WATER</option>
                  <option value="EARTH">EARTH</option>
                  <option value="WIND">WIND</option>
                  <option value="DIVINE">DIVINE</option>
                  <option value="SPELL">SPELL</option>
                  <option value="TRAP">TRAP</option>
                </select>
              </div>
            </div>

            {type.includes('Monster') && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Level / Rank</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">ATK</label>
                    <input
                      type="number"
                      step={50}
                      value={atk}
                      onChange={(e) => setAtk(Number(e.target.value))}
                      className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">DEF</label>
                    <input
                      type="number"
                      step={50}
                      value={def}
                      onChange={(e) => setDef(Number(e.target.value))}
                      className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Monster Type / Race</label>
                  <input
                    type="text"
                    placeholder="e.g. Dragon, Spellcaster, Machine..."
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Artwork Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Effect Text / Lore</label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-black/70 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {createdSuccess ? <Check className="w-5 h-5 text-emerald-950" /> : <Plus className="w-5 h-5" />}
              {createdSuccess ? 'Card Created & Added to Deck!' : 'Add Custom Card to Deck'}
            </button>
          </form>
        </div>

        {/* PREVIEW COLUMN */}
        <div className="flex flex-col items-center justify-center border-l border-neutral-800 pl-0 md:pl-8">
          <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest">LIVE CARD PREVIEW</h3>
          <CardView card={previewCard} size="lg" />
        </div>
      </div>
    </div>
  );
};
