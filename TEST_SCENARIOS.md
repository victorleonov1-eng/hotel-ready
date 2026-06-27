# Hotel Ready Test Scenarios

Comprehensive test checklist for Hotel Ready training platform. Each scenario tests a core user flow.

## 1. Staff Login Flow ✅

**Objective:** Verify staff authentication and profile initialization

### Manual Checklist
- [ ] Navigate to app home page
- [ ] Enter valid staff details:
  - First Name: "John"
  - Last Name: "Smith"
  - 4-Digit PIN: "1234"
  - Position: Select from dropdown
  - Department: Select from dropdown
- [ ] Click "Login" button
- [ ] Verify successful redirect to dashboard
- [ ] Confirm staff name displays in header
- [ ] Verify department is correctly set
- [ ] Check localStorage persists profile data

### Automation Script
```bash
# Start dev server
npm run dev

# Login as Front Desk staff (after app loads)
# 1. Fill first name: "John"
# 2. Fill last name: "Smith"  
# 3. Fill PIN: "1234"
# 4. Select position: "Front Desk Associate"
# 5. Select department: "Front Desk"
# 6. Click login
```

---

## 2. Form Interactions ✅

**Objective:** Test all form inputs and validations

### Manual Checklist
- [ ] **Login Form:**
  - [ ] First name field accepts text input
  - [ ] Last name field accepts text input
  - [ ] PIN field accepts 4 digits only
  - [ ] Position dropdown opens and allows selection
  - [ ] Department dropdown opens and allows selection
  - [ ] Login button enables when all fields filled
  - [ ] Form shows error if PIN incomplete

- [ ] **Profile Editing (Manager Dashboard):**
  - [ ] Click staff member to view details
  - [ ] Edit button appears for changing PIN
  - [ ] New PIN can be entered (4 digits)
  - [ ] Save/Cancel buttons work
  - [ ] Changes persist after refresh

- [ ] **Voice Selection (Role-play Screen):**
  - [ ] Voice selector dropdown loads available voices
  - [ ] Can select different voices (Bella, Elli, Chris)
  - [ ] Selection persists in localStorage

### Automation Script
```bash
# Test form validation
npm run dev

# After login:
# 1. Navigate to a scenario
# 2. Test voice dropdown - click and select
# 3. Change voice - verify it loads
# 4. Go back and re-enter - verify voice selection saved

# Manager flow:
# 1. Login with manager PIN (e.g., "9999")
# 2. Click a staff member
# 3. Click "Edit PIN" 
# 4. Change PIN to new value
# 5. Click save
# 6. Verify profile updated
```

---

## 3. Click Scenarios ✅

**Objective:** Test navigation and scenario selection

### Manual Checklist
- [ ] **Scenario List Navigation:**
  - [ ] Department selector loads all 4 packs
  - [ ] Clicking department filters scenarios correctly
  - [ ] Scenario cards load with title and description
  - [ ] Best score badge displays (or "Not attempted")
  - [ ] Best time badge displays correctly
  - [ ] Clicking scenario card initiates role-play

- [ ] **Role-play Screen:**
  - [ ] Back button returns to scenario list
  - [ ] Start button initiates conversation
  - [ ] Timer starts and counts up
  - [ ] Stop button ends scenario early
  - [ ] Mute button toggles audio

- [ ] **Dashboard Navigation:**
  - [ ] Click staff name to view details
  - [ ] Click scenario to see performance history
  - [ ] Navigation breadcrumbs work correctly

### Automation Script
```bash
# Scenario navigation test
npm run dev

# After login:
# 1. Click "Front Desk" department
# 2. Wait for scenarios to load
# 3. Click first scenario card
# 4. Verify role-play screen loads
# 5. Click "Back" to return
# 6. Click different department
# 7. Verify scenarios update

# Manager dashboard:
# 1. Login as manager
# 2. Click first staff member
# 3. Click scenario performance row
# 4. Verify modal/page shows details
```

