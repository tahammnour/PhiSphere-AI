import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isLoading, error, setError } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = "Username is required.";
    if (!password) errs.password = "Password is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    const ok = await login(username.trim(), password);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#040B16] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-block">
            <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-12 w-auto mx-auto mb-4" />
          </button>
          <h1 className="text-2xl font-display font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your PhiSphere AI account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: "" })); setError(""); }}
                placeholder="Your username"
                autoComplete="username"
                autoFocus
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
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" })); setError(""); }}
                  placeholder="Your password"
                  autoComplete="current-password"
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
                  <LogIn className="h-4 w-4" />
                  Sign In to Your Lab
                </>
              )}
            </button>

          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Forgot your password?
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign up
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Need an activation code?{" "}
          <button onClick={() => navigate("/")} className="text-slate-500 hover:text-slate-400 underline transition-colors">
            View pricing plans
          </button>
        </p>
      </div>
    </div>
  );
}
