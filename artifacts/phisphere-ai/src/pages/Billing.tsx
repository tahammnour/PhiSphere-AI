import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CreditCard, Tag, FileText, ChevronDown, ChevronUp,
  Check, AlertCircle, Download, Printer, Calendar, Sparkles, Shield,
  Zap, X, RefreshCw, CheckCircle2,
} from "lucide-react";
import { getStoredUser } from "@/hooks/use-auth";

const AVATAR_COLORS: Record<string, { from: string; to: string }> = {
  blue: { from: "from-blue-600", to: "to-indigo-600" },
  violet: { from: "from-violet-600", to: "to-purple-600" },
  emerald: { from: "from-emerald-500", to: "to-teal-600" },
  rose: { from: "from-rose-500", to: "to-pink-600" },
  amber: { from: "from-amber-500", to: "to-orange-600" },
  cyan: { from: "from-cyan-500", to: "to-blue-600" },
};

const PLAN_INFO: Record<string, { name: string; price: string; monthly: number; color: string; badge: string; features: string[] }> = {
  monthly: {
    name: "Monthly Plan", price: "$29.00 / month", monthly: 29,
    color: "text-blue-400", badge: "bg-blue-400/10 border-blue-400/20 text-blue-400",
    features: ["Unlimited lab sessions", "All 12 scientific domains", "Azure AI Vision", "Azure Content Safety", "Protocol templates", "CSV data visualization", "Markdown export"],
  },
  annual: {
    name: "Annual Plan", price: "$199.00 / year ($16.58/mo)", monthly: 199 / 12,
    color: "text-indigo-400", badge: "bg-indigo-400/10 border-indigo-400/20 text-indigo-400",
    features: ["Everything in Monthly", "4 months free vs monthly", "Priority support", "Early access to new features"],
  },
  free: {
    name: "Free Plan", price: "Free", monthly: 0,
    color: "text-slate-400", badge: "bg-slate-400/10 border-slate-400/20 text-slate-400",
    features: ["5 lab sessions", "Basic AI features"],
  },
};

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  period: { from: string; to: string };
  customer: { id: number; username: string };
  plan: { name: string; monthlyRate: number };
  lineItems: { description: string; period: string; quantity: number; unit: string; unitPrice: number; amount: number }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function Billing() {
  const [, navigate] = useLocation();
  const user = getStoredUser();
  const avatarColor = localStorage.getItem("phisphere_avatar_color") ?? "blue";
  const displayName = localStorage.getItem("phisphere_display_name") ?? "";
  const ac = AVATAR_COLORS[avatarColor] ?? AVATAR_COLORS.blue;
  const displayInitial = (displayName || user?.username || "?").charAt(0).toUpperCase();
  const effectiveName = displayName.trim() || user?.username || "Researcher";

  const plan = user?.plan ?? "free";
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.free;

  const savedPromo = JSON.parse(localStorage.getItem("phisphere_promo_data") ?? "null") as {
    code: string; label: string; description: string; discount: number; type: string; appliedAt: string;
  } | null;

  const [currentPlan, setCurrentPlan] = useState(plan);
  const [planSwitching, setPlanSwitching] = useState(false);
  const [planSwitchError, setPlanSwitchError] = useState("");
  const [planSwitchSuccess, setPlanSwitchSuccess] = useState("");

  const handleChangePlan = async (newPlan: "monthly" | "annual") => {
    if (newPlan === currentPlan) return;
    setPlanSwitching(true);
    setPlanSwitchError("");
    setPlanSwitchSuccess("");
    try {
      const token = localStorage.getItem("phisphere_auth_token");
      const res = await fetch("/api/auth/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json() as { error?: string; plan?: string };
      if (!res.ok) {
        setPlanSwitchError(data.error ?? "Failed to change plan.");
        return;
      }
      const storedUser = JSON.parse(localStorage.getItem("phisphere_auth_user") ?? "{}");
      storedUser.plan = data.plan;
      localStorage.setItem("phisphere_auth_user", JSON.stringify(storedUser));
      setCurrentPlan(data.plan ?? newPlan);
      setPlanSwitchSuccess(`Plan changed to ${data.plan === "annual" ? "Annual ($199/yr)" : "Monthly ($29/mo)"}!`);
      setTimeout(() => setPlanSwitchSuccess(""), 4000);
    } catch {
      setPlanSwitchError("Network error. Please try again.");
    } finally {
      setPlanSwitching(false);
    }
  };

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState<typeof savedPromo>(savedPromo);

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const token = localStorage.getItem("phisphere_auth_token");
      const res = await fetch("/api/billing/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json() as { error?: string; code?: string; label?: string; description?: string; discount?: number; type?: string; appliedAt?: string };
      if (!res.ok) {
        setPromoError(data.error ?? "Invalid promo code.");
        return;
      }
      const promo = { code: data.code!, label: data.label!, description: data.description!, discount: data.discount!, type: data.type!, appliedAt: data.appliedAt! };
      localStorage.setItem("phisphere_promo_data", JSON.stringify(promo));
      setPromoSuccess(promo);
      setPromoCode("");
    } catch {
      setPromoError("Network error. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    localStorage.removeItem("phisphere_promo_data");
    setPromoSuccess(null);
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError("");
    setInvoice(null);
    if (!fromDate || !toDate) { setInvoiceError("Please select both dates."); return; }
    setInvoiceLoading(true);
    try {
      const token = localStorage.getItem("phisphere_auth_token");
      const res = await fetch(`/api/billing/invoice?from=${fromDate}&to=${toDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as InvoiceData & { error?: string };
      if (!res.ok) { setInvoiceError(data.error ?? "Failed to generate invoice."); return; }
      setInvoice(data);
    } catch {
      setInvoiceError("Network error. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#040B16] text-foreground overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/4 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-10 print:hidden">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-1">Billing & Payments</h1>
          <p className="text-slate-500 text-sm">Manage your subscription, promo codes, and download invoices</p>
        </motion.div>

        {/* Current Plan */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Current Subscription</h2>
          </div>

          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ac.from} ${ac.to} text-2xl font-bold text-white shadow-lg`}>
                {displayInitial}
              </div>
              <div>
                <p className="text-base font-bold text-white">{effectiveName}</p>
                <p className="text-sm text-slate-500">@{user?.username}</p>
                <span className={`inline-block text-xs font-bold rounded-full border px-2.5 py-0.5 mt-1 ${planInfo.badge}`}>{planInfo.name}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xl font-bold ${planInfo.color}`}>{plan === "free" ? "Free" : plan === "annual" ? "$199.00" : "$29.00"}</p>
              <p className="text-xs text-slate-600">{plan === "annual" ? "per year" : plan === "monthly" ? "per month" : ""}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Plan Features</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {planInfo.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {promoSuccess && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-400">{promoSuccess.label} Active</p>
                  <p className="text-xs text-slate-500">{promoSuccess.description} · Code: <span className="font-mono font-bold text-slate-400">{promoSuccess.code}</span></p>
                </div>
              </div>
              <button onClick={handleRemovePromo} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Plan Upgrade / Downgrade */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <RefreshCw className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Change Plan</h2>
          </div>

          {planSwitchSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{planSwitchSuccess}
            </div>
          )}
          {planSwitchError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{planSwitchError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "monthly" as const,
                label: "Monthly",
                price: "$29",
                period: "/month",
                savings: null,
                color: "border-blue-500/40 bg-blue-500/10",
                activeColor: "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30",
                badge: "text-blue-400",
                features: ["Cancel anytime", "All features included"],
              },
              {
                id: "annual" as const,
                label: "Annual",
                price: "$199",
                period: "/year",
                savings: "Save $149 vs monthly",
                color: "border-indigo-500/40 bg-indigo-500/10",
                activeColor: "border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/30",
                badge: "text-indigo-400",
                features: ["4 months free", "Priority support"],
              },
            ].map((p) => {
              const isActive = currentPlan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleChangePlan(p.id)}
                  disabled={planSwitching || isActive}
                  className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${isActive ? p.activeColor : p.color + " hover:border-opacity-70 hover:opacity-90"} disabled:cursor-not-allowed`}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      <Check className="h-2.5 w-2.5" /> Current
                    </span>
                  )}
                  {p.savings && (
                    <span className="mb-2 rounded-full bg-amber-400/15 border border-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">{p.savings}</span>
                  )}
                  <p className="text-sm font-bold text-white mb-0.5">{p.label}</p>
                  <p className={`text-2xl font-display font-bold ${p.badge}`}>
                    {p.price}<span className="text-xs font-normal text-slate-500">{p.period}</span>
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  {!isActive && (
                    <div className={`mt-3 w-full rounded-xl border ${p.id === "annual" ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-400" : "border-blue-500/30 bg-blue-500/15 text-blue-400"} py-1.5 text-xs font-bold text-center`}>
                      {planSwitching ? "Switching..." : `Switch to ${p.label}`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-slate-600 text-center">Plan changes take effect immediately. No prorated refunds for mid-cycle changes.</p>
        </motion.div>

        {/* Promo Code */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <Tag className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Promo Code</h2>
          </div>

          {promoSuccess ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-4 text-center">
              <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-400">Promo Code Applied!</p>
              <p className="text-xs text-slate-500 mt-1">{promoSuccess.description}</p>
              <p className="text-xs text-slate-600 mt-0.5">Applied on {fmtDate(promoSuccess.appliedAt)}</p>
              <button onClick={handleRemovePromo} className="mt-3 text-xs text-slate-600 hover:text-slate-400 underline transition-colors">
                Remove promo code
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyPromo} className="space-y-3">
              <p className="text-xs text-slate-500">Enter a valid promo code to unlock discounts or additional features.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  placeholder="e.g. PHISPHERE20"
                  maxLength={20}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all uppercase"
                />
                <button
                  type="submit"
                  disabled={promoLoading || !promoCode.trim()}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-2.5 text-sm font-bold text-amber-400 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  {promoLoading ? "Applying..." : "Apply"}
                </button>
              </div>
              {promoError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {promoError}
                </div>
              )}
            </form>
          )}
        </motion.div>

        {/* Invoice Generator */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <FileText className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Payment Invoice</h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">Generate an invoice for any billing period. Select the date range and download or print the invoice.</p>

          <form onSubmit={handleGenerateInvoice} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={toDate}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate}
                    max={todayStr}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {invoiceError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {invoiceError}
              </div>
            )}

            <button
              type="submit"
              disabled={invoiceLoading || !fromDate || !toDate}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/20 py-2.5 text-sm font-bold text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {invoiceLoading ? "Generating..." : "Generate Invoice"}
            </button>
          </form>
        </motion.div>

        {/* Invoice Preview */}
        <AnimatePresence>
          {invoice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-2xl border border-blue-500/20 bg-white/[0.02] overflow-hidden mb-4"
            >
              {/* Invoice actions */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <p className="text-sm font-bold text-white">Invoice Preview</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                  <button
                    onClick={() => setInvoice(null)}
                    className="rounded-lg p-1.5 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div ref={invoiceRef} className="p-8">
                {/* Invoice Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Φ</span>
                      </div>
                      <span className="text-lg font-bold text-white">PhiSphere AI</span>
                    </div>
                    <p className="text-xs text-slate-500">Intelligent Lab Notebook Platform</p>
                    <p className="text-xs text-slate-600">support@phisphere.ai</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Invoice</p>
                    <p className="text-sm font-mono font-bold text-white">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-slate-500 mt-1">Issued: {fmtDate(invoice.issuedAt)}</p>
                    <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-0.5 mt-2 ${invoice.status === "paid" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/15 text-blue-400 border border-blue-500/20"}`}>
                      {invoice.status === "complimentary" ? "Complimentary" : "Paid"}
                    </span>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Bill To</p>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-sm font-semibold text-white">{effectiveName}</p>
                    <p className="text-xs text-slate-500">@{invoice.customer.username}</p>
                    <p className="text-xs text-slate-600">PhiSphere AI Account</p>
                  </div>
                </div>

                {/* Period */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Billing Period</p>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <p className="text-sm text-slate-300">{fmtDate(invoice.period.from)} – {fmtDate(invoice.period.to)}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-6">
                  <div className="rounded-xl border border-white/8 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    {invoice.lineItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/5">
                        <div className="col-span-6">
                          <p className="text-sm text-slate-200">{item.description}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{item.period}</p>
                        </div>
                        <div className="col-span-2 text-right text-sm text-slate-400">{item.quantity.toFixed(2)} {item.unit}</div>
                        <div className="col-span-2 text-right text-sm text-slate-400">{fmt(item.unitPrice)}</div>
                        <div className="col-span-2 text-right text-sm font-semibold text-white">{fmt(item.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Subtotal</span>
                      <span>{fmt(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax > 0 && (
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Tax</span>
                        <span>{fmt(invoice.tax)}</span>
                      </div>
                    )}
                    {promoSuccess && (
                      <div className="flex justify-between text-sm text-emerald-400">
                        <span>Promo ({promoSuccess.code})</span>
                        <span>-{promoSuccess.discount}{promoSuccess.type === "percent" ? "%" : " days"}</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold text-white">
                      <span>Total</span>
                      <span>{fmt(invoice.total)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 text-center border-t border-white/5 pt-4">
                  Thank you for using PhiSphere AI. For questions contact support@phisphere.ai
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Print-only invoice */}
      {invoice && (
        <div className="hidden print:block p-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">PhiSphere AI</h1>
              <p className="text-sm text-gray-500">Intelligent Lab Notebook Platform</p>
              <p className="text-sm text-gray-500">support@phisphere.ai</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Invoice</p>
              <p className="font-mono font-bold text-lg">{invoice.invoiceNumber}</p>
              <p className="text-sm text-gray-500">Issued: {fmtDate(invoice.issuedAt)}</p>
              <p className="text-sm font-bold mt-1">{invoice.status === "complimentary" ? "Complimentary" : "PAID"}</p>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Bill To</p>
            <p className="font-semibold">{effectiveName}</p>
            <p className="text-sm text-gray-600">@{invoice.customer.username} · PhiSphere AI Account</p>
          </div>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Billing Period</p>
            <p>{fmtDate(invoice.period.from)} – {fmtDate(invoice.period.to)}</p>
          </div>
          <table className="w-full border-collapse mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2">
                    <div>{item.description}</div>
                    <div className="text-xs text-gray-500">{item.period}</div>
                  </td>
                  <td className="text-right py-2">{item.quantity.toFixed(2)} {item.unit}</td>
                  <td className="text-right py-2">{fmt(item.unitPrice)}</td>
                  <td className="text-right py-2 font-semibold">{fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-48">
              <div className="flex justify-between py-1 text-sm"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
              <div className="flex justify-between py-1 border-t font-bold"><span>Total</span><span>{fmt(invoice.total)} USD</span></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center border-t pt-4 mt-8">
            Thank you for using PhiSphere AI — support@phisphere.ai
          </p>
        </div>
      )}
    </div>
  );
}
