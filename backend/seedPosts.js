const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");
const User = require("./models/UserModel.js");
const Post = require("./models/post");
require("dotenv").config();

// Connect DB
mongoose
  .connect(process.env.DB)
  .then(() => console.log("DB Connected for Seeding"))
  .catch((err) => console.error(err));

const seedPosts = async () => {
  try {
    await User.deleteMany();
    await Post.deleteMany();

    ////hashpassword
    const plainPassword = "123456";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    // Seed users
    const users = await User.insertMany(
      Array.from({ length: 5 }).map(() => ({
        username:
          faker.person.firstName().toLowerCase() +
          faker.person.lastName().toLowerCase(),

        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      }))
    );

    // Seed posts
    const posts = Array.from({ length: 50 }).map(() => ({
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(3),
      author: users[Math.floor(Math.random() * users.length)]._id,
      image: faker.image.url(),
    }));

    await Post.insertMany(posts);
    console.log(" Database seeded successfully");
    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedPosts();
