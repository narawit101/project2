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
  const [canPost, setCanPost] = useState(false); // State for checking if the user can post
  const [facilities, setFacilities] = useState([]);
  const [imageIndexes, setImageIndexes] = useState({}); // เก็บ index ของแต่ละโพส
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    // const token = localStorage.getItem("token");
    // const expiresAt = localStorage.getItem("expiresAt");

    // if (
    //   !token ||
    //   !storedUser ||
    //   !expiresAt ||
    //   Date.now() > parseInt(expiresAt)
    // ) {
    //   localStorage.removeItem("token");
    //   localStorage.removeItem("user");
    //   localStorage.removeItem("expiresAt");
    //   router.push("/login");
    //   return;
    // }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    // if (user.role !== "admin" && user.role !== "field_owner") {
    //   router.push("/login");
    // }
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
    const index = images.findIndex((img) => `${API_URL}/${img.image_url}` === `${API_URL}/${imgUrl}`);
    setSelectedImage(`${API_URL}/${imgUrl}`);
    setSelectedPostId(postId);
    setImageIndexes((prev) => ({ ...prev, [postId]: index }));
  };
  

  const handleLightboxPrev = () => {
    const currentPost = postData.find((p) => p.post_id === selectedPostId);
    const images = currentPost?.images || [];
    if (images.length === 0) return;
    const currentIndex = imageIndexes[selectedPostId] || 0;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setImageIndexes((prev) => ({ ...prev, [selectedPostId]: prevIndex }));
    setSelectedImage(`${API_URL}/${images[prevIndex].image_url}`);
  };

  const handleLightboxNext = () => {
    const currentPost = postData.find((p) => p.post_id === selectedPostId);
    const images = currentPost?.images || [];
    if (images.length === 0) return;
    const currentIndex = imageIndexes[selectedPostId] || 0;
    const nextIndex = (currentIndex + 1) % images.length;
    setImageIndexes((prev) => ({ ...prev, [selectedPostId]: nextIndex }));
    setSelectedImage(`${API_URL}/${images[nextIndex].image_url}`);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setSelectedPostId(null);
  };

  if (!fieldData)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <>
     {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <button onClick={(e) => { e.stopPropagation(); handleLightboxPrev(); }} className="lightbox-arrow left">❮</button>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
          <button onClick={(e) => { e.stopPropagation(); handleLightboxNext(); }} className="lightbox-arrow right">❯</button>
        </div>
      )}
      {fieldData?.img_field ? (
        <div className="image-container">
          <img
            src={`${API_URL}/${fieldData.img_field}`} //  ใช้ Path ที่ Backend ส่งมาโดยตรง
            alt="รูปสนามกีฬา"
            className="field-image"
          />
          <div className="btn">
            <button onClick={scrollToBookingSection}>เลือกสนามย่อย</button>
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
              <strong>ชื่อสนาม:</strong> {fieldData?.field_name}
            </p>
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
              <p>สิ่งอำนวยความสะดวก</p>
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
          <h1>โพสทั้งหมด</h1>
          {canPost && <Post fieldId={fieldId} />}

          {postData.map((post, index) => (
            <div key={`${post.post_id}-${index}`} className="post-card">
              <h2 className="post-title">{post.content}</h2>

              {post.images && post.images.length > 0 ? (
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
                        onClick={() => handleImageClick(img.image_url)}
                        style={{ cursor: "zoom-in" }}
                      />
                      
                      ))}
                    </div>

                    {/* ปุ่มเลื่อนซ้าย ขวา */}
                    <button
                      className="arrow-btn left"
                      onClick={() =>
                        handlePrev(post.post_id, post.images.length)
                      }
                    >
                      ❮
                    </button>
                    <button
                      className="arrow-btn right"
                      onClick={() =>
                        handleNext(post.post_id, post.images.length)
                      }
                    >
                      ❯
                    </button>
                  </div>

                  {/* จุดล่าง */}
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
              ) : (
                <p style={{ color: "#aaa" }}></p>
              )}

              <p className="post-text">{post.title}</p>
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
    </>
  );
}
