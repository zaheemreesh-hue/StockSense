const Product = require("../models/Product");
const Movement = require("../models/Movement");

const getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const query = { createdBy: req.user._id, isActive: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    let products = await Product.find(query).sort({ updatedAt: -1 });

    if (status && status !== "all") {
      products = products.filter((p) => {
        if (status === "out") return p.qty === 0;
        if (status === "low") return p.qty > 0 && p.qty < p.threshold;
        if (status === "healthy") return p.qty >= p.threshold;
        return true;
      });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { sku, name, category, costPrice, sellingPrice, qty, threshold, supplier, sold7d, sold30d } = req.body;
    if (!sku || !name || !category)
      return res.status(400).json({ message: "SKU, name and category are required" });

    const exists = await Product.findOne({ sku: sku.toUpperCase(), createdBy: req.user._id });
    if (exists) return res.status(409).json({ message: "SKU already exists" });

    const product = await Product.create({
      sku, name, category, costPrice, sellingPrice, qty: qty || 0,
      threshold: threshold || 10, supplier, sold7d: sold7d || 0,
      sold30d: sold30d || 0, createdBy: req.user._id,
      ...(qty > 0 && { lastRestockedAt: new Date() }),
    });

    if (qty > 0) {
      await Movement.create({
        productId: product._id, productName: product.name, productSku: product.sku,
        type: "restock", quantity: qty, qtyBefore: 0, qtyAfter: qty,
        note: "Initial stock on product creation", createdBy: req.user._id,
        createdByName: req.user.name,
      });
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, category, costPrice, sellingPrice, threshold, supplier, sold7d, sold30d } = req.body;
    Object.assign(product, { name, category, costPrice, sellingPrice, threshold, supplier, sold7d, sold30d });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.qty > 0) {
      await Movement.create({
        productId: product._id, productName: product.name, productSku: product.sku,
        type: "delete", quantity: product.qty, qtyBefore: product.qty, qtyAfter: 0,
        note: "Product deleted from inventory", createdBy: req.user._id,
        createdByName: req.user.name,
      });
    }
    product.isActive = false;
    await product.save();
    res.json({ message: "Product removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const recordSale = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const product = await Product.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (quantity > product.qty) return res.status(400).json({ message: "Insufficient stock" });

    const qtyBefore = product.qty;
    product.qty -= quantity;
    product.sold7d += quantity;
    product.sold30d += quantity;
    await product.save();

    await Movement.create({
      productId: product._id, productName: product.name, productSku: product.sku,
      type: "sale", quantity, qtyBefore, qtyAfter: product.qty, note: note || "",
      createdBy: req.user._id, createdByName: req.user.name,
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const recordRestock = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const product = await Product.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const qtyBefore = product.qty;
    product.qty += quantity;
    product.lastRestockedAt = new Date();
    await product.save();

    await Movement.create({
      productId: product._id, productName: product.name, productSku: product.sku,
      type: "restock", quantity, qtyBefore, qtyAfter: product.qty,
      note: note || `Restock from ${product.supplier || "supplier"}`,
      createdBy: req.user._id, createdByName: req.user.name,
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMovements = async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const query = {};
    // Only movements for this user's products
    const myProductIds = await Product.find({ createdBy: req.user._id }).distinct("_id");
    query.productId = { $in: myProductIds };
    if (type && type !== "all") query.type = type;

    const movements = await Movement.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, recordSale, recordRestock, getMovements };
