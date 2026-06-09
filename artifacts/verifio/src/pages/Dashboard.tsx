import { useState } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ChevronLeft,
  Download,
  Copy,
  ArrowUpRight,
  Settings,
  BarChart3,
  Receipt,
  Bell,
  Search,
  Filter,
  ExternalLink,
  Wallet,
  Package,
  Banknote,
} from "lucide-react";

const TRANSACTIONS = [
  {
    id: "VRF-001",
    buyer: "Aminata K.",
    phone: "+225 07 11 22 33",
    amount: 15000,
    product: "Robe wax bleue M",
    date: "2026-06-09 14:32",
    status: "FUNDS_SECURED",
    operator: "MTN",
  },
  {
    id: "VRF-002",
    buyer: "Kofi M.",
    phone: "+225 05 44 55 66",
    amount: 45000,
    product: "Ensemble 3 pièces",
    date: "2026-06-08 09:15",
    status: "DELIVERED",
    operator: "Orange",
  },
  {
    id: "VRF-003",
    buyer: "Fatou D.",
    phone: "+225 01 77 88 99",
    amount: 8500,
    product: "Foulard soie",
    date: "2026-06-07 18:45",
    status: "DELIVERED",
    operator: "Wave",
  },
  {
    id: "VRF-004",
    buyer: "Ibrahim S.",
    phone: "+225 07 33 44 55",
    amount: 22000,
    product: "Boubou traditionnel",
    date: "2026-06-07 11:20",
    status: "PENDING_DEPOSIT",
    operator: "MTN",
  },
  {
    id: "VRF-005",
    buyer: "Marie-Laure T.",
    phone: "+225 05 66 77 88",
    amount: 35000,
    product: "Tenue cérémonie",
    date: "2026-06-06 16:00",
    status: "IN_DISPUTE",
    operator: "Orange",
  },
  {
    id: "VRF-006",
    buyer: "Seydou B.",
    phone: "+225 01 22 33 44",
    amount: 12000,
    product: "Chemise ankara L",
    date: "2026-06-05 10:30",
    status: "DELIVERED",
    operator: "MTN",
  },
  {
    id: "VRF-007",
    buyer: "Awa T.",
    phone: "+225 07 55 66 77",
    amount: 19500,
    product: "Robe de soirée",
    date: "2026-06-04 13:15",
    status: "FUNDS_SECURED",
    operator: "Wave",
  },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING_DEPOSIT: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  FUNDS_SECURED: {
    label: "Fonds sécurisés",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  DELIVERED: {
    label: "Livré",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  IN_DISPUTE: {
    label: "En litige",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

const NAV_ITEMS = [
  { id: "overview", icon: BarChart3, label: "Vue d'ensemble" },
  { id: "transactions", icon: Receipt, label: "Transactions" },
  { id: "qrcode", icon: QrCode, label: "QR Code" },
  { id: "settings", icon: Settings, label: "Paramètres" },
];

const totalRevenue = TRANSACTIONS.filter(
  (t) => t.status === "DELIVERED"
).reduce((s, t) => s + t.amount, 0);
const pendingAmount = TRANSACTIONS.filter(
  (t) => t.status === "FUNDS_SECURED"
).reduce((s, t) => s + t.amount, 0);
const pendingCount = TRANSACTIONS.filter(
  (t) => t.status === "FUNDS_SECURED" || t.status === "PENDING_DEPOSIT"
).length;

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [activeNav, setActiveNav] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQ, setSearchQ] = useState("");
  const [copiedQR, setCopiedQR] = useState(false);

  const filteredTx = TRANSACTIONS.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchSearch =
      !searchQ ||
      t.buyer.toLowerCase().includes(searchQ.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQ.toLowerCase()) ||
      t.product.toLowerCase().includes(searchQ.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://verifio.app/shop/boutique-luna");
    setCopiedQR(true);
    setTimeout(() => setCopiedQR(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A192F] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Verifio</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-black text-base">L</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                Boutique de Luna
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Certifiée Verifio
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeNav === item.id
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors px-4 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile nav toggle */}
              <button
                onClick={() => navigate("/")}
                className="lg:hidden flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-[#0A192F] text-base">
                  {activeNav === "overview" && "Vue d'ensemble"}
                  {activeNav === "transactions" && "Mes Transactions"}
                  {activeNav === "qrcode" && "Mon QR Code"}
                  {activeNav === "settings" && "Paramètres"}
                </h1>
                <p className="text-gray-400 text-xs">
                  Boutique de Luna · Certifiée Verifio
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] flex items-center justify-center">
                <span className="text-white font-black text-sm">L</span>
              </div>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="lg:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeNav === item.id
                    ? "bg-[#0A192F] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* OVERVIEW TAB */}
          {activeNav === "overview" && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      +12%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#0A192F]">
                    {totalRevenue.toLocaleString("fr-FR")} FCFA
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Revenus Libérés
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                      {pendingCount} en cours
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#0A192F]">
                    {pendingAmount.toLocaleString("fr-FR")} FCFA
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Fonds en Attente
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-violet-600" />
                    </div>
                    <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-1 rounded-full">
                      Total
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#0A192F]">
                    {TRANSACTIONS.length}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Transactions Totales
                  </div>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-[#0A192F] mb-5">
                  Répartition par statut
                </h3>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const count = TRANSACTIONS.filter(
                      (t) => t.status === key
                    ).length;
                    const pct = Math.round((count / TRANSACTIONS.length) * 100);
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${config.dot}`}
                            />
                            <span className="text-gray-600">{config.label}</span>
                          </div>
                          <span className="font-semibold text-[#0A192F]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${config.dot} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent transactions preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-[#0A192F]">
                    Transactions Récentes
                  </h3>
                  <button
                    onClick={() => setActiveNav("transactions")}
                    className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
                  >
                    Voir tout <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {TRANSACTIONS.slice(0, 4).map((tx) => {
                    const s = STATUS_CONFIG[tx.status];
                    return (
                      <div
                        key={tx.id}
                        className="px-6 py-4 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-bold text-sm">
                            {tx.buyer.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#0A192F] text-sm">
                              {tx.buyer}
                            </span>
                            <span className="font-bold text-[#0A192F] text-sm">
                              {tx.amount.toLocaleString("fr-FR")} FCFA
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400 truncate mr-2">
                              {tx.product}
                            </span>
                            <span
                              className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS TAB */}
          {activeNav === "transactions" && (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="search"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Rechercher acheteur, produit, ID..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {["ALL", ...Object.keys(STATUS_CONFIG)].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        statusFilter === s
                          ? "bg-[#0A192F] text-white"
                          : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {s === "ALL"
                        ? "Tout"
                        : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Acheteur
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Produit
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Opérateur
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredTx.map((tx) => {
                        const s = STATUS_CONFIG[tx.status];
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono text-gray-400">
                                {tx.id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-semibold text-[#0A192F] text-sm">
                                  {tx.buyer}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {tx.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="text-sm text-gray-600">
                                {tx.product}
                              </span>
                            </td>
                            <td className="px-6 py-4 hidden sm:table-cell">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                {tx.operator}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-[#0A192F] text-sm">
                                {tx.amount.toLocaleString("fr-FR")}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                FCFA
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                                />
                                {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredTx.length === 0 && (
                    <div className="text-center py-16 text-gray-400 text-sm">
                      Aucune transaction trouvée
                    </div>
                  )}
                </div>
                <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {filteredTx.length} transaction(s) affichée(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">
                      Total filtré :{" "}
                      {filteredTx
                        .reduce((s, t) => s + t.amount, 0)
                        .toLocaleString("fr-FR")}{" "}
                      FCFA
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* QR CODE TAB */}
          {activeNav === "qrcode" && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <h3 className="font-bold text-[#0A192F] text-lg mb-2">
                  Votre QR Code de confiance
                </h3>
                <p className="text-gray-400 text-sm mb-8">
                  Partagez ce QR code sur vos stories Instagram et WhatsApp pour
                  que vos clients puissent vous vérifier et payer en sécurité.
                </p>

                {/* QR Code visual */}
                <div className="relative w-56 h-56 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F] to-[#1a3a6b] rounded-3xl p-5 shadow-2xl">
                    {/* Simulated QR pattern */}
                    <div className="w-full h-full bg-white rounded-2xl p-3 grid grid-cols-7 gap-0.5">
                      {Array(49)
                        .fill(0)
                        .map((_, i) => {
                          const isCorner =
                            (i < 7 && (i < 3 || i > 3)) ||
                            (i >= 42 && (i < 45 || i > 46)) ||
                            (i % 7 === 0 && Math.floor(i / 7) < 3) ||
                            (i % 7 === 6 && Math.floor(i / 7) > 3 && Math.floor(i / 7) < 7);
                          const isRandom = Math.sin(i * 7 + 3) > 0.2;
                          return (
                            <div
                              key={i}
                              className={`rounded-sm ${isCorner || isRandom ? "bg-[#0A192F]" : "bg-white"}`}
                            />
                          );
                        })}
                    </div>
                  </div>
                  {/* Center logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl p-3 mb-6">
                  <div className="text-xs text-gray-400 mb-1">
                    Lien direct de votre boutique
                  </div>
                  <div className="font-mono text-sm text-[#0A192F] font-semibold">
                    verifio.app/shop/boutique-luna
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 bg-[#0A192F] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#0d2040] transition-colors text-sm">
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all text-sm border ${
                      copiedQR
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {copiedQR ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copier lien
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-[#0A192F] mb-4 text-sm">
                  Comment utiliser votre QR Code
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      icon: "📸",
                      text: 'Téléchargez et publiez sur votre story Instagram avec le texte "Achetez en confiance"',
                    },
                    {
                      icon: "💬",
                      text: "Partagez le lien direct dans vos groupes WhatsApp pour vos clients réguliers",
                    },
                    {
                      icon: "🔗",
                      text: "Ajoutez le lien en bio Instagram pour une confiance instantanée",
                    },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-lg">{tip.icon}</span>
                      <p className="text-gray-500 leading-relaxed">{tip.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate("/shop/boutique-luna")}
                className="w-full flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir votre profil public
              </button>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeNav === "settings" && (
            <div className="max-w-xl space-y-5">
              {/* Profile settings */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-[#0A192F] mb-5">
                  Profil de la boutique
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Nom de la boutique", value: "Boutique de Luna" },
                    { label: "Numéro WhatsApp", value: "+225 07 12 34 56" },
                    {
                      label: "Instagram",
                      value: "@boutiqueluna_ci",
                    },
                    { label: "Catégorie", value: "Mode & Vêtements" },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        defaultValue={field.value}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button className="w-full py-3 bg-[#0A192F] text-white font-bold rounded-xl hover:bg-[#0d2040] transition-colors text-sm">
                    Sauvegarder les modifications
                  </button>
                </div>
              </div>

              {/* Notification settings */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-[#0A192F] mb-5">
                  Notifications
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Nouveau paiement reçu",
                      description: "SMS + WhatsApp",
                      on: true,
                    },
                    {
                      label: "Livraison confirmée",
                      description: "SMS + Email",
                      on: true,
                    },
                    {
                      label: "Litige ouvert",
                      description: "SMS + WhatsApp + Email",
                      on: true,
                    },
                    {
                      label: "Récapitulatif hebdomadaire",
                      description: "Email uniquement",
                      on: false,
                    },
                  ].map((notif, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-semibold text-[#0A192F] text-sm">
                          {notif.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {notif.description}
                        </div>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                          notif.on
                            ? "bg-emerald-500 justify-end"
                            : "bg-gray-200 justify-start"
                        } p-0.5`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-red-700">Zone de danger</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Ces actions sont irréversibles. Procédez avec prudence.
                </p>
                <button className="w-full py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm">
                  Suspendre mon compte Verifio
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
