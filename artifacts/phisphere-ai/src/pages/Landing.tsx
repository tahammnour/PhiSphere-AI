import { useLocation } from "wouter";
import { useRef, useState, useEffect } from "react";
import {
  motion, AnimatePresence, useInView, useMotionValue,
  useTransform, animate, useScroll, useSpring,
} from "framer-motion";
import {
  Microscope, FlaskConical, Brain, ShieldCheck, CheckCircle2,
  ArrowRight, Beaker, Dna, BarChart3, Atom, Users, FileText,
  CreditCard, RefreshCw, Lock, HelpCircle, ChevronDown, Zap, Star,
} from "lucide-react";

/* ─── helpers ─── */
function useCounter(end: number, duration = 2) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, end, {
      duration,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      },
    });
    return controls.stop;
  }, [inView, end, duration]);
  return ref;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── data ─── */
const STATS = [
  { value: 10000, suffix: "+", label: "Lab Sessions Created" },
  { value: 98, suffix: "%", label: "Safety Screen Pass Rate" },
  { value: 6, suffix: "", label: "Scientific Domains" },
  { value: 4, suffix: "s", label: "Avg Response Time" },
];

const SERVICES = [
  { icon: Brain, title: "AI Scientific Reasoning", desc: "Ask anything about your experiment — PhiSphere AI delivers structured answers with hypotheses, analysis, next steps, and citations.", tags: ["Azure OpenAI", "Structured Responses", "Multi-domain"], color: "blue" },
  { icon: Dna, title: "Data & Image Analysis", desc: "Upload CSV sensor files, gel images, or lab photos and get immediate AI-driven extraction and interpretation.", tags: ["CSV Parsing", "Image OCR", "Object Detection"], color: "indigo" },
  { icon: ShieldCheck, title: "Content Safety Screening", desc: "Every single AI response is run through AI Content Safety before it reaches you. Our system is fail-closed — if safety checks fail, the response is blocked.", tags: ["AI Safety", "Fail-Closed", "Real-time"], color: "violet" },
  { icon: BarChart3, title: "Responsible AI Dashboard", desc: "Each response comes with a full transparency panel: model confidence score, reasoning trace, data grounding level, and detected bias flags.", tags: ["Confidence Scores", "Bias Detection", "Explainability"], color: "blue" },
  { icon: FileText, title: "Lab Session Management", desc: "Create unlimited lab sessions, each scoped to a scientific domain. Conversations are persisted, organized, and searchable.", tags: ["Unlimited Sessions", "Persistent History", "Domain Scoping"], color: "indigo" },
  { icon: Users, title: "Team Collaboration", desc: "Share lab sessions with colleagues, assign roles, and collaborate in real time on shared experiments.", tags: ["Session Sharing", "Role-based Access", "Coming Soon"], color: "violet" },
];

const FEATURES = [
  { icon: Brain, title: "Azure OpenAI Scientific AI", desc: "Advanced reasoning with structured 4-section responses." },
  { icon: ShieldCheck, title: "Azure AI Safety", desc: "Every response screened — fail-closed for researchers." },
  { icon: FlaskConical, title: "Multi-Domain Support", desc: "Biology, chemistry, physics, and general science." },
  { icon: BarChart3, title: "Responsible AI Panel", desc: "Confidence scores, reasoning trace, and bias detection." },
  { icon: Dna, title: "CSV & Image Analysis", desc: "Vision AI extracts text and detects objects in uploads." },
  { icon: Atom, title: "Pre-Built Experiments", desc: "Start instantly with demo walkthroughs." },
];

const MONTHLY_FEATURES = ["Unlimited lab sessions", "Azure OpenAI assistant", "AI safety screening", "CSV & image analysis", "Responsible AI insights", "Community support"];
const ANNUAL_FEATURES = ["Everything in Monthly", "Priority response queue", "Advanced vision analysis", "Export to PDF reports", "Team collaboration (early access)", "Dedicated support channel"];

