import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ExtendedGameState, 
  playSpellTrap, 
  executeAttack, 
  changeMonsterPosition, 
  nextPhase, 
  passTurn, 
  runAITurn, 
  summonMonster, 
  drawCardForTurn,
  drawUntilHandFull,
  cycleDiscardAndDraw,
  activateSetFieldCard,
  processEndPhaseDiscards,
  getMaxHandLimit
} from '../utils/gameLogic';
import { playSoundAttack, playSoundDamage, playSoundDefenseBlock, playSoundDestroy, playSoundDraw, playSoundSummon, playSoundTrapActivate, playSoundMirrorForce } from '../utils/soundEffects';
import { CardView } from './CardView';
import { CardDetailModal } from './CardDetailModal';
import { YugiohCard, FieldCard } from '../types/yugioh';
import { Swords, Shield, Scroll, RefreshCw, Trophy, Skull, ChevronRight, History, Sparkles, Layers, Flame, Eye, X, Zap, Trash2, Repeat } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface DuelBoardProps {
  gameState: ExtendedGameState;
  setGameState: React.Dispatch<React.SetStateAction<ExtendedGameState>>;
  onResetDuel: () => void;
}

interface AttackAnimState {
  attackerPlayer: 'player' | 'opponent';
  attackerIndex: number;
  defenderIndex: number | null;
  beamCoords: { x1: number; y1: number; x2: number; y2: number } | null;
}

interface TrapAnimState {
  cardName: string;
  activatorName: string;
  x: number;
  y: number;
}

interface FloatingPopup {
  id: string;
  text: string;
  x: number;
  y: number;
  color: 'red' | 'yellow' | 'cyan' | 'magenta';
}

