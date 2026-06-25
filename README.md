# HOTEL Ready — Enterprise Training Platform

A web app for hotel staff to practise real guest-facing situations by speaking to an AI "guest" and getting instantly scored on their performance.

## Status: Phase 4.2 Complete (Session Playback)

**Phase 1** (core MVP): Login, role-play, scoring, and manager dashboard fully functional.

**Phase 2**: 3 department packs (27 scenarios), emotion-based voice delivery, enhanced manager dashboard.

**Phase 3** adds:
- **36 total scenarios** across 4 department packs (added Concierge)
- **"Stuck? See options"** UI with AI-suggested responses ranked by effectiveness
- **CSV bulk staff import** for team setup and management
- **Profile editing** (change staff PIN from manager dashboard)
- **Analytics dashboard** with team metrics, performance trends, scenario difficulty analysis

The app is fully production-ready for hotel staff training at scale. Teams can practice across 4 departments, get AI coaching during scenarios, and managers have complete visibility into team performance with actionable insights.

## Quick Start

### Prerequisites
- **Node.js** 18+ (uses native `import.meta.dirname`)
- A valid **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)
- (Optional) **ElevenLabs API key** from [elevenlabs.io](https://elevenlabs.io/app/api) for premium voices

### Setup

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Configure API keys:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   # (Optional) Add ELEVENLABS_API_KEY for premium text-to-speech
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   
   This starts:
   - **Vite frontend** on `http://localhost:5173`
   - **Express backend** on `http://localhost:3001`

4. **Open in your browser:**
   - **Desktop:** http://localhost:5173
   - **Mobile on same network:** Find your computer's IP (e.g., `192.168.1.x`) and navigate to `http://192.168.1.x:5173`

## What's Built (Phase 1)

### ✅ Complete
**Phase 1: Core functionality**
- **Login screen** with First/Last name, 4-digit PIN, Position, Department dropdown
- **Persistent header** showing app name, live date/time, Hotel Name slot, mute toggle
- **Practice-area selector** with 3 department packs (27 total scenarios)
- **Scenario list** with best score and best time per scenario
- **Role-play loop** with conversation, timer, and time tracking (in seconds)
- **Score card** showing overall 0–100 score, 5 dimension bars, coaching points, verdict, and timing
- **Manager dashboard** (PIN-gated, view team stats and scenario performance)
- **Type-safe models** (GuestTurn with emotion, AnswerOptions, timing)
- **Backend APIs:** `/api/guest-turn`, `/api/score`, `/api/answer-options`, `/api/tts`, `/api/voices`, `/api/export-report`
- **State management** with PIN-auth profiles, time/score tracking, localStorage persistence
- **Tailwind + brand colours** (crimson #960404, teal #039594)

**Phase 3.5: Premium text-to-speech (optional upgrade)**
- **ElevenLabs integration:**
  - 3 professional voices with distinct characteristics (Bella, Elli, Chris)
  - Emotion-aware voice parameter adjustment per guest state
  - Voice selector dropdown in role-play screen
  - Graceful fallback to browser speechSynthesis if API key not configured
  - User voice preference saved to localStorage

**Phase 4.1: Manager Report Export** ✅
- **PDF report generation:**
  - Download team performance reports as PDF
  - Includes team summary (staff count, total attempts, average score)
  - Top performers leaderboard (ranked by average score)
  - Needs improvement list (staff below 65 average)
  - Scenario difficulty analysis with performance bars
  - Individual staff performance details
  - Professional formatting with HOTEL Ready branding (crimson/teal)
  - Single-click export from manager dashboard

**Phase 4.2: Session Recording & Playback** ✅
- **Automatic session recording:**
  - Captures full conversation transcript with timestamps
  - Records ElevenLabs premium voice audio (base64 encoded)
  - Stores metadata: score, duration, scenario, timestamp
  - Automatic cleanup to prevent localStorage overflow (max 50 recordings)
- **Session playback for coaching review:**
  - Play/pause controls with progress bar
  - Interactive transcript with play buttons per message
  - Auto-advance through guest messages during playback
  - Shows original score and emotion states
  - Accessible from staff detail view ("🎬 View Recording" button)
- **Storage management:**
  - localStorage-based with size limits (~5MB per recording)
  - Automatic fallback if recording too large (stores transcript only)
  - Automatic pruning of oldest recordings to prevent overflow

**Phase 2: Content and speech**
- **3 Scenario content packs (27 scenarios):**
  - **Front Desk / Reception** — check-in issues, upselling, billing, late checkout
  - **Food & Beverage Service** — allergies, wine pairings, complaints, upselling, ambiance
  - **Housekeeping / Room Service** — room cleaning, maintenance, delays, laundry, noise, comfort
- **Emotion-based voice delivery:**
  - Speech rate and pitch adjusted per guest emotion (angry→slow, satisfied→fast)
  - Emotion indicators (emoji badges) in conversation bubbles
- **Enhanced manager dashboard:**
  - Click staff members to view detailed performance metrics
  - Per-scenario statistics (attempts, best score, average)
  - Delete profile functionality with confirmation

**Phase 3: Advanced features and analytics**
- **36 Total scenarios across 4 department packs:**
  - Added **Concierge** — 9 scenarios (reservations, special occasions, business services, recovery)
- **"Stuck? See options" feature:**
  - AI-powered response suggestions based on conversation context
  - Ranked suggestions (1-5 stars) showing effectiveness
  - Click to insert suggestion into input field
  - Tracks hint usage for coaching purposes
- **CSV bulk staff import:**
  - Upload CSV file with: firstName, lastName, pin, position, department
  - Batch create multiple staff profiles
  - Validation and success/error reporting
  - Accessible from manager dashboard
- **Profile management:**
  - Change staff PIN from manager dashboard
  - Delete profiles with confirmation
  - Edit options in staff detail view
- **Analytics dashboard:**
  - Team performance metrics (total attempts, average score, staff count)
  - Top performers leaderboard with improvement tracking
  - "Needs improvement" list (staff below 65 avg score)
  - Scenario difficulty analysis with performance bars
  - Per-staff metrics: attempts, best score, average, improvement rate
  - Accessible via "Analytics" button on manager dashboard

### 🚀 Full User Flow
1. Login with any name + 4-digit PIN
2. Choose a practice area (Front Desk ready)
3. Pick a scenario
4. Converse with the AI guest (text input for now; voice in Phase 2)
5. Click "End & Score" to see results with dimension ratings and coaching

### 🧪 Demo Mode
For quick testing without typing, use the demo query parameter:
```
http://localhost:5173/?demo
```
This auto-fills the login form with test credentials (Demo/User, PIN 1234, Receptionist). Click "Sign In" to proceed straight to the practice-area selector.

## File Structure

```
hotel-ready/
  server/
    index.ts            # Express: /api/guest-turn, /api/score, /api/answer-options, /api/export-report
    anthropic.ts        # Anthropic SDK wrapper
    prompts.ts          # System prompts for guest & scorer
    pdfreport.ts        # PDF report generation (pdfkit)
  src/
    App.tsx             # Main app router
    engine/             # [Phase 2: scenario runner logic]
    voice/              # [Phase 2: speech-to-text + TTS hooks]
    content/
      types.ts          # Scenario, ScoreResult, GuestTurn, AnswerOptions types
      registry.ts       # Content pack loader (extensible for new departments)
      packs/
        frontdesk.json  # 9 front-desk scenarios
    state/
      profiles.ts       # localStorage profile management
      recordings.ts     # Recording storage with size management
    ui/
      Header.tsx              # Persistent header with branding
      Footer.tsx              # Footer with runtime year
      WhoAreYou.tsx           # Login form
      PracticeAreaSelector.tsx # Pack chooser
      ScenarioList.tsx        # Available scenarios
      RolePlay.tsx            # Main conversation loop + timer + recording
      ScoreCard.tsx           # Results with dimension bars + coaching
      SessionPlayback.tsx     # Session review with transcript + audio playback
      ManagerView.tsx         # PIN-gated team dashboard + recording access
      ImportStaffDialog.tsx   # CSV staff bulk import
      AnalyticsDashboard.tsx  # Team performance analytics
  .env.example          # API key template
  vite.config.ts        # Vite + Tailwind config
```

## Extending Phase 1

### Add a new scenario
Edit `src/content/packs/frontdesk.json` — each scenario is a JSON object with:
- `id`, `title`, `situation` (context)
- `guestPersona`, `guestOpeningLine`, `difficultyNote` (drives AI guest behavior)
- `skills`, `businessOutcome`, `successCriteria` (for scoring)
- `voice.voiceId`, `voice.baseStyle` (for Phase 2 TTS)

### Add a new department pack
1. Create `src/content/packs/newdept.json` with the same scenario shape
2. Import in `src/content/registry.ts` and add to the `packs` array
3. No engine changes needed — proves the extensibility claim

### Customize branding
Edit `src/ui/Header.tsx`:
- Change `HOTEL_NAME` to your hotel's name
- Add your logo by setting `HOTEL_LOGO` to an image path
- Update colours in `src/index.css` (Tailwind theme)

## Development Notes

- **Hot reload:** Vite reloads on save; Express re-runs on `server/` changes
- **Types:** All API contracts are TypeScript-safe (scenario, score, guest reply)
- **Storage:** Profiles live in localStorage (`hotelready.profiles`); no backend needed for MVP
- **Manager PIN:** Defaults to `0000`, changeable only from inside the dashboard
- **API key security:** Never exposed to browser; all Claude calls go through `/api/*` proxy

## Next Steps (Phase 4.3+)

**Phase 4 ✅ Complete**
- [x] Phase 4.1: PDF manager report export with team summary, top performers, needs improvement, scenario analysis
- [x] Phase 4.2: Session recording/playback with audio + transcript for coaching review

**Upcoming Phases**
- [ ] Phase 4.3: Additional scenario packs (Accounting, Technical Support, Spa/Wellness)
- [ ] Phase 5: Certifications & badges for skill mastery
- [ ] Phase 6: Backend database migration (from localStorage)
- [ ] Phase 7: Multi-property support with centralized analytics
- [ ] Mobile app (React Native) for on-the-go practice
- [ ] Custom scenario creation tool for hotels
- [ ] Integration with hotel PMS for automatic staff roster sync
- [ ] LMS integration (SCORM, xAPI) for corporate training programs
- [ ] Multilingual scenario packs

## Troubleshooting

**Port already in use:**
```bash
# Kill the process using port 5173 or 3001
lsof -i :5173
kill -9 <PID>
```

**API key not working:**
- Check it at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Verify the key in `.env` (no extra spaces)
- Check that your account has API credits

---

**Built with:** React + Vite + TypeScript + Tailwind + Express + Anthropic Claude API

**Branding:** HOTEL Ready — A Hotel Consult product. © 2026 All rights reserved.
