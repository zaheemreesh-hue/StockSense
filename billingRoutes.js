// billingRoutes.js
const express = require("express");
const router = express.Router();
const { checkout, getInvoices, getInvoice, refundInvoice } = require("../controllers/billingController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.post("/checkout", checkout);
router.get("/invoices", getInvoices);
router.get("/invoices/:id", getInvoice);
router.post("/invoices/:id/refund", refundInvoice);

module.exports = router;
