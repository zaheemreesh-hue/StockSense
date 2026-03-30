import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Icon, ListGroup, ListItem, SectionLabel, Btn, Modal, InputField, SelectField } from "../components/ui";
import { fmtDate } from "../utils/formatters";
import { CATEGORIES } from "../utils/constants";

export default function Settings({ showToast, onNavigate }) {
  const { user, logout, updateUser } = useAuth();
  const [activeSheet, setActiveSheet] = useState(null);

  const open  = (id) => setActiveSheet(id);
  const close = ()   => setActiveSheet(null);

  const handleLogout = () => {
    if (confirm("Sign out? Your session will end immediately.")) logout();
  };

  return (
    <div className="space-y-5 pb-4">

      {/* Profile Quick Card */}
      <section className="bg-surface-container rounded-xl p-5 flex items-center gap-4 border border-outline-variant/10 shadow-card">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <span className="font-headline font-extrabold text-2xl text-on-primary">
              {(user?.name || "?")[0].toUpperCase()}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-surface-container animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-headline text-lg font-extrabold text-on-surface truncate">{user?.name || "User"}</h2>
          <p className="text-on-surface-variant text-sm font-medium capitalize">{user?.role || "Staff"}</p>
          <p className="text-primary-container text-[10px] font-bold uppercase tracking-widest mt-1">
            {user?.businessName || "StockSense AI"}
          </p>
        </div>
        <Icon name="chevron_right" className="text-on-surface-variant opacity-50 flex-shrink-0" size="sm" />
      </section>

      {/* Settings Groups */}
      <div className="space-y-4">

        {/* Core Identity */}
        <div className="space-y-2">
          <SectionLabel>Core Identity</SectionLabel>
          <ListGroup>
            <ListItem icon="store" label="Business Profile" sublabel="Store name, branding" onClick={() => open("business")} />
          </ListGroup>
        </div>

        {/* Economics */}
        <div className="space-y-2">
          <SectionLabel>Economics</SectionLabel>
          <ListGroup>
            <ListItem icon="payments" iconColor="text-tertiary" iconBg="bg-tertiary/10" label="Financials" sublabel="Currency, tax rates" onClick={() => open("financials")} />
            <ListItem icon="point_of_sale" iconColor="text-secondary" iconBg="bg-secondary/10" label="Billing / POS" sublabel="Invoice & receipt settings" onClick={() => open("billing")} />
          </ListGroup>
        </div>

        {/* Logistics */}
        <div className="space-y-2">
          <SectionLabel>Logistics</SectionLabel>
          <ListGroup>
            <ListItem icon="inventory_2" label="Inventory" sublabel="Thresholds, defaults" onClick={() => open("inventory")} />
          </ListGroup>
        </div>

        {/* Intelligence */}
        <div className="space-y-2">
          <SectionLabel>Intelligence</SectionLabel>
          <ListGroup>
            <ListItem icon="psychology" iconColor="text-primary-container" iconBg="bg-primary/10" label="AI & Notifications" sublabel="Forecast sensitivity, alerts" onClick={() => open("ai")} />
          </ListGroup>
        </div>

        {/* Access Control */}
        {user?.role === "admin" && (
          <div className="space-y-2">
            <SectionLabel>Access Control</SectionLabel>
            <ListGroup>
              <ListItem icon="group" iconColor="text-on-surface" iconBg="bg-on-surface-variant/10" label="Team" sublabel="Roles, staff management" onClick={() => open("team")} />
            </ListGroup>
          </div>
        )}
      </div>

      {/* System & Danger Zone */}
      <div className="pt-2 space-y-4">
        <ListGroup>
          <ListItem icon="help" iconColor="text-on-surface-variant" iconBg="bg-on-surface-variant/5" label="Support Center"
            trailing={<Icon name="open_in_new" className="text-on-surface-variant flex-shrink-0" size="sm" />}
            onClick={() => window.open("mailto:support@stocksense.ai")} />
          <ListItem icon="logout" iconColor="text-error" iconBg="bg-error/10" label="Sign Out"
            sublabel="Session ends immediately" danger onClick={handleLogout} trailing={null} />
        </ListGroup>

        <div className="text-center space-y-0.5">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] opacity-40">StockSense AI v2.5.0-pro</p>
          <p className="text-[9px] text-on-surface-variant opacity-25">Member since {fmtDate(user?.createdAt)}</p>
        </div>
      </div>

      {/* ── Sub-sheets ──────────────────────────────────────────────────────── */}
      <BusinessSheet open={activeSheet === "business"} onClose={close} user={user} updateUser={updateUser} showToast={showToast} />
      <FinancialsSheet open={activeSheet === "financials"} onClose={close} user={user} updateUser={updateUser} showToast={showToast} />
      <BillingSheet open={activeSheet === "billing"} onClose={close} />
      <InventorySheet open={activeSheet === "inventory"} onClose={close} />
      <AISheet open={activeSheet === "ai"} onClose={close} />
      <TeamSheet open={activeSheet === "team"} onClose={close} />
    </div>
  );
}

