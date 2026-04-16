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
      include: {
        author: {
          select: { username: true },
        },
        comments: {
          include: {
            author: {
              select: { username: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts/:id/new-comment", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const isOwner = post.authorId === req.userData.userId;
    const isAdmin = req.userData.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to publish this post." });
    }
    const newComment = await prisma.comment.create({
      data: {
        text: req.body.text,
        postId: postId,
        authorId: req.userData.userId,
      },
    });
    res.json(newComment);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//TODO add the futer to get the time for the publish and the created time
router.patch("/posts/:id/publish", authenticateToken, async (req, res) => {
  try {
    const targetPostId = parseInt(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: targetPostId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const isOwner = post.authorId === req.userData.userId;
    const isAdmin = req.userData.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to publish this post." });
    }
    const newPublishStatus = !post.published;
    const updatedPost = await prisma.post.update({
      where: { id: targetPostId },
      data: {
        published: newPublishStatus,
      },
    });
    res.json({
      message: newPublishStatus
        ? "Post is now LIVE!"
        : "Post is now HIDDEN (Unpublished).",
      published: updatedPost.published,
    });
  } catch (error) {
    console.error("Error toggling publish status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/posts/:id", authenticateToken, async (req, res) => {
  const targetPostId = parseInt(req.params.id);
  try {
    const post = await prisma.post.findUnique({
      where: { id: targetPostId },
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const isOwner = post.authorId === req.userData.userId;
    const isAdmin = req.userData.isAdmin;
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to updat this post." });
    }
    const updatedPost = await prisma.post.update({
      where: { id: targetPostId },
      data: {
        title: req.body.title || post.title,
        content: req.body.content || post.content,
      },
    });
    res.json({ updatedPost });
  } catch (error) {
    console.error("Error updating the post", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//TODO updating the comments
router.post("/new-post", authenticateToken, async (req, res) => {
  try {
    const newPost = await prisma.post.create({
      data: {
        title: req.body.title,
        content: req.body.content,
        authorId: req.userData.userId,
      },
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Failed to create post:", error);
    res.status(500).json({ error: "Could not create post" });
  }
});

//auth
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

//TODO delet comment and also delet post

router.delete("/post/:id", authenticateToken, async (req, res) => {
  const targetPostId = parseInt(req.params.id);
  try {
    const post = await prisma.post.findUnique({
      where: { id: targetPostId },
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const isOwner = post.authorId === req.userData.userId;
    const isAdmin = req.userData.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this post." });
    }
    await prisma.post.delete({
      where: { id: targetPostId },
    });
    res.json({ message: "Post successfully deleted." });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/comments/:id", authenticateToken, async (req, res) => {
  const targetCommentId = parseInt(req.params.id);
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: targetCommentId },
    });
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    const isOwner = comment.authorId === req.userData.userId;
    const isAdmin = req.userData.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this comment." });
    }
    await prisma.comment.delete({
      where: { id: targetCommentId },
    });
    res.json({ message: "Comment successfully deleted." });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
