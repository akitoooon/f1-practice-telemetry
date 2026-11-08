package desktop

// appName is the name the windows, the tray, its tooltip and dialogs show.
const appName = "MORE PACE"

// legacyAppName preserves existing Windows storage and autostart identity.
const legacyAppName = "F1 Telemetry"

// text is what the tray, the windows' titles and dialogs say, in the user's Windows display
// language.
type text struct {
	Open             string
	LiveView         string
	Engineer         string
	EngineerTitle    string // the engineer window's title
	UpdateAvailable  string // %s: the new version
	StartWithWindows string
	DevBuildHint     string
	OpenDataFolder   string
	OpenLogFile      string
	Quit             string
	Live             string // %s: session type and track
	Paused           string
	Waiting          string // %d: the UDP port
	StartFailed      string
}

var englishText = text{
	Open:             "Open MORE PACE",
	LiveView:         "Live view",
	Engineer:         "Race engineer",
	EngineerTitle:    "MORE PACE · Race engineer",
	UpdateAvailable:  "Update available: %s",
	StartWithWindows: "Start with Windows",
	DevBuildHint:     "Not available for a build run with go run",
	OpenDataFolder:   "Open data folder",
	OpenLogFile:      "Open log file",
	Quit:             "Quit",
	Live:             "Live: %s",
	Paused:           "Telemetry paused",
	Waiting:          "Waiting for the game on UDP port %d",
	StartFailed:      "MORE PACE could not start",
}

var spanishText = text{
	Open:             "Abrir MORE PACE",
	LiveView:         "Vista en vivo",
	Engineer:         "Ingeniero de carrera",
	EngineerTitle:    "MORE PACE · Ingeniero de carrera",
	UpdateAvailable:  "Actualización disponible: %s",
	StartWithWindows: "Iniciar con Windows",
	DevBuildHint:     "No disponible al ejecutar con go run",
	OpenDataFolder:   "Abrir carpeta de datos",
	OpenLogFile:      "Abrir archivo de registro",
	Quit:             "Salir",
	Live:             "En vivo: %s",
	Paused:           "Telemetría en pausa",
	Waiting:          "Esperando al juego en el puerto UDP %d",
	StartFailed:      "MORE PACE no pudo iniciar",
}

// textFor keeps the MORE PACE interface in English on every system.
func textFor(_ string) text {
	return englishText
}
