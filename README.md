# 🏎️ F1 Telemetry

> Real-time telemetry, pit wall dashboard and AI race engineer for **EA Sports F1 25 & F1 26**.

[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![F1 Telemetry Dashboard Demo](docs/assets/demo.gif)

---

## ✨ Features

### ⏱️ Live pit wall
* **Three live views:** Race Control for a second monitor, a lightweight Voice Cockpit for sim rigs and VR, and a high-contrast Driver view for a phone by the wheel.
* **Timing tower:** full-grid intervals, tyres, pit status and 2026 Active Aero / Boost. Click any car for its stints and every lap with sectors.
* **Battle panel & track strip:** gaps to the cars around you with their per-lap trend, and every car's place round the lap.
* **Weather radar:** rain forecast up to +30 min, track temperature trend and tyre crossover advice.
* **Race control feed:** overtakes, penalties, Safety Cars, sector splits and speed traps.

### 🔍 Lap comparator
* **Two laps side by side:** speed, throttle, brake, gear, ERS and 2026 aero / boost traces, with a synced track map.
* **Where did I lose time:** entry speed, apex speed, braking point, throttle pickup and time lost at every corner; **Ask AI** about any of them.
* **One-click comparisons:** your best against the session's fastest, the leader, your teammate, any driver, or your last visit to the track.

### 📊 Sessions & progress
* **Session story:** race summary, clean-lap pace against the field, key moments and an AI debrief, plus pace, position, gap, tyre and sector charts.
* **Tyre degradation on clean laps:** per-stint slopes that leave out pit, SC / VSC and outlier laps.
* **Track progress:** personal best, theoretical best and consistency at each circuit over time.
* **Organize:** filter, group and tag sessions by league or setup; export and import them as ZIP.

### 🎙️ AI race engineer
* **Push-to-talk from your wheel or keyboard:** DirectInput (Fanatec, Logitech, Moza, Simagic) and global shortcuts, even in full screen.
* **Calls timed for the straights:** tyres, damage, fuel, ERS, gaps, weather, penalties, Safety Cars and blue flags, kept out of braking zones.
* **Box calls that know the pit entry:** follows the game's pit plan, says "box this lap" only while you can still make it, and calls the undercut and overcut.
* **Traffic in qualifying and the race:** push-lap cars behind, slow or stopped cars ahead and cars at the pit exit, said by when they'll reach you.
* **Ask anything:** the engineer knows the live gaps, tyres, pit windows and weather, and looks up lap history when it needs it.
* **Personas and voices:** Bono 🇬🇧, Franco Colapinto 🇦🇷 or your own, in English or Latin American Spanish, with radio effects. The AI can reword routine calls so they don't repeat.
* **Your choice of AI:** Google Gemini, OpenAI, Anthropic Claude, or a local / OpenAI-compatible server (Ollama, LM Studio and Groq presets).

Every radio call has its own switch in **Settings → Radio calls**.

---

## 🚀 Quick Start

Download the build for your system from the **[latest release](https://github.com/mgauna-ar/f1game-telemetry-go/releases/latest)**. You don't need Go or Node.js.

| System | File |
|---|---|
| Windows (x64) | `f1telemetry_<version>_windows_amd64_setup.exe` (installer) or `f1telemetry_<version>_windows_amd64.zip` (portable) |
| macOS (Apple Silicon) | `f1telemetry_<version>_darwin_arm64.zip` |
| Linux (x64) | `f1telemetry_<version>_linux_amd64.tar.gz` |

Other platforms: build from source (below). Windows on ARM runs the x64 build.

1. **Install or extract it.** The Windows installer needs no administrator rights and adds F1 Telemetry to the Start menu; with the zip, run `f1telemetry.exe`. On macOS / Linux, run `./f1telemetry`. The database, the log and `.env` live next to the app.
2. **[Set up the game](#-game-setup)** to send telemetry to it.
3. **Open the dashboard.** Phones and tablets on your network can open it too: the Live tab shows its address.

> [!NOTE]
> The builds aren't code-signed, so Windows SmartScreen may warn about an unknown publisher. Click **More info → Run anyway**, or check the file against the release's `checksums.txt`.

**On Windows** the dashboard opens in its own window. Closing it keeps the app, and the engineer, running in the notification area: right-click the icon for the live status, the **Race engineer** window, **Start with Windows**, the data folder, the log and **Quit**. The race engineer window is the voice cockpit on its own; on the PC running the app only it speaks and listens to push-to-talk, so nothing talks twice. The window needs Microsoft's WebView2 Runtime, which Windows 11 and an up-to-date Windows 10 have; the installer adds it otherwise.

**On macOS / Linux** a small app window shows whether the game is sending telemetry, the dashboard's addresses and an **Open dashboard** button. Closing it keeps the app running in its terminal; stop it with Ctrl+C or **Quit**.

### 🔄 Updating

When a new release is out, the top bar says so. **Update now** (in **Settings → App**, the Windows tray menu or the macOS / Linux app window) downloads it, checks it against `checksums.txt` and restarts the app; your sessions and settings stay. It's only offered on the PC running the app, and needs to write to the app's folder.

---

## 🎮 Game Setup

In **F1 25** or **F1 26**, open **Game Options → Settings → Telemetry Settings**:

| Setting | Value |
|---|---|
| UDP Telemetry | `On` |
| UDP Format | `2025` (`2026` for the Season Pack) |
| UDP IP Address | `127.0.0.1` on the same PC; on a console, the PC's address from the Live tab |
| UDP Port | `20777` |
| UDP Send Rate | `20Hz` (laps are saved at up to 20 Hz) |

---

## ⚙️ Configuration (Optional)

Set these as command-line flags, environment variables or in a `.env` file next to the app (see `.env.example`). Flags win over environment variables, which win over `.env`. The AI variables are defaults: settings saved in the app win over them.

| Flag | Variable | Description | Default |
|---|---|---|---|
| `-udp` | `F1T_UDP_ADDR` | UDP telemetry listener | `0.0.0.0:20777` |
| `-http` | `F1T_HTTP_ADDR` | Dashboard and API address | `:8080` |
| `-db` | `F1T_DB_PATH` | SQLite database file | `f1telemetry.db` |
| `-open-browser` | `F1T_OPEN_BROWSER` | macOS / Linux: open the dashboard in the browser on startup | `false` |
| `-no-tray` | `F1T_NO_TRAY` | Windows: run with no window or tray icon (stop it from Task Manager) | `false` |
| `-version` | — | Print the version and exit | |
| | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | AI provider keys | *(set in the app)* |
| | `LLM_PROVIDER` | `gemini`, `openai`, `claude` or `custom` | first provider with a key |
| | `LLM_MODEL` | Model for `LLM_PROVIDER` | the provider's default |

Settings changed in the dashboard (radio calls, AI provider and keys, voice, push-to-talk) are saved in the database and shared by every device that opens it. Volume, language, units and layouts stay per browser. Saved API keys are never sent back to a browser, and only the dashboard the app serves can change settings.

---

## 🛠️ Building from Source

Needs [Go 1.26+](https://go.dev/dl/) and [Node.js 22+](https://nodejs.org/).

```bash
cd frontend && npm install && cd ..
make build-embedded   # single binary with the dashboard built in: ./bin/f1telemetry
```

On Windows, `.\run.bat` builds and starts it. No game at hand? `make simulate` (or `.\simulate.bat`) sends a simulated race. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for hot-reload development, the simulator's scenarios and the PR workflow, and **[GitHub Releases](https://github.com/mgauna-ar/f1game-telemetry-go/releases)** for the changelog.

---

## ⚠️ Disclaimer

This is an unofficial, open-source community tool. It is **not** affiliated with, endorsed by, or associated with Electronic Arts Inc., Codemasters, or Formula One World Championship Limited.

*F1*, *FORMULA ONE*, *FORMULA 1*, *FIA FORMULA ONE WORLD CHAMPIONSHIP*, and related logos and marks are trademarks of Formula One Licensing B.V. All game titles, screenshots, and car data are property of their respective owners.

---

## 📄 License

MIT — see [LICENSE](LICENSE). The dashboard bundles the [Inter](https://github.com/rsms/inter), [Outfit](https://github.com/Outfitio/Outfit-Fonts) and [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) fonts under the [SIL Open Font License 1.1](https://openfontlicense.org).
