use chrono::Timelike;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// 小鹿的三种情绪状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Mood {
    /// 挺拔 — 超过2小时未被抚摸，精力充沛地等你来摸
    Energetic,
    /// 满足 — 正在被抚摸，享受幸福
    Satisfied,
    /// 沮丧 — 2小时内刚被摸过，还在回味中
    Depressed,
}

impl Mood {
    /// 根据上次抚摸时间计算当前情绪
    /// 逻辑：刚被摸完 → 沮丧（回味）；超2小时 → 挺拔（等你来）
    pub fn from_last_pet(last_pet_ts: i64, is_being_pet: bool) -> Self {
        if is_being_pet {
            return Mood::Satisfied;
        }
        let now = chrono::Utc::now().timestamp();
        let hours_passed = (now - last_pet_ts) as f64 / 3600.0;
        if hours_passed > 2.0 {
            Mood::Energetic  // 超2小时没摸 → 挺拔等待
        } else {
            Mood::Depressed  // 2小时内摸过 → 沮丧回味
        }
    }

    /// 中文标签
    pub fn label(&self) -> &str {
        match self {
            Mood::Energetic => "挺拔",
            Mood::Satisfied => "满足",
            Mood::Depressed => "沮丧",
        }
    }

    /// 对应 emoji
    pub fn emoji(&self) -> &str {
        match self {
            Mood::Energetic => "🟢",
            Mood::Satisfied => "🟡",
            Mood::Depressed => "🔴",
        }
    }
}

/// 小鹿完整状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeerState {
    /// 上次抚摸时间 (Unix timestamp 秒)
    pub last_pet_time: i64,
    /// 当前情绪
    pub current_mood: Mood,
    /// 好感度 0-9999
    pub affection: u32,
    /// 等级 1-50
    pub level: u32,
    /// 连续抚摸天数
    pub consecutive_days: u32,
    /// 总抚摸次数
    pub total_pets: u64,
    /// 交互冷却结束时间 (Unix timestamp 秒)
    pub pet_cooldown_end: i64,
    /// 是否正在被抚摸
    pub is_being_pet: bool,
    /// 最后检查日期 (用于连续天数计算)
    pub last_check_date: String,
    /// 今日抚摸次数
    pub pets_today: u32,
    /// 今日日期 (用于重置每日计数)
    pub today_date: String,
    /// 上次抚摸的小时 (0-23), 用于夜猫子成就
    pub last_pet_hour: u32,
    /// 上次提醒时间戳, 用于光速响应成就
    pub last_reminder_time: i64,
    /// 本次刚解锁的成就 (每次 pet 刷新)
    pub newly_unlocked: Vec<String>,
    /// 所有已解锁成就 ID (持久化, 用于去重)
    pub unlocked_achievements: Vec<String>,
    /// 提醒间隔 (秒), 默认 7200 = 2小时
    pub reminder_interval_seconds: i64,
    /// 最近抚摸时间戳列表 (用于疯狂鹿成就: 10秒内5次)
    pub recent_pet_timestamps: Vec<i64>,
    /// 免打扰是否启用 (旧存档兼容: 缺失时默认 false)
    #[serde(default)]
    pub dnd_enabled: bool,
    /// 免打扰开始时间 "HH:MM" (24小时制, 本地时间)
    #[serde(default)]
    pub dnd_start: String,
    /// 免打扰结束时间 "HH:MM" (24小时制, 本地时间)
    #[serde(default)]
    pub dnd_end: String,
}

impl Default for DeerState {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            last_pet_time: now,
            current_mood: Mood::Depressed,  // 初始算"刚被摸"，2小时后→挺拔
            affection: 0,
            level: 1,
            consecutive_days: 0,
            total_pets: 0,
            pet_cooldown_end: 0,
            is_being_pet: false,
            last_check_date: String::new(),
            pets_today: 0,
            today_date: String::new(),
            last_pet_hour: 24, // 24 = 未设置，避免与合法小时值 0-23 冲突
            last_reminder_time: 0,
            newly_unlocked: Vec::new(),
            unlocked_achievements: Vec::new(),
            reminder_interval_seconds: 7200,
            recent_pet_timestamps: Vec::new(),
            dnd_enabled: false,
            dnd_start: "22:00".to_string(),
            dnd_end: "08:00".to_string(),
        }
    }
}

