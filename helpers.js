import { RISK_COLORS, RISK_BADGE, MOVEMENT_COLORS, MOVEMENT_BG } from "./constants";

export const riskColor  = (r) => RISK_COLORS[r]  || "var(--text-muted)";
export const riskBadge  = (r) => RISK_BADGE[r]   || "badge-muted";
export const movColor   = (t) => MOVEMENT_COLORS[t] || "var(--text-muted)";
export const movBg      = (t) => MOVEMENT_BG[t]    || "var(--bg-elevated)";

export const movSign = (type) => ["sale", "damaged", "delete"].includes(type) ? "-" : "+";

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

export const clsx = (...classes) => classes.filter(Boolean).join(" ");
