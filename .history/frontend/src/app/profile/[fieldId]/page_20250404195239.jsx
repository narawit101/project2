"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/profile.css";
import Post from "@/app/components/Post";

export default function CheckFieldDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { fieldId } = useParams();
  const [fieldData, setFieldData] = useState(null);
  const [postData, setPostData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [canPost, setCanPost] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [imageIndexes, setImageIndexes] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newImages, setNewImages] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (!fieldId) return;
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/profile/${fieldId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) router.push("/");
        else {
          setFieldData(data);
          const isOwner = data.user_id === currentUser?.user_id || currentUser?.role === "admin";
          setCanPost(isOwner);
        }
      });
  }, [fieldId, currentUser]);

  useEffect(() => {
    if (!fieldId) return;
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/posts/${fieldId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "ไม่มีโพส") setPostData([]);
        else {
          const grouped = data.reduce((acc, curr) => {
            const found = acc.find((p) => p.post_id === curr.post_id);
            if (found) {
              if (curr.image_url) found.images.push({ image_url: curr.image_url });
            } else {
              acc.push({ ...curr, images: curr.image_url ? [{ image_url: curr.image_url }] : [] });
            }
            return acc;
          }, []);
          setPostData(grouped);
        }
      });
  }, [fieldId, router]);

  const handleEdit = (post) => {
    setEditingPostId(post.post_id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setNewImages([]);
  };

  const handleEditSubmit = async (e, postId) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("content", editContent);
    newImages.forEach((img) => formData.append("img_url", img));

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/posts/update/${postId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      setEditingPostId(null);
      location.reload();
    } else {
      alert("แก้ไขโพสไม่สำเร็จ");
    }
  };

  return (
    <>
      {canPost && <Post fieldId={fieldId} />}
      {postData.map((post) => (
        <div key={post.post_id} className="post-card">
          {editingPostId === post.post_id ? (
            <form onSubmit={(e) => handleEditSubmit(e, post.post_id)}>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} required />
              <input type="file" multiple onChange={(e) => setNewImages([...e.target.files])} />
              <button type="submit">บันทึก</button>
              <button type="button" onClick={() => setEditingPostId(null)}>ยกเลิก</button>
            </form>
          ) : (
            <>
              <h2>{post.content}</h2>
              {post.images.map((img, idx) => (
                <img key={idx} src={`${API_URL}/${img.image_url}`} alt="post" style={{ width: "100%", maxWidth: 400 }} />
              ))}
              <p>{post.title}</p>
              {canPost && <button onClick={() => handleEdit(post)}>แก้ไขโพส</button>}
            </>
          )}
        </div>
      ))}
    </>
  );
}
