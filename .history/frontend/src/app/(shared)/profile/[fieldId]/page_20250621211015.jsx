"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/profile.css";
import Post from "@/app/components/Post";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function CheckFieldDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const MAPS_EMBED_API= process.env.NEXT_PUBLIC_MAPS_EMBED_API;
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { fieldId } = useParams();
  const [fieldData, setFieldData] = useState(null);
  const [postData, setPostData] = useState([]);
  const [canPost, setCanPost] = useState(false); // State for checking if the user can post
  const [facilities, setFacilities] = useState([]);
  const [imageIndexes, setImageIndexes] = useState({}); // เก็บ index ของแต่ละโพส
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)
  const [showModal, setShowModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [reviewData, setReviewData] = useState([]);
  const [selectedRating, setSelectedRating] = useState("ทั้งหมด");
  const [currentPage, setCurrentPage] = useState(1);
  const postPerPage = 5;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }

    if (highlightId && postData.length > 0) {
      const element = document.getElementById(`post-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });

        const params = new URLSearchParams(searchParams.toString());
        params.delete("highlight");
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [isLoading, user, postData, highlightId, user]);

  useEffect(() => {
    if (!fieldId) return;

    const fetchFieldData = async () => {
      try {
        sessionStorage.setItem("field_id", fieldId);

        const res = await fetch(`${API_URL}/profile/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (data.error) {
          setMessage("ไม่สามารถดึงข้อมูลได้");
          setMessageType("error");
          setTimeout(() => {
            router.replace("/");
          }, 2000);
          return;
        }

        setFieldData(data);

        // เก็บข้อมูลใน sessionStorage
        sessionStorage.setItem("account_holder", data.account_holder || "");
        sessionStorage.setItem("name_bank", data.name_bank || "");
        sessionStorage.setItem("number_bank", data.number_bank || "");
        sessionStorage.setItem("field_name", data.field_name || "");

        // ตรวจสอบสิทธิ์การโพสต์
        const fieldOwnerId = data.user_id;
        const currentUserId = user?.user_id;
        const currentUserRole = user?.role;

        if (currentUserRole === "admin" || fieldOwnerId === currentUserId) {
          setCanPost(true);
        } else {
          setCanPost(false);
        }

        // ตรวจสอบสถานะสนาม
        if (data.status !== "ผ่านการอนุมัติ") {
          setMessage(`สนามคุณ ${data.status}`);
          setMessageType("error");
          setTimeout(() => {
            router.replace("/myfield");
          }, 1500);
        }
      } catch (error) {
        console.error("Error fetching field data:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFieldData();
  }, [fieldId, user, router]);

  useEffect(() => {
    if (!fieldId) return;

    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/posts/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (data.message === "ไม่มีโพส") {
          setPostData([]);
        } else if (data.error) {
          console.error("Backend error:", data.error);
          setMessage("ไม่สามารถดึงข้อมูลได้", data.error);
          setMessageType("error");
        } else {
          setPostData(data);
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchPosts();
  }, [fieldId, router]);

  const indexOfLast = currentPage * postPerPage;
  const indexOfFirst = indexOfLast - postPerPage;
  const currentPostProfile = postData.slice(indexOfFirst, indexOfLast);

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
        console.error(err);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", err);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
  }, [fieldId]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews/rating-previwe/${fieldId}`);
        const data = await res.json();
        if (data.success) {
          console.log("reviewsData", data.data);
          setReviewData(data.data);
        }
      } catch (error) {
        console.error("Error fetching review:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchReviews();
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
      .querySelector(".sub-fields-profile")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

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
    const index = images.findIndex((img) => `${img.image_url}` === `${imgUrl}`);
    setSelectedImage(`${imgUrl}`);
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
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);

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
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const res = await fetch(`${API_URL}/posts/update/${postId}`, {
        method: "PATCH",
        credentials: "include",
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
        setPreviewImages([]);
      } else {
        setMessage("แก้ไขโพสต์ไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };
  const confirmDelete = (postId) => {
    setPostToDelete(postId);
    setShowModal(true);
  };

  const handleDelete = async () => {
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const res = await fetch(`${API_URL}/posts/delete/${postToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setMessage("ลบโพสต์เรียบร้อย");
        setMessageType("success");
        setPostData((prev) =>
          prev.filter((post) => post.post_id !== postToDelete)
        );
        setShowModal(false);
      } else {
        setMessage("เกิดข้อผิดพลาดในการลบโพสต์" || error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

const extractLatLngFromUrl = (url) => {
  try {
    console.log('Original URL:', url); // Debug
    const match = url.match(/([-0-9.]+),([-0-9.]+)/);
    if (match) {
      const coords = `${match[1]},${match[2]}`;
      console.log('Extracted coordinates:', coords); // Debug
      return coords;
    }
    console.log('No coordinates found'); // Debug
    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error); // Debug
    return null;
  }
};

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  const handleFilterChange = (e) => {
    setSelectedRating(e.target.value);
  };

  const filteredReviews = reviewData.filter((review) => {
    if (selectedRating === "ทั้งหมด") return true;
    return review.rating === parseInt(selectedRating);
  });

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      {dataLoading && (
        <div className="loading-data">
          <div className="loading-data-spinner"></div>
        </div>
      )}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
        </div>
      )}
      {fieldData?.img_field.length ? (
        <div className="image-container-profile">
          <div className="head-title-profile">
            <strong> {fieldData?.field_name}</strong>
          </div>
          <img
            src={`${fieldData.img_field}`}
            alt="รูปสนามกีฬา"
            className="field-image-profile"
          />
          <div className="profile-btn">
            <button onClick={scrollToBookingSection}>เลือกสนาม</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="image-container-profile">
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="field-detail-container-profile">
        <div className="undercontainer-proflie">
          <h1 className="sub-fields-profile">สนามย่อย</h1>
          <div className="sub-fields-container-profile">
            {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
              fieldData.sub_fields.map((sub) => (
                <div
                  key={sub.sub_field_id}
                  className="sub-field-card-profile"
                  onClick={() => router.push(`/calendar/${sub.sub_field_id}`)}
                >
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
                    <div className="add-ons-container-profile">
                      <h3>ราคาสำหรับจัดกิจกรรมพิเศษ</h3>
                      {sub.add_ons.map((addon) => (
                        <p key={addon.add_on_id}>
                          {addon.content} - {addon.price} บาท
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="no-addon-profile">
                      ไม่มีราคาสำหรับกิจกรรมพิเศษ
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="sub-fields-container-profile">
                {" "}
                {dataLoading && (
                  <div className="loading-data">
                    <div className="loading-data-spinner"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="post-profile">
          <h1>โพสต์</h1>
          {dataLoading && (
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          )}
          {canPost && (
            <Post
              fieldId={fieldId}
              onPostSuccess={(newPost) => {
                setPostData((prev) => [newPost, ...prev]);
              }}
            />
          )}
          {currentPostProfile.map((post) => (
            <div
              key={post.post_id}
              className="post-card-profile"
              id={`post-${post.post_id}`}
            >
              {editingPostId === post.post_id ? (
                <form
                  onSubmit={(e) => handleEditSubmit(e, post.post_id)}
                  className="edit-form-post"
                >
                  <div className="form-group-profile">
                    <label>หัวข้อ</label>
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group-profile">
                    <label>เนื้อหา</label>
                    <textarea
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="form-group-profile">
                    <label className="file-label-profile">
                      <input
                        multiple
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="file-input-hidden-profile"
                      />
                      เลือกรูปภาพ
                    </label>
                  </div>
                  <div className="preview-gallery-profile">
                    {previewImages.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`Preview ${index}`}
                        className="preview-image-profile"
                      />
                    ))}
                  </div>
                  <button type="submit">บันทึก</button>
                  <button
                    className="canbtn-post"
                    type="button"
                    onClick={() => setEditingPostId(null)}
                  >
                    ยกเลิก
                  </button>
                  {startProcessLoad && (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
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
                              src={`${img.image_url}`}
                              alt="รูปโพสต์"
                              className="ig-carousel-image"
                              onClick={() =>
                                setSelectedImage(`${img.image_url}`)
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
                  {post.title.length > 40 ? (
                    <p className="post-text">
                      {expandedPosts[post.post_id]
                        ? post.title
                        : `${post.title.substring(0, 40).trim()}... `}
                      <span
                        onClick={() => toggleExpanded(post.post_id)}
                        className="see-more-button-post"
                      >
                        {expandedPosts[post.post_id] ? "ย่อ" : "ดูเพิ่มเติม"}
                      </span>
                    </p>
                  ) : (
                    <p className="post-text">{post.title}</p>
                  )}
                  {canPost && (
                    <div className="post-actions-profile">
                      <button
                        onClick={() => handleEdit(post)}
                        className="btn-profile"
                      >
                        แก้ไขโพส
                      </button>
                      <button
                        onClick={() => confirmDelete(post.post_id)}
                        className="btn-profile"
                      >
                        ลบโพส
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="pagination-post-profile">
            {Array.from(
              { length: Math.ceil(postData.length / postPerPage) },
              (_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              )
            )}
          </div>
        </div>

        {/* ข้อมูลสนามย่อย (sub_fields) */}
        <aside className="aside">
          <div className="field-info-profile">
            <h1>รายละเอียดสนาม</h1>
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
            <p>
              <strong>ที่อยู่:</strong> {fieldData?.address}
            </p>
            <p>
              <strong>พิกัด GPS:</strong>
            </p>

     {fieldData?.gps_location ? (
  <div style={{ marginTop: "8px" }}>
    <iframe
      width="100%"
      height="250"
      style={{ border: 0, borderRadius: "8px" }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.2!2d100.529!3d13.7449!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ0JzQxLjYiTiAxMDDCsDMxJzQ0LjQiRQ!5e0!3m2!1sth!2sth!4v1234567890!5m2!1sth!2sth`}
    ></iframe>

    <a
      href={fieldData.gps_location}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        marginTop: "10px",
        padding: "6px 12px",
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        borderRadius: "999px",
        fontSize: "14px",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      เปิดใน Google Maps
    </a>
  </div>
) : (
  <p style={{ color: "gray" }}>ไม่มีพิกัด GPS</p>
)}
            <p>
              <strong>วันที่เปิดสนาม</strong>
            </p>
            {fieldData?.open_days?.length > 0 ? (
              fieldData.open_days.map((day, index) => (
                <div className="opendays" key={index}>
                  {daysInThai[day] || day}
                </div>
              ))
            ) : (
              <div>ไม่มีข้อมูลวันเปิดสนาม</div>
            )}

            <p>
              <strong>เวลาเปิด-ปิด:</strong> {fieldData?.open_hours} -{" "}
              {fieldData?.close_hours}
            </p>
            <p>
              <strong>ยกเลิกการจองได้ก่อน: </strong>
              {fieldData?.cancel_hours} ชม.
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
            <p>
              <strong>รายละเอียดสนาม:</strong>
            </p>
            <div className="detail-profile">{fieldData?.field_description}</div>

            <h1 className="fac-profile">สิ่งอำนวยความสะดวก</h1>
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
            <div className="field-facilities-profile">
              {Array.isArray(facilities) ? (
                facilities.length === 0 ? (
                  <p>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
                ) : (
                  <div className="facbox-profile">
                    {facilities.map((facility, index) => (
                      <div
                        className="facitem-profile"
                        key={`${facility.fac_id}-${index}`}
                      >
                        <strong>{facility.fac_name}</strong>:{" "}
                        <span>{facility.fac_price} บาท</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p style={{ color: "gray" }}>
                  ข้อมูลสิ่งอำนวยความสะดวกไม่ถูกต้อง
                </p>
              )}
            </div>
            <div className="reviwe-title-profile"></div>
            <h1>รีวิวสนามกีฬา</h1>
            <select
              id="review-score"
              className="filter-profile"
              onChange={handleFilterChange}
              value={selectedRating}
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="5">★★★★★</option>
              <option value="4">★★★★☆</option>
              <option value="3">★★★☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="1">★☆☆☆☆</option>
            </select>

            <div className="reviwe-container-profile">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review, index) => (
                  <div
                    className="reviwe-content-profile"
                    key={review.review_id || index}
                  >
                    <div className="review-box-profile">
                      <strong className="review-name-profile">
                        {review.first_name} {review.last_name}
                      </strong>
                      <div className="review-stars-profile">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <span
                            key={num}
                            className={`star-profile ${
                              num <= review.rating ? "active" : ""
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="detail-reviwe-profile">
                      <p className="review-label">ความคิดเห็น</p>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-reviwe-content-profile">
                  <div className="no-review-text">ยังไม่มีคะแนนการรีวิว</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      {showModal && (
        <div className="modal-overlay-profile">
          <div className="modal-post-profile">
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?</p>
            <div className="modal-actions-post">
              <button className="delbtn-post" onClick={handleDelete}>
                ลบ
              </button>
              <button
                className="canbtn-post"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
            </div>
            {startProcessLoad && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
