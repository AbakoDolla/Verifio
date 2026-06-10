/**
 * PaymentLogos — Logos officiels des opérateurs Mobile Money Afrique de l'Ouest
 * MTN MoMo · Orange Money · Wave · Moov Money · Airtel Money
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export function MTNMoMoLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="9" fill="#FFCD00"/>
      {/* Yellow background matches MTN brand yellow */}
      <rect x="4" y="4" width="32" height="32" rx="6" fill="#FFCD00"/>
      {/* MTN wordmark */}
      <text x="20" y="18" textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif" fontWeight="900" fontSize="11" fill="#1A1A1A" dominantBaseline="middle">MTN</text>
      {/* MoMo sub-brand in MTN blue */}
      <text x="20" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" fill="#00549F" dominantBaseline="middle">MoMo</text>
    </svg>
  );
}

export function OrangeMoneyLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Orange brand background */}
      <rect width="40" height="40" rx="9" fill="#FF7900"/>
      {/* Orange circle mark */}
      <circle cx="20" cy="14" r="7" fill="none" stroke="white" strokeWidth="2.5"/>
      {/* "money" text */}
      <text x="20" y="28" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="7.5" fill="white" dominantBaseline="middle" letterSpacing="0.5">money</text>
      {/* Orange branding dot in circle */}
      <circle cx="20" cy="14" r="3" fill="white"/>
    </svg>
  );
}

export function WaveLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Wave brand teal-blue */}
      <rect width="40" height="40" rx="9" fill="#1AB4E5"/>
      {/* Stylized W / wave path */}
      <path d="M7 20 L11 14 L15 20 L19 14 L23 20 L27 14 L33 20" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* "wave" text */}
      <text x="20" y="31" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="9" fill="white" dominantBaseline="middle" letterSpacing="0.5">wave</text>
    </svg>
  );
}

export function MoovMoneyLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="9" fill="#00B74A"/>
      {/* Moov M logo */}
      <path d="M9 28 L9 16 L15.5 24 L20 18 L24.5 24 L31 16 L31 28" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="20" y="35" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="6" fill="white" dominantBaseline="middle" letterSpacing="0.5">MONEY</text>
    </svg>
  );
}

export function AirtelMoneyLogo({ size = 40, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="9" fill="#E40000"/>
      {/* Airtel arc mark */}
      <path d="M20 8 C28 8 34 13 34 20" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M20 13 C25.5 13 30 16 30 20" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="3" fill="white"/>
      <text x="20" y="32" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="7" fill="white" dominantBaseline="middle" letterSpacing="0.5">airtel</text>
    </svg>
  );
}

const LOGO_MAP: Record<string, (props: LogoProps) => JSX.Element> = {
  mtn:    MTNMoMoLogo,
  orange: OrangeMoneyLogo,
  wave:   WaveLogo,
  moov:   MoovMoneyLogo,
  airtel: AirtelMoneyLogo,
};

const LABEL_MAP: Record<string, string> = {
  mtn:    "MTN MoMo",
  orange: "Orange Money",
  wave:   "Wave",
  moov:   "Moov Money",
  airtel: "Airtel Money",
};

/** Logo seul, utilisable dans les sélecteurs */
export function OperatorLogo({ id, size = 36, className }: { id: string; size?: number; className?: string }) {
  const Logo = LOGO_MAP[id.toLowerCase()];
  if (!Logo) return null;
  return <Logo size={size} className={className} />;
}

/** Badge pill avec logo + nom, pour les sections de présentation */
export function OperatorBadge({ id, size = "sm" }: { id: string; size?: "sm" | "md" }) {
  const Logo = LOGO_MAP[id.toLowerCase()];
  const label = LABEL_MAP[id.toLowerCase()] ?? id;
  if (!Logo) return null;
  return size === "sm" ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm shadow">
      <Logo size={18} />
      <span className="text-white text-xs font-bold">{label}</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow border border-gray-100">
      <Logo size={28} />
      <span className="text-gray-800 text-sm font-bold">{label}</span>
    </div>
  );
}
