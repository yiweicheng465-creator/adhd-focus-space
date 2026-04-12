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
- [x] Name personalisation — one-time name input, greet user as "Good morning, [Name]"
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
- [x] Improve MIT card glow to gradient glow effect (not just box-shadow)
- [x] Add "Start 25 min focus on this" button after MIT is highlighted
- [x] Wire mood score from daily check-in into AI greeting (personalised opening message)
- [x] Fix MIT task not getting gradient glow highlight (mitTaskId not matching task id)
- [x] Replace AI auto-greeting with suggestion chips as the default empty state
- [ ] Full visual restyle to soft retro-desktop lo-fi aesthetic (grid paper bg, vintage OS windows, monospace labels, dusty rose/sand palette)

## Retro Lo-Fi Restyle (Completed)
- [x] Global CSS updated: grid-paper background, Space Mono font, warm palette CSS variables
- [x] .retro-window class: cream/parchment fill, pencil-stroke border, subtle shadow
- [x] .retro-titlebar class: warm title bar with _ □ X controls
- [x] Dashboard.tsx: All 3 panels (Focus Timer, Next Up, AI Command Center) now use retro-window + retro-titlebar
- [x] Dashboard.tsx: Color constants aligned with CSS variables (terracotta, parchment, pencil border)
- [x] Sidebar.tsx: Already using retro lo-fi aesthetic (Space Mono, terracotta active state, warm parchment bg)
- [x] FocusTimer.tsx: Already uses warm cream/terracotta palette consistent with retro aesthetic
- [x] MIT to FocusTimer pre-label: adhd-start-mit-focus event listener added to FocusTimer; MIT task name shown as label badge when timer is idle
- [x] / keyboard shortcut: Press / anywhere on dashboard to focus the AI input field

## Current Session
- [x] Remove MIT highlight feature from dashboard (button, glow, "Start 25 min focus" button, mitTaskId state)
- [x] Sort dashboard task list by urgency: urgent > focus > normal > someday
- [x] Color-code task cards by priority (distinct colors per level, clearly visible)

## Hero Restyle + Stickers
- [x] Restyle hero banner: grid paper bg, retro window chrome, warmer palette
- [x] Add decorative SVG stickers to hero (plant, moon, star, leaf, cloud)
- [x] Add subtle sticker accents to dashboard panels

## Modal Retro Styling
- [x] Restyle DailyCheckIn modal with retro window chrome (title bar, grid bg, pencil borders)
- [x] Restyle DailyWrapUp modal with retro window chrome
- [x] Restyle WeeklyResetNudge modal with retro window chrome

## Full-Page Retro Styling
- [ ] Apply retro window chrome to TaskManager page
- [ ] Apply retro window chrome to BrainDump page
- [ ] Apply retro window chrome to Goals page
- [ ] Apply retro window chrome to AgentTracker page
- [ ] Apply retro window chrome to DailyWins page
- [ ] Apply retro window chrome to MonthlyProgress page
- [ ] Apply retro window chrome to FocusTimer full page (if separate)

## Grid/Plaid Background Refactor
- [x] Add grid pattern to global page background (body/html in index.css)
- [x] Remove grid pattern from Dashboard panel interiors
- [x] Remove grid pattern from DailyCheckIn modal interior
- [x] Remove grid pattern from DailyWrapUp modal interior
- [x] Remove grid pattern from WeeklyResetNudge interior
- [x] Remove grid pattern from RetroPageWrapper interior

## Retro UI Polish (Current Session)
- [ ] Restyle all buttons to retro lo-fi flat style (thick dark border, 3D offset shadow, cream fill, Space Mono font)
- [ ] Replace cursor with pixel-art hand pointer SVG via CSS cursor property
- [ ] Simplify sidebar icons to thin-line minimal geometric style (no pixel art, clean outlines)
- [ ] Redesign task list to retro dashed-border card rows with icon boxes and dotted line connectors

## Full Lo-Fi Palette Overhaul
- [ ] Shift global palette to warm caramel/sand (body bg, card bg, borders)
- [ ] Restyle retro window chrome: warmer title bars, rounded corners, terracotta borders
- [ ] Add scattered background sticker SVGs (moon, stars, plants, folder, speech bubble, diamonds)
- [ ] Update task priority colors to warm lo-fi palette (no harsh reds/greens)
- [x] Restyle all buttons to retro lo-fi 3D offset style (thick dark border, offset shadow, Space Mono font)
- [x] Replace cursor with pixel-art hand pointer SVG via CSS cursor property
- [x] Simplify sidebar icons to thin-line minimal geometric SVGs (clean outlines, no pixel art)
- [x] Redesign task list to retro dashed-border card rows with icon boxes and dotted connectors

## Active Bugs
- [x] Fix GAINS % in CYBER_PET.EXE focus timer — removed growth % display entirely
- [x] Add animated growth % counter back to FocusTimer pet (counts up 1→2→...→100 gradually based on sessions)
- [x] Make FocusTimer widget same height as next_up panel; scrollable care log showing latest 2 + history
- [x] Persist care log to localStorage so it survives section navigation
- [x] Fix FocusTimer AND AI chat box to fixed height — neither should grow with content
- [x] Remove Focus Micro-Reflection card from AI tab page
- [x] Lighten and shrink placeholder text in task and goal input fields
- [x] Shorten full-width buttons in AI tab page to auto-width
- [x] Fix growth % counter — not incrementing and color too dark
- [x] Migrate tasks/goals/wins/brain-dump/agents/focus-sessions from localStorage to MySQL database (tRPC procedures + DB tables created)
- [ ] Apply retro lo-fi button style to Daily Check-in "Start my day" button
- [x] Restyle category filter tabs (All/Work/Personal/Video) on main page with retro lo-fi button styling
- [x] Add toggleable animated film grain overlay effect to the whole app (sidebar toggle button, persisted to localStorage)
- [x] Add "Work Mode" toggle — switches entire app from pink/lavender to clean black/white/grey professional palette, persisted to localStorage
- [x] Revert care action buttons, set FocusTimer to compact natural height matching reference screenshot
- [x] Care log idle placeholder: soft faded text when timer not started, replaced by rolling entries when running
- [x] All 3 dashboard columns fixed at 480px height — no growing when content is added; FocusTimer pet screen expands to fill extra space
- [x] Remove all height stretching from FocusTimer — widget sits at natural compact height, no fillHeight, no spacer
- [x] Add API key input to name setup modal (hello.exe) and save per-user; use user's own key for AI calls
- [x] Block AI calls for users with no API key (no fallback to server key)
- [ ] Update hello.exe hint text to "Your OpenAI key — used for AI features."
- [ ] Migrate Brain Dump entries from localStorage to database
- [x] Migrate BrainDump entries from localStorage to database
- [x] Persist AI chat messages to database
