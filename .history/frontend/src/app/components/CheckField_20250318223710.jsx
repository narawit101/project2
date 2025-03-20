"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function CheckFieldDetail() {
  const { fieldId } = useParams(); // ✅ ดึงค่า field_id จาก URL
  const [fieldData, setFieldData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!fieldId) return;

    fetch(`http://localhost:5000/field/${fieldId}`) // ✅ เรียก API ดึงข้อมูลสนาม
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert("ไม่พบข้อมูลสนามกีฬา");
          router.push("/checkField"); // ❌ ถ้าไม่เจอให้กลับไปหน้าหลัก
        } else {
          setFieldData(data);
        }
      })
      .catch((error) => console.error("❌ Error fetching field data:", error));
  }, [fieldId]);

  if (!fieldData) return <p>กำลังโหลดข้อมูลสนามกีฬา...</p>;

  return (
    <div>
      <h1>รายละเอียดสนามกีฬา</h1>
      <p><strong>ชื่อสนาม:</strong> {fieldData.field_name}</p>
      <p><strong>ที่อยู่:</strong> {fieldData.address}</p>
      <p><strong>เวลาทำการ:</strong> {fieldData.open_hours} - {fieldData.close_hours}</p>
      <p><strong>เจ้าของ:</strong> {fieldData.first_name} {fieldData.last_name}</p>
      <p><strong>สถานะ:</strong> {fieldData.status}</p>

      {/* ปุ่มกลับไปหน้ารายการ */}
      <button onClick={() => router.push("/checkField")}>กลับไปหน้ารายการ</button>
    </div>
  );
}