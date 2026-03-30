const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    supplier: { type: String, default: "", trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 0, default: 0 },
    threshold: { type: Number, default: 10, min: 0 },
    sold7d: { type: Number, default: 0, min: 0 },
    sold30d: { type: Number, default: 0, min: 0 },
    lastRestockedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1, createdBy: 1 }, { unique: true });
productSchema.index({ name: "text", sku: "text", supplier: "text" });

module.exports = mongoose.model("Product", productSchema);
