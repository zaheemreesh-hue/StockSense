import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Icon, Btn, InputField } from "../components/ui";

export default function Login({ onSuccess }) {
  const { login, register } = useAuth();
  const [tab, setTab]       = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "admin", businessName: "" });

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const submit = async () => {
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    if (tab === "register" && !form.name) { setError("Name is required"); return; }
    setLoading(true);
    try {
      if (tab === "login") await login(form.email, form.password);
      else await register(form);
      onSuccess?.();
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(76,214,255,0.06) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(77,224,130,0.04) 0%, transparent 55%), #10131a" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Icon name="inventory_2" className="text-on-primary" fill />
        </div>
        <div>
          <p className="font-headline font-extrabold text-xl text-primary-container leading-none">StockSense AI</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Inventory Intelligence</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-surface-container border border-outline-variant/20 rounded-2xl shadow-modal p-6 space-y-5 animate-fade-up">
        {/* Tab toggle */}
        <div className="flex bg-surface-container-high rounded-xl p-1">
          {["login", "register"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-surface-container text-on-surface shadow-card" : "text-on-surface-variant hover:text-on-surface"}`}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {tab === "register" && (
            <>
              <InputField label="Full Name" placeholder="Alex Chen" value={form.name} onChange={(e) => set("name", e.target.value)} />
              <InputField label="Business Name" placeholder="My Store" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["admin", "store", "Admin"], ["staff", "person", "Staff"]].map(([r, icon, label]) => (
                    <button key={r} onClick={() => set("role", r)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-semibold transition-all ${form.role === r ? "border-primary-container bg-primary-container/10 text-primary-container" : "border-outline-variant/30 text-on-surface-variant hover:border-outline"}`}>
                      <Icon name={icon} size="sm" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <InputField label="Email" type="email" placeholder="you@store.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <InputField label="Password" type="password" placeholder="••••••••" value={form.password}
            onChange={(e) => set("password", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-error/10 border border-error/25 rounded-xl px-3 py-2.5">
            <Icon name="error" className="text-error flex-shrink-0" size="sm" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <Btn variant="primary" size="lg" className="w-full" onClick={submit} disabled={loading}>
          {loading ? (
            <><Icon name="progress_activity" className="animate-spin" size="sm" /> {tab === "login" ? "Signing in…" : "Creating account…"}</>
          ) : (
            <>{tab === "login" ? "Sign In" : "Create Account"} <Icon name="arrow_forward" size="sm" /></>
          )}
        </Btn>

        <p className="text-center text-xs text-on-surface-variant">
          {tab === "login" ? "No account? " : "Already have one? "}
          <button onClick={() => setTab(tab === "login" ? "register" : "login")}
            className="text-primary-container font-semibold hover:underline">
            {tab === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>

      <p className="mt-8 text-[10px] text-on-surface-variant/40 uppercase tracking-widest">StockSense AI · v2.5.0</p>
    </div>
  );
}
