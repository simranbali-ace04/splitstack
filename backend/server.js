const express = require("express");
const app = express();
const fs = require("fs");
const PORT = 8000;

const expenses = [
  {
    id: 1,
    description: "Hotel",
    amount: 8000,
    paidBy: "Simran",
  },
  {
    id: 2,
    description: "Food",
    amount: 3000,
    paidBy: "Riya",
  },
  {
    id: 3,
    description: "Cabs",
    amount: 2000,
    paidBy: "Kunal",
  },
];
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

app.get("/api/expenses", (req, res) => {
  res.setHeader("X-Total-Expenses", expenses.length);
  return res.json(expenses);
});

app
  .route("/api/expenses/:id")
  .get((req, res) => {
    const id = Number(req.params.id);
    const expense = expenses.find((expense) => expense.id == id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    return res.status(200).json(expense);
  })
  .delete((req, res) => {
    const id = Number(req.params.id);
    const index = expenses.findIndex((expense) => expense.id == id);
    expenses.splice(index, 1);
    return res.status(204).json({ message: "Succesfully deleted the expense" });
  });

app.post("/api/expenses", (req, res) => {
  const body = req.body;
  if (!body || !body.description || !body.amount || !body.paidBy) {
    return res.status(400).json({ msg: "All the fields are required" });
  }
  const ids = expenses.map((expense) => expense.id);
  const highestId = ids.length > 0 ? Math.max(...ids) : 0;
  const newExpense = {
    id: highestId + 1,
    description: body.description,
    amount: body.amount,
    paidBy: body.paidBy,
  };
  expenses.push(newExpense);
  return res.status(201).json(newExpense);
});

app.listen(PORT, () => {
  console.log(`Server started at PORT ${PORT}`);
});
