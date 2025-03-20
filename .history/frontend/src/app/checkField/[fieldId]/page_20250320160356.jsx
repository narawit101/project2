"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CheckFieldDetail() {
  const { fieldId } = useParams(); // ✅ รับค่า field_id จาก URL
  const [fieldData, setFieldData] = useState(null);
  const router = useRouter();

  const updateFieldStatus = async (fieldId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/field/${fieldId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ส่ง token ใน header
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`สถานะอัปเดตเป็น: ${newStatus}`);
        setFieldData({ ...fieldData, status: newStatus }); // อัปเดต UI
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("user");

    // ตรวจสอบว่า role ของผู้ใช้เป็น "admin" หรือไม่
    if (userRole?.role !== "admin") {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      router.push("/login"); // เปลี่ยนเส้นทางไปหน้า login ถ้าไม่ใช่ admin
      return;
    }

    if (!fieldId) return;

    const token = localStorage.getItem("token"); // ดึง token จาก localStorage

    fetch(`http://localhost:5000/field/${fieldId}`, {
      method: "GET", // ใช้ method GET ในการดึงข้อมูล
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ส่ง token ใน Authorization header
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert("ไม่พบข้อมูลสนามกีฬา");
          router.push("/checkField"); // กลับไปหน้าหลักถ้าเกิดข้อผิดพลาด
        } else {
          console.log("📌 ข้อมูลสนามกีฬา:", data); // ตรวจสอบข้อมูลที่ได้จาก Backend
          setFieldData(data);
        }
      })
      .catch((error) => console.error("❌ Error fetching field data:", error));
  }, [fieldId, router]);

  if (!fieldData) return <p>กำลังโหลดข้อมูลสนามกีฬา...</p>;

  return (
    <div className="field-detail-container">
      <h1>🏟️ รายละเอียดสนามกีฬา</h1>

      {/* ✅ รูปภาพสนาม */}
      {fieldData?.img_field ? (
        <div className="image-container">
          <img
            src={`http://localhost:5000/${fieldData.img_field}`} // ✅ ใช้ Path ที่ Backend ส่งมาโดยตรง
            alt="รูปสนามกีฬา"
            className="field-image"
          />
        </div>
      ) : (
        <p>❌ ไม่มีรูปสนามกีฬา</p>
      )}

      {/* ✅ ข้อมูลสนาม */}
      <div className="field-info">
        <p>
          <strong>📌 ชื่อสนาม:</strong> {fieldData?.field_name}
        </p>
        <p>
          <strong>📍 ที่อยู่:</strong> {fieldData?.address}
        </p>
        <p>
          <strong>🌐 พิกัด GPS:</strong>{" "}
          <a
            href={fieldData?.gps_location}
            target="_blank"
            rel="noopener noreferrer"
          >
            {fieldData?.gps_location}
          </a>
        </p>
        <h4>วันเปิดบริการ:</h4>
        <ul>
          {fieldData.open_days &&
            fieldData.open_days.map((day, index) => <li key={index}>{day}</li>)}
        </ul>
        <p>
          <strong>🕒 เวลาทำการ:</strong> {fieldData?.open_hours} -{" "}
          {fieldData?.close_hours}
        </p>
        <p>
          <strong>🙋‍♂️ เจ้าของ:</strong> {fieldData?.first_name}{" "}
          {fieldData?.last_name}
        </p>
        <p>
          <strong>💰 ค่ามัดจำ:</strong> {fieldData?.price_deposit} บาท
        </p>
        <p>
          <strong>🏦 ธนาคาร:</strong> {fieldData?.name_bank}
        </p>
        <p>
          <strong>🙋‍♂️ ชื่อเจ้าของบัญชี:</strong> {fieldData?.account_holder}
        </p>
        <p>
          <strong>💳 เลขบัญชีธนาคาร:</strong> {fieldData?.number_bank}
        </p>
        <p>
          <strong>📄 สถานะ:</strong> {fieldData?.status}
        </p>
      </div>

      {/* ✅ แสดงเอกสาร (PDF) ถ้ามี */}
      {fieldData?.documents ? (
        <div className="document-container">
          <h3>📄 เอกสารที่แนบมา</h3>
          <a
            href={`http://localhost:5000/${fieldData.documents}`} // ✅ ใช้ Path ที่ Backend ส่งมาโดยตรง
            target="_blank"
            rel="noopener noreferrer"
            className="document-link"
          >
            🔗 เปิดเอกสาร
          </a>
        </div>
      ) : (
        <p>❌ ไม่มีเอกสารแนบ</p>
      )}

      {/* ✅ ข้อมูลสนามย่อย (sub_fields) */}
      <div className="sub-fields-container">
        {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
          fieldData.sub_fields.map((sub) => (
            <div key={sub.sub_field_id} className="sub-field-card">
              <h2>📌 สนามย่อย</h2>
              <p>
                <strong>🏟️ ชื่อสนามย่อย:</strong> {sub.sub_field_name}
              </p>
              <p>
                <strong>💰 ราคา:</strong> {sub.price} บาท
              </p>
              <p>
                <strong>🏆 ประเภทกีฬา:</strong> {sub.sport_id}
              </p>

              {/* ✅ แสดง Add-ons ถ้ามี */}
              {sub.add_ons && sub.add_ons.length > 0 ? (
                <div className="add-ons-container">
                  <h3>🎁 Add-ons</h3>
                  <ul>
                    {sub.add_ons.map((addon) => (
                      <li key={addon.add_on_id}>
                        {addon.content} - {addon.price} บาท
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>❌ ไม่มี Add-ons</p>
              )}
            </div>
          ))
        ) : (
          <p>❌ ไม่มีสนามย่อย</p>
        )}
      </div>
      <div className="status-buttons">
        <button
          className="approve-btn"
          onClick={() => updateFieldStatus(fieldId, "ผ่านการอนุมัติ")}
        >
          ✅ ผ่านการอนุมัติ
        </button>
        <button
          className="reject-btn"
          onClick={() => updateFieldStatus(fieldId, "ไม่ผ่านการอนุมัติ")}
        >
          ❌ ไม่ผ่านการอนุมัติ
        </button>
      </div>
      {/* ✅ ปุ่มกลับไปหน้ารายการ */}
      <button
        className="back-button"
        onClick={() => router.push("/checkField")}
      >
        🔙 กลับไปหน้ารายการ
      </button>
    </div>
  );
}
