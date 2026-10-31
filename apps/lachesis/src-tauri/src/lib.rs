use std::collections::HashMap;

use tauri::{
  image::Image,
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
  window::{Effect, EffectsBuilder},
  AppHandle, Manager, Result, Runtime, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_store::StoreExt;

mod commands;
mod keyring;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  #[cfg(feature = "cef")]
  let runtime = tauri_runtime_cef::Cef::default();
  #[cfg(not(feature = "cef"))]
  let runtime = tauri_runtime_wry::Wry::default();

  #[cfg(desktop)]
  {
    // IMPORTANT: tauri_plugin_single_instance MUST be the first plugin loaded
    builder = builder.plugin(
      tauri_plugin_single_instance::Builder::new()
        .dbus_id("app.lepse.Lepse")
        .callback(|app, _args, _cwd| {
          let _ = app
            .get_webview_window("main")
            .expect("no main window")
            .set_focus();
        })
        .build(),
    );
  }

  builder = builder
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_store::Builder::new().build());

  builder
    .runtime(runtime)
    .invoke_handler(tauri::generate_handler![
      keyring::commands::get_secret,
      keyring::commands::set_secret,
      keyring::commands::delete_secret,
      commands::other::get_os,
      commands::other::can_transparent,
      commands::popout::open_popout,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // TODO: Handle errors (native dialogs maybe?)
      keyring::init_keyring_store(&HashMap::new())?;

      let native_decorations = app
        .store("settings.json")
        .ok()
        .and_then(|store| store.get("nativeDecorations"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

      // Create main window
      #[allow(unused_mut)] // mut is used inside cfg gated blocks
      let mut builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .decorations(native_decorations) // native decorations only if preferred by user
        .title("Lepse")
        .inner_size(1280.0, 800.0) // default app size
        .min_inner_size(448.0, 640.0) // minimum forced size
        .effects(
          EffectsBuilder::new()
            .effects(vec![Effect::Acrylic, Effect::Titlebar])
            .build(),
        ); // effects for Windows and MacOS respectively

      #[cfg(not(debug_assertions))]
      {
        let debug = std::env::var("DEBUG").map_or(false, |v| v == "1");
        builder = builder.devtools(debug) // Devtools only in debug mode
      }

      #[cfg(not(all(feature = "cef", target_os = "linux")))]
      {
        // NOTE: CEF on Linux loses X focus on window tabbing when started with visible false
        builder = builder.visible(false); // hide by default to wait until content loads?
      }

      #[cfg(not(target_os = "linux"))]
      {
        // NOTE: Transparency not supported (or partially broken)
        // * webkitgtk compositing makes the entire windows become transparent during repaints
        // * cef on linux does not support transparency
        builder = builder.transparent(true);
      }

      if let Ok(window) = builder.build() {
        let w = window.clone();

        window.on_window_event(move |event| {
          if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            // if minimizeToTray is true, prevent close
            if w
              .store("settings.json")
              .ok()
              .and_then(|store| store.get("minimizeToTray"))
              .and_then(|v| v.as_bool())
              .unwrap_or(false)
            {
              let _ = w.hide();
              api.prevent_close();
            } else {
              w.app_handle().exit(0);
            }
          }
        });
      }

      setup_tray(app.app_handle())?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<TrayIcon<R>> {
  #[cfg(target_os = "macos")]
  let icon_bytes = include_bytes!("../icons/tray-icon-template.png");
  #[cfg(not(target_os = "macos"))]
  let icon_bytes = include_bytes!("../icons/tray-icon.png");

  Ok(
    TrayIconBuilder::new()
      .icon(Image::from_bytes(icon_bytes)?)
      .icon_as_template(true)
      .menu(&Menu::with_items(
        app,
        &[
          &MenuItem::with_id(app, "show", "Show", true, None::<&str>)?,
          &PredefinedMenuItem::separator(app)?,
          &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
        ],
      )?)
      .on_menu_event(|app, event| match event.id.as_ref() {
        "show" => {
          if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "quit" => {
          app.exit(0);
        }
        _ => {}
      })
      .on_tray_icon_event(|tray, event| match event {
        TrayIconEvent::Click {
          button: MouseButton::Left,
          button_state: MouseButtonState::Up,
          ..
        } => {
          let app = tray.app_handle();
          if let Some(window) = app.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
              let _ = window.hide();
            } else {
              let _ = window.unminimize();
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        }
        _ => {}
      })
      .build(app)?,
  )
}
