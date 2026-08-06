import { Hand, Award, Heart } from "lucide-react";

/**
 * 底部互动面板
 * 抚摸按钮 + 成就入口 + 特别鸣谢
 */
export default function InteractionPanel() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 no-drag">
      <div className="flex items-center justify-center gap-3 px-3 py-2.5 glass-light rounded-b-xl">
        <ActionButton
          icon={<Hand size={18} />}
          label="抚摸"
          hint="点击小鹿或按此按钮抚摸"
          primary
          onClick={() => {
            import("../stores/deerStore").then(({ useDeerStore }) => {
              useDeerStore.getState().pet();
            });
          }}
        />
        <ActionButton
          icon={<Award size={18} />}
          label="成就"
          hint="查看成就"
          onClick={() => {
            import("../stores/deerStore").then(({ useDeerStore }) => {
              useDeerStore.getState().toggleAchievements();
            });
          }}
        />
        <ActionButton
          icon={<Heart size={18} />}
          label="鸣谢"
          hint="特别鸣谢"
          onClick={() => {
            import("../stores/deerStore").then(({ useDeerStore }) => {
              useDeerStore.getState().toggleCredits();
            });
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  hint,
  primary,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  primary?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      title={hint}
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs
        transition-all duration-200 no-drag
        ${
          primary
            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:scale-105 border border-amber-500/30 shadow-lg shadow-amber-500/10"
            : disabled
            ? "text-white/25 cursor-not-allowed"
            : "text-white/60 hover:bg-white/10 hover:text-white/90"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
