export const computeInsights = (product) => {
  const dailyDemand = product.sold30d > 0 ? product.sold30d / 30 : 0;
  const daysLeft = dailyDemand > 0 ? Math.round((product.qty / dailyDemand) * 10) / 10 : null;
  const reorderQty = dailyDemand > 0 ? Math.max(0, Math.ceil(dailyDemand * 14 - product.qty)) : 0;

  let risk = "low";
  if (product.qty === 0) risk = "out";
  else if (daysLeft !== null && daysLeft <= 3)  risk = "critical";
  else if (daysLeft !== null && daysLeft <= 7)  risk = "high";
  else if (daysLeft !== null && daysLeft <= 14) risk = "medium";

  const weeklyRate  = product.sold7d  > 0 ? product.sold7d  / 7  : 0;
  const monthlyRate = dailyDemand;
  let trend = "stable";
  if (monthlyRate > 0) {
    if (weeklyRate > monthlyRate * 1.15) trend = "up";
    else if (weeklyRate < monthlyRate * 0.85) trend = "down";
  }

  let confidence = 60;
  if (product.sold30d >= 60) confidence = 92;
  else if (product.sold30d >= 30) confidence = 84;
  else if (product.sold30d >= 10) confidence = 76;
  else if (product.sold30d >= 3)  confidence = 68;

  const isDeadStock   = product.sold30d <= 5  && product.qty > product.threshold * 2;
  const isSlowMoving  = !isDeadStock && product.sold30d <= 10 && product.qty > product.threshold * 1.5;
  const isFastMoving  = product.sold30d >= 50 || weeklyRate >= 5;

  let stockStatus = "healthy";
  if (product.qty === 0) stockStatus = "out";
  else if (product.qty < product.threshold) stockStatus = "low";

  const margin = product.costPrice > 0
    ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
    : null;

  return { dailyDemand: Math.round(dailyDemand * 10) / 10, daysLeft, reorderQty, risk, trend, confidence, isDeadStock, isSlowMoving, isFastMoving, stockStatus, margin };
};

export const generateAlerts = (products) => {
  const alerts = [];
  for (const p of products) {
    const ins = computeInsights(p);
    if (p.qty === 0) {
      alerts.push({ id: `out-${p._id}`, severity: "critical", type: "out_of_stock", product: p, insight: ins, title: `Out of Stock: ${p.name}`, desc: `Reorder from ${p.supplier || "supplier"} immediately.` });
    } else if (ins.risk === "critical") {
      alerts.push({ id: `crit-${p._id}`, severity: "critical", type: "critical_low", product: p, insight: ins, title: `Critical Low: ${p.name}`, desc: `~${ins.daysLeft}d of stock at current rate. Reorder ${ins.reorderQty} units.` });
    } else if (ins.risk === "high") {
      alerts.push({ id: `high-${p._id}`, severity: "warning", type: "low_stock", product: p, insight: ins, title: `Low Stock: ${p.name}`, desc: `${p.qty} units left (~${ins.daysLeft} days). Reorder ${ins.reorderQty} units soon.` });
    } else if (ins.isDeadStock) {
      alerts.push({ id: `dead-${p._id}`, severity: "info", type: "dead_stock", product: p, insight: ins, title: `Dead Stock: ${p.name}`, desc: `Only ${p.sold30d} sold in 30 days with ${p.qty} in stock. Consider a discount.` });
    }
  }
  const order = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
};
