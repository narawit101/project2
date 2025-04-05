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
    }
});

const upload = multer({ storage: storage });

router.post("/post", authMiddleware, upload.array("img_url"), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
  
      const { title, content, field_id } = req.body; 
      const newPost = await client.query(
        `INSERT INTO posts (title, content, field_id) VALUES ($1, $2, $3) RETURNING post_id`,  // Include field_id in the query
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
  });

  router.get("/:field_id",authMiddleware, async (req, res) => {
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
        WHERE p.field_id = $1;`,  // Filter by field_id
        [field_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
      }
  
      return res.json(result.rows);  // Return the joined data
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสนามกีฬา" });
    }
  });
  
  

module.exports = router;