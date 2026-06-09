import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  Search,
  CheckCircle2,
  Lock,
  Truck,
  Banknote,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Phone,
} from "lucide-react";

const MOCK_SELLERS = [
  {
    slug: "boutique-luna",
    name: "Boutique de Luna",
    phone: "+225 07 12 34 56",
    score: 100,
    sales: 45,
    disputes: 0,
    category: "Mode & Vêtements",
  },
  {
    slug: "tech-ibrahim",
    name: "Tech Ibrahim Store",
    phone: "+225 05 87 65 43",
    score: 98,
    sales: 132,
    disputes: 1,
    category: "Électronique",
  },
  {
    slug: "beaute-fatou",
    name: "Beauté by Fatou",
    phone: "+225 01 23 45 67",
    score: 100,
    sales: 78,
    disputes: 0,
    category: "Beauté & Soins",
  },
  {
    slug: "maison-kofi",
    name: "Maison Kofi Déco",
    phone: "+225 07 98 76 54",
    score: 96,
    sales: 34,
    disputes: 1,
    category: "Décoration",
  },
];

const STATS = [
  { label: "Vendeurs certifiés", value: "2,400+", icon: Users },
  { label: "Transactions sécurisées", value: "18,000+", icon: Shield },
  { label: "Taux de satisfaction", value: "99.2%", icon: Star },
  { label: "Volume sécurisé", value: "850M FCFA", icon: TrendingUp },
];

const STEPS = [
  {
    number: "01",
    icon: Lock,
    title: "Fonds sécurisés",
    description:
      "L'acheteur dépose le montant via Mobile Money. Les fonds sont bloqués sur le compte Verifio — ni le vendeur ni l'acheteur ne peut y accéder.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    number: "02",
    icon: Truck,
    title: "Le vendeur livre",
    description:
      "Le vendeur livre le produit ou service. L'acheteur dispose de 48h pour confirmer ou signaler un problème.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    number: "03",
    icon: Banknote,
    title: "Fonds libérés",
    description:
      "Après confirmation de réception, les fonds sont automatiquement virés au vendeur. Transaction complète, zéro risque.",
    color: "from-violet-500 to-purple-600",
  },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof MOCK_SELLERS>([]);
  const [showResults, setShowResults] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsTyping(true);
    const timer = setTimeout(() => {
      const filtered = MOCK_SELLERS.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.phone.includes(query) ||
          s.slug.includes(query.toLowerCase())
      );
      setResults(filtered);
      setShowResults(true);
      setIsTyping(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A192F] border-b border-white/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-emerald-500/20">
              <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Verifio
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Tiers de confiance
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shop/boutique-luna")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              Voir un profil
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/25"
            >
              Accéder au Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0A192F] pt-20 pb-32 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="animate-fade-up delay-100 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <img src="/logo.png" alt="" className="w-4 h-4 object-contain brightness-0 invert" />
            La sécurité du commerce social en Afrique
          </div>

          <h1 className="animate-fade-up delay-200 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Achetez en confiance.{" "}
            <span className="text-emerald-400">Vérifiez d'abord.</span>
          </h1>

          <p className="animate-fade-up delay-300 text-white/60 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Verifio sécurise vos paiements Mobile Money pour les achats sur
            WhatsApp et Instagram. Zéro arnaque, zéro stress.
          </p>

          {/* Search bar */}
          <div className="animate-fade-up delay-400 relative max-w-2xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-visible">
              <div className="flex items-center px-5 py-4 gap-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Vérifier un vendeur — nom, téléphone, ou slug..."
                  className="flex-1 text-gray-900 placeholder-gray-400 text-base bg-transparent outline-none"
                />
                {isTyping && (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </div>

              {/* Results dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {results.length === 0 ? (
                    <div className="px-5 py-6 text-center text-gray-500 text-sm">
                      Aucun vendeur trouvé pour "{query}"
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {results.map((seller) => (
                        <button
                          key={seller.slug}
                          onClick={() => navigate(`/shop/${seller.slug}`)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {seller.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-sm truncate">
                                {seller.name}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Vérifié
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {seller.category} · {seller.phone}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-emerald-600">
                              {seller.score}%
                            </div>
                            <div className="text-xs text-gray-400">Score</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-white/40 text-sm">Essayez :</span>
              {["Luna", "Ibrahim", "Fatou"].map((name) => (
                <button
                  key={name}
                  onClick={() => setQuery(name)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-all duration-150"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#0B132B] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center gap-1 animate-fade-up delay-${i * 100 + 100}`}
            >
              <stat.icon className="w-5 h-5 text-emerald-400 mb-1" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#0A192F]/5 text-[#0A192F] text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-[#0A192F]/10">
              Comment ça marche
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A192F] mb-4">
              Le paiement escrow,{" "}
              <span className="text-emerald-600">simplifié</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Trois étapes claires pour que chaque transaction soit sécurisée,
              transparente, et sans risque.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-emerald-300 to-emerald-300 -translate-y-1/2" />

            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group animate-fade-up delay-${i * 150 + 200}`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300`}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-5xl font-black text-gray-100 leading-none mt-1">
                    {step.number}
                  </div>
                </div>
                <h3 className="font-bold text-[#0A192F] text-xl mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#0A192F] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à sécuriser votre boutique ?
          </h2>
          <p className="text-white/60 mb-10">
            Rejoignez 2,400+ vendeurs certifiés qui utilisent Verifio pour
            vendre en toute confiance sur WhatsApp et Instagram.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-emerald-500/25 text-base"
            >
              <Shield className="w-5 h-5" />
              Certifier ma boutique
            </button>
            <button
              onClick={() => navigate("/shop/boutique-luna")}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 border border-white/20 text-base"
            >
              Voir un exemple de profil
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B132B] border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold">Verifio</span>
          </div>
          <p className="text-white/30 text-xs text-center">
            © 2026 Verifio. Tiers de confiance pour le commerce social africain.
          </p>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <a href="#" className="hover:text-white/60 transition-colors">
              Conditions
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
