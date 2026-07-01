const express = require("express");
const router = express.Router();

const { submitContact } = require("../controllers/contact.controller");
const { validateContact } = require("../validators/contact.validator");

// Public: anyone can send a contact message
router.post("/", validateContact, submitContact);

module.exports = router;
