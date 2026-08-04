import { ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS, type Achievement } from "../types/deer";
import { useDeerStore } from "../stores/deerStore";
import { Trophy, X } from "lucide-react";

export default function AchievementsPanel() {
  const { deerState, toggleAchievements } = useDeerStore();
  const unlockedIds = new Set(deerState?.unlocked_achievements ?? []);

  // 可见成就 = 已知成就中已解锁的 + 所有非隐藏成就
  const visible = ACHIEVEMENTS.map((a) => ({
    ...a,
    is_unlocked: unlockedIds.has(a.id),
    unlocked_at: unlockedIds.has(a.id) ? 1 : null,
  }));

  // 已解锁的隐藏成就也追加显示
  const unlockedHidden = HIDDEN_ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).map((a) => ({
    ...a,
    is_unlocked: true,
    unlocked_at: 1 as number | null,
  }));

  const all = [...visible, ...unlockedHidden];
  const unlockedCount = all.filter((a) => a.is_unlocked).length;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
      <div className="glass w-[300px] max-h-[420px] overflow-y-auto p-4 text-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            成就
            <span className="text-xs text-white/40 font-normal">
              {unlockedCount}/{all.length}
            </span>
          </h3>
          <button
            onClick={toggleAchievements}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {all.map((ach) => (
            <AchievementRow key={ach.id} achievement={ach} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  const unlocked = achievement.is_unlocked;

  return (
    <div
      className={`
        flex items-start gap-3 p-2.5 rounded-xl transition-all
        ${unlocked ? "glass-light border border-amber-500/20" : "bg-white/3 opacity-50"}
      `}
    >
      <div
        className={`
          flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg
          ${unlocked ? "bg-amber-500/20" : "bg-white/5 grayscale"}
        `}
      >
        {unlocked ? achievement.icon : "🔒"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${unlocked ? "text-amber-300" : "text-white/40"}`}>
            {achievement.name}
          </span>
          {unlocked && <span className="text-[10px] text-amber-500/60">已解锁</span>}
        </div>
        <p className="text-xs text-white/50 mt-0.5">{achievement.description}</p>
      </div>
    </div>
  );
}
