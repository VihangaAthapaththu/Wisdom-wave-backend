const BlogRepository = require("../repositories/blog.repository");
const BlogCategoryRepository = require("../repositories/blogCategory.repository");
const BlogTemplateRepository = require("../repositories/blogTemplate.repository");
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const sanitizeHtml = require("sanitize-html");
const BLOG_STATUS = require("../enums/blogStatus");

const blogRepo = new BlogRepository();
const categoryRepo = new BlogCategoryRepository();
const templateRepo = new BlogTemplateRepository();

const SANITIZE_OPTIONS = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img", "h1", "h2", "h3", "h4", "pre", "code", "blockquote",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    "*": ["class"],
  },
};

class BlogService {
  _sanitize(html) {
    return sanitizeHtml(html, SANITIZE_OPTIONS);
  }

  _generateSlug(title) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return `${base}-${Date.now()}`;
  }

  async _uploadFeaturedImage(file) {
    if (!file || !file.buffer) throw new AppError("Invalid image file.", 400);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new AppError("Cloudinary is not configured.", 500);
    }

    const timestamp = Date.now();
    const nameNoExt = (file.originalname || "image").replace(/\.[^/.]+$/, "");
    const safeName = nameNoExt.replace(/[^a-zA-Z0-9._-]/g, "_");
    const publicId = `blog_featured_images/${timestamp}-${safeName}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image", public_id: publicId },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // ─── Public Feed ─────────────────────────────────────────────────────────────

  async getPublicFeed({ page = 1, limit = 12, category, search } = {}) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const [blogs, total] = await Promise.all([
      blogRepo.findPublished({ page: pageNum, limit: limitNum, category, search }),
      blogRepo.countPublished({ category, search }),
    ]);
    return { blogs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
  }

  async getBlogBySlug(slug) {
    const blog = await blogRepo.findBySlug(slug);
    if (!blog) throw new AppError("Blog not found.", 404);

    await blogRepo.incrementViewCount(blog._id);
    blog.viewCount = (blog.viewCount || 0) + 1;

    const relatedBlogs = blog.category
      ? await blogRepo.findRelated(blog._id, blog.category._id, 3)
      : [];

    return { blog, relatedBlogs };
  }

  // ─── Author Access ────────────────────────────────────────────────────────────

  async getBlogById(id, user) {
    const blog = await blogRepo.findById(id);
    if (!blog) throw new AppError("Blog not found.", 404);

    const isOwner = blog.author._id.toString() === user._id.toString();
    if (!isOwner && user.role !== "ADMIN") {
      throw new AppError("You do not have access to this blog.", 403);
    }

    return blog;
  }

  async getMyBlogs(userId) {
    return await blogRepo.findByAuthor(userId);
  }

  async createBlog(body, user, file) {
    const { title, contentHtml, excerpt, category, templateId } = body;

    if (!title || !title.trim()) throw new AppError("Title is required.", 400);
    if (!contentHtml || !contentHtml.trim()) throw new AppError("Content is required.", 400);

    const sanitized = this._sanitize(contentHtml);

    let featuredImageUrl = null;
    let featuredImagePublicId = null;

    if (file) {
      const result = await this._uploadFeaturedImage(file);
      featuredImageUrl = result.secure_url;
      featuredImagePublicId = result.public_id;
    }

    return await blogRepo.create({
      title: title.trim(),
      contentHtml: sanitized,
      excerpt: excerpt ? excerpt.trim() : null,
      category: category || null,
      template: templateId || null,
      featuredImageUrl,
      featuredImagePublicId,
      author: user._id,
      status: BLOG_STATUS.DRAFT,
    });
  }

  async updateBlog(id, body, user, file) {
    const blog = await blogRepo.findById(id);
    if (!blog) throw new AppError("Blog not found.", 404);

    const isOwner = blog.author._id.toString() === user._id.toString();
    if (!isOwner && user.role !== "ADMIN") {
      throw new AppError("You do not have permission to edit this blog.", 403);
    }

    if (
      user.role !== "ADMIN" &&
      blog.status === BLOG_STATUS.PENDING
    ) {
      throw new AppError("Cannot edit a blog that is pending review. Withdraw it first.", 400);
    }

    const { title, contentHtml, excerpt, category } = body;
    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (contentHtml !== undefined) updates.contentHtml = this._sanitize(contentHtml);
    if (excerpt !== undefined) updates.excerpt = excerpt ? excerpt.trim() : null;
    if (category !== undefined) updates.category = category || null;

    if (file) {
      const result = await this._uploadFeaturedImage(file);
      updates.featuredImageUrl = result.secure_url;
      updates.featuredImagePublicId = result.public_id;
    }

    // Editing a REJECTED blog resets it to DRAFT
    if (blog.status === BLOG_STATUS.REJECTED && user.role !== "ADMIN") {
      updates.status = BLOG_STATUS.DRAFT;
      updates.moderationNote = null;
    }

    return await blogRepo.update(id, updates);
  }

  async submitBlog(id, user) {
    const blog = await blogRepo.findById(id);
    if (!blog) throw new AppError("Blog not found.", 404);

    const isOwner = blog.author._id.toString() === user._id.toString();
    if (!isOwner) throw new AppError("You do not own this blog.", 403);

    if (blog.status !== BLOG_STATUS.DRAFT && blog.status !== BLOG_STATUS.REJECTED) {
      throw new AppError(`Cannot submit a blog with status "${blog.status}".`, 400);
    }

    return await blogRepo.update(id, { status: BLOG_STATUS.PENDING, moderationNote: null });
  }

  async deleteBlog(id, user) {
    const blog = await blogRepo.findById(id);
    if (!blog) throw new AppError("Blog not found.", 404);

    const isOwner = blog.author._id.toString() === user._id.toString();
    const canDelete =
      user.role === "ADMIN" ||
      (isOwner && (blog.status === BLOG_STATUS.DRAFT || blog.status === BLOG_STATUS.REJECTED));

    if (!canDelete) {
      throw new AppError("You cannot delete this blog.", 403);
    }

    await blogRepo.delete(id);
  }

  // ─── Admin Moderation ─────────────────────────────────────────────────────────

  async getModerationQueue() {
    return await blogRepo.findPending();
  }

  async getAllBlogs({ page, limit } = {}) {
    return await blogRepo.findAll({ page, limit });
  }

  async approveBlog(id) {
    const blog = await blogRepo.findById(id);
    if (!blog) throw new AppError("Blog not found.", 404);

    if (blog.status !== BLOG_STATUS.PENDING) {
      throw new AppError(`Cannot approve a blog with status "${blog.status}".`, 400);
    }

    const slug = this._generateSlug(blog.title);
    return await blogRepo.update(id, {
      status: BLOG_STATUS.PUBLISHED,
      publishedAt: new Date(),
      slug,
      moderationNote: null,
    });
  }

  async rejectBlog(id, moderationNote) {
    const blog = await blogRepo.findById(id);
    if (!blog) throw new AppError("Blog not found.", 404);

    if (blog.status !== BLOG_STATUS.PENDING) {
      throw new AppError(`Cannot reject a blog with status "${blog.status}".`, 400);
    }

    if (!moderationNote || !moderationNote.trim()) {
      throw new AppError("A rejection note is required.", 400);
    }

    return await blogRepo.update(id, {
      status: BLOG_STATUS.REJECTED,
      moderationNote: moderationNote.trim(),
    });
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  async getCategories() {
    return await categoryRepo.findAll();
  }

  async createCategory(data) {
    const { name, description } = data;
    if (!name || !name.trim()) throw new AppError("Category name is required.", 400);

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    return await categoryRepo.create({ name: name.trim(), slug, description });
  }

  async updateCategory(id, data) {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new AppError("Category not found.", 404);
    return await categoryRepo.update(id, data);
  }

  async deleteCategory(id) {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new AppError("Category not found.", 404);
    await categoryRepo.delete(id);
  }

  // ─── Templates ────────────────────────────────────────────────────────────────

  async getTemplates() {
    return await templateRepo.findAll();
  }

  async createTemplate(data, user) {
    const { title, description, contentHtml, category } = data;
    if (!title || !title.trim()) throw new AppError("Template title is required.", 400);
    if (!contentHtml || !contentHtml.trim()) throw new AppError("Template content is required.", 400);

    return await templateRepo.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      contentHtml,
      category: category || null,
      createdBy: user._id,
    });
  }

  async updateTemplate(id, data) {
    const existing = await templateRepo.findById(id);
    if (!existing) throw new AppError("Template not found.", 404);
    return await templateRepo.update(id, data);
  }

  async deleteTemplate(id) {
    const existing = await templateRepo.findById(id);
    if (!existing) throw new AppError("Template not found.", 404);
    await templateRepo.delete(id);
  }
}

module.exports = new BlogService();
