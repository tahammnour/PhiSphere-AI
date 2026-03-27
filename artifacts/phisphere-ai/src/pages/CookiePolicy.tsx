import { useLocation } from "wouter";
import { ArrowLeft, Cookie } from "lucide-react";

const SECTIONS = [
  {
    title: "1. What Are Cookies?",
    content:
      "Cookies are small text files placed on your device by a website when you visit it. They help the website remember information about your visit, making it easier to use the site again and more useful to you. PhiSphere AI uses both cookies and browser localStorage to operate the service.",
  },
  {
    title: "2. How We Use Local Storage (Not Cookies)",
    content:
      "PhiSphere AI primarily uses browser localStorage rather than HTTP cookies to maintain your session. localStorage items are stored locally on your device and are never transmitted to third-party servers. The following keys are used: phisphere_auth_token (authentication session), phisphere_auth_user (account details cache), phisphere_display_name and phisphere_avatar_color (display preferences), phisphere_session_meta (pinned/archived/tagged session state), phisphere_cookie_consent (your consent record), and phisphere_changelog_seen (last-read changelog version).",
  },
  {
    title: "3. Strictly Necessary Items",
    content:
      "The authentication token stored in localStorage is strictly necessary for the service to function. Without it, you cannot log in or access your lab sessions. These items are set only when you create an account or log in and are removed when you log out.",
  },
  {
    title: "4. Preference Items",
    content:
      "Preference items (display name, avatar color, pinned sessions, changelog state) store your personal UI preferences so they persist across browser sessions. These are entirely local — they are never synced to our servers. You can clear them at any time via your browser settings or the Settings page.",
  },
  {
    title: "5. No Third-Party Tracking",
    content:
      "PhiSphere AI does not use any third-party advertising cookies, analytics tracking pixels, or social media tracking tags. We do not share browsing data with advertisers or data brokers. No cross-site tracking is performed.",
  },
  {
    title: "6. Session Cookies",
    content:
      "Your browser may set a session cookie (a short-lived cookie that expires when you close the browser tab) as part of the standard HTTP request cycle with our API server. This is used solely for CSRF protection and does not track your browsing behaviour.",
  },
  {
    title: "7. Your Choices",
    content:
      "You can manage localStorage and cookie storage through your browser's settings at any time. Clearing these items will log you out and reset your preferences. Our Cookie Consent banner allows you to acknowledge this policy; declining only removes the consent record banner and does not disable any core functionality.",
  },
  {
    title: "8. Changes to This Policy",
    content:
      "We may update this Cookie Policy to reflect changes in our practices or applicable law. Material changes will be communicated via in-app notification. The effective date at the top of this page will be updated accordingly.",
  },
  {
    title: "9. Contact",
    content:
      "For questions about how we use localStorage or cookies, please contact us at privacy@phisphere.ai or visit our Contact page.",
  },
];

export default function CookiePolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#040B16] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-600/4 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1 as unknown as string)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Cookie className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Cookie Policy</h1>
            <p className="text-sm text-slate-400 mt-0.5">Last updated: March 2026</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-8">
          <p className="text-slate-300 leading-relaxed">
            This Cookie Policy explains how PhiSphere AI uses cookies and similar browser storage technologies
            when you use our platform. We are committed to transparency — below you will find a plain-language
            explanation of every storage item our service uses.
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
            Questions? Email{" "}
            <a href="mailto:privacy@phisphere.ai" className="text-amber-400 hover:underline">
              privacy@phisphere.ai
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <button onClick={() => navigate("/privacy")} className="hover:text-slate-300 transition-colors underline">
              Privacy Policy
            </button>
            <span>·</span>
            <button onClick={() => navigate("/terms")} className="hover:text-slate-300 transition-colors underline">
              Terms of Service
            </button>
            <span>·</span>
            <button onClick={() => navigate("/contact")} className="hover:text-slate-300 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
