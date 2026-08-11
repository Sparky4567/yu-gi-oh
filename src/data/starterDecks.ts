import { YugiohCard } from '../types/yugioh';
import { CLASSIC_CARDS } from './defaultCards';

// Utility to find card by name or return fallback
function getCard(name: string): YugiohCard {
  const found = CLASSIC_CARDS.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (found) return found;
  return CLASSIC_CARDS[0]; // fallback
}

// 1. KAIBA'S DRAGON SUPREMACY (40 CARDS)
export const KAIBA_DECK: YugiohCard[] = [
  // Monsters (24)
  getCard("Blue-Eyes White Dragon"),
  getCard("Blue-Eyes White Dragon"),
  getCard("Blue-Eyes White Dragon"),
  getCard("Luster Dragon"),
  getCard("Luster Dragon"),
  getCard("Luster Dragon"),
  getCard("Vorse Raider"),
  getCard("Vorse Raider"),
  getCard("Vorse Raider"),
  getCard("Battle Ox"),
  getCard("Battle Ox"),
  getCard("La Jinn the Mystical Genie of the Lamp"),
  getCard("La Jinn the Mystical Genie of the Lamp"),
  getCard("Lord of D."),
  getCard("Lord of D."),
  getCard("Cyber Dragon"),
  getCard("Cyber Dragon"),
  getCard("Summoned Skull"),
  getCard("Man-Eater Bug"),
  getCard("Man-Eater Bug"),
  getCard("Gemini Elf"),
  getCard("Gemini Elf"),
  getCard("Kuriboh"),
  getCard("Buster Blader"),

  // Spells (10)
  getCard("Polymerization"),
  getCard("Polymerization"),
  getCard("Monster Reborn"),
  getCard("Raigeki"),
  getCard("Pot of Greed"),
  getCard("Pot of Greed"),
  getCard("Mystical Space Typhoon"),
  getCard("Mystical Space Typhoon"),
  getCard("Mountain"),
  getCard("Mountain"),

  // Traps (6)
  getCard("Mirror Force"),
  getCard("Mirror Force"),
  getCard("Magic Cylinder"),
  getCard("Magic Cylinder"),
  getCard("Solemn Judgment"),
  getCard("Premature Burial"),
];

// 2. YUGI'S SPELLCASTER SUPREMACY (40 CARDS)
export const YUGI_DECK: YugiohCard[] = [
  // Monsters (22)
  getCard("Dark Magician"),
  getCard("Dark Magician"),
  getCard("Dark Magician"),
  getCard("Dark Magician Girl"),
  getCard("Dark Magician Girl"),
  getCard("Summoned Skull"),
  getCard("Summoned Skull"),
  getCard("Celtic Guardian"),
  getCard("Celtic Guardian"),
  getCard("Gemini Elf"),
  getCard("Gemini Elf"),
  getCard("Man-Eater Bug"),
  getCard("Man-Eater Bug"),
  getCard("Kuriboh"),
  getCard("Kuriboh"),
  getCard("Buster Blader"),
  // Exodia 5 Pieces
  getCard("Exodia the Forbidden One"),
  getCard("Right Arm of the Forbidden One"),
  getCard("Left Arm of the Forbidden One"),
  getCard("Right Leg of the Forbidden One"),
  getCard("Left Leg of the Forbidden One"),

  // Spells (11)
  getCard("Monster Reborn"),
  getCard("Raigeki"),
  getCard("Pot of Greed"),
  getCard("Pot of Greed"),
  getCard("Swords of Revealing Light"),
  getCard("Swords of Revealing Light"),
  getCard("Mystical Space Typhoon"),
  getCard("Mystical Space Typhoon"),
  getCard("Harpie's Feather Duster"),
  getCard("Yami"),
  getCard("Yami"),

  // Traps (7)
  getCard("Mirror Force"),
  getCard("Mirror Force"),
  getCard("Magic Cylinder"),
  getCard("Magic Cylinder"),
  getCard("Solemn Judgment"),
  getCard("Solemn Judgment"),
  getCard("Premature Burial"),
];

// 3. JOEY'S FLAME & WARRIORS (40 CARDS)
export const JOEY_DECK: YugiohCard[] = [
  // Monsters (24)
  getCard("Red-Eyes Black Dragon"),
  getCard("Red-Eyes Black Dragon"),
  getCard("Red-Eyes Black Dragon"),
  getCard("Summoned Skull"),
  getCard("7 Colored Fish"),
  getCard("7 Colored Fish"),
  getCard("7 Colored Fish"),
  getCard("Celtic Guardian"),
  getCard("Celtic Guardian"),
  getCard("Battle Ox"),
  getCard("Battle Ox"),
  getCard("Man-Eater Bug"),
  getCard("Man-Eater Bug"),
  getCard("Cyber Dragon"),
  getCard("Cyber Dragon"),
  getCard("Jinzo"),
  getCard("Vorse Raider"),
  getCard("Vorse Raider"),
  getCard("La Jinn the Mystical Genie of the Lamp"),
  getCard("La Jinn the Mystical Genie of the Lamp"),
  getCard("Kuriboh"),
  getCard("Luster Dragon"),
  getCard("Luster Dragon"),

  // Spells (10)
  getCard("Monster Reborn"),
  getCard("Pot of Greed"),
  getCard("Pot of Greed"),
  getCard("Raigeki"),
  getCard("Mystical Space Typhoon"),
  getCard("Mystical Space Typhoon"),
  getCard("Swords of Revealing Light"),
  getCard("Premature Burial"),
  getCard("Harpie's Feather Duster"),
  getCard("Mountain"),

  // Traps (6)
  getCard("Mirror Force"),
  getCard("Mirror Force"),
  getCard("Magic Cylinder"),
  getCard("Magic Cylinder"),
  getCard("Solemn Judgment"),
  getCard("Solemn Judgment"),
];

export const STARTER_DECKS = [
  {
    id: 'kaiba',
    name: 'Dragon Supremacy',
    owner: 'Seto Kaiba',
    description: 'Crush your opponents with 40 cards featuring 3x Blue-Eyes White Dragon and Fusion power.',
    cards: KAIBA_DECK,
  },
  {
    id: 'yugi',
    name: 'Spellcaster Supremacy',
    owner: 'Yugi Muto',
    description: 'Master 40 mystical spellcaster cards, Exodia the Forbidden One, and dark magic traps.',
    cards: YUGI_DECK,
  },
  {
    id: 'joey',
    name: 'Red-Eyes & Warriors',
    owner: 'Joey Wheeler',
    description: 'A 40-card aggressive deck featuring Red-Eyes Black Dragon, Jinzo, and warrior beatsticks.',
    cards: JOEY_DECK,
  },
];
