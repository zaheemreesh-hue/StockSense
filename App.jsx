import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { useToast } from "./hooks/useToast";
import { ToastStack, BottomNav, PageHeader, Icon, Btn } from "./components/ui";

import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Billing   from "./pages/Billing";
import Alerts    from "./pages/Alerts";
import Settings  from "./pages/Settings";
import Movements from "./pages/Movements";
import Sales     from "./pages/Sales";

// ── PWA Install Banner ────────────────────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  const install = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === "accepted") onDismiss();
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-40 px-4 pt-2 animate-slide-up">
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-3 flex items-center gap-3 shadow-modal">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Icon name="install_mobile" className="text-on-primary" size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface">Install StockSense</p>
          <p className="text-xs text-on-surface-variant">Add to home screen for the best experience</p>
        </div>
        <Btn variant="primary" size="sm" onClick={install}>Install</Btn>
        <button onClick={onDismiss} className="active:scale-90 transition-transform p-1">
          <Icon name="close" size="sm" className="text-on-surface-variant" />
        </button>
      </div>
    </div>
  );
}

// ── Page meta ─────────────────────────────────────────────────────────────────
const PAGE_META = {
  dashboard: { title: "Dashboard",    nav: "bottom" },
  billing:   { title: "POS / Billing",nav: "bottom" },
  inventory: { title: "Inventory",    nav: "bottom" },
  alerts:    { title: "Alerts",       nav: "bottom" },
  settings:  { title: "Settings",     nav: "bottom" },
  movements: { title: "Movements",    nav: "secondary" },
  sales:     { title: "Sales History",nav: "secondary" },
};

// ── App Shell (inside AppProvider) ───────────────────────────────────────────
function Shell({ showToast }) {
  const [page, setPage]           = useState("dashboard");
  const [showInstall, setShowInstall] = useState(true);
  const { alerts }                = useApp();

  const critCount = (alerts || []).filter((a) => a.severity === "critical").length;
  const props     = { showToast, onNavigate: setPage };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard {...props} />;
      case "inventory": return <Inventory {...props} />;
      case "billing":   return <Billing   {...props} />;
      case "alerts":    return <Alerts    {...props} />;
      case "settings":  return <Settings  {...props} />;
      case "movements": return <Movements {...props} />;
      case "sales":     return <Sales     {...props} />;
      default:          return <Dashboard {...props} />;
    }
  };

  const title = PAGE_META[page]?.title || "StockSense";

  return (
    <div className="min-h-dvh bg-surface">
      {/* Top bar */}
      <PageHeader
        title={title}
        onMenu={PAGE_META[page]?.nav === "secondary" ? () => setPage("dashboard") : null}
        trailing={
          <button
            onClick={() => setPage("alerts")}
            className="relative active:scale-90 transition-transform p-1">
            <Icon name="notifications" className="text-primary-container" />
            {critCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-[9px] font-bold text-on-error flex items-center justify-center leading-none">
                {critCount > 9 ? "9+" : critCount}
              </span>
            )}
          </button>
        }
      />

      {/* PWA install prompt */}
      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}

      {/* Page content */}
      <main className="pt-14 pb-24 px-4 max-w-lg mx-auto">
        <div key={page} className="animate-fade-up pt-4">
          {renderPage()}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav active={page} onChange={setPage} alertCount={critCount} />
    </div>
  );
}

// ── Auth Gate ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth();
  const { toasts, show: showToast, dismiss } = useToast();

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-ring">
          <Icon name="inventory_2" className="text-on-primary icon-lg" fill />
        </div>
        <div className="text-center">
          <p className="font-headline font-extrabold text-xl text-primary-container">StockSense AI</p>
          <p className="text-sm text-on-surface-variant mt-1">Loading your store…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <ToastStack toasts={toasts} dismiss={dismiss} />
      </>
    );
  }

  return (
    <AppProvider>
      <Shell showToast={showToast} />
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </AppProvider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
