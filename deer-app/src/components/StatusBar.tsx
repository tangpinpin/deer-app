import { useEffect, useState } from "react";
import { useDeerStore } from "../stores/deerStore";
import { MOOD_INFO } from "../types/deer";
import { Settings, Heart, Star, Clock, Timer } from "lucide-react";
import SettingsDialog from "./SettingsDialog";

/**
 * 顶部状态栏
 * 显示小鹿状态、好感度、等级、上次抚摸计时器，可拖动窗口
 */
export default function StatusBar() {
  const { deerState, toggleSettings, showSettings } = useDeerStore();
  const [elapsed, setElapsed] = useState(0);

  // 每秒更新距上次抚摸的时间
  useEffect(() => {
    if (!deerState) return;
    const update = () => {
      setElapsed(Math.floor(Date.now() / 1000) - deerState.last_pet_time);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deerState?.last_pet_time]);

  if (!deerState) return null;

  const moodInfo = MOOD_INFO[deerState.current_mood];

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}秒`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m < 60) return `${m}分${sec}秒`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}时${min}分`;
  };

  return (
    <>
      <div className="drag-region absolute top-0 left-0 right-0 z-30">
        {/* 第一行：状态 + 时间 */}
        <div className="flex items-center justify-between px-3 py-1.5 glass-light rounded-t-xl no-drag">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: moodInfo.color }}
            />
            <span className="text-xs font-medium text-white/80">
              {moodInfo.emoji} {moodInfo.label}
            </span>
          </div>

          {/* 距上次抚摸计时 */}
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Timer size={11} />
            <span className="text-white/70 tabular-nums">
              上次抚摸: {formatElapsed(elapsed)}前
            </span>
          </div>

          <button
            onClick={toggleSettings}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white/90"
            title="设置"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* 第二行：统计 + 进度条 */}
        <div className="flex items-center justify-between px-3 py-1 no-drag">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Heart size={11} className="text-pink-400" />
              {deerState.affection}
            </span>
            <span className="flex items-center gap-1">
              <Star size={11} className="text-amber-400" />
              Lv.{deerState.level}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-blue-400" />
              {deerState.consecutive_days}天
            </span>
          </div>
        </div>

        {/* 等级进度条 */}
        <div className="no-drag h-1 bg-white/5">
          <div
            className="h-full transition-all duration-500 rounded-r"
            style={{
              width: `${((deerState.affection % 200) / 200) * 100}%`,
              backgroundColor: moodInfo.color,
            }}
          />
        </div>
      </div>

      {showSettings && <SettingsDialog />}
    </>
  );
}
