import { useEffect, useRef, useState } from "react";
import { useDeerStore } from "../stores/deerStore";
import { ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS, type Achievement } from "../types/deer";
import { Trophy } from "lucide-react";

/** 所有成就注册表（静态 + 隐藏） */
const ALL: Achievement[] = [...ACHIEVEMENTS, ...HIDDEN_ACHIEVEMENTS];

/**
 * 成就解锁弹窗 — 监听 newly_unlocked，弹 3 秒后自动消失
 */
export default function AchievementToast() {
  const deerState = useDeerStore((s) => s.deerState);
  const [toast, setToast] = useState<Achievement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (!deerState) return;
    const ids = deerState.newly_unlocked;
    if (ids.length > 0 && ids.length !== prevLen.current) {
      // 取最后一个新解锁的
      const latestId = ids[ids.length - 1];
      const ach = ALL.find((a) => a.id === latestId);
      if (ach) {
        setToast({ ...ach, is_unlocked: true, unlocked_at: Date.now() });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setToast(null), 3000);
      }
    }
    prevLen.current = ids.length;
  }, [deerState?.newly_unlocked]);

  if (!toast) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 no-drag animate-pop">
      <div className="glass border border-amber-500/30 px-4 py-3 flex items-center gap-3 shadow-lg shadow-amber-500/10 min-w-[240px]">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xl">
          {toast.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">成就解锁！</span>
          </div>
          <div className="text-xs text-white/80 font-medium mt-0.5">{toast.name}</div>
          <div className="text-[10px] text-white/50 mt-0.5">{toast.description}</div>
        </div>
      </div>
    </div>
  );
}
