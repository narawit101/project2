"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/manager.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { data } from "autoprefixer";

export default function AdminManager() {
  const [allowFields, setAllowFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailError, setEmailError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [showDeleteFieldModal, setShowDeleteFieldModal] = useState(false); // สำหรับโมดอลลบสนามกีฬา
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false); // สำหรับโมดอลลบผู้ใช้
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null); // เก็บ ID ของสนามที่ต้องการลบ
  const [userIdToDelete, setUserIdToDelete] = useState(null); // เก็บ ID ของผู้ใช้ที่ต้องการลบ
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }

    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setDataLoading(true);
    const fetchUsers = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (user?.role !== "admin") return;
      setDataLoading(true);
      try {
        const response = await fetch(`${API_URL}/users`, {
          credentials: "include",
        });

        if (response.status === 401) {
          setTimeout(() => {
            router.replace("/");
          }, 2000);
          return;
        }

        if (!response.ok) {
          throw new Error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้", error);
        setMessage(error.message || "เกิดข้อผิดพลาด");
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

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
        <p className="comfirm-message">คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?</p>
        <div className="modal-actions-user">
          <button className="confirmbtn-user" onClick={() => onDelete(userId)}>
            ยืนยัน
          </button>
          <button className="cancelbtn-user" onClick={onClose}>
            ยกเลิก
          </button>
          {startProcessLoad && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
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

  const isEmailDuplicate = (email) => {
    return users.some(
      (user) => user.email === email && user.user_id !== selectedUser?.user_id
    );
  };

  const handleDelete = async (id) => {
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
      SetstartProcessLoad(false);
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

    if (isEmailDuplicate(selectedUser.email)) {
      setEmailError("อีเมลนี้มีการใช้งานแล้ว");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const response = await fetch(`${API_URL}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
      setMessage(`${error.message}`);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleViewDetails = (fieldId) => {
    router.push(`/checkField/${fieldId}`);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setEmailError("");
  };

  // if (isLoading)
  //   return (
  //     <div className="load">
  //       <span className="spinner"></span>
  //     </div>
  //   );

  return (
    <>
      <div className="admin-manager-container">
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        <h2 className="Title">รายชื่อผู้ใช้งาน</h2>
        <h3 className="Head">ผู้ดูแลระบบ</h3>
        {dataLoading && (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        )}
        <table className="manager-table">
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

        {/* ตารางสำหรับลูกค้า */}
        <h3 className="Head">ผู้ใช้ทั้งหมด</h3>
        <table className="manager-table-user">
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>อีเมล</th>
              <th>สถานะบัญชี</th>
              <th>บทบาท</th>
              <th>แก้ไขข้อมูล</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(
                (user) =>
                  user.role === "customer" || user.role === "field_owner"
              )
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                  <td>
                    {user.role === "customer"
                      ? "ลูกค้า"
                      : user.role === "field_owner"
                      ? "เจ้าของสนาม"
                      : user.role}
                  </td>
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
        {selectedUser && (
          <div className="modal-manager">
            <div className="modal-content-manager">
              <h3 className="Head">แก้ไขข้อมูลลูกค้า</h3>
              <form onSubmit={handleUpdateUser}>
                <label>ชื่อ:</label>
                <input
                  type="text"
                  maxLength={100}
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
                  maxLength={100}
                  value={selectedUser.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value,
                    })
                  }
                />
                {/* <label>อีเมล:</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
                {emailError && <p style={{ color: "red" }}>{emailError}</p>}{" "}
                แสดงข้อความ error */}
                <div className="modal-buttons">
                  <button type="submit" className="save-btn-manager">
                    บันทึก
                  </button>
                  <button
                    type="button"
                    className="cancel-btn-manager"
                    onClick={closeModal}
                  >
                    ยกเลิก
                  </button>
                </div>
                {startProcessLoad && (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                  </div>
                )}
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
