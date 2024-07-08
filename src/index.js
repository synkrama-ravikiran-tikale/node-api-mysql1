const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const userRoutes = require("./routes/user");
app.use("/users", userRoutes);
console.log(path.join(__dirname, "..", "uploads"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.get("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Swagger running on http://localhost:${PORT}/api-docs/`);
});
