"use client";

import { useState, useEffect } from "react";
import "@/app/css/postField.css";

const CreatePost = ({ fieldId }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 5 MB
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }
    if (file.type.startsWith("image/")) {
      setImages([...e.target.files]);
    } else {
      e.target.value = null;
      setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
      setMessageType("error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fieldId) {
      alert("Error: Field ID is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("field_id", fieldId); // Ensure field_id is added to the form data

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
        setShowPostForm(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="post-container">
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      {!showPostForm && (
        <button
          className="add-post-button"
          onClick={() => setShowPostForm(true)}
        >
          เพิ่มโพส
        </button>
      )}

      {showPostForm && (
        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label>หัวข้อโพส:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>เนื้อหาของโพส:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>อัปโหลดรูปภาพ:</label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*"
            />
          </div>

          <button type="submit" className="submit-btn">
            สร้างโพส
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowPostForm(false)}
          >
            ยกเลิก
          </button>
        </form>
      )}
    </div>
  );
};

export default CreatePost;
