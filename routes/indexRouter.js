import express from "express";
import { authenticateToken } from "../middleware/authenticate.js";

import {
  getAllPosts,
  getPostById,
  createComment,
  publishPost,
  updatePost,
  updateComment,
  createPost,
  signUp,
  login,
  deletePost,
  deleteComment,
} from "../controllers/mainController.js";

const router = express.Router();

// --- Post Routes ---
router.get("/posts", getAllPosts);
router.get("/posts/:id", getPostById);
router.post("/new-post", authenticateToken, createPost);
router.put("/posts/:id", authenticateToken, updatePost);
router.patch("/posts/:id/publish", authenticateToken, publishPost);
router.delete("/posts/:id", authenticateToken, deletePost);

// --- Comment Routes ---
router.post("/posts/:id/new-comment", authenticateToken, createComment); // Added missing middleware here!
router.patch("/comments/:id", authenticateToken, updateComment);
router.delete("/comments/:id", authenticateToken, deleteComment);

// --- Auth Routes ---
router.post("/sign-up", signUp);
router.post("/login", login);

export default router;
