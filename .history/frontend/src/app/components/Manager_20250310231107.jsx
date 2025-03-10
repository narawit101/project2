"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import "../css/Manager.css";

export default function AdminManager() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  useEffect(() => {
    // ✅ โหลดข้อมูล currentUser
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      
      // ❌ ถ้าไม่ใช่ Admin ให้ Redirect ออก
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
    // ✅ โหลดข้อมูล users เมื่อ currentUser พร้อมและเป็น Admin
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

  // ✅ อนุมัติให้ `customer` เป็น `field_owner`
  const approveFieldOwner = async (id) => {
    try {
      await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "field_owner" }),
      });
      setUsers(users.map((user) => (user.user_id === id ? { ...user, role: "field_owner" } : user)));
    } catch (error) {
      console.error("Error approving field owner:", error);
    }
  };

  return (
    <div className="admin-manager-container">
      <h2>📋 รายชื่อผู้ใช้งาน (Admin เท่านั้น)</h2>
{/* 🔹 ตารางสำหรับ Admin */}
<h3>ผู้ดูแลระบบ (Admin)</h3>
      <table>
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>อีเมล</th>
          </tr>
        </thead>
        <tbody>
          {users.filter((user) => user.role === "admin").map((user) => (
            <tr key={user.user_id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 🔹 ตารางสำหรับ Field Owner */}
      <h3>เจ้าของสนามกีฬา</h3>
      <table>
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>อีเมล</th>
            <th>จัดการสนามกีฬา</th>
          </tr>
        </thead>
        <tbody>
          {users.filter((user) => user.role === "field_owner").map((user) => (
            <tr key={user.user_id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>
                <button className="edit-btn">แก้ไข</button>
                <button className="delete-btn">ลบสนาม</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 🔹 ตารางสำหรับ Customer ที่สมัครมา */}
      <h3>รอตรวจสอบการลงทะเบียนสนาม</h3>
      <table>
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>อีเมล</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.filter((user) => user.role === "field_owner").map((user) => (
            <tr key={user.user_id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>รอตรวจสอบ</td>
              <td>
                <button className="approve-btn" onClick={() => approveFieldOwner(user.user_id)}>อนุมัติเป็นเจ้าของสนาม</button>
                <button className="delete-btn" onClick={() => handleDelete(user.user_id)}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      

      

      
    </div>
  );
}
