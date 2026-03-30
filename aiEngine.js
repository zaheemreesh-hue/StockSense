/**
 * StockSense AI Engine
 * Rule-based intelligence system. Structured for OpenAI plugin integration later.
 */

const computeProductInsights = (product) => {
  const dailyDemand = product.sold30d > 0 ? product.sold30d / 30 : 0;
  const daysLeft =
    dailyDemand > 0 ? Math.round((product.qty / dailyDemand) * 10) / 10 : null;
  const reorderQty =
    dailyDemand > 0
      ? Math.max(0, Math.ceil(dailyDemand * 14 - product.qty))
      : 0;

  // Risk level
  let risk = "low";
  if (product.qty === 0) risk = "out";
  else if (daysLeft !== null && daysLeft <= 3) risk = "critical";
  else if (daysLeft !== null && daysLeft <= 7) risk = "high";
  else if (daysLeft !== null && daysLeft <= 14) risk = "medium";

  // Trend: compare weekly vs monthly daily rate
  const weeklyRate = product.sold7d > 0 ? product.sold7d / 7 : 0;
  const monthlyRate = dailyDemand;
  let trend = "stable";
  if (monthlyRate > 0) {
    if (weeklyRate > monthlyRate * 1.15) trend = "up";
    else if (weeklyRate < monthlyRate * 0.85) trend = "down";
  }

  // Confidence (data quality proxy)
  let confidence = 60;
  if (product.sold30d >= 60) confidence = 92;
  else if (product.sold30d >= 30) confidence = 84;
  else if (product.sold30d >= 10) confidence = 76;
  else if (product.sold30d >= 3) confidence = 68;

  // Stock classification
  const isDeadStock =
    product.sold30d <= 5 && product.qty > product.threshold * 2;
  const isSlowMoving =
    !isDeadStock &&
    product.sold30d <= 10 &&
    product.qty > product.threshold * 1.5;
  const isFastMoving = product.sold30d >= 50 || weeklyRate >= 5;

  // Stock status
  let stockStatus = "healthy";
  if (product.qty === 0) stockStatus = "out";
  else if (product.qty < product.threshold) stockStatus = "low";

  // Gross margin
  const margin =
    product.costPrice > 0
      ? Math.round(
          ((product.sellingPrice - product.costPrice) / product.sellingPrice) *
            100
        )
      : null;

  return {
    dailyDemand: Math.round(dailyDemand * 10) / 10,
    daysLeft,
    reorderQty,
    risk,
    trend,
    confidence,
    isDeadStock,
    isSlowMoving,
    isFastMoving,
    stockStatus,
    margin,
  };
};

const generateRecommendations = (products) => {
  const enriched = products.map((p) => ({
    ...p.toObject ? p.toObject() : p,
    _id: p._id,
    insights: computeProductInsights(p),
  }));

  const reorderNow = enriched
    .filter((p) => p.insights.reorderQty > 0)
    .sort((a, b) => {
      const da = a.insights.daysLeft ?? 999;
      const db = b.insights.daysLeft ?? 999;
      return da - db;
    })
    .slice(0, 10)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      qty: p.qty,
      daysLeft: p.insights.daysLeft,
      reorderQty: p.insights.reorderQty,
      risk: p.insights.risk,
      supplier: p.supplier,
      message: `Reorder ${p.insights.reorderQty} units. ${
        p.insights.daysLeft !== null
          ? `~${p.insights.daysLeft} days of stock remain.`
          : "No sales history yet."
      }`,
    }));

  const fastMovers = enriched
    .filter((p) => p.insights.isFastMoving)
    .sort((a, b) => b.sold30d - a.sold30d)
    .slice(0, 8)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      sold30d: p.sold30d,
      sold7d: p.sold7d,
      trend: p.insights.trend,
      daysLeft: p.insights.daysLeft,
      message: `Selling fast — ${p.sold30d} units in 30 days. Ensure stock is maintained.`,
    }));

  const deadStock = enriched
    .filter((p) => p.insights.isDeadStock || p.insights.isSlowMoving)
    .sort((a, b) => a.sold30d - b.sold30d)
    .slice(0, 8)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      qty: p.qty,
      sold30d: p.sold30d,
      tag: p.insights.isDeadStock ? "dead" : "slow",
      message: `Only ${p.sold30d} units sold in 30 days. Consider a discount or promotion.`,
    }));

  const outOfStock = enriched
    .filter((p) => p.qty === 0)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      sold30d: p.sold30d,
      supplier: p.supplier,
      message: `Out of stock. Reorder from ${p.supplier || "supplier"} immediately.`,
    }));

  const summary = {
    totalProducts: products.length,
    outOfStockCount: enriched.filter((p) => p.qty === 0).length,
    lowStockCount: enriched.filter((p) => p.insights.stockStatus === "low").length,
    deadStockCount: enriched.filter((p) => p.insights.isDeadStock).length,
    slowMovingCount: enriched.filter((p) => p.insights.isSlowMoving).length,
    fastMovingCount: enriched.filter((p) => p.insights.isFastMoving).length,
    totalInventoryValue: enriched.reduce(
      (s, p) => s + p.sellingPrice * p.qty,
      0
    ),
    totalCostValue: enriched.reduce((s, p) => s + p.costPrice * p.qty, 0),
  };

  return { reorderNow, fastMovers, deadStock, outOfStock, summary, enriched };
};

module.exports = { computeProductInsights, generateRecommendations };
