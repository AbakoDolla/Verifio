/**
 * VendorProfile — Profil public vendeur + carousel produits + paiement escrow
 *
 * BACKEND HOOKS :
 * ─────────────────────────────────────────
 * • GET /api/vendors/{slug}                     → VendorProfile
 * • GET /api/vendors/{slug}/reviews?limit=3     → Review[]
 * • GET /api/vendors/{slug}/products?limit=8    → Product[] { id, name, price, imgUrl, inStock }
 * • POST /api/escrow/initiate                   → { transactionId, mobileMoneyRef }
 * • GET /api/escrow/{transactionId}/status      → polling statut
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle2, Star, Phone, Instagram, Lock, X, ChevronLeft, ChevronRight,
  AlertTriangle, TrendingUp, ShoppingBag, ArrowRight, Smartphone,
  Wallet, Shield, Clock, MessageCircle, Info, Package,
} from "lucide-react";

// ─── IMAGES ───────────────────────────────────────────────────────────────
const PRODUCT_IMAGES = [
  { url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop&q=80", label: "Robe wax bleue",       price: 15000 },
  { url: "https://images.unsplash.com/photo-1614267861476-0d127425e31e?w=600&h=600&fit=crop&q=80", label: "Ensemble 3 pièces",   price: 45000 },
  { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=600&fit=crop&q=80", label: "Tenue soirée dorée",  price: 38000 },
  { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop&q=80", label: "Robe imprimée M",     price: 22000 },
  { url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=600&fit=crop&q=80", label: "Collection Ankara",   price: 19500 },
];

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
// TODO BACKEND: GET /api/vendors/{slug}
const VENDOR = {
  id: "vnd_001", name: "Boutique de Luna", slug: "boutique-luna",
  tagline: "Mode africaine contemporaine & vêtements tendance",
  phone: "+225 07 12 34 56", instagram: "@boutiqueluna_ci",
  whatsapp: "https://wa.me/2250712345678",
  category: "Mode & Vêtements", memberSince: "Janvier 2024", initials: "BL",
  coverImg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&q=80",
  isVerified: true,
  metrics: { sales: 45, disputes: 0, score: 100, responseTime: "< 2h", avgDeliveryDays: 2 },
};

// TODO BACKEND: GET /api/vendors/{slug}/reviews?limit=3
const REVIEWS = [
  { id: 1, buyerName: "Aminata K.", initials: "AK", rating: 5, text: "Livraison rapide et produit conforme. Paiement via Verifio, j'étais totalement rassurée.", date: "il y a 3 jours",   isVerified: true },
  { id: 2, buyerName: "Kofi M.",    initials: "KM", rating: 5, text: "Excellent vendeur ! Le processus d'escrow est vraiment rassurant pour un premier achat.",  date: "il y a 1 semaine",  isVerified: true },
  { id: 3, buyerName: "Fatou D.",   initials: "FD", rating: 5, text: "3ème commande chez Luna — toujours impeccable. Je ne ferai plus jamais autrement.",         date: "il y a 2 semaines", isVerified: true },
];

const OPERATORS = [
  { id: "mtn",    label: "MTN MoMo",     color: "#FFC107", textColor: "#000", prefix: "05 / 07" },
  { id: "orange", label: "Orange Money", color: "#FF6B00", textColor: "#fff", prefix: "01 / 09" },
  { id: "wave",   label: "Wave",         color: "#1A73E8", textColor: "#fff", prefix: "07 / 01" },
];

type ModalStep = "form" | "confirm" | "processing" | "success";

// ─── COMPOSANT ─────────────────────────────────────────────────────────────
export default function VendorProfile() {
  const [, navigate] = useLocation();
  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false);
  const [step,        setStep]        = useState<ModalStep>("form");
  const [amount,      setAmount]      = useState("");
  const [buyerPhone,  setBuyerPhone]  = useState("");
  const [selectedOp,  setSelectedOp]  = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState("");
  // Carousel state
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const [dragStart,   setDragStart]   = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  // Preselect product
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCT_IMAGES[0] | null>(null);

  const operator  = OPERATORS.find(o => o.id === selectedOp);
  const canSubmit = amount && !amountError && buyerPhone.length >= 8 && selectedOp;

  const resetModal = () => {
    setModalOpen(false);
    setTimeout(() => { setStep("form"); setAmount(""); setBuyerPhone(""); setSelectedOp(null); setDescription(""); setAmountError(""); setSelectedProduct(null); }, 300);
  };

  const openPaymentForProduct = (product: typeof PRODUCT_IMAGES[0]) => {
    setSelectedProduct(product);
    setAmount(String(product.price));
    setDescription(product.label);
    setModalOpen(true);
  };

  const validateAmount = (val: string) => {
    const n = parseInt(val);
    if (!val) { setAmountError(""); return; }
    if (isNaN(n) || n < 500)  { setAmountError("Montant minimum : 500 FCFA"); return; }
    if (n > 5_000_000)        { setAmountError("Montant maximum : 5 000 000 FCFA"); return; }
    setAmountError("");
  };

  // TODO BACKEND: POST /api/escrow/initiate
  const handlePay = async () => {
    setStep("processing");
    await new Promise(r => setTimeout(r, 2200));
    setStep("success");
  };

  // Block scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  // ── Touch/drag carousel ──────────────────────────────────────────────────
  const nextSlide = () => setCarouselIdx(i => (i + 1) % PRODUCT_IMAGES.length);
  const prevSlide = () => setCarouselIdx(i => (i - 1 + PRODUCT_IMAGES.length) % PRODUCT_IMAGES.length);

  const handleTouchStart = (e: React.TouchEvent) => { setDragStart(e.touches[0].clientX); setIsDragging(true); };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = dragStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#0A192F]/96 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors py-1">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Accueil</span>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-white rounded-lg p-0.5">
              <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-sm tracking-tight">Verifio</span>
          </div>
          <a href={VENDOR.whatsapp} target="_blank" rel="noopener" className="flex items-center gap-1 text-[#25D366] text-xs font-semibold">
            <MessageCircle className="w-4 h-4" /> Chat
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-32">

        {/* ══════════════════════════════════════════════════
            PRODUCT IMAGE CAROUSEL
            TODO BACKEND: GET /api/vendors/{slug}/products?limit=8
        ══════════════════════════════════════════════════ */}
        <div
          ref={carouselRef}
          className="relative overflow-hidden bg-gray-900 select-none"
          style={{ aspectRatio: "4/3" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides */}
          {PRODUCT_IMAGES.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: i === carouselIdx ? 1 : 0, pointerEvents: i === carouselIdx ? "auto" : "none" }}
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=450&fit=crop"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            </div>
          ))}

          {/* Prev / Next */}
          <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors z-10">
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Product info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-white font-bold text-base drop-shadow-sm">{PRODUCT_IMAGES[carouselIdx].label}</span>
                <div className="text-emerald-400 font-black text-lg drop-shadow-sm">
                  {PRODUCT_IMAGES[carouselIdx].price.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <button
                onClick={() => openPaymentForProduct(PRODUCT_IMAGES[carouselIdx])}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg"
              >
                <Lock className="w-3.5 h-3.5" /> Acheter
              </button>
            </div>
          </div>

          {/* Dots */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {PRODUCT_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIdx(i)}
                className={`rounded-full transition-all duration-300 ${i === carouselIdx ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>

          {/* Product count badge */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {carouselIdx + 1} / {PRODUCT_IMAGES.length}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b border-gray-100" style={{ scrollbarWidth: "none" }}>
          {PRODUCT_IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => setCarouselIdx(i)}
              className={`flex-none w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === carouselIdx ? "border-emerald-500 scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-80"}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>

        {/* Content section */}
        <div className="px-4 py-5 space-y-4">

          {/* Verified banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-emerald-800 text-sm">Vendeur Certifié Verifio</div>
              <div className="text-emerald-600/80 text-xs mt-0.5">Identité vérifiée · Escrow activé · Remboursement garanti</div>
            </div>
            <div className="w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
            </div>
          </div>

          {/* Store card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A192F] to-[#1d4ed8] flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white text-2xl font-black">{VENDOR.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-black text-[#0A192F] text-lg leading-tight">{VENDOR.name}</h1>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" style={{ animation: "onboard-pulse 2s infinite" }} />
                </div>
                <p className="text-gray-500 text-xs leading-snug">{VENDOR.tagline}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { icon: ShoppingBag, label: VENDOR.category },
                { icon: Clock,       label: `Répond ${VENDOR.metrics.responseTime}` },
                { icon: Package,     label: `Livraison ~${VENDOR.metrics.avgDeliveryDays}j` },
              ].map(c => (
                <div key={c.label} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 text-xs px-3 py-1.5 rounded-full border border-gray-100 font-medium">
                  <c.icon className="w-3.5 h-3.5 flex-shrink-0" />{c.label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a href={VENDOR.whatsapp} target="_blank" rel="noopener"
                className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:bg-[#25D366]/30 text-[#128C7E] border border-[#25D366]/20 text-sm font-bold px-4 py-3 rounded-xl transition-colors">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
              <a href={`https://instagram.com/${VENDOR.instagram.replace("@", "")}`} target="_blank" rel="noopener"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-pink-600 border border-pink-100 text-sm font-bold px-4 py-3 rounded-xl transition-colors">
                <Instagram className="w-4 h-4" /> {VENDOR.instagram}
              </a>
            </div>
          </div>

          {/* Trust metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, value: VENDOR.metrics.sales,    label: "Ventes",   color: "text-emerald-700", bg: "bg-emerald-50", iconColor: "text-emerald-600" },
              { icon: Shield,     value: VENDOR.metrics.disputes, label: "Litiges",  color: "text-[#0A192F]",   bg: "bg-blue-50",    iconColor: "text-blue-600"    },
              { icon: Star,       value: `${VENDOR.metrics.score}%`, label: "Score", color: "text-amber-700",   bg: "bg-amber-50",   iconColor: "text-amber-500"   },
            ].map((m, i) => (
              <div key={i} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100/80 text-center">
                <div className={`w-8 h-8 ${m.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <m.icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>
                <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Score bar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[#0A192F] text-sm">Score de confiance</span>
              <span className="text-emerald-600 font-black text-sm">{VENDOR.metrics.score}/100</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${VENDOR.metrics.score}%`, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs text-gray-400">Depuis {VENDOR.memberSince}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">⭐ Excellent</span>
            </div>
          </div>

          {/* Product grid — rapide à parcourir */}
          {/* TODO BACKEND: GET /api/vendors/{slug}/products?limit=8 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-[#0A192F]">Produits disponibles</h3>
              <span className="text-xs text-gray-400">{PRODUCT_IMAGES.length} articles</span>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-50">
              {PRODUCT_IMAGES.slice(0, 4).map((p, i) => (
                <button key={i} onClick={() => { setCarouselIdx(i); carouselRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="group relative overflow-hidden aspect-square hover:opacity-90 transition-opacity">
                  <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=300&fit=crop"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <div className="text-white text-[11px] font-bold leading-tight truncate">{p.label}</div>
                    <div className="text-emerald-400 text-[11px] font-black">{p.price.toLocaleString("fr-FR")} F</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setCarouselIdx(0)} className="w-full py-3 text-center text-emerald-600 hover:text-emerald-700 text-sm font-bold border-t border-gray-50 hover:bg-gray-50 transition-colors">
              Voir tous les produits →
            </button>
          </div>

          {/* Reviews */}
          {/* TODO BACKEND: GET /api/vendors/{slug}/reviews?limit=3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-[#0A192F]">Avis acheteurs</h3>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">{Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                <span className="text-sm font-black text-gray-700">5,0</span>
                <span className="text-xs text-gray-400">({REVIEWS.length})</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {REVIEWS.map(r => (
                <div key={r.id} className="px-5 py-4 flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 font-bold text-gray-600 text-xs">{r.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 text-sm">{r.buyerName}</span>
                      {r.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      <span className="text-gray-400 text-xs ml-auto">{r.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">{Array(r.rating).fill(0).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>
                    <p className="text-gray-500 text-xs leading-relaxed">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security block */}
          <div className="bg-[#0A192F] rounded-2xl p-5 text-center">
            <Shield className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-white font-bold text-sm mb-1">Paiement 100% sécurisé par Verifio</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Votre argent est bloqué en escrow jusqu'à votre confirmation de réception. Litige = remboursement intégral sous 72h.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STICKY CTA
      ══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0A192F] to-[#112240] hover:from-[#0d2040] hover:to-[#1a3a6b] active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl text-base"
          >
            <Lock className="w-5 h-5 text-emerald-400" />
            Initier un Paiement Sécurisé MoMo
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">🔒 Escrow Verifio · Remboursement garanti si problème</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PAYMENT MODAL
          TODO BACKEND: POST /api/escrow/initiate
      ══════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step !== "processing" ? resetModal : undefined} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
               style={{ animation: "fade-up 0.3s cubic-bezier(0.16,1,0.3,1)" }}>

            <div className="flex-shrink-0 bg-[#0A192F] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white rounded-lg p-0.5"><img src="/logo.png" alt="" className="w-full h-full object-contain" /></div>
                <span className="text-white font-bold text-sm">
                  {step === "success" ? "Paiement confirmé !" : step === "processing" ? "Traitement…" : step === "confirm" ? "Confirmer" : "Paiement Escrow MoMo"}
                </span>
              </div>
              {step !== "processing" && (
                <button onClick={resetModal} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">

                {/* FORM */}
                {step === "form" && (
                  <>
                    {/* Selected product preview */}
                    {selectedProduct && (
                      <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-2xl p-3 border border-gray-100">
                        <img src={selectedProduct.url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        <div>
                          <div className="font-bold text-[#0A192F] text-sm">{selectedProduct.label}</div>
                          <div className="text-emerald-600 text-xs font-bold">{selectedProduct.price.toLocaleString("fr-FR")} FCFA</div>
                        </div>
                        <button onClick={() => setSelectedProduct(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-2xl p-3.5 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-sm">{VENDOR.initials}</span>
                      </div>
                      <div>
                        <div className="font-bold text-[#0A192F] text-sm">{VENDOR.name}</div>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle2 className="w-3 h-3" />Vendeur certifié</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Montant (FCFA)</label>
                      <div className="relative">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="number" inputMode="numeric" value={amount}
                          onChange={e => { setAmount(e.target.value); validateAmount(e.target.value); }}
                          placeholder="Ex : 25 000"
                          className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-300 outline-none text-lg font-bold transition-colors ${amountError ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-emerald-500"}`} />
                      </div>
                      {amountError && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Info className="w-3.5 h-3.5" />{amountError}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Votre numéro Mobile Money</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="tel" inputMode="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)}
                          placeholder="+225 07 XX XX XX"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-gray-900 placeholder-gray-300 outline-none transition-colors" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Opérateur</label>
                      <div className="grid grid-cols-3 gap-2">
                        {OPERATORS.map(op => (
                          <button key={op.id} type="button" onClick={() => setSelectedOp(op.id)}
                            className={`relative p-3.5 rounded-2xl border-2 text-center transition-all ${selectedOp === op.id ? "border-emerald-500 bg-emerald-50 scale-[1.02]" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}>
                            {selectedOp === op.id && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-2.5 h-2.5 text-white" /></div>}
                            <div className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-sm shadow-sm" style={{ backgroundColor: op.color, color: op.textColor }}>{op.label.charAt(0)}</div>
                            <div className="text-xs font-bold text-gray-700 leading-tight">{op.label.split(" ")[0]}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{op.prefix}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Description <span className="text-gray-300 font-normal normal-case">(optionnel)</span></label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Ex : Robe wax taille M, couleur bleue" rows={2}
                        className="w-full px-4 py-3 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-gray-900 placeholder-gray-300 outline-none resize-none text-sm transition-colors" />
                    </div>

                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/60 rounded-xl p-3.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">Vos fonds seront <strong>bloqués en escrow</strong> jusqu'à confirmation de réception. Litige = remboursement intégral.</p>
                    </div>

                    <button onClick={() => { if (canSubmit) setStep("confirm"); }} disabled={!canSubmit}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0A192F] to-[#112240] text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                      <Lock className="w-5 h-5 text-emerald-400" />
                      Sécuriser {amount && !amountError ? `${parseInt(amount).toLocaleString("fr-FR")} FCFA` : "le paiement"}
                    </button>
                  </>
                )}

                {/* CONFIRM */}
                {step === "confirm" && (
                  <>
                    <p className="text-center text-gray-500 text-sm pt-1">Vérifiez chaque détail avant de confirmer</p>
                    <div className="bg-[#F8FAFC] rounded-2xl overflow-hidden border border-gray-100">
                      {[
                        ["Vendeur", VENDOR.name],
                        ["Montant", `${parseInt(amount).toLocaleString("fr-FR")} FCFA`, "font-black text-[#0A192F] text-lg"],
                        ["Votre numéro", buyerPhone],
                        ["Opérateur", operator?.label || ""],
                        ...(description ? [["Description", description]] : [] as [string, string][]),
                        ["Frais Verifio", "Gratuit (bêta)", "text-emerald-600 font-bold"],
                      ].map(([k, v, extra = ""]) => (
                        <div key={String(k)} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-0">
                          <span className="text-gray-500 text-sm">{k}</span>
                          <span className={`text-sm font-semibold text-[#0A192F] text-right max-w-[55%] ${extra}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => setStep("form")} className="py-3.5 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-gray-600 text-sm">← Modifier</button>
                      <button onClick={handlePay} className="py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-500/25">Payer →</button>
                    </div>
                  </>
                )}

                {/* PROCESSING */}
                {step === "processing" && (
                  <div className="text-center py-10 space-y-5">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <div className="absolute inset-3 flex items-center justify-center">
                        <img src="/logo.png" alt="" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-[#0A192F] text-lg mb-1">Sécurisation en cours…</h3>
                      <p className="text-gray-400 text-sm">Connexion à {operator?.label} · Ne fermez pas</p>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-blue-700 text-xs">Vous allez peut-être recevoir un code OTP par SMS pour valider.</p>
                    </div>
                  </div>
                )}

                {/* SUCCESS */}
                {step === "success" && (
                  <div className="text-center py-6 space-y-5">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                      <CheckCircle2 className="w-11 h-11 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#0A192F] mb-2">Paiement Sécurisé ! 🎉</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        <strong>{parseInt(amount).toLocaleString("fr-FR")} FCFA</strong> sont bloqués en escrow chez Verifio. Le vendeur a été notifié.
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left space-y-2.5">
                      {["Fonds bloqués en escrow Verifio", "Vendeur notifié par SMS & WhatsApp", "48h pour confirmer la réception", "Litige = remboursement automatique"].map(line => (
                        <div key={line} className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{line}</div>
                      ))}
                    </div>
                    <button onClick={resetModal} className="w-full py-4 bg-[#0A192F] hover:bg-[#0d2040] text-white font-black rounded-2xl transition-colors">Fermer</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
