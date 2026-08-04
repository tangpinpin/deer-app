import { useEffect, useCallback, useRef, useState } from "react";
import { useDeerStore } from "../stores/deerStore";
import { MOOD_INFO } from "../types/deer";

/**
 * 小鹿 SVG 渲染组件
 * 根据 mood 渲染不同姿态的 furry 二次元小鹿
 * 预留 Live2D 集成接口
 */
export default function DeerCanvas() {
  const { deerState, pet, endPet, spawnParticle, loading } = useDeerStore();
  const [isPetting, setIsPetting] = useState(false);
  const [petPos, setPetPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mood = deerState?.current_mood ?? "energetic";
  const info = MOOD_INFO[mood];

  // 定时刷新状态
  useEffect(() => {
    const interval = setInterval(() => {
      useDeerStore.getState().fetchState();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 提醒检查
  useEffect(() => {
    const interval = setInterval(() => {
      useDeerStore.getState().checkReminder();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 抚摸处理
  const handlePetStart = useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsPetting(true);

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      setPetPos({ x, y });

      spawnParticle(x, y, "💕");

      const result = await pet();
      if (result === "leveled_up") {
        spawnParticle(x, y - 20, "⭐");
      }
    },
    [pet, spawnParticle]
  );

  const handlePetMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isPetting) return;
      e.preventDefault();

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      setPetPos({ x, y });

      // 每移动一定距离冒爱心
      if (Math.random() < 0.3) {
        spawnParticle(x, y, ["💕", "✨", "💖"][Math.floor(Math.random() * 3)]);
      }
    },
    [isPetting, spawnParticle]
  );

  const handlePetEnd = useCallback(() => {
    setIsPetting(false);
    setPetPos(null);
    if (petTimer.current) clearTimeout(petTimer.current);
    // 满足状态延长至 3 秒
    petTimer.current = setTimeout(() => {
      endPet();
    }, 3000);
  }, [endPet]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-6xl animate-bounce">🦌</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center cursor-pointer no-drag"
      onMouseDown={handlePetStart}
      onMouseMove={handlePetMove}
      onMouseUp={handlePetEnd}
      onMouseLeave={handlePetEnd}
      onTouchStart={handlePetStart}
      onTouchMove={handlePetMove}
      onTouchEnd={handlePetEnd}
    >
      {/* 情绪光晕 */}
      <div
        className="absolute transition-all duration-700"
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${info.color}22 0%, transparent 70%)`,
          filter: `blur(20px)`,
          opacity: mood === "depressed" ? 0.3 : mood === "satisfied" ? 1 : 0.5,
        }}
      />

      {/* 小鹿 SVG */}
      <DeerSVG mood={mood} isPetting={isPetting} />

      {/* 抚摸光标 */}
      {petPos && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: petPos.x - 20,
            top: petPos.y - 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,200,100,0.6) 0%, transparent 70%)",
            transform: "scale(1.5)",
            transition: "all 0.1s ease-out",
          }}
        />
      )}

      {/* 满足状态 - 正在鹿！！！ */}
      {mood === "satisfied" && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="text-amber-300 font-bold text-lg tracking-widest anim-satisfied-text">
            正在鹿！！！
          </div>
        </div>
      )}

      {/* 沮丧状态提示 */}
      {mood === "depressed" && !isPetting && (
        <div className="absolute bottom-2 text-xs text-blue-300/70 anim-depressed pointer-events-none">
          刚鹿完
        </div>
      )}

      {/* 挺拔状态提示 */}
      {mood === "energetic" && !isPetting && (
        <div className="absolute bottom-2 text-xs text-green-300/70 anim-energetic pointer-events-none">
          好想鹿
        </div>
      )}
    </div>
  );
}

/* ===== 小鹿 SVG 图形 ===== */
function DeerSVG({ mood, isPetting }: { mood: string; isPetting: boolean }) {
  const scale = isPetting ? 1.05 : 1;

  const animClass =
    mood === "depressed"
      ? "anim-depressed"
      : mood === "satisfied"
      ? "anim-satisfied"
      : "anim-energetic";

  return (
    <div
      className={`transition-transform duration-700 ${animClass}`}
      style={{ transform: `scale(${scale})` }}
    >
      <svg
        width="220"
        height="280"
        viewBox="0 0 220 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {mood === "depressed" ? <DepressedDeer /> : mood === "satisfied" ? <SatisfiedDeer /> : <EnergeticDeer />}
      </svg>
    </div>
  );
}

/* ===== 挺拔状态 ===== */
function EnergeticDeer() {
  return (
    <g>
      {/* 光点 */}
      <circle cx="110" cy="50" r="3" fill="#4ade80" opacity="0.8" className="anim-glow">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="75" cy="80" r="2" fill="#facc15" opacity="0.6">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="70" r="2" fill="#facc15" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* 身体 */}
      <ellipse cx="110" cy="180" rx="45" ry="55" fill="#C4956A" />
      <ellipse cx="110" cy="175" rx="32" ry="40" fill="#F5DEB3" />

      {/* 肚皮 */}
      <ellipse cx="110" cy="185" rx="25" ry="30" fill="#FFF8DC" />

      {/* 左腿 */}
      <rect x="82" y="215" width="18" height="40" rx="9" fill="#C4956A" />
      <ellipse cx="91" cy="256" rx="10" ry="6" fill="#8B6914" />

      {/* 右腿 */}
      <rect x="120" y="215" width="18" height="40" rx="9" fill="#C4956A" />
      <ellipse cx="129" cy="256" rx="10" ry="6" fill="#8B6914" />

      {/* 左臂 */}
      <ellipse cx="68" cy="170" rx="10" ry="22" fill="#C4956A" transform="rotate(15, 68, 170)" />

      {/* 右臂 */}
      <ellipse cx="152" cy="170" rx="10" ry="22" fill="#C4956A" transform="rotate(-15, 152, 170)" />

      {/* 头 */}
      <ellipse cx="110" cy="100" rx="38" ry="35" fill="#D4A574" />

      {/* 脸 */}
      <ellipse cx="110" cy="108" rx="28" ry="22" fill="#F5DEB3" />

      {/* 左耳 */}
      <ellipse cx="82" cy="72" rx="12" ry="22" fill="#D4A574" transform="rotate(-15, 82, 72)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-15 82 72;-25 82 72;-15 82 72"
          dur="4s"
          repeatCount="indefinite"
        />
      </ellipse>
      <ellipse cx="82" cy="72" rx="6" ry="14" fill="#FFCCCC" transform="rotate(-15, 82, 72)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-15 82 72;-25 82 72;-15 82 72"
          dur="4s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* 右耳 */}
      <ellipse cx="138" cy="72" rx="12" ry="22" fill="#D4A574" transform="rotate(15, 138, 72)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="15 138 72;25 138 72;15 138 72"
          dur="4s"
          repeatCount="indefinite"
        />
      </ellipse>
      <ellipse cx="138" cy="72" rx="6" ry="14" fill="#FFCCCC" transform="rotate(15, 138, 72)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="15 138 72;25 138 72;15 138 72"
          dur="4s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* 鹿角 */}
      <Antlers cx={90} cy={55} side="left" />
      <Antlers cx={130} cy={55} side="right" />

      {/* 眼睛 */}
      <g>
        <ellipse cx="98" cy="100" rx="8" ry="10" fill="white" />
        <ellipse cx="122" cy="100" rx="8" ry="10" fill="white" />
        <ellipse cx="100" cy="101" rx="5" ry="6" fill="#2D1B00" />
        <ellipse cx="120" cy="101" rx="5" ry="6" fill="#2D1B00" />
        <circle cx="102" cy="98" r="2" fill="white" />
        <circle cx="122" cy="98" r="2" fill="white" />
        <ellipse cx="100" cy="100" rx="5" ry="6" fill="none" stroke="#2D1B00" strokeWidth="0.5" />
        <ellipse cx="120" cy="100" rx="5" ry="6" fill="none" stroke="#2D1B00" strokeWidth="0.5" />
      </g>

      {/* 鼻子 */}
      <ellipse cx="110" cy="112" rx="4" ry="3" fill="#4A3728" />

      {/* 微笑 */}
      <path d="M103 118 Q110 126 117 118" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 腮红 */}
      <ellipse cx="90" cy="113" rx="6" ry="4" fill="#FFB6C1" opacity="0.4" />
      <ellipse cx="130" cy="113" rx="6" ry="4" fill="#FFB6C1" opacity="0.4" />

      {/* 尾巴 */}
      <ellipse cx="155" cy="165" rx="10" ry="8" fill="#F5DEB3" transform="rotate(20, 155, 165)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="20 155 165;5 155 165;20 155 165"
          dur="2s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* 白色斑点 */}
      <circle cx="98" cy="155" r="3" fill="#FFF8DC" opacity="0.6" />
      <circle cx="118" cy="150" r="4" fill="#FFF8DC" opacity="0.6" />
      <circle cx="108" cy="162" r="3" fill="#FFF8DC" opacity="0.5" />
    </g>
  );
}

/* ===== 满足状态 ===== */
function SatisfiedDeer() {
  return (
    <g>
      {/* 爱心粒子 */}
      <g>
        <text x="140" y="40" fontSize="18" className="anim-float">💕</text>
        <text x="60" y="60" fontSize="14" className="anim-float" style={{ animationDelay: "0.3s" }}>💖</text>
        <text x="160" y="80" fontSize="12" className="anim-float" style={{ animationDelay: "0.6s" }}>✨</text>
      </g>

      {/* 身体 */}
      <ellipse cx="110" cy="180" rx="45" ry="55" fill="#C4956A" />
      <ellipse cx="110" cy="175" rx="32" ry="40" fill="#F5DEB3" />

      {/* 肚皮 */}
      <ellipse cx="110" cy="185" rx="25" ry="30" fill="#FFF8DC" />

      {/* 腿 */}
      <rect x="82" y="215" width="18" height="40" rx="9" fill="#C4956A" />
      <ellipse cx="91" cy="256" rx="10" ry="6" fill="#8B6914" />
      <rect x="120" y="215" width="18" height="40" rx="9" fill="#C4956A" />
      <ellipse cx="129" cy="256" rx="10" ry="6" fill="#8B6914" />

      {/* 手臂 (前伸迎接) */}
      <ellipse cx="62" cy="180" rx="10" ry="18" fill="#C4956A" transform="rotate(30, 62, 180)" />
      <ellipse cx="158" cy="180" rx="10" ry="18" fill="#C4956A" transform="rotate(-30, 158, 180)" />

      {/* 头 */}
      <ellipse cx="110" cy="100" rx="38" ry="35" fill="#D4A574" />

      {/* 脸 */}
      <ellipse cx="110" cy="108" rx="28" ry="22" fill="#F5DEB3" />

      {/* 耳朵 — 开心翘起 */}
      <ellipse cx="82" cy="65" rx="12" ry="22" fill="#D4A574" transform="rotate(-20, 82, 65)" />
      <ellipse cx="82" cy="65" rx="6" ry="14" fill="#FFCCCC" transform="rotate(-20, 82, 65)" />
      <ellipse cx="138" cy="65" rx="12" ry="22" fill="#D4A574" transform="rotate(20, 138, 65)" />
      <ellipse cx="138" cy="65" rx="6" ry="14" fill="#FFCCCC" transform="rotate(20, 138, 65)" />

      {/* 鹿角 */}
      <Antlers cx={90} cy={55} side="left" />
      <Antlers cx={130} cy={55} side="right" />

      {/* 眼睛 — 眯眯眼 */}
      <g>
        <path d="M90 100 Q98 92 106 100" stroke="#2D1B00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M114 100 Q122 92 130 100" stroke="#2D1B00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* 鼻子 */}
      <ellipse cx="110" cy="112" rx="4" ry="3" fill="#4A3728" />

      {/* 开心张嘴 */}
      <path d="M104 118 Q110 130 116 118" fill="#FF6B6B" stroke="#4A3728" strokeWidth="0.8" />

      {/* 腮红 — 更深 */}
      <ellipse cx="88" cy="113" rx="7" ry="5" fill="#FF9999" opacity="0.5" />
      <ellipse cx="132" cy="113" rx="7" ry="5" fill="#FF9999" opacity="0.5" />

      {/* 尾巴 — 快速摇摆 */}
      <ellipse cx="155" cy="165" rx="10" ry="8" fill="#F5DEB3" transform="rotate(20, 155, 165)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="20 155 165;0 155 165;20 155 165"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </ellipse>
    </g>
  );
}

/* ===== 沮丧状态 ===== */
function DepressedDeer() {
  return (
    <g>
      {/* 低落线条 */}
      <g opacity="0.5">
        <line x1="80" y1="50" x2="80" y2="65" stroke="#666" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="y2" values="65;75;65" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="140" y1="55" x2="140" y2="70" stroke="#666" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="y2" values="70;80;70" dur="2.5s" repeatCount="indefinite" />
        </line>
      </g>

      {/* 身体 — 微微驼背 */}
      <ellipse cx="110" cy="182" rx="42" ry="52" fill="#B8946E" />
      <ellipse cx="110" cy="178" rx="28" ry="36" fill="#E8D5B7" />
      <ellipse cx="110" cy="188" rx="22" ry="26" fill="#FFF8DC" />

      {/* 腿 */}
      <rect x="84" y="214" width="16" height="38" rx="8" fill="#B8946E" />
      <ellipse cx="92" cy="253" rx="9" ry="5" fill="#7A5C3E" />
      <rect x="120" y="214" width="16" height="38" rx="8" fill="#B8946E" />
      <ellipse cx="128" cy="253" rx="9" ry="5" fill="#7A5C3E" />

      {/* 手臂 — 垂下 */}
      <ellipse cx="68" cy="185" rx="9" ry="20" fill="#B8946E" transform="rotate(10, 68, 185)" />
      <ellipse cx="152" cy="185" rx="9" ry="20" fill="#B8946E" transform="rotate(-10, 152, 185)" />

      {/* 头 — 低垂 */}
      <ellipse cx="110" cy="108" rx="36" ry="33" fill="#C4956A" transform="rotate(5, 110, 108)" />
      <ellipse cx="110" cy="115" rx="26" ry="20" fill="#E8D5B7" transform="rotate(5, 110, 115)" />

      {/* 耳朵 — 耷拉 */}
      <ellipse cx="84" cy="80" rx="10" ry="20" fill="#C4956A" transform="rotate(-40, 84, 80)" />
      <ellipse cx="84" cy="80" rx="5" ry="12" fill="#FFCCCC" transform="rotate(-40, 84, 80)" />
      <ellipse cx="136" cy="80" rx="10" ry="20" fill="#C4956A" transform="rotate(40, 136, 80)" />
      <ellipse cx="136" cy="80" rx="5" ry="12" fill="#FFCCCC" transform="rotate(40, 136, 80)" />

      {/* 鹿角 — 变小 */}
      <AntlersSmall cx={90} cy={65} side="left" />
      <AntlersSmall cx={130} cy={65} side="right" />

      {/* 眼睛 — 含泪 */}
      <g>
        <ellipse cx="98" cy="106" rx="8" ry="9" fill="white" opacity="0.9" />
        <ellipse cx="122" cy="106" rx="8" ry="9" fill="white" opacity="0.9" />
        <ellipse cx="100" cy="107" rx="5" ry="5.5" fill="#2D1B00" />
        <ellipse cx="120" cy="107" rx="5" ry="5.5" fill="#2D1B00" />
        <circle cx="102" cy="104" r="1.5" fill="white" />
        <circle cx="122" cy="104" r="1.5" fill="white" />
        {/* 泪滴 */}
        <ellipse cx="92" cy="113" rx="2" ry="3" fill="#87CEEB" opacity="0.7">
          <animate attributeName="cy" values="113;118;113" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="128" cy="111" rx="2" ry="3" fill="#87CEEB" opacity="0.7">
          <animate attributeName="cy" values="111;116;111" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.5s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* 鼻子 */}
      <ellipse cx="110" cy="117" rx="3.5" ry="2.5" fill="#4A3728" />

      {/* 嘴巴 — 向下弯 */}
      <path d="M104 123 Q110 120 116 123" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 腮红 — 很淡 */}
      <ellipse cx="90" cy="118" rx="5" ry="3" fill="#FFB6C1" opacity="0.2" />
      <ellipse cx="130" cy="118" rx="5" ry="3" fill="#FFB6C1" opacity="0.2" />
    </g>
  );
}

/* ===== 鹿角 ===== */
function Antlers({ cx, cy, side }: { cx: number; cy: number; side: "left" | "right" }) {
  const dir = side === "left" ? -1 : 1;
  return (
    <g>
      <path
        d={`M${cx} ${cy} Q${cx + 5 * dir} ${cy - 18} ${cx + 8 * dir} ${cy - 30} M${cx + 3 * dir} ${cy - 18} Q${cx + 12 * dir} ${cy - 25} ${cx + 15 * dir} ${cy - 35} M${cx + 1 * dir} ${cy - 12} Q${cx - 2 * dir} ${cy - 22} ${cx - 5 * dir} ${cy - 28}`}
        stroke="#8B6914"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/* ===== 小鹿角 (沮丧用) ===== */
function AntlersSmall({ cx, cy, side }: { cx: number; cy: number; side: "left" | "right" }) {
  const dir = side === "left" ? -1 : 1;
  return (
    <g>
      <path
        d={`M${cx} ${cy} Q${cx + 3 * dir} ${cy - 10} ${cx + 5 * dir} ${cy - 18} M${cx + 2 * dir} ${cy - 10} Q${cx + 7 * dir} ${cy - 14} ${cx + 10 * dir} ${cy - 20}`}
        stroke="#8B6914"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </g>
  );
}
