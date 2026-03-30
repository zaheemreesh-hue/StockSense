// ─── Icon (Material Symbols wrapper) ─────────────────────────────────────────
export const Icon = ({ name, className = "", fill = false, size = "md" }) => {
  const sz = { sm: "icon-sm", md: "", lg: "icon-lg" }[size] || "";
  return (
    <span className={`material-symbols-outlined ${fill ? "icon-fill" : ""} ${sz} ${className}`}>
      {name}
    </span>
  );
};

// ─── Chip / Badge ─────────────────────────────────────────────────────────────
export const Chip = ({ children, variant = "muted", className = "" }) => (
  <span className={`chip chip-${variant} ${className}`}>{children}</span>
);

export const RiskChip = ({ risk }) => {
  const map = { out: "critical", critical: "critical", high: "warning", medium: "warning", low: "success" };
  const label = { out: "Out", critical: "Critical", high: "Low Stock", medium: "Medium", low: "Healthy" };
  return <Chip variant={map[risk] || "muted"}>{label[risk] || risk}</Chip>;
};

export const TrendChip = ({ trend }) => {
  if (trend === "up")     return <span className="text-[#4de082] text-xs font-bold">↑ Rising</span>;
  if (trend === "down")   return <span className="text-[#ffb4ab] text-xs font-bold">↓ Falling</span>;
  return <span className="text-[#bbc9cf] text-xs">→ Stable</span>;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = "" }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const TOAST_STYLES = {
  success: { icon: "check_circle", color: "text-[#4de082]", bg: "bg-surface-container border-[#4de082]/20" },
  error:   { icon: "error",        color: "text-[#ffb4ab]", bg: "bg-surface-container border-[#ffb4ab]/20" },
  warning: { icon: "warning",      color: "text-[#ffd785]", bg: "bg-surface-container border-[#ffd785]/20" },
  info:    { icon: "info",         color: "text-[#4cd6ff]", bg: "bg-surface-container border-[#4cd6ff]/20" },
};

