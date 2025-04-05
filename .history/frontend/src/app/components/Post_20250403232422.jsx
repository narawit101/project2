"use client";

import { useState } from "react";
import "@/app/css/postField.css";

const CreatePost = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [field, setField] = useState(null);

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    images.forEach((image) => {
      formData.append("img_url", image);
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/posts/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("โพสต์ถูกสร้างสำเร็จ!");
        setTitle("");
        setContent("");
        setImages([]);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="post-container">
      <h2>Create a New Post</h2>
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label>Upload Images:</label>
          <input type="file" multiple onChange={handleFileChange} />
        </div>

        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
