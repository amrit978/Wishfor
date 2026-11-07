# WishFor // Anonymous Peer Sanctuary

> **"Say it into the dark. Someone is listening."**  
> *An anonymous peer-help sanctuary where individuals transmit whatever weighs on their minds and strangers reply under rotating cipher masks. Zero identity leakage. Zero algorithmic judgment.*

---

## 🛰️ Aesthetic & Design Direction (Overworld Audio Inspired)

Drawing direct inspiration from **[Overworld Audio](https://overworldaudio.com)** (Awwwards Site of the Day by Rogier de Boevé), WishFor abandons generic SaaS card layouts and pastel gradients in favor of an **architectural, dark cinematic HUD**:

- **Spatial Dark Palette**: Deep void blacks (`#07080b`), technical chassis surfaces (`#0c0e14`, `#12141c`), cold titanium hairlines (`#27272a`), and phosphor candle amber (`#e5ab37`).
- **Interactive Soundscape Engine (`src/lib/soundscape.ts`)**: Built-in procedural Web Audio API spatial synthesizer:
  - Ambient deep room tone (55Hz drone + filtered tape texture) toggleable via `[ SOUNDSCAPE // ON ]`.
  - Micro-sound feedback for UI interactions (frequency clicks, resonance tones on like/help marks).
  - Live animated waveform visualizer component.
- **Precision Typography & Layout**:
  - Monospace telemetry and coordinates (`FREQ // 104.2`, `CIPHER // MOTH [24.5Hz]`, `LAT/LONG coordinates`).
  - Corner crosshairs (`+`) on all structural panels.
  - Lora Serif for reflective titles paired with Plus Jakarta Sans and JetBrains Mono for technical clarity.
- **100% English**: Complete removal of all Hindi/Hinglish copy. The feed features deeply human, emotionally resonant confessions and grounded peer advice.

---

## 🏛️ Anonymity & Zero-Leakage Architecture

1. **Rotating Thread Ciphers (`src/lib/anonymity.ts`)**:
   - Each user receives an anonymous cipher callsign (e.g., `Quiet Lantern`, `Silver Moth`, `Desert Pine`, `Midnight Kite`) paired with a generative procedural radar/telemetry glyph.
   - **Cross-Thread Untrackability**: User identities are salted and hashed per thread (`post_id + user_id`). If an author posts in *Career* as `Quiet Lantern`, and later answers a *Relationship* thread, they receive a completely different cipher (e.g., `Amber Fox`).
   - **Thread Consistency**: Within any single thread, the author retains their cipher, designated by an amber `ASKER` badge.
2. **Sealed Internal Trust Scores**:
   - Users earn trust points for helpful responses (+1 per resonance like, +5 when marked "Helped Me Most", +1 per verified clean advice).
   - Only their public standing tier is broadcasted (`[TIER-I // NEWCOMER]`, `[TIER-II // LISTENER]`, `[TIER-III // HELPER]`, `[TIER-IV // GUIDE]`, `[TIER-V // TRUSTED VOICE]`)—never raw scores or account IDs.
3. **Hard Deletion**:
   - Purging a post or reply triggers an immediate, permanent hard deletion across all tables and client states.

---

## 🛡️ Safety & Crisis Protocols (`src/lib/safety.ts`)

- **Distress Detection**: Scans transmissions for acute crisis markers in real time.
- **Gentle Crisis Card**: Displays direct, non-judgmental emergency helplines without blocking the user:
  - **988 Suicide & Crisis Lifeline**: `988` (US/Canada, 24/7)
  - **Crisis Text Line**: Text `HOME` to `741741`
  - **Tele-MANAS**: `14416` (24/7 Toll-free)
  - **Samaritans**: `116 123` (UK & Ireland)
  - **International**: [findahelpline.com](https://findahelpline.com)
- **Anti-Doxxing Guard**: Blocks telephone numbers, email addresses, and social handles before content can be saved.

---

## 📁 Repository Structure

```
Wishfor/
├── public/
│   ├── icon.svg                     # Vector emblem
│   └── manifest.json                # PWA manifest
├── src/
│   ├── app/
│   │   ├── api/                     # Server-side validation & routes
│   │   │   ├── posts/route.ts
│   │   │   └── replies/route.ts
│   │   ├── globals.css              # Dark cinematic HUD styling & scanline grid
│   │   ├── layout.tsx               # Root layout & meta
│   │   └── page.tsx                 # Overworld spatial feed & channel selector
│   ├── components/
│   │   ├── CrisisBanner.tsx         # Technical emergency protocol card
│   │   ├── GuidelinesModal.tsx      # Sanctuary codex & inviolable rules
│   │   ├── Header.tsx               # HUD top bar, soundscape toggle, signal badge
│   │   ├── MaskAvatar.tsx           # Procedural radar/telemetry cipher emblem
│   │   ├── ModerationPanel.tsx      # Guardian arbitration desk
│   │   ├── MySpaceView.tsx          # Private chamber archives & trust telemetry
│   │   ├── PostCard.tsx             # Architectural transmission card with crosshairs
│   │   ├── PostFormModal.tsx        # Signal transmission console
│   │   ├── ReportModal.tsx          # Incident report filing modal
│   │   ├── ThreadView.tsx           # Encrypted dialogue transcript
│   │   ├── TrustBadge.tsx           # Monospace tier badge (Tier I-V)
│   │   └── WaveformVisualizer.tsx   # Real-time audio frequency visualizer
│   ├── lib/
│   │   ├── anonymity.ts             # Deterministic cipher generation & tier logic
│   │   ├── initialData.ts           # 10 authentic English human confessions & advice
│   │   ├── safety.ts                # Anti-doxxing regex & crisis detection
│   │   ├── soundscape.ts            # Web Audio API spatial synthesizer & sound FX
│   │   ├── store.ts                 # Local storage reactive community store
│   │   └── supabase.ts              # Supabase Postgres client
│   └── types/
│       └── index.ts                 # TypeScript domain contracts
├── supabase/
│   ├── schema.sql                   # PostgreSQL schema with RLS & zero-leak views
│   └── seed.sql                     # SQL seed with 10 authentic English stories
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
