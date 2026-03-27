import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor. We do not accept cash, checks, or cryptocurrency at this time.",
  },
  {
    question: "Can I switch between Monthly and Annual plans?",
    answer:
      "Yes. You can upgrade from Monthly to Annual at any time from your Billing page and immediately receive the discounted rate. Downgrading from Annual to Monthly takes effect at the end of your current billing period. No proration penalties apply.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "PhiSphere AI offers a demo experiment mode so you can explore the interface before subscribing. Full AI-powered lab notebook functionality, including Azure AI Vision and Content Safety, requires an active subscription.",
  },
  {
    question: "What happens if my payment fails?",
    answer:
      "If a payment fails, we will retry the charge automatically over the next 7 days and send you an email notification. During this period your account remains active. If the payment cannot be collected, your account will be paused until the outstanding balance is resolved.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel at any time from your Billing page. Cancellation takes effect at the end of the current billing period — you will continue to have full access until then. We do not offer refunds for partial billing periods.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 7-day money-back guarantee for first-time subscribers. If you are unsatisfied within 7 days of your initial payment, contact support@phisphere.ai and we will issue a full refund. Subsequent billing cycles are non-refundable.",
  },
  {
    question: "Can I have multiple seats / team accounts?",
    answer:
      "Team and institutional plans are on our roadmap. If you need multi-user access for your lab group or institution today, please reach out to us at support@phisphere.ai and we will work out an arrangement.",
  },
  {
    question: "How do Annual plan savings work?",
    answer:
      "The Annual plan costs $199/year versus $348/year ($29 × 12) for monthly billing — a saving of $149 (43%). You are billed in one upfront payment and your plan is valid for 12 months.",
  },
  {
    question: "Is my billing information secure?",
    answer:
      "Yes. We never store your raw card details on our servers. All payment data is handled by our PCI-DSS compliant payment processor with TLS encryption. We store only a masked card reference and your billing email.",
  },
  {
    question: "Will I receive invoices?",
    answer:
      "A receipt is emailed to your account address after every successful payment. You can also access billing history in the Billing section of your account at any time.",
  },
  {
    question: "Are there any usage limits?",
    answer:
      "Monthly plan subscribers can create up to 50 lab sessions per month. Annual plan subscribers have unlimited session creation. All plans include Azure AI Vision image analysis and Azure Content Safety screening on every message.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/6 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-semibold text-white leading-relaxed">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-sm text-slate-400 leading-relaxed -mt-1">{answer}</p>
      )}
    </div>
  );
}

export default function BillingFAQ() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#040B16] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1 as unknown as string)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <CreditCard className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Billing FAQ</h1>
            <p className="text-sm text-slate-400 mt-0.5">Common questions about plans, payments, and subscriptions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-2 mb-8">
          {FAQS.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm font-semibold text-white mb-1">Still have a billing question?</p>
          <p className="text-xs text-slate-400 mb-4">Our support team responds within one business day.</p>
          <button
            onClick={() => navigate("/contact")}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            Contact Support
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
          <button onClick={() => navigate("/billing")} className="hover:text-slate-300 transition-colors">Manage Billing</button>
          <span>·</span>
          <button onClick={() => navigate("/terms")} className="hover:text-slate-300 transition-colors">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate("/contact")} className="hover:text-slate-300 transition-colors">Contact Us</button>
        </div>
      </div>
    </div>
  );
}
