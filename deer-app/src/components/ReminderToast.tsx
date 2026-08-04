import { useDeerStore } from "../stores/deerStore";
import { X, Bell, Heart } from "lucide-react";

/**
 * 提醒通知弹窗
 * 2小时未抚摸时显示在界面上
 */
export default function ReminderToast() {
  const { showReminder, reminder, dismissReminder, pet } = useDeerStore();

  if (!showReminder || !reminder) return null;

  const hours = Math.floor(reminder.seconds_since_last_pet / 3600);
  const mins = Math.floor((reminder.seconds_since_last_pet % 3600) / 60);

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 no-drag">
      <div className="glass animate-pop px-4 py-3 flex items-center gap-3 border border-red-500/30 shadow-lg shadow-red-500/10">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
          <Bell size={20} className="text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90">
            🦌 小鹿想你了！
          </div>
          <div className="text-xs text-white/60">
            已 {hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`} 没被抚摸
          </div>
        </div>

        <button
          onClick={async () => {
            await pet();
            dismissReminder();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition-colors border border-red-500/30"
        >
          <Heart size={12} />
          抚摸
        </button>

        <button
          onClick={dismissReminder}
          className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
