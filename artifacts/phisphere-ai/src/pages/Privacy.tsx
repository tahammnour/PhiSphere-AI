import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide when creating an account (username, hashed password, plan selection), lab session data (session names, descriptions, scientific domains), conversation messages and AI responses, uploaded experimental data (CSV files and images for analysis), and usage metadata (session timestamps, message counts).`,
  },
  {
    title: "2. How We Use Your Data",
    content: `Your data is used exclusively to provide the PhiSphere AI service. This includes: processing your messages through Azure OpenAI to generate AI responses, applying Azure Content Safety filters to all submitted content, analyzing uploaded images with Azure AI Vision, maintaining your lab session history, and improving service reliability. We do not use your research data to train AI models without explicit consent.`,
  },
  {
    title: "3. Azure AI Services",
    content: `PhiSphere AI uses the following Microsoft Azure services to process your data: Azure OpenAI (conversation intelligence), Azure AI Vision (image analysis), and Azure Content Safety (harmful content detection). Your content may be temporarily processed by these services according to Microsoft Azure's privacy policies and data processing agreements. Azure services are SOC 2, ISO 27001, and GDPR compliant.`,
  },
  {
    title: "4. Data Storage and Security",
    content: `Your data is stored in a PostgreSQL database with encryption at rest. Authentication tokens are stored securely and expire upon logout. Passwords are never stored in plaintext — they are salted and hashed using SHA-256. Uploaded images are stored as base64 in the database and are not shared publicly.`,
  },
  {
    title: "5. Data Retention",
    content: `Your lab sessions, conversation history, and account information are retained for the duration of your active subscription plus 30 days after account termination. You may request deletion of your data at any time by contacting privacy@phisphere.ai. Anonymized usage statistics may be retained for service improvement.`,
  },
  {
    title: "6. Third-Party Services",
    content: `We do not sell, rent, or share your personal data or research data with third parties for marketing or advertising purposes. Data processed by Azure AI services is governed by Microsoft's data processing agreements. We may share aggregate, anonymized statistics about platform usage.`,
  },
  {
    title: "7. Your Rights",
    content: `You have the right to access, correct, or delete your personal data. You may request an export of your data at any time using the Export function within your lab sessions. For data deletion requests, contact privacy@phisphere.ai. If you are in the EU, you have additional rights under GDPR including the right to data portability and restriction of processing.`,
  },
  {
    title: "8. Content Safety",
    content: `All messages submitted to PhiSphere AI are screened by Azure Content Safety before and after AI processing. Safety metadata (content category scores, pass/fail status) is stored with each message for auditing purposes. This data is used solely for safety compliance and is not used for profiling.`,
  },
  {
    title: "9. Cookies and Local Storage",
    content: `PhiSphere AI uses browser local storage to maintain your authentication session, display preferences (display name, avatar color), and onboarding state. No third-party tracking cookies are used. You can clear this data at any time through your browser settings or the Settings page.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy to reflect changes in our practices or applicable law. Material changes will be communicated via in-app notification. Continued use of the service after notification constitutes acceptance.`,
  },
  {
    title: "11. Contact",
    content: `For privacy-related inquiries, data requests, or concerns, contact us at privacy@phisphere.ai. For EU-related inquiries, please indicate your jurisdiction.`,
  },
];

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#040B16] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1 as unknown as string)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
            <p className="text-sm text-slate-400 mt-0.5">Last updated: March 2026</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-8">
          <p className="text-slate-300 leading-relaxed">
            PhiSphere AI is committed to protecting your research data and personal information. This Privacy Policy explains what we collect, how we use it, and your rights regarding your data.
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
            Privacy questions? Email{" "}
            <a href="mailto:privacy@phisphere.ai" className="text-indigo-400 hover:underline">privacy@phisphere.ai</a>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <button onClick={() => navigate("/terms")} className="hover:text-slate-300 transition-colors underline">Terms of Service</button>
            <span>·</span>
            <button onClick={() => navigate("/about")} className="hover:text-slate-300 transition-colors">About PhiSphere AI</button>
          </div>
        </div>
      </div>
    </div>
  );
}
