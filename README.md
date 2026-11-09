# Wishfor // Anonymous Peer Sanctuary

> **"Say what is on your mind. No one will know it is you."**  
> An anonymous peer-support sanctuary where individuals share personal struggles freely and receive thoughtful advice from kind peers under rotating cipher masks. Designed with a strict zero-identity-leakage architecture, passwordless authentication, and real-time safety protocols.

---

## ⚡ Overview & Vision

Modern social networks tie every vulnerability to an identity, follower count, or social graph. When honesty carries emotional, social, or professional risk, people quietly swallow their burdens.

**Wishfor** provides a quiet digital confessional. It completely discards vanity metrics, user profiles, public feeds, and tracking cookies in favor of an **anonymous peer sanctuary**:
- **Public Global Reading**: Anyone worldwide can read and gain perspective from community problems without creating an account.
- **Protected Interaction**: Replying and posting questions requires passwordless authentication (Email or SMS OTP) to prevent automated abuse and maintain a high-trust community.
- **Rotating Anonymity**: Real names, emails, phone numbers, and IP addresses are cryptographically shielded. Users appear under rotating pseudonyms (*e.g., Quiet Lantern, Silver Moth, Midnight Kite*).

---

## 🚀 Key Features & Architectural Pillars

### 1. Cryptographic Anonymity (`src/lib/anonymity.ts`)
- **Per-Thread Identity Salting**: Each participant receives a procedurally generated cipher name and telemetry seed derived from a salted hash of `userId + threadId`.
- **Cross-Thread Untrackability**: If a user authors a *Career* question as `Quiet Lantern`, and later offers advice in a *Relationship* thread, they appear as a completely different identity (e.g., `Amber Fox`).
- **Thread Consistency**: Within any single problem thread, the asker consistently retains their identity, marked with a distinctive `[ASKER]` badge.

### 2. Multi-Channel Passwordless Authentication
- **High-Deliverability Email OTP**: Direct transactional email dispatch powered by the **Resend API**.
- **Telecom-Grade SMS OTP**: International SMS verification powered by **Twilio Verify**, utilizing carrier-approved global templates that bypass regional DLT carrier restrictions.
- **International Country Code Selector**: Integrated dropdown covering 50+ countries with search filtering and automatic E.164 phone formatting.
- **Stateless Verification Tickets (`src/lib/serverAuth.ts`)**: Generates HMAC-signed verification tickets stored in secure `httpOnly` cookies, ensuring verification survives cold-starts and serverless container restarts on platforms like Vercel and Render.
- **Rate-Limiting & Anti-Bombing**: 60-second resend cooldowns and hourly quotas per identifier.

### 3. Account Persistence & Authorship Engine (`src/lib/store.ts`)
- **Session Decoupling**: Logging out terminates active session tokens without destroying public community content.
- **Email/Phone Data Restoration**: When a user logs back in with the same email or mobile number, their previous questions, peer contributions, and earned trust badges are immediately restored in **My Space**.
- **Anti-Self-Reply & Fair Rewards**:
  - Asker authors are restricted from replying to their own questions to preserve authenticity.
  - Askers can designate peer replies as *"This Helped Me"*, rewarding the contributor with **+5 Trust Points**.

