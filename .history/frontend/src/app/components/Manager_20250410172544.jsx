"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/manager.css";

export default function AdminManager() {
  const [pendingFields, setPendingFields] = useState([]);
  const [allowFields, setAllowFields] = useState([]);
  const [refuseFields, setRefuseFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [showDeleteFieldModal, setShowDeleteFieldModal] = useState(false); // สำหรับโมดอลลบสนามกีฬา
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false); // สำหรับโมดอลลบผู้ใช้
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null); // เก็บ ID ของสนามที่ต้องการลบ
  const [userIdToDelete, setUserIdToDelete] = useState(null); // เก็บ ID ของผู้ใช้ที่ต้องการลบ

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    if(user.status !== "ตรวจสอบแล้ว"){
      router.push("/verification")
    }

    if (user.role !== "admin") {
      router.push("/");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      const token = localStorage.getItem("token");

      fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("expiresAt");
            router.replace("/login");
            return;
          }
          return response.json();
        })
        .then((data) => setUsers(data))
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, [currentUser]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  //modue ลบ สนาม
  const DeleteFieldModal = ({ fieldId, onDelete, onClose }) => (
    <div className="confirm-modal-field">
      <div className="modal-content-field">
        <p>คุณแน่ใจหรือไม่ว่าต้องการลบสนามกีฬานี้?</p>
        <div className="modal-actions-field">
          <button
            className="confirmbtn-field"
            onClick={() => onDelete(fieldId)}
          >
            ยืนยัน
          </button>
          <button className="cancelbtn-field" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  //โมดอล ลบผู้ใช้
  const DeleteUserModal = ({ userId, onDelete, onClose }) => (
    <div className="confirm-modal-user">
      <div className="modal-content-user">
        <p>คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?</p>
        <div className="modal-actions-user">
          <button className="confirmbtn-user" onClick={() => onDelete(userId)}>
            ยืนยัน
          </button>
          <button className="cancelbtn-user" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  // ฟังก์ชันเปิดโมดอลการลบสนามกีฬา
  const openDeleteFieldModal = (fieldId) => {
    setFieldIdToDelete(fieldId);
    setShowDeleteFieldModal(true); // เปิดโมดอล
  };

  // ฟังก์ชันเปิดโมดอลการลบผู้ใช้
  const openDeleteUserModal = (userId) => {
    setUserIdToDelete(userId);
    setShowDeleteUserModal(true); // เปิดโมดอล
  };

  // ฟังก์ชันปิดโมดอล
  const closeDeleteModal = () => {
    setShowDeleteFieldModal(false); // ปิดโมดอลลบสนามกีฬา
    setShowDeleteUserModal(false); // ปิดโมดอลลบผู้ใช้
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/field/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Data from API:", data);
        setPendingFields(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching pending fields:", error));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/field/allow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Data from API:", data);
        setAllowFields(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching allow fields:", error));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/field/refuse`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Data from API:", data);
        setRefuseFields(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching refuse fields:", error));
  }, []);

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  const isEmailDuplicate = (email) => {
    return users.some(
      (user) => user.email === email && user.user_id !== selectedUser?.user_id
    );
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("ลบผู้ใช้นี้ไม่ได้ ยังมีสนามที่ลงทะเบียนอยู่");
      }

      setUsers(users.filter((user) => user.user_id !== id));
      setMessage("ผู้ใช้ถูกลบเรียบร้อย");
      setMessageType("success");
    } catch (error) {
      // console.error("Error deleting user:", error);
      setMessage(`${error.message}`);
      setMessageType("error");
    } finally {
      closeDeleteModal(); // ปิดโมดอลหลังจากการลบเสร็จ
    }
  };

  const deleteField = async (fieldId) => {
    try {
      const response = await fetch(`${API_URL}/field/${fieldId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("สนามกีฬาถูกลบเรียบร้อย");
        setMessageType("success");
        setAllowFields(
          allowFields.filter((field) => field.field_id !== fieldId)
        );
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${data.error}`);
        setMessageType("error");
      }
    } catch (error) {
      // console.error("Error deleting field:", error);
      setMessage("เกิดข้อผิดพลาดในการลบสนามกีฬา");
      setMessageType("error");
    } finally {
      closeDeleteModal(); // ปิดโมดอลหลังจากการดำเนินการเสร็จ
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (isEmailDuplicate(selectedUser.email)) {
      setEmailError("อีเมลนี้มีการใช้งานแล้ว");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedUser),
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถแก้ไขได้");
      }

      setUsers(
        users.map((user) =>
          user.user_id === selectedUser.user_id ? selectedUser : user
        )
      );
      setMessage("แก้ไขเรียบร้อย");
      setMessageType("success");
      setSelectedUser(null);
      setEmailError("");
    } catch (error) {
      // console.error("Error updating user:", error);
      setMessage(`${error.message}`);
      setMessageType("error");
    }
  };

  const handleViewDetails = (fieldId) => {
    router.push(`/checkField/${fieldId}`);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setEmailError("");
  };

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="admin-manager-container">
        <h2>รายชื่อผู้ใช้งาน</h2>
        {/* 🔹 ตารางสำหรับแอดมิน */}
        <h3>ผู้ดูแลระบบ</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อีเมล</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "admin")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* 🔹 ตารางสำหรับลูกค้า */}
        <h3>ลูกค้า</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>อีเมล</th>
              <th>สถานะ</th>
              <th>แก้ไขข้อมูล</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "customer")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.user_status}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedUser(user)}
                    >
                      แก้ไข
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => openDeleteUserModal(user.user_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <h3>เจ้าของสนามกีฬา</h3>
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
            {users
              .filter((user) => user.role === "field_owner")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedUser(user)}
                    >
                      แก้ไข
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => openDeleteUserModal(user.user_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {/* 🔹 ตารางสำหรับสนามกีฬาที่รอตรวจสอบ */}
        <div className="apv">
          <h3>สนามที่อนุมัติแล้ว</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>ชื่อสนาม</th>
              <th>ชื่อเจ้าของสนาม</th>
              <th>จัดการสนามกีฬา</th>
            </tr>
          </thead>
          <tbody>
            {allowFields.length > 0 ? (
              allowFields.map((field) => (
                <tr key={field.field_id}>
                  <td>{field.field_name}</td>
                  <td>
                    {field.first_name}-{field.last_name}
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        router.push(`/checkField/${field.field_id}`)
                      }
                      className="ProveEdit-btn"
                    >
                      ตรวจสอบสนาม
                    </button>
                    <button
                      className="ProveDelete-btn"
                      onClick={() => openDeleteFieldModal(field.field_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  ไม่มีสนามกีฬาที่ผ่านการอนุมัติ
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="rej">
          <h3>สนามที่ไม่อนุมัติ</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>ชื่อสนาม</th>
              <th>ชื่อเจ้าของสนาม</th>
              <th>จัดการสนามกีฬา</th>
            </tr>
          </thead>
          <tbody>
            {refuseFields.length > 0 ? (
              refuseFields.map((field) => (
                <tr key={field.field_id}>
                  <td>{field.field_name}</td>
                  <td>
                    {field.first_name}-{field.last_name}
                  </td>
                  <td>
                    {/* ✅ กดปุ่มแล้วไปหน้าตรวจสอบ */}
                    <button
                      onClick={() =>
                        router.push(`/checkField/${field.field_id}`)
                      }
                      className="ProveEdit-btn"
                    >
                      ตรวจสอบสนาม
                    </button>
                    <button
                      className="ProveDelete-btn"
                      onClick={() => openDeleteFieldModal(field.field_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  ไม่มีสนามกีฬาที่ไม่ผ่านการอนุมัติ
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* 🔹 ตารางสำหรับสนามกีฬาที่รอตรวจสอบ */}
        <div className="pen">
          <h3>สนามกีฬาที่รอตรวจสอบ</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>ชื่อสนาม</th>
              <th>ชื่อเจ้าของสนาม</th>
              <th>จัดการสนามกีฬา</th>
            </tr>
          </thead>
          <tbody>
            {pendingFields.length > 0 ? (
              pendingFields.map((field) => (
                <tr key={field.field_id}>
                  <td>{field.field_name}</td>
                  <td>
                    {" "}
                    {field.first_name}-{field.last_name}
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        router.push(`/checkField/${field.field_id}`)
                      }
                      className="ProveEdit-btn"
                    >
                      ตรวจสอบสนาม
                    </button>
                    <button
                      className="ProveDelete-btn"
                      onClick={() => openDeleteFieldModal(field.field_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  ไม่มีสนามกีฬาที่รอการอนุมัติ
                </td>
              </tr>
            )}
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
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      first_name: e.target.value,
                    })
                  }
                />
                <label>นามสกุล:</label>
                <input
                  type="text"
                  value={selectedUser.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value,
                    })
                  }
                />
                <label>อีเมล:</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
                {emailError && <p style={{ color: "red" }}>{emailError}</p>}{" "}
                {/* แสดงข้อความ error */}
                <div className="modal-buttons">
                  <button type="submit" className="save-btn">
                    บันทึก
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeModal}
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* โมดอลยืนยันการลบสนาม */}
        {showDeleteFieldModal && (
          <DeleteFieldModal
            fieldId={fieldIdToDelete}
            onDelete={deleteField} // ฟังก์ชันลบสนาม
            onClose={closeDeleteModal} // ฟังก์ชันปิดโมดอล
          />
        )}

        {/* โมดอลยืนยันการลบผู้ใช้ */}
        {showDeleteUserModal && (
          <DeleteUserModal
            userId={userIdToDelete}
            onDelete={handleDelete} // ฟังก์ชันลบผู้ใช้
            onClose={closeDeleteModal} // ฟังก์ชันปิดโมดอล
          />
        )}
      </div>
    </>
  );
}
