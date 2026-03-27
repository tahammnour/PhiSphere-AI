import { useLocation } from "wouter";
import { ArrowLeft, Scale } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using PhiSphere AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.`,
  },
  {
    title: "2. Description of Service",
    content: `PhiSphere AI is an intelligent agentic lab notebook assistant platform that helps scientific researchers analyze experimental data, interpret protocols, and generate evidence-based recommendations using artificial intelligence. The Service is powered by Azure OpenAI and Azure AI Safety services.`,
  },
  {
    title: "3. Use of AI-Generated Content",
    content: `All AI-generated content is provided for informational and research-support purposes only. PhiSphere AI is NOT a substitute for professional scientific judgment, medical advice, clinical diagnosis, or regulatory approval. You are solely responsible for verifying any AI-generated recommendations before applying them in your research or clinical work. Content that involves controlled substances, clinical protocols, or regulated materials must be reviewed by qualified professionals before implementation.`,
  },
  {
    title: "4. User Accounts and Activation",
    content: `Access to PhiSphere AI requires a valid activation code. You are responsible for maintaining the confidentiality of your account credentials. You may not share accounts or activation codes with unauthorized parties. Sharing access codes violates these terms and may result in account termination.`,
  },
  {
    title: "5. Prohibited Uses",
    content: `You may not use the Service to: (a) engage in activities that violate applicable laws or regulations; (b) attempt to extract, synthesize, or produce controlled, hazardous, or regulated substances; (c) generate content designed to harm individuals or circumvent safety systems; (d) reverse-engineer or attempt to extract model parameters, weights, or proprietary system prompts; (e) use the Service for unauthorized clinical or diagnostic decision-making.`,
  },
  {
    title: "6. Data and Privacy",
    content: `Your lab sessions, uploaded data, and conversation history are stored securely and used solely to provide the Service. We do not sell your research data to third parties. Uploaded experimental data may be processed by Azure AI services to provide analysis functionality. Please review our Privacy Policy for full details.`,
  },
  {
    title: "7. Responsible AI",
    content: `PhiSphere AI applies Microsoft Responsible AI Toolbox principles including fairness, reliability, privacy, inclusiveness, transparency, and accountability. All AI responses are subject to Azure Content Safety filtering. We actively monitor for and block harmful, discriminatory, or scientifically irresponsible outputs.`,
  },
  {
    title: "8. Subscription and Billing",
    content: `PhiSphere AI is offered under Monthly ($29/month) and Annual ($199/year) subscription plans. Subscription fees are non-refundable except where required by applicable law. We reserve the right to modify pricing with 30 days' notice.`,
  },
  {
    title: "9. Limitation of Liability",
    content: `To the maximum extent permitted by law, PhiSphere AI and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including damages resulting from reliance on AI-generated content. The Service is provided "as is" without warranties of any kind.`,
  },
  {
    title: "10. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms. We will notify users of material changes via in-app notification.`,
  },
  {
    title: "11. Contact",
    content: `For questions about these Terms, contact us at legal@phisphere.ai.`,
  },
];

export default function Terms() {
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
            <Scale className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Terms of Service</h1>
            <p className="text-sm text-slate-400 mt-0.5">Last updated: March 2026</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-8">
          <p className="text-slate-300 leading-relaxed">
            Please read these Terms of Service carefully before using PhiSphere AI. These terms govern your use of our platform and constitute a legally binding agreement between you and PhiSphere AI.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Questions? Email us at{" "}
            <a href="mailto:legal@phisphere.ai" className="text-blue-400 hover:underline">legal@phisphere.ai</a>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <button onClick={() => navigate("/privacy")} className="hover:text-slate-300 transition-colors underline">Privacy Policy</button>
            <span>·</span>
            <button onClick={() => navigate("/about")} className="hover:text-slate-300 transition-colors">About PhiSphere AI</button>
          </div>
        </div>
      </div>
    </div>
  );
}
