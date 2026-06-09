import { useState, useEffect } from "react";

export default function SplashAnimation({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 500);
    const t2 = setTimeout(() => setPhase("out"), 2300);
    const t3 = setTimeout(() => setPhase("done"), 2850);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      {/* App mounts normally — splash overlays on top */}
      {children}

      {phase !== "done" && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#060D1B] overflow-hidden pointer-events-none"
          style={{
            opacity: phase === "out" ? 0 : 1,
            transition: phase === "out" ? "opacity 0.55s ease-in-out" : "opacity 0.3s ease-out",
          }}
        >
          {/* Animated radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.12) 0%, transparent 70%)",
              opacity: phase === "in" ? 0 : 1,
              transition: "opacity 0.8s ease-out",
            }}
          />

          {/* Outer ping rings */}
          <div
            className="absolute rounded-full border border-emerald-500/20"
            style={{
              width: 260,
              height: 260,
              animation: phase === "hold" ? "verifio-ping 1.6s ease-out infinite" : "none",
            }}
          />
          <div
            className="absolute rounded-full border border-emerald-500/10"
            style={{
              width: 340,
              height: 340,
              animation: phase === "hold" ? "verifio-ping 1.6s 0.4s ease-out infinite" : "none",
            }}
          />

          {/* Logo + text container */}
          <div
            style={{
              transform: phase === "in" ? "scale(0.6) translateY(20px)" : "scale(1) translateY(0)",
              opacity: phase === "in" ? 0 : 1,
              transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease-out",
            }}
            className="relative flex flex-col items-center"
          >
            {/* Glow aura behind logo */}
            <div
              className="absolute rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"
              style={{ width: 160, height: 160, top: "50%", left: "50%", transform: "translate(-50%,-56%)" }}
            />

            {/* Logo with float + glow */}
            <div
              className="relative mb-6"
              style={{
                filter:
                  phase === "hold"
                    ? "drop-shadow(0 0 24px rgba(16,185,129,0.6)) drop-shadow(0 0 48px rgba(16,185,129,0.25))"
                    : "drop-shadow(0 0 8px rgba(16,185,129,0.3))",
                transition: "filter 0.6s ease-out",
                animation: phase === "hold" ? "verifio-float 3s ease-in-out infinite" : "none",
              }}
            >
              <img src="/logo.png" alt="Verifio" className="w-28 h-28 object-contain" />
            </div>

            {/* Animated letter-by-letter brand name */}
            <div className="flex items-baseline gap-0.5 mb-2">
              {"VERIFIO".split("").map((char, i) => (
                <span
                  key={i}
                  className="text-3xl font-black text-white tracking-widest"
                  style={{
                    opacity: phase === "in" ? 0 : 1,
                    transform: phase === "in" ? "translateY(10px)" : "translateY(0)",
                    transition: `opacity 0.4s ${0.05 * i + 0.2}s ease-out, transform 0.4s ${0.05 * i + 0.2}s ease-out`,
                  }}
                >
                  {char}
                </span>
              ))}
              <span
                className="text-3xl font-black text-emerald-500"
                style={{
                  opacity: phase === "in" ? 0 : 1,
                  transition: "opacity 0.4s 0.62s ease-out",
                }}
              >
                .
              </span>
            </div>

            <p
              className="text-xs tracking-[0.35em] text-slate-500 uppercase mb-10"
              style={{
                opacity: phase === "in" ? 0 : 1,
                transition: "opacity 0.5s 0.72s ease-out",
              }}
            >
              Garant de votre confiance
            </p>

            {/* Loading bar */}
            <div className="w-36 h-0.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                style={{
                  width: phase === "in" ? "0%" : "100%",
                  transition: "width 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s",
                }}
              />
            </div>

            {/* Orbital particles */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-emerald-500"
                style={{
                  width: i % 2 === 0 ? 4 : 3,
                  height: i % 2 === 0 ? 4 : 3,
                  top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 74}px - 90px)`,
                  left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 74}px)`,
                  opacity: phase === "hold" ? 0.75 : 0,
                  transform: `scale(${phase === "hold" ? 1 : 0})`,
                  transition: `opacity 0.4s ${i * 0.07}s ease-out, transform 0.5s ${i * 0.07}s cubic-bezier(0.34,1.56,0.64,1)`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes verifio-ping {
          0%   { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes verifio-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
      `}</style>
    </>
  );
}
