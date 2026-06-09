import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, ArrowRight, ChevronRight } from "lucide-react";

const STORAGE_KEY = "verifio_onboarding_done";

const STEPS = [
  {
    id: "welcome",
    title: "Bienvenue sur Verifio ! 👋",
    message:
      "Je suis Veri, votre assistant. Je vais vous montrer comment Verifio protège chaque achat en 30 secondes.",
    position: "center",
    highlight: null,
    action: "Commencer",
    icon: "🛡️",
  },
  {
    id: "search",
    title: "Vérifiez n'importe quel vendeur",
    message:
      "Avant d'acheter, tapez le nom ou le numéro d'un vendeur ici. En 2 secondes, vous savez s'il est certifié Verifio.",
    position: "top",
    highlight: "search-bar",
    action: "Suivant",
    icon: "🔍",
  },
  {
    id: "escrow",
    title: "Votre argent est protégé",
    message:
      "Avec l'escrow Verifio, votre paiement Mobile Money est bloqué jusqu'à ce que vous receviez votre colis. Zéro arnaque possible.",
    position: "center",
    highlight: null,
    action: "Suivant",
    icon: "🔒",
  },
  {
    id: "profile",
    title: "Cliquez sur un vendeur certifié",
    message:
      "Essayez ! Tapez \"Luna\" dans la barre de recherche ci-dessus, puis cliquez sur le résultat pour voir un profil de confiance.",
    position: "top",
    highlight: "search-bar",
    action: "Suivant",
    icon: "✅",
  },
  {
    id: "dashboard",
    title: "Vous êtes vendeur ?",
    message:
      "Accédez à votre dashboard pour suivre vos ventes, gérer les livraisons et partager votre QR code de confiance sur Instagram.",
    position: "top-right",
    highlight: "dashboard-btn",
    action: "Terminer",
    icon: "📊",
  },
];

type Position = "center" | "top" | "top-right";

interface BubbleStyle {
  top?: string;
  left?: string;
  right?: string;
  transform?: string;
  bottom?: string;
}

const POSITION_STYLES: Record<Position, BubbleStyle> = {
  center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  top: { top: "180px", left: "50%", transform: "translateX(-50%)" },
  "top-right": { top: "80px", right: "16px", left: "auto", transform: "none" },
};

export default function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 3200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    const current = STEPS[step];
    if (current.id === "dashboard" || step === STEPS.length - 1) {
      dismiss();
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 220);
  };

  if (!visible) return null;

  const s = STEPS[step];
  const posStyle = POSITION_STYLES[s.position as Position] || POSITION_STYLES.center;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
        style={{ transition: "opacity 0.3s" }}
      >
        {/* Spotlight effect for highlighted elements */}
        {s.highlight === "search-bar" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-3xl pointer-events-none"
            style={{
              top: 80,
              width: "min(660px, 92vw)",
              height: 76,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              border: "2px solid rgba(16,185,129,0.7)",
              animation: "onboard-pulse 1.5s ease-in-out infinite",
            }}
          />
        )}
        {s.highlight === "dashboard-btn" && (
          <div
            className="absolute right-4 sm:right-6 rounded-xl pointer-events-none"
            style={{
              top: 10,
              width: 180,
              height: 44,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              border: "2px solid rgba(16,185,129,0.7)",
              animation: "onboard-pulse 1.5s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {/* Guide bubble */}
      <div
        className="fixed z-[90] w-[min(360px,92vw)]"
        style={{
          ...posStyle,
          opacity: animating ? 0 : 1,
          transform: `${posStyle.transform ?? ""} ${animating ? "translateY(8px)" : "translateY(0)"}`,
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <div className="bg-[#0A192F] border border-emerald-500/30 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              {/* Veri avatar */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-md">
                  <img src="/logo.png" alt="Veri" className="w-full h-full object-contain" />
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0A192F]"
                  style={{ animation: "onboard-pulse 2s ease-in-out infinite" }}
                />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">Veri</div>
                <div className="text-emerald-400 text-xs">Assistant Verifio · en ligne</div>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Message body */}
          <div className="px-5 pb-2">
            {/* Typing animation header */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-lg">{s.icon}</span>
              <h3 className="text-white font-bold text-base leading-tight">{s.title}</h3>
            </div>

            {/* Chat bubble style message */}
            <div className="bg-[#0d2240] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 mb-4">
              <p className="text-slate-300 text-sm leading-relaxed">{s.message}</p>
              {/* Typing dots appear briefly at the start of each step */}
            </div>
          </div>

          {/* Progress + actions */}
          <div className="px-5 pb-5">
            {/* Step dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    backgroundColor: i === step ? "#10B981" : i < step ? "#10B981" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
              <span className="ml-auto text-xs text-slate-500">
                {step + 1} / {STEPS.length}
              </span>
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => { setAnimating(true); setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 220); }}
                  className="px-4 py-2.5 border border-white/10 text-white/60 hover:text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  ← Retour
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25"
              >
                {s.action}
                {s.id !== "dashboard" ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-slate-600 hover:text-slate-400 mt-3 transition-colors"
            >
              Ignorer le guide
            </button>
          </div>
        </div>

        {/* Pointer arrow for top-positioned bubbles */}
        {s.position === "top" && (
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-3 overflow-hidden"
            style={{ filter: "drop-shadow(0 -1px 0 rgba(16,185,129,0.3))" }}
          >
            <div className="w-5 h-5 bg-[#0A192F] border-l border-t border-emerald-500/30 rotate-45 translate-y-2.5 mx-auto" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes onboard-pulse {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 6px rgba(16,185,129,0); }
        }
      `}</style>
    </>
  );
}
