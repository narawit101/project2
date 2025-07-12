"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/manager-user.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  usePreventLeave(startProcessLoad);

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
    const token = localStorage.getItem("auth_mobile_token");

    setDataLoading(true);
    const fetchUsers = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (user?.role !== "admin") return;
      setDataLoading(true);
      try {
        const response = await fetch(`${API_URL}/users`, {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
          <button
            className="confirmbtn-user"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            onClick={() => onDelete(userId)}
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">●</span>
              </span>
            ) : (
              "บันทึก"
            )}
          </button>
          <button
            className="cancelbtn-user"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            onClick={onClose}
          >
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

  const isEmailDuplicate = (email) => {
    return users.some(
      (user) => user.email === email && user.user_id !== selectedUser?.user_id
    );
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("auth_mobile_token");

    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    const token = localStorage.getItem("auth_mobile_token");

    e.preventDefault();

    // if (isEmailDuplicate(selectedUser.email)) {
    //   setEmailError("อีเมลนี้มีการใช้งานแล้ว");
    //   return;
    // }
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const response = await fetch(`${API_URL}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    router.push(`/check-field/${fieldId}`);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setEmailError("");
  };

  const usersPerPage = 20;

  const filteredUsers = users.filter((user) => {
    if (roleFilter === "all")
      return user.role === "customer" || user.role === "field_owner";
    return user.role === roleFilter;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const getPaginationRange = (current, total) => {
    const delta = 2; // จำนวนหน้าที่แสดงก่อน/หลังหน้าปัจจุบัน
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  // if (isLoading)
  //   return (
  //     <div className="load">
  //       <span className="spinner"></span>
  //     </div>
  //   );

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="admin-manager-container">
        <h3 className="Head">ผู้ดูแลระบบ</h3>
        {dataLoading && (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        )}
        <div className="table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th>id</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สถานะบัญชี</th>
                <th>บทบาท</th>
                <th>แก้ไข</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => user.role === "admin")
                .map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>
                      {user.first_name} - {user.last_name}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`status-text-manager ${
                          user.status === "รอยืนยัน"
                            ? "pending"
                            : user.status === "ตรวจสอบแล้ว"
                            ? "approved"
                            : "unknown"
                        }`}
                      >
                        {user.status || "ไม่ทราบสถานะ"}
                      </span>
                    </td>

                    <td>
                      {user.role === "customer"
                        ? "ลูกค้า"
                        : user.role === "field_owner"
                        ? "เจ้าของสนาม"
                        : user.role === "admin"
                        ? "ผู้ดูแลระบบ"
                        : user.role}
                    </td>
                    <td>
                      {" "}
                      <button
                        className="edit-btn"
                        onClick={() => setSelectedUser(user)}
                      >
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAANlJREFUSEu1ldENgzAMBd+brO0kLZu0k5ROUtiETVxZIlVIILKT4B8kBHdxbNnEycGT+WgSiMgTwAXAAuBFUp+bqBaIyBfANaIp/ENSpf+oEuzAA1AlA8kpvHALCvDAHEkOVQIDXLl1AiNcBXpFoysDB3wieXMVuQWuomKRW+FFQQ/4oaAXfFcgIg8Ab8OMygq6909WAxFRuEpKYYIfZZDOmFRkhtcIXHCvwA0vFfke3cu8zpds1hsaoW3huAVri8antzDSb+Z46WzatJNAt5pvmtak4RrXLYIfx95jGZW5DL4AAAAASUVORK5CYII=" alt="" />
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteUserModal(user.user_id)}
                      >
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg==" alt="" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* ตารางสำหรับลูกค้า */}
        <div className="head-select-manager">
          <h3 className="Head">ผู้ใช้ทั้งหมด</h3>
          <div className="filter-role-container">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="customer">ลูกค้า</option>
              <option value="field_owner">เจ้าของสนาม</option>
            </select>
          </div>
        </div>

        {dataLoading && (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        )}
        <div className="table-wrapper">
          <table className="manager-table-user">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อ-สกุล</th>
                <th>อีเมล</th>
                <th>สถานะบัญชี</th>
                <th>บทบาท</th>
                <th>แก้ไข</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`status-text-manager ${
                        user.status === "รอยืนยัน"
                          ? "pending"
                          : user.status === "ตรวจสอบแล้ว"
                          ? "approved"
                          : "unknown"
                      }`}
                    >
                      {user.status || "ไม่ทราบสถานะ"}
                    </span>
                  </td>
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
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAANlJREFUSEu1ldENgzAMBd+brO0kLZu0k5ROUtiETVxZIlVIILKT4B8kBHdxbNnEycGT+WgSiMgTwAXAAuBFUp+bqBaIyBfANaIp/ENSpf+oEuzAA1AlA8kpvHALCvDAHEkOVQIDXLl1AiNcBXpFoysDB3wieXMVuQWuomKRW+FFQQ/4oaAXfFcgIg8Ab8OMygq6909WAxFRuEpKYYIfZZDOmFRkhtcIXHCvwA0vFfke3cu8zpds1hsaoW3huAVri8antzDSb+Z46WzatJNAt5pvmtak4RrXLYIfx95jGZW5DL4AAAAASUVORK5CYII=" alt="" />
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => openDeleteUserModal(user.user_id)}
                    >
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg==" alt="" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > usersPerPage && (
          <div className="pagination-container-manager">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              «
            </button>

            {getPaginationRange(
              currentPage,
              Math.ceil(filteredUsers.length / usersPerPage)
            ).map((page, index) =>
              page === "..." ? (
                <span key={index} className="pagination-dots-manager">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? "active-page-manager" : ""}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < Math.ceil(filteredUsers.length / usersPerPage)
                    ? prev + 1
                    : prev
                )
              }
              disabled={
                currentPage >= Math.ceil(filteredUsers.length / usersPerPage)
              }
            >
              »
            </button>
          </div>
        )}
        {selectedUser && (
          <div className="modal-manager">
            <div className="modal-content-manager">
              <h3 className="Head">แก้ไขข้อมูลลูกค้า</h3>
              <form onSubmit={handleUpdateUser}>
                <label>ชื่อ:</label>
                <input
                  type="text"
                  maxLength={50}
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
                  maxLength={50}
                  value={selectedUser.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value,
                    })
                  }
                />
                <label>สถานะบัญชี:</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="รอยืนยัน">รอยืนยัน</option>
                  <option value="ตรวจสอบแล้ว">ตรวจสอบแล้ว</option>
                </select>
                <label>บทบาท:</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="customer">ลูกค้า</option>
                  <option value="field_owner">เจ้าของสนาม</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>

                <label>อีเมล:</label>
                <input
                  readOnly
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                  style={{ cursor: "not-allowed" }}
                />
                {/* {emailError && <p style={{ color: "red" }}>{emailError}</p>}{" "} */}
                <div className="modal-buttons">
                  <button
                    type="submit"
                    className="save-btn-manager"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn-manager"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
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
