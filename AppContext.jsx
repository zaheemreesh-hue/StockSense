import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { productService } from "../services/productService";
import { analyticsService } from "../services/analyticsService";
import { useAuth } from "./AuthContext";
import { computeInsights, generateAlerts } from "../utils/ai";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();

  const [products,   setProductsState] = useState([]);
  const [movements,  setMovements]     = useState([]);
  const [dashboard,  setDashboard]     = useState(null);
  const [loadingProducts,  setLP] = useState(false);
  const [loadingDashboard, setLD] = useState(false);
  const [error, setError] = useState(null);

  // ── Derived state ──────────────────────────────────────────────────────────
  const enriched = products.map((p) => ({ ...p, _insights: computeInsights(p) }));
  const alerts   = generateAlerts(products);

  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (params) => {
    setLP(true);
    try {
      const { data } = await productService.getAll(params);
      setProductsState(data);
    } catch (e) { setError(e.response?.data?.message || "Failed to load products"); }
    finally { setLP(false); }
  }, []);

  const fetchMovements = useCallback(async (params) => {
    try {
      const { data } = await productService.getMovements(params);
      setMovements(data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLD(true);
    try {
      const { data } = await analyticsService.getDashboard();
      setDashboard(data);
    } catch (e) { console.error(e); }
    finally { setLD(false); }
  }, []);

  const refreshAll = useCallback(() => {
    fetchProducts();
    fetchMovements();
    fetchDashboard();
  }, [fetchProducts, fetchMovements, fetchDashboard]);

  // Boot on login
  useEffect(() => { if (user) refreshAll(); }, [user]);

  // ── Product actions (optimistic + API) ────────────────────────────────────
  const addProduct = useCallback(async (payload) => {
    const { data } = await productService.create(payload);
    setProductsState((prev) => [data, ...prev]);
    fetchDashboard();
    return data;
  }, [fetchDashboard]);

  const editProduct = useCallback(async (id, payload) => {
    const { data } = await productService.update(id, payload);
    setProductsState((prev) => prev.map((p) => (p._id === id ? data : p)));
    fetchDashboard();
    return data;
  }, [fetchDashboard]);

  const removeProduct = useCallback(async (id) => {
    await productService.remove(id);
    setProductsState((prev) => prev.filter((p) => p._id !== id));
    fetchDashboard();
  }, [fetchDashboard]);

  const recordSale = useCallback(async (id, quantity, note) => {
    const { data } = await productService.recordSale(id, { quantity, note });
    setProductsState((prev) => prev.map((p) => (p._id === id ? data : p)));
    fetchMovements();
    fetchDashboard();
    return data;
  }, [fetchMovements, fetchDashboard]);

  const recordRestock = useCallback(async (id, quantity, note) => {
    const { data } = await productService.recordRestock(id, { quantity, note });
    setProductsState((prev) => prev.map((p) => (p._id === id ? data : p)));
    fetchMovements();
    fetchDashboard();
    return data;
  }, [fetchMovements, fetchDashboard]);

  return (
    <AppContext.Provider value={{
      products, enriched, movements, dashboard, alerts,
      loadingProducts, loadingDashboard, error,
      fetchProducts, fetchMovements, fetchDashboard, refreshAll,
      addProduct, editProduct, removeProduct, recordSale, recordRestock,
      setProductsState,
    }}>
      {children}
    </AppContext.Provider>
  );
};
