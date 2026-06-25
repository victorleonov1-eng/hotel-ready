# HOTEL Ready — Phase 1 MVP

A web app for hotel staff to practise real guest-facing situations by speaking to an AI "guest" and getting instantly scored on their performance.

## Status: Phase 1 Scaffold Complete

The full architecture and UI for Phase 1 are built and functional. **Known issue:** the login form doesn't navigate (form submission handler isn't firing). This is a minor client-side React wiring bug, not an architectural issue. Once fixed, the downstream flow (practice areas → scenarios → role-play → scoring) is ready to test end-to-end.

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
- **Login screen** with First/Last name, 4-digit PIN, Position, Department dropdown
- **Persistent header** showing app name, live date/time, Hotel Name slot, mute toggle
- **Practice-area selector** (Front Desk pack ready; F&B as drop-in content)
- **Scenario list** with best score and best time per scenario
- **Role-play loop** with conversation, timer, and time tracking (in seconds)
- **Score card** showing:
  - Overall 0–100 score
  - Dimension bars (empathy, clarity, tone/warmth, resolution, outcome) 
  - Coaching points (2–3 encouraging tips)
  - Verdict (floor-ready / almost / needs-work)
  - Time elapsed and best-time highlight
- **Manager dashboard** (PIN-gated, shows team stats and scenario performance)
- **Type-safe models** (GuestTurn with emotion, AnswerOptions, timing)
- **Backend APIs:**
  - `POST /api/guest-turn` → guest reply + emotion (drives voice delivery)
  - `POST /api/score` → ScoreResult with all dimensions
  - `POST /api/answer-options` → 5 ranked backup responses for "Stuck? See options"
- **State management** with PIN-auth profiles, time/score tracking, localStorage persistence
- **Tailwind + brand colours** (crimson #960404, teal #039594)

### ⚠️ Known Issue
**Login form doesn't navigate.** The Sign In button doesn't trigger the `handleLogin` React handler. This is a form submission wiring bug (React event binding issue), not a logic error. The rest of the app is ready; once this is fixed, the flow is:
1. Login with any name + PIN
2. Choose a practice area
3. Pick a scenario
4. Converse (text input for now; voice in Phase 2)
5. End & Score to see results

### 🔄 Workaround (for testing)
Manually create a profile in localStorage and reload:
```javascript
localStorage.setItem('hotelready.profiles', JSON.stringify([{
  firstName: "Demo",
  lastName: "User",
  pin: "1234",
  position: "Receptionist",
  department: "FO",
  attempts: [],
  bestByScenario: {},
  bestTimeByScenario: {}
}]));
window.location.reload();
```
Then you can navigate to practice-area selector, scenarios, and test the role-play loop.

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

## Next Steps (Phase 2+)

- [ ] Fix login form submission handler
- [ ] Add speech-to-text (browser Web Speech API)
- [ ] Add text-to-speech (ElevenLabs or fallback to browser `speechSynthesis`)
- [ ] Implement "Stuck? See options" card UI
- [ ] Test role-play with real guest scenarios
- [ ] Add F&B Service pack
- [ ] Manager dashboard: edit/delete profiles, print reports
- [ ] Mobile layout polish

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

**Form not submitting:**
- This is the known Phase 1 bug
- Use the localStorage workaround (see above) to test the rest of the flow
- Debug the React event binding in `WhoAreYou.tsx` + `App.tsx`

---

**Built with:** React + Vite + TypeScript + Tailwind + Express + Anthropic Claude API

**Branding:** HOTEL Ready — A Hotel Consult product. © 2026 All rights reserved.