impl DeerState {
    /// 抚摸小鹿
    pub fn pet(&mut self) -> &str {
        let now = chrono::Utc::now().timestamp();
        let now_dt = chrono::Utc::now();
        let today = now_dt.format("%Y-%m-%d").to_string();
        let hour = now_dt.format("%H").to_string().parse::<u32>().unwrap_or(12);

        // 冷却检查 (1秒冷却防止刷)
        if now < self.pet_cooldown_end {
            return "cooldown";
        }
        self.pet_cooldown_end = now + 1;
        self.newly_unlocked.clear();

        // 每日重置
        if self.today_date != today {
            self.pets_today = 0;
            self.today_date = today.clone();
        }

        // 检查连续天数
        if self.last_check_date != today {
            let yesterday = now_dt
                .checked_sub_signed(chrono::Duration::days(1))
                .unwrap_or(now_dt)
                .format("%Y-%m-%d")
                .to_string();
            if self.last_check_date == yesterday {
                self.consecutive_days += 1;
            } else if !self.last_check_date.is_empty() {
                self.consecutive_days = 1;
            } else {
                self.consecutive_days = 1;
            }
            self.last_check_date = today;
        }

        // 记录最近抚摸时间戳 (用于疯狂鹿成就)
        self.recent_pet_timestamps.push(now);
        self.recent_pet_timestamps.retain(|t| now - t <= 10);

        self.last_pet_time = now;
        self.last_pet_hour = hour;
        self.total_pets += 1;
        self.pets_today += 1;
        self.is_being_pet = true;
        self.current_mood = Mood::Satisfied;

        // 好感度增加
        let bonus = if self.consecutive_days >= 7 { 3 } else { 1 };
        self.affection = (self.affection + bonus).min(9999);

        // 升级检查
        let new_level = (self.affection / 200 + 1).min(50);
        let leveled_up = new_level > self.level;
        self.level = new_level;

        // 成就检查
        self.check_achievements();

        if leveled_up { "leveled_up" } else { "ok" }
    }

    /// 记录提醒时间 (用于光速响应成就)
    pub fn record_reminder(&mut self) {
        self.last_reminder_time = chrono::Utc::now().timestamp();
    }

    /// 快进24小时 (测试用)
    pub fn skip_day(&mut self) {
        self.last_pet_time -= 86400;
        let yesterday = (chrono::Utc::now() - chrono::Duration::days(1))
            .format("%Y-%m-%d")
            .to_string();
        self.last_check_date = yesterday;
        self.refresh();
    }

    /// 设置提醒间隔
    pub fn set_reminder_interval(&mut self, seconds: i64) {
        self.reminder_interval_seconds = seconds.clamp(30, 86400);
    }