---

## 4. Navigate Pages ✅

**Objective:** Test page routing and state persistence

### Manual Checklist
- [ ] **Route Flow:**
  - [ ] Home → Login (no auth) → Dashboard (after login)
  - [ ] Dashboard → Scenarios → Role-play → Score
  - [ ] Score → Scenario List (return button)
  - [ ] Manager Dashboard accessible via PIN
  - [ ] Back button navigates correctly

- [ ] **State Persistence:**
  - [ ] Staff profile persists across page refreshes
  - [ ] Scenario selection remembered
  - [ ] Voice preference remembered
  - [ ] Dashboard data loads without flickering
  - [ ] Browser back button works as expected

- [ ] **Mobile Navigation:**
  - [ ] Header layout responsive on mobile
  - [ ] Buttons clickable on small screens
  - [ ] Dropdowns work on touch devices
  - [ ] Scenario list scrollable on mobile

### Automation Script
```bash
# Full navigation flow test
npm run dev

# 1. Login as staff
# 2. Press F5 (refresh) - verify still logged in
# 3. Click scenario → Navigate to role-play
# 4. Press browser back button → Should go to scenarios
# 5. Click manager dashboard link
# 6. Press browser back → Should go to staff dashboard
# 7. Close browser tab, reopen, refresh → Still logged in?
```

---

## 5. Complete Training ✅

**Objective:** Test full role-play scenario flow and scoring

### Manual Checklist
- [ ] **Role-play Initiation:**
  - [ ] Scenario loads with guest message
  - [ ] Audio plays (or text displays if TTS unavailable)
  - [ ] Timer starts at 0:00
  - [ ] Input field ready for staff response

- [ ] **Training Execution:**
  - [ ] Staff can type response
  - [ ] Response submits via Enter or Send button
  - [ ] Guest responds with feedback/next message
  - [ ] Multiple exchanges occur (min 3 turns)
  - [ ] Timer increments correctly
  - [ ] Can click "Get Options" for AI suggestions
  - [ ] Suggested options display ranked by score
  - [ ] Can select suggestion or continue typing

- [ ] **Scenario Completion:**
  - [ ] Click "End Role-play" button
  - [ ] Score screen appears within 2-3 seconds
  - [ ] Overall score displays (0-100)
  - [ ] 5 dimension bars show (Tone, Empathy, etc.)
  - [ ] Coaching points are readable
  - [ ] Verdict text appears (e.g., "Excellent!")
  - [ ] Timer shows total session duration
  - [ ] Session recording saved (if audio enabled)

- [ ] **Post-Training:**
  - [ ] "View Recording" button appears if recorded
  - [ ] Can replay recording with transcript
  - [ ] Can return to scenario list
  - [ ] Best score updated in dashboard
  - [ ] Best time updated in dashboard

### Automation Script
```bash
# Complete training flow test
npm run dev

# After login, select scenario:
# 1. Click "Start Role-play"
# 2. Wait for guest message (2-3 sec)
# 3. Type response: "Hello, how can I help you today?"
# 4. Submit (press Enter or click send)
# 5. Wait for guest response
# 6. Type: "I'd be happy to assist with that"
# 7. Click "Get Options" - verify suggestions load
# 8. Click top suggestion or type another response
# 9. Continue 2-3 more exchanges
# 10. Click "End Role-play"
# 11. Verify score screen loads
# 12. Verify score displays 0-100
# 13. Check dimension bars render
# 14. Click "View Recording" if available
# 15. Verify playback controls work
```

---

## 6. Check Dashboard ✅

**Objective:** Test manager/admin dashboard features

### Manual Checklist
- [ ] **Manager Dashboard Access:**
  - [ ] Login requires manager PIN (e.g., 9999)
  - [ ] Links to "Manager Dashboard" appear after login
  - [ ] Can view team roster with all staff
  - [ ] Staff list shows: Name, Position, Department, Avg Score

