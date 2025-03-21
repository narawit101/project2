"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css"

export default function RegisterFieldForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล
  const [facilityToDelete, setFacilityToDelete] = useState(null); // เก็บข้อมูลสิ่งอำนวยความสะดวกที่จะลบ
  
  //  โหลดสิ่งอำนวยความสะดวก
  useEffect(() => {
    fetch(`${API_URL}/facilities`)
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

  //  ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;

    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fac_name: newFacility }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    setFacilities([...facilities, data]);
    setNewFacility("");
    setShowNewFacilityInput(false);
  };
  // ฟังก์ชันลบสิ่งอำนวยความสะดวก
  // ฟังก์ชันลบสิ่งอำนวยความสะดวก
// ฟังก์ชันที่แสดงโมดอลคอนเฟิร์ม
const confirmDeleteFacility = (id) => {
    setFacilityToDelete(id); // เก็บข้อมูลสิ่งอำนวยความสะดวกที่จะลบ
    setShowConfirmModal(true); // แสดงโมดอล
  };
  
  // ฟังก์ชันลบสิ่งอำนวยความสะดวกจริงๆ
  const deleteFacility = async () => {
    if (!facilityToDelete) return;
  
    const res = await fetch(`${API_URL}/facilities/delete/${facilityToDelete}`, {
      method: "DELETE",
    });
  
    const data = await res.json();
  
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }
  
    setFacilities(facilities.filter(fac => fac.fac_id !== facilityToDelete)); // ลบสิ่งอำนวยความสะดวกจาก state
    setShowConfirmModal(false); // ซ่อนโมดอล
  };
  
  

  return (
    <>
      <div className="input-group">
        <label>สิ่งอำนวยความสะดวก</label>
      </div>
      <div className="factcon">
  {facilities.map((fac) => (
    <div key={fac.fac_id} className="facility-item">
      <div className="input-group-checkbox">
        <label>{fac.fac_name}</label>
      </div>

      {/* ปุ่มลบ */}
      <button
        className="deletebtn"
        type="button"
        onClick={() => confirmDeleteFacility(fac.fac_id)}
      >
        ลบ
      </button>
    </div>
  ))}
</div>

{/* โมดอลคอนเฟิร์ม */}
{showConfirmModal && (
  <div className="confirm-modal">
    <div className="modal-content">
      <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้?</p>
      <button className="confirmbtn" onClick={deleteFacility}>ยืนยัน</button>
      <button className="cancelbtn" onClick={() => setShowConfirmModal(false)}>ยกเลิก</button>
    </div>
  </div>
)}


      {!showNewFacilityInput ? (
        <button
          className="addfac"
          type="button"
          onClick={() => setShowNewFacilityInput(true)}
        >
          + เพิ่มสิ่งอำนวยความสะดวกใหม่
        </button>
      ) : (
        <div>
          <input
            type="text"
            placeholder="ชื่อสิ่งอำนวยความสะดวก"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
          />
          <button className="savebtn" type="button" onClick={addNewFacility}>
            บันทึก
          </button>
          <button
            className="canbtn"
            type="button"
            onClick={() => setShowNewFacilityInput(false)}
          >
            ยกเลิก
          </button>
        </div>
      )}
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
    </>
  );
}
