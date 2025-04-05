const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../db");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middlewares/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = "uploads/images/posts";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/post",authMiddleware,upload.array("img_url"),async (req, res) => {
    const client = await pool.connect();
    try {
      const { title, content, field_id } = req.body;
      const user_id = req.user.user_id; // Get the authenticated user's ID

      // Check if the user is an admin or the owner of the field
      const fieldOwner = await pool.query(
        `SELECT user_id FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldOwner.rows.length === 0) {
        return res.status(404).json({ message: "Field not found" });
      }

      const field_user_id = fieldOwner.rows[0].user_id;

      // Check if the user is an admin or if the user owns the field
      if (req.user.role !== "admin" && field_user_id !== user_id) {
        return res
          .status(403)
          .json({ message: "You do not have permission to post" });
      }

      await client.query("BEGIN");

      const newPost = await client.query(
        `INSERT INTO posts (title, content, field_id) VALUES ($1, $2, $3) RETURNING post_id`, // Include user_id
        [title, content, field_id]
      );

      const postId = newPost.rows[0].post_id;

      if (req.files && req.files.length > 0) {
        for (const image of req.files) {
          await client.query(
            `INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`,
            [postId, image.path]
          );
        }
      }

      await client.query("COMMIT");
      res.status(201).json({ message: "Post created successfully", postId });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      client.release();
    }
  }
);

router.get("/:field_id", async (req, res) => {
  try {
    const { field_id } = req.params;

    const result = await pool.query(
      `SELECT 
            p.post_id,
            p.field_id,
            p.title,
            p.content,
            p.created_at,
            pi.image_url
        FROM posts p
        LEFT JOIN post_images pi ON p.post_id = pi.post_id
        WHERE p.field_id = $1;`,
      [field_id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "ไม่มีโพส" });
    }

    return res.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสนามกีฬา" });
  }
});

module.exports = router;