    /// 检查并解锁成就 (用 unlocked_achievements 做持久去重)
    fn check_achievements(&mut self) {
        use std::collections::HashSet;
        // 先收集要检查的候选，批量判断后再插入
        let unlocked: HashSet<String> = self.unlocked_achievements.iter().cloned().collect();
        let mut to_unlock: Vec<&str> = Vec::new();

        if self.total_pets >= 1 { to_unlock.push("first_pet"); }
        if self.consecutive_days >= 7 { to_unlock.push("consecutive_7"); }
        if self.consecutive_days >= 30 { to_unlock.push("consecutive_30"); }
        if self.total_pets >= 100 { to_unlock.push("pets_100"); }
        if self.total_pets >= 1000 { to_unlock.push("pets_1000"); }
        if self.level >= 10 { to_unlock.push("level_10"); }
        if self.level >= 50 { to_unlock.push("level_50"); }
        if self.last_pet_hour < 5 { to_unlock.push("night_owl"); }
        if self.last_reminder_time > 0
            && (self.last_pet_time - self.last_reminder_time) <= 30
            && (self.last_pet_time - self.last_reminder_time) > 0
        {
            to_unlock.push("quick_response");
            self.last_reminder_time = 0;
        }
        if self.pets_today >= 7 { to_unlock.push("daily_7"); }
        // 隐藏成就: 10秒内抚摸5次
        if self.recent_pet_timestamps.len() >= 5 { to_unlock.push("crazy_deer"); }

        for id in to_unlock {
            if !unlocked.contains(id) {
                self.unlocked_achievements.push(id.to_string());
                self.newly_unlocked.push(id.to_string());
            }
        }
    }

    /// 结束抚摸
    pub fn end_pet(&mut self) {
        self.is_being_pet = false;
        self.current_mood = Mood::from_last_pet(self.last_pet_time, false);
    }

    /// 刷新状态 (定期调用)
    pub fn refresh(&mut self) {
        if !self.is_being_pet {
            self.current_mood = Mood::from_last_pet(self.last_pet_time, false);
        }
    }

    /// 距离上次抚摸过去了多少秒
    pub fn seconds_since_last_pet(&self) -> i64 {
        chrono::Utc::now().timestamp() - self.last_pet_time
    }

    /// 是否应该提醒 (超过设定间隔, 且当前不在免打扰时段)
    /// 免打扰期间不提醒, 但不会重置计时 —— 结束时如果仍超时, 下一轮会自动补发
    pub fn should_remind(&self) -> bool {
        !self.is_being_pet
            && self.seconds_since_last_pet() > self.reminder_interval_seconds
            && !self.in_do_not_disturb()
    }

    /// 当前本地时间是否处于免打扰时段
    pub fn in_do_not_disturb(&self) -> bool {
        if !self.dnd_enabled {
            return false;
        }
        let now_dt = chrono::Local::now();
        let now_min = now_dt.hour() as i64 * 60 + now_dt.minute() as i64;
        match (parse_hhmm(&self.dnd_start), parse_hhmm(&self.dnd_end)) {
            (Some(s), Some(e)) => is_within_window(now_min, s, e),
            _ => false,
        }
    }

    /// 设置免打扰 (返回错误信息时保持原状态不变)
    pub fn set_do_not_disturb(&mut self, enabled: bool, start: &str, end: &str) -> Result<(), String> {
        let s = parse_hhmm(start).ok_or_else(|| "免打扰开始时间格式应为 HH:MM".to_string())?;
        let e = parse_hhmm(end).ok_or_else(|| "免打扰结束时间格式应为 HH:MM".to_string())?;
        let _ = (s, e);
        self.dnd_enabled = enabled;
        self.dnd_start = start.to_string();
        self.dnd_end = end.to_string();
        Ok(())
    }

    /// 升级进度 (0.0 - 1.0)
    pub fn level_progress(&self) -> f64 {
        let base = (self.level - 1) * 200;
        let next = self.level * 200;
        let progress = (self.affection.saturating_sub(base)) as f64 / (next - base) as f64;
        progress.clamp(0.0, 1.0)
    }
}

/// 全局小鹿状态 (线程安全)
pub struct AppState {
    pub deer: Mutex<DeerState>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            deer: Mutex::new(DeerState::default()),
        }
    }
}


/// 解析 "HH:MM" 为"当天第几分钟" (0-1439), 非法格式返回 None
fn parse_hhmm(s: &str) -> Option<i64> {
    let mut it = s.split(':');
    let h: u32 = it.next()?.trim().parse().ok()?;
    let m: u32 = it.next()?.trim().parse().ok()?;
    if h < 24 && m < 60 {
        Some(h as i64 * 60 + m as i64)
    } else {
        None
    }
}


