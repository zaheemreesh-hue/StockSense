const express = require("express");
const router = express.Router();
const {
  getProducts, createProduct, updateProduct, deleteProduct,
  recordSale, recordRestock, getMovements,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/", getProducts);
router.post("/", requireRole("admin"), createProduct);
router.put("/:id", requireRole("admin"), updateProduct);
router.delete("/:id", requireRole("admin"), deleteProduct);
router.post("/:id/sale", recordSale);
router.post("/:id/restock", recordRestock);
router.get("/movements/all", getMovements);

module.exports = router;
