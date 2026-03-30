export const CATEGORIES = ["Electronics", "Apparel", "FMCG", "Home & Living", "Sports", "Beauty", "Food & Beverage", "Tools", "Other"];

export const PAYMENT_METHODS = [
  { value: "cash",     label: "Cash",          icon: "💵" },
  { value: "card",     label: "Card / Tap",    icon: "💳" },
  { value: "transfer", label: "Bank Transfer",  icon: "🏦" },
  { value: "other",    label: "Other",          icon: "📝" },
];

export const MOVEMENT_TYPES = ["sale", "restock", "adjustment", "damaged", "refund", "delete"];

export const RISK_COLORS = {
  out:      "var(--accent-red)",
  critical: "var(--accent-red)",
  high:     "var(--accent-orange)",
  medium:   "var(--accent-yellow)",
  low:      "var(--accent-green)",
};

export const RISK_BADGE = {
  out:      "badge-red",
  critical: "badge-red",
  high:     "badge-orange",
  medium:   "badge-yellow",
  low:      "badge-green",
};

export const MOVEMENT_COLORS = {
  sale:       "var(--accent-blue)",
  restock:    "var(--accent-green)",
  adjustment: "var(--accent-yellow)",
  damaged:    "var(--accent-red)",
  refund:     "var(--accent-purple)",
  delete:     "var(--text-muted)",
};

export const MOVEMENT_BG = {
  sale:       "rgba(0,212,255,0.10)",
  restock:    "rgba(0,255,136,0.10)",
  adjustment: "rgba(255,214,10,0.10)",
  damaged:    "rgba(255,59,92,0.10)",
  refund:     "rgba(168,85,247,0.10)",
  delete:     "rgba(74,85,104,0.10)",
};

export const CHART_COLORS = ["#00D4FF", "#00FF88", "#FF7B35", "#A855F7", "#FFD60A", "#FF3B5C"];

export const NAV_ADMIN = [
  { section: "Overview",   items: [{ id: "dashboard", label: "Dashboard",  icon: "LayoutDashboard" }, { id: "alerts",    label: "Alerts",      icon: "Bell"       }] },
  { section: "Inventory",  items: [{ id: "inventory", label: "Products",   icon: "Package"         }, { id: "movements", label: "Movements",   icon: "History"    }, { id: "insights",  label: "AI Insights", icon: "TrendingUp" }] },
  { section: "Sales",      items: [{ id: "billing",   label: "Billing/POS",icon: "ShoppingCart"    }, { id: "sales",     label: "Sales History",icon: "Receipt"   }] },
  { section: "Account",    items: [{ id: "settings",  label: "Settings",   icon: "Settings"        }] },
];

export const NAV_STAFF = [
  { section: "Overview",   items: [{ id: "dashboard", label: "Dashboard",   icon: "LayoutDashboard" }, { id: "alerts",    label: "Alerts",      icon: "Bell"       }] },
  { section: "Inventory",  items: [{ id: "inventory", label: "Products",    icon: "Package"         }, { id: "movements", label: "Movements",   icon: "History"    }] },
  { section: "Sales",      items: [{ id: "billing",   label: "Billing/POS", icon: "ShoppingCart"    }] },
];
