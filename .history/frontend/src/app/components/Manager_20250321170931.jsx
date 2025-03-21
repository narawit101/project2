import React, { useState } from "react";

// โมดอลการยืนยันการลบ
const DeleteFieldModal = ({ fieldId, onDelete, onClose }) => (
  <div className="confirm-modal">
    <div className="modal-content">
      <p>คุณแน่ใจหรือไม่ว่าต้องการลบสนามกีฬานี้?</p>
      <div className="modal-actions">
        <button className="confirmbtn" onClick={() => onDelete(fieldId)}>
          ยืนยัน
        </button>
        <button className="cancelbtn" onClick={onClose}>
          ยกเลิก
        </button>
      </div>
    </div>
  </div>
);

export default function AdminManager() {
  const [showConfirmModal, setShowConfirmModal] = useState(false); // เปิดหรือปิดโมดอล
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null); // เก็บ ID ของสนามที่ต้องการลบ
  const [allowFields, setAllowFields] = useState([]);
  const [message, setMessage] = useState(""); // ข้อความแจ้งเตือน
  const [messageType, setMessageType] = useState(""); // ประเภทของข้อความ (success, error)

  // ฟังก์ชันลบสนามกีฬา
  const deleteField = async (fieldId) => {
    try {
      const response = await fetch(`${API_URL}/field/${fieldId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("สนามกีฬาถูกลบเรียบร้อย");
        setMessageType("success");
        setAllowFields(allowFields.filter((field) => field.field_id !== fieldId));
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${data.error}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดในการลบสนามกีฬา");
      setMessageType("error");
    } finally {
      setShowConfirmModal(false); // ปิดโมดอลหลังจากการดำเนินการเสร็จ
    }
  };

  // เปิดโมดอลการลบ
  const openConfirmModal = (fieldId) => {
    setFieldIdToDelete(fieldId);
    setShowConfirmModal(true); // เปิดโมดอล
  };

  // ปิดโมดอล
  const closeConfirmModal = () => {
    setShowConfirmModal(false); // ปิดโมดอล
  };

  return (
    <div className="admin-manager-container">
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}

      {/* แสดงตารางสนามที่อนุมัติแล้ว */}
      <h3>สนามที่อนุมัติแล้ว</h3>
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
                <td>{field.first_name}-{field.last_name}</td>
                <td>
                  <button
                    className="ProveDelete-btn"
                    onClick={() => openConfirmModal(field.field_id)} // เปิดโมดอล
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center" }}>
                ไม่มีสนามกีฬาที่ผ่านการอนุมัติ
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* โมดอลยืนยันการลบ */}
      {showConfirmModal && (
        <DeleteFieldModal
          fieldId={fieldIdToDelete}
          onDelete={deleteField} // ฟังก์ชันลบสนามกีฬา
          onClose={closeConfirmModal} // ฟังก์ชันปิดโมดอล
        />
      )}
    </div>
  );
}
