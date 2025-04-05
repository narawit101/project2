"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/profile.css";

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
          setMessage("ไม่พบข้อมูลสนามกีฬา");
          setMessageType("error");
          router.push("/"); // กลับไปหน้าหลักถ้าเกิดข้อผิดพลาด
        } else {
          console.log(" ข้อมูลสนามกีฬา:", data); // ตรวจสอบข้อมูลที่ได้จาก Backend
          setFieldData(data);
        }
      })
      .catch((error) => console.error("Error fetching field data:", error));
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
            src={`${API_URL}/${fieldData.img_field}`} //  ใช้ Path ที่ Backend ส่งมาโดยตรง
            alt="รูปสนามกีฬา"
            className="field-image"
          />
        </div>
      ) : (
        <p>ไม่มีรูปสนามกีฬา</p>
      )}
      <div className="field-detail-container">
        <aside>
          {" "}
          {/* <h1 className="h1">รายละเอียดสนามกีฬา</h1> */}
          {/*  รูปภาพสนาม */}
          {/*  ข้อมูลสนาม */}
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
                <strong>วันที่เปิดทำการ</strong>
              </p>
              {fieldData.open_days &&
                fieldData.open_days.map((day, index) => (
                  <p key={index}>{day}</p>
                ))}

              <p>
                <strong>เวลาทำการ:</strong> {fieldData?.open_hours} -{" "}
                {fieldData?.close_hours}
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
                <strong>รายละเอียดสนาม:</strong> {fieldData?.field_description}
              </p>
            </div>
            <div className="post">
              <h1>โพสทั้งหมด</h1>
              <div className="postdetail">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Deleniti commodi perspiciatis pariatur incidunt tenetur natus a,
                totam atque quidem culpa!
              </div>
            </div>
          </div>
        </aside>

        {/* ข้อมูลสนามย่อย (sub_fields) */}
        <div className="sub-fields-container">
          {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
            fieldData.sub_fields.map((sub) => (
              <div key={sub.sub_field_id} className="sub-field-card">
                <h2>สนามย่อย</h2>
                <p>
                  <strong>ชื่อสนามย่อย:</strong> {sub.sub_field_name}
                </p>
                <p>
                  <strong>ราคา:</strong> {sub.price} บาท
                </p>
                <p>
                  <strong>ประเภทกีฬา:</strong> {sub.sport_name}
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
                  <p>ไม่มีราคาสำหรับจัดกิจกรรมพิเศษ</p>
                )}
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
