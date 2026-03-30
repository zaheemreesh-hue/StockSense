import { useState, useEffect } from "react";
import { billingService } from "../services/billingService";
import { fmtCur, fmtDateTime } from "../utils/formatters";
import { Icon, EmptyState, Chip, Modal, Btn, SkeletonCard } from "../components/ui";

const STATUS_STYLE = {
  paid:      { chip: "success",  icon: "check_circle",  label: "Paid"      },
  refunded:  { chip: "warning",  icon: "undo",          label: "Refunded"  },
  cancelled: { chip: "critical", icon: "cancel",        label: "Cancelled" },
};

const PAYMENT_ICON = { cash: "payments", card: "credit_card", transfer: "account_balance", other: "receipt" };

export default function Sales({ showToast }) {
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [filter, setFilter]       = useState("all");
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const LIMIT = 20;

  const load = async (pg = 1, status = filter) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, page: pg };
      if (status !== "all") params.status = status;
      const { data } = await billingService.getInvoices(params);
      setInvoices(pg === 1 ? data.invoices : (prev) => [...prev, ...data.invoices]);
      setTotal(data.total);
      setPage(pg);
    } catch (e) {
      showToast("Failed to load sales history", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1, filter); }, [filter]);

  const handleRefund = async () => {
    if (!selected) return;
    if (!confirm(`Refund invoice ${selected.invoiceNumber}? Stock will be restored.`)) return;
    setRefunding(true);
    try {
      const { data } = await billingService.refund(selected._id);
      setInvoices((prev) => prev.map((inv) => inv._id === data._id ? data : inv));
      setSelected(data);
      showToast(`Invoice ${data.invoiceNumber} refunded — stock restored`, "success");
    } catch (e) {
      showToast(e.response?.data?.message || "Refund failed", "error");
    } finally { setRefunding(false); }
  };

  // Summary stats
  const paidInvoices    = invoices.filter((i) => i.status === "paid");
  const totalRevenue    = paidInvoices.reduce((s, i) => s + i.total, 0);
  const avgOrderValue   = paidInvoices.length ? totalRevenue / paidInvoices.length : 0;
  const refundedCount   = invoices.filter((i) => i.status === "refunded").length;

  return (
    <div className="space-y-4 pb-4">

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ["payments",    fmtCur(totalRevenue),    "Revenue",    "text-secondary"],
          ["receipt_long", paidInvoices.length,    "Invoices",   "text-primary-container"],
          ["undo",         refundedCount,           "Refunded",   "text-tertiary"],
        ].map(([icon, val, lbl, col]) => (
          <div key={lbl} className="bg-surface-container-low rounded-xl py-3 px-2 text-center">
            <Icon name={icon} className={`${col} mb-1`} size="sm" />
            <p className={`font-mono font-extrabold text-base ${col}`}>{val}</p>
            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["all","All"], ["paid","Paid"], ["refunded","Refunded"], ["cancelled","Cancelled"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === v ? "bg-primary-container text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {loading && invoices.length === 0 ? (
        <div className="space-y-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl">
          <EmptyState icon="receipt_long" title="No invoices yet" desc="Create your first bill from the POS page" />
        </div>
      ) : (
        <>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            {invoices.map((inv, i) => {
              const s = STATUS_STYLE[inv.status] || STATUS_STYLE.paid;
              return (
                <button key={inv._id} onClick={() => setSelected(inv)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-container-high transition-colors active:scale-[0.99] text-left animate-fade-up">
                  {/* Payment method icon */}
                  <div className="w-9 h-9 rounded-xl bg-primary-container/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={PAYMENT_ICON[inv.paymentMethod] || "receipt"} className="text-primary-container" size="sm" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-on-surface font-mono">{inv.invoiceNumber}</p>
                      <Chip variant={s.chip}>{s.label}</Chip>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {inv.items.length} item{inv.items.length !== 1 ? "s" : ""} · {fmtDateTime(inv.createdAt)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-mono font-bold text-sm ${inv.status === "refunded" ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                      {fmtCur(inv.total)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant capitalize">{inv.paymentMethod}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Load more */}
          {invoices.length < total && (
            <button onClick={() => load(page + 1, filter)}
              className="w-full py-3 text-sm font-semibold text-primary-container bg-surface-container-low rounded-xl border border-outline-variant/20 hover:bg-surface-container-high transition-colors active:scale-[0.98]">
              {loading ? "Loading…" : `Load More (${total - invoices.length} remaining)`}
            </button>
          )}
        </>
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selected}
        onClose={() => setSelected(null)}
        onRefund={handleRefund}
        refunding={refunding}
      />
    </div>
  );
}

// ── Invoice Detail Modal ──────────────────────────────────────────────────────
function InvoiceDetailModal({ invoice, onClose, onRefund, refunding }) {
  if (!invoice) return null;
  const s = STATUS_STYLE[invoice.status] || STATUS_STYLE.paid;

  return (
    <Modal open onClose={onClose} title="Invoice Details"
      footer={
        <div className="flex gap-2 w-full">
          {invoice.status === "paid" && (
            <Btn variant="danger" onClick={onRefund} disabled={refunding} className="flex-1">
              {refunding ? (
                <><Icon name="progress_activity" size="sm" className="animate-spin" />Processing…</>
              ) : (
                <><Icon name="undo" size="sm" />Refund & Restore Stock</>
              )}
            </Btn>
          )}
          <Btn variant="secondary" onClick={onClose} className="flex-1">Close</Btn>
        </div>
      }>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono font-extrabold text-lg text-on-surface">{invoice.invoiceNumber}</p>
            <p className="text-xs text-on-surface-variant">{fmtDateTime(invoice.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip variant={s.chip}>{s.label}</Chip>
            <span className="text-[10px] text-on-surface-variant capitalize">{invoice.paymentMethod}</span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-surface-container rounded-xl overflow-hidden">
          {invoice.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                <p className="text-xs text-on-surface-variant font-mono">{item.sku} · {item.quantity}× {fmtCur(item.sellingPrice)}</p>
              </div>
              <p className="font-mono font-bold text-sm text-on-surface ml-4 flex-shrink-0">{fmtCur(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1.5 px-1">
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Subtotal</span>
            <span className="font-mono">{fmtCur(invoice.subtotal)}</span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Tax ({invoice.taxRate}%)</span>
              <span className="font-mono">{fmtCur(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="h-px bg-outline-variant/20 my-1" />
          <div className="flex justify-between font-bold text-on-surface">
            <span>Total</span>
            <span className="font-mono text-primary-container">{fmtCur(invoice.total)}</span>
          </div>
        </div>

        {/* Note */}
        {invoice.note && (
          <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/20">
            <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">Note: </span>{invoice.note}</p>
          </div>
        )}

        {/* Served by */}
        {invoice.createdByName && (
          <p className="text-xs text-on-surface-variant text-center">Served by <span className="font-semibold text-on-surface">{invoice.createdByName}</span></p>
        )}
      </div>
    </Modal>
  );
}
