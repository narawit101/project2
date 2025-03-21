"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
   const [sports, setSports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล


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

    if (user.role !== "admin") {
      router.push("/");
    }

    setIsLoading(false);
  }, []);

    //  โหลดประเภทกีฬา
    useEffect(() => {
      fetch(`${API_URL}/sports_types`)
        .then((res) => res.json())
        .then((data) => setSports(data))
        .catch((error) => console.error("Error fetching sports:", error));
    }, []);

 
  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <>
      <div className="navbar">
        <Navbar></Navbar>
      </div>
      {/* สิ่งอำนวยความสะดวก */}
      <div className="input-group">
        <label>สิ่งอำนวยความสะดวก</label>
      </div>

      <div className="container">
        {/* Display List of Facilities */}
        <div className="factcon">
          {facilities.map((fac) => (
            <div key={fac.fac_id} className="facility-item">
              <div className="input-group-checkbox">
                <label>{fac.fac_name}</label>
              </div>

              {/* ปุ่มแก้ไข */}
              <button
                className="editbtn"
                type="button"
                onClick={() => {
                  setEditingFacility(fac);
                  setNewFacilityName(fac.fac_name);
                }}
              >
                แก้ไข
              </button>

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

        {/* ฟอร์มสำหรับแก้ไขสิ่งอำนวยความสะดวก */}
        {editingFacility && (
          <div className="edit-form">
            <input
              type="text"
              placeholder="ชื่อสิ่งอำนวยความสะดวก"
              value={newFacilityName}
              onChange={(e) => setNewFacilityName(e.target.value)}
            />
            <div className="form-actions">
              <button className="savebtn" onClick={editFacility}>
                บันทึก
              </button>
              <button
                className="cancelbtn"
                onClick={() => {
                  setEditingFacility(null);
                  setNewFacilityName(""); // รีเซ็ตการแก้ไข
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* โมดอลคอนเฟิร์มสำหรับการลบ */}
        {showConfirmModal && (
          <div className="confirm-modal">
            <div className="modal-content">
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้?</p>
              <div className="modal-actions">
                <button className="confirmbtn" onClick={deleteFacility}>
                  ยืนยัน
                </button>
                <button
                  className="cancelbtn"
                  onClick={() => setShowConfirmModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ฟอร์มสำหรับเพิ่มสิ่งอำนวยความสะดวกใหม่ */}
        <div className="addfaccon">
          {!showNewFacilityInput ? (
            <button
              className="addfac"
              type="button"
              onClick={() => setShowNewFacilityInput(true)}
            >
              + เพิ่มสิ่งอำนวยความสะดวกใหม่
            </button>
          ) : (
            <div className="add-facility-form">
              <input
                type="text"
                placeholder="ชื่อสิ่งอำนวยความสะดวก"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
              />
              <div className="form-actions">
                <button
                  className="savebtn"
                  type="button"
                  onClick={addNewFacility}
                >
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
            </div>
          )}
        </div>

        {/* ข้อความแสดงผล */}
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}
      </div>
    </>
  );
}
