/**
 * Dashboard — Espace vendeur Verifio (desktop sidebar + mobile bottom nav)
 *
 * BACKEND HOOKS :
 * ─────────────────────────────────────────
 * • GET /api/auth/me                                    → session + vendorId
 * • GET /api/vendors/{vendorId}/stats                   → KPI (polling 60s)
 * • GET /api/vendors/{vendorId}/transactions?page&status&q → paginated list
 * • GET /api/vendors/{vendorId}/qrcode?format=png&size=512  → image QR
 * • PATCH /api/vendors/{vendorId}                       → update profile
 * • WS /ws/vendor/{vendorId}                            → real-time events
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, Clock, CheckCircle2, AlertTriangle, QrCode,
  Download, Copy, ArrowUpRight, Settings, BarChart3, Receipt,
  Bell, Search, Filter, ExternalLink, Wallet, Package, Banknote,
  Shield, LogOut, Home, ChevronRight, X, Menu,
} from "lucide-react";
import { OperatorLogo } from "@/components/PaymentLogos";

// ─── IMAGES ───────────────────────────────────────────────────────────────
const PRODUCT_IMGS = [
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614267861476-0d127425e31e?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=80&h=80&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=80&h=80&fit=crop&q=80",
];

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
// TODO BACKEND: GET /api/vendors/{vendorId}/transactions
const TRANSACTIONS = [
  { id: "VRF-001", buyer: "Aminata K.",     phone: "+225 07 11 22 33", amount: 15000, product: "Robe wax bleue M",     date: "09/06 · 14:32", status: "FUNDS_SECURED",  operator: "MTN",    imgIdx: 0 },
  { id: "VRF-002", buyer: "Kofi M.",         phone: "+225 05 44 55 66", amount: 45000, product: "Ensemble 3 pièces",   date: "08/06 · 09:15", status: "DELIVERED",       operator: "Orange", imgIdx: 1 },
  { id: "VRF-003", buyer: "Fatou D.",        phone: "+225 01 77 88 99", amount: 8500,  product: "Foulard soie",        date: "07/06 · 18:45", status: "DELIVERED",       operator: "Wave",   imgIdx: 2 },
  { id: "VRF-004", buyer: "Ibrahim S.",      phone: "+225 07 33 44 55", amount: 22000, product: "Boubou traditionnel", date: "07/06 · 11:20", status: "PENDING_DEPOSIT", operator: "MTN",    imgIdx: 3 },
  { id: "VRF-005", buyer: "Marie-Laure T.", phone: "+225 05 66 77 88", amount: 35000, product: "Tenue cérémonie",     date: "06/06 · 16:00", status: "IN_DISPUTE",      operator: "Orange", imgIdx: 4 },
  { id: "VRF-006", buyer: "Seydou B.",       phone: "+225 01 22 33 44", amount: 12000, product: "Chemise ankara L",   date: "05/06 · 10:30", status: "DELIVERED",       operator: "MTN",    imgIdx: 5 },
  { id: "VRF-007", buyer: "Awa T.",          phone: "+225 07 55 66 77", amount: 19500, product: "Robe de soirée",     date: "04/06 · 13:15", status: "FUNDS_SECURED",   operator: "Wave",   imgIdx: 6 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  PENDING_DEPOSIT: { label: "En attente",      color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    dot: "bg-amber-400",   icon: Clock         },
  FUNDS_SECURED:   { label: "Fonds sécurisés", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-500",    icon: Shield        },
  DELIVERED:       { label: "Livré",            color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",dot: "bg-emerald-500", icon: CheckCircle2  },
  IN_DISPUTE:      { label: "En litige",        color: "text-red-700",     bg: "bg-red-50 border-red-200",        dot: "bg-red-500",     icon: AlertTriangle },
};

const NAV = [
  { id: "overview",     icon: BarChart3, label: "Vue d'ensemble", labelShort: "Accueil"   },
  { id: "transactions", icon: Receipt,   label: "Transactions",   labelShort: "Transactions" },
  { id: "qrcode",       icon: QrCode,    label: "QR Code",        labelShort: "QR Code"   },
  { id: "settings",     icon: Settings,  label: "Paramètres",     labelShort: "Réglages"  },
];

// TODO BACKEND: GET /api/vendors/{vendorId}/stats
const totalRevenue  = TRANSACTIONS.filter(t => t.status === "DELIVERED").reduce((s, t) => s + t.amount, 0);
const pendingAmount = TRANSACTIONS.filter(t => t.status === "FUNDS_SECURED").reduce((s, t) => s + t.amount, 0);
const pendingCount  = TRANSACTIONS.filter(t => t.status === "FUNDS_SECURED" || t.status === "PENDING_DEPOSIT").length;
const disputeCount  = TRANSACTIONS.filter(t => t.status === "IN_DISPUTE").length;

// ─── COMPOSANT ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate]    = useLocation();
  const [activeNav,     setActiveNav]     = useState("overview");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [searchQ,       setSearchQ]       = useState("");
  const [copiedQR,      setCopiedQR]      = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [txDetail,      setTxDetail]      = useState<typeof TRANSACTIONS[0] | null>(null);

  // TODO BACKEND: GET /api/vendors/{vendorId}/transactions?status&q
  const filteredTx = TRANSACTIONS.filter(t => {
    const ok = statusFilter === "ALL" || t.status === statusFilter;
    const q  = searchQ.toLowerCase();
    return ok && (!searchQ || t.buyer.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.product.toLowerCase().includes(q));
  });

  // TODO BACKEND: navigator.clipboard URL from GET /api/vendors/{vendorId}
  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://verifio.app/shop/boutique-luna");
    setCopiedQR(true);
    setTimeout(() => setCopiedQR(false), 2500);
  };

  const goTo = (id: string) => { setActiveNav(id); setSidebarOpen(false); setNotifOpen(false); };

  // ── Sidebar shared component ─────────────────────────────────────────────
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white rounded-xl p-1">
              <img src="/logo.png" alt="Verifio" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">Verifio</span>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-black text-sm">BL</span>
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">Boutique de Luna</div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Certifiée Verifio
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <button key={item.id} onClick={() => goTo(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${activeNav === item.id ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "text-white/45 hover:text-white/80 hover:bg-white/5"}`}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.id === "transactions" && disputeCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{disputeCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/8 space-y-1">
        <button onClick={() => navigate("/shop/boutique-luna")} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/35 hover:text-white/60 hover:bg-white/5 text-sm transition-colors">
          <ExternalLink className="w-4 h-4" />Voir mon profil public
        </button>
        <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/35 hover:text-white/60 hover:bg-white/5 text-sm transition-colors">
          <Home className="w-4 h-4" />Retour à l'accueil
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/5 text-sm transition-colors">
          <LogOut className="w-4 h-4" />Déconnexion {/* TODO BACKEND: DELETE /api/auth/session */}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex">

      {/* ══════════════════════════════════════════════════════
          SIDEBAR — Desktop fixe
      ══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#0A192F] fixed inset-y-0 left-0 z-30 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* ══════════════════════════════════════════════════════
          SIDEBAR — Mobile drawer
      ══════════════════════════════════════════════════════ */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0A192F] lg:hidden flex flex-col shadow-2xl"
               style={{ animation: "slide-right 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
            <SidebarContent mobile />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-w-0">

        {/* ── Top bar ──────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100/80 shadow-sm">
          <div className="px-4 sm:px-6 h-16 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-[#0A192F] text-base sm:text-lg leading-tight">
                {activeNav === "overview" && "Vue d'ensemble"}
                {activeNav === "transactions" && "Transactions"}
                {activeNav === "qrcode" && "Mon QR Code"}
                {activeNav === "settings" && "Paramètres"}
              </h1>
              <p className="text-gray-400 text-xs hidden sm:block">Boutique de Luna · Certifiée Verifio</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <button onClick={() => setNotifOpen(v => !v)} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                {disputeCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{disputeCount}</span>}
                {notifOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <span className="font-bold text-[#0A192F] text-sm">Notifications</span>
                      <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    {[
                      { icon: AlertTriangle, color: "text-red-500 bg-red-50",      title: "Litige ouvert",       desc: "Marie-Laure T. a contesté",     time: "il y a 2h" },
                      { icon: Shield,        color: "text-blue-500 bg-blue-50",    title: "Fonds sécurisés",     desc: "Awa T. — 19 500 FCFA via Wave",  time: "il y a 4h" },
                      { icon: CheckCircle2,  color: "text-emerald-500 bg-emerald-50", title: "Livraison confirmée", desc: "Kofi M. a confirmé sa réception", time: "hier"  },
                    ].map((n, i) => (
                      <div key={i} className="flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                        <div className={`w-8 h-8 rounded-xl ${n.color} flex items-center justify-center flex-shrink-0`}><n.icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#0A192F] text-xs">{n.title}</div>
                          <div className="text-gray-400 text-xs truncate">{n.desc}</div>
                          <div className="text-gray-300 text-[10px] mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center cursor-pointer">
                <span className="text-white font-black text-xs">BL</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 space-y-4 sm:space-y-5 overflow-x-hidden">

          {/* ═══════════════════════════════════════════════
              OVERVIEW
          ═══════════════════════════════════════════════ */}
          {activeNav === "overview" && (
            <>
              {/* Dispute alert */}
              {disputeCount > 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-red-700 text-sm">{disputeCount} litige{disputeCount > 1 ? "s" : ""} en attente</div>
                    <div className="text-red-500 text-xs mt-0.5">Répondez dans les 48h pour éviter le remboursement automatique.</div>
                  </div>
                  <button onClick={() => goTo("transactions")} className="text-red-600 text-xs font-bold flex-shrink-0">Voir →</button>
                </div>
              )}

              {/* KPI cards — 2×2 sur mobile, 4 colonnes sur desktop */}
              {/* TODO BACKEND: GET /api/vendors/{vendorId}/stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: Banknote,   label: "Revenus libérés",   value: `${totalRevenue.toLocaleString("fr-FR")}`, unit: "FCFA",  sub: "+12% ce mois", iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", badgeColor: "text-emerald-600 bg-emerald-50" },
                  { icon: Clock,      label: "Fonds en attente",  value: `${pendingAmount.toLocaleString("fr-FR")}`, unit: "FCFA", sub: `${pendingCount} en cours`,  iconBg: "bg-blue-50",     iconColor: "text-blue-600",    badgeColor: "text-blue-600 bg-blue-50"       },
                  { icon: Package,    label: "Transactions",       value: `${TRANSACTIONS.length}`,                   unit: "total", sub: "depuis le début", iconBg: "bg-violet-50",   iconColor: "text-violet-600",  badgeColor: "text-violet-600 bg-violet-50"   },
                  { icon: TrendingUp, label: "Score confiance",   value: "100",                                       unit: "%",    sub: "⭐ Excellent",    iconBg: "bg-amber-50",    iconColor: "text-amber-500",   badgeColor: "text-amber-600 bg-amber-50"     },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                        <c.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badgeColor}`}>{c.sub}</span>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-[#0A192F] leading-tight">
                      {c.value} <span className="text-xs sm:text-sm font-semibold text-gray-400">{c.unit}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-medium leading-tight">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart — status breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-[#0A192F]">Répartition des statuts</h3>
                  <span className="text-xs text-gray-400">{TRANSACTIONS.length} transactions</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = TRANSACTIONS.filter(t => t.status === key).length;
                    const pct   = Math.round((count / TRANSACTIONS.length) * 100);
                    const Icon  = cfg.icon;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600 text-xs font-medium truncate">{cfg.label}</span>
                            <span className="font-bold text-[#0A192F] text-xs ml-2 flex-shrink-0">{count} · {pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${cfg.dot} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent transactions — with product images */}
              <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-black text-[#0A192F]">Transactions récentes</h3>
                  <button onClick={() => goTo("transactions")} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-bold">
                    Voir tout <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {TRANSACTIONS.slice(0, 5).map(tx => {
                    const s = STATUS_CONFIG[tx.status];
                    return (
                      <button key={tx.id} onClick={() => setTxDetail(tx)}
                        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/70 transition-colors text-left">
                        {/* Product image thumbnail */}
                        <img
                          src={PRODUCT_IMGS[tx.imgIdx]}
                          alt={tx.product}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                          loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[#0A192F] text-sm truncate">{tx.buyer}</span>
                            <span className="font-black text-[#0A192F] text-sm ml-2 flex-shrink-0">{tx.amount.toLocaleString("fr-FR")} <span className="text-gray-400 font-normal text-xs">F</span></span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-400 truncate">{tx.product}</span>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════
              TRANSACTIONS TAB
              TODO BACKEND: GET /api/vendors/{vendorId}/transactions?page&status&q
          ═══════════════════════════════════════════════ */}
          {activeNav === "transactions" && (
            <>
              {/* Filters */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="search" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Acheteur, produit, ID…"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm" />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {[{ k: "ALL", label: "Tout" }, ...Object.entries(STATUS_CONFIG).map(([k, c]) => ({ k, label: c.label }))].map(({ k, label }) => (
                    <button key={k} onClick={() => setStatusFilter(k)}
                      className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${statusFilter === k ? "bg-[#0A192F] text-white border-[#0A192F]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {["", "ID", "Acheteur", "Produit", "Opérateur", "Montant", "Date", "Statut"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredTx.map(tx => {
                        const s = STATUS_CONFIG[tx.status];
                        return (
                          <tr key={tx.id} onClick={() => setTxDetail(tx)} className="hover:bg-gray-50/70 transition-colors cursor-pointer">
                            <td className="pl-4 py-3">
                              <img src={PRODUCT_IMGS[tx.imgIdx]} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                                loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </td>
                            <td className="px-4 py-3"><span className="text-xs font-mono font-semibold text-gray-400">{tx.id}</span></td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-[#0A192F] text-sm">{tx.buyer}</div>
                              <div className="text-xs text-gray-400">{tx.phone}</div>
                            </td>
                            <td className="px-4 py-3"><span className="text-sm text-gray-600">{tx.product}</span></td>
                            <td className="px-4 py-3"><div className="flex items-center gap-1.5"><OperatorLogo id={tx.operator.toLowerCase()} size={22} /><span className="text-xs font-semibold text-gray-700">{tx.operator}</span></div></td>
                            <td className="px-4 py-3"><span className="font-black text-[#0A192F] text-sm">{tx.amount.toLocaleString("fr-FR")}</span> <span className="text-xs text-gray-400">FCFA</span></td>
                            <td className="px-4 py-3"><span className="text-xs text-gray-400">{tx.date}</span></td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredTx.length === 0 && (
                  <div className="text-center py-16 text-gray-400"><Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune transaction trouvée</p></div>
                )}
                <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{filteredTx.length} résultat{filteredTx.length > 1 ? "s" : ""}</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600"><Wallet className="w-3.5 h-3.5 text-gray-400" />Total : {filteredTx.reduce((s, t) => s + t.amount, 0).toLocaleString("fr-FR")} FCFA</div>
                </div>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filteredTx.length === 0 && (
                  <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100"><Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune transaction trouvée</p></div>
                )}
                {filteredTx.map(tx => {
                  const s = STATUS_CONFIG[tx.status];
                  return (
                    <button key={tx.id} onClick={() => setTxDetail(tx)}
                      className="w-full bg-white border border-gray-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-3">
                      <img src={PRODUCT_IMGS[tx.imgIdx]} alt={tx.product} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                        loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="font-black text-[#0A192F] text-sm leading-tight">{tx.buyer}</div>
                            <div className="text-gray-400 text-xs mt-0.5 truncate">{tx.product}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-[#0A192F] text-base">{tx.amount.toLocaleString("fr-FR")}</div>
                            <div className="text-gray-400 text-[10px]">FCFA</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400"><OperatorLogo id={tx.operator.toLowerCase()} size={16} />{tx.operator} · {tx.date}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredTx.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                    <span className="text-xs text-gray-400">Total : </span>
                    <span className="text-sm font-black text-[#0A192F]">{filteredTx.reduce((s, t) => s + t.amount, 0).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════
              QR CODE TAB
              TODO BACKEND: GET /api/vendors/{vendorId}/qrcode
          ═══════════════════════════════════════════════ */}
          {activeNav === "qrcode" && (
            <div className="max-w-sm mx-auto space-y-5">
              <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-sm text-center">
                <h3 className="font-black text-[#0A192F] text-lg mb-1">Votre QR Code de confiance</h3>
                <p className="text-gray-400 text-sm mb-7 leading-relaxed">Partagez-le sur vos stories Instagram et statuts WhatsApp.</p>

                <div className="relative w-52 h-52 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F] to-[#112240] rounded-3xl p-4 shadow-2xl shadow-[#0A192F]/30">
                    <div className="w-full h-full bg-white rounded-2xl p-3 grid grid-cols-7 gap-0.5">
                      {Array(49).fill(0).map((_, i) => {
                        const r = Math.sin(i * 13 + 7) > 0.1;
                        return <div key={i} className={`rounded-[1px] ${r ? "bg-[#0A192F]" : "bg-white"}`} />;
                      })}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-lg p-1.5 border-2 border-gray-100">
                      <img src="/logo.png" alt="" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 border border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Lien public</div>
                  <div className="font-mono text-sm text-[#0A192F] font-bold break-all">verifio.app/shop/boutique-luna</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* TODO BACKEND: GET /api/vendors/{vendorId}/qrcode?format=png */}
                  <button className="flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#0d2040] text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm">
                    <Download className="w-4 h-4" />Télécharger
                  </button>
                  <button onClick={handleCopyLink} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all text-sm border-2 ${copiedQR ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                    {copiedQR ? <><CheckCircle2 className="w-4 h-4" />Copié !</> : <><Copy className="w-4 h-4" />Copier</>}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm">
                <h4 className="font-bold text-[#0A192F] mb-4 text-sm">📱 Comment utiliser votre QR Code</h4>
                <div className="space-y-3">
                  {[
                    { e: "📸", t: "Téléchargez et publiez sur votre story Instagram avec le texte « Achetez en sécurité »" },
                    { e: "💬", t: "Partagez le lien dans vos groupes WhatsApp et dans votre bio Instagram" },
                    { e: "🛍️", t: "Invitez chaque client à payer via ce lien — escrow automatique" },
                  ].map((x, i) => (
                    <div key={i} className="flex items-start gap-3"><span className="text-lg flex-shrink-0">{x.e}</span><p className="text-gray-500 text-xs leading-relaxed">{x.t}</p></div>
                  ))}
                </div>
              </div>

              <button onClick={() => navigate("/shop/boutique-luna")} className="w-full flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors">
                <ExternalLink className="w-4 h-4" />Voir mon profil public
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SETTINGS TAB
              TODO BACKEND: GET/PATCH /api/vendors/{vendorId}
          ═══════════════════════════════════════════════ */}
          {activeNav === "settings" && (
            <div className="max-w-xl space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm">
                <h3 className="font-black text-[#0A192F] mb-5">Profil de la boutique</h3>
                <div className="space-y-4">
                  {[
                    { label: "Nom de la boutique",  value: "Boutique de Luna",   type: "text", hint: "Affiché sur votre profil public" },
                    { label: "Slug (URL publique)",  value: "boutique-luna",      type: "text", hint: "verifio.app/shop/[slug]" },
                    { label: "Numéro WhatsApp",      value: "+225 07 12 34 56",   type: "tel",  hint: "Avec indicatif pays" },
                    { label: "Instagram",            value: "@boutiqueluna_ci",   type: "text", hint: "" },
                    { label: "Catégorie",            value: "Mode & Vêtements",   type: "text", hint: "" },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                      <input type={f.type} defaultValue={f.value} className="w-full px-4 py-3 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-sm text-gray-900 outline-none transition-colors" />
                      {f.hint && <p className="mt-1 text-xs text-gray-400">{f.hint}</p>}
                    </div>
                  ))}
                  {/* TODO BACKEND: PATCH /api/vendors/{vendorId} */}
                  <button className="w-full py-3.5 bg-[#0A192F] hover:bg-[#0d2040] text-white font-black rounded-xl text-sm transition-colors">Sauvegarder</button>
                </div>
              </div>

              {/* Notifications — TODO BACKEND: GET/PATCH /api/vendors/{vendorId}/notification-preferences */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm">
                <h3 className="font-black text-[#0A192F] mb-5">Notifications</h3>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: "Nouveau paiement",    desc: "SMS + WhatsApp", on: true  },
                    { label: "Livraison confirmée", desc: "SMS + Email",    on: true  },
                    { label: "Litige ouvert",       desc: "Tous canaux",   on: true  },
                    { label: "Récap hebdo",         desc: "Email seul",    on: false },
                  ].map((n, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5">
                      <div>
                        <div className="font-semibold text-[#0A192F] text-sm">{n.label}</div>
                        <div className="text-xs text-gray-400">{n.desc}</div>
                      </div>
                      <div className={`w-11 h-6 rounded-full flex items-center cursor-pointer transition-all duration-200 p-0.5 ${n.on ? "bg-emerald-500 justify-end" : "bg-gray-200 justify-start"}`}>
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><h3 className="font-black text-red-700">Zone de danger</h3></div>
                <p className="text-sm text-gray-400 mb-4">Ces actions sont irréversibles.</p>
                {/* TODO BACKEND: DELETE /api/vendors/{vendorId} */}
                <button className="w-full py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 text-sm transition-colors">Suspendre mon compte</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════
          BOTTOM NAV — Mobile uniquement (fixed, au-dessus du contenu)
      ══════════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex">
          {NAV.map(item => (
            <button key={item.id} onClick={() => goTo(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 sm:py-3 relative transition-colors ${activeNav === item.id ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}>
              <item.icon className={`w-5 h-5 transition-transform ${activeNav === item.id ? "scale-110" : ""}`} />
              <span className="text-[10px] font-bold leading-tight">{item.labelShort}</span>
              {activeNav === item.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />}
              {item.id === "transactions" && disputeCount > 0 && (
                <span className="absolute top-1.5 right-1/4 translate-x-1/2 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{disputeCount}</span>
              )}
            </button>
          ))}
        </div>
        {/* Safe area bottom (iOS) */}
        <div className="h-safe-area-inset-bottom" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </nav>

      {/* ══════════════════════════════════════════════════════
          TRANSACTION DETAIL MODAL
          TODO BACKEND: GET /api/escrow/{transactionId}
      ══════════════════════════════════════════════════════ */}
      {txDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTxDetail(null)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
               style={{ animation: "fade-up 0.3s ease" }}>
            <div className="bg-[#0A192F] px-5 py-4 flex items-center justify-between">
              <span className="text-white font-bold text-sm">Détail · {txDetail.id}</span>
              <button onClick={() => setTxDetail(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="p-5">
              {/* Product image in modal */}
              <div className="flex items-center gap-3 mb-5 bg-[#F8FAFC] rounded-2xl p-3 border border-gray-100">
                <img src={PRODUCT_IMGS[txDetail.imgIdx]} alt={txDetail.product} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                <div>
                  <div className="font-black text-[#0A192F] text-sm">{txDetail.product}</div>
                  <div className="text-gray-400 text-xs">{txDetail.date}</div>
                </div>
              </div>
              <div className="space-y-0 divide-y divide-gray-50">
                {[
                  ["Acheteur", txDetail.buyer],
                  ["Téléphone", txDetail.phone],
                  ["Montant", `${txDetail.amount.toLocaleString("fr-FR")} FCFA`],
                  ["Opérateur", txDetail.operator],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-3">
                    <span className="text-gray-400 text-sm">{k}</span>
                    <span className="font-bold text-[#0A192F] text-sm">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400 text-sm">Statut</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${STATUS_CONFIG[txDetail.status].bg} ${STATUS_CONFIG[txDetail.status].color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[txDetail.status].dot}`} />
                    {STATUS_CONFIG[txDetail.status].label}
                  </span>
                </div>
              </div>

              {txDetail.status === "IN_DISPUTE" && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex gap-2.5 items-start mt-4">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-700 text-sm">Litige en cours</div>
                    <p className="text-red-500 text-xs mt-0.5">Répondez dans les 48h pour éviter le remboursement automatique.</p>
                    {/* TODO BACKEND: POST /api/disputes/{transactionId}/respond */}
                    <button className="mt-2 text-xs font-bold text-red-600 underline">Répondre →</button>
                  </div>
                </div>
              )}
              {txDetail.status === "FUNDS_SECURED" && (
                /* TODO BACKEND: POST /api/escrow/{transactionId}/mark-delivered */
                <button className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-500/20">
                  ✓ Marquer comme livré
                </button>
              )}
              <button onClick={() => setTxDetail(null)} className="w-full mt-3 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

