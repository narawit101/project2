"use client";
import React, { useState, useEffect } from "react";

export default function RegisterFieldForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)

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
const deleteFacility = async (id) => {
    const isConfirmed = window.confirm("คุณต้องการลบสิ่งอำนวยความสะดวกนี้หรือไม่?");
  
    if (!isConfirmed) return; // ถ้าไม่ยืนยันจะไม่ทำการลบ
  
    const res = await fetch(`${API_URL}/facilities/delete/${id}`, {
      method: "DELETE",
    });
  
    const data = await res.json();
  
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }
  
    setFacilities(facilities.filter(fac => fac.fac_id !== id)); // ลบสิ่งอำนวยความสะดวกจาก state
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

            {/* ลบปุ่มสำหรับลบสิ่งอำนวยความสะดวก */}
            <button
              className="deletebtn"
              type="button"
              onClick={() => deleteFacility(fac.fac_id)}
            >
              ลบ
            </button>
          </div>
        ))}
      </div>

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
