const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Movement = require("../models/Movement");

const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const pad = String(count + 1).padStart(5, "0");
  return `INV-${new Date().getFullYear()}-${pad}`;
};

const checkout = async (req, res) => {
  try {
    const { items, paymentMethod, note, taxRate } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ message: "Cart is empty" });

    // Validate stock availability before processing
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, createdBy: req.user._id });
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });
      if (product.qty < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for "${product.name}". Available: ${product.qty}` });
    }

    // All OK → deduct stock and log movements
    const invoiceItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      const qtyBefore = product.qty;

      product.qty -= item.quantity;
      product.sold7d += item.quantity;
      product.sold30d += item.quantity;
      await product.save();

      await Movement.create({
        productId: product._id, productName: product.name, productSku: product.sku,
        type: "sale", quantity: item.quantity, qtyBefore, qtyAfter: product.qty,
        note: `Invoice sale`, createdBy: req.user._id, createdByName: req.user.name,
      });

      invoiceItems.push({
        productId: product._id, name: product.name, sku: product.sku,
        costPrice: product.costPrice, sellingPrice: product.sellingPrice,
        quantity: item.quantity, subtotal: product.sellingPrice * item.quantity,
      });
    }

    const subtotal = invoiceItems.reduce((s, i) => s + i.subtotal, 0);
    const taxAmt = subtotal * ((taxRate || req.user.taxRate || 0) / 100);
    const total = subtotal + taxAmt;
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber, items: invoiceItems, subtotal, taxRate: taxRate || 0,
      taxAmount: taxAmt, total, paymentMethod: paymentMethod || "cash",
      status: "paid", note: note || "", createdBy: req.user._id,
      createdByName: req.user.name,
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = { createdBy: req.user._id };
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Invoice.countDocuments(query);
    res.json({ invoices, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const refundInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "paid")
      return res.status(400).json({ message: "Only paid invoices can be refunded" });

    // Restore stock
    for (const item of invoice.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const qtyBefore = product.qty;
        product.qty += item.quantity;
        product.sold7d = Math.max(0, product.sold7d - item.quantity);
        product.sold30d = Math.max(0, product.sold30d - item.quantity);
        await product.save();

        await Movement.create({
          productId: product._id, productName: product.name, productSku: product.sku,
          type: "refund", quantity: item.quantity, qtyBefore, qtyAfter: product.qty,
          note: `Refund for invoice ${invoice.invoiceNumber}`,
          invoiceId: invoice._id, createdBy: req.user._id, createdByName: req.user.name,
        });
      }
    }

    invoice.status = "refunded";
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { checkout, getInvoices, getInvoice, refundInvoice };
