const express = require("express");
const app = express();
const fs = require("fs");
const mongoose = require("mongoose");
const PORT = 8000;

mongoose
  .connect("mongodb://localhost:27017/splitstack")
  .then(() => console.log("Connected to MongoDb"))
  .catch((err) => console.log("Error while connecting to MongoDb", err));

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paidBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Expense = mongoose.model("Expense", expenseSchema);

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

app.get("/api/expenses", async (req, res) => {
  const expenses = await Expense.find({});
  res.setHeader("X-Total-Expenses", expenses.length);
  return res.json(expenses);
});

app
  .route("/api/expenses/:id")
  .get(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    return res.status(200).json(expense);
  })
  .delete(async (req, res) => {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    return res.status(200).json({
      message: "Successfully deleted the expense",
    });
  })
  .patch(async (req, res) => {
    const modifyExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!modifyExpense)
      return res.status(404).json({ message: "Expense cannot be updated" });
    return res.status(200).json(modifyExpense);
  })
  .put(async (req, res) => {
    const body = req.body;
    if (
      body.description === undefined ||
      body.amount === undefined ||
      body.paidBy === undefined
    ) {
      return res.status(400).json({
        message: "PUT requires description, amount and paidBy",
      });
    }
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        description: body.description,
        amount: body.amount,
        paidBy: body.paidBy,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!expense) return res.status(404).json({ message: "Expense not found" });
    return res.status(200).json(expense);
  });

app.post("/api/expenses", async (req, res) => {
  try {
    const newExpense = await Expense.create(req.body);
    return res.status(201).json(newExpense);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started at PORT ${PORT}`);
});
