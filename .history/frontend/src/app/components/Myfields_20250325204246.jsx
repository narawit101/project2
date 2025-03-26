"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/myfield.css";

export default function MyFieldPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [myFields, setMyFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด"); // Default filter to show all

  useEffect(() => {
    const fetchMyFields = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/myfield/myfields`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลสนาม");
        }

        setMyFields(data);
        setFilteredFields(data); // Initially set the filtered fields to all fields
      } catch (err) {
        console.error("Error loading fields:", err.message);
        setError(err.message);
      }
    };

    fetchMyFields();
  }, []);

  // Filter fields based on the selected status
  useEffect(() => {
    if (statusFilter === "ทั้งหมด") {
      setFilteredFields(myFields); // Show all fields
    } else {
      setFilteredFields(
        myFields.filter((field) => field.status === statusFilter)
      );
    }
  }, [statusFilter, myFields]);

  return (
    <div className="container">
      <div className="section-title-container">
        <h2 className="section-title">สนามของฉัน</h2>      
          <select
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
            className="sport-select"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="ผ่านการอนุมัติ">ผ่านการอนุมัติ</option>
            <option value="รอตรวจสอบ">รอตรวจสอบ</option>
            <option value="ไม่ผ่านการอนุมัติ">ไม่ผ่าน</option>
          </select>
      </div>
      <div className="grid">
        {filteredFields.length > 0 ? ( 
            filteredFields.map((field) => (
              <div key={field.field_id} className="card">
                <img
                  src={
                    field.img_field
                      ? `${API_URL}/${field.img_field}`
                      : "https://via.placeholder.com/300x200"
                  }
                  alt={field.field_name}
                  className="card-img"
                />
                <h3 className="custom-field-name">{field.field_name}</h3>
                <p className="custom-owner-info">
                  เจ้าของ: {field.first_name} {field.last_name}
                </p>
                <div className="custom-button-group">
                  <button
                    onClick={() =>
                      router.push(`/checkfieldDetail/${field.field_id}`)
                    }
                    className="custom-button-view"
                  >
                    ดูรายละเอียด
                  </button>
                  <button
                    onClick={() => router.push(`/editField/${field.field_id}`)}
                    className="custom-button-edit"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            ))
        ) : (
          <p className="custom-no-fields-message">
            ไม่มีสนามที่ตรงกับสถานะที่เลือก
          </p>
        )}
      </div>
    </div>
  );
}
