import jwt from "jsonwebtoken";
import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";
import { authenticateToken } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/posts", async (req, res) => {
  try {
    const allPosts = await prisma.post.findMany();
    res.json(allPosts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/posts/:id", async (req, res) => {
  try {
    const targetPostId = parseInt(req.params.id);
    const post = await prisma.post.findUnique({
      where: {
        username: targetPostId,
      },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts", authenticateToken, async (req, res) => {
  try {
    await prisma.post.create({
      data: {
        title: req.body.tile,
        content: req.body.content,
      },
    });
  } catch (error) {}
});

router.post("/sign-up", async (req, res) => {
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const isAdmin = req.body.adminPasscode === process.env.ADMIN_PASSCODE;
    await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
        role: isAdmin,
      },
    });
    res.status(201).json({
      message: "Registration successful! You can now log in.",
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).send("Username is already taken");
    }
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

router.post("/login", async (req, res) => {
  const userFromDb = await prisma.user.findUnique({
    where: {
      username: req.body.username, // Whatever username they typed into the login form
    },
  });

  if (!userFromDb) {
    return res.status(401).json({ error: "Wrong username or password" });
  }
  const { id, password, role } = userFromDb;
  const isPasswordValid = await bcrypt.compare(req.body.password, password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Wrong username or password" });
  }
  const token = jwt.sign(
    {
      userId: id,
      isAdmin: role, // The role you destructured
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }, // Token expires in 1 hour
  );

  // 2. Send it back to the client
  res.json({
    message: "Logged in successfully",
    token: token,
  });
});

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/new-message", (req, res, next) => {});

router.post("/new-message", async (req, res, next) => {
  try {
    await pool.query(
      "INSERT INTO messages (title, text, user_id) VALUES ($1, $2, $3)",
      [req.body.title, req.body.text, req.user.id],
    );
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

router.post("/join-club", async (req, res, next) => {
  try {
    console.log(req.body.passcode);
    if (req.body.passcode === process.env.CLUB_PASSCODE) {
      console.log("the condition is true");
      await pool.query(
        "UPDATE users SET membership_status = TRUE  WHERE id = $1",
        [req.user.id],
      );
      res.redirect("/");
    } else {
      //message that the pass is wrong
      res.redirect("/");
    }
  } catch (err) {
    return next(err);
  }
});

router.post("/delete-message/:id", async (req, res, next) => {
  const messsageId = req.params.id;
  if (!req.user || !req.user.admin) {
    return res.status(403).send("Unauthorized");
  }
  try {
    await pool.query("DELETE FROM messages WHERE id = $1", [messsageId]);
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});
export { router };
