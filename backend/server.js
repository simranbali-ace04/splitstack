const express = require("express");
const app = express();
const fs = require("fs");
const PORT = 8000;
const connectDB = require("./config/db");
const Expense = require("./models/expense.model");
const expenseRoutes = require("./routes/expense.routes");

connectDB("mongodb://localhost:27017/splitstack")
  .then(() => console.log("Connected to MongoDb"))
  .catch((err) => console.log("Error while connecting to MongoDb", err));


app.use((req, res, next) => {
  const log = `${new Date().toISOString()} ${req.method} ${req.url}\n`;
  fs.appendFile("log.txt", log, (err) => {
    if (err) {
      console.log("Error while logging");
    }
    next();
  });
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/api/expenses", expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server started at PORT ${PORT}`);
});
