import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";

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
    retur;
  }
  const { username, password, role } = userFromDb;
  const isPasswordValid = await bcrypt.compare(req.body.password, password);
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