// ── Sub-sheets ────────────────────────────────────────────────────────────────

function BusinessSheet({ open, onClose, user, updateUser, showToast }) {
  const [form, setForm] = useState({ name: user?.name || "", businessName: user?.businessName || "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await updateUser(form); showToast("Profile saved", "success"); onClose(); }
    catch (e) { showToast(e.response?.data?.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Business Profile"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn></>}>
      <div className="space-y-3">
        <InputField label="Your Name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Alex Chen" />
        <InputField label="Business Name" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="My Store" />
        <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant space-y-1">
          <p><span className="font-semibold text-on-surface">Email:</span> {user?.email}</p>
          <p><span className="font-semibold text-on-surface">Role:</span> <span className="capitalize">{user?.role}</span></p>
          <p><span className="font-semibold text-on-surface">Joined:</span> {fmtDate(user?.createdAt)}</p>
        </div>
      </div>
    </Modal>
  );
}

function FinancialsSheet({ open, onClose, user, updateUser, showToast }) {
  const [form, setForm] = useState({ currency: user?.currency || "USD", taxRate: user?.taxRate || 0 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await updateUser({ ...form, taxRate: Number(form.taxRate) }); showToast("Saved", "success"); onClose(); }
    catch { showToast("Failed", "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Financials"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn></>}>
      <div className="space-y-3">
        <SelectField label="Currency" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
          {["USD","MYR","SGD","GBP","EUR","INR","AUD","IDR","THB","PHP"].map((c) => <option key={c}>{c}</option>)}
        </SelectField>
        <InputField label="Tax Rate (%)" type="number" min="0" max="50" placeholder="0" value={form.taxRate}
          onChange={(e) => set("taxRate", e.target.value)} />
        <p className="text-xs text-on-surface-variant bg-surface-container rounded-xl p-3 border border-outline-variant/20">
          Tax will be automatically applied to all new invoices.
        </p>
      </div>
    </Modal>
  );
}

function BillingSheet({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Billing / POS" footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <div className="space-y-3">
        {[["Invoice prefix", "INV"], ["Receipt footer", "Thank you for your purchase!"], ["Default payment", "Cash"]].map(([l, v]) => (
          <InputField key={l} label={l} defaultValue={v} />
        ))}
      </div>
    </Modal>
  );
}

function InventorySheet({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Inventory Settings" footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <div className="space-y-3">
        <InputField label="Default Low Stock Threshold" type="number" defaultValue="10" />
        <InputField label="Default Restock Lead Days" type="number" defaultValue="7" />
        <SelectField label="Default Category">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </SelectField>
      </div>
    </Modal>
  );
}

function AISheet({ open, onClose }) {
  const [sensitivity, setSensitivity] = useState("medium");
  return (
    <Modal open={open} onClose={onClose} title="AI & Notifications" footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">Forecast Sensitivity</label>
          <div className="grid grid-cols-3 gap-2">
            {["low","medium","high"].map((s) => (
              <button key={s} onClick={() => setSensitivity(s)}
                className={`py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${sensitivity === s ? "border-primary-container bg-primary-container/10 text-primary-container" : "border-outline-variant/30 text-on-surface-variant"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {[["Low stock alerts", true], ["Dead stock warnings", true], ["Fast mover restock", true], ["Weekly digest", false]].map(([label, def]) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-b-0">
            <span className="text-sm text-on-surface">{label}</span>
            <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${def ? "bg-primary-container" : "bg-surface-container-high border border-outline-variant"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${def ? "right-1" : "left-1"}`} />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TeamSheet({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Team Management" footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <EmptyState icon="group_add" title="Team management" desc="Invite staff members from the web dashboard at app.stocksense.ai" />
    </Modal>
  );
}
