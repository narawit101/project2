const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../db");
const path = require("path");
const fs = require("fs");

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

router.post("/post", upload.array("img_url"), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { title, content } = req.body;
        const newPost = await client.query(
            `INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING post_id`,
            [title, content]
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

module.exports = router;