const FAQS = [
  { q: "When am I billed?", a: "Monthly subscribers are billed every 30 days from signup. Annual subscribers are billed once per year upfront at a significant discount." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from account settings at any time. Your access continues until the end of the current billing period — no proration, no hidden fees." },
  { q: "Can I switch between plans?", a: "Absolutely. Upgrade from Monthly to Annual anytime. We prorate your remaining monthly balance and apply it toward the annual plan." },
  { q: "What payment methods do you accept?", a: "All major credit and debit cards (Visa, Mastercard, Amex, Discover) via Stripe. All transactions are PCI-DSS compliant." },
  { q: "Is there a free trial?", a: "New accounts get access to pre-built demo experiments so you can explore the platform's full capabilities before committing." },
  { q: "Is my research data private?", a: "Your lab sessions are private to your account. We never use your research data to train AI models. Enterprise DPAs available on request." },
];

const SOCIAL = [
  { label: "Facebook", href: "https://facebook.com", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg> },
  { label: "X / Twitter", href: "https://twitter.com", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  { label: "Instagram", href: "https://instagram.com", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg> },
  { label: "LinkedIn", href: "https://linkedin.com", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
  { label: "YouTube", href: "https://youtube.com", icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
];

/* ─── FAQ accordion ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden cursor-pointer"
      whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between px-6 py-5 gap-4">
        <span className="text-sm font-semibold text-white">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── animated background blobs ─── */
function Blobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {[
        { x: "15%", y: "-10%", size: 700, color: "rgba(59,130,246,0.06)", dur: 18 },
        { x: "70%", y: "60%", size: 600, color: "rgba(99,102,241,0.06)", dur: 22 },
        { x: "40%", y: "30%", size: 500, color: "rgba(139,92,246,0.04)", dur: 26 },
        { x: "-5%", y: "70%", size: 400, color: "rgba(59,130,246,0.05)", dur: 20 },
      ].map((b, i) => (
        <motion.div
          key={i}
          style={{ left: b.x, top: b.y, width: b.size, height: b.size, background: b.color, filter: "blur(100px)", borderRadius: "50%" }}
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
          className="absolute"
        />
      ))}
    </div>
  );
}

/* ─── animated marquee strip ─── */
const MARQUEE_ITEMS = ["AI Content Safety", "Advanced Language Models", "Computer Vision", "Responsible AI", "Enterprise Security", "Lab Session AI", "CSV Analysis", "Fail-Closed Safety"];
function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.015] py-4">
      <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-[#040B16] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[#040B16] to-transparent z-10 pointer-events-none" />
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Zap className="h-3 w-3 text-blue-500/60" />
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── stat counter ─── */
function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useCounter(value, 2);
  return (
    <motion.div variants={cardVariant} className="text-center">
      <div className="text-4xl font-display font-extrabold text-white mb-1">
        <span ref={ref}>0</span>{suffix}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </motion.div>
  );
}

/* ─── service card ─── */
const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 ring-blue-500/20 group-hover:ring-blue-500/50 text-blue-400 border-blue-500/20 bg-blue-500/10",
  indigo: "bg-indigo-500/10 ring-indigo-500/20 group-hover:ring-indigo-500/50 text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
  violet: "bg-violet-500/10 ring-violet-500/20 group-hover:ring-violet-500/50 text-violet-400 border-violet-500/20 bg-violet-500/10",
};

