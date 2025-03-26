"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyFieldPage() {
  const router = useRouter();
  const [myFields, setMyFields] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyFields = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/field/myfields`, {
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
      } catch (err) {
        console.error("❌ Error loading fields:", err.message);
        setError(err.message);
      }
    };

    fetchMyFields();
  }, []);

  return (
    <div className="bg-blue-100 min-h-screen py-8 px-6">
      {/* ✅ ย้าย "สนามของฉัน" ไปชิดซ้าย */}
      <h2 className="text-3xl font-bold text-left text-blue-900 mb-6">🏟️ สนามของฉัน</h2>

      <div className="max-w-6xl mx-auto">
        {myFields.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {myFields.map((field) => (
              <div key={field.field_id} className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center">
                {/* ✅ รูปสนาม */}
                <img
                  src={field.img_field || "/default-image.jpg"}
                  alt={field.field_name}
                  className="w-full h-40 object-cover rounded-lg"
                />

                {/* ✅ ชื่อสนาม (อยู่ตรงกลาง) */}
                <h3 className="text-xl font-bold text-center mt-4 text-blue-900">{field.field_name}</h3>
                <p className="text-center text-gray-600">🏠 เจ้าของ: {field.first_name} {field.last_name}</p>

                {/* ✅ ปุ่ม */}
                <div className="flex justify-between w-full mt-4 space-x-2">
                  <button
                    onClick={() => router.push(`/checkFieldDetail/${field.field_id}`)}
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
          <p className="text-center text-red-500 text-lg">❌ ไม่มีสนามที่ผ่านการอนุมัติ</p>
        )}
      </div>
    </div>
  );
}