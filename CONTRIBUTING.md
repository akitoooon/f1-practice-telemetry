# Contributing to f1game-telemetry-go

Thank you for your interest in contributing! 🏎️

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/f1game-telemetry-go.git
   cd f1game-telemetry-go
   ```
3. Create a new **branch** for your feature or fix

## Prerequisites

- [Go 1.26+](https://go.dev/dl/)
- [Node.js 22+](https://nodejs.org/)
- Make (for build tasks)

## Development

### Builds

```bash
cd frontend && npm install && cd ..
make build-embedded   # single binary with the dashboard built in: ./bin/f1telemetry
make run-embedded     # build and run it
```

On Windows, `.\run.bat` installs the frontend's dependencies if needed, builds and starts the app.

### Hot reload

```bash
make dev                            # terminal 1: backend (go run ./cmd/server)
cd frontend && npm run dev          # terminal 2: frontend
```

Then open [http://localhost:5173](http://localhost:5173).

### Wire types (Go → TypeScript)

The frontend's types for server JSON (`frontend/src/types/generated/`) are generated from the Go structs by `cmd/tsgen`. After changing a Go wire type, run `make gen-types`. CI runs `go run ./cmd/tsgen -check` and fails when they're out of date.

### Simulator

The built-in simulator sends synthetic telemetry, so you don't need the game:

```bash
make simulate                # a race (F1 2026: 22 cars + 2 observers)
make simulate SESSION=quali  # qualifying
make simulate FORMAT=2025    # F1 2025 format (20 cars + 2 observers)
.\simulate.bat               # Windows (or: go run ./cmd/simulator -session race)
```

It sends to `127.0.0.1` on the server's `F1T_UDP_ADDR` port; `-target` (or `F1T_SIM_TARGET`) sends somewhere else, e.g. `-target 192.168.1.20:20777`.

Scenarios trigger the race engineer's calls without waiting for them:

```bash
go run ./cmd/simulator -scenario wear        # tyres start at 38.5% → tyre wear calls
go run ./cmd/simulator -scenario sc          # Safety Car
go run ./cmd/simulator -scenario vsc         # Virtual Safety Car
go run ./cmd/simulator -scenario rain        # approximate forecast, then rain that gets heavy, eases and stops while the track cools
go run ./cmd/simulator -scenario start       # formation lap, grid and launch reaction
go run ./cmd/simulator -scenario pit         # AI stops (pit entry learned), a puncture → "box next lap", then the player's stop with a drive-through served
go run ./cmd/simulator -scenario strategy    # 12 laps on the game's pit plan: box calls, a VSC near the second stop, undercut/overcut, a rival's penalty, last lap
go run ./cmd/simulator -scenario qualy       # Q1 runs: push-lap car behind, traffic / clean air, slow car, yellow, deleted lap, drop zone, session clock
go run ./cmd/simulator -scenario traffic     # Q1 in real time: car at the pit exit, two push-lap cars on the out-lap, slow car on the push lap
go run ./cmd/simulator -scenario racetraffic # race in real time: car right behind, two lapping cars under blue flags, stopped and slow cars ahead, a spin, a pit stop
```

### Builds without a release

Every CI run of a pull request or of `main` builds all three binaries. To build one for any branch: **Actions** → **CI/CD Pipeline** → **Run workflow** (tick **installer** for the Windows installer). Download it from the run's **Artifacts** (kept 14 days). These builds report a `dev-<commit>` version and don't offer updates. On macOS / Linux, `chmod +x f1telemetry_*` first.

### Race engineer logs

Each radio call the engineer window (or the Live page in a browser) handles logs a `Radio call heard` line: whether it was said, cut off, went stale or had no voice, how long it waited, its voice synthesis time (`synth_ms`, or `cached`), how long until the first word (`start_ms`) and whether the page was in front (`visible`).

- `Push-lap traffic` / `Push-lap car passed`: when a qualifying traffic call was made, the number it said, and when the car went by.
- `Blue flag shown` / `Lapping car passed`: how far back the lapping car was when the game showed the flag, and when it went by.
- `Race traffic` / `Race traffic passed`: the same for a slow or stopped car ahead, or a car coming on you, in a race.
- `Push-to-talk button` / `Push-to-talk transmission`: each press (wheel, keyboard or in-game) and what came of it.

## Branch Naming

Use descriptive branch names with a prefix:

- `feat/` — New features (e.g., `feat/lap-comparison`)
- `fix/` — Bug fixes (e.g., `fix/packet-parsing`)
- `docs/` — Documentation changes (e.g., `docs/api-endpoints`)
- `refactor/` — Code refactoring (e.g., `refactor/udp-listener`)
- `test/` — Test additions or changes (e.g., `test/storage-layer`)

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(udp): add support for 2026 packet format
fix(storage): handle nil session on insert
docs(readme): update configuration section
```

## Pull Request Guidelines

1. Keep PRs focused — one feature or fix per PR
2. Write or update tests for your changes
3. Run `make test` and `make lint` before submitting
4. Update documentation if your change affects the public API
5. Fill out the PR template with a clear description

## Code Style

- Follow standard Go conventions (`gofmt`, `go vet`)
- Run `make fmt` before committing
- Keep functions small and focused
- Add comments for exported types and functions
- Use meaningful variable and function names

## Windows Build

- On Windows the app is a [Wails v3](https://github.com/wailsapp/wails) window over the app's own server (`internal/desktop/shell_windows.go`): no Wails bindings, the dashboard talks to the server as in a browser. It cross-compiles from macOS or Linux with `CGO_ENABLED=0`.
- Release builds use `-tags production` (Wails' release mode, without developer tools) and `-ldflags -H=windowsgui` (no console); `make build-all` does both. `go run ./cmd/server` on Windows keeps the developer tools.

## Releases

- Pushing a SemVer git tag (`vX.Y.Z`, or `vX.Y.Z-beta.N` for a pre-release) publishes a release from GitHub Actions (`.github/workflows/release.yml`): Linux builds the three archives, windows-2022 builds the Windows installer around the zip's exe (`build/windows/installer.nsi`, with NSIS), and the release gets them all with `checksums.txt`. Releases are under [GitHub Releases](https://github.com/mgauna-ar/f1game-telemetry-go/releases).
- Notes written for a version in `docs/releases/vX.Y.Z.md` (its betas use them too) come first in its release, before the generated list of changes. The app shows them in its release notes.
- Keep the archive names (`f1telemetry_<tag>_<os>_<arch>.zip` or `.tar.gz`) and `checksums.txt`: **Update now** in earlier versions looks for them.
- To try the installer without a release, run **CI/CD Pipeline** by hand with **installer** ticked. To build it on Windows yourself, with [NSIS](https://nsis.sourceforge.io/) installed: build the exe (`make build-all`), copy `internal/commands/webview2/MicrosoftEdgeWebview2Setup.exe` from the Wails module (`go list -m -f '{{.Dir}}' github.com/wailsapp/wails/v3`) to `build/windows/`, and run `makensis /DEXE=<full path of the exe> /DOUTFILE=<full path of the setup> build\windows\installer.nsi`.

## Questions?

Feel free to open an issue if you have questions or need help getting started.

