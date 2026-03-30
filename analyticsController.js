const Product = require("../models/Product");
const Movement = require("../models/Movement");
const Invoice = require("../models/Invoice");
const { generateRecommendations, computeProductInsights } = require("../utils/aiEngine");

const getDashboard = async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.user._id, isActive: true });
    const { summary, reorderNow, fastMovers, deadStock } = generateRecommendations(products);

    const recentMovements = await Movement.find({
      productId: { $in: products.map((p) => p._id) },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentInvoices = await Invoice.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalRevenue = await Invoice.aggregate([
      { $match: { createdBy: req.user._id, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // Last 7 days sales by day
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dailySales = await Invoice.aggregate([
      { $match: { createdBy: req.user._id, status: "paid", createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categoryBreakdown = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.sellingPrice * p.qty;
      return acc;
    }, {});

    res.json({
      summary,
      reorderNow: reorderNow.slice(0, 5),
      fastMovers: fastMovers.slice(0, 4),
      deadStock: deadStock.slice(0, 4),
      recentMovements,
      recentInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      dailySales,
      categoryBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.user._id, isActive: true });
    const result = generateRecommendations(products);
    const outOfStock = result.enriched.filter((p) => p.qty === 0);
    const allWithInsights = result.enriched;
    res.json({ ...result, outOfStock, allWithInsights });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.user._id, isActive: true });
    const alerts = [];

    for (const p of products) {
      const ins = computeProductInsights(p);
      if (p.qty === 0) {
        alerts.push({ id: `out-${p._id}`, severity: "critical", type: "out_of_stock", product: p, insight: ins, title: `Out of Stock: ${p.name}`, desc: `Reorder ${ins.reorderQty || "N/A"} units from ${p.supplier || "supplier"}.` });
      } else if (ins.risk === "critical") {
        alerts.push({ id: `crit-${p._id}`, severity: "critical", type: "critical_low", product: p, insight: ins, title: `Critical Low: ${p.name}`, desc: `Only ${ins.daysLeft}d of stock at current sell rate. Reorder ${ins.reorderQty} units.` });
      } else if (ins.risk === "high") {
        alerts.push({ id: `high-${p._id}`, severity: "warning", type: "low_stock", product: p, insight: ins, title: `Low Stock: ${p.name}`, desc: `${p.qty} units left (~${ins.daysLeft} days). Reorder ${ins.reorderQty} units soon.` });
      } else if (ins.isDeadStock) {
        alerts.push({ id: `dead-${p._id}`, severity: "info", type: "dead_stock", product: p, insight: ins, title: `Dead Stock: ${p.name}`, desc: `Only ${p.sold30d} sold in 30 days with ${p.qty} in stock. Consider discounting.` });
      } else if (ins.isSlowMoving) {
        alerts.push({ id: `slow-${p._id}`, severity: "info", type: "slow_moving", product: p, insight: ins, title: `Slow Moving: ${p.name}`, desc: `${p.sold30d} sold in 30d. ${p.qty} units sitting in stock.` });
      }
    }

    const order = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboard, getInsights, getAlerts };
