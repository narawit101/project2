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
  const [dataLoading, setDataLoading] = useState(true);

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
      setDataLoading(true);
      try {
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
      } finally {
        setDataLoading(false);
      }
    };

    fetchMyFields();
  }, []);

  useEffect(() => {
    if (statusFilter === "ทั้งหมด") {
      setFilteredFields(myFields);
    } else {
      setFilteredFields(
        myFields.filter((field) => field.status === statusFilter)
      );
    }
  }, [statusFilter, myFields]);

  const handleDeleteField = (field_id) => {
    setFieldIdToDelete(field_id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    try {
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
    } catch (error) {
      console.error("Error deleting field:", error);
    }
  };
  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
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
      <div className="grid-myfield">
        {filteredFields.length > 0 ? (
          filteredFields.map((field) => (
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
                    onClick={() => router.push(`/editField/${field.field_id}`)}
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
          ))
        ) : (
          <p className="custom-no-fields-message">
            ไม่มีสนามที่ตรงกับสถานะที่เลือก
          </p>
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
          </div>
        </div>
      )}
    </div>
  );
}
