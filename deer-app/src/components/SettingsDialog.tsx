import { useDeerStore } from "../stores/deerStore";
import { useState } from "react";

const INTERVAL_OPTIONS = [
  { label: "⚡ 30 秒（测试用）", seconds: 30 },
  { label: "30 分钟", seconds: 1800 },
  { label: "1 小时", seconds: 3600 },
  { label: "2 小时（推荐）", seconds: 7200 },
  { label: "4 小时", seconds: 14400 },
];

export default function SettingsDialog() {
  const { toggleSettings, deerState, setReminderInterval, skipDay } = useDeerStore();
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("08:00");

  const currentSeconds = deerState?.reminder_interval_seconds ?? 7200;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
      <div className="glass w-[280px] max-h-[400px] overflow-y-auto p-4 text-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white/90">⚙️ 设置</h3>
          <button
            onClick={toggleSettings}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60"
          >
            ✕
          </button>
        </div>

        {/* 提醒间隔 */}
        <div className="mb-4">
          <label className="block text-xs text-white/50 mb-1.5">⏰ 提醒间隔</label>
          <select
            value={currentSeconds}
            onChange={(e) => setReminderInterval(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.seconds} value={opt.seconds}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="mt-1 text-[10px] text-white/40">
            超过 {currentSeconds < 60 ? `${currentSeconds}秒` : `${Math.floor(currentSeconds / 60)}分钟`} 未摸触发提醒
          </div>
        </div>

        {/* 免打扰 (占位) */}
        <div className="mb-4 opacity-50">
          <label className="block text-xs text-white/50 mb-1.5">🌙 免打扰时段（即将推出）</label>
          <div className="flex items-center gap-2">
            <input
              type="time" value={dndStart} disabled
              onChange={(e) => setDndStart(e.target.value)}
              className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/40 focus:outline-none"
            />
            <span className="text-white/30 text-xs">至</span>
            <input
              type="time" value={dndEnd} disabled
              onChange={(e) => setDndEnd(e.target.value)}
              className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/40 focus:outline-none"
            />
          </div>
        </div>

        {/* 测试工具 */}
        <div className="mb-4">
          <label className="block text-xs text-white/50 mb-1.5">🧪 测试工具</label>
          <button
            onClick={skipDay}
            className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white/90 transition-colors border border-white/10"
          >
            ⏩ 快进 24 小时
          </button>
        </div>

        {/* 状态信息 */}
        {deerState && (
          <div className="pt-3 mt-3 border-t border-white/10 text-xs text-white/40 space-y-1">
            <div className="flex justify-between">
              <span>总抚摸次数</span>
              <span>{deerState.total_pets}</span>
            </div>
            <div className="flex justify-between">
              <span>连续天数</span>
              <span>{deerState.consecutive_days} 天</span>
            </div>
            <div className="flex justify-between">
              <span>好感度</span>
              <span>{deerState.affection} / 9999</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
