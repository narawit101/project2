"use client";
import React, { useEffect, useState } from "react";
import "../css/manager.css"

export default function Manager() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // ดึงข้อมูลผู้ใช้ปัจจุบัน (จาก localStorage)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // ดึงรายชื่อผู้ใช้ทั้งหมด (Admin เท่านั้น)
    if (currentUser?.role === "admin") {
      fetch(`${API_URL}/users`)
        .then((response) => response.json())
        .then((data) => setUsers(data))
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?")) return;
    try {
      await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      setUsers(users.filter((user) => user.user_id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div>
      <h2>Manager Panel</h2>

      {/* ส่วนของ Admin */}
      {currentUser?.role === "admin" && (
        <div>
          <h3>รายชื่อผู้ใช้</h3>
          <ul>
            {users.map((user) => (
              <li key={user.user_id}>
                {user.user_name} - {user.email} ({user.role})
                <button onClick={() => handleDelete(user.user_id)}>ลบ</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ส่วนของ Owner */}
      {currentUser?.role === "field_owner" && (
        <div>
          <h3>การลงทะเบียนสนามกีฬา</h3>
          <button onClick={() => alert("ดูรายการลงทะเบียน")}>ตรวจสอบการลงทะเบียน</button>
        </div>
      )}

      {/* ส่วนของ User */}
      {currentUser?.role === "customer" && (
        <div>
          <h3>แก้ไขข้อมูลส่วนตัว</h3>
          <button onClick={() => alert("แก้ไขข้อมูล")}>แก้ไข</button>
        </div>
      )}
    </div>
  );
}
