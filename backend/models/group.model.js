const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                role: {
                    type: String,
                    enum: ["admin", "member"],
                    default: "member",
                }
            }
        ]
    }, {timestamps: true}
)

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;