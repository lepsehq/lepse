#[allow(unused_imports)] // used in cfg blocks
use tauri::window::Effect;
use tauri::{
  window::EffectsBuilder, AppHandle, Emitter, EventTarget, Manager, WebviewUrl,
  WebviewWindowBuilder,
};

#[tauri::command]
pub fn open_popout(app_handle: AppHandle) {
  if let Some(window) = app_handle.get_webview_window("popout") {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
  } else {
    #[allow(unused_mut)] // mut is used inside cfg gated blocks
    let mut builder =
      WebviewWindowBuilder::new(&app_handle, "popout", WebviewUrl::App("popout".into()))
        .decorations(false)
        .always_on_top(true)
        .inner_size(256.0, 256.0) // default app size
        .resizable(false)
        .effects(
          EffectsBuilder::new()
            .effects(vec![
              #[cfg(target_os = "windows")]
              Effect::Acrylic,
              #[cfg(target_os = "macos")]
              Effect::Titlebar,
            ])
            .build(),
        ) // effects for Windows and MacOS respectively
        .title("Lepse popout");

    #[cfg(not(target_os = "linux"))]
    {
      builder = builder.transparent(true);
    }

    if let Ok(window) = builder.build() {
      let w = window.clone();
      let app = app_handle.clone();

      window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
          // Open main window after popout "closes"
          if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
          }

          // prevent close
          let _ = w.hide();
          api.prevent_close();

          // emit
          let _ = w.emit_filter("popout-open", false, |t| match t {
            EventTarget::WebviewWindow { label } => label == "main" || label == "popout",
            _ => false,
          });
        }
      });
    }
  }

  // Close main window when popout opens
  if let Some(window) = app_handle.get_webview_window("main") {
    let _ = window.hide();
  }

  let _ = app_handle.emit_filter("popout-open", true, |t| match t {
    EventTarget::WebviewWindow { label } => label == "main" || label == "popout",
    _ => false,
  });
}
