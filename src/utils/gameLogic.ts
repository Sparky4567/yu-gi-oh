import { 
  GameState, 
  PlayerState, 
  YugiohCard, 
  FieldCard, 
  Phase, 
  Position, 
  DuelLog,
  AIPersonality,
  RuleMode
} from '../types/yugioh';
import { 
  playSoundSummon, 
  playSoundAttack, 
  playSoundDamage, 
  playSoundTrapActivate, 
  playSoundDraw,
  playSoundDestroy
} from './soundEffects';
import { FUSION_CARDS } from '../data/defaultCards';

export interface ExtendedGameState {
  player: PlayerState;
  opponent: PlayerState;
  currentTurn: 'player' | 'opponent';
  phase: Phase;
  turnCount: number;
  winner: 'player' | 'opponent' | null;
  logs: DuelLog[];
  aiPersonality: AIPersonality;
  ruleMode: RuleMode;
  selectedCardForTribute: { playerId: 'player' | 'opponent'; index: number }[];
  pendingTributeCardIndex: number | null;
  playerHandLimitBonus?: number;
  opponentHandLimitBonus?: number;
  pendingEndPhaseDiscardCount: number;
}

export function shuffleDeck(cards: YugiohCard[]): YugiohCard[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function checkExodiaWin(player: PlayerState): boolean {
  const exodiaNames = [
    'Exodia the Forbidden One',
    'Right Arm of the Forbidden One',
    'Left Arm of the Forbidden One',
    'Right Leg of the Forbidden One',
    'Left Leg of the Forbidden One'
  ];

  return exodiaNames.every(name =>
    player.hand.some(c => c.name.toLowerCase().includes(name.toLowerCase()))
  );
}

export function getMaxHandLimit(state: ExtendedGameState, playerId: 'player' | 'opponent'): number {
  // Check if Infinite Cards is active on either player's field
  const hasInfiniteCards = 
    state.player.spellTrapZones.some(st => st !== null && st.card.name === 'Infinite Cards') ||
    state.opponent.spellTrapZones.some(st => st !== null && st.card.name === 'Infinite Cards');

  if (hasInfiniteCards) {
    return Infinity;
  }

  const bonus = playerId === 'player' ? (state.playerHandLimitBonus || 0) : (state.opponentHandLimitBonus || 0);
  return 6 + bonus;
}

export function createInitialState(
  playerDeckCards: YugiohCard[], 
  opponentDeckCards: YugiohCard[],
  aiPersonality: AIPersonality = 'yugi',
  ruleMode: RuleMode = 'poc-yugi'
): ExtendedGameState {
  const pDeck = shuffleDeck(playerDeckCards);
  const oDeck = shuffleDeck(opponentDeckCards);

  const playerHand = pDeck.splice(0, 5);
  const opponentHand = oDeck.splice(0, 5);

  const ruleTitleText = ruleMode === 'poc-yugi' ? '🎮 POWER OF CHAOS (YUGI THE DESTINY)' : ruleMode === 'og-1999' ? '📜 1999 OG OCG RULESET' : '⚔️ MODERN MASTER RULES';

  const initialLog: DuelLog = {
    id: 'log-0',
    text: `DUEL START! Mode: ${ruleTitleText}. Initial LP: 8000. Both players drew 5 cards.`,
    type: 'info',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  let initialState: ExtendedGameState = {
    player: {
      id: 'player',
      name: 'Yugi (Player)',
      avatar: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
      lp: 8000,
      maxLp: 8000,
      hand: playerHand,
      deck: pDeck,
      graveyard: [],
      extraDeck: [...FUSION_CARDS],
      monsterZones: [null, null, null, null, null],
      spellTrapZones: [null, null, null, null, null],
      fieldZone: null,
      normalSummonedThisTurn: false,
      spellsPlayedThisTurn: 0,
      trapsPlayedThisTurn: 0
    },
    opponent: {
      id: 'opponent',
      name: aiPersonality === 'kaiba' ? 'Seto Kaiba (AI)' : aiPersonality === 'yugi' ? 'Yugi Muto (AI)' : 'Joey Wheeler (AI)',
      avatar: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
      lp: 8000,
      maxLp: 8000,
      hand: opponentHand,
      deck: oDeck,
      graveyard: [],
      extraDeck: [...FUSION_CARDS],
      monsterZones: [null, null, null, null, null],
      spellTrapZones: [null, null, null, null, null],
      fieldZone: null,
      normalSummonedThisTurn: false,
      spellsPlayedThisTurn: 0,
      trapsPlayedThisTurn: 0
    },
    currentTurn: 'player',
    phase: 'MAIN1',
    turnCount: 1,
    winner: null,
    logs: [initialLog],
    aiPersonality,
    ruleMode,
    selectedCardForTribute: [],
    pendingTributeCardIndex: null,
    pendingEndPhaseDiscardCount: 0
  };

  if (checkExodiaWin(initialState.player)) {
    initialState.winner = 'player';
    initialState = addLog(initialState, '🌟 EXODIA THE FORBIDDEN ONE ASSEMBLED! INSTANT VICTORY!', 'victory');
  }

  return initialState;
}

export function addLog(state: ExtendedGameState, text: string, type: DuelLog['type'] = 'info'): ExtendedGameState {
  const newLog: DuelLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    text,
    type,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  return {
    ...state,
    logs: [newLog, ...state.logs.slice(0, 49)]
  };
}

export function getEffectiveAtk(card: YugiohCard, state: ExtendedGameState): number {
  let baseAtk = card.atk || 0;

  if (card.name === 'Dark Magician Girl') {
    const pDm = state.player.graveyard.filter(c => c.name === 'Dark Magician').length;
    const oDm = state.opponent.graveyard.filter(c => c.name === 'Dark Magician').length;
    baseAtk += (pDm + oDm) * 300;
  }

  return baseAtk;
}

// Draw single card
export function drawCardForTurn(state: ExtendedGameState, playerId: 'player' | 'opponent'): ExtendedGameState {
  const player = state[playerId];
  const opponent = state[playerId === 'player' ? 'opponent' : 'player'];

  if (player.deck.length === 0) {
    if (state.ruleMode === 'og-1999' || state.ruleMode === 'poc-yugi') {
      let winner: ExtendedGameState['winner'] = null;
      let logMsg = `📜 DECK EMPTIED! Comparing Life Points: ${player.name} (${player.lp} LP) vs ${opponent.name} (${opponent.lp} LP).`;

      if (player.lp > opponent.lp) {
        winner = playerId;
        logMsg += ` ${player.name} has more LP and WINS!`;
      } else if (opponent.lp > player.lp) {
        winner = playerId === 'player' ? 'opponent' : 'player';
        logMsg += ` ${opponent.name} has more LP and WINS!`;
      } else {
        logMsg += ` Equal LP! Duel is a DRAW!`;
      }

      let s = addLog(state, logMsg, 'damage');
      return { ...s, winner };
    } else {
      const winner = playerId === 'player' ? 'opponent' : 'player';
      let s = addLog(state, `💀 ${player.name} cannot draw a card! DECK OUT DEFEAT!`, 'damage');
      return { ...s, winner };
    }
  }

  const drawnCard = player.deck[0];
  const newDeck = player.deck.slice(1);
  const newHand = [...player.hand, drawnCard];

  playSoundDraw();

  let nextState: ExtendedGameState = {
    ...state,
    [playerId]: {
      ...player,
      deck: newDeck,
      hand: newHand
    }
  };

  nextState = addLog(nextState, `🃏 ${player.name} drew ${drawnCard.name}.`, 'info');

  if (checkExodiaWin(nextState[playerId])) {
    nextState.winner = playerId;
    nextState = addLog(nextState, `🌟 ${player.name} ASSEMBLED ALL 5 PIECES OF EXODIA! INSTANT VICTORY!`, 'victory');
  }

  return nextState;
}

// Draw cards until hand reaches target count (Refill to 6 cards!)
export function drawUntilHandFull(
  state: ExtendedGameState, 
  playerId: 'player' | 'opponent',
  targetHandSize: number = 6
): ExtendedGameState {
  const player = state[playerId];
  const cardsNeeded = Math.max(1, targetHandSize - player.hand.length);

  let currentState = { ...state };
  const initialHandSize = player.hand.length;

  for (let i = 0; i < cardsNeeded; i++) {
    if (currentState[playerId].deck.length === 0 || currentState.winner) break;
    currentState = drawCardForTurn(currentState, playerId);
  }

  const finalHandSize = currentState[playerId].hand.length;
  const drawnCount = finalHandSize - initialHandSize;

  if (drawnCount > 1) {
    currentState = addLog(currentState, `🃏 ${player.name} auto-drew ${drawnCount} card(s) to refill hand to ${finalHandSize}!`, 'info');
  }

  return currentState;
}

// Voluntary Discard & Auto-Refill Hand
export function cycleDiscardAndDraw(
  state: ExtendedGameState,
  playerId: 'player' | 'opponent',
  discardIndexes: number[]
): ExtendedGameState {
  const player = state[playerId];
  if (discardIndexes.length === 0) return state;

  const discardedCards: YugiohCard[] = [];
  const remainingHand = player.hand.filter((card, idx) => {
    if (discardIndexes.includes(idx)) {
      discardedCards.push(card);
      return false;
    }
    return true;
  });

  const updatedPlayer = {
    ...player,
    hand: remainingHand,
    graveyard: [...player.graveyard, ...discardedCards]
  };

  let currentState: ExtendedGameState = {
    ...state,
    [playerId]: updatedPlayer
  };

  playSoundDestroy();

  const cardNamesText = discardedCards.map(c => c.name).join(', ');
  currentState = addLog(currentState, `♻️ ${player.name} sent ${discardedCards.length} card(s) [${cardNamesText}] to GY to cycle hand!`, 'info');

  // Auto-draw replacement cards back up to 6 cards!
  currentState = drawUntilHandFull(currentState, playerId, 6);

  return currentState;
}

// Summon Monster
export function summonMonster(
  state: ExtendedGameState, 
  playerId: 'player' | 'opponent',
  handIndex: number,
  zoneIndex: number,
  position: Position = 'attack',
  tributeZoneIndexes: number[] = []
): ExtendedGameState {
  const activePlayer = state[playerId];
  const card = activePlayer.hand[handIndex];
  if (!card) return state;

  const isCyberDragonSpecial = card.name === 'Cyber Dragon' &&
    state[playerId === 'player' ? 'opponent' : 'player'].monsterZones.some(m => m !== null) &&
    activePlayer.monsterZones.every(m => m === null);

  let newMonsterZones = [...activePlayer.monsterZones];
  let newGY = [...activePlayer.graveyard];

  if (tributeZoneIndexes.length > 0) {
    for (const tzIndex of tributeZoneIndexes) {
      const tCard = newMonsterZones[tzIndex];
      if (tCard) {
        newGY.push(tCard.card);
        newMonsterZones[tzIndex] = null;
      }
    }
  }

  const fieldCard: FieldCard = {
    instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    card,
    position,
    canAttack: position === 'attack' && state.turnCount > 1,
    hasChangedPosition: false,
    turnSummoned: state.turnCount
  };

  newMonsterZones[zoneIndex] = fieldCard;

  const newHand = activePlayer.hand.filter((_, idx) => idx !== handIndex);

  playSoundSummon();

  let updatedState = {
    ...state,
    [playerId]: {
      ...activePlayer,
      hand: newHand,
      monsterZones: newMonsterZones,
      graveyard: newGY,
      normalSummonedThisTurn: isCyberDragonSpecial ? activePlayer.normalSummonedThisTurn : true
    }
  };

  const posText = position === 'attack' ? 'Attack Position' : position === 'facedown' ? 'Face-Down Defense Position' : 'Defense Position';
  const modePrefix = state.ruleMode === 'og-1999' ? '[1999 OG Rules: No Tribute Needed]' : '';
  const tributeText = tributeZoneIndexes.length > 0 ? ` (${tributeZoneIndexes.length} tribute)` : '';

  return addLog(
    updatedState, 
    `⚡ ${activePlayer.name} ${modePrefix} SUMMONED ${card.name} in ${posText}${tributeText}!`, 
    'summon'
  );
}

// Activate / Set Spell or Trap from Hand
export function playSpellTrap(
  state: ExtendedGameState,
  playerId: 'player' | 'opponent',
  handIndex: number,
  zoneIndex: number,
  isSet: boolean = false
): ExtendedGameState {
  const activePlayer = state[playerId];
  const opponentPlayer = state[playerId === 'player' ? 'opponent' : 'player'];
  const card = activePlayer.hand[handIndex];
  if (!card) return state;

  const fieldCard: FieldCard = {
    instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    card,
    position: isSet ? 'facedown' : 'attack',
    canAttack: false,
    hasChangedPosition: false,
    turnSummoned: state.turnCount
  };

  const newHand = activePlayer.hand.filter((_, idx) => idx !== handIndex);

  playSoundTrapActivate();

  if (card.name === 'Hieroglyph Lithograph' && !isSet) {
    const newLp = Math.max(0, activePlayer.lp - 1000);
    const bonusKey = playerId === 'player' ? 'playerHandLimitBonus' : 'opponentHandLimitBonus';
    let updatedState = {
      ...state,
      [bonusKey]: 1,
      [playerId]: {
        ...activePlayer,
        lp: newLp,
        hand: newHand,
        graveyard: [...activePlayer.graveyard, card]
      }
    };
    return addLog(updatedState, `✨ ${activePlayer.name} paid 1000 LP for HIEROGLYPH LITHOGRAPH! Maximum hand size limit increased to 7!`, 'spell');
  }

  if (card.name === 'Polymerization') {
    const blueEyesOnField = activePlayer.monsterZones.filter(m => m !== null && m.card.name === 'Blue-Eyes White Dragon');
    const blueEyesInHand = newHand.filter(c => c.name === 'Blue-Eyes White Dragon');

    if (blueEyesOnField.length + blueEyesInHand.length >= 3 && activePlayer.extraDeck.length > 0) {
      const fusionMonsterCard = activePlayer.extraDeck[0];
      const newExtra = activePlayer.extraDeck.slice(1);

      let removedCount = 0;
      let newMonZones = [...activePlayer.monsterZones];
      let newHandFiltered = [...newHand];
      let newGY = [...activePlayer.graveyard, card];

      for (let i = 0; i < newMonZones.length && removedCount < 3; i++) {
        if (newMonZones[i] && newMonZones[i]!.card.name === 'Blue-Eyes White Dragon') {
          newGY.push(newMonZones[i]!.card);
          newMonZones[i] = null;
          removedCount++;
        }
      }

      if (removedCount < 3) {
        newHandFiltered = newHandFiltered.filter(c => {
          if (c.name === 'Blue-Eyes White Dragon' && removedCount < 3) {
            newGY.push(c);
            removedCount++;
            return false;
          }
          return true;
        });
      }

      const emptyMonZone = newMonZones.findIndex(m => m === null);
      if (emptyMonZone !== -1) {
        newMonZones[emptyMonZone] = {
          instanceId: `fusion-${Date.now()}`,
          card: fusionMonsterCard,
          position: 'attack',
          canAttack: state.turnCount > 1,
          hasChangedPosition: false,
          turnSummoned: state.turnCount
        };
      }

      let updatedState = {
        ...state,
        [playerId]: {
          ...activePlayer,
          hand: newHandFiltered,
          monsterZones: newMonZones,
          extraDeck: newExtra,
          graveyard: newGY,
          spellsPlayedThisTurn: (activePlayer.spellsPlayedThisTurn || 0) + 1
        }
      };
      return addLog(updatedState, `🔮 POLYMERIZATION FUSION! ${activePlayer.name} fused 3 Blue-Eyes White Dragons to summon ${fusionMonsterCard.name} (4500 ATK)!`, 'spell');
    }
  }

  if (card.property === 'Field') {
    const oldField = activePlayer.fieldZone;
    const newGY = oldField ? [...activePlayer.graveyard, oldField.card] : [...activePlayer.graveyard];

    let updatedState = {
      ...state,
      [playerId]: {
        ...activePlayer,
        hand: newHand,
        fieldZone: fieldCard,
        graveyard: newGY,
        spellsPlayedThisTurn: (activePlayer.spellsPlayedThisTurn || 0) + 1
      }
    };
    return addLog(updatedState, `🌐 ${activePlayer.name} activated Field Spell: ${card.name}!`, 'spell');
  }

  if (isSet) {
    const newStZones = [...activePlayer.spellTrapZones];
    newStZones[zoneIndex] = fieldCard;
    let updatedState = {
      ...state,
      [playerId]: {
        ...activePlayer,
        hand: newHand,
        spellTrapZones: newStZones,
        trapsPlayedThisTurn: card.type.includes('Trap') ? (activePlayer.trapsPlayedThisTurn || 0) + 1 : activePlayer.trapsPlayedThisTurn,
        spellsPlayedThisTurn: card.type.includes('Spell') ? (activePlayer.spellsPlayedThisTurn || 0) + 1 : activePlayer.spellsPlayedThisTurn
      }
    };
    return addLog(updatedState, `🔮 ${activePlayer.name} set a ${card.type} face-down.`, 'spell');
  }

  let updatedState = { ...state };
  let currentActive = {
    ...activePlayer,
    hand: newHand,
    spellsPlayedThisTurn: (activePlayer.spellsPlayedThisTurn || 0) + 1
  };
  let currentOpponent = { ...opponentPlayer };

  if (card.name === 'Infinite Cards') {
    const newStZones = [...currentActive.spellTrapZones];
    newStZones[zoneIndex] = fieldCard;
    updatedState = {
      ...updatedState,
      [playerId]: {
        ...currentActive,
        spellTrapZones: newStZones
      }
    };
    return addLog(updatedState, `✨ ${activePlayer.name} activated INFINITE CARDS! Hand size limit removed for both players!`, 'spell');
  }
  else if (card.name === 'Pot of Greed') {
    const drawn = currentActive.deck.slice(0, 2);
    currentActive.deck = currentActive.deck.slice(2);
    currentActive.hand = [...currentActive.hand, ...drawn];
    currentActive.graveyard = [...currentActive.graveyard, card];
    updatedState = {
      ...updatedState,
      [playerId]: currentActive
    };
    updatedState = addLog(updatedState, `✨ ${activePlayer.name} activated POT OF GREED! Drew 2 cards.`, 'spell');

    if (checkExodiaWin(currentActive)) {
      updatedState.winner = playerId;
      updatedState = addLog(updatedState, `🌟 ${activePlayer.name} ASSEMBLED EXODIA FROM POT OF GREED! INSTANT VICTORY!`, 'victory');
    }
    return updatedState;
  } 
  else if (card.name === 'Raigeki') {
    const destroyedMonsters = currentOpponent.monsterZones.filter(m => m !== null).map(m => m!.card);
    currentOpponent.monsterZones = [null, null, null, null, null];
    currentOpponent.graveyard = [...currentOpponent.graveyard, ...destroyedMonsters];
    currentActive.graveyard = [...currentActive.graveyard, card];

    updatedState = {
      ...updatedState,
      [playerId]: currentActive,
      [playerId === 'player' ? 'opponent' : 'player']: currentOpponent
    };
    return addLog(updatedState, `⚡ ${activePlayer.name} activated RAIGEKI! Destroyed all opponent monsters!`, 'spell');
  }
  else if (card.name === "Harpie's Feather Duster") {
    const destroyedST = currentOpponent.spellTrapZones.filter(st => st !== null).map(st => st!.card);
    currentOpponent.spellTrapZones = [null, null, null, null, null];
    currentOpponent.graveyard = [...currentOpponent.graveyard, ...destroyedST];
    currentActive.graveyard = [...currentActive.graveyard, card];

    updatedState = {
      ...updatedState,
      [playerId]: currentActive,
      [playerId === 'player' ? 'opponent' : 'player']: currentOpponent
    };
    return addLog(updatedState, `🌪️ ${activePlayer.name} activated Harpie's Feather Duster! Cleared Spells & Traps!`, 'spell');
  }
  else {
    const newStZones = [...currentActive.spellTrapZones];
    newStZones[zoneIndex] = fieldCard;
    updatedState = {
      ...updatedState,
      [playerId]: {
        ...currentActive,
        spellTrapZones: newStZones
      }
    };
    return addLog(updatedState, `✨ ${activePlayer.name} activated ${card.name}!`, 'spell');
  }
}

// Activate Set Face-Down Spell or Trap Card from Field
export function activateSetFieldCard(
  state: ExtendedGameState,
  playerId: 'player' | 'opponent',
  stIndex: number
): ExtendedGameState {
  const activePlayer = state[playerId];
  const opponentPlayer = state[playerId === 'player' ? 'opponent' : 'player'];
  const stFieldCard = activePlayer.spellTrapZones[stIndex];
  if (!stFieldCard) return state;

  const card = stFieldCard.card;
  const newStZones = [...activePlayer.spellTrapZones];
  newStZones[stIndex] = null; // Remove from field

  let currentActive = {
    ...activePlayer,
    spellTrapZones: newStZones,
    graveyard: [...activePlayer.graveyard, card]
  };
  let currentOpponent = { ...opponentPlayer };
  let updatedState = { ...state, [playerId]: currentActive };

  playSoundTrapActivate();

  if (card.name === 'Pot of Greed') {
    const drawn = currentActive.deck.slice(0, 2);
    currentActive.deck = currentActive.deck.slice(2);
    currentActive.hand = [...currentActive.hand, ...drawn];
    updatedState = { ...updatedState, [playerId]: currentActive };
    updatedState = addLog(updatedState, `✨ ${activePlayer.name} activated set POT OF GREED! Drew 2 cards.`, 'spell');

    if (checkExodiaWin(currentActive)) {
      updatedState.winner = playerId;
      updatedState = addLog(updatedState, `🌟 ${activePlayer.name} ASSEMBLED EXODIA FROM POT OF GREED! INSTANT VICTORY!`, 'victory');
    }
    return updatedState;
  } else if (card.name === 'Raigeki') {
    const destroyedMonsters = currentOpponent.monsterZones.filter(m => m !== null).map(m => m!.card);
    currentOpponent.monsterZones = [null, null, null, null, null];
    currentOpponent.graveyard = [...currentOpponent.graveyard, ...destroyedMonsters];

    updatedState = {
      ...updatedState,
      [playerId]: currentActive,
      [playerId === 'player' ? 'opponent' : 'player']: currentOpponent
    };
    return addLog(updatedState, `⚡ ${activePlayer.name} activated set RAIGEKI! Destroyed all opponent monsters!`, 'spell');
  } else if (card.name === "Harpie's Feather Duster") {
    const destroyedST = currentOpponent.spellTrapZones.filter(st => st !== null).map(st => st!.card);
    currentOpponent.spellTrapZones = [null, null, null, null, null];
    currentOpponent.graveyard = [...currentOpponent.graveyard, ...destroyedST];

    updatedState = {
      ...updatedState,
      [playerId]: currentActive,
      [playerId === 'player' ? 'opponent' : 'player']: currentOpponent
    };
    return addLog(updatedState, `🌪️ ${activePlayer.name} activated set Harpie's Feather Duster! Cleared Spells & Traps!`, 'spell');
  } else {
    updatedState = {
      ...updatedState,
      [playerId]: currentActive
    };
    return addLog(updatedState, `🔮 ${activePlayer.name} activated set ${card.name}!`, 'spell');
  }
}

// Player End Phase Discard Selection Handler
export function processEndPhaseDiscards(
  state: ExtendedGameState,
  discardHandIndexes: number[]
): ExtendedGameState {
  const curPlayerId = state.currentTurn;
  const curPlayer = state[curPlayerId];

  const discardedCards: YugiohCard[] = [];
  const remainingHand = curPlayer.hand.filter((card, idx) => {
    if (discardHandIndexes.includes(idx)) {
      discardedCards.push(card);
      return false;
    }
    return true;
  });

  const nextTurn = curPlayerId === 'player' ? 'opponent' : 'player';
  const newTurnCount = state.turnCount + 1;

  const nextPlayerObj = state[nextTurn];
  const resetMonsters = nextPlayerObj.monsterZones.map(m => m ? { ...m, canAttack: true, hasChangedPosition: false } : null);

  let newState: ExtendedGameState = {
    ...state,
    currentTurn: nextTurn,
    phase: 'DRAW',
    turnCount: newTurnCount,
    pendingEndPhaseDiscardCount: 0,
    [curPlayerId]: {
      ...curPlayer,
      hand: remainingHand,
      graveyard: [...curPlayer.graveyard, ...discardedCards]
    },
    [nextTurn]: {
      ...nextPlayerObj,
      normalSummonedThisTurn: false,
      spellsPlayedThisTurn: 0,
      trapsPlayedThisTurn: 0,
      monsterZones: resetMonsters
    }
  };

  const cardNamesText = discardedCards.map(c => c.name).join(', ');
  newState = addLog(newState, `🗑️ ${curPlayer.name} selected & discarded ${discardedCards.length} card(s) [${cardNamesText}] during End Phase.`, 'info');
  newState = addLog(newState, `🔔 Round/Turn ${newTurnCount}: ${newState[nextTurn].name}'s turn!`, 'info');

  if (nextTurn === 'opponent') {
    if (newTurnCount > 1) {
      newState = drawUntilHandFull(newState, 'opponent', 6);
    }
    if (!newState.winner) {
      newState.phase = 'MAIN1';
    }
  }

  return newState;
}

// Battle Calculation
export function executeAttack(
  state: ExtendedGameState,
  attackerZoneIndex: number,
  defenderZoneIndex: number | null
): ExtendedGameState {
  const attackerPlayerId = state.currentTurn;
  const defenderPlayerId = attackerPlayerId === 'player' ? 'opponent' : 'player';

  const attackerPlayer = state[attackerPlayerId];
  const defenderPlayer = state[defenderPlayerId];

  const attackingMonster = attackerPlayer.monsterZones[attackerZoneIndex];
  if (!attackingMonster || !attackingMonster.canAttack || attackingMonster.position !== 'attack') {
    return state;
  }

  playSoundAttack();

  const updatedAttackerMonsters = [...attackerPlayer.monsterZones];
  updatedAttackerMonsters[attackerZoneIndex] = {
    ...attackingMonster,
    canAttack: false
  };

  let curAttackerPlayer = { ...attackerPlayer, monsterZones: updatedAttackerMonsters };
  let curDefenderPlayer = { ...defenderPlayer };
  let logsState = { ...state, [attackerPlayerId]: curAttackerPlayer, [defenderPlayerId]: curDefenderPlayer };

  const attackerAtk = getEffectiveAtk(attackingMonster.card, state);

  // Check Defender Trap Cards (triggers on attack against ANY monster or direct attack!)
  const setTrapIndex = defenderPlayer.spellTrapZones.findIndex(
    st => st !== null && (st.card.type.includes('Trap') || st.card.name === 'Mirror Force' || st.card.name === 'Magic Cylinder')
  );

  if (setTrapIndex !== -1) {
    const trap = defenderPlayer.spellTrapZones[setTrapIndex]!;

    if (trap.card.name === 'Mirror Force') {
      const destroyed: YugiohCard[] = [];
      const clearedMonsters = curAttackerPlayer.monsterZones.map(m => {
        if (m && m.position === 'attack') {
          destroyed.push(m.card);
          return null;
        }
        return m;
      });
      curAttackerPlayer.monsterZones = clearedMonsters;
      curAttackerPlayer.graveyard = [...curAttackerPlayer.graveyard, ...destroyed];

      const newDefenderST = [...defenderPlayer.spellTrapZones];
      newDefenderST[setTrapIndex] = null;
      curDefenderPlayer.spellTrapZones = newDefenderST;
      curDefenderPlayer.graveyard = [...curDefenderPlayer.graveyard, trap.card];

      logsState = addLog(logsState, `🛡️ TRAP TRIGGERED! ${defenderPlayer.name} activated MIRROR FORCE! Destroyed all attack monsters!`, 'spell');
      return {
        ...logsState,
        [attackerPlayerId]: curAttackerPlayer,
        [defenderPlayerId]: curDefenderPlayer
      };
    } else if (trap.card.name === 'Magic Cylinder') {
      curAttackerPlayer.lp = Math.max(0, curAttackerPlayer.lp - attackerAtk);
      playSoundDamage();

      const newDefenderST = [...defenderPlayer.spellTrapZones];
      newDefenderST[setTrapIndex] = null;
      curDefenderPlayer.spellTrapZones = newDefenderST;
      curDefenderPlayer.graveyard = [...curDefenderPlayer.graveyard, trap.card];

      let winner: ExtendedGameState['winner'] = state.winner;
      if (curAttackerPlayer.lp <= 0) winner = defenderPlayerId;

      logsState = addLog(logsState, `💥 TRAP TRIGGERED! MAGIC CYLINDER reflected ${attackerAtk} damage back to ${attackerPlayer.name}!`, 'damage');
      return {
        ...logsState,
        winner,
        [attackerPlayerId]: curAttackerPlayer,
        [defenderPlayerId]: curDefenderPlayer
      };
    } else {
      // Generic Trap Activation (negates attack and destroys attacking monster)
      const newAttMonsters = [...curAttackerPlayer.monsterZones];
      const destroyedCard = newAttMonsters[attackerZoneIndex]?.card;
      newAttMonsters[attackerZoneIndex] = null;
      curAttackerPlayer.monsterZones = newAttMonsters;
      if (destroyedCard) curAttackerPlayer.graveyard = [...curAttackerPlayer.graveyard, destroyedCard];

      const newDefenderST = [...defenderPlayer.spellTrapZones];
      newDefenderST[setTrapIndex] = null;
      curDefenderPlayer.spellTrapZones = newDefenderST;
      curDefenderPlayer.graveyard = [...curDefenderPlayer.graveyard, trap.card];

      logsState = addLog(logsState, `🛡️ TRAP TRIGGERED! ${defenderPlayer.name} activated ${trap.card.name}! Attack negated and attacking monster destroyed!`, 'spell');
      return {
        ...logsState,
        [attackerPlayerId]: curAttackerPlayer,
        [defenderPlayerId]: curDefenderPlayer
      };
    }
  }

  // DIRECT ATTACK
  if (defenderZoneIndex === null) {
    const newDefenderLp = Math.max(0, curDefenderPlayer.lp - attackerAtk);
    curDefenderPlayer.lp = newDefenderLp;
    playSoundDamage();

    let winner: ExtendedGameState['winner'] = state.winner;
    if (newDefenderLp <= 0) winner = attackerPlayerId;

    logsState = addLog(
      logsState, 
      `💥 DIRECT ATTACK! ${attackingMonster.card.name} attacked ${defenderPlayer.name} directly for ${attackerAtk} damage!`, 
      'damage'
    );

    return {
      ...logsState,
      winner,
      [attackerPlayerId]: curAttackerPlayer,
      [defenderPlayerId]: curDefenderPlayer
    };
  }

  // MONSTER VS MONSTER BATTLE
  const defendingMonster = defenderPlayer.monsterZones[defenderZoneIndex];
  if (!defendingMonster) return state;

  const isFaceDown = defendingMonster.position === 'facedown';
  const defenderCardName = isFaceDown ? `${defendingMonster.card.name} (Flipped)` : defendingMonster.card.name;

  if (defendingMonster.position === 'attack') {
    const defenderAtk = getEffectiveAtk(defendingMonster.card, state);

    if (attackerAtk > defenderAtk) {
      const damage = attackerAtk - defenderAtk;
      curDefenderPlayer.lp = Math.max(0, curDefenderPlayer.lp - damage);
      playSoundDamage();

      const newDefMonsters = [...curDefenderPlayer.monsterZones];
      newDefMonsters[defenderZoneIndex] = null;
      curDefenderPlayer.monsterZones = newDefMonsters;
      curDefenderPlayer.graveyard = [...curDefenderPlayer.graveyard, defendingMonster.card];

      let winner: ExtendedGameState['winner'] = state.winner;
      if (curDefenderPlayer.lp <= 0) winner = attackerPlayerId;

      logsState = addLog(
        logsState, 
        `⚔️ ${attackingMonster.card.name} (${attackerAtk} ATK) destroyed ${defendingMonster.card.name} (${defenderAtk} ATK)! ${defenderPlayer.name} took ${damage} damage.`,
        'attack'
      );
    } else if (attackerAtk < defenderAtk) {
      const damage = defenderAtk - attackerAtk;
      curAttackerPlayer.lp = Math.max(0, curAttackerPlayer.lp - damage);
      playSoundDamage();

      const newAttMonsters = [...curAttackerPlayer.monsterZones];
      newAttMonsters[attackerZoneIndex] = null;
      curAttackerPlayer.monsterZones = newAttMonsters;
      curAttackerPlayer.graveyard = [...curAttackerPlayer.graveyard, attackingMonster.card];

      let winner: ExtendedGameState['winner'] = state.winner;
      if (curAttackerPlayer.lp <= 0) winner = defenderPlayerId;

      logsState = addLog(
        logsState, 
        `⚔️ COUNTER! ${defendingMonster.card.name} (${defenderAtk} ATK) destroyed ${attackingMonster.card.name} (${attackerAtk} ATK)! ${attackerPlayer.name} took ${damage} damage.`,
        'attack'
      );
    } else {
      const newAttMonsters = [...curAttackerPlayer.monsterZones];
      newAttMonsters[attackerZoneIndex] = null;
      curAttackerPlayer.monsterZones = newAttMonsters;
      curAttackerPlayer.graveyard = [...curAttackerPlayer.graveyard, attackingMonster.card];

      const newDefMonsters = [...curDefenderPlayer.monsterZones];
      newDefMonsters[defenderZoneIndex] = null;
      curDefenderPlayer.monsterZones = newDefMonsters;
      curDefenderPlayer.graveyard = [...curDefenderPlayer.graveyard, defendingMonster.card];

      logsState = addLog(
        logsState, 
        `💥 MUTUAL DESTRUCTION! Both ${attackingMonster.card.name} and ${defendingMonster.card.name} had ${attackerAtk} ATK and were destroyed!`,
        'attack'
      );
    }
  } else {
    // DEFENSE POSITION BATTLE
    const defenderDef = defendingMonster.card.def || 0;

    if (isFaceDown && defendingMonster.card.name === 'Man-Eater Bug') {
      playSoundDestroy();
      const newAttMonsters = [...curAttackerPlayer.monsterZones];
      newAttMonsters[attackerZoneIndex] = null;
      curAttackerPlayer.monsterZones = newAttMonsters;
      curAttackerPlayer.graveyard = [...curAttackerPlayer.graveyard, attackingMonster.card];

      logsState = addLog(
        logsState, 
        `🐛 FLIP EFFECT! MAN-EATER BUG destroyed attacking monster ${attackingMonster.card.name}!`,
        'spell'
      );
    }

    if (attackerAtk > defenderDef) {
      const newDefMonsters = [...curDefenderPlayer.monsterZones];
      newDefMonsters[defenderZoneIndex] = null;
      curDefenderPlayer.monsterZones = newDefMonsters;
      curDefenderPlayer.graveyard = [...curDefenderPlayer.graveyard, defendingMonster.card];

      logsState = addLog(
        logsState, 
        `🛡️ ${attackingMonster.card.name} (${attackerAtk} ATK) destroyed defense monster ${defenderCardName} (${defenderDef} DEF)!`,
        'attack'
      );
    } else if (attackerAtk < defenderDef) {
      const recoil = defenderDef - attackerAtk;
      curAttackerPlayer.lp = Math.max(0, curAttackerPlayer.lp - recoil);
      playSoundDamage();

      if (isFaceDown) {
        const newDefMonsters = [...curDefenderPlayer.monsterZones];
        newDefMonsters[defenderZoneIndex] = { ...defendingMonster, position: 'defense' };
        curDefenderPlayer.monsterZones = newDefMonsters;
      }

      let winner: ExtendedGameState['winner'] = state.winner;
      if (curAttackerPlayer.lp <= 0) winner = defenderPlayerId;

      logsState = addLog(
        logsState, 
        `🛡️ DEFLECTED! ${defenderCardName} (${defenderDef} DEF) blocked ${attackingMonster.card.name} (${attackerAtk} ATK)! ${attackerPlayer.name} took ${recoil} recoil damage.`,
        'damage'
      );
    } else {
      if (isFaceDown) {
        const newDefMonsters = [...curDefenderPlayer.monsterZones];
        newDefMonsters[defenderZoneIndex] = { ...defendingMonster, position: 'defense' };
        curDefenderPlayer.monsterZones = newDefMonsters;
      }
      logsState = addLog(
        logsState, 
        `🛡️ STALEMATE! ${attackingMonster.card.name} (${attackerAtk} ATK) could not breach ${defenderCardName} (${defenderDef} DEF).`,
        'attack'
      );
    }
  }

  return {
    ...logsState,
    [attackerPlayerId]: curAttackerPlayer,
    [defenderPlayerId]: curDefenderPlayer
  };
}

// Position change
export function changeMonsterPosition(
  state: ExtendedGameState,
  playerId: 'player' | 'opponent',
  zoneIndex: number
): ExtendedGameState {
  const player = state[playerId];
  const monster = player.monsterZones[zoneIndex];
  if (!monster || monster.hasChangedPosition || monster.turnSummoned === state.turnCount) return state;

  const newPosition: Position = monster.position === 'attack' ? 'defense' : 'attack';
  const updatedMonster: FieldCard = {
    ...monster,
    position: newPosition,
    hasChangedPosition: true
  };

  const newZones = [...player.monsterZones];
  newZones[zoneIndex] = updatedMonster;

  let nextState = {
    ...state,
    [playerId]: {
      ...player,
      monsterZones: newZones
    }
  };

  return addLog(
    nextState, 
    `🔄 ${player.name} changed ${monster.card.name} to ${newPosition.toUpperCase()} position.`, 
    'info'
  );
}

// PASS TURN TO START NEXT ROUND (CHECK END PHASE HAND LIMIT!)
export function passTurn(state: ExtendedGameState): ExtendedGameState {
  if (state.winner) return state;

  const curPlayerId = state.currentTurn;
  const curPlayer = state[curPlayerId];
  const limit = getMaxHandLimit(state, curPlayerId);

  // Check if player has more cards than max hand limit in End Phase
  if (curPlayer.hand.length > limit) {
    const excessCount = curPlayer.hand.length - limit;

    if (curPlayerId === 'player') {
      // Prompt player to select specific card(s) to discard!
      let promptState = { ...state, phase: 'END' as Phase, pendingEndPhaseDiscardCount: excessCount };
      return addLog(promptState, `⏳ END PHASE: You have ${curPlayer.hand.length} cards in hand (Limit: ${limit}). Select ${excessCount} card(s) to discard to GY.`, 'info');
    } else {
      // AI discards excess cards automatically
      const discarded = curPlayer.hand.slice(limit);
      const remainingHand = curPlayer.hand.slice(0, limit);
      const newGY = [...curPlayer.graveyard, ...discarded];

      const nextTurn = 'player';
      const newTurnCount = state.turnCount + 1;
      const resetMonsters = state.player.monsterZones.map(m => m ? { ...m, canAttack: true, hasChangedPosition: false } : null);

      let newState: ExtendedGameState = {
        ...state,
        currentTurn: nextTurn,
        phase: 'DRAW',
        turnCount: newTurnCount,
        pendingEndPhaseDiscardCount: 0,
        opponent: {
          ...curPlayer,
          hand: remainingHand,
          graveyard: newGY
        },
        player: {
          ...state.player,
          normalSummonedThisTurn: false,
          spellsPlayedThisTurn: 0,
          trapsPlayedThisTurn: 0,
          monsterZones: resetMonsters
        }
      };

      newState = addLog(newState, `🗑️ ${curPlayer.name} discarded ${discarded.length} excess card(s) during End Phase.`, 'info');
      newState = addLog(newState, `🔔 Round/Turn ${newTurnCount}: Yugi (Player)'s turn!`, 'info');

      return newState;
    }
  }

  const nextTurn = curPlayerId === 'player' ? 'opponent' : 'player';
  const newTurnCount = state.turnCount + 1;

  const nextPlayerObj = state[nextTurn];
  const resetMonsters = nextPlayerObj.monsterZones.map(m => m ? { ...m, canAttack: true, hasChangedPosition: false } : null);

  let newState: ExtendedGameState = {
    ...state,
    currentTurn: nextTurn,
    phase: 'DRAW',
    turnCount: newTurnCount,
    pendingEndPhaseDiscardCount: 0,
    [nextTurn]: {
      ...nextPlayerObj,
      normalSummonedThisTurn: false,
      spellsPlayedThisTurn: 0,
      trapsPlayedThisTurn: 0,
      monsterZones: resetMonsters
    }
  };

  newState = addLog(newState, `🔔 Round/Turn ${newTurnCount}: ${newState[nextTurn].name}'s turn!`, 'info');

  // If opponent's turn, draw cards until hand is full (6 cards) for AI!
  if (nextTurn === 'opponent') {
    if (newTurnCount > 1) {
      newState = drawUntilHandFull(newState, 'opponent', 6);
    }
    if (!newState.winner) {
      newState.phase = 'MAIN1';
    }
  }

  return newState;
}

// Phase Advancement
export function nextPhase(state: ExtendedGameState): ExtendedGameState {
  if (state.winner) return state;

  if (state.phase === 'MAIN2' || state.phase === 'END') {
    return passTurn(state);
  }

  const phases: Phase[] = ['DRAW', 'STANDBY', 'MAIN1', 'BATTLE', 'MAIN2'];
  const currentIndex = phases.indexOf(state.phase);

  if (currentIndex >= 0 && currentIndex < phases.length - 1) {
    const nextP = phases[currentIndex + 1];
    let nextState = { ...state, phase: nextP };
    return addLog(nextState, `▶️ Phase changed to ${nextP}`, 'info');
  }

  return passTurn(state);
}

// AI TURN DECISION MAKER
export function runAITurn(state: ExtendedGameState): ExtendedGameState {
  if (state.currentTurn !== 'opponent' || state.winner) return state;

  let currentState = { ...state };

  const aiPlayer = currentState.opponent;
  const playerState = currentState.player;

  if (!aiPlayer.normalSummonedThisTurn) {
    let bestHandIndex = -1;
    let bestAtk = -1;

    aiPlayer.hand.forEach((card, idx) => {
      if (card.type.includes('Monster')) {
        const lvl = card.level || 4;
        const availableMonsters = aiPlayer.monsterZones.filter(m => m !== null).length;
        const isOgMode = currentState.ruleMode === 'og-1999';

        if (isOgMode || lvl <= 4 || (lvl <= 6 && availableMonsters >= 1) || (lvl >= 7 && availableMonsters >= 2)) {
          const atkVal = getEffectiveAtk(card, currentState);
          if (atkVal > bestAtk) {
            bestAtk = atkVal;
            bestHandIndex = idx;
          }
        }
      }
    });

    if (bestHandIndex !== -1) {
      const emptyZone = aiPlayer.monsterZones.findIndex(m => m === null);
      if (emptyZone !== -1) {
        const cardToSummon = aiPlayer.hand[bestHandIndex];
        const lvl = cardToSummon.level || 4;

        let tributes: number[] = [];
        if (currentState.ruleMode === 'standard' && lvl >= 5) {
          const monsterIndexes = aiPlayer.monsterZones
            .map((m, idx) => m ? { idx, atk: getEffectiveAtk(m.card, currentState) } : null)
            .filter((m): m is { idx: number; atk: number } => m !== null)
            .sort((a, b) => a.atk - b.atk);

          const countNeeded = lvl >= 7 ? 2 : 1;
          tributes = monsterIndexes.slice(0, countNeeded).map(m => m.idx);
        }

        const pos: Position = (cardToSummon.atk || 0) >= 1200 ? 'attack' : 'facedown';
        currentState = summonMonster(currentState, 'opponent', bestHandIndex, emptyZone, pos, tributes);
      }
    }
  }

  const stCardIndex = currentState.opponent.hand.findIndex(c => c.type.includes('Spell') || c.type.includes('Trap'));
  if (stCardIndex !== -1) {
    const emptySTZone = currentState.opponent.spellTrapZones.findIndex(st => st === null);
    if (emptySTZone !== -1) {
      currentState = playSpellTrap(currentState, 'opponent', stCardIndex, emptySTZone, true);
    }
  }

  if (currentState.turnCount > 1) {
    currentState.phase = 'BATTLE';

    const aiMonsters = currentState.opponent.monsterZones;
    for (let i = 0; i < aiMonsters.length; i++) {
      const aiM = currentState.opponent.monsterZones[i];
      if (!aiM || !aiM.canAttack || aiM.position !== 'attack') continue;

      const aiAtk = getEffectiveAtk(aiM.card, currentState);
      const playerMonsters = currentState.player.monsterZones;

      let targetIndex: number | null = null;
      let lowestDefeatableVal = Infinity;

      playerMonsters.forEach((pM, pIdx) => {
        if (!pM) return;
        const targetVal = pM.position === 'attack' ? getEffectiveAtk(pM.card, currentState) : (pM.card.def || 0);
        if (aiAtk > targetVal && targetVal < lowestDefeatableVal) {
          lowestDefeatableVal = targetVal;
          targetIndex = pIdx;
        }
      });

      const playerHasMonsters = playerMonsters.some(m => m !== null);
      if (!playerHasMonsters) {
        currentState = executeAttack(currentState, i, null);
      } else if (targetIndex !== null) {
        currentState = executeAttack(currentState, i, targetIndex);
      }
    }
  }

  // AUTOMATIC TURN PASS FROM AI TO PLAYER TO START NEXT ROUND!
  currentState = passTurn(currentState);

  return currentState;
}
