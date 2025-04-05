package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:         "Bubbles Pop Game",
		Width:         1024,
		Height:        768,
		DisableResize: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: options.NewRGB(255, 255, 255),
		OnStartup:        app.startup,
		OnBeforeClose:    app.beforeClose,
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "109ccde2-2d6b-4c87-a4f9-8b0cd1294767",
			OnSecondInstanceLaunch: app.onSecondInstanceLaunch,
		},
		Bind: []any{
			app,
		},
		Windows: &windows.Options{
			IsZoomControlEnabled: false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