export const DuelBoard: React.FC<DuelBoardProps> = ({
  gameState,
  setGameState,
  onResetDuel,
}) => {
  const { showToast } = useToast();
  const boardRef = useRef<HTMLDivElement>(null);

  const [inspectedCard, setInspectedCard] = useState<{ card: YugiohCard; handIndex?: number; zoneIndex?: number } | null>(null);
  const [selectedAttackerIndex, setSelectedAttackerIndex] = useState<number | null>(null);
  const [selectedFieldZoneIndex, setSelectedFieldZoneIndex] = useState<number | null>(null);
  const [selectedStZoneIndex, setSelectedStZoneIndex] = useState<number | null>(null);
  const [selectedTributeIndexes, setSelectedTributeIndexes] = useState<number[]>([]);
  const [selectedEndPhaseDiscardIndexes, setSelectedEndPhaseDiscardIndexes] = useState<number[]>([]);
  const [isCycleModeActive, setIsCycleModeActive] = useState(false);
  const [selectedCycleDiscardIndexes, setSelectedCycleDiscardIndexes] = useState<number[]>([]);
  const [pendingSummonHandIndex, setPendingSummonHandIndex] = useState<number | null>(null);
  const [pendingSummonPos, setPendingSummonPos] = useState<'attack' | 'defense'>('attack');
  const [viewingGyPlayer, setViewingGyPlayer] = useState<'player' | 'opponent' | null>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  // Animation States
  const [activeAttackAnim, setActiveAttackAnim] = useState<AttackAnimState | null>(null);
  const [activeTrapAnim, setActiveTrapAnim] = useState<TrapAnimState | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [floatingPopups, setFloatingPopups] = useState<FloatingPopup[]>([]);
  const [impactPos, setImpactPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingAnim, setIsDrawingAnim] = useState(false);

  // Check victory confetti
  useEffect(() => {
    if (gameState.winner === 'player') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [gameState.winner]);

  const isPlayerTurn = gameState.currentTurn === 'player' && !gameState.winner;
  const isEndPhaseDiscardActive = gameState.pendingEndPhaseDiscardCount > 0 && isPlayerTurn;
  const playerHandLimit = getMaxHandLimit(gameState, 'player');

  // Automated Card Refill Auto-Draw on Turn Start / DRAW Phase (Auto-draws up to 6 cards!)
  useEffect(() => {
    if (gameState.phase === 'DRAW' && isPlayerTurn && !gameState.winner && gameState.turnCount > 1) {
      const cardsToDraw = Math.max(1, 6 - gameState.player.hand.length);
      setIsDrawingAnim(true);

      const timer = setTimeout(() => {
        setIsDrawingAnim(false);
        let nextState = drawUntilHandFull(gameState, 'player', 6);
        if (!nextState.winner) {
          nextState.phase = 'MAIN1';
        }
        setGameState(nextState);
        showToast(`🃏 Auto-drew ${cardsToDraw} card(s) to refill hand to 6!`, 'info');
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.currentTurn, gameState.turnCount, gameState.winner]);

  // Handle Manual Deck Click (Blocked / Disabled!)
  const handlePlayerDrawCard = () => {
    showToast("Arbitrary manual deck drawing is disabled. Cards are automatically drawn during your Draw Phase, card effects, or via Cycle Hand.", "warning");
  };

  // Confirm Cycle Hand Discard & Auto-Refill to 6 Cards
  const handleConfirmCycleDiscard = () => {
    if (selectedCycleDiscardIndexes.length === 0) return;

    let nextState = cycleDiscardAndDraw(gameState, 'player', selectedCycleDiscardIndexes);
    setGameState(nextState);
    setIsCycleModeActive(false);
    setSelectedCycleDiscardIndexes([]);
    showToast(`♻️ Discarded ${selectedCycleDiscardIndexes.length} card(s) and auto-drew replacements to refill hand to 6!`, 'success');
  };

  // Compute beam coordinates between DOM elements
  const computeCoords = (
    attackerPlayer: 'player' | 'opponent',
    attackerIndex: number,
    defenderIndex: number | null
  ) => {
    if (!boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();

    const attElemId = attackerPlayer === 'player' ? `p-mon-${attackerIndex}` : `opp-mon-${attackerIndex}`;
    const defElemId = defenderIndex === null
      ? (attackerPlayer === 'player' ? 'opp-header' : 'p-header')
      : (attackerPlayer === 'player' ? `opp-mon-${defenderIndex}` : `p-mon-${defenderIndex}`);

    const attElem = document.getElementById(attElemId);
    const defElem = document.getElementById(defElemId);

    if (!attElem || !defElem) return null;

    const r1 = attElem.getBoundingClientRect();
    const r2 = defElem.getBoundingClientRect();

    return {
      x1: r1.left + r1.width / 2 - boardRect.left,
      y1: r1.top + r1.height / 2 - boardRect.top,
      x2: r2.left + r2.width / 2 - boardRect.left,
      y2: r2.top + r2.height / 2 - boardRect.top,
    };
  };

  // Trigger Trap Animation
  const triggerTrapAnimation = (cardName: string, activatorName: string, onDone: () => void) => {
    if (cardName === 'Mirror Force') {
      playSoundMirrorForce();
    } else {
      playSoundTrapActivate();
    }

    const boardRect = boardRef.current?.getBoundingClientRect();
    const cx = boardRect ? boardRect.width / 2 : 300;
    const cy = boardRect ? boardRect.height / 2 : 300;

    setActiveTrapAnim({ cardName, activatorName, x: cx, y: cy });

    setTimeout(() => {
      setActiveTrapAnim(null);
      onDone();
    }, 1300);
  };

  // Trigger Animated Attack Sequence
  const triggerAttackAnimation = (
    attackerPlayer: 'player' | 'opponent',
    attackerIndex: number,
    defenderIndex: number | null,
    onCompleteStateUpdate: () => void
  ) => {
    const coords = computeCoords(attackerPlayer, attackerIndex, defenderIndex);

    const defenderPlayerId = attackerPlayer === 'player' ? 'opponent' : 'player';
    const defenderPlayer = gameState[defenderPlayerId];
    const trapCard = defenderPlayer.spellTrapZones.find(st => st !== null && (st.card.type.includes('Trap') || st.card.name === 'Mirror Force' || st.card.name === 'Magic Cylinder'))?.card;

    if (trapCard) {
      triggerTrapAnimation(trapCard.name, defenderPlayer.name, () => {
        onCompleteStateUpdate();
      });
      return;
    }

    playSoundAttack();

    setActiveAttackAnim({
      attackerPlayer,
      attackerIndex,
      defenderIndex,
      beamCoords: coords,
    });

    setTimeout(() => {
      if (coords) {
        setImpactPos({ x: coords.x2, y: coords.y2 });
      }

      onCompleteStateUpdate();

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);

      const targetMon = defenderIndex !== null
        ? gameState[attackerPlayer === 'player' ? 'opponent' : 'player'].monsterZones[defenderIndex]
        : null;

      const attMon = gameState[attackerPlayer].monsterZones[attackerIndex];
      const attAtk = attMon?.card.atk || 0;

      let popText = `-${attAtk} LP!`;
      let popColor: FloatingPopup['color'] = 'red';

      if (defenderIndex !== null && targetMon) {
        if (targetMon.position === 'defense') {
          const defVal = targetMon.card.def || 0;
          if (attAtk > defVal) {
            popText = `DEF DESTROYED!`;
            popColor = 'yellow';
            playSoundDestroy();
          } else {
            popText = `BLOCKED!`;
            popColor = 'cyan';
            playSoundDefenseBlock();
          }
        } else {
          const defAtk = targetMon.card.atk || 0;
          const diff = Math.abs(attAtk - defAtk);
          popText = diff > 0 ? `-${diff} LP!` : `BOTH DESTROYED!`;
          playSoundDamage();
        }
      } else {
        playSoundDamage();
      }

      if (coords) {
        const newPopup: FloatingPopup = {
          id: `pop-${Date.now()}`,
          text: popText,
          x: coords.x2,
          y: coords.y2 - 20,
          color: popColor,
        };
        setFloatingPopups(prev => [...prev, newPopup]);
        setTimeout(() => {
          setFloatingPopups(prev => prev.filter(p => p.id !== newPopup.id));
        }, 1200);
      }
    }, 300);

    setTimeout(() => {
      setActiveAttackAnim(null);
      setImpactPos(null);
    }, 700);
  };

  // Handle Card Click from Hand
  const handleHandCardClick = (card: YugiohCard, index: number) => {
    // Voluntary Hand Cycle Discard Mode
    if (isCycleModeActive) {
      playSoundDestroy();
      if (selectedCycleDiscardIndexes.includes(index)) {
        setSelectedCycleDiscardIndexes(selectedCycleDiscardIndexes.filter(i => i !== index));
      } else {
        setSelectedCycleDiscardIndexes([...selectedCycleDiscardIndexes, index]);
      }
      return;
    }

    // End Phase Discard Selection Mode
    if (isEndPhaseDiscardActive) {
      playSoundDestroy();
      if (selectedEndPhaseDiscardIndexes.includes(index)) {
        setSelectedEndPhaseDiscardIndexes(selectedEndPhaseDiscardIndexes.filter(i => i !== index));
      } else {
        if (selectedEndPhaseDiscardIndexes.length < gameState.pendingEndPhaseDiscardCount) {
          setSelectedEndPhaseDiscardIndexes([...selectedEndPhaseDiscardIndexes, index]);
        } else {
          showToast(`Already selected ${gameState.pendingEndPhaseDiscardCount} card(s) to discard!`, 'warning');
        }
      }
      return;
    }

    if (!isPlayerTurn) {
      setInspectedCard({ card });
      return;
    }
    setInspectedCard({ card, handIndex: index });
  };

  // Confirm End Phase Discard Choices
  const handleConfirmEndPhaseDiscards = () => {
    if (selectedEndPhaseDiscardIndexes.length !== gameState.pendingEndPhaseDiscardCount) return;

    let nextState = processEndPhaseDiscards(gameState, selectedEndPhaseDiscardIndexes);
    setGameState(nextState);
    setSelectedEndPhaseDiscardIndexes([]);

    if (nextState.currentTurn === 'opponent' && !nextState.winner) {
      setTimeout(() => {
        let aiState = runAITurn(nextState);
        setGameState(aiState);
      }, 700);
    }
  };

  // Action from Detail Modal (Summon / Set / Activate)
  const handleModalAction = (action: 'summon-attack' | 'summon-defense' | 'activate' | 'set') => {
    if (!inspectedCard || inspectedCard.handIndex === undefined || !isPlayerTurn) return;

    const handIdx = inspectedCard.handIndex;
    const card = inspectedCard.card;
    setInspectedCard(null);

    const isMonster = card.type.includes('Monster');

    if (isMonster) {
      const lvl = card.level || 4;
      const requiredTributes = lvl >= 7 ? 2 : lvl >= 5 ? 1 : 0;
      const currentMonstersCount = gameState.player.monsterZones.filter(m => m !== null).length;

      if (requiredTributes > 0) {
        if (currentMonstersCount < requiredTributes) {
          showToast(`Cannot Tribute Summon ${card.name}! Requires ${requiredTributes} monster(s) on your field as tribute.`, 'warning');
          return;
        }

        setPendingSummonHandIndex(handIdx);
        setPendingSummonPos(action === 'summon-attack' ? 'attack' : 'defense');
        setSelectedTributeIndexes([]);
        return;
      }

      // No tribute required (Level 1-4)
      const emptyZone = gameState.player.monsterZones.findIndex(m => m === null);
      if (emptyZone === -1) {
        showToast("Monster zones are full!", 'warning');
        return;
      }

      const pos = action === 'summon-attack' ? 'attack' : 'defense';
      let nextState = summonMonster(gameState, 'player', handIdx, emptyZone, pos, []);
      setGameState(nextState);
      playSoundSummon();
    } else {
      const emptySTZone = gameState.player.spellTrapZones.findIndex(st => st === null);
      if (card.property !== 'Field' && emptySTZone === -1) {
        showToast("Spell & Trap zones are full!", 'warning');
        return;
      }

      const isSet = action === 'set';
      if (!isSet) {
        triggerTrapAnimation(card.name, gameState.player.name, () => {
          let nextState = playSpellTrap(gameState, 'player', handIdx, emptySTZone, false);
          setGameState(nextState);
        });
      } else {
        let nextState = playSpellTrap(gameState, 'player', handIdx, emptySTZone, true);
        setGameState(nextState);
      }
    }
  };

  // Switch Battle Position Action
  const handleSwitchMonsterPosition = (zoneIndex: number) => {
    const m = gameState.player.monsterZones[zoneIndex];
    if (!m || !isPlayerTurn) return;

    if (m.hasChangedPosition || m.turnSummoned === gameState.turnCount) {
      showToast(`Cannot change ${m.card.name}'s position again this turn!`, 'warning');
      return;
    }

    let nextState = changeMonsterPosition(gameState, 'player', zoneIndex);
    setGameState(nextState);

    const newPos = m.position === 'attack' ? 'Defense' : 'Attack';
    showToast(`Switched ${m.card.name} to ${newPos} position!`, 'success');
    setSelectedFieldZoneIndex(null);
    if (inspectedCard && inspectedCard.zoneIndex === zoneIndex) {
      setInspectedCard(null);
    }
  };

  // Click Player Spell / Trap Zone (Activate set card!)
  const handlePlayerStZoneClick = (stIndex: number) => {
    const st = gameState.player.spellTrapZones[stIndex];
    if (!st) return;

    if (!isPlayerTurn) {
      setInspectedCard({ card: st.card });
      return;
    }

    if (st.turnSummoned === gameState.turnCount) {
      showToast(`Cannot activate ${st.card.name} on the same turn it was set!`, 'warning');
      setInspectedCard({ card: st.card });
      return;
    }

    setSelectedStZoneIndex(selectedStZoneIndex === stIndex ? null : stIndex);
  };

  // Activate Face-Down Set Spell or Trap Card
  const handleActivateSetCard = (stIndex: number) => {
    const st = gameState.player.spellTrapZones[stIndex];
    if (!st || !isPlayerTurn) return;

    const card = st.card;
    setSelectedStZoneIndex(null);

    triggerTrapAnimation(card.name, gameState.player.name, () => {
      let nextState = activateSetFieldCard(gameState, 'player', stIndex);
      setGameState(nextState);
    });
  };

  // Click Player Monster Zone (Selection workflow!)
  const handlePlayerMonsterZoneClick = (index: number) => {
    const m = gameState.player.monsterZones[index];

    // TRIBUTE SELECTION PROCESS
    if (pendingSummonHandIndex !== null) {
      if (!m) return;
      const cardToSummon = gameState.player.hand[pendingSummonHandIndex];
      const lvl = cardToSummon.level || 4;
      const requiredTributes = lvl >= 7 ? 2 : lvl >= 5 ? 1 : 0;

      let newTributes: number[];
      if (selectedTributeIndexes.includes(index)) {
        newTributes = selectedTributeIndexes.filter(i => i !== index);
        setSelectedTributeIndexes(newTributes);
      } else {
        newTributes = [...selectedTributeIndexes, index];
        setSelectedTributeIndexes(newTributes);
      }

      playSoundDestroy();

      if (newTributes.length === requiredTributes) {
        const emptyZone = gameState.player.monsterZones.findIndex((zone, idx) => zone === null || newTributes.includes(idx));
        
        let nextState = summonMonster(
          gameState, 
          'player', 
          pendingSummonHandIndex, 
          emptyZone, 
          pendingSummonPos, 
          newTributes
        );
        setGameState(nextState);

        setPendingSummonHandIndex(null);
        setSelectedTributeIndexes([]);
        playSoundSummon();
      }
      return;
    }

    if (!m) return;

    // SELECT MONSTER ON FIELD WORKFLOW
    if (gameState.phase === 'BATTLE' && isPlayerTurn) {
      if (m.canAttack && m.position === 'attack') {
        setSelectedAttackerIndex(selectedAttackerIndex === index ? null : index);
        setSelectedFieldZoneIndex(selectedFieldZoneIndex === index ? null : index);
      } else {
        setSelectedFieldZoneIndex(selectedFieldZoneIndex === index ? null : index);
      }
      return;
    }

    // MAIN PHASE SELECTION WORKFLOW
    setSelectedFieldZoneIndex(selectedFieldZoneIndex === index ? null : index);
  };

  // Click Opponent Monster Zone (Battle Target!)
  const handleOpponentMonsterZoneClick = (oppIndex: number) => {
    if (selectedAttackerIndex !== null && isPlayerTurn && gameState.phase === 'BATTLE') {
      const attIndex = selectedAttackerIndex;
      setSelectedAttackerIndex(null);

      triggerAttackAnimation('player', attIndex, oppIndex, () => {
        setGameState(prev => executeAttack(prev, attIndex, oppIndex));
      });
    } else {
      const m = gameState.opponent.monsterZones[oppIndex];
      if (m) {
        setInspectedCard({ card: m.card });
      }
    }
  };

  // Direct Attack
  const handleDirectAttackClick = () => {
    if (selectedAttackerIndex !== null && isPlayerTurn && gameState.phase === 'BATTLE') {
      const oppHasMonsters = gameState.opponent.monsterZones.some(m => m !== null);
      if (oppHasMonsters) {
        showToast("You must destroy all opponent monsters before attacking directly!", 'warning');
        return;
      }

      const attIndex = selectedAttackerIndex;
      setSelectedAttackerIndex(null);

      triggerAttackAnimation('player', attIndex, null, () => {
        setGameState(prev => executeAttack(prev, attIndex, null));
      });
    }
  };

  // Advance Phase Button
  const handleNextPhase = () => {
    setSelectedAttackerIndex(null);
    setSelectedFieldZoneIndex(null);
    setSelectedStZoneIndex(null);
    setPendingSummonHandIndex(null);
    let nextState = nextPhase(gameState);
    setGameState(nextState);

    if (nextState.currentTurn === 'opponent' && !nextState.winner) {
      setTimeout(() => {
        let aiState = runAITurn(nextState);
        setGameState(aiState);
      }, 700);
    }
  };

  // Pass Turn Directly to Start Next Round
  const handleEndTurn = () => {
    setSelectedAttackerIndex(null);
    setSelectedFieldZoneIndex(null);
    setSelectedStZoneIndex(null);
    setPendingSummonHandIndex(null);
    let nextState = passTurn(gameState);
    setGameState(nextState);

    if (nextState.currentTurn === 'opponent' && !nextState.winner) {
      setTimeout(() => {
        let aiState = runAITurn(nextState);
        setGameState(aiState);
      }, 700);
    }
  };

  const pendingCard = pendingSummonHandIndex !== null ? gameState.player.hand[pendingSummonHandIndex] : null;
  const pendingLvl = pendingCard ? (pendingCard.level || 4) : 0;
  const reqTributes = pendingLvl >= 7 ? 2 : pendingLvl >= 5 ? 1 : 0;

  // Inspected zone card position info
  const inspectedZoneCard = inspectedCard?.zoneIndex !== undefined ? gameState.player.monsterZones[inspectedCard.zoneIndex] : null;
  const canSwitchInspectedPos = isPlayerTurn && inspectedZoneCard !== null && !inspectedZoneCard.hasChangedPosition && inspectedZoneCard.turnSummoned < gameState.turnCount;

  return (
    <div
      ref={boardRef}
      className={`relative w-full min-h-[calc(100vh-65px)] bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none p-2 md:p-4 ${
        isShaking ? 'animate-shake' : ''
      }`}
    >
      {/* Background Hologram Field FX */}
      <div className="absolute inset-0 bg-radial from-amber-950/20 via-neutral-950 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

      {/* SVG LASER BEAM OVERLAY */}
      {activeAttackAnim && activeAttackAnim.beamCoords && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
          <defs>
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line
            x1={activeAttackAnim.beamCoords.x1}
            y1={activeAttackAnim.beamCoords.y1}
            x2={activeAttackAnim.beamCoords.x2}
            y2={activeAttackAnim.beamCoords.y2}
            stroke="url(#laserGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glow)"
            className="animate-laser"
          />
        </svg>
      )}

      {/* TRAP CARD ACTIVATION OVERLAY BANNER */}
      {activeTrapAnim && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="absolute rounded-full border-4 border-fuchsia-500 bg-fuchsia-500/20 animate-trap-wave shadow-[0_0_80px_rgba(217,70,239,1)]"
            style={{ width: 300, height: 300 }}
          />
          <div className="relative bg-gradient-to-r from-fuchsia-950 via-purple-900 to-fuchsia-950 border-y-2 border-fuchsia-400 w-full py-5 text-center shadow-[0_0_50px_rgba(217,70,239,0.8)] animate-trap-banner">
            <div className="flex items-center justify-center gap-2 text-fuchsia-300 font-mono text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 animate-spin text-fuchsia-400" />
              <span>TRAP / SPELL CARD TRIGGERED BY {activeTrapAnim.activatorName.toUpperCase()}</span>
              <Sparkles className="w-4 h-4 animate-spin text-fuchsia-400" />
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold font-serif bg-gradient-to-r from-fuchsia-200 via-pink-400 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
              🔮 {activeTrapAnim.cardName.toUpperCase()}!
            </h2>
          </div>
        </div>
      )}

      {/* VOLUNTARY DISCARD & REFILL BANNER NOTIFICATION */}
      {isCycleModeActive && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-teal-950 via-emerald-900 to-teal-950 border-2 border-teal-400 rounded-xl px-6 py-3 shadow-[0_0_35px_rgba(45,212,191,0.9)] text-center animate-bounce flex items-center gap-3">
          <Repeat className="w-6 h-6 text-teal-300 animate-spin" />
          <div>
            <div className="text-xs font-bold text-teal-300 uppercase tracking-widest font-mono">
              CYCLE HAND (DISCARD & REFILL TO 6)
            </div>
            <div className="text-sm font-extrabold text-white">
              Select unneeded card(s) from hand ({selectedCycleDiscardIndexes.length} selected). Replacement cards will be auto-drawn!
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmCycleDiscard}
              disabled={selectedCycleDiscardIndexes.length === 0}
              className={`text-xs font-bold px-3 py-1.5 rounded border transition ${
                selectedCycleDiscardIndexes.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-yellow-300 shadow-lg cursor-pointer animate-pulse'
                  : 'bg-neutral-800 text-gray-500 border-neutral-700 cursor-not-allowed'
              }`}
            >
              Send to GY & Auto-Draw
            </button>
            <button
              onClick={() => { setIsCycleModeActive(false); setSelectedCycleDiscardIndexes([]); }}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs px-2.5 py-1.5 rounded border border-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* END PHASE DISCARD SELECTION BANNER */}
      {isEndPhaseDiscardActive && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-2 border-red-500 rounded-xl px-6 py-3 shadow-[0_0_35px_rgba(239,68,68,0.9)] text-center animate-bounce flex items-center gap-3">
          <Trash2 className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-red-300 uppercase tracking-widest font-mono">
              END PHASE HAND SIZE LIMIT ({gameState.player.hand.length} / {playerHandLimit === Infinity ? '∞' : playerHandLimit})
            </div>
            <div className="text-sm font-extrabold text-white">
              Click <span className="text-yellow-400 underline">{gameState.pendingEndPhaseDiscardCount - selectedEndPhaseDiscardIndexes.length}</span> card(s) from your hand to discard to GY!
            </div>
          </div>
          <button
            onClick={handleConfirmEndPhaseDiscards}
            disabled={selectedEndPhaseDiscardIndexes.length !== gameState.pendingEndPhaseDiscardCount}
            className={`ml-4 text-xs font-bold px-3 py-1.5 rounded border transition ${
              selectedEndPhaseDiscardIndexes.length === gameState.pendingEndPhaseDiscardCount
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-yellow-300 shadow-lg cursor-pointer animate-pulse'
                : 'bg-neutral-800 text-gray-500 border-neutral-700 cursor-not-allowed'
            }`}
          >
            Confirm Discard
          </button>
        </div>
      )}

      {/* IMPACT BLAST EFFECT */}
      {impactPos && (
        <div
          className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: impactPos.x, top: impactPos.y }}
        >
          <div className="w-20 h-20 rounded-full bg-radial from-amber-300 via-red-500 to-transparent border-4 border-yellow-300 animate-impact-blast shadow-[0_0_50px_rgba(250,204,21,1)]" />
        </div>
      )}

      {/* FLOATING DAMAGE POPUPS */}
      {floatingPopups.map(pop => (
        <div
          key={pop.id}
          className={`absolute z-50 font-mono font-extrabold text-2xl drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-float-damage pointer-events-none ${
            pop.color === 'red'
              ? 'text-red-500 shadow-red-950'
              : pop.color === 'yellow'
              ? 'text-yellow-400'
              : pop.color === 'magenta'
              ? 'text-fuchsia-400'
              : 'text-cyan-300'
          }`}
          style={{ left: pop.x, top: pop.y }}
        >
          {pop.text}
        </div>
      ))}

      {/* TRIBUTE SUMMON BANNER NOTIFICATION */}
      {pendingSummonHandIndex !== null && pendingCard && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border-2 border-yellow-400 rounded-xl px-6 py-3 shadow-[0_0_30px_rgba(250,204,21,0.8)] text-center animate-bounce flex items-center gap-3">
          <Flame className="w-6 h-6 text-yellow-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-yellow-300 uppercase tracking-widest font-mono">
              TRIBUTE SUMMON: {pendingCard.name.toUpperCase()} (LEVEL {pendingLvl})
            </div>
            <div className="text-sm font-extrabold text-white">
              Select <span className="text-yellow-400 underline">{reqTributes - selectedTributeIndexes.length}</span> monster(s) on your field to tribute to GY!
            </div>
          </div>
          <button
            onClick={() => { setPendingSummonHandIndex(null); setSelectedTributeIndexes([]); }}
            className="ml-4 bg-red-900 hover:bg-red-800 text-white text-xs px-2.5 py-1 rounded border border-red-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* TOP: OPPONENT FIELD */}
      <div className="relative z-10 w-full max-w-6xl mx-auto bg-neutral-900/60 backdrop-blur-md rounded-2xl p-3 border border-neutral-800 shadow-xl">
        {/* Opponent Info Header */}
        <div id="opp-header" className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleDirectAttackClick}>
            <div className="w-10 h-10 rounded-full border-2 border-red-500 overflow-hidden shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              <img src={gameState.opponent.avatar} alt="Opponent" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-red-400 font-serif">{gameState.opponent.name}</span>
                {selectedAttackerIndex !== null && !gameState.opponent.monsterZones.some(m => m !== null) && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-bounce shadow">
                    ⚔️ CLICK TO ATTACK DIRECTLY!
                  </span>
                )}
              </div>
              <div className="w-48 bg-neutral-800 h-3 rounded-full overflow-hidden border border-neutral-700 mt-1">
                <div
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-500"
                  style={{ width: `${Math.max(0, (gameState.opponent.lp / gameState.opponent.maxLp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-red-400 font-bold text-lg">{gameState.opponent.lp} LP</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewingGyPlayer('opponent')}
                className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded border border-neutral-700 flex items-center gap-1"
              >
                💀 GY: {gameState.opponent.graveyard.length}
              </button>
            </div>
          </div>
        </div>

        {/* Opponent Hand & Deck Stack */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex justify-center gap-1 flex-grow">
            {gameState.opponent.hand.map((_, i) => (
              <div key={i} className="w-10 h-14 rounded border border-red-900 bg-neutral-900 shadow-md flex items-center justify-center">
                <div className="w-4 h-6 rounded border border-amber-800 bg-amber-950/40" />
              </div>
            ))}
          </div>

          <div className="relative group shrink-0">
            <div className="w-14 h-20 rounded-lg border-2 border-red-800 bg-gradient-to-br from-red-950 to-neutral-950 shadow-2xl flex flex-col items-center justify-center p-1 relative">
              <div className="absolute inset-0.5 rounded border border-red-700/50 bg-black/40" />
              <Layers className="w-5 h-5 text-red-500 relative z-10" />
              <span className="text-[10px] font-bold text-red-300 font-mono relative z-10 mt-1">{gameState.opponent.deck.length}</span>
            </div>
          </div>
        </div>

        {/* Opponent Spell / Trap Zones */}
        <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto mb-2">
          {gameState.opponent.spellTrapZones.map((st, i) => (
            <div key={i} className="h-28 border border-neutral-800/80 rounded-lg bg-neutral-950/60 flex items-center justify-center">
              {st ? (
                <CardView card={st.card} position={st.position} isFacedown={st.position === 'facedown'} size="sm" />
              ) : (
                <span className="text-[9px] text-neutral-700 font-mono">S/T {i + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Opponent Monster Zones */}
        <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto">
          {gameState.opponent.monsterZones.map((m, i) => {
            const isTargetable = selectedAttackerIndex !== null && isPlayerTurn && gameState.phase === 'BATTLE' && m !== null;
            const isDefending = activeAttackAnim?.defenderIndex === i && activeAttackAnim.attackerPlayer === 'player';
            return (
              <div
                key={i}
                id={`opp-mon-${i}`}
                onClick={() => handleOpponentMonsterZoneClick(i)}
                className={`h-32 border border-red-950/60 rounded-lg bg-neutral-950/80 flex items-center justify-center relative cursor-pointer transition ${
                  isTargetable ? 'ring-2 ring-red-500 bg-red-950/30' : ''
                }`}
              >
                {m ? (
                  <CardView
                    card={m.card}
                    position={m.position}
                    isFacedown={m.position === 'facedown'}
                    isTargetable={isTargetable}
                    isDefending={isDefending}
                    size="sm"
                  />
                ) : (
                  <span className="text-[9px] text-red-900/60 font-mono">MONSTER {i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: FIELD SPELL & PHASE BAR */}
      <div className="relative z-10 w-full max-w-5xl mx-auto my-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-neutral-900/80 border border-amber-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-400 font-serif">ACTIVE FIELD:</span>
          {gameState.player.fieldZone || gameState.opponent.fieldZone ? (
            <span className="text-xs bg-amber-950 text-amber-300 font-bold px-2.5 py-1 rounded border border-amber-700">
              🌐 {(gameState.player.fieldZone || gameState.opponent.fieldZone)?.card.name}
            </span>
          ) : (
            <span className="text-xs text-gray-500 italic">None</span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-black/80 px-3 py-1.5 rounded-lg border border-neutral-700">
          {(['DRAW', 'STANDBY', 'MAIN1', 'BATTLE', 'MAIN2', 'END'] as const).map((p) => (
            <span
              key={p}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                gameState.phase === p
                  ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                  : 'text-gray-500'
              }`}
            >
              {p}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogsDrawer(!showLogsDrawer)}
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-gray-300 flex items-center gap-1"
            title="Duel History Log"
          >
            <History className="w-3.5 h-3.5" /> Log
          </button>

          {isPlayerTurn && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNextPhase}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-amber-500/50 text-amber-300 font-bold text-xs rounded-lg shadow transition"
              >
                Next Phase ➔
              </button>
              <button
                onClick={handleEndTurn}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-lg shadow-lg flex items-center gap-1 transition"
              >
                End Turn ⌛
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: PLAYER FIELD */}
      <div className="relative z-10 w-full max-w-6xl mx-auto bg-neutral-900/60 backdrop-blur-md rounded-2xl p-3 border border-neutral-800 shadow-xl">
        <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto mb-2">
          {gameState.player.monsterZones.map((m, i) => {
            const isSelected = selectedAttackerIndex === i || selectedFieldZoneIndex === i || selectedTributeIndexes.includes(i);
            const isAttacking = activeAttackAnim?.attackerIndex === i && activeAttackAnim.attackerPlayer === 'player';
            const isDefending = activeAttackAnim?.defenderIndex === i && activeAttackAnim.attackerPlayer === 'opponent';

            const isTributeCandidate = pendingSummonHandIndex !== null && m !== null;
            const canChangePos = isPlayerTurn && m !== null && !m.hasChangedPosition && m.turnSummoned < gameState.turnCount;

            return (
              <div
                key={i}
                id={`p-mon-${i}`}
                onClick={() => handlePlayerMonsterZoneClick(i)}
                className={`h-32 border border-amber-950/60 rounded-lg bg-neutral-950/80 flex items-center justify-center relative cursor-pointer transition hover:border-amber-500/60 ${
                  isSelected
                    ? 'ring-4 ring-yellow-400 shadow-[0_0_25px_rgba(250,204,21,1)] bg-yellow-950/40'
                    : isTributeCandidate
                    ? 'ring-4 ring-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.8)] bg-amber-950/20'
                    : ''
                }`}
              >
                {m ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <CardView
                      card={m.card}
                      position={m.position}
                      isSelected={isSelected}
                      isAttacking={isAttacking}
                      isDefending={isDefending}
                      size="sm"
                    />

                    {/* ACTION CONTROL OVERLAY FOR SELECTED MONSTER */}
                    {selectedFieldZoneIndex === i && isPlayerTurn && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 bg-neutral-900 border-2 border-amber-400 rounded-xl p-1 shadow-2xl flex items-center gap-1 animate-fade-in shrink-0">
                        {canChangePos ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchMonsterPosition(i);
                            }}
                            className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow"
                          >
                            <RefreshCw className="w-3 h-3" />
                            {m.position === 'attack' ? 'Set Defense' : 'Set Attack'}
                          </button>
                        ) : (
                          <span className="text-[9px] text-gray-400 px-1 font-mono">Pos Fixed</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedCard({ card: m.card, zoneIndex: i });
                          }}
                          className="p-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded text-[10px]"
                          title="Inspect Card Details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFieldZoneIndex(null);
                          }}
                          className="p-1 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {isTributeCandidate && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-extrabold px-1 rounded-bl">
                        TRIBUTE
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[9px] text-amber-900/60 font-mono">MONSTER {i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* PLAYER SPELL / TRAP ZONES */}
        <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto mb-3">
          {gameState.player.spellTrapZones.map((st, i) => {
            const isStSelected = selectedStZoneIndex === i;
            return (
              <div
                key={i}
                onClick={() => handlePlayerStZoneClick(i)}
                className={`h-28 border border-neutral-800/80 rounded-lg bg-neutral-950/60 flex items-center justify-center relative cursor-pointer transition hover:border-amber-500/60 ${
                  isStSelected ? 'ring-4 ring-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.8)]' : ''
                }`}
              >
                {st ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <CardView card={st.card} position={st.position} isFacedown={st.position === 'facedown'} size="sm" />

                    {/* ACTION CONTROL OVERLAY FOR SELECTED SET SPELL / TRAP */}
                    {isStSelected && isPlayerTurn && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 bg-neutral-900 border-2 border-teal-400 rounded-xl p-1 shadow-2xl flex items-center gap-1 animate-fade-in shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateSetCard(i);
                          }}
                          className="px-2 py-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow"
                        >
                          <Zap className="w-3 h-3 text-yellow-300" /> Activate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedCard({ card: st.card });
                          }}
                          className="p-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded text-[10px]"
                          title="Inspect Card"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStZoneIndex(null);
                          }}
                          className="p-1 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[9px] text-neutral-700 font-mono">S/T {i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Player Hand & Interactive Deck Stack */}
        <div className="border-t border-neutral-800 pt-2">
          <div id="p-header" className="flex items-center justify-between mb-1.5 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 font-serif">YOUR HAND ({gameState.player.hand.length}):</span>
              <span className="text-[10px] text-gray-400 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                LIMIT: {playerHandLimit === Infinity ? '∞ Infinite' : `${playerHandLimit} Cards`}
              </span>
              {isPlayerTurn && !isEndPhaseDiscardActive && (
                <button
                  onClick={() => setIsCycleModeActive(!isCycleModeActive)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                    isCycleModeActive
                      ? 'bg-teal-950 text-teal-300 border-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-teal-400 border-neutral-700'
                  }`}
                >
                  <Repeat className="w-3 h-3" /> {isCycleModeActive ? 'Exit Cycle' : '♻️ Cycle Hand & Refill'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-yellow-400 font-bold text-lg">{gameState.player.lp} LP</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingGyPlayer('player')}
                  className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded border border-neutral-700 flex items-center gap-1"
                >
                  💀 GY: {gameState.player.graveyard.length}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-2 flex-grow">
              {gameState.player.hand.map((card, i) => {
                const isDiscardSelected = selectedEndPhaseDiscardIndexes.includes(i) || selectedCycleDiscardIndexes.includes(i);
                return (
                  <div
                    key={i}
                    className={`${isDrawingAnim && i >= gameState.player.hand.length - 2 ? 'animate-card-draw' : ''} ${
                      isDiscardSelected
                        ? isCycleModeActive
                          ? 'ring-4 ring-teal-400 rounded-lg shadow-[0_0_20px_rgba(45,212,191,1)] transform scale-105'
                          : 'ring-4 ring-red-500 rounded-lg shadow-[0_0_20px_rgba(239,68,68,1)] transform scale-105'
                        : ''
                    }`}
                  >
                    <CardView
                      card={card}
                      onClick={() => handleHandCardClick(card, i)}
                      isSelected={pendingSummonHandIndex === i || isDiscardSelected}
                      size="md"
                    />
                  </div>
                );
              })}
            </div>

            <div
              onClick={handlePlayerDrawCard}
              className="relative group shrink-0 p-1 rounded-xl transition cursor-pointer"
              title="Deck Stack (Auto-Draw Mode Active)"
            >
              <div className="w-16 h-24 rounded-lg border-2 border-amber-500 bg-gradient-to-br from-amber-700 via-yellow-800 to-neutral-950 shadow-2xl flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
                <div className="absolute inset-1 rounded border border-amber-400/40 bg-black/40 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 rounded-full border border-amber-400 flex items-center justify-center bg-amber-900/60 mb-1">
                    <Layers className="w-3.5 h-3.5 text-yellow-300" />
                  </div>
                  <span className="text-xs font-bold text-yellow-300 font-mono">{gameState.player.deck.length}</span>
                  <span className="text-[7px] text-amber-400 font-mono tracking-tighter uppercase mt-0.5">DRAW DECK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGS DRAWER SIDEBAR */}
      {showLogsDrawer && (
        <div className="fixed top-16 right-4 z-40 w-80 max-h-96 bg-neutral-900/95 border border-amber-500/40 rounded-xl shadow-2xl p-3 flex flex-col backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
            <h3 className="text-xs font-bold text-amber-400 font-serif flex items-center gap-1.5">
              <History className="w-4 h-4" /> DUEL COMBAT LOG
            </h3>
            <button onClick={() => setShowLogsDrawer(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-1.5 text-[11px] font-mono pr-1">
            {gameState.logs.map((log) => (
              <div
                key={log.id}
                className={`p-1.5 rounded border ${
                  log.type === 'damage'
                    ? 'bg-red-950/60 border-red-800 text-red-300'
                    : log.type === 'summon'
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : log.type === 'spell'
                    ? 'bg-teal-950/60 border-teal-800 text-teal-300'
                    : 'bg-neutral-950 border-neutral-800 text-gray-300'
                }`}
              >
                <span className="text-[9px] text-gray-500 block">{log.timestamp}</span>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAVEYARD MODAL */}
      {viewingGyPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-amber-400 font-serif">
                💀 {viewingGyPlayer === 'player' ? 'Your' : "Opponent's"} Graveyard ({gameState[viewingGyPlayer].graveyard.length})
              </h3>
              <button onClick={() => setViewingGyPlayer(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex-grow overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3 p-2">
              {gameState[viewingGyPlayer].graveyard.length === 0 ? (
                <p className="text-gray-500 italic col-span-full text-center py-8">Graveyard is empty.</p>
              ) : (
                gameState[viewingGyPlayer].graveyard.map((card, i) => (
                  <CardView key={i} card={card} size="sm" onClick={() => setInspectedCard({ card })} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CARD DETAIL INSPECTOR MODAL */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard.card}
          onClose={() => setInspectedCard(null)}
          canPlay={isPlayerTurn && inspectedCard.handIndex !== undefined && !isEndPhaseDiscardActive && !isCycleModeActive}
          onAction={handleModalAction}
          canSwitchPosition={canSwitchInspectedPos}
          currentPosition={inspectedZoneCard?.position}
          onSwitchPosition={() => inspectedCard.zoneIndex !== undefined && handleSwitchMonsterPosition(inspectedCard.zoneIndex)}
        />
      )}

      {/* GAME OVER VICTORY / DEFEAT MODAL */}
      {gameState.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-neutral-900 to-black border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.4)]">
            {gameState.winner === 'player' ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                <h2 className="text-4xl font-extrabold text-yellow-400 font-serif mb-2">DUEL VICTORY!</h2>
                <p className="text-gray-300 text-sm mb-6">You have defeated {gameState.opponent.name}!</p>
              </>
            ) : (
              <>
                <Skull className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h2 className="text-4xl font-extrabold text-red-500 font-serif mb-2">DEFEATED!</h2>
                <p className="text-gray-300 text-sm mb-6">{gameState.opponent.name} won the duel!</p>
              </>
            )}

            <button
              onClick={onResetDuel}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-base rounded-xl shadow-xl transition transform hover:scale-105"
            >
              Rematch / New Duel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
