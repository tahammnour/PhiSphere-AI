import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink, Shield, Eye, Cpu, FlaskConical, Database, Zap, CheckCircle2, Brain, FileText, Search, Languages, Activity, GraduationCap } from "lucide-react";

function ArchNode({ icon: Icon, label, sublabel, color = "primary", badge }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel?: string;
  color?: "primary" | "blue" | "purple" | "slate";
  badge?: string;
}) {
  const colorMap = {
    primary: "border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(0,201,177,0.15)]",
    blue: "border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    purple: "border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    slate: "border-slate-500/40 bg-slate-500/10 text-slate-400",
  };

  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 text-center transition-all hover:scale-105 ${colorMap[color]}`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ${color === "primary" ? "bg-primary/20 ring-primary/30" : color === "blue" ? "bg-blue-500/20 ring-blue-500/30" : color === "purple" ? "bg-purple-500/20 ring-purple-500/30" : "bg-slate-500/20 ring-slate-500/30"}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-bold">{label}</p>
        {sublabel && <p className="text-[11px] opacity-60 mt-0.5">{sublabel}</p>}
      </div>
      {badge && (
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border border-current/20">
          {badge}
        </span>
      )}
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <svg className="text-primary/50" width="40" height="24" viewBox="0 0 40 24" fill="none">
        <path d="M0 12h32M26 6l8 6-8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>}
    </div>
  );
}

const PRINCIPLES = [
  { icon: Shield, label: "Safety", desc: "Azure AI Content Safety screens every response with fail-closed enforcement — no potentially unsafe content is ever delivered." },
  { icon: Eye, label: "Transparency", desc: "Reasoning trace and data grounding are always visible via the Responsible AI panel, powered by Microsoft Responsible AI Toolbox principles." },
  { icon: Brain, label: "Accountability", desc: "Safety metadata is stored per-message, creating a full audit trail in PostgreSQL for every AI interaction." },
  { icon: CheckCircle2, label: "Reliability", desc: "Graceful degradation with informative notices when Azure services are unconfigured or unavailable — no silent failures." },
];

const TECH_STACK = [
  { name: "Azure OpenAI", desc: "GPT-4o scientific reasoning & protocol analysis", category: "AI" },
  { name: "Azure Content Safety", desc: "Fail-closed content moderation for every response", category: "Safety" },
  { name: "Azure AI Vision", desc: "Image OCR, captions & object detection for lab photos", category: "Vision" },
  { name: "Azure Document Intelligence", desc: "PDF extraction into structured text chunks for RAG", category: "Docs" },
  { name: "Azure AI Search", desc: "Vector + keyword search for RAG grounding with citations", category: "Search" },
  { name: "Azure AI Language", desc: "Named entity recognition (chemicals, genes, instruments)", category: "NLP" },
  { name: "Azure Application Insights", desc: "Telemetry, custom events & exception tracking", category: "Ops" },
  { name: "Azure Machine Learning", desc: "Experiment tracking & RAI Toolbox notebooks", category: "ML" },
  { name: "PostgreSQL", desc: "Persistent experiment store", category: "Database" },
  { name: "Express + SSE", desc: "Real-time streaming API", category: "Backend" },
  { name: "React + Vite", desc: "Scientific dark UI", category: "Frontend" },
  { name: "Responsible AI Toolbox", desc: "Explainability & fairness principles", category: "RAI" },
  { name: "Drizzle ORM", desc: "Type-safe database schema management", category: "Backend" },
];

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab Notebook
        </button>

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-6">
            <img src="/images/phisphere-logo.png" alt="PhiSphere AI" className="h-14 w-auto" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-4">
            <span className="glow-text">PhiSphere</span>{" "}
            <span className="text-foreground">AI</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            An agentic lab notebook assistant powered by Azure OpenAI, Azure AI safety services, and Responsible AI principles — built for scientific researchers.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="rounded-3xl border border-border/50 bg-card/30 p-8 mb-10 backdrop-blur-sm shadow-[0_0_60px_rgba(0,201,177,0.05)]">
          <h2 className="text-xl font-display font-bold text-center mb-8 text-foreground">System Architecture</h2>

          {/* Main Flow */}
          <div className="flex items-center justify-center flex-wrap gap-2 mb-6">
            <ArchNode icon={FlaskConical} label="Researcher" sublabel="Lab Notebook UI" color="slate" />
            <Arrow label="HTTPS" />
            <ArchNode icon={Zap} label="PhiSphere AI" sublabel="React + Vite" color="primary" badge="Frontend" />
            <Arrow label="SSE Stream" />
            <ArchNode icon={Database} label="Express API" sublabel="Node.js + PostgreSQL" color="blue" badge="Backend" />
          </div>

          {/* API layer detail */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
            <div className="w-8" />
            <div className="flex flex-col items-center gap-1">
              <svg className="text-primary/30 rotate-90" width="24" height="40" viewBox="0 0 24 40" fill="none">
                <path d="M12 0v32M6 26l6 8 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] text-muted-foreground">Azure AI Services (8)</span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <ArchNode icon={Cpu} label="Azure OpenAI" sublabel="GPT-4o" color="purple" badge="Core" />
              <ArchNode icon={Shield} label="Content Safety" sublabel="Fail-Closed Screening" color="primary" badge="Safety" />
              <ArchNode icon={Eye} label="AI Vision" sublabel="Image & OCR" color="blue" badge="Upload" />
              <ArchNode icon={FileText} label="Doc Intelligence" sublabel="PDF Extraction" color="blue" badge="RAG" />
              <ArchNode icon={Search} label="AI Search" sublabel="Vector + Keyword" color="purple" badge="RAG" />
              <ArchNode icon={Languages} label="AI Language" sublabel="Entity Recognition" color="primary" badge="NLP" />
              <ArchNode icon={Activity} label="App Insights" sublabel="Telemetry" color="slate" badge="Ops" />
              <ArchNode icon={GraduationCap} label="Azure ML" sublabel="Experiment Tracking" color="purple" badge="ML" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="rounded-xl bg-primary/5 border border-primary/15 px-6 py-3 text-center">
              <p className="text-xs text-primary font-semibold mb-1">Safety-First Flow</p>
              <p className="text-[11px] text-slate-400">
                All AI responses are fully buffered → Azure Content Safety → then streamed to researcher
              </p>
            </div>
          </div>
        </div>

        {/* Responsible AI Principles */}
        <div className="mb-10">
          <h2 className="text-xl font-display font-bold text-center mb-2 text-foreground">Responsible AI Principles</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Inspired by the{" "}
            <a
              href="https://responsibleaitoolbox.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Microsoft Responsible AI Toolbox
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <div className="grid grid-cols-2 gap-4">
            {PRINCIPLES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-border/40 bg-card/30 p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-bold text-sm text-foreground">{label}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-10">
          <h2 className="text-xl font-display font-bold text-center mb-6 text-foreground">Technology Stack</h2>
          <div className="grid grid-cols-3 gap-3">
            {TECH_STACK.map(({ name, desc, category }) => (
              <div key={name} className="rounded-xl border border-border/40 bg-card/30 p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground leading-tight">{name}</span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase tracking-wider">
                    {category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Info */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Platform Stack</p>
          <p className="text-lg font-display font-bold text-foreground mb-1">PhiSphere AI — Intelligent Lab Notebook</p>
          <p className="text-sm text-slate-400">Scientific AI assistant powered by cutting-edge language and vision models</p>
          <p className="text-xs text-slate-500 mt-3">
            Azure OpenAI • Content Safety • AI Vision • Document Intelligence • AI Search • AI Language • Application Insights • Azure ML
          </p>
        </div>
      </div>
    </div>
  );
}
