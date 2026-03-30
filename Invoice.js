const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  sku: String,
  costPrice: Number,
  sellingPrice: Number,
  quantity: Number,
  subtotal: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer", "other"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["paid", "refunded", "cancelled"],
      default: "paid",
    },
    note: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
