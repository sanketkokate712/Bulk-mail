# Bulk Email Sender — Spotify-Themed UI

Build the complete frontend UI for the Internal Bulk Email Sender, styled with the Spotify dark design system. This is a **frontend-only** build — all backend logic (OAuth, Gmail API, queue workers) is simulated with mock data so the UI is fully interactive and demonstrable.

## User Review Required

> [!IMPORTANT]
> This plan builds the **frontend UI only**. Backend integration (real OAuth, Gmail API, job queue) would be a separate phase. The UI will use mock/simulated data so every screen is fully functional to demo.

> [!WARNING]
> The Spotify design doc specifies proprietary fonts (SpotifyMixUI/CircularSp). We'll use **"Inter"** from Google Fonts as the closest open-source match — compact, geometric, excellent weight range.

## Open Questions

> [!IMPORTANT]
> **Single-page or multi-page?** The plan below uses a **single HTML file with JS-driven view switching** (no framework, no build step). This keeps it simple and instantly runnable. If you'd prefer a Vite/React app instead, let me know.

---

## Proposed Changes

### PDF Requirements → UI Screens Mapping

| PDF Section | What It Needs | UI Screen |
|---|---|---|
| §2.4 Authentication | OAuth 2.0 Gmail login | **Login / Connect Gmail** |
| §2.1 Recipient Ingestion | Upload .xlsx/.csv, column mapping, preview | **Upload & Map** |
| §2.2 Template Authoring | Subject + body editor, merge tags, preview | **Compose Email** |
| §2.3 Sending Engine | Queue, throttle, batch controls | **Send Campaign** (progress view) |
| §2.5 Reporting | Sent/bounced/failed/pending dashboard | **Campaign Dashboard** |
| §2.5 #21 | CSV export of outcomes | Download button on dashboard |
| §2.3 #16 | Pause/Resume/Cancel | Controls on send progress view |

---

### Component: Design System (CSS)

#### [NEW] [styles.css](file:///c:/Users/sanke/OneDrive/Desktop/Bulk%20mail/styles.css)

Complete Spotify design system implementation:
- **Colors**: `#121212` base, `#181818` surface, `#1f1f1f` interactive, `#1ed760` accent green
- **Typography**: Inter font, 10px–24px scale, weight 400/600/700, uppercase buttons with 1.4px letter-spacing
- **Components**: Pill buttons (9999px radius), circular play controls (50%), dark cards (8px radius), pill inputs (500px radius)
- **Shadows**: Heavy (`rgba(0,0,0,0.5) 0px 8px 24px`) for dialogs, medium (`rgba(0,0,0,0.3) 0px 8px 8px`) for cards
- **Layout**: Sidebar + main content, bottom status bar, responsive grid

---

### Component: Main Application

#### [NEW] [index.html](file:///c:/Users/sanke/OneDrive/Desktop/Bulk%20mail/index.html)

Single-page application with 5 views:

**1. Login Screen**
- Spotify-dark full-screen layout
- App logo/title "Bulk Mailer"
- "Connect with Gmail" pill button (green accent)
- Simulates OAuth flow → redirects to main app

**2. Upload & Map Screen** (§2.1)
- Drag-and-drop file upload zone with icon
- Supports .xlsx, .csv display
- After upload: preview table (first 10 rows) with column headers
- Column-to-merge-field mapping dropdowns
- Email column validation indicator (✓ valid, ✗ invalid, duplicates flagged)
- Row count display with warning if >500 (personal Gmail limit)
- "Continue to Template" pill button

**3. Compose Email Screen** (§2.2)
- Subject line input (pill-style)
- Rich body textarea with merge tag insertion buttons ({{first_name}}, {{department}}, etc.)
- Live preview panel showing rendered email for selected row
- Row selector to preview different recipients
- Unmapped merge tag warnings (yellow/orange)
- Plain-text fallback toggle
- "Preview & Send" pill button

**4. Send Campaign Screen** (§2.3, §2.4)
- Campaign summary card (total recipients, account type, estimated time)
- Provider limit warning if exceeding daily cap
- Animated progress bar with live counter (sent / total)
- Per-recipient status feed (scrolling list: ✓ sent, ✗ failed, ⟳ retrying)
- Throttle indicator showing send rate
- **Pause / Resume / Cancel** circular control buttons
- Simulated sending with realistic delays

**5. Dashboard Screen** (§2.5)
- Campaign stats cards: Total Sent, Bounced, Failed, Pending (with green/red/orange/gray accents)
- Animated donut chart for delivery breakdown
- Recent campaigns list with status pills
- "Export CSV" pill button
- Per-recipient outcome table with search/filter

---

### Component: JavaScript Logic

#### [NEW] [app.js](file:///c:/Users/sanke/OneDrive/Desktop/Bulk%20mail/app.js)

- View router (hash-based navigation)
- Mock data generators (fake recipients, send results)
- File upload handler (CSV parsing with FileReader API)
- Template merge engine ({{tag}} → value substitution)
- Simulated send queue with configurable delay
- Campaign state machine (idle → sending → paused → complete)
- Dashboard stats computation
- CSV export generation

---

## Verification Plan

### Manual Verification
- Open `index.html` in browser — all 5 screens load and navigate correctly
- Upload a sample CSV — preview table renders, columns map
- Type template with merge tags — live preview updates
- Click "Send" — animated progress with simulated delays
- Dashboard shows final stats with donut chart
- Responsive at mobile/tablet/desktop breakpoints
- All interactions feel premium (hover effects, transitions, shadows)
