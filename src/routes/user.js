const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const path = require("path");

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination directory for uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, "")}`;
    cb(null, uniqueName); // Save files with a unique nam
  },
});

const upload = multer({ storage: storage });

// Create a user
router.post(
  "/",
  upload.single("photo"), // Middleware for handling single file upload with the name 'photo'
  body("email").isEmail().withMessage("Must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("name").notEmpty().withMessage("Name is required"),

  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Destructure validated data from request body
    const { email, password, name } = req.body;

    // Get the photo file path
    const photo = req.file
      ? `${req.file.destination + req.file.filename}`
      : null;

    try {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user using Prisma
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, photo },
      });

      // Respond with created user
      res.status(201).json(user);
    } catch (error) {
      // Handle Prisma or other server errors
      res.status(400).json({ error: error.message });
    }
  }
);

// Get All Users
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const skip = (page - 1) * pageSize;

  try {
    const totalUsers = await prisma.user.count();
    const users = await prisma.user.findMany({
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalUsers / pageSize);

    // Calculate next and previous page links
    let nextPage = null;
    let prevPage = null;
    if (page < totalPages) {
      nextPage = `/users?page=${page + 1}&pageSize=${pageSize}`;
    }
    if (page > 1) {
      prevPage = `/users?page=${page - 1}&pageSize=${pageSize}`;
    }
    users.forEach((user) => {
      if (user.photo) {
        user.photo = `${process.env.CURRENT_URL}${user.photo}`;
      }
    });
    res.json({
      count: totalUsers,
      totalPages,
      currentPage: page,
      nextPage,
      prevPage,
      users,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get User by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (user) {
      user.photo = `${process.env.port}/${user.photo}`;
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update User
router.put(
  "/:id",
  upload.single("photo"), // Middleware for handling single file upload with the name 'photo'
  async (req, res) => {
    const { id } = req.params;
    const { email, password, name } = req.body;

    const photo = req.file
      ? `${req.file.destination + req.file.filename}`
      : null;

    try {
      // Hash the password before updating it
      let updateData = { email, name };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      if (photo) {
        updateData.photo = photo;
      }

      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Error updating user" });
    }
  }
);

// Delete User
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
