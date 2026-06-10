/**
 * LandingPage — Page d'accueil publique Verifio
 *
 * BACKEND HOOKS (à remplacer par des appels API réels) :
 * ─────────────────────────────────────────────────────
 * 1. Recherche vendeurs : GET /api/vendors/search?q={query}&limit=5
 *    → Retourne : VendorSearchResult[] { slug, name, phone, score, sales, disputes, category, isVerified }
 *
 * 2. Stats globales : GET /api/stats/public
 *    → Retourne : { totalVendors, totalTransactions, satisfactionRate, totalVolumeFCFA }
 *    → Mettre en cache côté CDN (TTL: 1h)
 *
 * 3. Témoignages : GET /api/testimonials?limit=3&featured=true
 *    → Retourne : Testimonial[] { id, name, avatar, text, location, date }
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Search, CheckCircle2, Lock, Truck, Banknote, ArrowRight,
  Star, Users, TrendingUp, Shield, X, ChevronRight,
  Smartphone, MessageCircle, Instagram,
} from "lucide-react";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
// TODO BACKEND: Remplacer par GET /api/vendors/search?q={query}
const MOCK_SELLERS = [
  { slug: "boutique-luna",  name: "Boutique de Luna",    phone: "+225 07 12 34 56", score: 100, sales: 45,  disputes: 0, category: "Mode & Vêtements",  initials: "BL" },
  { slug: "tech-ibrahim",   name: "Tech Ibrahim Store",  phone: "+225 05 87 65 43", score: 98,  sales: 132, disputes: 1, category: "Électronique",       initials: "TI" },
  { slug: "beaute-fatou",   name: "Beauté by Fatou",     phone: "+225 01 23 45 67", score: 100, sales: 78,  disputes: 0, category: "Beauté & Soins",     initials: "BF" },
  { slug: "maison-kofi",    name: "Maison Kofi Déco",    phone: "+225 07 98 76 54", score: 96,  sales: 34,  disputes: 1, category: "Décoration",          initials: "MK" },
  { slug: "agro-abena",     name: "Agro Abena Market",   phone: "+225 05 11 22 33", score: 99,  sales: 61,  disputes: 0, category: "Alimentation",        initials: "AA" },
];

// TODO BACKEND: Remplacer par GET /api/stats/public
const PLATFORM_STATS = [
  { label: "Vendeurs certifiés",       value: "2 400+",   icon: Users,        color: "text-emerald-400" },
  { label: "Transactions sécurisées",  value: "18 000+",  icon: Shield,       color: "text-blue-400"    },
  { label: "Taux de satisfaction",     value: "99,2 %",   icon: Star,         color: "text-amber-400"   },
  { label: "Volume escrow",            value: "850M FCFA", icon: TrendingUp,  color: "text-violet-400"  },
];

const STEPS = [
  {
    number: "01", icon: Lock,    color: "from-emerald-500 to-teal-600",
    title: "Fonds sécurisés",
    desc: "L'acheteur paie via Mobile Money. Les fonds sont immédiatement bloqués sur le compte séquestre Verifio. Ni vous, ni le vendeur n'y avez accès.",
  },
  {
    number: "02", icon: Truck,   color: "from-blue-500 to-indigo-600",
    title: "Le vendeur livre",
    desc: "Le vendeur reçoit une notification et expédie la commande. Vous disposez de 48 h pour confirmer la réception ou signaler un problème.",
  },
  {
    number: "03", icon: Banknote, color: "from-violet-500 to-purple-600",
    title: "Argent libéré",
    desc: "Après votre confirmation, les fonds sont virés automatiquement au vendeur. En cas de litige, Verifio arbitre et vous rembourse.",
  },
];

// TODO BACKEND: Remplacer par GET /api/testimonials?featured=true
const TESTIMONIALS = [
  { name: "Aminata K.",   location: "Abidjan",   initials: "AK", text: "J'ai acheté une robe de 45 000 FCFA sans jamais avoir peur d'être arnaquée. Verifio a tout sécurisé.", stars: 5 },
  { name: "Kofi Mensah",  location: "Accra",     initials: "KM", text: "En tant que vendeur, mes clients me font maintenant confiance dès le premier achat grâce à mon badge.", stars: 5 },
  { name: "Mariama S.",   location: "Dakar",     initials: "MS", text: "Le processus est simple, rapide, et le support répond en moins de 2 h. Impeccable !", stars: 5 },
];

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, navigate] = useLocation();
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<typeof MOCK_SELLERS>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Search debounce ──────────────────────────────────────────────────────
  // TODO BACKEND: Remplacer par fetch(`/api/vendors/search?q=${query}&limit=5`)
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    setIsSearching(true);
    const t = setTimeout(() => {
      const q = query.toLowerCase();
      setResults(MOCK_SELLERS.filter(
        s => s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.slug.includes(q) || s.category.toLowerCase().includes(q)
      ));
      setShowResults(true);
      setIsSearching(false);
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════════════
          HEADER — Navigation principale
      ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#0A192F]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-white rounded-xl p-1 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
              </div>
              <span className="text-white font-black text-lg tracking-tight">Verifio</span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full tracking-wide">
                BÊTA
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate("/shop/boutique-luna")} className="text-white/60 hover:text-white text-sm font-medium transition-colors">
                Voir un profil
              </button>
              <a href="#how" className="text-white/60 hover:text-white text-sm font-medium transition-colors">
                Comment ça marche
              </a>
              <a href="#testimonials" className="text-white/60 hover:text-white text-sm font-medium transition-colors">
                Témoignages
              </a>
            </nav>

            {/* CTA buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden sm:inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors px-3 py-2"
              >
                Espace vendeur
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              {/* Mobile menu */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="md:hidden w-9 h-9 rounded-xl bg-white/10 flex flex-col items-center justify-center gap-1.5"
              >
                <span className={`block h-0.5 w-4 bg-white transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 w-4 bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-4 bg-white transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </button>
            </div>
          </div>

          {/* Mobile menu drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-1 animate-fade-up">
              {[
                { label: "Voir un profil vendeur", action: () => { navigate("/shop/boutique-luna"); setMobileMenuOpen(false); } },
                { label: "Comment ça marche", action: () => { setMobileMenuOpen(false); document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Témoignages", action: () => { setMobileMenuOpen(false); document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Espace vendeur (Dashboard)", action: () => { navigate("/dashboard"); setMobileMenuOpen(false); } },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO — Section principale
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0A192F] relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-40 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-violet-500/6 rounded-full blur-3xl" />
          {/* Top divider line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center">

          {/* Trust pill */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 sm:mb-10">
            <div className="flex -space-x-1">
              {["AK","KM","MS"].map(i => (
                <div key={i} className="w-5 h-5 rounded-full bg-emerald-600 border-2 border-[#0A192F] flex items-center justify-center text-[8px] font-bold text-white">{i[0]}</div>
              ))}
            </div>
            <span>2 400+ vendeurs certifiés vous font confiance</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-[clamp(2rem,8vw,4rem)] font-black text-white leading-[1.1] tracking-tight mb-6">
            N'achetez plus jamais<br />
            <span className="text-emerald-400">avec la peur au ventre.</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up delay-200 text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-14">
            Verifio est le <strong className="text-white/80 font-semibold">tiers de confiance</strong> des achats WhatsApp & Instagram en Afrique.
            Vérifiez un vendeur en 2 secondes, payez en escrow Mobile Money, récupérez votre argent si problème.
          </p>

          {/* ── Search bar ─────────────────────────────────── */}
          {/* TODO BACKEND: connecter à GET /api/vendors/search?q={query} */}
          <div ref={searchRef} className="animate-fade-up delay-300 relative max-w-2xl mx-auto mb-6">
            <div className={`flex items-center bg-white rounded-2xl shadow-2xl shadow-black/30 transition-all duration-200 ${showResults ? "rounded-b-none border-b border-gray-100" : ""}`}>
              <div className="flex-shrink-0 pl-5">
                {isSearching
                  ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  : <Search className="w-5 h-5 text-gray-400" />
                }
              </div>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Nom du vendeur, téléphone, slug…"
                className="flex-1 px-4 py-4 sm:py-5 text-gray-900 placeholder-gray-400 text-sm sm:text-base bg-transparent outline-none"
              />
              {query && (
                <button onClick={() => { setQuery(""); setShowResults(false); }} className="pr-4 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { if (results.length === 1) navigate(`/shop/${results[0].slug}`); }}
                className="flex-shrink-0 m-2 bg-[#0A192F] hover:bg-[#0d2040] text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors hidden sm:block"
              >
                Vérifier
              </button>
            </div>

            {/* Results dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-b-2xl shadow-2xl shadow-black/20 border border-t-0 border-gray-100 overflow-hidden z-50">
                {results.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucun vendeur certifié trouvé pour <strong>"{query}"</strong></p>
                    <p className="text-gray-400 text-xs mt-1">Ce vendeur n'est peut-être pas encore certifié Verifio.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">{results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}</span>
                      <span className="text-xs text-emerald-600 font-semibold">Vendeurs certifiés ✓</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {results.map(s => (
                        <button
                          key={s.slug}
                          onClick={() => { navigate(`/shop/${s.slug}`); setShowResults(false); }}
                          className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-emerald-50/50 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                            {s.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900 text-sm truncate">{s.name}</span>
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Certifié
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">{s.category} · {s.phone}</div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-black text-emerald-600">{s.score}%</div>
                              <div className="text-[10px] text-gray-400">Score</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div className="animate-fade-up delay-400 flex flex-wrap items-center justify-center gap-2">
            <span className="text-white/30 text-xs">Essayez :</span>
            {["Luna", "Ibrahim", "Fatou", "Kofi"].map(n => (
              <button
                key={n}
                onClick={() => setQuery(n)}
                className="text-xs bg-white/8 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-all duration-150 font-medium"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR — Chiffres de la plateforme
          TODO BACKEND: GET /api/stats/public
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0B132B] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-white/5">
            {PLATFORM_STATS.map((s, i) => (
              <div key={s.label} className={`flex flex-col items-center text-center gap-1 py-6 px-4 animate-fade-up delay-${i * 100 + 100}`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                <div className="text-[11px] text-white/40 leading-tight max-w-[100px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECURITY BADGES — Bande de réassurance
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-8 sm:py-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              { icon: Lock,         label: "Paiement escrow certifié" },
              { icon: Shield,       label: "Identité vendeur vérifiée" },
              { icon: CheckCircle2, label: "Remboursement garanti" },
              { icon: Smartphone,   label: "Compatible MTN · Orange · Wave" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-gray-500">
                <b.icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — 3 étapes
      ══════════════════════════════════════════════════════ */}
      <section id="how" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#0A192F]/6 text-[#0A192F] text-xs font-bold px-4 py-2 rounded-full mb-4 border border-[#0A192F]/10 tracking-wide">
              COMMENT ÇA MARCHE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] leading-tight mb-4">
              Le paiement escrow,{" "}
              <span className="text-emerald-600">en 3 étapes simples</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              Chaque centime est protégé de votre premier clic jusqu'à la livraison confirmée.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Desktop connector */}
            <div className="hidden sm:block absolute top-14 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-0.5 bg-gradient-to-r from-emerald-300 via-blue-300 to-violet-300 opacity-40" />

            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`group relative bg-white rounded-3xl p-7 sm:p-8 shadow-sm border border-gray-100/80 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-up delay-${i * 150 + 200}`}
              >
                {/* Step number */}
                <div className="absolute top-6 right-6 text-6xl font-black text-gray-100 leading-none select-none">{s.number}</div>

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-black text-[#0A192F] text-lg mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>

                {/* Connector arrow mobile */}
                {i < 2 && (
                  <div className="sm:hidden flex justify-center mt-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS — Avis utilisateurs
          TODO BACKEND: GET /api/testimonials?featured=true&limit=3
      ══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-4 border border-amber-200 tracking-wide">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> TÉMOIGNAGES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A192F] mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">Des milliers d'acheteurs et vendeurs utilisent Verifio chaque jour.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`bg-[#F8FAFC] rounded-3xl p-6 sm:p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up delay-${i * 150 + 100}`}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-[#0A192F] text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.location}</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — Call to action final
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0A192F] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl p-1.5 mx-auto mb-8 shadow-xl shadow-emerald-500/20">
            <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight">
            Prêt à vendre en toute confiance ?
          </h2>
          <p className="text-white/55 text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Rejoignez 2 400+ commerçants certifiés qui ont éliminé les arnaques de leur activité sur les réseaux sociaux.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-emerald-500/25 text-base"
            >
              <Shield className="w-5 h-5" />
              Certifier ma boutique — Gratuit
            </button>
            <button
              onClick={() => navigate("/shop/boutique-luna")}
              className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 border border-white/15 text-base"
            >
              Voir un exemple
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="bg-[#060D1B] border-t border-white/5 pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Footer top */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg p-0.5">
                  <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
                </div>
                <span className="text-white font-black text-base">Verifio</span>
              </div>
              <p className="text-white/35 text-xs leading-relaxed max-w-xs">
                Le tiers de confiance du commerce social africain. Sécurisez vos paiements Mobile Money sur WhatsApp et Instagram.
              </p>
              <div className="flex gap-3 mt-5">
                {[MessageCircle, Instagram, Smartphone].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-white/50" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: "Plateforme",    links: ["Rechercher un vendeur", "Paiement escrow", "Litiges & remboursements", "FAQ"] },
              { title: "Vendeurs",      links: ["Certifier ma boutique", "Dashboard vendeur", "Mon QR Code", "Tarifs"] },
              { title: "Légal",         links: ["Conditions générales", "Confidentialité", "Mentions légales", "Contact"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white/70 font-semibold text-xs tracking-widest uppercase mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer bottom */}
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">© 2026 Verifio · Tiers de confiance pour le commerce social africain</p>
            <div className="flex items-center gap-1.5 text-xs text-white/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Tous les systèmes opérationnels
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
