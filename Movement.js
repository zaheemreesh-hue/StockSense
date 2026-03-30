const mongoose = require("mongoose");

const movementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productSku: { type: String, required: true },
    type: {
      type: String,
      enum: ["sale", "restock", "adjustment", "damaged", "refund", "delete"],
      required: true,
    },
    quantity: { type: Number, required: true },
    qtyBefore: { type: Number, required: true },
    qtyAfter: { type: Number, required: true },
    note: { type: String, default: "" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, default: "System" },
  },
  { timestamps: true }
);

movementSchema.index({ productId: 1 });
movementSchema.index({ type: 1 });
movementSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Movement", movementSchema);
