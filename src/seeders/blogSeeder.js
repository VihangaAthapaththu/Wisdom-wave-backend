const BlogCategory = require("../models/BlogCategory.model");
const BlogTemplate = require("../models/BlogTemplate.model");
const User = require("../models/User.model");

const CATEGORIES = [
  { name: "Tutorial", slug: "tutorial", description: "Step-by-step learning guides" },
  { name: "Best Practices", slug: "best-practices", description: "Professional tips and patterns" },
  { name: "Technology", slug: "technology", description: "Industry trends and news" },
  { name: "Career", slug: "career", description: "Career growth and advice" },
  { name: "Project Showcase", slug: "project-showcase", description: "Student project highlights" },
];

const seedBlogData = async () => {
  try {
    const existingCount = await BlogCategory.countDocuments();
    if (existingCount > 0) {
      console.log("✅ Blog categories already seeded. Skipping.");
      return;
    }

    const categories = await BlogCategory.insertMany(CATEGORIES);
    console.log(`✅ Seeded ${categories.length} blog categories.`);

    const tutorialCategory = categories.find((c) => c.slug === "tutorial");
    const admin = await User.findOne({ role: "ADMIN" });

    if (admin && tutorialCategory) {
      await BlogTemplate.create({
        title: "Tutorial Template",
        description: "A structured template for step-by-step tutorials",
        contentHtml: `<h2>Introduction</h2><p>Start with a brief overview of what readers will learn.</p><h2>Prerequisites</h2><ul><li>Requirement 1</li><li>Requirement 2</li></ul><h2>Step-by-Step Guide</h2><h3>Step 1</h3><p>Describe the first step here.</p><h3>Step 2</h3><p>Describe the second step here.</p><h2>Conclusion</h2><p>Summarize what was covered and suggest next steps.</p>`,
        category: tutorialCategory._id,
        createdBy: admin._id,
      });

      await BlogTemplate.create({
        title: "Project Showcase Template",
        description: "Share what you built and what you learned",
        contentHtml: `<h2>What I Built</h2><p>Describe your project here.</p><h2>Why I Built It</h2><p>Explain the motivation behind this project.</p><h2>How It Works</h2><p>Walk through the key technical decisions and architecture.</p><h2>Key Learnings</h2><ul><li>Learning 1</li><li>Learning 2</li></ul><h2>What's Next</h2><p>Share future plans for this project.</p>`,
        category: categories.find((c) => c.slug === "project-showcase")?._id || null,
        createdBy: admin._id,
      });

      console.log("✅ Seeded 2 blog templates.");
    } else {
      console.log("⚠️  No admin user found — templates not seeded.");
    }
  } catch (error) {
    console.error("❌ Failed to seed blog data:", error.message);
  }
};

module.exports = { seedBlogData };
