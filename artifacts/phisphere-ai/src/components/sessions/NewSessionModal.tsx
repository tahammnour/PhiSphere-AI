import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Dna, FlaskConical, Atom, Book, Brain, Leaf, Pill, ClipboardList,
  Layers, Star, BarChart3, Microscope, AlertCircle, ChevronDown, ChevronUp, Wand2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListTemplates, type ProtocolTemplate } from "@workspace/api-client-react";

export interface NewSessionData {
  name: string;
  description: string;
  domain: string;
  starterPrompt?: string;
}

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewSessionData) => Promise<unknown>;
  isCreating: boolean;
}

const DOMAINS = [
  { id: "biology", label: "Biology", icon: Dna, color: "text-green-400" },
  { id: "neuroscience", label: "Neuroscience", icon: Brain, color: "text-violet-400" },
  { id: "genetics", label: "Genetics", icon: Microscope, color: "text-pink-400" },
  { id: "pharmacology", label: "Pharmacology", icon: Pill, color: "text-red-400" },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical, color: "text-purple-400" },
  { id: "materials", label: "Materials Sci.", icon: Layers, color: "text-amber-400" },
  { id: "environmental", label: "Environmental", icon: Leaf, color: "text-emerald-400" },
  { id: "clinical", label: "Clinical Trials", icon: ClipboardList, color: "text-blue-400" },
  { id: "physics", label: "Physics", icon: Atom, color: "text-cyan-400" },
  { id: "astrophysics", label: "Astrophysics", icon: Star, color: "text-yellow-400" },
  { id: "data-science", label: "Data Science", icon: BarChart3, color: "text-orange-400" },
  { id: "general", label: "General", icon: Book, color: "text-teal-400" },
];

const MAX_NAME_LENGTH = 80;
const MAX_DESC_LENGTH = 500;

export function NewSessionModal({ isOpen, onClose, onSubmit, isCreating }: NewSessionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("general");
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedStarterPrompt, setSelectedStarterPrompt] = useState<string | undefined>(undefined);

  const { data: templatesData, isLoading: templatesLoading } = useListTemplates();
  const templates: ProtocolTemplate[] = templatesData?.templates ?? [];

  const validateName = (value: string): string => {
    if (!value.trim()) return "Session name is required.";
    if (value.trim().length < 3) return "Name must be at least 3 characters.";
    if (value.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
    return "";
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (nameError) setNameError(validateName(val));
  };

  const handleNameBlur = () => {
    setNameError(validateName(name));
  };

  const applyTemplate = (t: ProtocolTemplate) => {
    setName(t.name);
    setDescription(t.description);
    setDomain(t.domain);
    setSelectedStarterPrompt(t.starterPrompt);
    setNameError("");
    setShowTemplates(false);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setDomain("general");
    setNameError("");
    setSubmitError("");
    setShowTemplates(false);
    setSelectedStarterPrompt(undefined);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }
    setSubmitError("");
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        domain,
        starterPrompt: selectedStarterPrompt,
      });
      setName("");
      setDescription("");
      setDomain("general");
      setNameError("");
      setSelectedStarterPrompt(undefined);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create session. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Lab Session"
      description="Create a dedicated space for your experiment protocol and data analysis."
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Session Name <span className="text-destructive">*</span>
            </label>
            <span className={cn(
              "text-[11px] tabular-nums",
              name.length > MAX_NAME_LENGTH ? "text-destructive" : "text-muted-foreground"
            )}>
              {name.length}/{MAX_NAME_LENGTH}
            </span>
          </div>
          <Input
            placeholder="e.g., Spectrophotometry of Cobalt(II) Chloride"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoFocus
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "name-error" : undefined}
            className={cn(nameError && "border-destructive focus-visible:ring-destructive/30")}
          />
          {nameError && (
            <p id="name-error" className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {nameError}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Scientific Domain</label>
            {(() => { const sel = DOMAINS.find((d) => d.id === domain); return sel ? (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <sel.icon className={cn("h-3 w-3", sel.color)} />
                {sel.label} selected
              </span>
            ) : null; })()}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDomain(d.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 px-1 transition-all duration-200 text-center",
                  domain === d.id
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(0,201,177,0.15)]"
                    : "border-border bg-background/50 hover:bg-muted hover:border-primary/30"
                )}
              >
                <d.icon className={cn("h-5 w-5", domain === d.id ? d.color : "text-muted-foreground")} />
                <span className={cn("text-[10px] font-medium leading-tight", domain === d.id ? "text-foreground" : "text-muted-foreground")}>
                  {d.label}
                </span>
              </button>
            ))}
          </div>

          {/* Protocol Templates */}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {showTemplates ? "Hide templates" : "Use a protocol template"}
              {showTemplates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showTemplates && (
              <div className="mt-3 max-h-48 overflow-y-auto pr-1">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading templates…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="flex items-start gap-2 rounded-xl border border-border bg-background/50 p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                      >
                        <span className="text-base shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{t.domain}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedStarterPrompt && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Template starter prompt</p>
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{selectedStarterPrompt}</p>
            <button
              type="button"
              onClick={() => setSelectedStarterPrompt(undefined)}
              className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Remove starter prompt
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Description / Protocol <span className="text-muted-foreground font-normal">(Optional)</span></label>
            <span className={cn(
              "text-[11px] tabular-nums",
              description.length > MAX_DESC_LENGTH ? "text-destructive" : "text-muted-foreground"
            )}>
              {description.length}/{MAX_DESC_LENGTH}
            </span>
          </div>
          <Textarea
            placeholder="Briefly describe the experiment or paste your protocol..."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC_LENGTH))}
            className="min-h-[100px]"
          />
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating || name.length > MAX_NAME_LENGTH || description.length > MAX_DESC_LENGTH}
          >
            {isCreating ? "Initializing..." : "Create Session"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
