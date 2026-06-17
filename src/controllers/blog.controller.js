const blogService = require("../services/blog.service");
const asyncHandler = require("../middlewares/asyncHandler");

// ─── Public ──────────────────────────────────────────────────────────────────

const getPublicFeed = asyncHandler(async (req, res) => {
  const result = await blogService.getPublicFeed(req.query);
  res.status(200).json({ status: "success", data: result });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const result = await blogService.getBlogBySlug(req.params.slug);
  res.status(200).json({ status: "success", data: result });
});

// ─── Authenticated Author ─────────────────────────────────────────────────────

const getMyBlogs = asyncHandler(async (req, res) => {
  const blogs = await blogService.getMyBlogs(req.user._id);
  res.status(200).json({ status: "success", results: blogs.length, data: { blogs } });
});

const getBlogById = asyncHandler(async (req, res) => {
  const blog = await blogService.getBlogById(req.params.id, req.user);
  res.status(200).json({ status: "success", data: { blog } });
});

const createBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.createBlog(req.body, req.user, req.file);
  res.status(201).json({ status: "success", message: "Blog created.", data: { blog } });
});

const updateBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.updateBlog(req.params.id, req.body, req.user, req.file);
  res.status(200).json({ status: "success", message: "Blog updated.", data: { blog } });
});

const submitBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.submitBlog(req.params.id, req.user);
  res.status(200).json({ status: "success", message: "Blog submitted for review.", data: { blog } });
});

const deleteBlog = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.id, req.user);
  res.status(200).json({ status: "success", message: "Blog deleted." });
});

// ─── Admin Moderation ─────────────────────────────────────────────────────────

const getModerationQueue = asyncHandler(async (req, res) => {
  const blogs = await blogService.getModerationQueue();
  res.status(200).json({ status: "success", results: blogs.length, data: { blogs } });
});

const getAllBlogs = asyncHandler(async (req, res) => {
  const blogs = await blogService.getAllBlogs(req.query);
  res.status(200).json({ status: "success", data: { blogs } });
});

const approveBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.approveBlog(req.params.id);
  res.status(200).json({ status: "success", message: "Blog approved and published.", data: { blog } });
});

const rejectBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.rejectBlog(req.params.id, req.body.moderationNote);
  res.status(200).json({ status: "success", message: "Blog rejected.", data: { blog } });
});

// ─── Categories ───────────────────────────────────────────────────────────────

const getCategories = asyncHandler(async (req, res) => {
  const categories = await blogService.getCategories();
  res.status(200).json({ status: "success", data: { categories } });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await blogService.createCategory(req.body);
  res.status(201).json({ status: "success", data: { category } });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await blogService.updateCategory(req.params.id, req.body);
  res.status(200).json({ status: "success", data: { category } });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await blogService.deleteCategory(req.params.id);
  res.status(200).json({ status: "success", message: "Category deleted." });
});

// ─── Templates ────────────────────────────────────────────────────────────────

const getTemplates = asyncHandler(async (req, res) => {
  const templates = await blogService.getTemplates();
  res.status(200).json({ status: "success", data: { templates } });
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await blogService.createTemplate(req.body, req.user);
  res.status(201).json({ status: "success", data: { template } });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await blogService.updateTemplate(req.params.id, req.body);
  res.status(200).json({ status: "success", data: { template } });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  await blogService.deleteTemplate(req.params.id);
  res.status(200).json({ status: "success", message: "Template deleted." });
});

module.exports = {
  getPublicFeed, getBlogBySlug,
  getMyBlogs, getBlogById, createBlog, updateBlog, submitBlog, deleteBlog,
  getModerationQueue, getAllBlogs, approveBlog, rejectBlog,
  getCategories, createCategory, updateCategory, deleteCategory,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
};
