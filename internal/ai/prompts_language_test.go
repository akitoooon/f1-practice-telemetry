package ai

import (
	"strings"
	"testing"
)

func TestTextResponseLanguageAcrossModes(t *testing.T) {
	for _, mode := range []string{ContextModeComparator, ContextModeSessionDebrief, ContextModeLive, ContextModeGeneral} {
		t.Run(mode, func(t *testing.T) {
			for _, language := range []string{"ja", "en", "es"} {
				prompt := BuildSystemPrompt(&TelemetryAnalysisContext{ContextMode: mode}, "bono", language)
				if !strings.Contains(prompt, "RESPONSE LANGUAGE (takes precedence") {
					t.Fatal("missing response language directive")
				}
				if language == "ja" && (!strings.Contains(prompt, "取得していない数値を作らない") || !strings.Contains(prompt, "推測")) {
					t.Fatal("missing Japanese evidence rules")
				}
			}
		})
	}
}
