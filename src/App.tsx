import React, { useState } from 'react';
import { GameMode, AIPersonality, RuleMode, YugiohCard } from './types/yugioh';
import { KAIBA_DECK, YUGI_DECK, JOEY_DECK } from './data/starterDecks';
import { createInitialState, ExtendedGameState } from './utils/gameLogic';
import { Navbar } from './components/Navbar';
import { DuelBoard } from './components/DuelBoard';
import { DeckBuilder } from './components/DeckBuilder';
import { CardSearchModal } from './components/CardSearchModal';
import { CustomCardCreator } from './components/CustomCardCreator';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ToastProvider, useToast } from './context/ToastContext';

function MainApp() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<GameMode>('vs-ai');
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('yugi');
  const [ruleMode, setRuleMode] = useState<RuleMode>('poc-yugi');

  // Decks
  const [playerDeck, setPlayerDeck] = useState<YugiohCard[]>(YUGI_DECK);
  const [opponentDeck, setOpponentDeck] = useState<YugiohCard[]>(YUGI_DECK);

  // Active Game State
  const [gameState, setGameState] = useState<ExtendedGameState>(() =>
    createInitialState(playerDeck, opponentDeck, 'yugi', 'poc-yugi')
  );

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Reset / Start New Duel
  const handleResetDuel = () => {
    const oppDeck = aiPersonality === 'kaiba' ? KAIBA_DECK : aiPersonality === 'yugi' ? YUGI_DECK : JOEY_DECK;
    setOpponentDeck(oppDeck);
    setGameState(createInitialState(playerDeck, oppDeck, aiPersonality, ruleMode));
    showToast('New duel initialized!', 'info');
  };

  // Change Rule Mode
  const handleSelectRuleMode = (newRuleMode: RuleMode) => {
    setRuleMode(newRuleMode);
    const oppDeck = aiPersonality === 'kaiba' ? KAIBA_DECK : aiPersonality === 'yugi' ? YUGI_DECK : JOEY_DECK;
    setGameState(createInitialState(playerDeck, oppDeck, aiPersonality, newRuleMode));
    const titleText = newRuleMode === 'poc-yugi' ? 'Power of Chaos (Yugi the Destiny)' : newRuleMode === 'og-1999' ? '1999 OG OCG' : 'Standard Master Rules';
    showToast(`Switched ruleset to ${titleText}`, 'info');
  };

  // Change AI personality
  const handleSelectAiPersonality = (newAi: AIPersonality) => {
    setAiPersonality(newAi);
    const oppDeck = newAi === 'kaiba' ? KAIBA_DECK : newAi === 'yugi' ? YUGI_DECK : JOEY_DECK;
    setOpponentDeck(oppDeck);
    setGameState(createInitialState(playerDeck, oppDeck, newAi, ruleMode));
    showToast(`Challenging ${newAi === 'kaiba' ? 'Seto Kaiba' : newAi === 'yugi' ? 'Yugi Muto' : 'Joey Wheeler'}!`, 'info');
  };

  // Deck saved from DeckBuilder
  const handleSaveDeck = (newDeck: YugiohCard[]) => {
    setPlayerDeck(newDeck);
    setGameState(createInitialState(newDeck, opponentDeck, aiPersonality, ruleMode));
    setMode('vs-ai');
    showToast(`Saved deck (${newDeck.length} cards)! Started duel with new deck.`, 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">
      <Navbar
        currentMode={mode}
        onSelectMode={setMode}
        aiPersonality={aiPersonality}
        onSelectAiPersonality={handleSelectAiPersonality}
        ruleMode={ruleMode}
        onSelectRuleMode={handleSelectRuleMode}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onResetDuel={handleResetDuel}
      />

      <main className="flex-grow flex flex-col">
        {mode === 'vs-ai' && (
          <DuelBoard
            gameState={gameState}
            setGameState={setGameState}
            onResetDuel={handleResetDuel}
          />
        )}

        {mode === 'local-2p' && (
          <DuelBoard
            gameState={gameState}
            setGameState={setGameState}
            onResetDuel={handleResetDuel}
          />
        )}

        {mode === 'deck-builder' && (
          <DeckBuilder
            currentDeck={playerDeck}
            onSaveDeck={handleSaveDeck}
          />
        )}

        {mode === 'card-search' && (
          <div className="p-4 max-w-6xl mx-auto w-full">
            <CardSearchModal onClose={() => setMode('vs-ai')} />
          </div>
        )}

        {mode === 'card-creator' && (
          <div className="p-4 max-w-4xl mx-auto w-full">
            <CustomCardCreator onSaveCard={(newCard) => {
              showToast(`Created custom card: ${newCard.name}! Added to collection.`, 'success');
              setMode('deck-builder');
            }} />
          </div>
        )}
      </main>

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

export default App;
