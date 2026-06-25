# HOTEL Ready — Phase 1 MVP

A web app for hotel staff to practise real guest-facing situations by speaking to an AI "guest" and getting instantly scored on their performance.

## Status: Phase 3 Complete

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

### Setup

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set your API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   # Keep MODEL_NAME as claude-haiku-4-5-20251001 (or update to another available model)
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
- **Backend APIs:** `/api/guest-turn`, `/api/score`, `/api/answer-options`
- **State management** with PIN-auth profiles, time/score tracking, localStorage persistence
- **Tailwind + brand colours** (crimson #960404, teal #039594)

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
    index.ts            # Express: /api/guest-turn, /api/score, /api/answer-options
    anthropic.ts        # Anthropic SDK wrapper
    prompts.ts          # System prompts for guest & scorer
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
    ui/
      Header.tsx        # Persistent header with branding
      Footer.tsx        # Footer with runtime year
      WhoAreYou.tsx     # Login form (has form wiring bug)
      PracticeAreaSelector.tsx  # Pack chooser
      ScenarioList.tsx  # Available scenarios
      RolePlay.tsx      # Main conversation loop + timer
      ScoreCard.tsx     # Results with dimension bars + coaching
      ManagerView.tsx   # PIN-gated team dashboard
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

## Next Steps (Phase 4+)

- [ ] Additional scenario packs: Front Office, Accounting, Technical Support, Spa/Wellness
- [ ] Export/print manager reports (PDF generation with team stats and recommendations)
- [ ] Custom voice selection: ElevenLabs or similar for premium TTS
- [ ] Session recording/playback for coaching review and trainer use
- [ ] Mobile app (React Native) for on-the-go practice
- [ ] Backend database migration (currently localStorage only)
- [ ] Multi-property support (different hotel locations, centralized analytics)
- [ ] Custom scenario creation tool for hotels to add proprietary scenarios
- [ ] Certifications and badges for skill mastery
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
