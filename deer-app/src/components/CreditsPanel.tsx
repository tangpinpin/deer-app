import { useDeerStore } from "../stores/deerStore";
import { X } from "lucide-react";

export default function CreditsPanel() {
  const toggleCredits = useDeerStore((s) => s.toggleCredits);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
      <div className="glass w-[280px] p-5 text-center">
        <button
          onClick={toggleCredits}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60"
        >
          <X size={16} />
        </button>

        <div className="text-5xl mb-4">🦌</div>
        <h3 className="text-lg font-semibold text-white/90 mb-2">特别鸣谢</h3>

        <div className="space-y-3 mt-4">
          <div className="glass-light rounded-xl p-3">
            <div className="text-[10px] text-white/40 mb-0.5">App 制作者</div>
            <div className="text-sm font-medium text-amber-300">DaSheng Li</div>
          </div>

          <div className="glass-light rounded-xl p-3">
            <div className="text-[10px] text-white/40 mb-0.5">原创作者</div>
            <div className="text-sm font-medium text-amber-300">JiaHao Wang</div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 leading-relaxed">
            感谢使用「鹿了吗」<br />
            愿小鹿带给你每一天的温暖与陪伴 ✨
          </p>
        </div>
      </div>
    </div>
  );
}
