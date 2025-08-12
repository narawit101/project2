const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../db");
// const path = require("path");
// const fs = require("fs");
const authMiddleware = require("../middlewares/auth");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../server");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "uploads/images/posts";
    let resourceType = "auto";
    let format = undefined;

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
      format = undefined;
    } else {
      resourceType = "raw";
      format = file.mimetype.split("/")[1];
    }

    const config = {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (format) {
      config.format = format;
    }

    if (resourceType === "image") {
      config.transformation = [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ];
    }

    return config;
  },
});

const upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024,
  },
});

async function deleteCloudinaryFile(fileUrl) {
  if (!fileUrl) return;

  try {
    const urlParts = fileUrl.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) return;

    let pathStartIndex = uploadIndex + 1;
    if (urlParts[pathStartIndex].startsWith("v")) {
      pathStartIndex++;
    }

    const pathParts = urlParts.slice(pathStartIndex);
    const fullPath = pathParts.join("/");
    const isRaw = fileUrl.includes("/raw/");

    const resourceType = isRaw ? "raw" : "image";
    const lastDotIndex = fullPath.lastIndexOf(".");
    const publicId = isRaw ? fullPath : fullPath.substring(0, lastDotIndex); 

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("Deleted:", publicId, result);
  } catch (err) {
    console.error("Failed to delete Cloudinary file:", err);
  }
}

router.post(
  "/post",
  authMiddleware,
  upload.array("img_url"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { title, content, field_id } = req.body;
      const user_id = req.user.user_id;

      const fieldOwner = await pool.query(
        `SELECT user_id FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldOwner.rows.length === 0) {
        return res.status(404).json({ message: "Field not found" });
      }

      const field_user_id = fieldOwner.rows[0].user_id;

      if (req.user.role !== "admin" && field_user_id !== user_id) {
        return res
          .status(403)
          .json({ message: "You do not have permission to post" });
      }

      await client.query("BEGIN");

      const newPost = await client.query(
        `INSERT INTO posts (title, content, field_id) VALUES ($1, $2, $3) RETURNING post_id`, 
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
      const insertedPost = await client.query(
        `SELECT 
           p.post_id,
           p.field_id,
           p.title,
           p.content,
          (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::text AS created_at,
           COALESCE(
             json_agg(json_build_object('image_url', pi.image_url)) 
             FILTER (WHERE pi.image_url IS NOT NULL), '[]'
           ) AS images
         FROM posts p
         LEFT JOIN post_images pi ON p.post_id = pi.post_id
         WHERE p.post_id = $1
         GROUP BY p.post_id`,
        [postId]
      );

      await client.query("COMMIT");
      res.status(201).json({
        message: "Post created successfully",
        post: insertedPost.rows[0],
      });
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
         (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::text AS created_at,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url)
            ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
          ) AS images
        FROM posts p
        LEFT JOIN post_images pi ON p.post_id = pi.post_id
        WHERE p.field_id = $1
        GROUP BY p.post_id
        ORDER BY p.created_at DESC;`,
      [field_id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "ไม่มีโพส" });
    }

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโพส" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.post_id,
          p.field_id,
          p.title,
          p.content,
          f.field_name,
          f.img_field,
          (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::text AS created_at,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url)
            ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
          ) AS images
        FROM posts p
        LEFT JOIN field f ON p.field_id = f.field_id
        LEFT JOIN post_images pi ON p.post_id = pi.post_id
        GROUP BY p.post_id, f.field_name, f.img_field
        ORDER BY p.created_at DESC
        LIMIT 5;`
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "ไม่มีโพส" });
    }

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโพส" });
  }
});


router.patch(
  "/update/:post_id",
  authMiddleware,
  upload.array("img_url"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { post_id } = req.params;
      const { title, content } = req.body;
      const user_id = req.user.user_id;

      const result = await client.query(
        `SELECT p.*, f.user_id AS field_owner FROM posts p JOIN field f ON p.field_id = f.field_id WHERE p.post_id = $1`,
        [post_id]
      );
      const post = result.rows[0];

      if (!post) return res.status(404).json({ message: "Post not found" });
      if (req.user.role !== "admin" && post.field_owner !== user_id)
        return res.status(403).json({ message: "Permission denied" });

      await client.query("BEGIN");

      await client.query(
        `UPDATE posts SET title = $1, content = $2 WHERE post_id = $3`,
        [title, content, post_id]
      );

      if (req.files && req.files.length > 0) {
        for (const img of req.files) {
          await client.query(
            `INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`,
            [post_id, img.path]
          );
        }
      }

      await client.query("COMMIT");
      const updated = await client.query(
        `
      SELECT 
        p.post_id,
        p.field_id,
        p.title,
        p.content,
        (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') AS created_at,
        COALESCE(
          json_agg(
            json_build_object('image_url', pi.image_url)
          ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
        ) AS images
      FROM posts p
      LEFT JOIN post_images pi ON p.post_id = pi.post_id
      WHERE p.post_id = $1
      GROUP BY p.post_id
    `,
        [post_id]
      );

      res.status(200).json(updated.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message: "Update failed" });
    } finally {
      client.release();
    }
  }
);

router.delete("/delete/:post_id", authMiddleware, async (req, res) => {
  const { post_id } = req.params;
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT p.*, f.user_id AS field_owner FROM posts p JOIN field f ON p.field_id = f.field_id WHERE p.post_id = $1`,
      [post_id]
    );
    const post = result.rows[0];

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (req.user.role !== "admin" && post.field_owner !== user_id)
      return res.status(403).json({ message: "Permission denied" });

    const images = await pool.query(
      `SELECT image_url FROM post_images WHERE post_id = $1`,
      [post_id]
    );

    for (const img of images.rows) {
      await deleteCloudinaryFile(img.image_url);
    }

    await pool.query(`DELETE FROM post_images WHERE post_id = $1`, [post_id]);
    await pool.query(`DELETE FROM posts WHERE post_id = $1`, [post_id]);

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
