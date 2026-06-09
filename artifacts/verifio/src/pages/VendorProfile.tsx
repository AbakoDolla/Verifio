import { useState } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  CheckCircle2,
  Star,
  Phone,
  Instagram,
  Lock,
  X,
  ChevronLeft,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
  Smartphone,
  Wallet,
} from "lucide-react";

const VENDOR = {
  name: "Boutique de Luna",
  slug: "boutique-luna",
  tagline: "Mode africaine contemporaine & vêtements tendance",
  phone: "+225 07 12 34 56",
  instagram: "@boutiqueluna_ci",
  whatsapp: "https://wa.me/2250712345678",
  category: "Mode & Vêtements",
  memberSince: "Janvier 2024",
  avatar: "L",
  verified: true,
  metrics: {
    sales: 45,
    disputes: 0,
    score: 100,
    responseTime: "< 2h",
  },
};

const RECENT_REVIEWS = [
  {
    id: 1,
    name: "Aminata K.",
    rating: 5,
    text: "Livraison rapide et produit conforme. Paiement via Verifio, je me sentais en sécurité.",
    date: "il y a 3 jours",
  },
  {
    id: 2,
    name: "Kofi M.",
    rating: 5,
    text: "Excellent vendeur ! Le processus d'escrow est vraiment rassurant.",
    date: "il y a 1 semaine",
  },
  {
    id: 3,
    name: "Fatou D.",
    rating: 5,
    text: "3ème achat chez Luna, toujours impeccable. Verifio garantit chaque achat.",
    date: "il y a 2 semaines",
  },
];

const OPERATORS = [
  { id: "mtn", name: "MTN Mobile Money", color: "#FFC107", prefix: "05 / 07" },
  { id: "orange", name: "Orange Money", color: "#FF6B00", prefix: "01 / 09" },
  { id: "wave", name: "Wave", color: "#1A73E8", prefix: "07 / 01" },
];

