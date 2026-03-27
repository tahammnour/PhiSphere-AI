import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ControlPanel from "@/pages/ControlPanel";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Landing from "@/pages/Landing";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import ForgotPassword from "@/pages/ForgotPassword";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import CookiePolicy from "@/pages/CookiePolicy";
import AuditLog from "@/pages/AuditLog";
import Billing from "@/pages/Billing";
import BillingFAQ from "@/pages/BillingFAQ";
import Contact from "@/pages/Contact";
import { getStoredToken, getStoredUser } from "@/hooks/use-auth";
import { NotificationProvider } from "@/context/NotificationContext";
import { CookieConsent } from "@/components/CookieConsent";
import { GlobalSearch } from "@/components/GlobalSearch";
import { FeedbackModal } from "@/components/FeedbackModal";
import { useListLabSessions } from "@workspace/api-client-react";
import { MessageSquarePlus } from "lucide-react";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const token = getStoredToken();
  const user = getStoredUser();

  useEffect(() => {
    if (!token || !user) {
      navigate("/landing");
    }
  }, [token, user]);

  if (!token || !user) return null;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const token = getStoredToken();
  const user = getStoredUser();

  useEffect(() => {
    if (token && user) {
      navigate("/");
    }
  }, [token, user]);

  if (token && user) return null;
  return <>{children}</>;
}

function RootRoute() {
  const token = getStoredToken();
  const user = getStoredUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!token || !user) {
      navigate("/landing");
    }
  }, [token, user]);

  if (!token || !user) return null;
  return <ControlPanel />;
}

function GlobalSearchWrapper() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const token = getStoredToken();
  const { data: sessions = [] } = useListLabSessions();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (token) setOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [token]);

  if (!token) return null;

  return (
    <GlobalSearch
      sessions={sessions}
      open={open}
      onClose={() => setOpen(false)}
      onSelectSession={(id) => {
        sessionStorage.setItem("phisphere_selected_session", String(id));
        navigate("/lab");
        setOpen(false);
      }}
    />
  );
}

function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const token = getStoredToken();
  if (!token) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9980] flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1829]/90 backdrop-blur-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-primary/30 hover:text-primary hover:bg-[#0d1829] transition-all shadow-lg shadow-black/30"
        title="Send Feedback"
      >
        <MessageSquarePlus className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRoute} />
      <Route path="/lab">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/landing">
        <GuestGuard>
          <Landing />
        </GuestGuard>
      </Route>
      <Route path="/signup">
        <GuestGuard>
          <Signup />
        </GuestGuard>
      </Route>
      <Route path="/login">
        <GuestGuard>
          <Login />
        </GuestGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard>
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/audit-log">
        <AuthGuard>
          <AuditLog />
        </AuthGuard>
      </Route>
      <Route path="/billing">
        <AuthGuard>
          <Billing />
        </AuthGuard>
      </Route>
      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>
      <Route path="/about">
        <About />
      </Route>
      <Route path="/terms">
        <Terms />
      </Route>
      <Route path="/privacy">
        <Privacy />
      </Route>
      <Route path="/cookie-policy">
        <CookiePolicy />
      </Route>
      <Route path="/billing-faq">
        <BillingFAQ />
      </Route>
      <Route path="/contact">
        <Contact />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
          <GlobalSearchWrapper />
          <FeedbackButton />
          <CookieConsent />
        </WouterRouter>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
