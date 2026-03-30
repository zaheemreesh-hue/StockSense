import { useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { fmtCur, timeAgo } from "../utils/formatters";
import { computeInsights } from "../utils/ai";
import { CHART_COLORS } from "../utils/constants";
import { StatCard, EmptyState, RiskChip, TrendChip, SkeletonCard, ChartTooltip, SectionLabel, Icon } from "../components/ui";

const MovColor = { sale: "#4cd6ff", restock: "#4de082", adjustment: "#ffd785", damaged: "#ffb4ab", refund: "#c084fc", delete: "#859399" };

export default function Dashboard() {
  const { user } = useAuth();
  const { products, movements, dashboard, loadingDashboard, refreshAll } = useApp();

  useEffect(() => { refreshAll(); }, []);

  // ── Derived from live products ──────────────────────────────────────────
  const enriched   = products.map((p) => ({ ...p, ins: computeInsights(p) }));
  const outOfStock = enriched.filter((p) => p.qty === 0).length;
  const lowStock   = enriched.filter((p) => p.ins.stockStatus === "low").length;
  const totalVal   = products.reduce((s, p) => s + p.sellingPrice * p.qty, 0);
  const fastMovers = enriched.filter((p) => p.ins.isFastMoving).sort((a, b) => b.sold30d - a.sold30d).slice(0, 4);
  const reorder    = enriched.filter((p) => p.ins.reorderQty > 0).sort((a, b) => (a.ins.daysLeft ?? 999) - (b.ins.daysLeft ?? 999)).slice(0, 3);

  // Category breakdown for pie
  const catMap = {};
  products.forEach((p) => { catMap[p.category] = (catMap[p.category] || 0) + p.sellingPrice * p.qty; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }));
  const catTotal = catData.reduce((s, c) => s + c.value, 0);

  // Weekly chart from dashboard (or fallback)
  const dailySales = dashboard?.dailySales || [];

  const recentMov = [...movements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-5 pb-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-on-surface-variant text-sm">Good {hour()}, {user?.name?.split(" ")[0] || "there"} 👋</p>
          <h2 className="font-headline font-extrabold text-xl text-on-surface">{user?.businessName || "Your Store"}</h2>
        </div>
        <button onClick={refreshAll} className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center active:scale-90 transition-transform">
          <Icon name="refresh" className="text-on-surface-variant" size="sm" />
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 stagger">
        <StatCard loading={loadingDashboard} icon="storefront" iconBg="bg-primary-container/10" iconColor="text-primary-container"
          value={fmtCur(totalVal)} label="Inventory Value" />
        <StatCard loading={loadingDashboard} icon="inventory_2" iconBg="bg-secondary/10" iconColor="text-secondary"
          value={products.length} label="Total Products" />
        <StatCard loading={loadingDashboard} icon="production_quantity_limits" iconBg="bg-error/10" iconColor="text-error"
          value={outOfStock} label="Out of Stock" subUp={outOfStock === 0} sub={outOfStock === 0 ? "All good" : "Needs attention"} />
        <StatCard loading={loadingDashboard} icon="warning" iconBg="bg-tertiary/10" iconColor="text-tertiary"
          value={lowStock} label="Low Stock" subUp={lowStock === 0} sub={lowStock === 0 ? "Healthy" : "Reorder soon"} />
      </div>

      {/* Critical reorder banner */}
      {reorder.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>⚡ Reorder Now</SectionLabel>
          {reorder.map((p) => (
            <div key={p._id} className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-up">
              <Icon name="error" className="text-error flex-shrink-0" size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{p.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {p.qty === 0 ? "Out of stock" : `${p.qty} left · ~${p.ins.daysLeft}d`} · Reorder {p.ins.reorderQty} units
                </p>
              </div>
              <RiskChip risk={p.ins.risk} />
            </div>
          ))}
        </div>
      )}

      {/* Sales chart */}
      {dailySales.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-headline font-bold text-on-surface text-sm">Revenue — Last 7 Days</p>
              <p className="text-xs text-on-surface-variant">From confirmed invoices</p>
            </div>
            <p className="font-mono font-bold text-primary-container text-sm">
              {fmtCur(dailySales.reduce((s, d) => s + d.total, 0))}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4cd6ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4cd6ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3c494e30" />
              <XAxis dataKey="_id" tick={{ fill: "#859399", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#859399", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="total" name="Revenue" stroke="#4cd6ff" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two column: category pie + fast movers */}
      <div className="grid grid-cols-2 gap-3">
        {/* Category Pie */}
        <div className="bg-surface-container-low rounded-xl p-4">
          <p className="font-headline font-bold text-on-surface text-sm mb-3">By Category</p>
          {catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={90}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {catData.slice(0, 3).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: CHART_COLORS[i] }} />
                    <span className="text-[10px] text-on-surface-variant truncate flex-1">{c.name}</span>
                    <span className="text-[10px] font-bold font-mono text-on-surface">{catTotal > 0 ? Math.round((c.value / catTotal) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState icon="pie_chart" title="No data" />}
        </div>

        {/* Fast Movers */}
        <div className="bg-surface-container-low rounded-xl p-4">
          <p className="font-headline font-bold text-on-surface text-sm mb-3">🔥 Fast Movers</p>
          {fastMovers.length === 0 ? (
            <EmptyState icon="trending_up" title="None yet" />
          ) : (
            <div className="space-y-2.5">
              {fastMovers.map((p, i) => (
                <div key={p._id} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-on-surface-variant w-4">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">{p.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{p.sold30d} sold / 30d</p>
                  </div>
                  <TrendChip trend={p.ins.trend} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent movements */}
      <div>
        <SectionLabel>Recent Movements</SectionLabel>
        <div className="mt-2 bg-surface-container-low rounded-xl overflow-hidden">
          {recentMov.length === 0 ? (
            <EmptyState icon="swap_vert" title="No movements yet" desc="Record a sale or restock to see history" />
          ) : recentMov.map((m, i) => (
            <div key={m._id || i}
              className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 last:border-b-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: (MovColor[m.type] || "#859399") + "18" }}>
                <Icon name={movIcon(m.type)} size="sm" className="" style={{ color: MovColor[m.type] || "#859399" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{m.productName}</p>
                <p className="text-xs text-on-surface-variant">{timeAgo(m.createdAt)}</p>
              </div>
              <span className="font-mono font-bold text-sm flex-shrink-0"
                style={{ color: MovColor[m.type] || "#bbc9cf" }}>
                {["sale", "damaged", "delete"].includes(m.type) ? "-" : "+"}{Math.abs(m.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const hour = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};

const movIcon = (t) => ({ sale: "point_of_sale", restock: "inventory", adjustment: "tune", damaged: "broken_image", refund: "undo", delete: "delete" }[t] || "swap_vert");
