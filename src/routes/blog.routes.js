const express = require("express");
const router = express.Router();
const multer = require("multer");

const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  validateBlogCreate,
  validateBlogUpdate,
  validateCategory,
  validateTemplate,
} = require("../validators/blog.validators");
const {
  getPublicFeed, getBlogBySlug,
  getMyBlogs, getBlogById, createBlog, updateBlog, submitBlog, deleteBlog,
  getModerationQueue, getAllBlogs, approveBlog, rejectBlog,
  getCategories, createCategory, updateCategory, deleteCategory,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
} = require("../controllers/blog.controller");

const upload = multer({ storage: multer.memoryStorage() });

// ── Public (no auth) ─────────────────────────────────────────────────────────
router.get("/categories", getCategories);
router.get("/", getPublicFeed);

// ── Named static routes BEFORE /:id / /:slug ────────────────────────────────
router.get("/me", protect, authorize("STUDENT", "LECTURER", "ADMIN"), getMyBlogs);
router.get("/admin/pending", protect, authorize("ADMIN"), getModerationQueue);
router.get("/admin/all", protect, authorize("ADMIN"), getAllBlogs);
router.get("/templates", protect, authorize("ADMIN"), getTemplates);

// ── Category CRUD (admin) ────────────────────────────────────────────────────
router.post("/categories", protect, authorize("ADMIN"), validateCategory, createCategory);
router.put("/categories/:id", protect, authorize("ADMIN"), updateCategory);
router.delete("/categories/:id", protect, authorize("ADMIN"), deleteCategory);

// ── Template CRUD (admin) ────────────────────────────────────────────────────
router.post("/templates", protect, authorize("ADMIN"), validateTemplate, createTemplate);
router.put("/templates/:id", protect, authorize("ADMIN"), updateTemplate);
router.delete("/templates/:id", protect, authorize("ADMIN"), deleteTemplate);

// ── Blog CRUD ────────────────────────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("STUDENT", "LECTURER", "ADMIN"),
  upload.single("featuredImage"),
  validateBlogCreate,
  createBlog
);

// /:id/edit must come before /:slug
router.get("/:id/edit", protect, getBlogById);

router.put(
  "/:id",
  protect,
  authorize("STUDENT", "LECTURER", "ADMIN"),
  upload.single("featuredImage"),
  validateBlogUpdate,
  updateBlog
);

router.patch("/:id/submit", protect, authorize("STUDENT", "LECTURER", "ADMIN"), submitBlog);
router.patch("/:id/approve", protect, authorize("ADMIN"), approveBlog);
router.patch("/:id/reject", protect, authorize("ADMIN"), rejectBlog);
router.delete("/:id", protect, authorize("STUDENT", "LECTURER", "ADMIN"), deleteBlog);

// ── Public blog detail — MUST be last ────────────────────────────────────────
router.get("/:slug", getBlogBySlug);

module.exports = router;
