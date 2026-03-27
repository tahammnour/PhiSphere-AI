import { useState } from "react";
import { X, MessageSquarePlus, CheckCircle2, Loader2, Bug, Lightbulb, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationContext";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPES = [
  { id: "bug", label: "Bug Report", icon: Bug, color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "other", label: "Other", icon: HelpCircle, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
];

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [type, setType] = useState("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { notify } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message, email }),
      });
      setDone(true);
      notify({ type: "success", title: "Feedback sent!", message: "Thanks for helping improve PhiSphere AI." });
      setTimeout(() => {
        onClose();
        setDone(false);
        setSubject("");
        setMessage("");
        setEmail("");
        setType("bug");
      }, 1500);
    } catch {
      notify({ type: "error", title: "Failed to send feedback", message: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9991] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0d1829] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Send Feedback</h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Thanks for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-2 font-semibold">Type</p>
              <div className="flex gap-2">
                {TYPES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setType(id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                      type === id ? color : "border-white/10 text-slate-500 bg-white/3 hover:bg-white/6"
                    )}
                  >
                    <Icon className="h-3 w-3" />{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Subject (optional)</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue or suggestion in detail…"
                rows={4}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Your email (optional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-bold text-white transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
              Send Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
