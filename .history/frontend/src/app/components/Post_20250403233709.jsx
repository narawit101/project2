"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/postField.css";

const CreatePost = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false); // Add state to toggle form visibility
  const { fieldId } = useParams(); // ✅ รับค่า field_id จาก URL

  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    // if (user.role !== "admin" && user.role !== "field_owner") {
    //   router.push("/login");
    // }
  }, []);

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
        setShowPostForm(false); // Hide the form after submission
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
      {/* Button to show the form */}
      {!showPostForm && (
        <button
          className="add-post-button"
          onClick={() => setShowPostForm(true)}
        >
          เพิ่มโพส
        </button>
      )}

      {/* Show the post creation form when showPostForm is true */}
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
            <input type="file" multiple onChange={handleFileChange} />
          </div>

          <button type="submit" className="submit-btn">
            สร้างโพส
          </button>
          {/* Cancel button to hide the form */}
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
