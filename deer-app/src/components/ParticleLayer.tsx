import { useDeerStore } from "../stores/deerStore";

/**
 * 粒子特效层
 * 抚摸时飘出的爱心、星星等
 */
export default function ParticleLayer() {
  const particles = useDeerStore((s) => s.particles);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute anim-float pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            fontSize: p.emoji.length > 1 ? 18 : 20,
            animationDelay: `${Math.random() * 0.2}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
