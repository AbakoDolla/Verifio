/**
 * LandingPage — Page d'accueil publique Verifio
 *
 * BACKEND HOOKS :
 * ─────────────────────────────────────────
 * • GET /api/vendors/search?q={q}&limit=5   → VendorSearchResult[]
 * • GET /api/stats/public                   → PlatformStats (cache CDN 1h)
 * • GET /api/testimonials?featured=true     → Testimonial[]
 * • GET /api/vendors/featured?limit=8       → FeaturedVendor[]
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Search, CheckCircle2, Lock, Truck, Banknote, ArrowRight,
  Star, Users, TrendingUp, Shield, X, ChevronRight,
  Smartphone, MessageCircle, Instagram, ChevronLeft,
  ShoppingBag, Cpu, Flower2, Utensils, Sofa, Gem,
} from "lucide-react";

// ─── IMAGES ───────────────────────────────────────────────────────────────
const IMG = {
  // Produits mode africaine (Unsplash — libres de droits)
  fashion1: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=480&h=480&fit=crop&q=80",
  fashion2: "https://images.unsplash.com/photo-1614267861476-0d127425e31e?w=480&h=480&fit=crop&q=80",
  fashion3: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=480&h=480&fit=crop&q=80",
  fashion4: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=480&h=480&fit=crop&q=80",
  // Marché / lifestyle africain
  market1:  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=480&h=320&fit=crop&q=80",
  market2:  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=480&h=320&fit=crop&q=80",
  // Paiement mobile
  momo1:    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=320&fit=crop&q=80",
  // Portraits
  person1:  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&q=80",
  person2:  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80",
  person3:  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&q=80",
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
// TODO BACKEND: GET /api/vendors/search?q={q}
const MOCK_SELLERS = [
  { slug: "boutique-luna",  name: "Boutique de Luna",   phone: "+225 07 12 34 56", score: 100, sales: 45,  category: "Mode & Vêtements",  initials: "BL", img: IMG.fashion1 },
  { slug: "tech-ibrahim",   name: "Tech Ibrahim Store", phone: "+225 05 87 65 43", score: 98,  sales: 132, category: "Électronique",      initials: "TI", img: IMG.market2  },
  { slug: "beaute-fatou",   name: "Beauté by Fatou",    phone: "+225 01 23 45 67", score: 100, sales: 78,  category: "Beauté & Soins",    initials: "BF", img: IMG.fashion2 },
  { slug: "maison-kofi",    name: "Maison Kofi Déco",   phone: "+225 07 98 76 54", score: 96,  sales: 34,  category: "Décoration",         initials: "MK", img: IMG.market1  },
  { slug: "agro-abena",     name: "Agro Abena Market",  phone: "+225 05 11 22 33", score: 99,  sales: 61,  category: "Alimentation",       initials: "AA", img: IMG.fashion4 },
];

// TODO BACKEND: GET /api/vendors/featured?limit=8
const FEATURED_VENDORS = [
  { slug: "boutique-luna",  name: "Boutique de Luna",   category: "Mode",        score: 100, img: IMG.fashion1, badge: "⭐ Top vendeur" },
  { slug: "beaute-fatou",   name: "Beauté by Fatou",    category: "Beauté",      score: 100, img: IMG.fashion2, badge: "🔥 Tendance"   },
  { slug: "tech-ibrahim",   name: "Tech Ibrahim",        category: "Électronique", score: 98, img: IMG.market2,  badge: "✓ Fiable"      },
  { slug: "maison-kofi",    name: "Maison Kofi",         category: "Déco",        score: 96,  img: IMG.market1,  badge: "🆕 Nouveau"    },
];

// TODO BACKEND: GET /api/stats/public
const PLATFORM_STATS = [
  { label: "Vendeurs certifiés",      value: "2 400+",   icon: Users,      color: "text-emerald-400" },
  { label: "Transactions sécurisées", value: "18 000+",  icon: Shield,     color: "text-blue-400"    },
  { label: "Taux de satisfaction",    value: "99,2 %",   icon: Star,       color: "text-amber-400"   },
  { label: "Volume escrow",           value: "850M FCFA", icon: TrendingUp, color: "text-violet-400"  },
];

const STEPS = [
  { number: "01", icon: Lock,     color: "from-emerald-500 to-teal-600", title: "Fonds sécurisés",
    desc: "L'acheteur paie via Mobile Money. Les fonds sont immédiatement bloqués sur le compte séquestre Verifio." },
  { number: "02", icon: Truck,    color: "from-blue-500 to-indigo-600",  title: "Le vendeur livre",
    desc: "Le vendeur reçoit une notification et expédie. Vous avez 48h pour confirmer ou signaler un problème." },
  { number: "03", icon: Banknote, color: "from-violet-500 to-purple-600",title: "Argent libéré",
    desc: "Après confirmation, les fonds sont virés automatiquement. En cas de litige, Verifio arbitre et rembourse." },
];

const CATEGORIES = [
  { label: "Mode & Vêtements", icon: ShoppingBag, color: "bg-pink-50 text-pink-600 border-pink-100",    img: IMG.fashion1 },
  { label: "Électronique",     icon: Cpu,          color: "bg-blue-50 text-blue-600 border-blue-100",   img: IMG.market2  },
  { label: "Beauté & Soins",   icon: Flower2,      color: "bg-rose-50 text-rose-600 border-rose-100",   img: IMG.fashion2 },
  { label: "Alimentation",     icon: Utensils,     color: "bg-green-50 text-green-600 border-green-100",img: IMG.market1  },
  { label: "Décoration",       icon: Sofa,         color: "bg-amber-50 text-amber-600 border-amber-100",img: IMG.fashion4 },
  { label: "Bijoux & Accès.",  icon: Gem,          color: "bg-violet-50 text-violet-600 border-violet-100",img: IMG.fashion3 },
];

// TODO BACKEND: GET /api/testimonials?featured=true
const TESTIMONIALS = [
  { name: "Aminata K.", location: "Abidjan", img: IMG.person1, text: "J'ai acheté une robe de 45 000 FCFA sans jamais avoir peur d'être arnaquée. Verifio a tout sécurisé.", stars: 5 },
  { name: "Kofi Mensah", location: "Accra", img: IMG.person2, text: "En tant que vendeur, mes clients me font confiance dès le premier achat grâce à mon badge certifié.", stars: 5 },
  { name: "Mariama S.", location: "Dakar", img: IMG.person3, text: "Simple, rapide, et le support répond en moins de 2h. Je recommande à tous mes amis vendeurs.", stars: 5 },
];

// ─── COMPOSANT ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, navigate] = useLocation();
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<typeof MOCK_SELLERS>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // ── Search debounce ──────────────────────────────────────────────────────
  // TODO BACKEND: fetch(`/api/vendors/search?q=${query}&limit=5`)
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Featured vendors auto-rotate ─────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setFeaturedIdx(i => (i + 1) % FEATURED_VENDORS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#0A192F]/96 backdrop-blur-lg border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-white rounded-xl p-1 shadow-lg shadow-emerald-500/20">
                <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
              </div>
              <span className="text-white font-black text-lg tracking-tight">Verifio</span>
              <span className="hidden sm:inline-flex text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full tracking-wide">BÊTA</span>
            </button>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#how" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Comment ça marche</a>
              <a href="#vendors" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Vendeurs</a>
              <a href="#testimonials" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Témoignages</a>
            </nav>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => navigate("/dashboard")} className="hidden sm:inline-flex text-white/70 hover:text-white text-sm font-medium px-3 py-2 transition-colors">
                Espace vendeur
              </button>
              <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/30">
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setMobileMenuOpen(v => !v)} className="md:hidden w-9 h-9 rounded-xl bg-white/10 flex flex-col items-center justify-center gap-1.5">
                <span className={`block h-0.5 w-4 bg-white transition-all duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 w-4 bg-white transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-4 bg-white transition-all duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-3 space-y-0.5 animate-fade-up">
              {[
                { label: "Vendeurs certifiés", action: () => { setMobileMenuOpen(false); document.getElementById("vendors")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Comment ça marche",  action: () => { setMobileMenuOpen(false); document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Témoignages",        action: () => { setMobileMenuOpen(false); document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Dashboard vendeur",  action: () => navigate("/dashboard") },
              ].map(item => (
                <button key={item.label} onClick={item.action} className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors">
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0A192F] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-40 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-3xl" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Text + search */}
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-7">
                <div className="flex -space-x-1">
                  {[IMG.person1, IMG.person2, IMG.person3].map((img, i) => (
                    <img key={i} src={img} alt="" className="w-5 h-5 rounded-full border-2 border-[#0A192F] object-cover" />
                  ))}
                </div>
                2 400+ vendeurs certifiés vous font confiance
              </div>

              <h1 className="animate-fade-up delay-100 text-[clamp(2.2rem,6vw,3.75rem)] font-black text-white leading-[1.08] tracking-tight mb-5">
                N'achetez plus jamais<br />
                <span className="text-emerald-400">avec la peur au ventre.</span>
              </h1>

              <p className="animate-fade-up delay-200 text-white/55 text-base sm:text-lg leading-relaxed mb-10 max-w-lg">
                Verifio est le <strong className="text-white/80 font-semibold">tiers de confiance</strong> des achats WhatsApp & Instagram.
                Vérifiez un vendeur, payez en escrow Mobile Money, récupérez votre argent si problème.
              </p>

              {/* Search */}
              {/* TODO BACKEND: GET /api/vendors/search?q={query} */}
              <div ref={searchRef} className="animate-fade-up delay-300 relative">
                <div className={`flex items-center bg-white rounded-2xl shadow-2xl shadow-black/30 ${showResults ? "rounded-b-none" : ""}`}>
                  <div className="flex-shrink-0 pl-4 sm:pl-5">
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
                    className="flex-1 px-3 sm:px-4 py-4 text-gray-900 placeholder-gray-400 text-sm sm:text-base bg-transparent outline-none"
                  />
                  {query && (
                    <button onClick={() => { setQuery(""); setShowResults(false); }} className="pr-3 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button className="flex-shrink-0 m-2 bg-[#0A192F] hover:bg-[#0d2040] text-white text-sm font-bold px-4 sm:px-5 py-3 rounded-xl transition-colors">
                    Vérifier
                  </button>
                </div>

                {showResults && (
                  <div className="absolute top-full left-0 right-0 bg-white rounded-b-2xl shadow-2xl border border-t-0 border-gray-100 overflow-hidden z-50">
                    {results.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Aucun vendeur certifié pour <strong>"{query}"</strong></p>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b border-gray-50 flex justify-between">
                          <span className="text-xs text-gray-400">{results.length} résultat{results.length > 1 ? "s" : ""}</span>
                          <span className="text-xs text-emerald-600 font-semibold">Vendeurs certifiés ✓</span>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                          {results.map(s => (
                            <button key={s.slug} onClick={() => { navigate(`/shop/${s.slug}`); setShowResults(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-emerald-50/50 text-left group">
                              <img src={s.img} alt={s.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-sm truncate">{s.name}</span>
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Certifié
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400">{s.category} · {s.phone}</div>
                              </div>
                              <div className="text-sm font-black text-emerald-600 flex-shrink-0">{s.score}%</div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Quick chips */}
              <div className="animate-fade-up delay-400 flex flex-wrap items-center gap-2 mt-4">
                <span className="text-white/30 text-xs">Essayez :</span>
                {["Luna", "Ibrahim", "Fatou", "Kofi"].map(n => (
                  <button key={n} onClick={() => setQuery(n)}
                    className="text-xs bg-white/8 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-all font-medium">
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Featured vendor carousel */}
            <div className="hidden lg:block animate-fade-up delay-200">
              <div className="relative">
                {/* Main card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/40 aspect-[4/5] bg-gray-900">
                  {FEATURED_VENDORS.map((v, i) => (
                    <div key={v.slug} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === featuredIdx ? 1 : 0 }}>
                      <img src={v.img} alt={v.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Overlay info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">{v.badge}</span>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-white font-black text-lg leading-tight">{v.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/60 text-sm">{v.category}</span>
                              <span className="text-emerald-400 font-bold text-sm">{v.score}% confiance</span>
                            </div>
                          </div>
                          <button onClick={() => navigate(`/shop/${v.slug}`)} className="ml-auto w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Dot indicators */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {FEATURED_VENDORS.map((_, i) => (
                      <button key={i} onClick={() => setFeaturedIdx(i)} className={`rounded-full transition-all duration-300 ${i === featuredIdx ? "w-6 h-1.5 bg-emerald-400" : "w-1.5 h-1.5 bg-white/40"}`} />
                    ))}
                  </div>

                  {/* Nav arrows */}
                  <button onClick={() => setFeaturedIdx(i => (i - 1 + FEATURED_VENDORS.length) % FEATURED_VENDORS.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setFeaturedIdx(i => (i + 1) % FEATURED_VENDORS.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Floating badges */}
                <div className="absolute -left-6 top-16 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2.5 border border-gray-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#0A192F]">18 000+ transactions</div>
                    <div className="text-[10px] text-gray-400">sécurisées ce mois</div>
                  </div>
                </div>
                <div className="absolute -right-6 bottom-24 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2.5 border border-gray-100">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#0A192F]">99,2% satisfaction</div>
                    <div className="text-[10px] text-gray-400">acheteurs & vendeurs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
          TODO BACKEND: GET /api/stats/public
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0B132B] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
            {PLATFORM_STATS.map((s, i) => (
              <div key={s.label} className={`flex flex-col items-center text-center gap-1 py-5 sm:py-7 px-4 animate-fade-up delay-${i * 100 + 100}`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-1.5`} />
                <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                <div className="text-[11px] text-white/40 leading-tight max-w-[100px] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECURITY BADGES
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-7 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-3">
            {[
              { icon: Lock,         label: "Paiement escrow certifié" },
              { icon: Shield,       label: "Identité vendeur vérifiée" },
              { icon: CheckCircle2, label: "Remboursement garanti" },
              { icon: Smartphone,   label: "MTN · Orange · Wave" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-gray-500">
                <b.icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES GRID — Parcourir par catégorie
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#0A192F]/6 text-[#0A192F] text-xs font-bold px-4 py-2 rounded-full mb-3 border border-[#0A192F]/10 tracking-wide">
                CATÉGORIES
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F]">Trouvez un vendeur<br className="sm:hidden" /> certifié près de vous</h2>
            </div>
            <button onClick={() => navigate("/shop/boutique-luna")} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 self-start sm:self-auto">
              Voir tous les vendeurs <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => navigate("/shop/boutique-luna")}
                className={`group relative overflow-hidden rounded-2xl border-2 bg-white p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up delay-${i * 80 + 100} ${cat.color.split(" ").slice(-1)[0]}`}
              >
                <div className={`w-12 h-12 ${cat.color.split(" ").slice(0, 2).join(" ")} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-[#0A192F] text-xs leading-tight">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED VENDORS — Vendeurs en vedette
          TODO BACKEND: GET /api/vendors/featured?limit=8
      ══════════════════════════════════════════════════════ */}
      <section id="vendors" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-4 border border-emerald-200 tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5" /> VENDEURS CERTIFIÉS
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A192F] mb-3">
              Ils vendent avec confiance
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
              Chaque vendeur a été vérifié par Verifio. Commandez en toute sérénité.
            </p>
          </div>

          {/* Scrollable cards — mobile swipe, desktop grid */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible snap-x snap-mandatory sm:snap-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {MOCK_SELLERS.map((v, i) => (
              <div
                key={v.slug}
                className="flex-none w-64 sm:w-auto snap-start animate-fade-up"
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <button
                  onClick={() => navigate(`/shop/${v.slug}`)}
                  className="group w-full bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-left"
                >
                  {/* Product image */}
                  <div className="relative h-44 sm:h-52 overflow-hidden bg-gray-100">
                    <img
                      src={v.img}
                      alt={v.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=480&h=320&fit=crop"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Certifié
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full">
                      {v.score}% ⭐
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="p-4">
                    <div className="font-black text-[#0A192F] text-sm mb-0.5 truncate">{v.name}</div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-400 text-xs">{v.category}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 text-xs">{v.sales} ventes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        {v.phone}
                      </span>
                      <div className="w-8 h-8 bg-[#0A192F] group-hover:bg-emerald-500 rounded-xl flex items-center justify-center transition-colors duration-200">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section id="how" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#0A192F]/6 text-[#0A192F] text-xs font-bold px-4 py-2 rounded-full mb-4 border border-[#0A192F]/10 tracking-wide">COMMENT ÇA MARCHE</div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0A192F] mb-4">
              Le paiement escrow, <span className="text-emerald-600">en 3 étapes</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Chaque centime est protégé de votre premier clic jusqu'à la livraison confirmée.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-8 relative">
            <div className="hidden sm:block absolute top-14 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-0.5 bg-gradient-to-r from-emerald-300 via-blue-300 to-violet-300 opacity-40" />
            {STEPS.map((s, i) => (
              <div key={i} className={`group relative bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-up delay-${i * 150 + 200}`}>
                <div className="absolute top-6 right-6 text-6xl font-black text-gray-100 leading-none select-none">{s.number}</div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-black text-[#0A192F] text-lg mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
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
          MOBILE MONEY VISUAL — Opérateurs supportés
      ══════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left image */}
            <div className="relative order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10 aspect-video lg:aspect-square max-w-sm mx-auto lg:max-w-none">
                <img
                  src={IMG.momo1}
                  alt="Paiement Mobile Money sécurisé"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0A192F]/60 to-transparent" />
              </div>
              {/* Operator pills */}
              <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 flex gap-2 flex-wrap">
                {[
                  { name: "MTN MoMo",     color: "#FFC107", text: "#000" },
                  { name: "Orange Money", color: "#FF6B00", text: "#fff" },
                  { name: "Wave",         color: "#1A73E8", text: "#fff" },
                ].map(op => (
                  <div key={op.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20" style={{ backgroundColor: op.color, color: op.text }}>
                    <Smartphone className="w-3 h-3" /> {op.name}
                  </div>
                ))}
              </div>
            </div>
            {/* Right text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-5 border border-blue-200 tracking-wide">
                <Smartphone className="w-3.5 h-3.5" /> MOBILE MONEY
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A192F] mb-5 leading-tight">
                Compatible avec tous vos opérateurs Mobile Money
              </h2>
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-7">
                MTN Mobile Money, Orange Money et Wave — les 3 opérateurs les plus utilisés en Afrique de l'Ouest sont tous supportés. Payez avec le numéro que vous utilisez déjà.
              </p>
              <div className="space-y-3">
                {[
                  "Aucun compte bancaire requis",
                  "Paiement en 30 secondes depuis votre téléphone",
                  "Confirmation instantanée par SMS",
                  "Fonds bloqués immédiatement en escrow",
                ].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
          TODO BACKEND: GET /api/testimonials?featured=true&limit=3
      ══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-4 border border-amber-200 tracking-wide">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> TÉMOIGNAGES
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0A192F] mb-3">Ils nous font confiance</h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">Des milliers d'acheteurs et vendeurs utilisent Verifio chaque jour.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up delay-${i * 150 + 100}`}>
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
          CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0A192F] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl p-1.5 mx-auto mb-7 shadow-xl shadow-emerald-500/20">
            <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Prêt à vendre en toute confiance ?
          </h2>
          <p className="text-white/55 text-sm sm:text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Rejoignez 2 400+ commerçants certifiés. Inscription gratuite, mise en ligne en 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/dashboard")} className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/25 text-sm sm:text-base">
              <Shield className="w-5 h-5" /> Certifier ma boutique — Gratuit
            </button>
            <button onClick={() => navigate("/shop/boutique-luna")} className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-2xl transition-all border border-white/15 text-sm sm:text-base">
              Voir un exemple <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="bg-[#060D1B] border-t border-white/5 pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg p-0.5"><img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" /></div>
                <span className="text-white font-black text-base">Verifio</span>
              </div>
              <p className="text-white/35 text-xs leading-relaxed max-w-xs mb-5">
                Le tiers de confiance du commerce social africain. Sécurisez vos paiements Mobile Money sur WhatsApp et Instagram.
              </p>
              <div className="flex gap-2.5">
                {[MessageCircle, Instagram, Smartphone].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-white/50" />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: "Plateforme", links: ["Rechercher un vendeur", "Paiement escrow", "Litiges", "FAQ"] },
              { title: "Vendeurs",   links: ["Certifier ma boutique", "Dashboard", "Mon QR Code", "Tarifs"] },
              { title: "Légal",      links: ["Conditions générales", "Confidentialité", "Mentions légales", "Contact"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white/60 font-bold text-xs tracking-widest uppercase mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => <li key={l}><a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
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
