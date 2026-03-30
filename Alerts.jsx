import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { fmtCur } from "../utils/formatters";
import { EmptyState, Icon, RiskChip, Chip, Btn } from "../components/ui";
import { computeInsights } from "../utils/ai";

const SEV_STYLE = {
  critical: { icon: "crisis_alert",  chip: "critical", ring: "border-l-[#ffb4ab]" },
  warning:  { icon: "warning",       chip: "warning",  ring: "border-l-[#ffd785]" },
  info:     { icon: "info",          chip: "info",     ring: "border-l-[#4cd6ff]" },
};

export default function Alerts({ onNavigate }) {
  const { products, alerts, refreshAll } = useApp();
  const [filter, setFilter] = useState("all");

  useEffect(() => { refreshAll(); }, []);

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);
  const counts   = { critical: alerts.filter((a) => a.severity === "critical").length, warning: alerts.filter((a) => a.severity === "warning").length, info: alerts.filter((a) => a.severity === "info").length };

  return (
    <div className="space-y-4 pb-4">

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2">
        {[["critical", "Crisis", "text-error", "bg-error/10"], ["warning", "Warnings", "text-tertiary", "bg-tertiary/10"], ["info", "Notices", "text-primary-container", "bg-primary-container/10"]].map(([v, l, tc, bg]) => (
          <button key={v} onClick={() => setFilter(filter === v ? "all" : v)}
            className={`rounded-xl py-3 px-2 text-center transition-all border ${filter === v ? `${bg} border-current` : "bg-surface-container-low border-transparent"}`}>
            <p className={`font-mono font-extrabold text-xl ${tc}`}>{counts[v]}</p>
            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">{l}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["all", "All Alerts"], ["critical", "Critical"], ["warning", "Warnings"], ["info", "Info"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === v ? "bg-primary-container text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl">
          <EmptyState icon="check_circle" title={filter === "all" ? "All clear! No alerts" : `No ${filter} alerts`}
            desc="Your inventory is in great shape. Keep it up!" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const s = SEV_STYLE[a.severity] || SEV_STYLE.info;
            return (
              <div key={a.id}
                className={`bg-surface-container-low rounded-xl border-l-4 overflow-hidden animate-fade-up ${s.ring}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon name={s.icon} className={`flex-shrink-0 mt-0.5 ${{ critical: "text-error", warning: "text-tertiary", info: "text-primary-container" }[a.severity]}`} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-on-surface">{a.title}</p>
                        <Chip variant={s.chip}>{a.severity}</Chip>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{a.desc}</p>

                      {/* Insight pills */}
                      {a.insight && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {a.insight.dailyDemand > 0 && <span className="chip chip-muted">Daily: {a.insight.dailyDemand}/d</span>}
                          {a.insight.daysLeft !== null && <span className={`chip chip-${a.severity === "critical" ? "critical" : "warning"}`}>{a.insight.daysLeft}d left</span>}
                          {a.insight.reorderQty > 0 && <span className="chip chip-warning">Reorder: {a.insight.reorderQty}</span>}
                          <span className="chip chip-muted">{a.insight.confidence}% confidence</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Footer action */}
                <div className="border-t border-outline-variant/10 flex">
                  <button onClick={() => onNavigate("inventory")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                    <Icon name="open_in_new" size="sm" />View Product
                  </button>
                  {a.type !== "dead_stock" && (
                    <button onClick={() => onNavigate("inventory")}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary/5 transition-colors border-l border-outline-variant/10">
                      <Icon name="inventory" size="sm" />Restock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