/// 判断"当天分钟数"是否落在 [start, end) 窗口内（支持跨午夜，start == end 视为未设置窗口）
fn is_within_window(now_min: i64, start: i64, end: i64) -> bool {
    if start == end {
        return false;
    }
    if start < end {
        // 同一天内: [start, end)
        now_min >= start && now_min < end
    } else {
        // 跨午夜: [start, 24:00) ∪ [00:00, end)
        now_min >= start || now_min < end
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_hhmm_ok() {
        assert_eq!(parse_hhmm("22:00"), Some(1320));
        assert_eq!(parse_hhmm("00:00"), Some(0));
        assert_eq!(parse_hhmm("23:59"), Some(1439));
    }

    #[test]
    fn parse_hhmm_invalid() {
        assert_eq!(parse_hhmm("25:00"), None);
        assert_eq!(parse_hhmm("12:60"), None);
        assert_eq!(parse_hhmm("abc"), None);
        assert_eq!(parse_hhmm("12"), None);
        // 宽松解析: "12:3" 视为 12:03（前端 input[type=time] 固定发两位）
        assert_eq!(parse_hhmm("12:3"), Some(723));
        assert_eq!(parse_hhmm(""), None);
        assert_eq!(parse_hhmm("12:30:00"), Some(750)); // 多余部分忽略尾部段? 不, 这里 "12:30:00" 第三段是 "00" 只取前两段

    }

    #[test]
    fn dnd_same_day_window() {
        // [09:00, 17:00)
        assert!(is_within_window(9 * 60, 9 * 60, 17 * 60));     // 09:00 含
        assert!(is_within_window(12 * 60, 9 * 60, 17 * 60));     // 12:00
        assert!(!is_within_window(17 * 60, 9 * 60, 17 * 60));    // 17:00 不含 (end 开区间)
        assert!(!is_within_window(8 * 60, 9 * 60, 17 * 60));     // 08:00
    }

    #[test]
    fn dnd_overnight_window() {
        // 22:00 -> 08:00 (跨午夜)
        assert!(is_within_window(23 * 60, 22 * 60, 8 * 60));       // 23:00
        assert!(is_within_window(1 * 60, 22 * 60, 8 * 60));        // 01:00
        assert!(is_within_window(7 * 60 + 59, 22 * 60, 8 * 60));   // 07:59
        assert!(!is_within_window(8 * 60, 22 * 60, 8 * 60));       // 08:00 不含
        assert!(!is_within_window(12 * 60, 22 * 60, 8 * 60));      // 12:00
    }

    #[test]
    fn dnd_equal_window_disabled() {
        assert!(!is_within_window(0, 10 * 60, 10 * 60));
        assert!(!is_within_window(10 * 60, 10 * 60, 10 * 60));
    }

    #[test]
    fn dnd_disabled_by_default() {
        let d = DeerState::default();
        assert!(!d.in_do_not_disturb());
    }

    #[test]
    fn set_dnd_validation_keeps_state_on_error() {
        let mut d = DeerState::default();
        assert!(d.set_do_not_disturb(true, "22:00", "08:00").is_ok());
        assert!(d.dnd_enabled && d.dnd_start == "22:00" && d.dnd_end == "08:00");
        // 非法格式 -> 报错且状态不变
        assert!(d.set_do_not_disturb(true, "25:00", "08:00").is_err());
        assert!(d.dnd_enabled && d.dnd_start == "22:00" && d.dnd_end == "08:00");
    }

    #[test]
    fn should_remind_ignores_disabled_or_empty_dnd_window() {
        let mut d = DeerState::default();
        d.last_pet_time -= 3 * 3600; // 3 小时没摸
        assert!(d.should_remind());
        // 免打扰开启但 start == end（视为未设置窗口）-> 仍然提醒
        d.dnd_enabled = true;
        d.dnd_start = "12:00".to_string();
        d.dnd_end = "12:00".to_string();
        assert!(d.should_remind());
    }
}
