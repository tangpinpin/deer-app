import { useEffect } from "react";
import DeerCanvas from "./components/DeerCanvas";
import StatusBar from "./components/StatusBar";
import InteractionPanel from "./components/InteractionPanel";
import ParticleLayer from "./components/ParticleLayer";
import ReminderToast from "./components/ReminderToast";
import AchievementsPanel from "./components/AchievementsPanel";
import CreditsPanel from "./components/CreditsPanel";
import AchievementToast from "./components/AchievementToast";
import { useDeerStore } from "./stores/deerStore";

export default function App() {
  const fetchState = useDeerStore((s) => s.fetchState);
  const error = useDeerStore((s) => s.error);
  const showAchievements = useDeerStore((s) => s.showAchievements);
  const showCredits = useDeerStore((s) => s.showCredits);

  useEffect(() => {
    fetchState();

    // 监听 Tauri 提醒事件
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("reminder-triggered", () => {
        useDeerStore.getState().checkReminder();
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => {
      unlisten?.();
    };
  }, [fetchState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden rounded-xl">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] opacity-90" />

      {/* 装饰光斑 */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

      {/* 内容层 */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* 拖拽区域 */}
        <div className="drag-region h-8" />

        {/* 小鹿显示区 */}
        <div className="flex-1 relative">
          <StatusBar />
          <DeerCanvas />
          <ParticleLayer />
          <ReminderToast />
          <AchievementToast />
          {showAchievements && <AchievementsPanel />}
          {showCredits && <CreditsPanel />}
        </div>

        {/* 互动面板 */}
        <InteractionPanel />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 glass-light rounded-lg text-xs text-red-400 border border-red-500/20 no-drag">
          {error}
        </div>
      )}
    </div>
  );
}
