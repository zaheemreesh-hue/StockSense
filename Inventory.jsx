import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { computeInsights } from "../utils/ai";
import { fmtCur } from "../utils/formatters";
import { CATEGORIES } from "../utils/constants";
import {
  Icon, Btn, Modal, InputField, SelectField,
  EmptyState, RiskChip, TrendChip, SkeletonCard, SectionLabel, FAB
} from "../components/ui";
import { useDebounce } from "../hooks/useDebounce";

const EMPTY_FORM = { name: "", sku: "", category: "Electronics", supplier: "", costPrice: "", sellingPrice: "", qty: "", threshold: "10", sold7d: "0", sold30d: "0" };

export default function Inventory({ showToast }) {
  const { enriched, loadingProducts, addProduct, editProduct, removeProduct, recordSale, recordRestock, fetchProducts } = useApp();

  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("all");
  const [filterSt, setFilterSt]     = useState("all");
  const [showAdd, setShowAdd]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [saleItem, setSaleItem]     = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const debouncedSearch             = useDebounce(search, 280);

  useEffect(() => { fetchProducts({ search: debouncedSearch }); }, [debouncedSearch]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd  = ()  => { setForm(EMPTY_FORM); setEditItem(null); setShowAdd(true); };
  const openEdit = (p) => { setForm({ name: p.name, sku: p.sku, category: p.category, supplier: p.supplier || "", costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice), qty: String(p.qty), threshold: String(p.threshold), sold7d: String(p.sold7d), sold30d: String(p.sold30d) }); setEditItem(p); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.name || !form.sku) { showToast("Name and SKU are required", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), qty: Number(form.qty), threshold: Number(form.threshold), sold7d: Number(form.sold7d), sold30d: Number(form.sold30d) };
      if (editItem) { await editProduct(editItem._id, payload); showToast("Product updated", "success"); }
      else { await addProduct(payload); showToast("Product added", "success"); }
      setShowAdd(false);
    } catch (e) { showToast(e.response?.data?.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Remove "${p.name}" from inventory?`)) return;
    try { await removeProduct(p._id); showToast(`"${p.name}" removed`, "warning"); }
    catch (e) { showToast(e.response?.data?.message || "Failed to remove", "error"); }
  };

  // Filter
  const filtered = enriched.filter((p) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.supplier || "").toLowerCase().includes(q);
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchSt  = filterSt === "all" || p._insights?.stockStatus === filterSt;
    return matchSearch && matchCat && matchSt;
  });

  const counts = { out: enriched.filter((p) => p.qty === 0).length, low: enriched.filter((p) => p._insights?.stockStatus === "low").length };

  return (
    <div className="space-y-4 pb-4">

      {/* Search bar */}
      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size="sm" />
        <input className="!pl-10" placeholder="Search name, SKU, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Filter chips row */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[["all", "All"], ["healthy", "In Stock"], ["low", "Low"], ["out", "Out"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilterSt(v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterSt === v ? "bg-primary-container text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            {l} {v === "out" && counts.out > 0 ? `(${counts.out})` : v === "low" && counts.low > 0 ? `(${counts.low})` : ""}
          </button>
        ))}
        <div className="w-px h-5 bg-outline-variant/30 self-center flex-shrink-0" />
        {["all", ...CATEGORIES.slice(0, 4)].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterCat === c ? "bg-surface-tint text-background" : "bg-surface-container-high text-on-surface-variant"}`}>
            {c === "all" ? "All Cats" : c}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["inventory_2", products.length, "Total", "text-primary-container"], ["error", counts.out, "Out", "text-error"], ["warning", counts.low, "Low Stock", "text-tertiary"]].map(([icon, val, lbl, col], i) => (
          <div key={i} className="bg-surface-container-low rounded-xl py-3 px-2">
            <p className={`font-mono font-extrabold text-lg ${col}`}>{val ?? "—"}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Product list */}
      {loadingProducts ? (
        <div className="space-y-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="inventory_2" title="No products found" desc="Add your first product to get started"
          action={<Btn onClick={openAdd}><Icon name="add" size="sm" />Add Product</Btn>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => <ProductCard key={p._id} p={p} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} onSale={() => setSaleItem(p)} onRestock={() => setRestockItem(p)} />)}
        </div>
      )}

      {/* FAB */}
      <FAB icon="add" label="Add Product" onClick={openAdd} />

      {/* Add / Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editItem ? "Edit Product" : "Add Product"}
        footer={<><Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editItem ? "Save Changes" : "Add Product"}</Btn></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Product Name" className="col-span-2" placeholder="e.g. AirPods Pro" value={form.name} onChange={(e) => set("name", e.target.value)} />
            <InputField label="SKU" placeholder="EL-001" value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} />
            <SelectField label="Category" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </SelectField>
            <InputField label="Cost Price" type="number" placeholder="0.00" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
            <InputField label="Selling Price" type="number" placeholder="0.00" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
            <InputField label="Quantity" type="number" placeholder="0" value={form.qty} onChange={(e) => set("qty", e.target.value)} />
            <InputField label="Low Stock Threshold" type="number" placeholder="10" value={form.threshold} onChange={(e) => set("threshold", e.target.value)} />
            <InputField label="Sold (7d)" type="number" placeholder="0" value={form.sold7d} onChange={(e) => set("sold7d", e.target.value)} />
            <InputField label="Sold (30d)" type="number" placeholder="0" value={form.sold30d} onChange={(e) => set("sold30d", e.target.value)} />
            <InputField label="Supplier" className="col-span-2" placeholder="Supplier name" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Quick Sale Modal */}
      {saleItem && <QuickActionModal title="Record Sale" icon="point_of_sale" iconColor="text-primary-container" product={saleItem}
        actionLabel="Confirm Sale" onClose={() => setSaleItem(null)}
        onSubmit={async (qty, note) => { await recordSale(saleItem._id, qty, note); showToast(`Sale of ${qty}× ${saleItem.name} recorded`, "success"); setSaleItem(null); }}
        maxQty={saleItem.qty} showToast={showToast} />}

      {/* Quick Restock Modal */}
      {restockItem && <QuickActionModal title="Restock Product" icon="inventory" iconColor="text-secondary" product={restockItem}
        actionLabel="Confirm Restock" variant="success" onClose={() => setRestockItem(null)}
        onSubmit={async (qty, note) => { await recordRestock(restockItem._id, qty, note); showToast(`Restocked ${qty}× ${restockItem.name}`, "success"); setRestockItem(null); }}
        showToast={showToast} />}
    </div>
  );
}