### 4. Safety & Crisis Mitigation Protocol (`src/lib/safety.ts`)
- **Proactive Distress Detection**: Scans transmissions in real time for acute distress signals.
- **Non-Intrusive Crisis Helpline Card**: Surfaces immediate international crisis helplines without shaming or blocking the user:
  - **988 Suicide & Crisis Lifeline**: `988` (US & Canada, 24/7)
  - **Tele-MANAS**: `14416` (India, 24/7 Toll-Free)
  - **Crisis Text Line**: Text `HOME` to `741741`
  - **Samaritans**: `116 123` (UK & Ireland)
  - **International Finder**: [findahelpline.com](https://findahelpline.com)
- **Automated Anti-Doxxing Guard**: Prevents telephone numbers, personal email addresses, and social handles from being submitted into public transmissions.

### 5. Atmospheric Visual & Audio Experience
- **Tactile Outline Design Language**: Sharp, high-contrast dark chassis (`#0c0d14` and `#13151f`), fine hairlines, and `.btn-outline` components with tactile hover lifts.
- **Site-Wide Smooth Transitions**:
  - Gliding navigation bar underline indicator.
  - Route transitions featuring editorial `page-fade-drift` (450ms smooth fade and upward ease).
  - Cross-fading tab transitions on *My Space*, *Problems*, and *Auth*.
- **Procedural Soundscape Engine (`src/lib/soundscape.ts`)**:
  - Built-in Web Audio API synthesizer generating a subtle 55Hz ambient room drone with filtered tape flutter.
  - Micro-haptic audio feedback for button clicks and resonance likes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript (Strict mode enabled) |
| **Styling** | Tailwind CSS, Custom CSS Variables, PostCSS |
| **Icons** | Lucide React |
| **Email Gateway** | Resend API (`api.resend.com`) |
| **SMS Gateway** | Twilio Verify API (`verify.twilio.com`) |
| **Audio Synthesis** | Web Audio API (Native browser synthesizer) |
| **State & Store** | Reactive Community Store with LocalStorage & Cookie Sync |

---

## 📂 Project Structure

```
Wishfor/
├── public/
│   ├── icon.svg                      # Modern geometric W brand emblem
│   └── manifest.json                 # Web App Manifest
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── send-otp/         # OTP dispatch endpoint
│   │   │   │   ├── resend-otp/       # Cooldown-guarded resend endpoint
│   │   │   │   └── verify-otp/       # HMAC & Twilio Verify check endpoint
│   │   │   ├── posts/                # REST endpoints for problem transmissions
│   │   │   └── replies/              # REST endpoints for peer suggestions
│   │   ├── about/                    # Platform philosophy & origin
│   │   ├── auth/                     # Split-screen passwordless login/signup
│   │   ├── guidelines/               # Community rules & safety codex
│   │   ├── moderation/               # Moderation panel for reported content
│   │   ├── my-space/                 # Member profile, contributions & questions
│   │   ├── problems/                 # Public problems directory & filters
│   │   │   └── [id]/                 # Single problem thread & peer replies
│   │   ├── share/                    # New problem transmission composer
│   │   ├── globals.css               # Global theme, animations & transitions
│   │   ├── layout.tsx                # App root layout with persistent header
│   │   └── page.tsx                  # Landing experience & exploration
│   ├── components/
│   │   ├── AuthModal.tsx             # Interactive modal for inline authentication
│   │   ├── CrisisBanner.tsx          # Emergency crisis lifeline banner
│   │   ├── Header.tsx                # Dynamic header with profile hover card
│   │   ├── PersistentNav.tsx         # Floating room return & scroll telemetry
│   │   ├── RoomCanvas.tsx            # Visual category mapping & glowing aura
│   │   └── SplitLayout.tsx           # Two-column layout with ambient glow panel
│   ├── lib/
│   │   ├── anonymity.ts              # Deterministic cipher & trust level logic
│   │   ├── countryCodes.ts           # 50+ country dial codes & flags
│   │   ├── dispatchService.ts        # Unified Resend, Twilio & Supabase dispatch
│   │   ├── initialData.ts            # Baseline authentic peer confessions
│   │   ├── safety.ts                 # Real-time crisis & anti-doxxing scanners
│   │   ├── serverAuth.ts             # Cryptographic HMAC tickets & OTP store
│   │   ├── soundscape.ts             # Procedural Web Audio API sound synthesizer
│   │   └── store.ts                  # Reactive client-side community store
│   └── types/
│       └── index.ts                  # Domain models & TypeScript interfaces
├── .env.local                        # Local API secrets (not tracked in Git)
├── tailwind.config.ts                # Tailwind design configuration
└── tsconfig.json                     # TypeScript compilation configuration
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory:

```env
# ========================================================
# WISHFOR ENVIRONMENT SECRETS
# ========================================================

# 1. Resend API (Transactional Email OTP)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=WishFor Sanctuary <onboarding@resend.dev>

# 2. Twilio (Live SMS OTP)
TWILIO_ACCOUNT_SID=ACyour_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAyour_verify_service_sid

# 3. Optional Supabase Integration (if using managed Postgres)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 💻 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm, pnpm, or yarn

### Installation & Development
```bash
# 1. Clone repository
git clone https://github.com/your-username/wishfor.git
cd wishfor

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### Production Build
```bash
# Compile and verify types
npm run build

# Start production server
npm run start
```

---

## 🛡️ Security & Privacy Commitments

1. **Zero Device Fingerprinting**: No canvas fingerprinting, battery status probing, or client tracking scripts are used.
2. **Encrypted Identity Storage**: Personal phone numbers and emails are never returned in public feed payloads or API endpoints.
3. **Stateless HMAC Tokens**: Verification state is validated using timing-safe cryptographic comparisons (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.
4. **Data Isolation**: Authorship checks are evaluated in real time against sanitized sessions, preventing unauthorized modifications or account impersonation.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
