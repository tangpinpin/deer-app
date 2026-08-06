mod commands;
mod deer_state;

use deer_state::{AppState, DeerState};
use std::time::Duration;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::new();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 加载持久化状态
            let data_dir = app.path().app_data_dir().expect("获取数据目录失败");
            std::fs::create_dir_all(&data_dir).ok();
            let state_file = data_dir.join("deer_state.json");

            if let Ok(data) = std::fs::read_to_string(&state_file) {
                if let Ok(saved) = serde_json::from_str::<DeerState>(&data) {
                    if let Some(state) = app.try_state::<AppState>() {
                        if let Ok(mut deer) = state.deer.lock() {
                            *deer = saved;
                            deer.refresh();
                            log::info!("已加载保存的小鹿状态");
                        }
                    }
                }
            }

            // 后台定时任务 — 用 try_lock 避免阻塞主线程命令
            let handle = app.handle().clone();
            let state_file_clone = state_file.clone();
            std::thread::spawn(move || {
                loop {
                    std::thread::sleep(Duration::from_secs(30));

                    // try_lock 不会阻塞：拿不到锁就跳过本轮
                    if let Some(state) = handle.try_state::<AppState>() {
                        if let Ok(mut deer) = state.deer.try_lock() {
                            deer.refresh();
                            let should_remind = deer.should_remind();
                            // 先 clone 需要的数据，尽快释放锁
                            let snapshot = deer.clone();
                            drop(deer);

                            if should_remind {
                                commands::try_send_reminder(&handle, &snapshot);
                            }

                            if let Ok(json) = serde_json::to_string_pretty(&snapshot) {
                                std::fs::write(&state_file_clone, &json).ok();
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_deer_state,
            commands::pet_deer,
            commands::end_pet_deer,
            commands::check_reminder,
            commands::ack_reminder,
            commands::save_state,
            commands::set_reminder_interval,
            commands::set_do_not_disturb,
            commands::skip_day,
        ])
        .run(tauri::generate_context!())
        .expect("启动「鹿了吗」失败");
}