- [ ] **Team Analytics:**
  - [ ] Total team stats display (staff count, attempts, avg score)
  - [ ] Top performers leaderboard shows correctly
  - [ ] "Needs Improvement" section lists staff < 65 avg score
  - [ ] Department filter works (if implemented)
  - [ ] Charts/graphs render without errors

- [ ] **Staff Details:**
  - [ ] Click staff member to expand details
  - [ ] Scenario performance table shows all attempts
  - [ ] Columns: Scenario, Best Score, Attempts, Last Attempt
  - [ ] Can edit PIN from staff details
  - [ ] Can view session recording from details

- [ ] **Report Export:**
  - [ ] "Export PDF" button visible
  - [ ] Click generates PDF download
  - [ ] PDF includes team summary, leaderboard, analysis
  - [ ] PDF opens in new tab/downloads
  - [ ] Formatting is professional (colors, fonts)

- [ ] **Emergency PIN Reset:**
  - [ ] "Reset All PINs" button visible (admin only?)
  - [ ] Modal warns of destructive action
  - [ ] Can confirm or cancel reset
  - [ ] After reset, staff PINs reset to default
  - [ ] Staff can log in with new PIN

### Automation Script
```bash
# Manager dashboard test
npm run dev

# 1. Login as manager (PIN: 9999, Position: Manager)
# 2. Click "Manager Dashboard" link
# 3. Verify team stats load (staff count, avg score)
# 4. Verify leaderboard displays
# 5. Verify "Needs Improvement" list
# 6. Click first staff member to expand
# 7. Verify scenario performance table loads
# 8. Click "Edit PIN" button
# 9. Change PIN to "5555"
# 10. Click Save - verify success message
# 11. Click "Export PDF" button
# 12. Wait for PDF download
# 13. Verify file downloads (check Downloads folder)
# 14. Click "View Recording" for staff with recordings
# 15. Verify playback controls work
# 16. Click back/breadcrumb to return to dashboard
# 17. Verify admin tools section (if visible)
```

---

## Test Data

### Default Test Users
```json
{
  "staff": {
    "name": "John Smith",
    "firstName": "John",
    "lastName": "Smith",
    "pin": "1234",
    "position": "Front Desk Associate",
    "department": "Front Desk"
  },
  "manager": {
    "name": "Alice Manager",
    "firstName": "Alice",
    "lastName": "Manager",
    "pin": "9999",
    "position": "Manager",
    "department": "Management"
  }
}
```

### Departments
- Front Desk (9 scenarios)
- Housekeeping (9 scenarios)
- Food & Beverage (9 scenarios)
- Concierge (9 scenarios)

---

## Automated Test Script (CLI)

```bash
#!/bin/bash
# run_tests.sh - Automated test suite for Hotel Ready

echo "Starting Hotel Ready test suite..."
npm run dev &
DEV_PID=$!

sleep 5  # Wait for app to start

echo "✅ Server started (PID: $DEV_PID)"
echo "🧪 Running Playwright tests..."

# (Optional) Run Playwright/Cypress tests here
# npx playwright test
# npx cypress run

echo "📊 Test complete"
kill $DEV_PID
```

---

## Quick Test Commands

```bash
# Start the app
npm run dev

# Run backend tests only
npm run test

# Build for production
npm run build

# Type check
npm run typecheck

# Lint code
npm run lint
```

---

## Known Issues / Edge Cases

- [ ] Audio sometimes plays twice on first load
- [ ] Mobile voice input may have latency
- [ ] PDF export slow on large datasets (100+ staff)
- [ ] Session recordings expire after 50 total (localStorage limit)
- [ ] Network lag may cause timeout on API calls > 10s

---

## Performance Targets

- Home → Login: < 2s
- Dashboard load: < 1s  
- Scenario start: < 3s (includes TTS load)
- Score calc & display: < 2s
- PDF export: < 5s
- Mobile responsiveness: < 100ms interaction lag
