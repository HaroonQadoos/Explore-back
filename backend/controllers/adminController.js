const mongoose = require("mongoose");
const User = require("../models/UserModel");
const transporter = require("../config/nodemailer");

// GET /admin/pending-users
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select(
      "-password"
    );

    res.status(200).json(pendingUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /admin/approve/:id
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status === "approved") {
      return res.status(400).json({ message: "User is already approved" });
    }
    user.status = "approved";
    await user.save();
    await transporter.sendMail({
      from: `"H Blog" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Signup Approved ",
      text: `Hello ${user.username},

Congratulations! Your signup request has been approved.
You can now log in and start using H Blog.

Regards,
H Blog Team`,
    });

    res.status(200).json({
      message: "User approved successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Approve user error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /admin/reject/:id
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If user is already approved, move back to pending
    if (user.status === "approved") {
      user.status = "pending";
    } else {
      user.status = "rejected"; // for pending users
    }

    await user.save();
    await transporter.sendMail({
      from: `"H Blog" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Signup Rejected ",
      text: `Hello ${user.username},

Congratulations! Your signup request has been rejected.
You can try agian after some time keep using H Blog.

Regards,
H Blog Team`,
    });

    res.status(200).json({
      message: `User status updated to ${user.status} successfully`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getActiveUsers = async (req, res) => {
  try {
    const activeUsers = await User.find({ status: "approved" }).select(
      "-password"
    );
    res.status(200).json(activeUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  getActiveUsers,
};
