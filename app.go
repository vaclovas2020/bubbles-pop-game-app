package main

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	gameStarted bool
	gameOver    bool
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.gameStarted = false
	a.gameOver = false

	runtime.EventsOn(a.ctx, "game-started", func(optionalData ...any) {
		a.gameOver = false
		a.gameStarted = true
	})

	runtime.EventsOn(a.ctx, "game-over", func(optionalData ...any) {
		a.gameOver = true
	})
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	if !a.gameStarted || a.gameOver {
		return false
	}

	dialog, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         "Confirm Exit",
		Message:       "Are you sure you want to exit the game? Your progress will be lost.",
		DefaultButton: "Yes",
		CancelButton:  "No",
	})

	if err != nil {
		println("Error:", err.Error())

		return false
	}

	return dialog != "Yes"
}

func (a *App) onSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	_, _ = runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.ErrorDialog,
		Title:         "Application Error",
		Message:       "Only one instance of the application is allowed. Aborting.",
		DefaultButton: "OK",
	})
}
