"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/manager.css";

export default function AdminManager() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); // สำหรับเปิด Modal
  const [emailError, setEmailError] = useState(""); // สำหรับแสดงข้อความ error
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      if (user.role !== "admin") {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
        router.push("/");
      }
    } else {
      alert("กรุณาเข้าสู่ระบบก่อน!");
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetch(`${API_URL}/users`)
        .then((response) => response.json())
        .then((data) => setUsers(data))
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, [currentUser]);

  // ✅ ฟังก์ชันตรวจสอบอีเมลซ้ำ
  const isEmailDuplicate = (email) => {
    return users.some((user) => user.email === email && user.user_id !== selectedUser?.user_id);
  };

  // ✅ ฟังก์ชันอัปเดตข้อมูลลูกค้า
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    // เช็คว่าอีเมลซ้ำหรือไม่
    if (isEmailDuplicate(selectedUser.email)) {
      setEmailError("อีเมลนี้มีการใช้งานแล้ว");
      return;
    }

    try {
      await fetch(`${API_URL}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedUser),
      });
      setUsers(users.map((user) => (user.user_id === selectedUser.user_id ? selectedUser : user)));
      setSelectedUser(null);
      setEmailError(""); // รีเซ็ตข้อความ error
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="admin-manager-container">
      <h2>รายชื่อผู้ใช้งาน</h2>

      {/* 🔹 ตารางสำหรับลูกค้า */}
      <h3>ลูกค้า</h3>
      <table>
        <thead>
          <tr>
            <th>ชื่อ-สกุล</th>
            <th>อีเมล</th>
            <th>แก้ไขข้อมูล</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.filter((user) => user.role === "customer").map((user) => (
            <tr key={user.user_id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>
                <button className="edit-btn" onClick={() => setSelectedUser(user)}>แก้ไข</button>
              </td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(user.user_id)}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 📝 Modal สำหรับแก้ไขข้อมูล */}
      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h3>แก้ไขข้อมูลลูกค้า</h3>
            <form onSubmit={handleUpdateUser}>
              <label>ชื่อ:</label>
              <input
                type="text"
                value={selectedUser.first_name}
                onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
              />

              <label>นามสกุล:</label>
              <input
                type="text"
                value={selectedUser.last_name}
                onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
              />

              <label>อีเมล:</label>
              <input
                type="email"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              />
              {emailError && <p style={{ color: 'red' }}>{emailError}</p>} {/* แสดงข้อความ error */}

              <div className="modal-buttons">
                <button type="submit" className="save-btn">บันทึก</button>
                <button type="button" className="cancel-btn" onClick={() => setSelectedUser(null)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
