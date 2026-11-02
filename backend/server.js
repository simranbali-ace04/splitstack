require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const app = express();
const fs = require("fs");
const PORT = process.env.PORT || 8000;
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const Expense = require("./models/expense.model");
const expenseRoutes = require("./routes/expense.routes");
const authRoutes = require("./routes/auth.routes");
const groupRoutes = require("./routes/group.routes");
const {logResReq} = require("./middlewares/expense.middleware");
const { verifyToken } = require("./middlewares/auth.middleware");

connectDB(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDb"))
  .catch((err) => console.log("Error while connecting to MongoDb", err));


app.use(logResReq("log.txt"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes );
app.use("/api/groups", verifyToken, groupRoutes);
app.use("/api/expenses", verifyToken, expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server started at PORT ${PORT}`);
});
