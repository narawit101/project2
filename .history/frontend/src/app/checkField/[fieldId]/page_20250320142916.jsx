'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";

const CheckField = () => {
  const router = useRouter();
  const { fieldId } = useParams(); // ✅ รับค่า field_id จาก URL

  const [fieldData, setFieldData] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!fieldId) return;

    fetch(`http://localhost:5000/field/${fieldId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert("ไม่พบข้อมูลสนามกีฬา");
          router.push("/checkField"); // ❌ กลับไปหน้าหลัก
        } else {
          console.log("📌 ข้อมูลสนามกีฬา:", data); // ✅ ตรวจสอบค่าที่ได้จาก Backend
          setFieldData(data);
        }
      })
      .catch((error) => console.error("❌ Error fetching field data:", error));
  }, [fieldId]);

  if (!fieldData) return <p>กำลังโหลดข้อมูลสนามกีฬา...</p>;

  return (
    <div>
      <h2>ข้อมูลสนามกีฬา</h2>
      {message && <p>{message}</p>}
      <h3>{fieldData.field_name}</h3>
      <p>ที่อยู่: {fieldData.address}</p>
      <p>สถานะ: {status}</p>
      <button onClick={() => handleStatusChange("ผ่านการอนุมัติ")}>ผ่านการอนุมัติ</button>
      <button onClick={() => handleStatusChange("ไม่ผ่านการอนุมัติ")}>ไม่ผ่านการอนุมัติ</button>

      <h4>ข้อมูลเพิ่มเติม:</h4>
      <p>เอกสาร: <a href={fieldData.documents} target="_blank" rel="noopener noreferrer">คลิกเพื่อดู</a></p>
      <p>รูปภาพสนาม: <img src={fieldData.img_field} alt="สนาม" width="100" /></p>

      <h4>เวลาเปิด-ปิด:</h4>
      <p>เปิด: {fieldData.open_hours} - ปิด: {fieldData.close_hours}</p>

      <h4>วันเปิดบริการ:</h4>
      <ul>
        {fieldData.open_days && fieldData.open_days.map((day, index) => (
          <li key={index}>{day}</li>
        ))}
      </ul>
    </div>
  );
};

export default CheckField;
