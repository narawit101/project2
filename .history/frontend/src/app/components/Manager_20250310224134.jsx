"use client";
import React, { useEffect, useState } from "react";
import "../css/manager.css";

export default function Manager() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // ✅ โหลดข้อมูล currentUser
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    // ✅ โหลดข้อมูล users เมื่อ currentUser พร้อม
    if (currentUser?.role === "admin") {
      fetch(`${API_URL}/users`)
        .then((response) => response.json())
        .then((data) => setUsers(data))
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, [currentUser]);

  // ✅ ฟังก์ชันลบผู้ใช้
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?")) return;
    try {
      await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      setUsers(users.filter((user) => user.user_id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // ✅ ฟังก์ชันเปลี่ยนสถานะเจ้าของสนาม
  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers(users.map((user) => (user.user_id === id ? { ...user, status: newStatus } : user)));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="manager-container">
      <h2>📋 รายชื่อผู้ใช้งาน</h2>

      {/* 🛠 ส่วนของ Admin */}
      {currentUser?.role === "admin" && (
        <div className="admin-panel">
          <h3>👑 ผู้ดูแลระบบ (Admin)</h3>
          <table>
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สถานะ</th>
                <th>ดูข้อมูล</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => user.role !== "admin")
                .map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.role === "customer" ? "ลูกค้า" : "เจ้าของสนาม"}</td>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.role === "field_owner" ? (
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.user_id, e.target.value)}
                        >
                          <option value="pending">รอตรวจสอบ</option>
                          <option value="approved">ผ่านแล้ว</option>
                          <option value="rejected">ไม่ผ่าน</option>
                        </select>
                      ) : (
                        "ใช้งานได้"
                      )}
                    </td>
                    <td>
                      <button className="view-btn">ดูข้อมูลสนามกีฬา</button>
                    </td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(user.user_id)}>ลบ</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ⚽ ส่วนของ เจ้าของสนามกีฬา */}
      {currentUser?.role === "field_owner" && (
        <div className="owner-panel">
          <h3>🏟 เจ้าของสนามกีฬา</h3>
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สถานะสนาม</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => user.role === "field_owner" && user.user_id === currentUser.user_id)
                .map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.status}</td>
                    <td>
                      <button className="edit-btn">แก้ไขข้อมูลสนาม</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 👤 ส่วนของ ลูกค้า */}
      {currentUser?.role === "customer" && (
        <div className="customer-panel">
          <h3>👤 ลูกค้า</h3>
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{currentUser.first_name} {currentUser.last_name}</td>
                <td>{currentUser.email}</td>
                <td>
                  <button className="edit-btn">แก้ไขข้อมูลส่วนตัว</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
