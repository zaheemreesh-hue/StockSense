import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Icon, EmptyState, Chip } from "../components/ui";
import { timeAgo } from "../utils/formatters";
import { MOVEMENT_COLORS, MOVEMENT_BG } from "../utils/constants";

const MOV_ICON  = { sale: "point_of_sale", restock: "inventory", adjustment: "tune", damaged: "broken_image", refund: "undo", delete: "delete" };
const MOV_LABEL = { sale: "Sale", restock: "Restock", adjustment: "Adjustment", damaged: "Damaged", refund: "Refund", delete: "Deleted" };

export default function Movements() {
  const { movements, fetchMovements } = useApp();
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchMovements(); }, []);

  const filtered = filter === "all" ? movements : movements.filter((m) => m.type === filter);
  const sorted   = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const counts = {};
  movements.forEach((m) => { counts[m.type] = (counts[m.type] || 0) + 1; });

  return (
    <div className="space-y-4 pb-4">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["all", "All", movements.length], ["sale", "Sales", counts.sale || 0], ["restock", "Restocks", counts.restock || 0], ["adjustment", "Adjustments", counts.adjustment || 0], ["damaged", "Damaged", counts.damaged || 0]].map(([v, l, c]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === v ? "bg-primary-container text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            {l}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === v ? "bg-on-primary/20" : "bg-surface-container text-on-surface-variant"}`}>{c}</span>
          </button>
        ))}
      </div>

      {/* Movement list */}
      {sorted.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl">
          <EmptyState icon="swap_vert" title="No movements yet" desc="Record a sale or restock to start tracking movement history" />
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          {sorted.map((m, i) => {
            const col = MOVEMENT_COLORS[m.type] || "#859399";
            const bg  = MOVEMENT_BG[m.type]    || "rgba(133,147,153,0.1)";
            const isNeg = ["sale","damaged","delete"].includes(m.type);
            return (
              <div key={m._id || i}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/10 last:border-b-0 animate-fade-up">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon name={MOV_ICON[m.type] || "swap_vert"} size="sm" style={{ color: col }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{m.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="chip chip-muted" style={{ background: bg, color: col }}>{MOV_LABEL[m.type] || m.type}</span>
                    {m.note && <span className="text-[10px] text-on-surface-variant truncate max-w-[120px]">{m.note}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-sm" style={{ color: col }}>
                    {isNeg ? "-" : "+"}{Math.abs(m.quantity)}
                  </p>
                  {m.qtyBefore !== undefined && (
                    <p className="text-[10px] text-on-surface-variant font-mono">{m.qtyBefore}→{m.qtyAfter}</p>
                  )}
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{timeAgo(m.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
