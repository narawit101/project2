"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/profile.css";
import Post from "@/app/components/Post";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import { useSearchParams } from "next/navigation";



dayjs.extend(relativeTime);
dayjs.locale("th");

export default function CheckFieldDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const searchParams = useSearchParams();
const highlightId = searchParams.get("highlight");
  const { fieldId } = useParams();
  const [fieldData, setFieldData] = useState(null);
  const [postData, setPostData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [canPost, setCanPost] = useState(false); // State for checking if the user can post
  const [facilities, setFacilities] = useState([]);
  const [imageIndexes, setImageIndexes] = useState({}); // เก็บ index ของแต่ละโพส
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)
  const [showModal, setShowModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (!fieldId) return;

    const token = localStorage.getItem("token"); // ดึง token จาก localStorage

    fetch(`${API_URL}/profile/${fieldId}`, {
      method: "GET", // ใช้ method GET ในการดึงข้อมูล
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ส่ง token ใน Authorization header
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/"); // กลับไปหน้าหลักถ้าเกิดข้อผิดพลาด
        } else {
          console.log(" ข้อมูลสนามกีฬา:", data); // ตรวจสอบข้อมูลที่ได้จาก Backend
          setFieldData(data);

          // ตรวจสอบสิทธิ์การโพสต์
          const fieldOwnerId = data.user_id; // ดึง field_user_id
          const currentUserId = currentUser?.user_id;
          const currentUserRole = currentUser?.role;

          // เช็คว่า user_id ตรงกับ field_user_id หรือไม่ หรือเป็น admin
          if (currentUserRole === "admin" || fieldOwnerId === currentUserId) {
            setCanPost(true); // ถ้าเป็น admin หรือเจ้าของสนาม สามารถโพสต์ได้
          } else {
            setCanPost(false); // ถ้าไม่ใช่ ไม่สามารถโพสต์ได้
          }
        }
        const status = data.status;
        if (status != "ผ่านการอนุมัติ") {
          setMessage(` สนามคุณยัง ${data.status}`);
          setMessageType("error");
          setTimeout(() => {
            router.push("/myfield");
          }, 1500);
        }
      })
      .catch((error) => console.error("Error fetching field data:", error));
  }, [fieldId, currentUser, router]);

  useEffect(() => {
    if (!fieldId) return;

    const token = localStorage.getItem("token"); // ดึง token จาก localStorage

    fetch(`${API_URL}/posts/${fieldId}`, {
      method: "GET", // ใช้ method GET ในการดึงข้อมูล
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ส่ง token ใน Authorization header
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "ไม่มีโพส") {
          console.log("No posts available");
          setPostData([]);
        } else if (data.error) {
          console.error("Backend error:", data.error);
          router.push("/");
        } else {
          console.log("Post data:", data);
          setPostData(data);
        }
      })
      .catch((error) => console.error("Error fetching post data:", error));
  }, [fieldId, router]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/facilities/${fieldId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }

        const data = await response.json();
        setFacilities(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchFacilities();
  }, [fieldId]);

  const daysInThai = {
    Mon: "จันทร์",
    Tue: "อังคาร",
    Wed: "พุธ",
    Thu: "พฤหัสบดี",
    Fri: "ศุกร์",
    Sat: "เสาร์",
    Sun: "อาทิตย์",
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".undercontainer")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (highlightId) {
      const element = document.getElementById(`post-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [postData]); // ต้องรอให้ postData โหลดเสร็จก่อน
  // login เลื่อนรูป

  const handlePrev = (postId, length) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]:
        (prev[postId] || 0) - 1 < 0 ? length - 1 : (prev[postId] || 0) - 1,
    }));
  };

  const handleNext = (postId, length) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1 >= length ? 0 : (prev[postId] || 0) + 1,
    }));
  };

  const handleImageClick = (imgUrl, postId) => {
    const currentPost = postData.find((p) => p.post_id === postId);
    const images = currentPost?.images || [];
    const index = images.findIndex(
      (img) => `${API_URL}/${img.image_url}` === `${API_URL}/${imgUrl}`
    );
    setSelectedImage(`${API_URL}/${imgUrl}`);
    setSelectedPostId(postId);
    setImageIndexes((prev) => ({ ...prev, [postId]: index }));
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setSelectedPostId(null);
  };

  const handleEdit = (post) => {
    setEditingPostId(post.post_id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setNewImages([]);
  };

  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const MAX_IMG = 10;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setMessage(` ${file.name} ไม่ใช่ไฟล์รูปภาพ`);
        setMessageType("error");
        e.target.value = null;
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setMessage(`${file.name} มีขนาดใหญ่เกินไป (สูงสุด 8MB)`);
        setMessageType("error");
        e.target.value = null;
        return;
      }
    }

    const currentPost = postData.find((p) => p.post_id === editingPostId);
    const existingImageCount = currentPost?.images?.length || 0;
    const newImageCount = files.length;

    if (existingImageCount + newImageCount > MAX_IMG) {
      setMessage("รวมรูปทั้งหมดต้องไม่เกิน 10 รูป (รวมรูปเดิมและรูปใหม่)");
      setMessageType("error");
      return;
    }

    setNewImages(files);
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
      const updated = await res.json();
      setPostData((prev) =>
        prev.map((post) => (post.post_id === postId ? updated : post))
      );
      setEditingPostId(null);
      setMessage("แก้ไขโพสต์สำเร็จ");
      setMessageType("success");
    } else {
      setMessage("แก้ไขโพสต์ไม่สำเร็จ");
      setMessageType("error");
    }
  };
  const confirmDelete = (postId) => {
    setPostToDelete(postId);
    setShowModal(true);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/posts/delete/${postToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setMessage("ลบโพสต์เรียบร้อย");
        setMessageType("success");
        setPostData((prev) =>
          prev.filter((post) => post.post_id !== postToDelete)
        );
        setShowModal(false);
      } else {
        setMessage("เกิดข้อผิดพลาดในการลบโพสต์");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("ลบโพสต์ไม่สำเร็จ");
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

  if (!fieldData)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
        </div>
      )}
      {fieldData?.img_field ? (
        <div className="image-container">
           <div className="head-title">
              <strong> {fieldData?.field_name}</strong>
            </div>
          <img
            src={`${API_URL}/${fieldData.img_field}`} //  ใช้ Path ที่ Backend ส่งมาโดยตรง
            alt="รูปสนามกีฬา"
            className="field-image"
          />     
           <div className="btn">
            <button onClick={scrollToBookingSection}>เลือกสนาม</button>
          </div> 
        </div>
      ) : (
        <p>ไม่มีรูปสนามกีฬา</p>
      )}
      <div className="field-detail-container">
        <aside>
          <div className="field-info">
            <h1>รายละเอียดสนาม</h1>        
            <p>
              <strong>ที่อยู่:</strong> {fieldData?.address}
            </p>
            <p>
              <strong>พิกัด GPS:</strong>{" "}
              <a
                href={fieldData?.gps_location}
                target="_blank"
                rel="noopener noreferrer"
              >
                {fieldData?.gps_location}
              </a>
            </p>
            <p>
              <strong>วันที่เปิดสนาม</strong>
            </p>
            {fieldData.open_days &&
              fieldData.open_days.map((day, index) => (
                <div className="opendays" key={index}>
                  {daysInThai[day] || day} {/* Translate day to Thai */}
                </div>
              ))}

            <p>
              <strong>เวลาเปิด-ปิด:</strong> {fieldData?.open_hours} -{" "}
              {fieldData?.close_hours}
            </p>
            <p>
              <strong>รายละเอียดสนาม:</strong> {fieldData?.field_description}
            </p>
            <p>
              <strong>ค่ามัดจำ:</strong> {fieldData?.price_deposit} บาท
            </p>
            <p>
              <strong>ธนาคาร:</strong> {fieldData?.name_bank}
            </p>
            <p>
              <strong>ชื่อเจ้าของบัญชี:</strong> {fieldData?.account_holder}
            </p>
            <p>
              <strong>เลขบัญชีธนาคาร:</strong> {fieldData?.number_bank}
            </p>

            <div className="field-facilities">
              <h1>สิ่งอำนวยความสะดวก</h1>
              {facilities.length === 0 ? (
                <p>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
              ) : (
                <div className="facbox">
                  {facilities.map((facility, index) => (
                    <div
                      className="facitem"
                      key={`${facility.fac_id}-${index}`}
                    >
                      {" "}
                      {/* Unique key using both fac_id and index */}
                      <strong>{facility.fac_name}</strong>:{" "}
                      <span>{facility.fac_price} บาท</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
        <div className="post">
          <h1>โพสต์</h1>
          {canPost && (
            <Post
              fieldId={fieldId}
              onPostSuccess={(newPost) => {
                setPostData((prev) => [newPost, ...prev]); // เพิ่มโพสใหม่ด้านบน
              }}
            />
          )}

          {postData.map((post) => (
            <div key={post.post_id} className="post-card" id={`post-${post.post_id}`}>
              {editingPostId === post.post_id ? (
                <form
                  onSubmit={(e) => handleEditSubmit(e, post.post_id)}
                  className="edit-form"
                >
                  <div className="form-group">
                    <label>หัวข้อ</label>
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="form-group">
                    <label>เนื้อหา</label>
                    <textarea
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="form-group">
                    <label>รูปภาพที่เลือก</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                  </div>
                  <button type="submit">บันทึก</button>
                  <button className="canbtn" type="button" onClick={() => setEditingPostId(null)}>
                    ยกเลิก
                  </button>
                </form>
              ) : (
                <>
                  <h2 className="post-title">{post.content}</h2>
                  <div className="time">{dayjs(post.created_at).fromNow()}</div>
                  {post.images && post.images.length > 0 && (
                    <div className="ig-carousel-container">
                      <div className="ig-carousel-track-wrapper">
                        <div
                          className="ig-carousel-track"
                          style={{
                            transform: `translateX(-${
                              (imageIndexes[post.post_id] || 0) * 100
                            }%)`,
                          }}
                        >
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={`${API_URL}/${img.image_url}`}
                              alt="รูปโพสต์"
                              className="ig-carousel-image"
                              onClick={() =>
                                setSelectedImage(`${API_URL}/${img.image_url}`)
                              }
                              style={{ cursor: "zoom-in" }}
                            />
                          ))}
                        </div>
                        <button
                          className="arrow-btn left"
                          onClick={() => {
                            const len = post.images.length;
                            setImageIndexes((prev) => ({
                              ...prev,
                              [post.post_id]:
                                (prev[post.post_id] || 0) - 1 < 0
                                  ? len - 1
                                  : (prev[post.post_id] || 0) - 1,
                            }));
                          }}
                        >
                          ❮
                        </button>
                        <button
                          className="arrow-btn right"
                          onClick={() => {
                            const len = post.images.length;
                            setImageIndexes((prev) => ({
                              ...prev,
                              [post.post_id]:
                                (prev[post.post_id] || 0) + 1 >= len
                                  ? 0
                                  : (prev[post.post_id] || 0) + 1,
                            }));
                          }}
                        >
                          ❯
                        </button>
                      </div>
                      <div className="dot-indicators">
                        {post.images.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`dot ${
                              (imageIndexes[post.post_id] || 0) === dotIdx
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setImageIndexes((prev) => ({
                                ...prev,
                                [post.post_id]: dotIdx,
                              }))
                            }
                          ></span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="post-text">{post.title}</p>
                  {canPost && (
                    <div className="post-actions">
                      <button onClick={() => handleEdit(post)} className="btn">
                        แก้ไขโพส
                      </button>
                      <button
                        onClick={() => confirmDelete(post.post_id)}
                        className="btn"
                      >
                        ลบโพส
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* ข้อมูลสนามย่อย (sub_fields) */}
        <div className="undercontainer">
          <div className="sub-fields-container">
            <h1>สนามย่อย</h1>
            {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
              fieldData.sub_fields.map((sub) => (
                <div key={sub.sub_field_id} className="sub-field-card">
                  <p>
                    <strong>ชื่อสนาม:</strong> {sub.sub_field_name}
                  </p>
                  <p>
                    <strong>ราคา:</strong> {sub.price} บาท
                  </p>
                  <p>
                    <strong>กีฬา:</strong> {sub.sport_name}
                  </p>

                  {/*  แสดง Add-ons ถ้ามี */}
                  {sub.add_ons && sub.add_ons.length > 0 ? (
                    <div className="add-ons-container">
                      <h3>ราคาสำหรับจัดกิจกรรมพิเศษ</h3>
                      {sub.add_ons.map((addon) => (
                        <p key={addon.add_on_id}>
                          {addon.content} - {addon.price} บาท
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p>ไม่มีราคาสำหรับกิจกรรมพิเศษ</p>
                  )}
                </div>
              ))
            ) : (
              <p>ไม่มีสนามย่อย</p>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?</p>
            <div className="modal-actions">
              <button className="delbtn" onClick={handleDelete}>
                ลบ
              </button>
              <button className="canbtn" onClick={() => setShowModal(false)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
