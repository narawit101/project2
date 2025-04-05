"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/postField.css";

const CreatePost = ({ fieldId }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [canPost, setCanPost] = useState(false);  // State to check if user can post
  const router = useRouter();

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that field_id is not undefined or null
    if (!fieldId) {
      alert("Field ID is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("field_id", fieldId);  // Add field_id to the form data

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
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.user_id;
    const role = user?.role;

    if (!userId || !role) {
      router.push("/login");  // If user is not logged in, redirect to login
      return;
    }

    // Fetch the field data to check if the user is allowed to post
    fetch(`${API_URL}/field/${fieldId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Error fetching field data:", data.error);
          router.push("/");  // Redirect to home if error occurs
          return;
        }

        const fieldOwnerId = data.user_id;

        // If the user is an admin or owns the field, allow them to post
        if (role === "admin" || fieldOwnerId === userId) {
          setCanPost(true);
        } else {
          setCanPost(false);  // Disable post creation if the user doesn't own the field
        }
      })
      .catch((error) => {
        console.error("Error fetching field data:", error);
        setCanPost(false);  // Disable post creation in case of an error
      });
  }, [fieldId, router]);

  return (
    <div className="post-container">
      {/* Render the post creation form only if the user is allowed */}
      {canPost && (
        <>
          <button className="add-post-button" onClick={() => setShowPostForm(true)}>
            เพิ่มโพส
          </button>

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

              <button type="submit" className="submit-btn">สร้างโพส</button>
              <button type="button" className="cancel-btn" onClick={() => setShowPostForm(false)}>
                ยกเลิก
              </button>
            </form>
          )}
        </>
      )}
      {!canPost && <div className="nne">คุณไม่มีสิทธิ์ในการโพสนี้</div>}
    </div>
  );
};

export default CreatePost;
