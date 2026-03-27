import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Copy, Download, RefreshCw, Loader2, AlertCircle, BookOpen, FlaskConical, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaperOutline {
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
}

export interface PaperDraft {
  abstract: string;
  materialsAndMethods: string;
  outline: PaperOutline;
  sessionName: string;
  domain: string;
  generatedAt: string;
}

interface PaperDraftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PaperDraft | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  sessionName: string;
}

type TabId = "abstract" | "mm" | "outline";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "abstract", label: "Abstract", icon: FileSearch },
  { id: "mm", label: "Materials & Methods", icon: FlaskConical },
  { id: "outline", label: "Full Outline", icon: BookOpen },
];

const OUTLINE_SECTIONS: { key: keyof PaperOutline; label: string }[] = [
  { key: "introduction", label: "Introduction" },
  { key: "methods", label: "Methods Summary" },
  { key: "results", label: "Results" },
  { key: "discussion", label: "Discussion" },
  { key: "conclusion", label: "Conclusion" },
];

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border",
        copied
          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          : "bg-white/[0.04] text-slate-400 border-white/8 hover:text-slate-200 hover:bg-white/[0.07] hover:border-white/15"
      )}
    >
      <Copy className="h-3 w-3" />
      {copied ? "Copied!" : label}
    </button>
  );
}

function ExportButton({ filename, content }: { filename: string; content: string }) {
  return (
    <button
      onClick={() => downloadMarkdown(filename, content)}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border bg-white/[0.04] text-slate-400 border-white/8 hover:text-slate-200 hover:bg-white/[0.07] hover:border-white/15"
    >
      <Download className="h-3 w-3" />
      Export .md
    </button>
  );
}

function EditableSection({
  label,
  value,
  onChange,
  exportFilename,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  exportFilename: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <CopyButton text={value} />
          <ExportButton filename={exportFilename} content={`# ${label}\n\n${value}`} />
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 leading-relaxed resize-y focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 placeholder:text-slate-600 transition-colors"
        placeholder="No content generated yet."
      />
    </div>
  );
}

export function PaperDraftDrawer({
  isOpen,
  onClose,
  draft,
  isLoading,
  error,
  onRegenerate,
  sessionName,
}: PaperDraftDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("abstract");

  const [editedAbstract, setEditedAbstract] = useState("");
  const [editedMM, setEditedMM] = useState("");
  const [editedOutline, setEditedOutline] = useState<PaperOutline>({
    introduction: "",
    methods: "",
    results: "",
    discussion: "",
    conclusion: "",
  });

  useEffect(() => {
    if (draft) {
      setEditedAbstract(draft.abstract);
      setEditedMM(draft.materialsAndMethods);
      setEditedOutline({ ...draft.outline });
    }
  }, [draft]);

  const handleRegenerate = () => {
    setEditedAbstract("");
    setEditedMM("");
    setEditedOutline({ introduction: "", methods: "", results: "", discussion: "", conclusion: "" });
    onRegenerate();
  };

  const fullMarkdown = draft
    ? [
        `# ${sessionName} — Research Paper Draft`,
        `*Generated by PhiSphere AI on ${new Date(draft.generatedAt).toLocaleString()}*`,
        "",
        "## Abstract",
        "",
        editedAbstract,
        "",
        "## Materials and Methods",
        "",
        editedMM,
        "",
        "## Introduction",
        "",
        editedOutline.introduction,
        "",
        "## Methods Summary",
        "",
        editedOutline.methods,
        "",
        "## Results",
        "",
        editedOutline.results,
        "",
        "## Discussion",
        "",
        editedOutline.discussion,
        "",
        "## Conclusion",
        "",
        editedOutline.conclusion,
      ].join("\n")
    : "";

  const safeFilename = sessionName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-2xl border-l border-white/10 bg-[#090f1c] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30 shrink-0">
                  <FileText className="h-4 w-4 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">Research Paper Draft</h2>
                  <p className="text-[11px] text-slate-500 truncate">{sessionName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {draft && (
                  <>
                    <CopyButton text={fullMarkdown} label="Copy All" />
                    <ExportButton filename={`${safeFilename}_draft.md`} content={fullMarkdown} />
                  </>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  title="Regenerate draft"
                  className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] hover:border-white/15 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                  {isLoading ? "Generating…" : "Regenerate"}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/8 px-4 pt-3 pb-0 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-xs font-semibold border-b-2 transition-all",
                    activeTab === tab.id
                      ? "border-violet-400 text-violet-300"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
                    <Loader2 className="h-7 w-7 text-violet-400 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">Drafting your paper…</p>
                    <p className="text-xs text-slate-500 mt-1">Azure OpenAI is analyzing your session data and chat history</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-300">Generation Failed</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    className="mt-1 flex items-center gap-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/25 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Try Again
                  </button>
                </div>
              ) : !draft ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
                    <FileText className="h-7 w-7 text-violet-400/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400">No draft yet</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
                      Click "Regenerate" to generate a paper draft using your session data and chat history.
                    </p>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    className="mt-1 flex items-center gap-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/25 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Generate Draft
                  </button>
                </div>
              ) : activeTab === "abstract" ? (
                <EditableSection
                  label="Abstract"
                  value={editedAbstract}
                  onChange={setEditedAbstract}
                  exportFilename={`${safeFilename}_abstract.md`}
                />
              ) : activeTab === "mm" ? (
                <EditableSection
                  label="Materials and Methods"
                  value={editedMM}
                  onChange={setEditedMM}
                  exportFilename={`${safeFilename}_materials_methods.md`}
                />
              ) : (
                <div className="space-y-5">
                  {OUTLINE_SECTIONS.map((s) => (
                    <EditableSection
                      key={s.key}
                      label={s.label}
                      value={editedOutline[s.key]}
                      onChange={(v) => setEditedOutline((prev) => ({ ...prev, [s.key]: v }))}
                      exportFilename={`${safeFilename}_${s.key}.md`}
                    />
                  ))}
                </div>
              )}
            </div>

            {draft && (
              <div className="border-t border-white/8 px-5 py-2.5 shrink-0">
                <p className="text-[10px] text-slate-600 text-center">
                  Generated {new Date(draft.generatedAt).toLocaleString()} · Edits are local only
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
