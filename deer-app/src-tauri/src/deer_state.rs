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

    /// 是否应该提醒 (超过设定间隔)
    pub fn should_remind(&self) -> bool {
        !self.is_being_pet && self.seconds_since_last_pet() > self.reminder_interval_seconds
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