// ── Product Card (mobile-first) ──────────────────────────────────────────────
function ProductCard({ p, onEdit, onDelete, onSale, onRestock }) {
  const ins = p._insights || computeInsights(p);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden animate-fade-up">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface text-sm truncate">{p.name}</p>
            <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">{p.sku} · {p.category}</p>
          </div>
          <RiskChip risk={ins.risk} />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            ["Stock",    p.qty,                    p.qty === 0 ? "text-error" : ins.stockStatus === "low" ? "text-tertiary" : "text-on-surface"],
            ["Days Left", ins.daysLeft ?? "∞",      "text-on-surface"],
            ["30d Sales", p.sold30d,                "text-primary-container"],
          ].map(([lbl, val, cls]) => (
            <div key={lbl} className="bg-surface-container rounded-lg px-2 py-2 text-center">
              <p className={`font-mono font-bold text-base ${cls}`}>{val}</p>
              <p className="text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Stock progress bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (p.qty / Math.max(p.threshold * 3, 1)) * 100)}%`, background: p.qty === 0 ? "#ffb4ab" : ins.stockStatus === "low" ? "#ffd785" : "#4de082" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-on-surface-variant">0</span>
            <span className="text-[9px] text-on-surface-variant">Threshold: {p.threshold}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-outline-variant/10">
        <button onClick={onSale}    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary-container hover:bg-primary-container/5 transition-colors border-r border-outline-variant/10 active:scale-95"><Icon name="point_of_sale" size="sm" />Sale</button>
        <button onClick={onRestock} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary/5 transition-colors border-r border-outline-variant/10 active:scale-95"><Icon name="inventory" size="sm" />Restock</button>
        <button onClick={onEdit}    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors border-r border-outline-variant/10 active:scale-95"><Icon name="edit" size="sm" />Edit</button>
        <button onClick={onDelete}  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-error hover:bg-error/5 transition-colors active:scale-95"><Icon name="delete" size="sm" /></button>
      </div>
    </div>
  );
}

// ── Reusable quick-action modal ────────────────────────────────────────────────
function QuickActionModal({ title, icon, iconColor, product, actionLabel, onClose, onSubmit, maxQty, variant = "primary", showToast }) {
  const [qty, setQty]   = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const q = Number(qty);
    if (!q || q <= 0) { showToast("Enter a valid quantity", "error"); return; }
    if (maxQty !== undefined && q > maxQty) { showToast(`Only ${maxQty} units available`, "error"); return; }
    setLoading(true);
    try { await onSubmit(q, note); }
    catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title={title}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant={variant} onClick={handle} disabled={loading}>{loading ? "Processing…" : actionLabel}</Btn></>}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/20">
          <div className={`w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center`}>
            <Icon name={icon} className={iconColor} size="sm" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">{product.name}</p>
            <p className="text-xs text-on-surface-variant font-mono">{product.sku} · {product.qty} in stock</p>
          </div>
        </div>
        <InputField label="Quantity" type="number" min="1" max={maxQty} placeholder="e.g. 10" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        <InputField label="Note (optional)" placeholder="e.g. Weekend promotion" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