export const ToastStack = ({ toasts, dismiss }) => (
  <div className="toast-stack">
    {toasts.map((t) => {
      const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
      return (
        <div key={t.id} onClick={() => dismiss(t.id)}
          className={`animate-slide-up pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-modal max-w-sm w-full cursor-pointer ${s.bg}`}>
          <Icon name={s.icon} className={s.color} size="sm" />
          <span className="text-sm font-medium text-on-surface flex-1">{t.msg}</span>
          <Icon name="close" className="text-on-surface-variant" size="sm" />
        </div>
      );
    })}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = "inbox", title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
    <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
      <Icon name={icon} className="text-on-surface-variant" size="lg" />
    </div>
    <div>
      <p className="font-headline font-bold text-on-surface text-base">{title}</p>
      {desc && <p className="text-on-surface-variant text-sm mt-1">{desc}</p>}
    </div>
    {action}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionLabel = ({ children }) => (
  <h3 className="px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">{children}</h3>
);

// ─── List Group ───────────────────────────────────────────────────────────────
export const ListGroup = ({ children }) => (
  <div className="bg-surface-container-low rounded-xl overflow-hidden">{children}</div>
);

export const ListItem = ({ icon, iconColor = "text-primary-container", iconBg = "bg-primary-container/10",
  label, sublabel, onClick, trailing, bordered = true, danger = false }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 transition-colors group active:scale-[0.98] duration-100
      ${bordered ? "border-b border-outline-variant/10 last:border-b-0" : ""}
      ${danger ? "hover:bg-error/10" : "hover:bg-surface-container-high"}`}>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon name={icon} className={iconColor} size="sm" />
    </div>
    <div className="flex-1 text-left min-w-0">
      <span className={`block text-sm font-semibold ${danger ? "text-error" : "text-on-surface"}`}>{label}</span>
      {sublabel && <span className={`block text-xs mt-0.5 ${danger ? "text-error/60" : "text-on-surface-variant"}`}>{sublabel}</span>}
    </div>
    {trailing ?? <Icon name="chevron_right" className="text-on-surface-variant flex-shrink-0 group-hover:text-primary-container transition-colors" size="sm" />}
  </button>
);

// ─── Modal / Bottom Sheet ─────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className="modal-sheet relative bg-surface-container border border-outline-variant/20 shadow-modal
        w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl z-10 animate-fade-up"
        onClick={(e) => e.stopPropagation()}>
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant/50" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <h2 className="font-headline font-bold text-on-surface text-base">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <Icon name="close" className="text-on-surface-variant" size="sm" />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4">{children}</div>
        {/* Footer */}
        {footer && <div className="px-5 pb-5 pt-2 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, iconBg, iconColor, value, label, sub, subUp, loading }) => (
  <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
      <Icon name={icon} className={iconColor} size="sm" />
    </div>
    {loading ? (
      <>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-16" />
      </>
    ) : (
      <>
        <span className="font-mono font-bold text-2xl text-on-surface leading-none">{value}</span>
        <span className="text-xs text-on-surface-variant font-medium">{label}</span>
        {sub && (
          <span className={`text-[10px] font-bold flex items-center gap-1 ${subUp ? "text-[#4de082]" : "text-[#ffb4ab]"}`}>
            <Icon name={subUp ? "arrow_upward" : "arrow_downward"} size="sm" className="text-[12px]" />
            {sub}
          </span>
        )}
      </>
    )}
  </div>
);

// ─── Page Header (mobile top bar) ─────────────────────────────────────────────
export const PageHeader = ({ title, trailing, onMenu }) => (
  <header className="bg-[#10131A] border-b border-[#3C494E]/20 fixed top-0 left-0 right-0 z-50">
    <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        {onMenu && (
          <button onClick={onMenu} className="active:scale-90 duration-100">
            <Icon name="menu" className="text-primary-container" />
          </button>
        )}
        <h1 className="font-headline font-bold text-lg text-primary-container tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-1">{trailing}</div>
    </div>
  </header>
);

// ─── Bottom Navigation ────────────────────────────────────────────────────────
export const BottomNav = ({ active, onChange, alertCount = 0 }) => {
  const tabs = [
    { id: "dashboard", icon: "grid_view",      label: "Dashboard" },
    { id: "billing",   icon: "calculate",      label: "POS"       },
    { id: "inventory", icon: "inventory",      label: "Inventory" },
    { id: "alerts",    icon: "notifications",  label: "Alerts",   badge: alertCount },
    { id: "settings",  icon: "settings",       label: "Settings"  },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-2
      bg-[#10131A]/90 backdrop-blur-md z-50 rounded-t-2xl border-t border-[#3C494E]/20
      shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className="flex flex-col items-center justify-center gap-1 min-w-[52px] relative active:scale-90 transition-transform duration-100">
            <div className="relative">
              <Icon name={t.icon}
                fill={isActive}
                className={isActive ? "text-primary-container" : "text-on-surface-variant opacity-50"} />
              {t.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-on-error text-[9px] font-bold flex items-center justify-center">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </div>
            <span className={`text-[9px] uppercase tracking-widest font-bold ${isActive ? "text-primary-container" : "text-on-surface-variant opacity-50"}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

// ─── FAB ─────────────────────────────────────────────────────────────────────
export const FAB = ({ icon = "add", onClick, label }) => (
  <button onClick={onClick}
    className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-primary-container text-on-primary
      rounded-2xl px-4 h-14 shadow-glow active:scale-95 transition-transform duration-100 font-semibold text-sm">
    <Icon name={icon} className="text-on-primary" />
    {label && <span>{label}</span>}
  </button>
);

// ─── Input Field ──────────────────────────────────────────────────────────────
export const InputField = ({ label, error, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">{label}</label>}
    <input {...props} />
    {error && <p className="text-xs text-error">{error}</p>}
  </div>
);

export const SelectField = ({ label, error, children, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">{label}</label>}
    <select {...props}>{children}</select>
    {error && <p className="text-xs text-error">{error}</p>}
  </div>
);

// ─── Primary / Secondary Buttons ──────────────────────────────────────────────
export const Btn = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-100 active:scale-95";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-base" };
  const variants = {
    primary:   "bg-primary-container text-on-primary shadow-glow hover:shadow-[0_0_32px_rgba(76,214,255,0.4)]",
    secondary: "bg-surface-container-high text-on-surface border border-outline-variant/30 hover:border-primary-container/50",
    danger:    "bg-error/10 text-error border border-error/25 hover:bg-error/20",
    ghost:     "text-on-surface-variant hover:bg-surface-container-high",
    success:   "bg-secondary/10 text-secondary border border-secondary/25 hover:bg-secondary/20",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 shadow-modal text-xs font-mono">
      <p className="text-on-surface-variant mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};
