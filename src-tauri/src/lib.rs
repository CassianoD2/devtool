#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Em builds portáteis (AppImage / .tar.gz), o WebKitGTK empacotado pode não
    // bater com os drivers de GPU do host e a janela abre em branco. Desligar o
    // renderizador DMABUF resolve, com custo de desempenho desprezível para este
    // app. Respeita o valor se o usuário já tiver definido a variável.
    #[cfg(target_os = "linux")]
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
