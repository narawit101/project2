"use client";

import { useState, useEffect } from "react";
import "@/app/css/postField.css";

const CreatePost = ({ fieldId,onPostSuccess }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
  const MAX_FILES = 10; // Limit to 10 files

  const handleFileChange = (e) => {
    const files = e.target.files;
    const validFiles = [];
    let isValid = true;

    if (files.length + images.length > MAX_FILES) {
      setMessage(`คุณสามารถอัพโหลดได้สูงสุด ${MAX_FILES} รูป`);
      setMessageType("error");
      e.target.value = null; // Reset the input value
      return;
    }

    for (let file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 8MB)");
        setMessageType("error");
        isValid = false;
        break; // Stop checking further files
      }

      // Check file type (must be an image)
      if (file.type.startsWith("image/")) {
        // Check if the file is already in the images state (prevent duplicates)
        const isDuplicate = images.some(
          (existingFile) => existingFile.name === file.name
        );
        if (!isDuplicate) {
          validFiles.push(file);
        }
      } else {
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
        isValid = false;
        break; // Stop checking further files
      }
    }

    if (isValid) {
      // Add the valid files to the images state
      setImages((prevImages) => [...prevImages, ...validFiles]);
    } else {
      e.target.value = null; // Clear the input value if invalid files are selected
    }
  };

  // Handle image removal
  const removeImage = (fileName) => {
    setImages(images.filter((image) => image.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fieldId) {
      setMessage("Error: Field ID is missing.");
      setMessageType("error");
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
      const response = await fetch(`${API_URL}/posts/post`, {
        method: "POST",
        credentials:"include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onPostSuccess(data.post);
        setMessage("โพสต์เรียบร้อย");
        setMessageType("success");
        setTitle("");
        setContent("");
        setImages([]);
        setShowPostForm(false);
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.message}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      setMessage("เกิดข้อผิดพลาด");
      setMessageType("error");
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
            <label>หัวข้อ</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label>เนื้อหา</label>
            <textarea
              value={title}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={255}
            ></textarea>
          </div>

          <div className="form-group">
            <label>อัปโหลดรูปภาพ</label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*"
            />
          </div>

          <div className="image-preview-container">
            {images.length > 0 && (
              <div>
                <h3>รูปภาพที่เลือก</h3>
                <ul>
                  {images.map((image, index) => (
                    <li key={index}>
                      <img
                        src={URL.createObjectURL(image)}
                        alt={image.name}
                        style={{ width: 100, height: 100 }}
                      />
                      <button
                        type="button"
                        className="delpre"
                        onClick={() => removeImage(image.name)}
                      >
                        ลบ
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
