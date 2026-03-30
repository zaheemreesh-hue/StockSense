import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { billingService } from "../services/billingService";
import { fmtCur } from "../utils/formatters";
import { PAYMENT_METHODS } from "../utils/constants";
import { Icon, Btn, Modal, EmptyState, InputField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";

export default function Billing({ showToast }) {
  const { products, refreshAll } = useApp();
  const { user } = useAuth();

  const [cart, setCart]             = useState([]);
  const [search, setSearch]         = useState("");
  const [payMethod, setPayMethod]   = useState("cash");
  const [note, setNote]             = useState("");
  const [checking, setChecking]     = useState(false);
  const [invoice, setInvoice]       = useState(null); // successful invoice
  const debouncedSearch             = useDebounce(search, 200);

  const taxRate  = user?.taxRate || 0;
  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
  const taxAmt   = subtotal * (taxRate / 100);
  const total    = subtotal + taxAmt;

  const filteredProducts = products.filter((p) => {
    if (p.qty === 0) return false;
    const q = debouncedSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const addToCart = (p) => {
    setCart((prev) => {
      const ex = prev.find((i) => i._id === p._id);
      if (ex) {
        if (ex.qty >= p.qty) { showToast(`Max stock is ${p.qty}`, "warning"); return prev; }
        return prev.map((i) => i._id === p._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => {
      return prev.map((i) => {
        if (i._id !== id) return i;
        const newQty = i.qty + delta;
        if (newQty <= 0) return null;
        const maxStock = products.find((p) => p._id === id)?.qty || 999;
        if (newQty > maxStock) { showToast(`Max available: ${maxStock}`, "warning"); return i; }
        return { ...i, qty: newQty };
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i._id !== id));
  const clearCart = () => { if (cart.length && !confirm("Clear cart?")) return; setCart([]); };

  const checkout = async () => {
    if (!cart.length) { showToast("Cart is empty", "error"); return; }
    setChecking(true);
    try {
      const { data } = await billingService.checkout({
        items: cart.map((i) => ({ productId: i._id, name: i.name, sku: i.sku, quantity: i.qty })),
        paymentMethod: payMethod,
        note,
        taxRate,
      });
      setInvoice(data);
      setCart([]);
      setNote("");
      refreshAll();
      showToast(`Invoice ${data.invoiceNumber} created!`, "success");
    } catch (e) {
      showToast(e.response?.data?.message || "Checkout failed", "error");
    } finally { setChecking(false); }
  };

  return (
    <div className="space-y-4 pb-4">

      {/* Product search */}
      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size="sm" />
        <input className="!pl-10" placeholder="Search product to add…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Product results (when searching) */}
      {debouncedSearch && (
        <div className="bg-surface-container-low rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-6">No products found</p>
          ) : filteredProducts.map((p) => (
            <button key={p._id} onClick={() => { addToCart(p); setSearch(""); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high border-b border-outline-variant/10 last:border-b-0 transition-colors active:scale-[0.99]">
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{p.name}</p>
                <p className="text-xs text-on-surface-variant font-mono">{p.sku} · {p.qty} in stock</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary-container">{fmtCur(p.sellingPrice)}</p>
              </div>
              <Icon name="add_circle" className="text-primary-container flex-shrink-0" size="sm" />
            </button>
          ))}
        </div>
      )}

      {/* Cart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Cart {cart.length > 0 ? `(${cart.length})` : ""}</p>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-error hover:underline">Clear all</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl">
            <EmptyState icon="shopping_cart" title="Cart is empty" desc="Search above and tap a product to add it" />
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            {cart.map((item) => (
              <div key={item._id} className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                  <p className="text-xs text-on-surface-variant font-mono">{fmtCur(item.sellingPrice)} each</p>
                </div>
                {/* Qty stepper */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => updateQty(item._id, -1)}
                    className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center active:scale-90 transition-transform">
                    <Icon name="remove" size="sm" className="text-on-surface-variant" />
                  </button>
                  <span className="font-mono font-bold text-sm text-on-surface w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item._id, 1)}
                    className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center active:scale-90 transition-transform">
                    <Icon name="add" size="sm" className="text-on-surface-variant" />
                  </button>
                </div>
                {/* Line total */}
                <p className="font-mono font-bold text-sm text-on-surface w-16 text-right flex-shrink-0">
                  {fmtCur(item.sellingPrice * item.qty)}
                </p>
                <button onClick={() => removeFromCart(item._id)} className="active:scale-90 transition-transform">
                  <Icon name="close" size="sm" className="text-on-surface-variant hover:text-error transition-colors" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment method */}
      {cart.length > 0 && (
        <>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} onClick={() => setPayMethod(m.value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${payMethod === m.value ? "border-primary-container bg-primary-container/10 text-primary-container" : "border-outline-variant/30 text-on-surface-variant hover:border-outline"}`}>
                  <span className="text-base">{m.icon}</span>
                  <span className="text-[10px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <InputField label="Note (optional)" placeholder="e.g. Table 5, walk-in customer" value={note} onChange={(e) => setNote(e.target.value)} />

          {/* Summary */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Subtotal ({cart.reduce((s,i)=>s+i.qty,0)} items)</span>
              <span className="font-mono">{fmtCur(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Tax ({taxRate}%)</span>
                <span className="font-mono">{fmtCur(taxAmt)}</span>
              </div>
            )}
            <div className="h-px bg-outline-variant/20" />
            <div className="flex justify-between text-base font-bold text-on-surface">
              <span>Total</span>
              <span className="font-mono text-primary-container">{fmtCur(total)}</span>
            </div>
          </div>

          {/* Checkout button */}
          <Btn variant="primary" size="lg" className="w-full" onClick={checkout} disabled={checking}>
            {checking ? (
              <><Icon name="progress_activity" className="animate-spin" size="sm" />Processing…</>
            ) : (
              <><Icon name="receipt_long" size="sm" />Confirm & Generate Bill</>
            )}
          </Btn>
        </>
      )}

      {/* Invoice success modal */}
      <InvoiceModal invoice={invoice} currency={user?.currency} onClose={() => setInvoice(null)} />
    </div>
  );
}

// ── Invoice success modal ─────────────────────────────────────────────────────
function InvoiceModal({ invoice, currency, onClose }) {
  if (!invoice) return null;
  return (
    <Modal open onClose={onClose} title="Invoice Generated"
      footer={<Btn variant="primary" onClick={onClose} className="w-full">Done</Btn>}>
      <div className="space-y-4">
        {/* Success badge */}
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center animate-pulse-ring">
            <Icon name="check_circle" className="text-secondary" size="lg" fill />
          </div>
          <p className="font-headline font-extrabold text-xl text-on-surface">{fmtCur(invoice.total)}</p>
          <p className="text-xs text-on-surface-variant font-mono">{invoice.invoiceNumber}</p>
          <div className="chip chip-success">{invoice.paymentMethod.toUpperCase()}</div>
        </div>

        {/* Items */}
        <div className="bg-surface-container rounded-xl overflow-hidden">
          {invoice.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/10 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-on-surface">{item.name}</p>
                <p className="text-xs text-on-surface-variant font-mono">{item.quantity}× {fmtCur(item.sellingPrice)}</p>
              </div>
              <p className="font-mono font-bold text-sm text-on-surface">{fmtCur(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {invoice.taxAmount > 0 && (
          <div className="flex justify-between text-sm text-on-surface-variant px-1">
            <span>Tax ({invoice.taxRate}%)</span>
            <span className="font-mono">{fmtCur(invoice.taxAmount)}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