/* ─── main component ─── */
export default function Landing() {
  const [, navigate] = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <div className="min-h-screen bg-[#040B16] text-foreground">

      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 origin-left z-50"
      />

      <Blobs />

      {/* Nav */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 border-b border-white/5 bg-[#040B16]/70 backdrop-blur-xl sticky top-0"
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <motion.img
            src="/images/phisphere-logo.png"
            alt="PhiSphere AI"
            className="h-10 w-auto cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
            {[["Services", "#services"], ["Pricing", "#pricing"], ["Billing", "#billing"]].map(([label, href]) => (
              <motion.a key={label} href={href} whileHover={{ color: "#fff" }} className="transition-colors">{label}</motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-300 border border-white/10 transition-colors"
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 35px rgba(99,102,241,0.55)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/signup")}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10">

        {/* ── HERO ── */}
        <section className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="space-y-6"
          >
            <motion.div variants={fadeUp}>
              <motion.div
                animate={{ boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 20px rgba(99,102,241,0.3)", "0 0 0px rgba(99,102,241,0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest"
              >
                <Star className="h-3 w-3" />
                Intelligent Scientific AI Platform
              </motion.div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-6xl sm:text-7xl font-display font-extrabold leading-tight tracking-tight">
              The AI Lab Notebook
              <motion.span
                className="block mt-1"
                style={{
                  background: "linear-gradient(135deg, #60a5fa, #818cf8, #a78bfa, #60a5fa)",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                Built for Scientists
              </motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-xl text-slate-400 leading-relaxed">
              Reason over protocols, analyze sensor data, interpret gel images, and discover scientific insights — all with AI safety built in from the ground up.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/signup")}
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.35)]"
              >
                <Beaker className="h-5 w-5" />
                Start Your Lab Notebook
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Already have an account →
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        {/* ── MARQUEE ── */}
        <Marquee />

        {/* ── STATS ── */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-8"
          >
            {STATS.map((s) => <StatCard key={s.label} {...s} />)}
          </motion.div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">What We Provide</p>
            <h2 className="text-4xl font-display font-bold mb-4">A Complete Scientific AI Platform</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Six core services working together to make your research faster, safer, and more rigorous.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map(({ icon: Icon, title, desc, tags, color }) => {
              const c = colorMap[color];
              const [icon, ring, iconText, tagBorder, tagBg] = c.split(" ");
              return (
                <motion.div
                  key={title}
                  variants={cardVariant}
                  whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", borderColor: "rgba(99,102,241,0.3)" }}
                  className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 cursor-default transition-colors duration-300"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${icon} ring-1 ${ring} transition-all`}
                  >
                    <Icon className={`h-6 w-6 ${iconText}`} />
                  </motion.div>
                  <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className={`rounded-full border ${tagBorder} ${tagBg} px-2.5 py-0.5 text-[11px] font-semibold ${iconText}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ── FEATURES ── */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Features</p>
            <h2 className="text-4xl font-display font-bold mb-4">Everything You Need to Do Better Science</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Powerful AI assistance with the safety and transparency that rigorous research demands.</p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={cardVariant}
                whileHover={{ backgroundColor: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.25)" }}
                className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 pb-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Pricing</p>
            <h2 className="text-4xl font-display font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Choose the plan that fits your research workflow. Cancel anytime.</p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto"
          >
            {/* Monthly */}
            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8"
            >
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Monthly</div>
              <div className="mb-1 flex items-end gap-2">
                <span className="text-5xl font-display font-extrabold text-white">$29</span>
                <span className="text-slate-400 pb-1">/month</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">Perfect for individual researchers and students.</p>
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/signup?plan=monthly")}
                className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-white transition-colors mb-6"
              >
                Start Monthly Plan
              </motion.button>
              <ul className="space-y-3">
                {MONTHLY_FEATURES.map((f) => (
                  <motion.li key={f} className="flex items-start gap-2.5 text-sm text-slate-300" whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                    {f}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Annual */}
            <motion.div
              variants={cardVariant}
              whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(99,102,241,0.2)" }}
              className="relative rounded-3xl border border-blue-500/40 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-violet-600/10 p-8"
            >
              <motion.div
                animate={{ boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 30px rgba(99,102,241,0.25)", "0 0 0px rgba(99,102,241,0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl pointer-events-none"
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-lg">
                Best Value — Save 43%
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">Annual</div>
              <div className="mb-1 flex items-end gap-2">
                <span className="text-5xl font-display font-extrabold text-white">$199</span>
                <span className="text-slate-400 pb-1">/year</span>
              </div>
              <p className="text-sm text-slate-400 mb-1">Just $16.58/month, billed annually.</p>
              <p className="text-xs text-blue-400 font-semibold mb-6">Save $149 vs monthly billing</p>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/signup?plan=annual")}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-6 transition-all"
              >
                Start Annual Plan
              </motion.button>
              <ul className="space-y-3">
                {ANNUAL_FEATURES.map((f) => (
                  <motion.li key={f} className="flex items-start gap-2.5 text-sm text-slate-300" whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                    {f}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* ── BILLING TRUST STRIP ── */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { icon: CreditCard, title: "Secure Payments", desc: "All billing via Stripe. PCI-DSS compliant. We never store card details." },
              { icon: RefreshCw, title: "Cancel Anytime", desc: "No lock-in. Cancel from settings — access continues to period end." },
              { icon: Lock, title: "Your Data is Private", desc: "Sessions are private. We never train AI models on your research." },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={cardVariant}
                whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.15)" }}
                className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors"
              >
                <Icon className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── BILLING FAQ ── */}
        <section id="billing" className="mx-auto max-w-3xl px-6 pb-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Billing & FAQ</p>
            <h2 className="text-4xl font-display font-bold mb-4">Questions About Your Subscription</h2>
            <p className="text-slate-400 text-lg">Everything you need to know about how billing works.</p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-3"
          >
            {FAQS.map((faq) => (
              <motion.div key={faq.q} variants={cardVariant}>
                <FaqItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-8 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-5"
          >
            <HelpCircle className="h-5 w-5 text-slate-400 shrink-0" />
            <p className="text-sm text-slate-400">
              Still have questions?{" "}
              <a href="mailto:support@phisphere.ai" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Contact our support team
              </a>
            </p>
          </motion.div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ boxShadow: "0 30px 80px rgba(99,102,241,0.2)" }}
            className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 p-14 text-center relative overflow-hidden"
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-4"
            >
              <Microscope className="mx-auto h-14 w-14 text-blue-400" />
            </motion.div>
            <h2 className="mb-3 text-4xl font-display font-bold">Ready to Elevate Your Research?</h2>
            <p className="mb-8 text-slate-400 text-xl max-w-xl mx-auto">Join researchers using PhiSphere AI to reason more rigorously and discover insights faster.</p>
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 0 55px rgba(99,102,241,0.55)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-12 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]"
            >
              Get Started Today
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </motion.button>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/5 pt-12 pb-8">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-10 mb-10">
              <div>
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="/images/phisphere-logo.png"
                  alt="PhiSphere AI"
                  className="h-9 w-auto mb-3 cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                />
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                  Intelligent lab notebook AI for researchers who demand safety, transparency, and rigour.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-16 gap-y-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Product</p>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {[["Services", "#services"], ["Pricing", "#pricing"], ["Sign Up", "/signup"], ["Log In", "/login"]].map(([label, href]) => (
                      <li key={label}>
                        <motion.a
                          href={href}
                          whileHover={{ color: "#fff", x: 3 }}
                          className="transition-colors block"
                        >{label}</motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Support</p>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {[["Billing FAQ", "/billing-faq"], ["Contact Us", "/contact"], ["About", "/about"]].map(([label, href]) => (
                      <li key={label}>
                        <motion.a href={href} whileHover={{ color: "#fff", x: 3 }} className="transition-colors block">{label}</motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Legal</p>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {[
                      { label: "Privacy Policy", href: "/privacy" },
                      { label: "Terms of Service", href: "/terms" },
                      { label: "Cookie Policy", href: "/cookie-policy" },
                    ].map((l) => (
                      <li key={l.label}>
                        <motion.a href={l.href} whileHover={{ color: "#fff", x: 3 }} className="transition-colors block">{l.label}</motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-600">© 2026 PhiSphere AI. All rights reserved.</p>
              <div className="flex items-center gap-2">
                {SOCIAL.map(({ label, href, icon }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ scale: 1.15, color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500 transition-colors"
                  >
                    {icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
