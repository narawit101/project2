"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/myfield.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function MyFieldPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [myFields, setMyFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null);
  const { user, isLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fieldPerPage = 1;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }

    if (user?.role !== "admin" && user?.role !== "field_owner") {
      router.replace("/");
    }
  }, [user, isLoading, , router]);

  useEffect(() => {
    const fetchMyFields = async () => {
      try {
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        const res = await fetch(`${API_URL}/myfield/myfields`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลสนาม");
        }

        setMyFields(data);
        setFilteredFields(data);
      } catch (err) {
        console.error("Error loading fields:", err.message);
        setError(err.message);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", err.message);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchMyFields();
  }, []);

  const indexOfLast = currentPage * fieldPerPage;
  const indexOfFirst = indexOfLast - fieldPerPage;
  const currentField = myFields.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    try {
      if (statusFilter === "ทั้งหมด") {
        setFilteredFields(myFields);
      } else {
        setFilteredFields(
          myFields.filter((field) => field.status === statusFilter)
        );
      }
    } catch (error) {
      console.error("Error filtering fields:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
      setFilteredFields([]);
    } finally {
      setDataLoading(false);
    }
  }, [statusFilter, myFields]);

  const handleDeleteField = (field_id) => {
    setFieldIdToDelete(field_id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    try {
      SetstartProcessLoad(true);
      const res = await fetch(
        `${API_URL}/field/delete/field/${fieldIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete field");
      }

      setMyFields(
        myFields.filter((field) => field.field_id !== fieldIdToDelete)
      );
      setFilteredFields(
        filteredFields.filter((field) => field.field_id !== fieldIdToDelete)
      );
      setShowDeleteModal(false);
      setMessage("ลบสนามเรียบร้อย");
      setMessageType("success");
    } catch (error) {
      console.error("Error deleting field:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myfield-container">
        <div className="field-section-title-container">
          {user?.role === "admin" ? (
            <h2 className="field-section-title">สนามทั้งหมด</h2>
          ) : (
            <h2 className="field-section-title">สนามของฉัน</h2>
          )}
          <select
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
            className="sport-select-myfield"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="ผ่านการอนุมัติ">ผ่านการอนุมัติ</option>
            <option value="รอตรวจสอบ">รอตรวจสอบ</option>
            <option value="ไม่ผ่านการอนุมัติ">ไม่ผ่าน</option>
          </select>
        </div>
        {dataLoading ? (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        ) : currentField.length > 0 ? (
          <div className="grid-myfield">
            {currentField.map((field) => (
              <div key={field.field_id} className="card-myfield">
                <img
                  onClick={() => router.push(`/profile/${field.field_id}`)}
                  src={
                    field.img_field
                      ? `${API_URL}/${field.img_field}`
                      : "https://via.placeholder.com/300x200"
                  }
                  alt={field.field_name}
                  className="card-myfield-img"
                />
                <h3 className="custom-field-name">{field.field_name}</h3>
                <div className="custom-owner-info-myfield">
                  เจ้าของ: {field.first_name} {field.last_name}
                </div>
                <div
                  className={`custom-owner-info-myfield ${
                    field.status === "ผ่านการอนุมัติ"
                      ? "passed"
                      : field.status === "ไม่ผ่านการอนุมัติ"
                      ? "failed"
                      : "pending"
                  }`}
                >
                  {field.status}
                </div>
                <div className="custom-button-group-myfield">
                  <button
                    onClick={() => router.push(`/checkField/${field.field_id}`)}
                    className="custom-button-view-myfield"
                  >
                    ดูรายละเอียด
                  </button>
                  {field.status !== "รอตรวจสอบ" && (
                    <button
                      onClick={() =>
                        router.push(`/editField/${field.field_id}`)
                      }
                      className="custom-button-edit-myfield"
                    >
                      แก้ไข
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteField(field.field_id)}
                    className="custom-button-delete-myfield"
                  >
                    ลบ
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/myOrder/${field.field_id}`)}
                  className="custom-button-view-order-myfield"
                >
                  รายการจองของสนาม
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="custom-no-fields-message">
            ไม่มีสนามที่ตรงกับสถานะที่เลือก
          </p>
        )}
        <div className="pagination-previwe-field-home">
          {Array.from(
            { length: Math.ceil(myFields.length / fieldPerPage) },
            (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            )
          )}
        </div>

        {showDeleteModal && (
          <div className="modal-overlay-myfield">
            <div className="modal-myfield">
              <h3>ยืนยันการลบสนาม</h3>
              <p>คุณต้องการลบสนามหรือไม่</p>
              <div className="modal-actions-myfield">
                <button
                  className="savebtn-myfield"
                  onClick={confirmDeleteSubField}
                >
                  ยืนยัน
                </button>
                <button
                  className="canbtn-myfield"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
              {startProcessLoad && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
