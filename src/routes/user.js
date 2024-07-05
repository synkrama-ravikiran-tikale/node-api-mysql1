const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { body, validationResult } = require("express-validator");

router.post(
  "/",
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

    try {
      // Create user using Prisma
      const user = await prisma.user.create({
        data: { email, password, name },
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

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password, name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { email, password, name },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Error updating user" });
  }
});

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
