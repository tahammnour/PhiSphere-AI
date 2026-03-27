import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, MessageSquare, Loader2, CheckCircle2, BookOpen, CreditCard, ShieldAlert, Lightbulb } from "lucide-react";

const TOPICS = [
  { id: "billing", label: "Billing & Payments", icon: CreditCard },
  { id: "technical", label: "Technical Support", icon: ShieldAlert },
  { id: "research", label: "Lab Notebook Help", icon: BookOpen },
  { id: "feature", label: "Feature Request", icon: Lightbulb },
  { id: "other", label: "Other", icon: MessageSquare },
];

export default function Contact() {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic || !subject.trim() || !message.trim() || !email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: topic, subject: subject.trim(), message: message.trim(), email: email.trim() }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040B16] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1 as unknown as string)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Contact Us</h1>
            <p className="text-sm text-slate-400 mt-0.5">We typically respond within one business day</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Message Received</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Thank you for reaching out. Our team will reply to{" "}
              <span className="text-white font-medium">{email}</span> within one business day.
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:border-white/20 transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                What can we help you with?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TOPICS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTopic(id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      topic === id
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/8 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/15"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your question"
                maxLength={120}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue in detail…"
                rows={6}
                maxLength={2000}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none leading-relaxed"
              />
              <p className="text-right text-[11px] text-slate-600 mt-1">{message.length}/2000</p>
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-teal-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(0,201,177,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,201,177,0.4)] disabled:opacity-60 disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Direct contact</p>
          <div className="space-y-2 text-sm text-slate-400">
            <p>General support: <a href="mailto:support@phisphere.ai" className="text-primary hover:underline">support@phisphere.ai</a></p>
            <p>Privacy &amp; data requests: <a href="mailto:privacy@phisphere.ai" className="text-primary hover:underline">privacy@phisphere.ai</a></p>
            <p>Billing enquiries: <a href="mailto:billing@phisphere.ai" className="text-primary hover:underline">billing@phisphere.ai</a></p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
          <button onClick={() => navigate("/billing-faq")} className="hover:text-slate-300 transition-colors">Billing FAQ</button>
          <span>·</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
          <span>·</span>
          <button onClick={() => navigate("/terms")} className="hover:text-slate-300 transition-colors">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
