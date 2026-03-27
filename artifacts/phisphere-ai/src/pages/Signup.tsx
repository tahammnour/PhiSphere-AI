import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function PlanBadge({ plan, selected, onClick }: { plan: "monthly" | "annual"; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border-2 p-4 text-left transition-all duration-200",
        selected
          ? plan === "annual"
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-400 bg-white/5"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{plan}</span>
        {plan === "annual" && (
          <span className="rounded-full bg-blue-600/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">Best Value</span>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-display font-extrabold text-white">
          {plan === "monthly" ? "$29" : "$199"}
        </span>
        <span className="text-slate-400 text-xs pb-0.5">{plan === "monthly" ? "/mo" : "/yr"}</span>
      </div>
      {plan === "annual" && <p className="text-[11px] text-blue-400 mt-0.5">Save 43% vs monthly</p>}
    </button>
  );
}

export default function Signup() {
  const [, navigate] = useLocation();
  const { signup, isLoading, error, setError } = useAuth();

  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const defaultPlan = urlParams.get("plan") === "annual" ? "annual" : "monthly";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [plan, setPlan] = useState<"monthly" | "annual">(defaultPlan);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim() || username.trim().length < 3) errs.username = "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) errs.username = "Username can only contain letters, numbers, underscores, dots, and hyphens.";
    if (!password || password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (!activationCode.trim()) errs.activationCode = "Activation code is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    const ok = await signup(username.trim(), password, activationCode.trim(), plan);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#040B16] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-block">
            <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-12 w-auto mx-auto mb-4" />
          </button>
          <h1 className="text-2xl font-display font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Start your scientific AI journey today</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Plan Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Choose Your Plan</label>
              <div className="flex gap-3">
                <PlanBadge plan="monthly" selected={plan === "monthly"} onClick={() => setPlan("monthly")} />
                <PlanBadge plan="annual" selected={plan === "annual"} onClick={() => setPlan("annual")} />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: "" })); }}
                placeholder="e.g. dr_johnson"
                autoComplete="username"
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all",
                  "focus:ring-2 focus:ring-blue-500/40",
                  fieldErrors.username ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
                )}
              />
              {fieldErrors.username && (
                <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" />{fieldErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" })); }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className={cn(
                    "w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all",
                    "focus:ring-2 focus:ring-blue-500/40",
                    fieldErrors.password ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" />{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all",
                  "focus:ring-2 focus:ring-blue-500/40",
                  fieldErrors.confirmPassword ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
                )}
              />
              {fieldErrors.confirmPassword && (
                <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" />{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Activation Code */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Activation Code</label>
              <input
                type="text"
                value={activationCode}
                onChange={(e) => { setActivationCode(e.target.value); if (fieldErrors.activationCode) setFieldErrors((p) => ({ ...p, activationCode: "" })); setError(""); }}
                placeholder="Enter your activation code"
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 outline-none transition-all",
                  "focus:ring-2 focus:ring-blue-500/40",
                  fieldErrors.activationCode ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
                )}
              />
              {fieldErrors.activationCode && (
                <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" />{fieldErrors.activationCode}</p>
              )}
            </div>

            {/* Server error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Account &amp; Activate
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
