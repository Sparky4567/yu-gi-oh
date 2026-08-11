export type CardType = 
  | 'Normal Monster' 
  | 'Effect Monster' 
  | 'Fusion Monster' 
  | 'Synchro Monster' 
  | 'Xyz Monster' 
  | 'Spell Card' 
  | 'Trap Card';

export type Attribute = 'LIGHT' | 'DARK' | 'FIRE' | 'WATER' | 'EARTH' | 'WIND' | 'DIVINE' | 'SPELL' | 'TRAP';

export type MonsterRace = 
  | 'Dragon' | 'Spellcaster' | 'Warrior' | 'Fiend' | 'Machine' | 'Zombie' 
  | 'Fairy' | 'Beast' | 'Cyberse' | 'Divine-Beast' | 'Rock' | 'Aqua' | 'Pyro';

export type SpellTrapProperty = 'Normal' | 'Continuous' | 'Quick-Play' | 'Field' | 'Equip' | 'Counter';

export interface YugiohCard {
  id: string | number;
  name: string;
  type: CardType;
  frameType?: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: Attribute;
  property?: SpellTrapProperty;
  imageUrl?: string;
  imageUrlSmall?: string;
  isCustom?: boolean;
}

export type Position = 'attack' | 'defense' | 'facedown';

export interface FieldCard {
  instanceId: string;
  card: YugiohCard;
  position: Position;
  canAttack: boolean;
  hasChangedPosition: boolean;
  turnSummoned: number;
}

export type Phase = 'DRAW' | 'STANDBY' | 'MAIN1' | 'BATTLE' | 'MAIN2' | 'END';

export type RuleMode = 'poc-yugi' | 'og-1999' | 'standard';

export interface PlayerState {
  id: 'player' | 'opponent';
  name: string;
  avatar: string;
  lp: number;
  maxLp: number;
  hand: YugiohCard[];
  deck: YugiohCard[];
  graveyard: YugiohCard[];
  extraDeck: YugiohCard[];
  monsterZones: (FieldCard | null)[];
  spellTrapZones: (FieldCard | null)[];
  fieldZone: FieldCard | null;
  normalSummonedThisTurn: boolean;
  spellsPlayedThisTurn?: number;
  trapsPlayedThisTurn?: number;
}

export type GameMode = 'vs-ai' | 'local-2p' | 'deck-builder' | 'card-search' | 'card-creator';

export type AIPersonality = 'kaiba' | 'yugi' | 'joey' | 'cyber';

export interface DuelLog {
  id: string;
  text: string;
  type: 'info' | 'attack' | 'damage' | 'summon' | 'spell' | 'victory';
  timestamp: string;
}

export interface SelectedTarget {
  player: 'player' | 'opponent';
  zoneType: 'monster' | 'spellTrap' | 'hand' | 'graveyard';
  index: number;
  card?: YugiohCard | FieldCard;
}
