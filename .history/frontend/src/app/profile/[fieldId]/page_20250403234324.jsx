"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/profile.css";
import Post from "@/app/components/Post";

export default function CheckFieldDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { fieldId } = useParams(); // ✅ รับค่า field_id จาก URL
  const [fieldData, setFieldData] = useState(null);
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
          setFieldData(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching field data:", error);
        router.push("/"); // Redirect if error
      });
  }, [fieldId, router]);

  if (!fieldData)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <>
      {fieldData?.img_field ? (
        <div className="image-container">
          <img
            src={`${API_URL}/${fieldData.img_field}`}
            alt="รูปสนามกีฬา"
            className="field-image"
          />
        </div>
      ) : (
        <p>ไม่มีรูปสนามกีฬา</p>
      )}
      <div className="field-detail-container">
        <aside>
          <div className="content">
            <div className="field-info">
              <h1>รายละเอียดสนาม</h1>
              <p>
                <strong>ชื่อสนาม:</strong> {fieldData?.field_name}
              </p>
              <p>
                <strong>ที่อยู่:</strong> {fieldData?.address}
              </p>
              <p>
                <strong>พิกัด GPS:</strong>
                <a
                  href={fieldData?.gps_location}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {fieldData?.gps_location}
                </a>
              </p>
              {/* More field details */}
            </div>

            {/* Post Component */}
            <div className="post">
              <h1>โพสทั้งหมด</h1>
              <Post />
              <div className="post-card">
                <img
                  src="path_to_image1.jpg"
                  alt="Post Image 1"
                  className="post-image"
                />
                <h2 className="post-title">หัวข้อโพส 1</h2>
                <p className="post-text">
                  totam atque quidem culpa! Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Sub Fields */}
        <div className="sub-fields-container">
          <h1>สนามย่อย</h1>
          {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
            fieldData.sub_fields.map((sub) => (
              <div key={sub.sub_field_id} className="sub-field-card">
                <p>
                  <strong>ชื่อสนามย่อย:</strong> {sub.sub_field_name}
                </p>
                <p>
                  <strong>ราคา:</strong> {sub.price} บาท
                </p>
                <p>
                  <strong>ประเภทกีฬา:</strong> {sub.sport_name}
                </p>
              </div>
            ))
          ) : (
            <p>ไม่มีสนามย่อย</p>
          )}
        </div>
      </div>
    </>
  );
}
