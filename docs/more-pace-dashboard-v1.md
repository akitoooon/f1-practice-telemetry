# MORE PACE Dashboard v1

MORE PACE is the display name of this personal practice analysis build. Open **Dashboard** in the main navigation (`/live/dashboard`). The original live tools are available under **Race Control**, including the voice cockpit and Driver view.

Choose a recorded session, then two different timed laps. Lap A minus lap B is positive when A is slower. Lap validity and missing telemetry are labelled in the selectors. Session Summary, Lap Comparison, Corner Delta and Telemetry Comparison reuse the existing session, comparator and corner analysis code. Corner buttons zoom the traces; Reset zoom restores the full lap. Full comparison retains the selected lap IDs.

AI Coach opens the existing chat. Analyze selected laps and corner questions move to the existing comparison page so the coach receives the exact lap IDs and corner range. A configured provider is required to generate advice. No analysis or advice is prefilled. Radio, push-to-talk, providers and settings remain available.

Vehicle & Session Status displays only current player channels received from an active live feed. Recorded analysis remains separate from the current game session. Missing channels, recordings, detailed telemetry and API failures have explicit empty or error states. Refresh sessions reloads the list; recordings still in progress can be reopened after refreshing.

The UI is English. The shell uses black (#000000), panels (#090909) and red (#F04450), with static branding and no ambient glow or gradient heading.

## Compatibility

Only display branding changes. Preserve f1telemetry executable/archive names, database filename, environment variables, module path, storage keys, update repository/checksum contracts, Windows class, installer/product identifiers, autostart Run value and WebView profile location. The display name is separated from the legacy Windows storage/autostart name. No version tag or release is created.

## Manual review

- Open Dashboard with no data and with an unavailable server: all six areas remain visible.
- Select a recording and two timed laps; check sector deltas and full comparison IDs.
- Compare laps with detailed telemetry: hover/drag traces, choose a corner, reset zoom.
- Switch recordings while loading: old traces must disappear immediately.
- Open coach and settings; configured AI requests use the existing backend.
- Switch to Race Control, voice cockpit and Driver view.
- Launch the production Windows build and check MORE PACE in the window/tray; close-to-tray, update controls and existing data paths remain available.
