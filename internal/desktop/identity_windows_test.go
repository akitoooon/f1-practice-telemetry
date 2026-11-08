//go:build windows

package desktop

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDisplayRenamePreservesWindowsIdentity(t *testing.T) {
	if appName != "MORE PACE" {
		t.Fatalf("display name = %q", appName)
	}
	if runValueName != "F1 Telemetry" {
		t.Fatalf("existing autostart entry changed: %q", runValueName)
	}
	base, err := os.UserCacheDir()
	if err != nil {
		t.Fatal(err)
	}
	if got, want := localDataDir(), filepath.Join(base, "F1 Telemetry"); got != want {
		t.Fatalf("existing WebView data folder changed: got %q, want %q", got, want)
	}
}
