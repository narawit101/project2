"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
            "Authorization": `Bearer ${token}`,
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
        console.error("❌ Error loading fields:", err.message);
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
        myFields.filter(field => field.status === statusFilter)
      );
    }
  }, [statusFilter, myFields]);

  return (
    <div className="bg-blue-100 min-h-screen py-8 px-6">
      <h2 className="text-3xl font-bold text-left text-blue-900 mb-6">🏟️ สนามของฉัน</h2>

      {/* Filter options */}
      <div className="mb-6">
        <select
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
          className="p-2 border rounded"
        >
          <option value="ทั้งหมด">ทั้งหมด</option>
          <option value="ผ่านการอนุมัติ">ผ่านการอนุมัติ</option>
          <option value="รอตรวจสอบ">รอตรวจสอบ</option>
          <option value="ไม่ผ่านการอนุมัติ">ไม่ผ่าน</option>
        </select>
      </div>

      <div className="max-w-6xl mx-auto">
        {filteredFields.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredFields.map((field) => (
              <div key={field.field_id} className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center">
                {/* รูปสนาม */}
                <img
                  src={
                    field.img_field
                      ? `${API_URL}/${field.img_field}`
                      : "https://via.placeholder.com/300x200"
                  }
                  alt={field.field_name}
                  className="w-full h-40 object-cover rounded-lg"
                />
                {/* ชื่อสนาม */}
                <h3 className="text-xl font-bold text-center mt-4 text-blue-900">{field.field_name}</h3>
                <p className="text-center text-gray-600">🏠 เจ้าของ: {field.first_name} {field.last_name}</p>
                {/* ปุ่ม */}
                <div className="flex justify-between w-full mt-4 space-x-2">
                  <button
                    onClick={() => router.push(`/checkfieldDetail/${field.field_id}`)}
                    className="bg-blue-700 hover:bg-blue-900 text-white px-4 py-2 rounded w-full"
                  >
                    🔍 ดูรายละเอียด
                  </button>
                  <button
                    onClick={() => router.push(`/editField/${field.field_id}`)}
                    className="bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded w-full"
                  >
                    ✏️ แก้ไข
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-red-500 text-lg">❌ ไม่มีสนามที่ตรงกับสถานะที่เลือก</p>
        )}
      </div>
    </div>
  );
}
