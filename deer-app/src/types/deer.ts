/* ===== 鹿了吗 - TypeScript 类型定义 ===== */

/** 小鹿情绪状态 */
export type Mood = "energetic" | "satisfied" | "depressed";

/** 小鹿完整状态 */
export interface DeerState {
  last_pet_time: number;
  current_mood: Mood;
  affection: number;
  level: number;
  consecutive_days: number;
  total_pets: number;
  pet_cooldown_end: number;
  is_being_pet: boolean;
  last_check_date: string;
  pets_today: number;
  today_date: string;
  last_pet_hour: number;
  last_reminder_time: number;
  newly_unlocked: string[];
  unlocked_achievements: string[];
  reminder_interval_seconds: number;
  recent_pet_timestamps: number[];
  dnd_enabled: boolean;
  dnd_start: string;
  dnd_end: string;
}

export interface PetResult {
  result: "ok" | "leveled_up" | "cooldown";
  state: DeerState;
}

export interface ReminderCheck {
  should_remind: boolean;
  seconds_since_last_pet: number;
  current_mood: Mood;
  mood_label: string;
  mood_emoji: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: number | null;
  is_unlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_pet", name: "初次见面", description: "第一次抚摸小鹿，从此相伴", icon: "🦌", unlocked_at: null, is_unlocked: false },
  { id: "consecutive_7", name: "一周陪伴", description: "连续7天每天抚摸小鹿", icon: "🔥", unlocked_at: null, is_unlocked: false },
  { id: "consecutive_30", name: "月度守护", description: "连续30天每天抚摸小鹿", icon: "⭐", unlocked_at: null, is_unlocked: false },
  { id: "pets_100", name: "百摸不厌", description: "累计抚摸小鹿100次", icon: "💯", unlocked_at: null, is_unlocked: false },
  { id: "pets_1000", name: "摸鹿狂魔", description: "累计抚摸小鹿1000次", icon: "🏆", unlocked_at: null, is_unlocked: false },
  { id: "level_10", name: "茁壮成长", description: "小鹿好感度达到10级", icon: "🌱", unlocked_at: null, is_unlocked: false },
  { id: "level_50", name: "亲密无间", description: "小鹿好感度达到50级（满级）", icon: "💎", unlocked_at: null, is_unlocked: false },
  { id: "night_owl", name: "夜猫子", description: "在凌晨0点至5点之间抚摸小鹿", icon: "🌙", unlocked_at: null, is_unlocked: false },
  { id: "quick_response", name: "光速响应", description: "提醒弹出后30秒内赶来抚摸", icon: "⚡", unlocked_at: null, is_unlocked: false },
  { id: "daily_7", name: "一日七摸", description: "在单日内抚摸小鹿7次以上", icon: "🎯", unlocked_at: null, is_unlocked: false },
];

/** 隐藏成就 — 不在列表中显示，解锁后才出现 */
export const HIDDEN_ACHIEVEMENTS: Achievement[] = [
  { id: "crazy_deer", name: "疯狂鹿", description: "10秒内连续抚摸小鹿5次", icon: "🌀", unlocked_at: null, is_unlocked: false },
];

export type InteractionAction = "pet";

export interface InteractionLog {
  id: number;
  timestamp: number;
  action: InteractionAction;
  duration_secs: number;
}

/** 情绪信息映射 — 沮丧=2h内刚摸过, 挺拔=超2h等你 */
export const MOOD_INFO: Record<Mood, {
  label: string;
  emoji: string;
  color: string;
  description: string;
  animation: string;
}> = {
  depressed: {
    label: "沮丧",
    emoji: "🔵",
    color: "#60a5fa",
    description: "刚被摸完，还在回味中...",
    animation: "anim-depressed",
  },
  energetic: {
    label: "挺拔",
    emoji: "🟢",
    color: "#4ade80",
    description: "精力充沛，等你来摸！",
    animation: "anim-energetic",
  },
  satisfied: {
    label: "满足",
    emoji: "🟡",
    color: "#facc15",
    description: "正在享受你的抚摸～",
    animation: "anim-satisfied",
  },
};

export function formatTimeSince(seconds: number): string {
  if (seconds < 60) return "刚刚";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 7200) return `${Math.floor(seconds / 3600)} 小时前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return `${Math.floor(seconds / 86400)} 天前`;
}

export function isOverTwoHours(seconds: number): boolean {
  return seconds > 7200;
}