export default function VendorProfile() {
  const [, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [amount, setAmount] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const resetModal = () => {
    setModalOpen(false);
    setStep("form");
    setAmount("");
    setBuyerPhone("");
    setSelectedOp(null);
    setDescription("");
  };

  const handleConfirm = () => {
    if (!amount || !buyerPhone || !selectedOp) return;
    setStep("confirm");
  };

  const handlePay = () => {
    setStep("success");
  };

  const operator = OPERATORS.find((o) => o.id === selectedOp);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-40 bg-[#0A192F] border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Retour</span>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-sm">Verifio</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Verified badge hero */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 mb-5 flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="font-bold text-emerald-800 text-sm">
              Vendeur Certifié Verifio
            </div>
            <div className="text-emerald-600 text-xs mt-0.5">
              Identité vérifiée · Paiements sécurisés · Protégé par l'escrow
            </div>
          </div>
        </div>

        {/* Store profile card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-3xl font-black">
                {VENDOR.avatar}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-[#0A192F] text-xl leading-tight mb-1">
                {VENDOR.name}
              </h1>
              <p className="text-gray-500 text-sm leading-snug mb-3">
                {VENDOR.tagline}
              </p>
              <div className="inline-flex items-center gap-1.5 bg-[#0A192F]/5 text-[#0A192F]/60 text-xs px-2.5 py-1 rounded-full">
                <ShoppingBag className="w-3.5 h-3.5" />
                {VENDOR.category}
              </div>
            </div>
          </div>

          {/* Contact row */}
          <div className="flex flex-wrap gap-2">
            <a
              href={VENDOR.whatsapp}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/20 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href="#"
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          </div>
        </div>

        {/* Trust Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[#0A192F]">
              {VENDOR.metrics.sales}
            </div>
            <div className="text-xs text-gray-400 leading-tight mt-0.5">
              Ventes Sécurisées
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-[#0A192F]">
              {VENDOR.metrics.disputes}
            </div>
            <div className="text-xs text-gray-400 leading-tight mt-0.5">
              Litiges
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Star className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {VENDOR.metrics.score}%
            </div>
            <div className="text-xs text-gray-400 leading-tight mt-0.5">
              Score Confiance
            </div>
          </div>
        </div>

        {/* Score progress */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-[#0A192F] text-sm">
              Score de Confiance Global
            </span>
            <span className="font-black text-emerald-600">
              {VENDOR.metrics.score}/100
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${VENDOR.metrics.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              Membre depuis {VENDOR.memberSince}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              Excellent
            </span>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0A192F]">Avis Acheteurs</h3>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
              <span className="font-bold text-sm text-gray-700">5.0</span>
            </div>
          </div>
          <div className="space-y-4">
            {RECENT_REVIEWS.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600">
                    {r.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">
                      {r.name}
                    </span>
                    <span className="text-gray-400 text-xs">{r.date}</span>
                  </div>
                  <div className="flex gap-0.5 my-1">
                    {Array(r.rating)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {r.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 p-4 shadow-xl">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#0A192F] to-[#1a3a6b] hover:from-[#0d2040] hover:to-[#1e4278] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-[#0A192F]/20"
          >
            <Lock className="w-5 h-5" />
            Initier un Paiement Sécurisé MoMo
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Protégé par l'escrow Verifio · Remboursement garanti
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetModal}
          />
          <div className="relative bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-[#0A192F] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-bold">
                  {step === "success"
                    ? "Paiement Initié"
                    : step === "confirm"
                      ? "Confirmer le Paiement"
                      : "Paiement Escrow MoMo"}
                </span>
              </div>
              <button
                onClick={resetModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6">
              {step === "form" && (
                <div className="space-y-5">
                  {/* Vendor info */}
                  <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center">
                      <span className="text-white font-black text-sm">L</span>
                    </div>
                    <div>
                      <div className="font-semibold text-[#0A192F] text-sm">
                        {VENDOR.name}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Vendeur Certifié
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Montant (FCFA)
                    </label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ex: 15000"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
                      />
                    </div>
                  </div>

                  {/* Buyer phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Votre numéro Mobile Money
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="+225 07 XX XX XX"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Operator selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Opérateur Mobile Money
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {OPERATORS.map((op) => (
                        <button
                          key={op.id}
                          onClick={() => setSelectedOp(op.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all duration-150 ${
                            selectedOp === op.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-black"
                            style={{ backgroundColor: op.color }}
                          >
                            {op.name.charAt(0)}
                          </div>
                          <div className="text-xs font-semibold text-gray-700 leading-tight">
                            {op.name.split(" ")[0]}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {op.prefix}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description de l'achat{" "}
                      <span className="text-gray-400 font-normal">
                        (optionnel)
                      </span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Robe wax taille M, couleur bleue"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  {/* Security notice */}
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Vos fonds seront bloqués jusqu'à confirmation de la
                      livraison. En cas de problème, Verifio vous rembourse
                      intégralement.
                    </p>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={!amount || !buyerPhone || !selectedOp}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0A192F] to-[#1a3a6b] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-5 h-5" />
                    Sécuriser{" "}
                    {amount
                      ? `${parseInt(amount).toLocaleString("fr-FR")} FCFA`
                      : "le paiement"}
                  </button>
                </div>
              )}

              {step === "confirm" && (
                <div className="space-y-5">
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm">
                      Vérifiez les détails avant de confirmer
                    </p>
                  </div>

                  <div className="bg-[#F8FAFC] rounded-2xl p-5 space-y-3 border border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vendeur</span>
                      <span className="font-semibold text-[#0A192F]">
                        {VENDOR.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Montant</span>
                      <span className="font-black text-[#0A192F] text-base">
                        {parseInt(amount).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Votre numéro</span>
                      <span className="font-semibold text-[#0A192F]">
                        {buyerPhone}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Opérateur</span>
                      <span className="font-semibold text-[#0A192F]">
                        {operator?.name}
                      </span>
                    </div>
                    {description && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Description</span>
                        <span className="font-semibold text-[#0A192F] text-right max-w-36">
                          {description}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
                      <span className="text-gray-500">Frais Verifio</span>
                      <span className="text-emerald-600 font-semibold">
                        Gratuit (beta)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("form")}
                      className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handlePay}
                      className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="text-center py-8 space-y-5">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0A192F] mb-2">
                      Paiement Sécurisé !
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Vos{" "}
                      <strong>
                        {parseInt(amount).toLocaleString("fr-FR")} FCFA
                      </strong>{" "}
                      sont sécurisés chez Verifio. Le vendeur sera notifié et
                      livrera votre commande.
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Fonds bloqués sur le compte Verifio</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Vendeur notifié par SMS et WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Remboursement garanti si litige</span>
                    </div>
                  </div>
                  <button
                    onClick={resetModal}
                    className="w-full py-3.5 bg-[#0A192F] text-white font-bold rounded-2xl transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
