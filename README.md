# Yu-Gi-Oh! Power of Chaos - Web Duel Simulator 🎴⚡

A modern, full-featured web-based Yu-Gi-Oh! dueling simulator built with **Bun**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. Experience authentic retro and modern Yu-Gi-Oh! dueling right in your browser against classic anime AI personalities (Yugi, Kaiba, Joey) or locally with a friend!

---

## 🌟 Key Features

- **🤖 AI Opponents & Personalities**: Duel against classic anime duelists with unique playstyles, voice lines, and tactics:
  - **Yugi Muto**: Balanced tactics featuring Dark Magician and spell combos.
  - **Seto Kaiba**: Aggressive high-ATK strategy with Blue-Eyes White Dragon and power spells.
  - **Joey Wheeler**: High-risk, high-reward luck & gamble mechanics with Red-Eyes Black Dragon.
- **📜 Multiple Ruleset Engines**:
  - **Power of Chaos (Yugi the Destiny)**: Authentic classic early Yu-Gi-Oh! PC game ruleset.
  - **1999 OG OCG**: Classic early original card game rules.
  - **Standard Master Rules**: Modern timing and ruleset support.
- **⚔️ Interactive Duel Field**: Complete battle arena featuring:
  - Live Life Point tracking & animated LP counters.
  - Phase progression system (Draw, Standby, Main 1, Battle, Main 2, End Phase).
  - Monster summoning (Normal, Tribute, Special), position toggling (ATK/DEF), and Set states.
  - Spell & Trap card activation, face-down positioning, and chains.
  - Monster combat calculation, direct attacks, and graveyard handling.
  - Dynamic duel event log with character avatar reactions and victory confetti.
- **🎴 Full Deck Builder**:
  - Customize and save custom 40+ card main decks.
  - Real-time deck statistics (Monster/Spell/Trap ratio, Level distributions, ATK/DEF metrics).
- **🔍 YGOPRODeck API Card Database**:
  - Full card search with filters (Type, Attribute, Race, Level, Card Name).
  - High-res card imagery and detailed lore/effects.
- **🎨 Custom Card Creator**:
  - Design your own custom Yu-Gi-Oh! cards with custom stats, attribute, level, effect text, and custom image URL.
- **🔊 Immersive Audio & Visuals**:
  - Sound effects for card flips, LP damage, phase transitions, and attacks.
  - Toast notifications and responsive dark-theme UI.

---

## 🚀 Tech Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh)
- **Frontend Framework**: [React 19](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Effects**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Card Database**: [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/)

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh) installed on your system (v1.0.0 or higher recommended).

```bash
# Verify Bun installation
bun --version
```

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sparky4567/yu-gi-oh.git
   cd yu-gi-oh
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

---

## 🎮 Usage

### Development Server

Start the development server with Hot Module Reloading (HMR):

```bash
bun dev
```

Open your browser at `http://localhost:3000` (or the address printed in terminal).

### Production Build

To run the application in production mode:

```bash
bun start
```

Or build the static bundle:

```bash
bun run build
```

---

## 📂 Project Structure

```
yu-gi-oh/
├── src/
│   ├── components/         # React UI components (DuelBoard, DeckBuilder, Navbar, etc.)
│   ├── context/            # Context providers (ToastContext)
│   ├── data/               # Starter decks (Yugi, Kaiba, Joey) and card presets
│   ├── services/           # External API integration (YGOPRODeck API)
│   ├── types/              # TypeScript types and game state definitions
│   ├── utils/              # Game engine logic, AI AI decisions, audio, rulesets
│   ├── App.tsx             # Main application entry component
│   ├── frontend.tsx        # React root mount
│   ├── index.css           # Global stylesheet & Tailwind directives
│   ├── index.html          # HTML template
│   └── index.ts            # Bun HTTP server entry
├── build.ts                # Bun bundler build script
├── bunfig.toml             # Bun configuration
├── LICENSE                 # MIT License file
├── package.json            # Package manifest & scripts
└── README.md               # Project documentation
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## ⚠️ Disclaimer

Yu-Gi-Oh! is a registered trademark of Studio Dice, Shueisha, TV Tokyo, and Konami. This project is a non-commercial, fan-made educational application. All card artwork and trademarks belong to their respective owners.
