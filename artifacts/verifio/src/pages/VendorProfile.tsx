/**
 * VendorProfile — Page publique du profil vendeur
 * Partagée via lien WhatsApp/Instagram : verifio.app/shop/{slug}
 *
 * BACKEND HOOKS :
 * ─────────────────────────────────────────────────────
 * 1. Profil vendeur  : GET /api/vendors/{slug}
 *    → Retourne : VendorProfile {
 *        id, slug, name, tagline, phone, instagram, whatsapp,
 *        category, memberSince, avatarUrl, isVerified, isActive,
 *        metrics: { sales, disputes, score, responseTime, avgDeliveryDays }
 *      }
 *    → 404 si slug inconnu ou compte suspendu
 *
 * 2. Avis clients    : GET /api/vendors/{slug}/reviews?limit=3&sort=recent
 *    → Retourne : Review[] { id, buyerName, buyerInitials, rating, text, date, isVerified }
 *
 * 3. Initier paiement: POST /api/escrow/initiate
 *    → Body   : { vendorId, buyerPhone, amount, operator, description }
 *    → Action : Appel API Mobile Money (Notch Pay / FedaPay / CinetPay)
 *               → Retourne { transactionId, mobileMoneyRef, otpRequired }
 *    → Erreurs: 400 (validation), 402 (solde insuffisant), 503 (opérateur indisponible)
 *
 * 4. Statut transaction: GET /api/escrow/{transactionId}/status (polling toutes 5s)
 *    → Retourne : { status: "PENDING" | "FUNDS_SECURED" | "FAILED", ref }
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle2, Star, Phone, Instagram, Lock, X, ChevronLeft,
  AlertTriangle, TrendingUp, ShoppingBag, ArrowRight, Smartphone,
  Wallet, Shield, Clock, MessageCircle, Info,
} from "lucide-react";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
// TODO BACKEND: Remplacer par GET /api/vendors/{slug}
// Le slug viendrait de useParams() → useRoute("/shop/:slug")
const VENDOR = {
  id: "vnd_001",
  name: "Boutique de Luna",
  slug: "boutique-luna",
  tagline: "Mode africaine contemporaine & vêtements tendance",
  phone: "+225 07 12 34 56",
  instagram: "@boutiqueluna_ci",
  whatsapp: "https://wa.me/2250712345678",
  category: "Mode & Vêtements",
  memberSince: "Janvier 2024",
  initials: "BL",
  coverColor: "from-[#0A192F] via-[#112240] to-[#0d2040]",
  isVerified: true,
  isActive: true,
  metrics: { sales: 45, disputes: 0, score: 100, responseTime: "< 2h", avgDeliveryDays: 2 },
};

// TODO BACKEND: Remplacer par GET /api/vendors/{slug}/reviews?limit=3
const REVIEWS = [
  { id: 1, buyerName: "Aminata K.", initials: "AK", rating: 5, text: "Livraison rapide et produit conforme. Paiement via Verifio, j'étais totalement rassurée.", date: "il y a 3 jours",    isVerified: true },
  { id: 2, buyerName: "Kofi M.",    initials: "KM", rating: 5, text: "Excellent vendeur ! Le processus d'escrow est vraiment rassurant pour un premier achat.", date: "il y a 1 semaine",   isVerified: true },
  { id: 3, buyerName: "Fatou D.",   initials: "FD", rating: 5, text: "3ème commande chez Luna — toujours impeccable. Je ne ferai plus jamais autrement.",          date: "il y a 2 semaines", isVerified: true },
];

const OPERATORS = [
  { id: "mtn",    label: "MTN MoMo",      color: "#FFC107", textColor: "#000", prefix: "05 / 07" },
  { id: "orange", label: "Orange Money",  color: "#FF6B00", textColor: "#fff", prefix: "01 / 09" },
  { id: "wave",   label: "Wave",          color: "#1A73E8", textColor: "#fff", prefix: "07 / 01" },
];

type ModalStep = "form" | "confirm" | "processing" | "success" | "error";

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function VendorProfile() {
  const [, navigate] = useLocation();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [step,        setStep]        = useState<ModalStep>("form");
  const [amount,      setAmount]      = useState("");
  const [buyerPhone,  setBuyerPhone]  = useState("");
  const [selectedOp,  setSelectedOp]  = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState("");

  const operator = OPERATORS.find(o => o.id === selectedOp);

  const resetModal = () => {
    setModalOpen(false);
    setTimeout(() => { setStep("form"); setAmount(""); setBuyerPhone(""); setSelectedOp(null); setDescription(""); setAmountError(""); }, 300);
  };

  const validateAmount = (val: string) => {
    const n = parseInt(val);
    if (!val) { setAmountError(""); return; }
    if (isNaN(n) || n < 500)    setAmountError("Montant minimum : 500 FCFA");
    else if (n > 5_000_000)     setAmountError("Montant maximum : 5 000 000 FCFA");
    else                        setAmountError("");
  };

  const canSubmit = amount && !amountError && buyerPhone.length >= 8 && selectedOp;

  const handleConfirm = () => { if (canSubmit) setStep("confirm"); };

  // TODO BACKEND: POST /api/escrow/initiate
  const handlePay = async () => {
    setStep("processing");
    // Simulation du délai API Mobile Money
    // Remplacer par : const res = await fetch("/api/escrow/initiate", { method: "POST", body: JSON.stringify({...}) })
    await new Promise(r => setTimeout(r, 2200));
    setStep("success");
  };

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* ══════════════════════════════════════════════════════
          HEADER — Mobile optimized
      ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#0A192F]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors py-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Accueil</span>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-white rounded-lg p-0.5 flex items-center justify-center">
              <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-sm tracking-tight">Verifio</span>
          </div>
          <div className="w-20 flex justify-end">
            <a href={VENDOR.whatsapp} target="_blank" rel="noopener" className="flex items-center gap-1 text-[#25D366] text-xs font-semibold">
              <MessageCircle className="w-4 h-4" />
              Chat
            </a>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          CONTENT — Profile
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-4">

        {/* Verified banner */}
        <div className="animate-fade-up bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-emerald-800 text-sm leading-tight">Vendeur Certifié Verifio</div>
            <div className="text-emerald-600/80 text-xs mt-0.5 leading-tight">Identité vérifiée · Escrow activé · Remboursement garanti</div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
          </div>
        </div>

        {/* Store profile card */}
        <div className="animate-fade-up delay-100 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80">
          {/* Cover gradient */}
          <div className={`h-24 sm:h-28 bg-gradient-to-br ${VENDOR.coverColor} relative`}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(16,185,129,0.4) 0%, transparent 60%)" }} />
          </div>

          <div className="px-5 pb-5">
            {/* Avatar overlapping cover */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1d4ed8] flex items-center justify-center">
                  <span className="text-white text-2xl font-black">{VENDOR.initials}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" style={{ animation: "onboard-pulse 2s infinite" }} />
                <span className="text-emerald-700 text-xs font-bold">En ligne</span>
              </div>
            </div>

            <h1 className="font-black text-[#0A192F] text-xl leading-tight mb-1">{VENDOR.name}</h1>
            <p className="text-gray-500 text-sm leading-snug mb-4">{VENDOR.tagline}</p>

            <div className="flex flex-wrap gap-2 mb-5">
              <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 text-xs px-3 py-1.5 rounded-full border border-gray-100 font-medium">
                <ShoppingBag className="w-3.5 h-3.5" />{VENDOR.category}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 text-xs px-3 py-1.5 rounded-full border border-gray-100 font-medium">
                <Clock className="w-3.5 h-3.5" />Répond en {VENDOR.metrics.responseTime}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 text-xs px-3 py-1.5 rounded-full border border-gray-100 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />Depuis {VENDOR.memberSince}
              </div>
            </div>

            {/* Contact buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={VENDOR.whatsapp}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:bg-[#25D366]/30 text-[#128C7E] border border-[#25D366]/20 text-sm font-bold px-4 py-3 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={`https://instagram.com/${VENDOR.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-pink-600 border border-pink-100 text-sm font-bold px-4 py-3 rounded-xl transition-colors"
              >
                <Instagram className="w-4 h-4" />
                {VENDOR.instagram}
              </a>
            </div>
          </div>
        </div>

        {/* Trust metrics */}
        <div className="animate-fade-up delay-150 grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, value: VENDOR.metrics.sales,     label: "Ventes sécurisées", color: "bg-emerald-50",  iconColor: "text-emerald-600", valColor: "text-emerald-700" },
            { icon: Shield,     value: VENDOR.metrics.disputes,  label: "Litiges",           color: "bg-blue-50",     iconColor: "text-blue-600",    valColor: "text-[#0A192F]"  },
            { icon: Star,       value: `${VENDOR.metrics.score}%`, label: "Score confiance", color: "bg-amber-50",    iconColor: "text-amber-500",   valColor: "text-amber-700"  },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100/80 text-center">
              <div className={`w-8 h-8 ${m.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <m.icon className={`w-4 h-4 ${m.iconColor}`} />
              </div>
              <div className={`text-xl font-black ${m.valColor}`}>{m.value}</div>
              <div className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Trust score bar */}
        <div className="animate-fade-up delay-200 bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[#0A192F] text-sm">Score de confiance global</span>
            <span className="text-emerald-600 font-black text-sm">{VENDOR.metrics.score}/100</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 rounded-full"
              style={{ width: `${VENDOR.metrics.score}%`, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs text-gray-400">Membre depuis {VENDOR.memberSince}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">⭐ Excellent</span>
          </div>
        </div>

        {/* Reviews */}
        {/* TODO BACKEND: GET /api/vendors/{slug}/reviews?limit=3 */}
        <div className="animate-fade-up delay-250 bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-[#0A192F]">Avis acheteurs</h3>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <span className="text-sm font-black text-gray-700">5,0</span>
              <span className="text-xs text-gray-400">({REVIEWS.length})</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {REVIEWS.map(r => (
              <div key={r.id} className="px-5 py-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600">{r.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-sm">{r.buyerName}</span>
                    {r.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                    <span className="text-gray-400 text-xs ml-auto">{r.date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-1.5">
                    {Array(r.rating).fill(0).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security guarantee */}
        <div className="animate-fade-up delay-300 bg-[#0A192F] rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-bold text-sm">Paiement 100% sécurisé par Verifio</span>
          </div>
          <p className="text-white/50 text-xs leading-relaxed">
            Votre argent est bloqué en escrow jusqu'à votre confirmation de réception.
            En cas de litige, Verifio arbitre et vous rembourse intégralement sous 72h.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STICKY CTA — Fixed bottom bar
      ══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0A192F] to-[#112240] hover:from-[#0d2040] hover:to-[#1a3a6b] active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-[#0A192F]/25 text-base"
          >
            <Lock className="w-5 h-5 text-emerald-400" />
            Initier un Paiement Sécurisé MoMo
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">
            🔒 Escrow Verifio · Remboursement garanti si problème
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PAYMENT MODAL
          TODO BACKEND: POST /api/escrow/initiate (step confirm → processing)
      ══════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step !== "processing" ? resetModal : undefined} />

          {/* Sheet */}
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
               style={{ animation: "fade-up 0.3s cubic-bezier(0.16,1,0.3,1)" }}>

            {/* Modal header */}
            <div className="flex-shrink-0 bg-[#0A192F] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white rounded-lg p-0.5">
                  <img src="/logo.png" alt="" className="w-full h-full object-contain" />
                </div>
                <span className="text-white font-bold text-sm">
                  {step === "success" ? "Paiement confirmé !" : step === "processing" ? "Traitement en cours…" : step === "confirm" ? "Confirmer le paiement" : "Paiement Escrow MoMo"}
                </span>
              </div>
              {step !== "processing" && (
                <button onClick={resetModal} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">

                {/* ── FORM STEP ─────────────────────────────────── */}
                {step === "form" && (
                  <>
                    {/* Vendor summary */}
                    <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-2xl p-3.5 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-sm">{VENDOR.initials}</span>
                      </div>
                      <div>
                        <div className="font-bold text-[#0A192F] text-sm">{VENDOR.name}</div>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />Vendeur certifié Verifio
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Montant de la commande (FCFA)</label>
                      <div className="relative">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={amount}
                          onChange={e => { setAmount(e.target.value); validateAmount(e.target.value); }}
                          placeholder="Ex : 25 000"
                          className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-300 outline-none transition-colors text-lg font-bold ${amountError ? "border-red-300 focus:border-red-400 bg-red-50" : "border-gray-200 focus:border-emerald-500"}`}
                        />
                      </div>
                      {amountError && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Info className="w-3.5 h-3.5" />{amountError}</p>}
                      {amount && !amountError && (
                        <p className="mt-1.5 text-xs text-emerald-600 font-medium">
                          = {parseInt(amount).toLocaleString("fr-FR")} FCFA + frais Verifio : gratuit (bêta)
                        </p>
                      )}
                    </div>

                    {/* Buyer phone */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Votre numéro Mobile Money</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          inputMode="tel"
                          value={buyerPhone}
                          onChange={e => setBuyerPhone(e.target.value)}
                          placeholder="+225 07 XX XX XX"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-gray-900 placeholder-gray-300 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Operator */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Opérateur Mobile Money</label>
                      <div className="grid grid-cols-3 gap-2">
                        {OPERATORS.map(op => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => setSelectedOp(op.id)}
                            className={`relative p-3.5 rounded-2xl border-2 text-center transition-all duration-150 ${selectedOp === op.id ? "border-emerald-500 bg-emerald-50 scale-[1.02]" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                          >
                            {selectedOp === op.id && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                            <div className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-sm shadow-sm" style={{ backgroundColor: op.color, color: op.textColor }}>
                              {op.label.charAt(0)}
                            </div>
                            <div className="text-xs font-bold text-gray-700 leading-tight">{op.label.split(" ")[0]}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{op.prefix}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description optional */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Description <span className="text-gray-300 font-normal normal-case">(optionnel)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ex : Robe wax taille M, couleur bleue"
                        rows={2}
                        className="w-full px-4 py-3 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-gray-900 placeholder-gray-300 outline-none resize-none text-sm transition-colors"
                      />
                    </div>

                    {/* Security notice */}
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/60 rounded-xl p-3.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Vos fonds seront <strong>bloqués en escrow</strong> jusqu'à confirmation de réception.
                        En cas de litige, Verifio vous rembourse intégralement sous 72h.
                      </p>
                    </div>

                    <button
                      onClick={handleConfirm}
                      disabled={!canSubmit}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0A192F] to-[#112240] text-white font-black py-4 rounded-2xl transition-all duration-200 shadow-lg disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <Lock className="w-5 h-5 text-emerald-400" />
                      Sécuriser {amount && !amountError ? `${parseInt(amount).toLocaleString("fr-FR")} FCFA` : "le paiement"}
                    </button>
                  </>
                )}

                {/* ── CONFIRM STEP ──────────────────────────────── */}
                {step === "confirm" && (
                  <>
                    <p className="text-center text-gray-500 text-sm pt-1">Vérifiez chaque détail avant de confirmer</p>

                    <div className="bg-[#F8FAFC] rounded-2xl overflow-hidden border border-gray-100">
                      {[
                        ["Vendeur",       VENDOR.name],
                        ["Montant",       `${parseInt(amount).toLocaleString("fr-FR")} FCFA`, "font-black text-[#0A192F] text-lg"],
                        ["Votre numéro",  buyerPhone],
                        ["Opérateur",     operator?.label || ""],
                        ...(description ? [["Description", description]] : []),
                        ["Frais Verifio", "Gratuit (bêta)", "text-emerald-600 font-bold"],
                      ].map(([k, v, extra = ""]) => (
                        <div key={k as string} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-0">
                          <span className="text-gray-500 text-sm">{k}</span>
                          <span className={`text-sm font-semibold text-[#0A192F] text-right max-w-[55%] ${extra}`}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => setStep("form")} className="py-3.5 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-gray-600 text-sm transition-colors">
                        ← Modifier
                      </button>
                      <button onClick={handlePay} className="py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-black rounded-xl transition-colors shadow-lg shadow-emerald-500/25 text-sm">
                        Payer maintenant →
                      </button>
                    </div>
                  </>
                )}

                {/* ── PROCESSING STEP ───────────────────────────── */}
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
                      <p className="text-gray-400 text-sm">Connexion à {operator?.label} · Veuillez ne pas fermer cette fenêtre</p>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-blue-700 text-xs">Vous allez peut-être recevoir un code OTP par SMS pour valider le paiement.</p>
                    </div>
                  </div>
                )}

                {/* ── SUCCESS STEP ──────────────────────────────── */}
                {step === "success" && (
                  <div className="text-center py-6 space-y-5">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30" style={{ animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                      <CheckCircle2 className="w-11 h-11 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#0A192F] mb-2">Paiement Sécurisé ! 🎉</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        <strong>{parseInt(amount).toLocaleString("fr-FR")} FCFA</strong> sont désormais bloqués en escrow chez Verifio.
                        Le vendeur a été notifié et va procéder à la livraison.
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left space-y-2.5">
                      {["Fonds bloqués en escrow Verifio", "Vendeur notifié par SMS & WhatsApp", "Vous avez 48h pour confirmer la réception", "Litige ouvert = remboursement automatique"].map(line => (
                        <div key={line} className="flex items-center gap-2 text-sm text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          {line}
                        </div>
                      ))}
                    </div>
                    <button onClick={resetModal} className="w-full py-4 bg-[#0A192F] hover:bg-[#0d2040] text-white font-black rounded-2xl transition-colors">
                      Fermer
                    </button>
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
