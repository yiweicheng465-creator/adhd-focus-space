# ADHD Focus Space — TODO

## Completed Features
- [x] Full app structure with Dashboard, Focus Timer, Brain Dump, Daily Wins, Tasks, Monthly Calendar, AI Hub, AI Agents tabs
- [x] Focus Timer with animated paper strip tearing mechanic
- [x] Daily Wins system with category icons
- [x] Brain Dump page with AI categorization (→ Task, → Agent buttons)
- [x] Monthly Calendar with hover cards and day detail panel
- [x] AI Hub tab with 5 AI features
- [x] AI Agents page with task chip redesign and AI-powered Create Agent popup
- [x] URLs in task chips are clickable
- [x] FOCUS TIMER badge: smaller pill badge with single clock icon
- [x] Focus sessions removed from Wins list — shown as ⏱ pill badge in Dashboard stats bar
- [x] One-time localStorage migration to clean up old session win entries
- [x] Session numbering fixed (persists across page reloads)
- [x] Removed motivational tip block from Monthly page
- [x] Calendar day detail card redesigned with full wrap-up content
- [x] Backend upgraded to full-stack for AI API calls
- [x] Focus sessions recorded in Monthly Calendar and Daily Wrap-up as dedicated "Focus Tracker" section
  - recordFocusSession() now saves detailed entries (sessionNumber, duration, timestamp) to adhd-focus-session-list
  - Daily Wrap-up shows each session as a row with session number, duration, and time
  - Monthly day detail panel shows focus sessions as a dedicated Focus Tracker section

## Pending (User Suggestions)
- [ ] Name personalisation — one-time name input, greet user as "Good morning, [Name]"
- [ ] Space bar shortcut on Focus page to start/pause timer
- [ ] Agent → Win auto-log when Agent marked as Done
- [ ] AI reflection button inside day detail card for past days
- [ ] Session win category picker (Work, Study, etc.) for focus session wins

## Bugs
- [x] Strip hashtags from display text in Brain Dump entries and Task cards (tags already shown as badges below)
- [x] Simplify Focus Sessions in Monthly day detail to inline "Focus Time: N sessions" next to Mood
- [x] Redesign Dashboard to compact grid layout that fits laptop screen without scrolling
- [x] Add Talk with AI panel directly on the Dashboard page
- [x] Restore illustrated hero header in Dashboard (illustration left + greeting/quick-capture right)
- [x] Redesign dashboard task list cards to look cuter and more polished
- [x] Add quick-complete checkboxes on dashboard Next Up task rows
- [x] Upgrade dashboard AI chat to full command center (create tasks, agents, goals, wins via natural language)
- [x] Add MIT "What should I focus on?" button in task panel with glowing border on top task
- [x] Persist AI chat history (last 10 messages) to localStorage
- [x] Refine dashboard UI: softer chat panel colors, muted action buttons, warmer overall palette
