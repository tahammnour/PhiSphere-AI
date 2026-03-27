import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";


export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message ?? "Check your admin panel for reset instructions.");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040B16] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-block">
            <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-12 w-auto mx-auto mb-4" />
          </button>
          <h1 className="text-2xl font-display font-bold text-white">Reset Password</h1>
          <p className="text-sm text-slate-400 mt-1">Enter your username and we'll help you recover access.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">
          {message ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-white">Account Located</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
                Contact your lab administrator at <span className="font-semibold">support@phisphere.ai</span> with your username to receive a temporary password.
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300">Username</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="Your PhiSphere username"
                    autoFocus
                    className={cn(
                      "w-full rounded-xl border bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all",
                      "focus:ring-2 focus:ring-blue-500/40",
                      error ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
                    )}
                  />
                </div>
                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />{error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : "Find My Account"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
