const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    splitAmong: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        share: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    splitType: {
      type: String,
      enum: ["equal", "unequal"],
      default: "equal",
    },
  },
  { timestamps: true },
);

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
