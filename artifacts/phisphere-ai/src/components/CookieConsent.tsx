import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const COOKIE_KEY = "phisphere_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "essential-only");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9998] border-t border-white/10 bg-[#080f1e]/95 backdrop-blur-xl px-6 py-4 shadow-2xl transition-transform duration-500",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Cookie className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">We use cookies</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              PhiSphere AI uses essential browser storage for authentication and session management.
              By clicking "Accept All", you consent to our use of cookies. Read our{" "}
              <button onClick={() => navigate("/cookie-policy")} className="text-blue-400 hover:underline">Cookie Policy</button>
              {" "}and{" "}
              <button onClick={() => navigate("/privacy")} className="text-blue-400 hover:underline">Privacy Policy</button>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={decline}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={accept}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-colors"
          >
            Accept All
          </button>
          <button onClick={decline} className="text-slate-600 hover:text-slate-400 transition-colors ml-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
