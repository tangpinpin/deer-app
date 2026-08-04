use crate::deer_state::{AppState, DeerState};
use serde_json::json;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::State;
use tauri::Emitter;
use tauri::Manager;

static REMINDER_SENT: AtomicBool = AtomicBool::new(false);

/// 获取当前小鹿状态
#[tauri::command]
pub fn get_deer_state(state: State<AppState>) -> Result<DeerState, String> {
    let mut deer = state.deer.lock().map_err(|e| e.to_string())?;
    deer.refresh();
    Ok(deer.clone())
}

/// 抚摸小鹿
#[tauri::command]
pub fn pet_deer(state: State<AppState>) -> Result<serde_json::Value, String> {
    let mut deer = state.deer.lock().map_err(|e| e.to_string())?;
    let result = deer.pet();
    REMINDER_SENT.store(false, Ordering::SeqCst);
    Ok(json!({
        "result": result,
        "state": deer.clone()
    }))
}

/// 结束抚摸
#[tauri::command]
pub fn end_pet_deer(state: State<AppState>) -> Result<DeerState, String> {
    let mut deer = state.deer.lock().map_err(|e| e.to_string())?;
    deer.end_pet();
    Ok(deer.clone())
}

/// 检查是否需要提醒
#[tauri::command]
pub fn check_reminder(state: State<AppState>) -> Result<serde_json::Value, String> {
    let deer = state.deer.lock().map_err(|e| e.to_string())?;
    let should = deer.should_remind();
    Ok(json!({
        "should_remind": should,
        "seconds_since_last_pet": deer.seconds_since_last_pet(),
        "current_mood": deer.current_mood,
        "mood_label": deer.current_mood.label(),
        "mood_emoji": deer.current_mood.emoji(),
    }))
}

/// 重置提醒标记 + 记录提醒时间 (用于光速响应成就)
#[tauri::command]
pub fn ack_reminder(state: State<AppState>) {
    REMINDER_SENT.store(false, Ordering::SeqCst);
    if let Ok(mut deer) = state.deer.lock() {
        deer.record_reminder();
    }
}

/// 快进24小时 (测试用)
#[tauri::command]
pub fn skip_day(state: State<AppState>) -> Result<DeerState, String> {
    let mut deer = state.deer.lock().map_err(|e| e.to_string())?;
    deer.skip_day();
    REMINDER_SENT.store(false, Ordering::SeqCst);
    Ok(deer.clone())
}

/// 设置提醒间隔 (秒)
#[tauri::command]
pub fn set_reminder_interval(state: State<AppState>, seconds: i64) -> Result<DeerState, String> {
    let mut deer = state.deer.lock().map_err(|e| e.to_string())?;
    deer.set_reminder_interval(seconds);
    REMINDER_SENT.store(false, Ordering::SeqCst);
    Ok(deer.clone())
}

/// 手动保存状态
#[tauri::command]
pub fn save_state(state: State<AppState>, app: tauri::AppHandle) -> Result<(), String> {
    let deer = state.deer.lock().map_err(|e| e.to_string())?;
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let state_file = data_dir.join("deer_state.json");
    let json = serde_json::to_string_pretty(&*deer).map_err(|e| e.to_string())?;
    std::fs::write(&state_file, &json).map_err(|e| e.to_string())?;
    Ok(())
}

/// 检查并发送桌面提醒
pub fn try_send_reminder(app: &tauri::AppHandle, deer: &DeerState) {
    if deer.should_remind() && !REMINDER_SENT.load(Ordering::SeqCst) {
        REMINDER_SENT.store(true, Ordering::SeqCst);

        let hours = deer.seconds_since_last_pet() as f64 / 3600.0;
        let body = format!(
            "已经 {:.0} 小时没摸小鹿了，它很想你 💔",
            hours.floor()
        );

        // 记录提醒时间到状态 (用于光速响应成就)
        {
            if let Some(state) = app.try_state::<AppState>() {
                if let Ok(mut d) = state.deer.lock() {
                    d.record_reminder();
                }
            }
        }

        // 发送 Tauri 事件到前端
        let _ = app.emit("reminder-triggered", json!({
            "title": "🦌 小鹿想你了！",
            "body": body,
            "seconds": deer.seconds_since_last_pet(),
            "mood": "depressed"
        }));

        // 尝试发送系统通知
        #[cfg(desktop)]
        {
            use tauri_plugin_notification::NotificationExt;
            let _ = app.notification()
                .builder()
                .title("🦌 小鹿想你了！")
                .body(&body)
                .show();
        }
    }
}
